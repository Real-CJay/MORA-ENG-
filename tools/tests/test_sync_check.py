import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('check_sync', ROOT / 'tools/check_sync.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class SyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def repo(self):
        def git(*args):
            subprocess.run(['git', *args], cwd=self.root, check=True, capture_output=True)
        git('init'); git('config', 'user.name', 'Synthetic Test'); git('config', 'user.email', 'test@example.invalid')
        (self.root / 'known.txt').write_text('synthetic', encoding='utf-8')
        git('add', 'known.txt'); git('commit', '-m', 'synthetic baseline')
        return {'manifestVersion': 1, 'excludedUntracked': ['AI exports/*'], 'reviewPaths': ['known.txt'],
                'contracts': {'demo': {'paths': ['known.txt'], 'tests': ['samples']}}}

    def fixture(self):
        manifest = json.loads((ROOT / 'tools/compatibility.json').read_text())
        files = ['tools/claude_prompt_generator.py', 'tools/validate_questions.py',
                 'examples/synthetic/preview.json', 'examples/synthetic/catalog.json', 'index.html', 'service-worker.js']
        for name in files:
            dest = self.root / name; dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, dest)
        worker = (self.root / 'service-worker.js').read_text(encoding='utf-8')
        for name in re.findall(r"versionedAppAsset\(['\"]([^'\"]+)", worker):
            dest = self.root / name.lstrip('/')
            if not dest.exists():
                dest.parent.mkdir(parents=True, exist_ok=True); dest.touch()
        return manifest

    def test_current_contract_relationships_pass(self):
        self.assertEqual(sync.relationships(self.root, self.fixture()), [])

    def test_numeric_schema_and_offline_drift_are_detected(self):
        manifest = self.fixture()
        pack_path = self.root / 'examples/synthetic/preview.json'
        pack = json.loads(pack_path.read_text(encoding='utf-8'))
        next(q for q in pack['questions'] if q['id'].endswith('numeric_exact'))['answer']['tolerance'] = 0.1
        pack_path.write_text(json.dumps(pack), encoding='utf-8')
        index = self.root / 'index.html'
        source = index.read_text(encoding='utf-8')
        index.write_text(re.sub(r'\?v=[A-Za-z0-9._-]+', '?v=__test_mismatch__', source), encoding='utf-8')
        errors = sync.relationships(self.root, manifest)
        self.assertIn('EXACT_NUMERIC_DRIFT', errors); self.assertIn('OFFLINE_VERSION_DRIFT', errors)
        self.assertNotIn('Enter both numbers', str(errors))

    def test_generator_modes_cannot_drift(self):
        manifest = self.fixture()
        manifest['answerModes'].append('numeric_exact')
        self.assertIn('MODE_DRIFT_VALID_ANSWER_MODES', sync.relationships(self.root, manifest))

    def test_unknown_check_and_missing_asset_fail(self):
        manifest = self.fixture()
        manifest['contracts']['authoring-schema']['tests'].append('arbitrary-command')
        (self.root / 'auth.js').unlink()
        errors = sync.relationships(self.root, manifest)
        self.assertIn('UNKNOWN_TEST', errors); self.assertIn('APP_ASSET_MISSING', errors)

    def test_review_and_unmapped_changes_do_not_silently_pass(self):
        manifest = self.repo()
        (self.root / 'known.txt').write_text('changed', encoding='utf-8')
        runner = lambda root, name: {'name': name, 'status': 'PASS', 'tests': 1}
        with patch.object(sync, 'relationships', return_value=[]):
            report = sync.build_report(self.root, manifest, 'HEAD', runner=runner)
            self.assertEqual(report['status'], 'REVIEW NEEDED')
            report = sync.build_report(self.root, manifest, 'HEAD', reviewed=True, runner=runner)
            self.assertEqual(report['status'], 'PASS')
            (self.root / 'new.txt').write_text('new', encoding='utf-8')
            report = sync.build_report(self.root, manifest, 'HEAD', reviewed=True, runner=runner)
            self.assertEqual(report['status'], 'UNMAPPED')

    def test_review_acknowledgement_never_overrides_test_failure(self):
        manifest = self.repo()
        runner = lambda root, name: {'name': name, 'status': 'FAIL'}
        with patch.object(sync, 'relationships', return_value=[]):
            report = sync.build_report(self.root, manifest, 'HEAD', all_checks=True, reviewed=True, runner=runner)
        self.assertEqual(report['status'], 'FAIL')

    def test_snapshot_detects_changes_and_inventory_uses_git_identity(self):
        manifest = self.repo()
        before = sync.fingerprint(self.root, manifest)
        rows = sync.inventory(self.root, sync.snapshot(self.root, 'HEAD'), manifest, [])
        self.assertEqual(rows[0]['contentState'], 'matches_HEAD')
        self.assertTrue(rows[0]['lastChangedCommit']); self.assertTrue(rows[0]['lastChangedAt'])
        (self.root / 'known.txt').write_text('changed', encoding='utf-8')
        self.assertNotEqual(sync.fingerprint(self.root, manifest), before)
        rows = sync.inventory(self.root, sync.snapshot(self.root, 'HEAD'), manifest, [])
        self.assertEqual(rows[0]['contentState'], 'modified')
        (self.root / 'AI exports').mkdir()
        (self.root / 'AI exports/ignored.txt').write_text('not inspected', encoding='utf-8')
        current = sync.fingerprint(self.root, manifest)
        (self.root / 'AI exports/ignored.txt').write_text('different', encoding='utf-8')
        self.assertEqual(sync.fingerprint(self.root, manifest), current)

    def test_deleted_and_renamed_paths_remain_visible(self):
        manifest = self.repo()
        (self.root / 'known.txt').rename(self.root / 'renamed.txt')
        snapshot = sync.snapshot(self.root, 'HEAD')
        self.assertEqual(snapshot['changed'], {'known.txt', 'renamed.txt'})
        rows = {r['path']: r for r in sync.inventory(self.root, snapshot, manifest, [])}
        self.assertEqual(rows['known.txt']['contentState'], 'deleted')
        self.assertEqual(rows['renamed.txt']['contentState'], 'untracked')

    def test_changes_during_checks_invalidate_results(self):
        manifest = self.repo()
        def runner(root, name):
            (root / 'known.txt').write_text('concurrent edit', encoding='utf-8')
            return {'name': name, 'status': 'PASS'}
        with patch.object(sync, 'relationships', return_value=[]):
            report = sync.build_report(self.root, manifest, 'HEAD', all_checks=True, reviewed=True, runner=runner)
        self.assertEqual(report['status'], 'FAIL')
        self.assertIn('SOURCE_CHANGED_DURING_CHECKS', report['relationshipErrors'])


if __name__ == '__main__':
    unittest.main()
