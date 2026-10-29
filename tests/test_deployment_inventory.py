"""Expected deployment bytes must come from the reported commit."""
import hashlib
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    'deployment_verifier', Path(__file__).resolve().parents[1] / 'scripts/verify_deployment.py')
VERIFIER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VERIFIER)


class CommittedInventoryTest(unittest.TestCase):
    def test_staged_unstaged_and_new_files_do_not_change_commit_inventory(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)

            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root)

            git('init', '-q')
            (root / 'docs').mkdir()
            original = {'index.html': b'<h1>Published</h1>\n',
                        'docs/status.md': b'Published evidence\n'}
            for name, content in original.items():
                (root / name).write_bytes(content)
            git('add', '.')
            git('-c', 'user.name=Deployment Test', '-c', 'user.email=deployment@example.invalid',
                'commit', '-qm', 'Fixture')
            revision = git('rev-parse', 'HEAD').decode().strip()
            (root / 'index.html').write_text('<h1>Staged change</h1>')
            (root / 'staged.html').write_text('<h1>New staged page</h1>')
            git('add', 'index.html', 'staged.html')
            (root / 'index.html').write_text('<h1>Unstaged change</h1>')
            (root / 'docs/status.md').unlink()
            (root / 'untracked.html').write_text('<h1>Untracked page</h1>')
            with patch.object(VERIFIER, 'ROOT', root):
                inventory = dict(VERIFIER.committed_inventory(revision))
            self.assertEqual(inventory, {name: hashlib.sha256(content).hexdigest()
                                         for name, content in original.items()})


if __name__ == '__main__':
    unittest.main()
