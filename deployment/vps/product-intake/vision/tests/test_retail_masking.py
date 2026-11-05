import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from PIL import Image
from extractor import decode_barcodes

def barcode(text, name):
    point = lambda x,y: SimpleNamespace(x=x,y=y)
    return SimpleNamespace(text=text,format=name,position=SimpleNamespace(
        top_left=point(10,10),top_right=point(12,10),bottom_right=point(70,90),bottom_left=point(68,90)))

class RetailMaskingTests(unittest.TestCase):
    def test_databar_retail_false_positive_does_not_paint_device_edges(self):
        with patch('extractor.zxingcpp.read_barcodes',return_value=[barcode('1234567890128','BarcodeFormat.DataBar')]):
            candidates,masks,_=decode_barcodes(Image.new('RGB',(100,100),'white'))
        self.assertEqual(masks,[])
        self.assertTrue(candidates)
        self.assertFalse(candidates[0]['autoAccept'])

    def test_imei_barcodes_remain_masked(self):
        with patch('extractor.zxingcpp.read_barcodes',return_value=[barcode('490154203237518','BarcodeFormat.Code128')]):
            candidates,masks,_=decode_barcodes(Image.new('RGB',(100,100),'white'))
        self.assertEqual(candidates,[])
        self.assertTrue(masks)

    def test_invalid_public_retail_checksum_is_not_a_private_identifier(self):
        with patch('extractor.zxingcpp.read_barcodes',return_value=[barcode('4006381333932','BarcodeFormat.EAN13')]):
            candidates,masks,_=decode_barcodes(Image.new('RGB',(100,100),'white'))
        self.assertEqual(masks,[])
        self.assertFalse(candidates[0]['checksumValid'])

if __name__=='__main__': unittest.main()
