import json
import unittest

from intake_client import canonical_json


class CanonicalJsonTests(unittest.TestCase):
    def test_matches_javascript_number_serialization_for_int_floats(self):
        encoded = canonical_json({"price": 899.0, "facts": [{"confidence": 1.0}, {"confidence": 0.99}]})
        self.assertEqual(encoded, '{"price":899,"facts":[{"confidence":1},{"confidence":0.99}]}')
        self.assertEqual(json.loads(encoded)["price"], 899)


if __name__ == "__main__":
    unittest.main()
