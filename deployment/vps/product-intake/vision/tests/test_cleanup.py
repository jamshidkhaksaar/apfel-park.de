import os
import sys
import tempfile
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cleanup import prune  # noqa: E402


class CleanupTests(unittest.TestCase):
    def test_prune_removes_only_expired_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            expired = root / "expired.webp"
            fresh = root / "fresh.webp"
            expired.write_bytes(b"expired")
            fresh.write_bytes(b"fresh")
            old = time.time() - 25 * 3600
            os.utime(expired, (old, old))
            self.assertEqual(prune(root, 24), 1)
            self.assertFalse(expired.exists())
            self.assertTrue(fresh.exists())


if __name__ == "__main__":
    unittest.main()
