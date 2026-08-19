import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from identifiers import classify_numeric_identifier, ocr_gtin_candidates, valid_gtin, valid_imei  # noqa: E402


class IdentifierTests(unittest.TestCase):
    def test_valid_gtins(self):
        for value in ["4006381333931", "96385074", "012345678905", "1234567890128"]:
            self.assertTrue(valid_gtin(value), value)

    def test_invalid_gtins(self):
        for value in ["4006381333932", "12345678", "1234", "490154203237518"]:
            self.assertFalse(valid_gtin(value), value)

    def test_imei_is_never_gtin(self):
        imei = "490154203237518"
        self.assertTrue(valid_imei(imei))
        self.assertEqual(classify_numeric_identifier(imei), "imei")

    def test_eid_is_sensitive(self):
        self.assertEqual(classify_numeric_identifier("89049032000000000000000000000001"), "eid")

    def test_ocr_uses_labels_and_never_promotes_imei(self):
        result = ocr_gtin_candidates("EAN: 4006381333931\nIMEI: 490154203237518\nGTIN: 1234567890123")
        self.assertEqual([entry["value"] for entry in result], ["4006381333931", "1234567890123"])
        self.assertTrue(result[0]["checksumValid"])
        self.assertFalse(result[1]["checksumValid"])


if __name__ == "__main__":
    unittest.main()
