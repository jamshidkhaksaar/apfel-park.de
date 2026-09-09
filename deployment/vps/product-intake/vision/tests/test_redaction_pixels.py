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
from extractor import OcrToken, redact_sensitive, minimize_device_screen, assert_device_document, NonDeviceDocument, safe_ocr_fields, sensitive_caption  # noqa: E402


class RedactionPixelTests(unittest.TestCase):
    def test_checksum_valid_serial_is_not_promoted_to_gtin(self):
        tokens = [
            OcrToken("EAN", 10, 10, 40, 20, (1, 1, 1)),
            OcrToken("4006381333931", 100, 10, 160, 20, (1, 1, 1)),
            OcrToken("Serial Number", 10, 50, 100, 20, (1, 1, 2)),
            OcrToken("1234567890128", 150, 50, 160, 20, (1, 1, 2)),
        ]
        self.assertTrue(sensitive_caption("1234567890128", tokens))
        self.assertFalse(sensitive_caption("4006381333931", tokens))
    def test_editable_name_is_masked_but_model_name_is_retained(self):
        image = Image.new("RGB", (500, 150), "white")
        tokens = [
            OcrToken("Name", 10, 10, 60, 20, (1, 1, 1)),
            OcrToken("Synthetic Customer", 150, 10, 180, 20, (1, 1, 1)),
            OcrToken("Model", 10, 50, 50, 20, (1, 1, 2)),
            OcrToken("Name", 65, 50, 50, 20, (1, 1, 2)),
            OcrToken("iPhone 17 Pro Max", 150, 50, 180, 20, (1, 1, 2)),
        ]
        redacted = minimize_device_screen(redact_sensitive(image, tokens, []), tokens)
        self.assertEqual(redacted.getpixel((180, 20)), (0, 0, 0))
        self.assertEqual(redacted.getpixel((180, 60)), (255, 255, 255))
        self.assertEqual(redacted.getpixel((30, 120)), (0, 0, 0))

    def test_sim_and_network_addresses_are_masked(self):
        image = Image.new("RGB", (600, 160), "white")
        tokens = [
            OcrToken("ICCID", 10, 10, 50, 20, (1, 1, 1)),
            OcrToken("00000000000000000000", 150, 10, 300, 20, (1, 1, 1)),
            OcrToken("AA:BB:CC:DD:EE:FF", 150, 50, 240, 20, (1, 1, 2)),
            OcrToken("Telefonnummer", 10, 90, 120, 20, (1, 1, 3)),
            OcrToken("0000000000", 150, 90, 180, 20, (1, 1, 3)),
        ]
        redacted = redact_sensitive(image, tokens, [])
        for point in [(180, 20), (180, 60), (180, 100)]:
            self.assertEqual(redacted.getpixel(point), (0, 0, 0))

    def test_identity_financial_and_shipping_documents_are_rejected_locally(self):
        for text in ["Personalausweis Model A3090", "Rechnung 123", "Invoice 456", "Gewerbe-Anmeldung", "IBAN DE00 TEST", "Date of birth", "Sendungsnummer 123"]:
            with self.subTest(text=text), self.assertRaises(NonDeviceDocument):
                assert_device_document(text)
        assert_device_document("Model Name iPhone 17 Pro Max\nCapacity 256 GB\nGTIN 4006381333931")

    def test_german_about_labels_are_supported_without_copying_editable_name(self):
        result = safe_ocr_fields("Name Synthetic Owner\nModellname iPhone 17 Pro Max\nModellnummer MTEST123/A\nKapazität 256 GB")
        self.assertEqual(result["modelName"], "iPhone 17 Pro Max")
        self.assertEqual(result["manufacturerPartNumber"], "MTEST123/A")
        self.assertNotIn("Synthetic Owner", str(result))

    def test_empty_model_label_does_not_consume_the_next_label_as_its_value(self):
        result = safe_ocr_fields("Modellname\nModellnummer MTEST123/A")
        self.assertIsNone(result["modelName"])

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
