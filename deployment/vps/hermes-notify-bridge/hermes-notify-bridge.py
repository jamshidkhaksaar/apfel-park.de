#!/usr/bin/env python3
"""Localhost HTTP bridge: lets containerized n8n send chat messages via `hermes send`.

POST /send  {"text": "...", "target": "telegram:12345", "media": ["/path/img.png"], "subject": "..."}
Auth: X-Bridge-Token header must match BRIDGE_TOKEN env.
"""
import hmac
import json
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

BRIDGE_TOKEN = os.environ["BRIDGE_TOKEN"]
HERMES_BIN = "/usr/local/bin/hermes"
MEDIA_ROOT = "/srv/n8n/media"  # only files under this dir may be attached


class Handler(BaseHTTPRequestHandler):
    def _reply(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        token = self.headers.get("X-Bridge-Token", "")
        if not hmac.compare_digest(token, BRIDGE_TOKEN):
            return self._reply(401, {"error": "unauthorized"})
        if self.path != "/send":
            return self._reply(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._reply(400, {"error": "invalid json"})

        text = payload.get("text", "")
        target = payload.get("target", "telegram")
        subject = payload.get("subject")
        media = payload.get("media") or []
        if not isinstance(text, str) or not isinstance(target, str):
            return self._reply(400, {"error": "text and target must be strings"})

        parts = []
        for item in media:
            real = os.path.realpath(str(item))
            if not real.startswith(MEDIA_ROOT + os.sep):
                return self._reply(400, {"error": f"media outside {MEDIA_ROOT}: {item}"})
            if not os.path.isfile(real):
                return self._reply(400, {"error": f"media not found: {item}"})
            parts.append(f"MEDIA:{real}")
        message = "\n".join(parts + ([text] if text else []))
        if not message:
            return self._reply(400, {"error": "empty message"})

        cmd = [HERMES_BIN, "send", "--to", target, "--json"]
        if subject:
            cmd += ["--subject", str(subject)]
        cmd.append(message)
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        except subprocess.TimeoutExpired:
            return self._reply(504, {"error": "hermes send timed out"})
        if result.returncode != 0:
            return self._reply(502, {"error": "hermes send failed", "detail": result.stderr[-500:]})
        self._reply(200, {"ok": True, "output": result.stdout[-500:]})

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    addrs = os.environ.get("BIND_ADDRS", "127.0.0.1").split(",")
    servers = [HTTPServer((addr.strip(), 8722), Handler) for addr in addrs if addr.strip()]
    for srv in servers[1:]:
        threading.Thread(target=srv.serve_forever, daemon=True).start()
    servers[0].serve_forever()
