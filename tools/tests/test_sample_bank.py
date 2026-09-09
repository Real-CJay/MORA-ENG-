import contextlib
import copy
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
import validate_content_safe as safe
import validate_questions as schema

BANK = ROOT / 'examples' / 'synthetic'


def read(name):
    return json.loads((BANK / name).read_text(encoding='utf-8'))


class SampleBankTest(unittest.TestCase):
    def setUp(self):
        self.catalog = read('catalog.json')
        self.live = read('live.json')
        self.preview = read('preview.json')
        self.meta = {'units': {1: 'one', 2: 'two'}}

    def test_valid_live_and_preview_have_distinct_compatibility(self):
        live = safe.validate_pack(self.live, live_meta=self.meta, subject='__sample_shared')
        self.assertEqual(live['errors'], 0, live)
        preview = safe.validate_pack(self.preview)
        self.assertEqual(preview['errors'], 0, preview)
        preview_live = safe.validate_pack(self.preview, live_meta=self.meta, subject='__sample_shared')
        self.assertEqual(sum(i['code'] == 'PREVIEW_ONLY' for i in preview_live['issues']), len(self.preview['questions']))

    def test_types_blocks_and_answer_modes_cover_schema_contract(self):
        questions = self.preview['questions']
        self.assertEqual({q['type'] for q in questions}, schema.VALID_QUESTION_TYPES)
        self.assertEqual({q['answer']['mode'] for q in questions}, schema.VALID_ANSWER_MODES)
        self.assertEqual({b['type'] for q in questions for b in q['body']}, schema.VALID_BLOCK_TYPES)
        self.assertEqual({q.get('stimulusId') for q in questions if q.get('stimulusId')}, {'sample_shared'})
        self.assertGreaterEqual(sum('stimulusId' in q for q in questions), 2)

    def test_hierarchy_references_are_resolved_without_duplicate_modules(self):
        catalog = self.catalog
        self.assertTrue(catalog['synthetic'])
        modules = {m['id']: m for m in catalog['modules']}
        self.assertEqual(len(modules), len(catalog['modules']))
        departments = {d['id']: d for d in catalog['departments']}
        self.assertEqual({d['label'] for d in departments.values()}, {'ENTC','CSE','Electrical','Material','Bio Medical','Chemical','Mechanical','Civil'})
        self.assertEqual({s['label'] for s in departments['mechanical']['streams']}, {'Aeronautical','Mechatronics','Common Stream'})
        placements = []
        for semester in catalog['semesters']:
            for placement in semester['placements']:
                self.assertIn(placement['moduleId'], modules)
                placements.append(placement['moduleId'])
                if semester['type'] == 'common':
                    self.assertIsNone(placement['departmentId'])
                    self.assertIsNone(placement['streamId'])
                else:
                    dept = departments[placement['departmentId']]
                    if placement['streamId']:
                        self.assertIn(placement['streamId'], {s['id'] for s in dept['streams']})
        self.assertGreater(placements.count('__sample_shared'), 1)
        self.assertEqual(modules['__sample_empty']['groups'], [])

    def test_all_samples_reachable_and_coverage_labels_match_features(self):
        live = {q['id']: q for q in self.live['questions']}
        preview = {q['id']: q for q in self.preview['questions']}
        self.assertFalse(live.keys() & preview.keys())
        self.assertTrue(all(qid.startswith('__dev_synthetic_') for qid in live.keys() | preview.keys()))
        groups = [g for m in self.catalog['modules'] for g in m['groups']]
        self.assertEqual({g['bucket'] for g in groups}, schema.VALID_BUCKETS)
        self.assertEqual({qid for g in groups for qid in g['questionIds']}, set(live))
        self.assertEqual({qid for m in self.catalog['modules'] for qid in m['previewQuestionIds']}, set(preview))
        covered = {qid for ids in self.catalog['coverage'].values() for qid in ids}
        self.assertEqual(covered, set(live) | set(preview))
        def fixture(tag):
            return live[self.catalog['coverage'][tag][0]]
        self.assertNotIn('exp', fixture('live-minimal'))
        rich = fixture('live-html-context-image')
        self.assertTrue(all(rich[k] for k in ('context', 'img', 'imgAlt', 'exp', 'source')))
        self.assertIn('<strong>', rich['text'])
        for delimiter in ('$', '$$', '\\(', '\\['):
            self.assertIn(delimiter, fixture('latex-delimiters')['text'])
        duplicate = fixture('canonical-duplicate-options')
        self.assertEqual(duplicate['opts'][0], duplicate['opts'][1])
        self.assertEqual(duplicate['ans'], 1)
        hard = fixture('target-hard-last-index')
        self.assertTrue(hard['hard'])
        self.assertEqual(hard['ans'], len(hard['opts']) - 1)
        self.assertEqual({b['type'] for b in fixture('hybrid-block-fallback')['blocks']}, schema.VALID_BLOCK_TYPES)

    def test_invalid_cases_fail_only_at_the_expected_boundary(self):
        by_id = {q['id']: q for q in self.live['questions']}
        for case in read('invalid.json')['cases']:
            with self.subTest(case=case['id']):
                pack = copy.deepcopy(self.live)
                q = copy.deepcopy(by_id[case['base']])
                q.update(case['set'])
                pack['questions'] = [q]
                result = safe.validate_pack(pack)
                if case['expectedSchema']:
                    self.assertIn(case['expectedSchema'], {i['code'] for i in result['issues'] if i['severity'] == 'error'})
                else:
                    self.assertEqual(result['errors'], 0, result)
                result = safe.validate_pack(pack, live_meta=self.meta, subject='__sample_shared')
                self.assertIn(case['expectedLive'], {i['code'] for i in result['issues']})

    def test_numeric_and_text_variants_without_more_authored_questions(self):
        for mode, value, match in [('numeric', 2, None), ('numeric', [2,-2], 'any'), ('numeric', [2,-2], 'all'), ('text', 'two', None), ('text', ['two','2'], 'any'), ('text', ['a','b'], 'all')]:
            for tolerance_type in ('relative', 'absolute'):
                pack = copy.deepcopy(self.preview)
                q = copy.deepcopy(pack['questions'][2 if mode == 'numeric' else 3])
                q['answer'] = {'mode': mode, 'value': value}
                if match:
                    q['answer']['matchMode'] = match
                if mode == 'numeric':
                    q['answer'].update(tolerance=0.01, toleranceType=tolerance_type)
                if mode == 'text' and match == 'all':
                    q['answer'].update(orderedMatch=True, extraAllowed=True)
                pack['questions'] = [q]
                self.assertEqual(safe.validate_pack(pack)['errors'], 0)


