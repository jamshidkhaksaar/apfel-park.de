import hashlib
import hmac
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, AsyncMock
import asyncio
from types import SimpleNamespace

import httpx
from telegram import Chat, Message, Update, User
from datetime import datetime, timezone

os.environ['BOT_TOKEN'] = '123456:synthetic-not-a-real-token'
os.environ['TELEGRAM_PRODUCT_HMAC_SECRET'] = 'synthetic-hmac-secret-for-testing-only-0000'
spec = importlib.util.spec_from_file_location('product_bot', Path(__file__).parents[1] / 'bot.py')
bot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bot)


class TransportTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        bot.DB = Path(self.temp.name) / 'callbacks.sqlite'

    def tearDown(self):
        self.temp.cleanup()

    def test_callbacks_are_short_private_and_survive_reopening(self):
        data = {'action': 'choose:' + 'long model ' * 12, 'sessionId': 'synthetic', 'revision': 7}
        token = bot.store_callback(123, data)
        self.assertLessEqual(len(token.encode()), 64)
        self.assertEqual(bot.load_callback(123, token), data)
        self.assertIsNone(bot.load_callback(456, token))
        with bot.connect() as con:
            con.execute('UPDATE callbacks SET expires=0')
        self.assertIsNone(bot.load_callback(123, token))
        self.assertEqual(bot.DB.stat().st_mode & 0o777, 0o600)

    def test_group_chat_is_rejected(self):
        user = User(123, 'Synthetic', False)
        update = Update(42, message=Message(1, datetime.now(timezone.utc), Chat(-100, 'group'), from_user=user, text='hello'))
        with self.assertRaisesRegex(ValueError, 'private_chat_required'):
            bot.identity(update)

    async def test_transport_signs_exact_body_without_sending_the_bot_token(self):
        captured = []
        def handle(request):
            captured.append(request)
            return httpx.Response(200, json={'text': 'Synthetic', 'buttons': [], 'revision': 1})
        original = httpx.AsyncClient
        def client(**kwargs):
            return original(**kwargs, transport=httpx.MockTransport(handle))
        with patch.object(bot.httpx, 'AsyncClient', client):
            await bot.invoke({'telegramId': '123', 'chatId': '123', 'action': 'status'})
        request = captured[0]
        self.assertEqual(str(request.url), 'http://127.0.0.1:3000/api/integrations/telegram-products')
        canonical = '\n'.join(['APFEL-PRODUCT-INTAKE-V1', bot.KEY_ID, request.headers['x-apfel-intake-timestamp'],
                               'POST', bot.PATH, request.headers['idempotency-key'], hashlib.sha256(request.content).hexdigest()])
        expected = hmac.new(bot.SECRET.encode(), canonical.encode(), hashlib.sha256).hexdigest()
        self.assertEqual(request.headers['x-apfel-intake-signature'], expected)
        self.assertNotIn(bot.BOT_TOKEN, str(request.headers) + request.content.decode())
        self.assertEqual(json.loads(request.content)['telegramId'], '123')

    async def test_sessionless_callback_omits_null_before_signing(self):
        original = httpx.AsyncClient
        captured = []
        def handle(request):
            captured.append(request)
            return httpx.Response(200, json={'revision': 1, 'buttons': []})
        def client(**kwargs):
            return original(**kwargs, transport=httpx.MockTransport(handle))
        with patch.object(bot.httpx, 'AsyncClient', client):
            await bot.invoke({'telegramId': '123', 'chatId': '123', 'action': 'new', 'sessionId': None, 'revision': 1})
        request = captured[0]
        self.assertNotIn('sessionId', json.loads(request.content))
        canonical = '\n'.join(['APFEL-PRODUCT-INTAKE-V1', bot.KEY_ID, request.headers['x-apfel-intake-timestamp'],
                               'POST', bot.PATH, request.headers['idempotency-key'], hashlib.sha256(request.content).hexdigest()])
        self.assertEqual(request.headers['x-apfel-intake-signature'], hmac.new(bot.SECRET.encode(), canonical.encode(), hashlib.sha256).hexdigest())

    async def test_progress_updates_one_message_and_delivers_completed_view(self):
        context = SimpleNamespace(bot=SimpleNamespace(send_chat_action=AsyncMock(), edit_message_text=AsyncMock()))
        pending={'text':'Researching official sources', 'revision':2, 'sessionId':'synthetic', 'pending':True}
        complete={'text':'Choose a version', 'revision':3, 'sessionId':'synthetic', 'pending':False}
        markup=bot.InlineKeyboardMarkup([])
        with patch.object(bot, 'invoke', AsyncMock(side_effect=[pending,complete])), patch.object(bot, 'show', AsyncMock()) as show, patch.object(bot.asyncio, 'sleep', AsyncMock()):
            await bot.watch(context,123,pending,99,markup)
        context.bot.send_chat_action.assert_awaited_once()
        self.assertEqual(context.bot.edit_message_text.await_args.kwargs['message_id'],99)
        self.assertIn('Researching official sources',context.bot.edit_message_text.await_args_list[0].kwargs['text'])
        self.assertIsNone(context.bot.edit_message_text.await_args.kwargs['reply_markup'])
        show.assert_awaited_once_with(context,123,complete)

    async def test_review_gallery_uses_only_signed_previews_and_keeps_owner_submission_buttons(self):
        context=SimpleNamespace(bot=SimpleNamespace(send_media_group=AsyncMock(),send_message=AsyncMock(return_value=SimpleNamespace(message_id=77))))
        view={'text':'Full preview', 'revision':4, 'sessionId':'synthetic','buttons':[[{'text':'Submit for owner review','action':'submit'}]],'gallery':[{'id':'asset1','edited':False},{'id':'asset2','edited':True}]}
        with patch.object(bot,'invoke',AsyncMock(return_value={'data':'c3ludGhldGlj'})) as invoke:
            await bot.show(context,123,view)
        self.assertEqual(invoke.await_count,2)
        self.assertTrue(all(call.args[0]['sessionId']=='synthetic' for call in invoke.await_args_list))
        context.bot.send_media_group.assert_awaited_once()
        context.bot.send_message.assert_awaited_once()
        self.assertEqual(context.bot.send_message.await_args.kwargs['text'],'Full preview')

    async def test_photo_approval_controls_follow_both_previews(self):
        order=[]
        async def photo(**kwargs):order.append('photo')
        async def message(**kwargs):order.append('controls');return SimpleNamespace(message_id=78)
        context=SimpleNamespace(bot=SimpleNamespace(send_photo=photo,send_message=message))
        view={'text':'Choose edited or original','revision':5,'sessionId':'synthetic','photos':[{'id':'asset','edited':True}],'buttons':[[{'text':'Keep original','action':'assetOriginal:asset'}]]}
        with patch.object(bot,'invoke',AsyncMock(return_value={'data':'c3ludGhldGlj'})):
            await bot.show(context,123,view)
        self.assertEqual(order,['photo','photo','controls'])

    async def test_edited_preview_sends_different_bytes_with_the_correct_labels(self):
        context=SimpleNamespace(bot=SimpleNamespace(send_photo=AsyncMock(),send_message=AsyncMock(return_value=SimpleNamespace(message_id=78))))
        view={'text':'Compare both images','revision':5,'sessionId':'synthetic','photos':[{'id':'asset','edited':True}],'buttons':[]}
        with patch.object(bot,'invoke',AsyncMock(side_effect=[{'data':'b3JpZ2luYWw='},{'data':'ZWRpdGVk'}])) as invoke:
            await bot.show(context,123,view)
        calls=context.bot.send_photo.await_args_list
        self.assertEqual([c.kwargs['photo'].getvalue() for c in calls],[b'original',b'edited'])
        self.assertIn('Original',calls[0].kwargs['caption'])
        self.assertIn('Studio',calls[1].kwargs['caption'])
        self.assertEqual([c.args[0]['edited'] for c in invoke.await_args_list],[False,True])

    async def test_failed_edit_only_requests_the_existing_original(self):
        context=SimpleNamespace(bot=SimpleNamespace(send_photo=AsyncMock(),send_message=AsyncMock(return_value=SimpleNamespace(message_id=78))))
        view={'text':'Studio editing failed. Retry editing or keep original.','revision':5,'sessionId':'synthetic','photos':[{'id':'asset','edited':False}],'buttons':[]}
        with patch.object(bot,'invoke',AsyncMock(return_value={'data':'b3JpZ2luYWw='})) as invoke:
            await bot.show(context,123,view)
        invoke.assert_awaited_once()
        self.assertFalse(invoke.await_args.args[0]['edited'])
        context.bot.send_photo.assert_awaited_once()
        self.assertIn('Studio editing failed',context.bot.send_message.await_args.kwargs['text'])

    async def test_missing_preview_warns_and_hides_photo_approval(self):
        context=SimpleNamespace(bot=SimpleNamespace(send_photo=AsyncMock(),send_message=AsyncMock(return_value=SimpleNamespace(message_id=78))))
        view={'text':'Compare both images','revision':5,'sessionId':'synthetic','photos':[{'id':'asset','edited':True}],'buttons':[[{'text':'Use edited','action':'assetUse:asset'}],[{'text':'Keep original','action':'assetOriginal:asset'}],[{'text':'Retry','action':'assetRetry:asset'}]]}
        with patch.object(bot,'invoke',AsyncMock(side_effect=[{'data':'b3JpZ2luYWw='},ValueError('asset_not_ready')])):
            await bot.show(context,123,view)
        message=context.bot.send_message.await_args.kwargs
        self.assertIn('could not be loaded',message['text'])
        self.assertIn('/resume',message['text'])
        self.assertEqual(len(message['reply_markup'].inline_keyboard),1)
        self.assertEqual(message['reply_markup'].inline_keyboard[0][0].text,'Retry')

    async def test_provider_errors_are_returned_as_codes(self):
        original = httpx.AsyncClient
        def client(**kwargs):
            return original(**kwargs, transport=httpx.MockTransport(lambda _: httpx.Response(403, json={'error': 'membership_required'})))
        with patch.object(bot.httpx, 'AsyncClient', client):
            with self.assertRaisesRegex(ValueError, 'membership_required'):
                await bot.invoke({'telegramId': '123', 'chatId': '123', 'action': 'status'})

    async def test_chat_command_keeps_session_and_update_identity(self):
        user=User(123,'Synthetic',False)
        update=Update(43,message=Message(1,datetime.now(timezone.utc),Chat(123,'private'),from_user=user,text='/chat Fix the photo'))
        context=SimpleNamespace(args=['Fix','the','photo'])
        with patch.object(bot,'invoke',AsyncMock(side_effect=[{'sessionId':'synthetic','revision':4},{'workChat':True,'text':'Proposal','buttons':[],'revision':4}])) as invoke, patch.object(bot,'show',AsyncMock()):
            await bot.command(update,context)
        self.assertEqual(invoke.await_args.args[0]['action'],'chat')
        self.assertEqual(invoke.await_args.args[0]['sessionId'],'synthetic')
        self.assertEqual(invoke.await_args.args[0]['updateId'],43)

    async def test_photo_conversation_routes_to_chat_but_price_remains_a_form_answer(self):
        user=User(123,'Synthetic',False)
        for stage,text,expected in [('photos','Keep the actual camera panel','chat'),('price','599','text')]:
            update=Update(44,message=Message(1,datetime.now(timezone.utc),Chat(123,'private'),from_user=user,text=text))
            with patch.object(bot,'invoke',AsyncMock(side_effect=[{'sessionId':'synthetic','revision':4,'workflowStage':stage},{'text':'Reply','buttons':[],'revision':4}])) as invoke, patch.object(bot,'show',AsyncMock()):
                await bot.message(update,SimpleNamespace())
            self.assertEqual(invoke.await_args.args[0]['action'],expected)

    async def test_chat_reply_does_not_cancel_pending_workflow_watcher(self):
        pending=SimpleNamespace(cancel=lambda: self.fail('Chat cancelled the progress watcher'))
        bot.watchers[123]=pending
        context=SimpleNamespace(bot=SimpleNamespace(send_message=AsyncMock(return_value=SimpleNamespace(message_id=77))))
        try:
            await bot.show(context,123,{'workChat':True,'text':'Advice','revision':4,'buttons':[]},previews=False)
            self.assertIs(bot.watchers[123],pending)
        finally:
            bot.watchers.pop(123,None)


if __name__ == '__main__':
    unittest.main()
