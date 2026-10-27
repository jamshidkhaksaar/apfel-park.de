#!/usr/bin/env python3
"""Tests for the Hermes notify bridge program.

The bridge is a small security boundary: it authenticates every request with the
X-Bridge-Token header, refuses attachments outside /srv/n8n/media, and then runs
the hermes CLI. These tests start the real handler on an ephemeral loopback port
and drive it over HTTP, with subprocess.run replaced so no message can be sent
and no real hermes binary is needed.

    python3 deployment/vps/tests/test_notify_bridge.py
    npm run test:notify-bridge     # the same suite, as the shared gate runs it
"""
from __future__ import annotations

import http.client
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import threading
import unittest
from http.server import HTTPServer
from pathlib import Path
from unittest import mock

PROGRAM = Path(__file__).resolve().parents[1] / "hermes-notify-bridge" / "hermes-notify-bridge.py"
TOKEN = "bridge-test-token"
HERMES_BIN = "/usr/local/bin/hermes"


def load_bridge():
    """Import the captured program by path.

    Its file name contains hyphens, so importlib loads it directly, and it reads
    BRIDGE_TOKEN from the environment at import time, which is why that is set
    first.
    """
    os.environ["BRIDGE_TOKEN"] = TOKEN
    spec = importlib.util.spec_from_file_location("hermes_notify_bridge", PROGRAM)
    assert spec and spec.loader, PROGRAM
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class NotifyBridgeTests(unittest.TestCase):
    """Every case talks to the handler over a real socket on 127.0.0.1."""

    @classmethod
    def setUpClass(cls):
        cls.bridge = load_bridge()
        cls.server = HTTPServer(("127.0.0.1", 0), cls.bridge.Handler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        self.media = Path(tempfile.mkdtemp(prefix="bridge-media-"))
        self._media_root = self.bridge.MEDIA_ROOT
        # Resolved, because the handler compares against os.path.realpath(): a
        # temp path that resolves differently (a symlinked /tmp, or an 8.3 short
        # name on Windows) would otherwise make every attachment look outside
        # the root.
        self.bridge.MEDIA_ROOT = str(self.media.resolve())
        self.sends: list[dict] = []
        self._run = subprocess.run
        subprocess.run = self._record_run
        self.addCleanup(self._restore)

    def _restore(self):
        subprocess.run = self._run
        self.bridge.MEDIA_ROOT = self._media_root
        shutil.rmtree(self.media, ignore_errors=True)

    def _record_run(self, cmd, capture_output=True, text=True, timeout=None):
        self.sends.append(
            {
                "cmd": list(cmd),
                "timeout": timeout,
                "capture_output": capture_output,
                "text": text,
            }
        )
        return mock.Mock(returncode=0, stdout="sent\n", stderr="")

    def post(self, body, path="/send", token=TOKEN):
        payload = body if isinstance(body, (str, bytes)) else json.dumps(body)
        headers = {"Content-Type": "application/json"}
        if token is not None:
            headers["X-Bridge-Token"] = token
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        try:
            connection.request("POST", path, body=payload, headers=headers)
            response = connection.getresponse()
            raw = response.read()
            status = response.status
        finally:
            connection.close()
        return status, json.loads(raw or b"{}")

    def outside_dir(self):
        outside = Path(tempfile.mkdtemp(prefix="bridge-outside-"))
        self.addCleanup(shutil.rmtree, outside, ignore_errors=True)
        return outside

    # --- the token --------------------------------------------------------

    def test_wrong_token_is_rejected_and_sends_nothing(self):
        status, body = self.post({"text": "hi"}, token="wrong")
        self.assertEqual(status, 401)
        self.assertEqual(body, {"error": "unauthorized"})
        self.assertEqual(self.sends, [])

    def test_missing_token_is_rejected(self):
        status, body = self.post({"text": "hi"}, token=None)
        self.assertEqual(status, 401)
        self.assertEqual(body, {"error": "unauthorized"})
        self.assertEqual(self.sends, [])

    def test_token_is_required_before_the_path_is_considered(self):
        status, _ = self.post({"text": "hi"}, path="/nope", token="wrong")
        self.assertEqual(status, 401)

    def test_unknown_path_after_a_valid_token_is_not_found(self):
        status, body = self.post({"text": "hi"}, path="/nope")
        self.assertEqual(status, 404)
        self.assertEqual(body, {"error": "not found"})
        self.assertEqual(self.sends, [])

    # --- the hermes send invocation ---------------------------------------

    def test_valid_request_runs_hermes_send(self):
        status, body = self.post({"text": "hello", "target": "telegram:42"})
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertEqual(
            self.sends[0]["cmd"],
            [HERMES_BIN, "send", "--to", "telegram:42", "--json", "hello"],
        )
        self.assertEqual(self.sends[0]["timeout"], 60)
        self.assertTrue(self.sends[0]["capture_output"])
        self.assertTrue(self.sends[0]["text"])

    def test_the_default_target_and_a_subject_are_forwarded(self):
        status, _ = self.post({"text": "body", "subject": "Subj"})
        self.assertEqual(status, 200)
        self.assertEqual(
            self.sends[0]["cmd"],
            [HERMES_BIN, "send", "--to", "telegram", "--json", "--subject", "Subj", "body"],
        )

    def test_a_failing_hermes_call_is_a_bad_gateway_with_the_stderr_tail(self):
        subprocess.run = lambda cmd, **kwargs: mock.Mock(
            returncode=2, stdout="", stderr="boom: no such recipient"
        )
        status, body = self.post({"text": "hi"})
        self.assertEqual(status, 502)
        self.assertEqual(body["error"], "hermes send failed")
        self.assertIn("boom", body["detail"])

    def test_a_timing_out_hermes_call_is_a_gateway_timeout(self):
        def timing_out(cmd, **kwargs):
            raise subprocess.TimeoutExpired(cmd, 60)

        subprocess.run = timing_out
        status, body = self.post({"text": "hi"})
        self.assertEqual(status, 504)
        self.assertEqual(body, {"error": "hermes send timed out"})

    # --- request validation ----------------------------------------------

    def test_invalid_json_is_rejected(self):
        status, body = self.post("{not json")
        self.assertEqual(status, 400)
        self.assertEqual(body, {"error": "invalid json"})
        self.assertEqual(self.sends, [])

    def test_non_string_text_is_rejected(self):
        status, _ = self.post({"text": 5})
        self.assertEqual(status, 400)
        self.assertEqual(self.sends, [])

    def test_an_empty_message_is_rejected(self):
        status, _ = self.post({"text": "", "media": []})
        self.assertEqual(status, 400)
        self.assertEqual(self.sends, [])

    # --- media containment ------------------------------------------------

    def test_media_inside_the_root_is_attached(self):
        attachment = self.media / "photo.png"
        attachment.write_bytes(b"png")
        status, _ = self.post({"text": "look", "media": [str(attachment)]})
        self.assertEqual(status, 200)
        self.assertEqual(
            self.sends[0]["cmd"][-1],
            f"MEDIA:{attachment.resolve()}\nlook",
        )

    def test_media_outside_the_root_is_refused(self):
        victim = self.outside_dir() / "secret.txt"
        victim.write_text("secret")
        status, body = self.post({"text": "take this", "media": [str(victim)]})
        self.assertEqual(status, 400)
        self.assertIn("media outside", body["error"])
        self.assertEqual(self.sends, [])

    def test_a_symlink_escaping_the_root_is_refused(self):
        target = self.outside_dir() / "secret.txt"
        target.write_text("secret")
        link = self.media / "link.txt"
        try:
            link.symlink_to(target)
        except OSError as error:  # pragma: no cover - platform dependent
            self.skipTest(f"symlinks are not permitted here: {error}")
        status, body = self.post({"text": "take this", "media": [str(link)]})
        self.assertEqual(status, 400)
        self.assertIn("media outside", body["error"])
        self.assertEqual(self.sends, [])

    def test_a_missing_media_file_is_refused(self):
        status, body = self.post({"text": "x", "media": [str(self.media / "absent.png")]})
        self.assertEqual(status, 400)
        self.assertIn("media not found", body["error"])
        self.assertEqual(self.sends, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
