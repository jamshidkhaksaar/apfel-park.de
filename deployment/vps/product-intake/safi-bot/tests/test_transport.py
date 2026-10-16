import hashlib
import hmac
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

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

    async def test_provider_errors_are_returned_as_codes(self):
        original = httpx.AsyncClient
        def client(**kwargs):
            return original(**kwargs, transport=httpx.MockTransport(lambda _: httpx.Response(403, json={'error': 'membership_required'})))
        with patch.object(bot.httpx, 'AsyncClient', client):
            with self.assertRaisesRegex(ValueError, 'membership_required'):
                await bot.invoke({'telegramId': '123', 'chatId': '123', 'action': 'status'})


if __name__ == '__main__':
    unittest.main()
