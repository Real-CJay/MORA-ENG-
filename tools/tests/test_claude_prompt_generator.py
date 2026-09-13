import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "claude_prompt_generator.py"
SPEC = importlib.util.spec_from_file_location("claude_prompt_generator", SCRIPT)
generator = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = generator
SPEC.loader.exec_module(generator)


class ClaudePromptGeneratorTests(unittest.TestCase):
    def test_exact_numeric_guidance_does_not_invent_a_new_mode(self):
        prompt = generator.build_prompt(generator.PromptConfig())
        self.assertIn('mode "numeric" with tolerance 0', prompt)
        self.assertIn('Do not invent a numeric_exact question type or answer mode', prompt)
        self.assertIn('Use nonzero tolerance only', prompt)

    def test_default_output_targets_schema_version_2(self):
        prompt = generator.build_prompt(generator.PromptConfig())
        self.assertIn('"schemaVersion":2', prompt)
        self.assertIn("schemaVersion 2", prompt)
        self.assertNotIn("legacy-compatible flat MCQ prompt", prompt)

    def test_general_module_names_are_accepted(self):
        prompt = generator.build_prompt(
            generator.PromptConfig(
                module_key="future_energy",
                module_label="Future Energy",
                id_prefix="FUTURE_ENERGY",
            )
        )
        self.assertIn('module/dataKey "future_energy"', prompt)
        self.assertIn('"subject":"future_energy"', prompt)
        self.assertIn("Future Energy", prompt)

    def test_computer_science_is_not_required(self):
        prompt = generator.build_prompt(
            generator.PromptConfig(module_key="mechanics", module_label="Mechanics")
        )
        self.assertIn('"subject":"mechanics"', prompt)
        self.assertIn("Computer Science is not required or special", prompt)

    def test_legacy_mode_is_explicit_not_default(self):
        default_prompt = generator.build_prompt(generator.PromptConfig())
        legacy_prompt = generator.build_prompt(generator.PromptConfig(legacy=True))
        self.assertIn("schemaVersion 2", default_prompt)
        self.assertIn("explicit legacy mode", legacy_prompt)
        self.assertIn("JSON array", legacy_prompt)
        self.assertNotIn('{"schemaVersion":2', legacy_prompt)

    def test_prompt_requests_valid_json_only(self):
        prompt = generator.build_prompt(generator.PromptConfig())
        self.assertIn("Return valid JSON only", prompt)
        self.assertIn("No markdown fences", prompt)
        self.assertIn("No commentary", prompt)

    def test_prompt_prohibits_html_blocks(self):
        prompt = generator.build_prompt(generator.PromptConfig())
        self.assertIn("There is no html block type", prompt)
        self.assertIn('Do not output type "html"', prompt)

    def test_selected_block_guidance_is_included(self):
        prompt = generator.build_prompt(
            generator.PromptConfig(
                block_types=("text", "math", "code", "table", "image"),
                auto_block_types=False,
            )
        )
        self.assertIn("Text blocks:", prompt)
        self.assertIn("Math blocks:", prompt)
        self.assertIn("Code blocks:", prompt)
        self.assertIn("Table blocks:", prompt)
        self.assertIn("Image blocks:", prompt)

    def test_fraction_guidance_is_present(self):
        prompt = generator.build_prompt(generator.PromptConfig(block_types=("math",), auto_block_types=False))
        self.assertIn(r"\frac{numerator}{denominator}", prompt)
        self.assertIn("do not use malformed shortcuts", prompt)

    def test_all_validator_answer_modes_can_be_represented(self):
        prompt = generator.build_prompt(
            generator.PromptConfig(answer_modes=generator.VALID_ANSWER_MODES)
        )
        for mode in generator.VALID_ANSWER_MODES:
            self.assertIn(f"- {mode}:", prompt)
        self.assertIn('{"mode":"manual","value":null}', prompt)
        self.assertIn('{"mode":"self_mark","value":null}', prompt)

    def test_unsupported_answer_modes_are_refused(self):
        with self.assertRaises(ValueError):
            generator.parse_answer_modes("single,matching")

    def test_module_prefixed_id_requirements_are_included(self):
        prompt = generator.build_prompt(
            generator.PromptConfig(module_key="materials", id_prefix="MAT2027")
        )
        self.assertIn("globally unique", prompt)
        self.assertIn('start with "MAT2027_"', prompt)

    def test_manual_and_self_mark_null_handling_is_clear(self):
        prompt = generator.build_prompt(
            generator.PromptConfig(answer_modes=("manual", "self_mark"))
        )
        self.assertIn('{"mode":"manual","value":null}', prompt)
        self.assertIn('{"mode":"self_mark","value":null}', prompt)
        self.assertIn("value must be null exactly", prompt)

    def test_pack_level_stimuli_images_limitation_is_explained(self):
        prompt = generator.build_prompt(generator.PromptConfig())
        self.assertIn("pack-level stimuli object or images registry", prompt)
        self.assertIn("quiz_manager currently refuses live apply", prompt)
        self.assertIn("Do not flatten, duplicate, or hide shared context", prompt)

    def test_unicode_and_multiline_source_text_survives(self):
        source = "Line 1\nDelta sigma: Δσ = 5 MPa\nSinhala note: මෝරා"
        prompt = generator.build_prompt(generator.PromptConfig(source_text=source))
        self.assertIn("Line 1", prompt)
        self.assertIn("Δσ = 5 MPa", prompt)
        self.assertIn("මෝරා", prompt)

    def test_output_file_not_overwritten_without_approval(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "prompt.md"
            path.write_text("old", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                generator.write_output_file(path, "new", overwrite=False)
            generator.write_output_file(path, "new", overwrite=True)
            self.assertEqual(path.read_text(encoding="utf-8").strip(), "new")

    def test_missing_clipboard_dependency_does_not_fail(self):
        ok, backend = generator.copy_to_clipboard(
            "test prompt",
            allow_pyperclip=False,
            which=lambda _name: None,
        )
        self.assertFalse(ok)
        self.assertIn("no clipboard backend", backend)

    def test_cli_help_works(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--help"],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("--module", result.stdout)
        self.assertIn("--legacy", result.stdout)
        self.assertIn("--block-types", result.stdout)


if __name__ == "__main__":
    unittest.main()
