import importlib.util
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

if importlib.util.find_spec("cv2") is None:
    sys.modules["cv2"] = MagicMock()
if importlib.util.find_spec("numpy") is None:
    sys.modules["numpy"] = MagicMock()
if importlib.util.find_spec("pytesseract") is None:
    pytesseract = MagicMock()
    pytesseract.Output = SimpleNamespace(DICT="dict")
    sys.modules["pytesseract"] = pytesseract
if importlib.util.find_spec("zxingcpp") is None:
    sys.modules["zxingcpp"] = MagicMock()

from PIL import Image  # noqa: E402
from extractor import OcrToken, redact_sensitive  # noqa: E402


class RedactionPixelTests(unittest.TestCase):
    def test_german_serial_value_on_next_line_is_blacked_out(self):
        image = Image.new("RGB", (320, 120), "white")
        tokens = [
            OcrToken("Seriennummer", 10, 10, 100, 20, (1, 1, 1)),
            OcrToken("ABCD-1234-EFGH", 10, 45, 140, 20, (1, 1, 2)),
        ]
        redacted = redact_sensitive(image, tokens, [])
        self.assertEqual(redacted.getpixel((40, 55)), (0, 0, 0))

    def test_split_german_serial_label_redacts_following_line(self):
        image = Image.new("RGB", (320, 120), "white")
        tokens = [
            OcrToken("Serien", 10, 10, 55, 20, (1, 1, 1)),
            OcrToken("Nr.", 70, 10, 25, 20, (1, 1, 1)),
            OcrToken("ZXCV-9876-QWER", 10, 45, 140, 20, (1, 1, 2)),
        ]
        redacted = redact_sensitive(image, tokens, [])
        self.assertEqual(redacted.getpixel((40, 55)), (0, 0, 0))

    def test_every_sensitive_barcode_polygon_is_blacked_out(self):
        image = Image.new("RGB", (320, 120), "white")
        masks = [
            [(10, 10), (80, 10), (80, 40), (10, 40)],
            [(180, 60), (280, 60), (280, 100), (180, 100)],
        ]
        redacted = redact_sensitive(image, [], masks)
        self.assertEqual(redacted.getpixel((40, 25)), (0, 0, 0))
        self.assertEqual(redacted.getpixel((220, 80)), (0, 0, 0))


if __name__ == "__main__":
    unittest.main()
