import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from merge_results import merge_results  # noqa: E402


class MergeResultTests(unittest.TestCase):
    def test_box_about_conflict_blocks_silent_selection(self):
        merged = merge_results([
            {"assetType": "barcode_label", "hardwareModel": "A3520", "gtinCandidates": []},
            {"assetType": "about_screen", "hardwareModel": "A3519", "gtinCandidates": []},
        ])
        self.assertIsNone(merged["hardwareModel"])
        self.assertTrue(any("hardwareModel" in value for value in merged["conflicts"]))

    def test_barcode_wins_and_vision_only_digits_need_confirmation(self):
        merged = merge_results([{
            "assetType": "barcode_label",
            "gtinCandidates": [
                {"value": "4006381333931", "symbology": "EAN13", "extractionMethod": "barcode", "confidence": 1, "autoAccept": True},
                {"value": "1234567890128", "symbology": "vision", "extractionMethod": "vision", "confidence": 0.7},
                {"value": "490154203237518", "symbology": "vision", "extractionMethod": "vision", "confidence": 0.7},
            ],
        }])
        self.assertEqual({entry["value"] for entry in merged["gtinCandidates"]}, {"4006381333931", "1234567890128"})
        self.assertTrue(any("Sol-only" in value for value in merged["requiresConfirmation"]))

    def test_sol_cannot_self_assert_auto_accept(self):
        merged = merge_results([{
            "assetType": "barcode_label",
            "gtinCandidates": [{
                "value": "4006381333931", "symbology": "vision", "extractionMethod": "vision",
                "confidence": 1, "autoAccept": True, "localDecoder": False,
            }],
        }])
        self.assertTrue(any("Sol-only" in value for value in merged["requiresConfirmation"]))

    def test_sensitive_vision_text_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "sensitive identifier"):
            merge_results([{"assetType": "about_screen", "modelName": "IMEI: 490154203237518"}])