class SafeReportTest(unittest.TestCase):
    def test_messages_registry_keys_and_invalid_nested_values_never_leak(self):
        marker = 'PRIVATE_QUESTION_SENTINEL'
        mutations = [
            {'type': marker}, {'answer': {'mode': 'single', 'value': marker}},
            {'stimulusId': marker}, {'body': [{'type': marker}]},
            {'body': [{'type': 'text', 'value': '<script>'+marker+'</script>'}]},
            {'answer': {'mode': {'secret': marker}}}, {'id': ['<'+marker+'>']},
        ]
        for mutation in mutations:
            pack = read('preview.json')
            pack['questions'] = [pack['questions'][0]]
            pack['questions'][0].update(mutation)
            result = safe.validate_pack(pack)
            self.assertGreater(result['errors'], 0)
            self.assertNotIn(marker, json.dumps(result))
        pack = read('preview.json')
        pack['images'] = {marker: {'src': marker}}
        pack['stimuli'] = {marker: {'body': [{'type': marker}]}}
        self.assertNotIn(marker, json.dumps(safe.validate_pack(pack)))

    def test_safe_and_existing_schema_counts_match(self):
        for name in ('live.json', 'preview.json'):
            pack = read(name)
            old = schema.validate_pack(pack, str(ROOT))
            new = safe.validate_pack(pack)
            self.assertEqual((len(old.errors), len(old.warnings)), (new['errors'], new['warnings']))

    def test_cli_malformed_input_omission_counts_and_exit_code(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'bad.json'
            path.write_text('{ PRIVATE_QUESTION_SENTINEL', encoding='utf-8')
            proc = subprocess.run([sys.executable, '-B', str(ROOT/'tools/validate_content_safe.py'), str(path), '--max-issues', '0'], capture_output=True, text=True)
            self.assertEqual(proc.returncode, 1)
            self.assertNotIn('PRIVATE_QUESTION_SENTINEL', proc.stdout + proc.stderr)
            self.assertEqual(proc.stderr, '')
            report = json.loads(proc.stdout)
            self.assertEqual(report['errors'], 1)
            self.assertEqual(report['reports'][0]['omittedIssues'], 1)
            self.assertEqual(report['reports'][0]['issues'], [])

            proc = subprocess.run([sys.executable, '-B', str(ROOT/'tools/validate_content_safe.py'), str(BANK/'live.json'), str(path), '--max-issues', '1'], capture_output=True, text=True)
            self.assertEqual(proc.returncode, 1)
            report = json.loads(proc.stdout)
            self.assertEqual(report['reports'][0]['issues'], [])
            self.assertEqual(report['reports'][1]['issues'][0]['code'], 'INPUT_UNREADABLE')

    def test_live_repository_validation_is_read_only_nonexecuting_and_global(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'subject_data').mkdir()
            # The import gate loads the real validator from this directory.
            (root/'tools').mkdir()
            (root/'tools/validate_questions.py').write_bytes((ROOT/'tools/validate_questions.py').read_bytes())
            registry = "const SUBJECTS = {\n  alpha: { units: {1: 'One'} },\n  beta: { units: {1: 'One'} }\n};"
            (root/'quiz_data.js').write_text(registry, encoding='utf-8')
            for name in ('alpha','beta'):
                q = {'id':'same_id','subject':name,'unit':1,'year':'sample','text':'PRIVATE_QUESTION_SENTINEL','opts':['1','2'],'ans':1}
                chunk = {'pastUnit':[q],'pastPaper':[],'targetHard':[],'targetNormal':[]}
                source = 'throw new Error("DO_NOT_EXECUTE");\nwindow.MORA_SUBJECT_CHUNKS["'+name+'"] = '+json.dumps(chunk)+';'
                (root/'subject_data'/f'{name}.js').write_text(source, encoding='utf-8')
            before = {str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()}
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                reports = safe.validate_repository(root)
            self.assertEqual(output.getvalue(), '')
            self.assertNotIn('PRIVATE_QUESTION_SENTINEL', json.dumps(reports))
            self.assertIn('GLOBAL_DUPLICATE_ID', {i['code'] for r in reports for i in r['issues']})
            after = {str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts}
            self.assertEqual(before, after)

    def test_missing_and_unregistered_chunks_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root/'subject_data').mkdir()
            (root/'quiz_data.js').write_text("const SUBJECTS = {\n  absent: { units: {} }\n};", encoding='utf-8')
            (root/'subject_data/extra.js').write_text('window.MORA_SUBJECT_CHUNKS["extra"] = {};', encoding='utf-8')
            codes = {i['code'] for r in safe.validate_repository(root) for i in r['issues']}
            self.assertEqual(codes, {'MODULE_UNREGISTERED','CHUNK_MISSING'})


if __name__ == '__main__':
    unittest.main()
