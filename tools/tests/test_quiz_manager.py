import contextlib
import importlib.util
import io
import json
import shutil
import tempfile
import types
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
MANAGER_PATH = REPO_ROOT / "tools" / "quiz_manager.py"
VALIDATOR_PATH = REPO_ROOT / "tools" / "validate_questions.py"


def load_manager():
    spec = importlib.util.spec_from_file_location("quiz_manager_under_test", MANAGER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def counts_block():
    empty = {"count": 0, "placeholder": []}
    return {
        "pastUnit": dict(empty),
        "pastPaper": dict(empty),
        "targetHard": dict(empty),
        "targetNormal": dict(empty),
        "allTarget": dict(empty),
    }


def valid_pack(questions, subject="alpha", bucket="pastPaper", stimuli=None, images=None):
    return {
        "schemaVersion": 2,
        "subject": subject,
        "bucket": bucket,
        "stimuli": stimuli or {},
        "images": images or {},
        "questions": questions,
    }


def single_question(qid="alpha_single_001"):
    return {
        "id": qid,
        "subject": "alpha",
        "unit": 1,
        "topic": "Logic",
        "year": "2026",
        "type": "mcq",
        "body": [{"type": "text", "value": "What is the output?"}],
        "options": [
            {"label": "a", "body": [{"type": "text", "value": "1"}]},
            {"label": "b", "body": [{"type": "text", "value": "2"}]},
        ],
        "answer": {"mode": "single", "value": "b"},
        "explanation": [{"type": "text", "value": "The expression evaluates to 2."}],
        "source": {"pdf": "alpha.pdf", "page": 1, "qno": 1},
        "status": "published",
    }


class QuizManagerTest(unittest.TestCase):
    def setUp(self):
        self.manager = load_manager()
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "tools").mkdir()
        (self.root / "subject_data").mkdir()
        shutil.copy2(VALIDATOR_PATH, self.root / "tools" / "validate_questions.py")
        self.quiz_data_path = self.root / "quiz_data.js"
        self.write_quiz_data()
        self.write_chunk(
            "alpha",
            {
                "pastUnit": [
                    {
                        "id": "alpha_pu_001",
                        "subject": "alpha",
                        "unit": 1,
                        "year": 2024,
                        "text": "Legacy alpha question",
                        "opts": ["A", "B"],
                        "ans": 0,
                        "exp": "Legacy explanation",
                        "type": "mcq",
                    }
                ],
                "pastPaper": [],
                "targetHard": [],
                "targetNormal": [],
            },
        )
        self.write_chunk(
            "beta",
            {
                "pastUnit": [],
                "pastPaper": [
                    {
                        "id": "shared_collision_001",
                        "subject": "beta",
                        "unit": 1,
                        "year": 2024,
                        "text": "Beta duplicate holder",
                        "opts": ["A", "B"],
                        "ans": 0,
                        "exp": "Explanation",
                        "type": "mcq",
                    }
                ],
                "targetHard": [],
                "targetNormal": [],
            },
        )
        self.manager.set_quiz_data_path(str(self.quiz_data_path))

    def tearDown(self):
        self.tmp.cleanup()

    def write_quiz_data(self):
        counts = {"alpha": counts_block(), "beta": counts_block()}
        self.quiz_data_path.write_text(
            "const SUBJECT_COUNTS = "
            + json.dumps(counts, indent=2)
            + ";\n\n"
            + """const SUBJECTS = {
  alpha: {
    key: 'alpha',
    label: 'Alpha',
    pastUnit: SUBJECT_COUNTS.alpha.pastUnit.placeholder,
    pastPaper: SUBJECT_COUNTS.alpha.pastPaper.placeholder,
    targetHard: SUBJECT_COUNTS.alpha.targetHard.placeholder,
    targetNormal: SUBJECT_COUNTS.alpha.targetNormal.placeholder,
    allTarget: SUBJECT_COUNTS.alpha.allTarget.placeholder,
    units: {1:'One', 2:'Two'},
  },
  beta: {
    key: 'beta',
    label: 'Beta',
    pastUnit: SUBJECT_COUNTS.beta.pastUnit.placeholder,
    pastPaper: SUBJECT_COUNTS.beta.pastPaper.placeholder,
    targetHard: SUBJECT_COUNTS.beta.targetHard.placeholder,
    targetNormal: SUBJECT_COUNTS.beta.targetNormal.placeholder,
    allTarget: SUBJECT_COUNTS.beta.allTarget.placeholder,
    units: {1:'One'},
  },
};
""",
            encoding="utf-8",
        )

    def write_chunk(self, subject, chunk):
        path = self.root / "subject_data" / f"{subject}.js"
        path.write_text(
            f"// {subject} question data - lazy loaded by quiz_app.js\n"
            "window.MORA_SUBJECT_CHUNKS = window.MORA_SUBJECT_CHUNKS || {};\n"
            f"window.MORA_SUBJECT_CHUNKS[\"{subject}\"] = "
            + json.dumps(chunk, ensure_ascii=False, separators=(",", ":"))
            + ";\n",
            encoding="utf-8",
        )

    def write_pack(self, name, pack):
        path = self.root / name
        path.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def read_chunk(self, subject):
        return self.manager._read_subject_chunk(subject)

    def test_legacy_question_remains_supported_and_warnings_surface(self):
        legacy = {
            "id": "alpha_legacy_import_001",
            "subject": "alpha",
            "unit": 1,
            "year": "2026",
            "text": "Imported legacy text",
            "opts": ["A", "B"],
            "ans": 1,
            "exp": "Legacy import explanation",
            "type": "mcq",
            "source": {"pdf": "legacy.pdf", "page": 1, "qno": 2},
        }
        pack_path = self.write_pack("legacy_pack.json", valid_pack([legacy]))
        pack, outcome = self.manager.run_official_validation(pack_path, self.root)
        self.assertTrue(outcome.ok)
        self.assertTrue(any("legacy format detected" in item for item in outcome.warnings))
        html = self.quiz_data_path.read_text(encoding="utf-8")
        plan = self.manager.prepare_import_plan(html, pack_path, pack, outcome.warnings, "alpha", "past_paper")
        self.assertTrue(plan.can_apply)
        html = self.manager.apply_import_plan(html, plan)
        self.assertTrue(self.manager.write_all_changes(self.quiz_data_path, html))
        imported = self.read_chunk("alpha")["pastPaper"][0]
        self.assertEqual(imported, legacy)

    def test_current_schema_questions_remain_preview_only(self):
        questions = [
            single_question("alpha_single_002"),
            {
                **single_question("alpha_multiple_001"),
                "type": "multi_select",
                "options": [
                    {"label": "a", "body": [{"type": "text", "value": "A"}]},
                    {"label": "b", "body": [{"type": "text", "value": "B"}]},
                    {"label": "c", "body": [{"type": "text", "value": "C"}]},
                ],
                "answer": {"mode": "multiple", "value": ["a", "c"], "matchMode": "all"},
            },
            {
                "id": "alpha_numeric_001",
                "subject": "alpha",
                "unit": 2,
                "year": "2026",
                "type": "numeric",
                "body": [{"type": "math", "latex": "x^2 = 4", "display": True}],
                "answer": {
                    "mode": "numeric",
                    "value": [2, -2],
                    "matchMode": "all",
                    "tolerance": 0.01,
                    "toleranceType": "absolute",
                },
                "explanation": [{"type": "text", "value": "Both roots satisfy the equation."}],
                "source": {"pdf": "alpha.pdf", "page": 2, "qno": 3},
            },
            {
                "id": "alpha_text_001",
                "subject": "alpha",
                "unit": 2,
                "year": "2026",
                "type": "short_answer",
                "body": [{"type": "code", "language": "python", "value": "print('héllo')\nprint(True)"}],
                "answer": {
                    "mode": "text",
                    "value": ["metre", "meter"],
                    "matchMode": "all",
                    "orderedMatch": True,
                    "extraAllowed": False,
                },
                "explanation": [
                    {"type": "table", "header": True, "rows": [["Key", "Value"], ["unit", "metre"]]}
                ],
                "source": {"pdf": "alpha.pdf", "page": 3, "qno": 4},
                "custom": {"nested": [True, None, 3.5, {"line": "a\nb"}]},
            },
            {
                "id": "alpha_self_001",
                "subject": "alpha",
                "unit": 1,
                "year": "2026",
                "type": "structured",
                "body": [{"type": "text", "value": "Explain the method."}],
                "answer": {"mode": "self_mark", "value": None},
                "explanation": [{"type": "text", "value": "Model answer."}],
                "source": {"pdf": "alpha.pdf", "page": 4, "qno": 5},
            },
            {
                "id": "alpha_manual_001",
                "subject": "alpha",
                "unit": 1,
                "year": "2026",
                "type": "written",
                "body": [{"type": "text", "value": "Write a proof."}],
                "answer": {"mode": "manual", "value": None},
                "explanation": [{"type": "text", "value": "Proof outline."}],
                "source": {"pdf": "alpha.pdf", "page": 5, "qno": 6},
            },
        ]
        pack_path = self.write_pack("current_pack.json", valid_pack(questions))
        pack, outcome = self.manager.run_official_validation(pack_path, self.root)
        self.assertTrue(outcome.ok, outcome.errors)
        html = self.quiz_data_path.read_text(encoding="utf-8")
        plan = self.manager.prepare_import_plan(html, pack_path, pack, outcome.warnings, "alpha", "past_paper")
        self.assertFalse(plan.can_apply)
        self.assertEqual(plan.questions, questions)
        with self.assertRaises(RuntimeError):
            self.manager.apply_import_plan(html, plan)
        self.assertEqual(self.read_chunk('alpha')['pastPaper'], [])

    def test_pack_level_stimuli_images_round_trip_and_block_live_apply(self):
        stimuli = {
            "stim_1": {
                "title": "Shared setup",
                "body": [{"type": "text", "value": "Use the diagram."}],
                "images": ["fig_1"],
            }
        }
        images = {"fig_1": {"src": "IMAGES/alpha/fig.png", "alt": "Diagram"}}
        question = single_question("alpha_stim_001")
        question["stimulusId"] = "stim_1"
        question["body"] = []
        pack = valid_pack([question], stimuli=stimuli, images=images)
        self.assertEqual(json.loads(json.dumps(pack, ensure_ascii=False)), pack)
        pack_path = self.write_pack("stim_pack.json", pack)
        loaded, outcome = self.manager.run_official_validation(pack_path, self.root)
        self.assertTrue(outcome.ok, outcome.errors)
        html = self.quiz_data_path.read_text(encoding="utf-8")
        plan = self.manager.prepare_import_plan(html, pack_path, loaded, outcome.warnings, "alpha", "past_paper")
        self.assertFalse(plan.can_apply)
        self.assertIn("stimulusId", plan.questions[0])
        self.assertTrue(any("stimuli" in item for item in plan.apply_blockers))
        self.assertTrue(any("images" in item for item in plan.apply_blockers))

    def test_dry_run_changes_no_files(self):
        pack_path = self.write_pack("dry_run_pack.json", valid_pack([single_question("alpha_dry_001")]))
        before = {path: path.read_bytes() for path in [self.quiz_data_path, self.root / "subject_data" / "alpha.js"]}
        args = types.SimpleNamespace(
            quiz_data=str(self.quiz_data_path),
            import_json=str(pack_path),
            subject="alpha",
            bucket="past_paper",
            unit=None,
            year=None,
            hard=None,
            apply=False,
        )
        with contextlib.redirect_stdout(io.StringIO()):
            code = self.manager.run_noninteractive_import(args)
        self.assertEqual(code, 0)
        after = {path: path.read_bytes() for path in before}
        self.assertEqual(after, before)

    def test_explicit_apply_updates_only_intended_temp_files(self):
        question = {'id': 'alpha_apply_001', 'subject': 'alpha', 'type': 'mcq', 'unit': 1,
                    'year': '2026', 'text': 'Choose one', 'opts': ['A', 'B'], 'ans': 1}
        pack_path = self.write_pack("apply_pack.json", valid_pack([question]))
        beta_before = (self.root / "subject_data" / "beta.js").read_bytes()
        args = types.SimpleNamespace(
            quiz_data=str(self.quiz_data_path),
            import_json=str(pack_path),
            subject="alpha",
            bucket="past_paper",
            unit=None,
            year=None,
            hard=None,
            apply=True,
        )
        with contextlib.redirect_stdout(io.StringIO()):
            code = self.manager.run_noninteractive_import(args)
        self.assertEqual(code, 0)
        self.assertEqual((self.root / "subject_data" / "beta.js").read_bytes(), beta_before)
        self.assertEqual(self.read_chunk("alpha")["pastPaper"][0]["id"], "alpha_apply_001")

    def test_validation_error_blocks_apply(self):
        bad = single_question("alpha_bad_001")
        del bad["body"]
        pack_path = self.write_pack("bad_pack.json", valid_pack([bad]))
        before = (self.root / "subject_data" / "alpha.js").read_bytes()
        args = types.SimpleNamespace(
            quiz_data=str(self.quiz_data_path),
            import_json=str(pack_path),
            subject="alpha",
            bucket="past_paper",
            unit=None,
            year=None,
            hard=None,
            apply=True,
        )
        with contextlib.redirect_stdout(io.StringIO()):
            code = self.manager.run_noninteractive_import(args)
        self.assertEqual(code, 1)
        self.assertEqual((self.root / "subject_data" / "alpha.js").read_bytes(), before)

    def test_missing_id_and_duplicate_across_module_are_rejected(self):
        missing = single_question("alpha_missing_001")
        del missing["id"]
        pack_path = self.write_pack("missing_id.json", valid_pack([missing]))
        _, outcome = self.manager.run_official_validation(pack_path, self.root)
        self.assertFalse(outcome.ok)
        self.assertTrue(any("missing id" in item for item in outcome.errors))

        collision = single_question("shared_collision_001")
        pack_path = self.write_pack("collision.json", valid_pack([collision]))
        pack, outcome = self.manager.run_official_validation(pack_path, self.root)
        self.assertTrue(outcome.ok, outcome.errors)
        html = self.quiz_data_path.read_text(encoding="utf-8")
        plan = self.manager.prepare_import_plan(html, pack_path, pack, outcome.warnings, "alpha", "past_paper")
        self.assertFalse(plan.can_apply)
        self.assertIn("shared_collision_001", plan.duplicate_ids)

    def test_explicit_destination_overrides_appear_in_preview_without_mutating_source(self):
        question = single_question("alpha_override_001")
        pack = valid_pack([question])
        pack_path = self.write_pack("override.json", pack)
        loaded, outcome = self.manager.run_official_validation(pack_path, self.root)
        html = self.quiz_data_path.read_text(encoding="utf-8")
        overrides = self.manager.destination_overrides("normal", force_unit=2, force_year="2027")
        plan = self.manager.prepare_import_plan(html, pack_path, loaded, outcome.warnings, "alpha", "normal", overrides)
        self.assertTrue(any("override unit" in item for item in plan.overrides))
        self.assertTrue(any("override year" in item for item in plan.overrides))
        self.assertTrue(any("add hard" in item for item in plan.overrides))
        self.assertEqual(question["unit"], 1)
        self.assertEqual(question["year"], "2026")
        self.assertNotIn("hard", question)

    def test_live_gate_rejects_invalid_final_payloads_without_writes(self):
        base = {'id': 'alpha_gate_001', 'subject': 'alpha', 'type': 'mcq', 'unit': 1,
                'text': 'Choose one', 'opts': ['A', 'B'], 'ans': 1}
        html = self.quiz_data_path.read_text(encoding='utf-8')
        cases = [dict(base, ans='1'), dict(base, ans=True), dict(base, unit=999),
                 dict(base, opts=['A', {'body': 'B'}]), dict(base, img='None'),
                 dict(base, img='IMAGES/missing.png'), dict(base, subject='beta')]
        for question in cases:
            with self.subTest(question=question):
                plan = self.manager.prepare_import_plan(html, 'memory.json', valid_pack([question]), [], 'alpha', 'past_paper')
                self.assertFalse(plan.can_apply)
                with self.assertRaises(RuntimeError):
                    self.manager.apply_import_plan(html, plan)
        plan = self.manager.prepare_import_plan(html, 'memory.json', valid_pack([base]), [], 'alpha', 'past_paper', {'unit': 999})
        self.assertFalse(plan.can_apply)

    def test_live_gate_rechecks_preview_and_resolves_images(self):
        image = self.root / 'IMAGES' / 'test.png'
        image.parent.mkdir()
        image.write_bytes(b'fixture')
        question = {'id': 'alpha_image_001', 'subject': 'alpha', 'type': 'mcq', 'unit': 1,
                    'year': '2026', 'text': 'Choose one', 'opts': ['A', 'B'], 'ans': 1, 'img': 'IMAGES/test.png'}
        html = self.quiz_data_path.read_text(encoding='utf-8')
        plan = self.manager.prepare_import_plan(html, 'memory.json', valid_pack([question]), [], 'alpha', 'past_paper')
        self.assertTrue(plan.can_apply, plan.apply_blockers)
        plan.questions[0]['ans'] = '1'
        with self.assertRaises(RuntimeError):
            self.manager.apply_import_plan(html, plan)

    def test_block_preview_uses_body_code_math_text(self):
        code_question = {
            "id": "alpha_preview_001",
            "body": [{"type": "code", "language": "python", "value": "for i in range(2):\n    print(i)"}],
        }
        self.assertIn("for i in range", self.manager.question_preview_text(code_question))


if __name__ == "__main__":
    unittest.main()
