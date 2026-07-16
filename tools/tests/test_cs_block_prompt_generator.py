from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


TOOLS_DIR = Path(__file__).resolve().parents[1]
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import cs_block_prompt_generator as generator


CROPPER_SPEC = importlib.util.spec_from_file_location("pdf_image_extractor", TOOLS_DIR / "pdf_image_extractor.py")
assert CROPPER_SPEC is not None and CROPPER_SPEC.loader is not None
cropper = importlib.util.module_from_spec(CROPPER_SPEC)
CROPPER_SPEC.loader.exec_module(cropper)


def paper() -> generator.PaperSpec:
    return generator.PaperSpec(
        module_name="CS1033 Programming Fundamentals",
        paper_title="Test Paper",
        year_batch="2025",
        id_prefix="cs1033_2025",
        source_pdf_filename="test-paper.pdf",
        answer_source_filename="answers.pdf",
    )


def group(line: str) -> generator.ChunkSpec:
    return generator.parse_package_group(line)


def create_package(root: Path, groups: list[generator.ChunkSpec]) -> None:
    update = generator.prepare_package_update(root, paper(), groups, is_new_package=True)
    generator.commit_package_update(update)


def existing_context(root: Path) -> tuple[generator.PaperSpec, str, dict]:
    is_new, existing_paper, master, plan = generator.package_state(root)
    assert not is_new
    assert existing_paper is not None
    return existing_paper, master, plan


class PackageCreationTests(unittest.TestCase):
    def test_first_chunk_creates_compact_package(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1-4 | normal | pages 3-4 | Independent questions")])

            master = (root / generator.MASTER_FILENAME).read_text(encoding="utf-8")
            plan = json.loads((root / generator.PLAN_FILENAME).read_text(encoding="utf-8"))
            chunks = sorted((root / generator.CHUNKS_DIRNAME).glob("*.json"))
            payload = json.loads(chunks[0].read_text(encoding="utf-8"))

            self.assertEqual(len(chunks), 1)
            self.assertEqual(plan["chunks"][0]["status"], "pending")
            self.assertIn("test-paper.pdf", master)
            self.assertNotIn("test-paper.pdf", chunks[0].read_text(encoding="utf-8"))
            self.assertNotIn("moduleName", payload)
            self.assertNotIn("paperTitle", payload)
            self.assertNotIn("idPrefix", payload)
            self.assertNotIn("parsed", chunks[0].read_text(encoding="utf-8").lower())
            self.assertNotIn("C:\\", master + chunks[0].read_text(encoding="utf-8"))
            self.assertEqual(payload["answerTypes"], ["single_choice"])
            self.assertEqual(
                payload["requiredMasterSections"],
                ["base", "chunk-normal", "text-block", "single-choice-answer", "defects"],
            )

    def test_derived_master_has_paper_specific_question_and_defect_examples(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "25 Batch (2024).pdf"
            source.write_bytes(b"%PDF-test")
            spec = generator.derived_paper_spec(source, "25", "2024")
            root = Path(temp) / "paper"
            update = generator.prepare_package_update(root, spec, [group("1 | normal | page 3 | text")], is_new_package=True)
            generator.commit_package_update(update)
            master = (root / generator.MASTER_FILENAME).read_text(encoding="utf-8")
            chunk = next((root / generator.CHUNKS_DIRNAME).glob("*.json")).read_text(encoding="utf-8")
            self.assertIn("ID format: cs1033_2024_Q<number>", master)
            self.assertIn('"id": "cs1033_2024_Q1"', master)
            self.assertIn('"paper": "25 Batch (2024)"', master)
            self.assertIn('"year": "2024"', master)
            self.assertIn('"reason": "Unreadable source content."', master)
            self.assertIn("physical one-based PDF page", master)
            self.assertIn(source.name, master)
            self.assertNotIn(str(source), master)
            self.assertNotIn("25 Batch (2024)", chunk)
            self.assertNotIn("cs1033_2024_Q1", chunk)

    def test_all_supported_chunk_types_have_known_sections(self) -> None:
        for index, chunk_type in enumerate(sorted(generator.SUPPORTED_GROUP_TYPES), start=1):
            with self.subTest(chunk_type=chunk_type):
                parsed = group(f"{index} | {chunk_type} | page {index + 1} | test")
                self.assertEqual(parsed.answer_types if hasattr(parsed, "answer_types") else ["single_choice"], ["single_choice"])
                self.assertTrue(set(generator.required_master_sections(parsed)).issubset(generator.MASTER_SECTIONS))
                self.assertEqual(generator.build_chunk_payload("001", parsed)["answerTypes"], ["single_choice"])

    def test_dynamic_master_sections_only_append_once(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1 | normal | page 3 | text")])
            for line in (
                "2 | normal_code | page 4 | code",
                "3 | normal_code | page 5 | more code",
                "4 | shared_code | page 6 | shared program",
                "5-6 | shared_flowchart | pages 7-8 | flowchart",
            ):
                existing_paper, master, plan = existing_context(root)
                update = generator.prepare_package_update(
                    root, existing_paper, [group(line)], is_new_package=False,
                    existing_master=master, existing_plan=plan,
                )
                generator.commit_package_update(update)

            master = (root / generator.MASTER_FILENAME).read_text(encoding="utf-8")
            self.assertEqual(master.count("MORA-CS-SECTION:code-block-python:v1"), 1)
            self.assertEqual(master.count("MORA-CS-SECTION:shared-content:v1"), 1)
            self.assertEqual(master.count("MORA-CS-SECTION:image-block:v1"), 1)
            self.assertEqual(master.count("MORA-CS-SECTION:image-manifest:v1"), 1)

    def test_manual_master_text_and_manual_section_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1 | normal | page 3 | text")])
            master_path = root / generator.MASTER_FILENAME
            original = master_path.read_text(encoding="utf-8") + "\nManual project note.  \n"
            master_path.write_text(original, encoding="utf-8")
            original_bytes = master_path.read_bytes()
            existing_paper, master, plan = existing_context(root)
            update = generator.prepare_package_update(
                root, existing_paper, [group("2 | normal_code | page 4 | code")], is_new_package=False,
                existing_master=master, existing_plan=plan,
            )
            generator.commit_package_update(update)
            self.assertTrue(master_path.read_bytes().startswith(original_bytes))
            self.assertTrue(master_path.read_text(encoding="utf-8").startswith(original))

            edited = master_path.read_text(encoding="utf-8").replace(
                "Use one zero-based integer", "Use a carefully verified zero-based integer", 1
            )
            master_path.write_text(edited, encoding="utf-8")
            existing_paper, master, plan = existing_context(root)
            update = generator.prepare_package_update(
                root, existing_paper, [group("3 | shared_code | page 5 | shared")], is_new_package=False,
                existing_master=master, existing_plan=plan,
            )
            self.assertTrue(any("manually edited" in warning for warning in update.warnings))
            generator.commit_package_update(update)
            self.assertIn("carefully verified zero-based integer", master_path.read_text(encoding="utf-8"))

    def test_incompatible_or_malformed_markers_stop_without_writes(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1 | normal | page 3 | text")])
            master_path = root / generator.MASTER_FILENAME
            plan_path = root / generator.PLAN_FILENAME
            before_master = master_path.read_bytes()
            before_plan = plan_path.read_bytes()
            master_path.write_text(
                master_path.read_text(encoding="utf-8").replace("chunk-normal:v1", "chunk-normal:v2", 1),
                encoding="utf-8",
            )
            existing_paper, master, plan = existing_context(root)
            with self.assertRaisesRegex(ValueError, "incompatible version"):
                generator.prepare_package_update(
                    root, existing_paper, [group("2 | normal_code | page 4 | code")], is_new_package=False,
                    existing_master=master, existing_plan=plan,
                )
            self.assertEqual(plan_path.read_bytes(), before_plan)
            self.assertNotEqual(master_path.read_bytes(), before_master)
            self.assertEqual(len(list((root / generator.CHUNKS_DIRNAME).glob("*.json"))), 1)

    def test_duplicate_markers_and_unchanged_master_are_handled_safely(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1 | normal | page 3 | text")])
            master_path = root / generator.MASTER_FILENAME
            existing_paper, master, plan = existing_context(root)
            update = generator.prepare_package_update(
                root, existing_paper, [group("2 | normal | page 4 | more text")], is_new_package=False,
                existing_master=master, existing_plan=plan,
            )
            self.assertFalse(update.master_changed)
            before = master_path.read_bytes()
            generator.commit_package_update(update)
            self.assertEqual(master_path.read_bytes(), before)

            duplicated = master_path.read_text(encoding="utf-8")
            duplicated += "\n" + generator.render_master_section(generator.MASTER_SECTIONS["text-block"])
            master_path.write_text(duplicated, encoding="utf-8")
            existing_paper, master, plan = existing_context(root)
            with self.assertRaisesRegex(ValueError, "duplicate"):
                generator.prepare_package_update(
                    root, existing_paper, [group("3 | normal_code | page 5 | code")], is_new_package=False,
                    existing_master=master, existing_plan=plan,
                )


class ExistingPackageProtectionTests(unittest.TestCase):
    def test_statuses_and_existing_chunks_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1 | normal | page 3 | text")])
            plan_path = root / generator.PLAN_FILENAME
            plan = json.loads(plan_path.read_text(encoding="utf-8"))
            plan["chunks"][0]["status"] = "reviewed"
            plan_path.write_text(json.dumps(plan, indent=2) + "\n", encoding="utf-8")
            old_chunk = root / plan["chunks"][0]["file"]
            old_bytes = old_chunk.read_bytes()

            existing_paper, master, existing_plan = existing_context(root)
            update = generator.prepare_package_update(
                root, existing_paper, [group("2 | normal_code | page 4 | code")], is_new_package=False,
                existing_master=master, existing_plan=existing_plan,
            )
            generator.commit_package_update(update)
            updated = json.loads(plan_path.read_text(encoding="utf-8"))
            self.assertEqual(updated["chunks"][0]["status"], "reviewed")
            self.assertEqual(old_chunk.read_bytes(), old_bytes)
            self.assertEqual(len(updated["chunks"]), 2)

    def test_mismatch_legacy_overlap_and_existing_target_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1-2 | normal | page 3 | text")])
            existing_paper, master, plan = existing_context(root)
            different = generator.PaperSpec(
                module_name="Other", paper_title="Other", year_batch="2025", id_prefix="other", source_pdf_filename="other.pdf"
            )
            with self.assertRaisesRegex(ValueError, "identity"):
                generator.prepare_package_update(root, different, [group("3 | normal | page 4 | text")], is_new_package=False, existing_master=master, existing_plan=plan)
            with self.assertRaisesRegex(ValueError, "overlaps"):
                generator.prepare_package_update(root, existing_paper, [group("2 | normal | page 4 | text")], is_new_package=False, existing_master=master, existing_plan=plan)

            legacy = Path(temp) / "legacy"
            legacy.mkdir()
            (legacy / generator.PLAN_FILENAME).write_text('{"groups": []}\n', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "legacy"):
                generator.package_state(legacy)

    def test_failed_commit_restores_existing_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "paper"
            create_package(root, [group("1 | normal | page 3 | text")])
            existing_paper, master, plan = existing_context(root)
            before_master = (root / generator.MASTER_FILENAME).read_bytes()
            before_plan = (root / generator.PLAN_FILENAME).read_bytes()
            update = generator.prepare_package_update(
                root, existing_paper, [group("2 | normal_code | page 4 | code")], is_new_package=False,
                existing_master=master, existing_plan=plan,
            )
            calls = 0

            def fail_second_replace(source: str, destination: str) -> None:
                nonlocal calls
                calls += 1
                if calls == 2:
                    raise OSError("injected write failure")
                os.replace(source, destination)

            with self.assertRaisesRegex(OSError, "injected"):
                generator.commit_package_update(update, replace_func=fail_second_replace)
            self.assertEqual((root / generator.MASTER_FILENAME).read_bytes(), before_master)
            self.assertEqual((root / generator.PLAN_FILENAME).read_bytes(), before_plan)
            self.assertEqual(len(list((root / generator.CHUNKS_DIRNAME).glob("*.json"))), 1)


class ParsingAndUndoTests(unittest.TestCase):
    def test_source_setup_derives_and_overrides_paper_identity(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "24 Batch(2025).pdf"
            source.write_bytes(b"%PDF-test")
            self.assertEqual(generator.validate_source_pdf_path(str(source)), source)
            self.assertEqual(generator.infer_batch_year_from_filename(source.name), ("24", "2025"))
            spec = generator.derived_paper_spec(source, "25", "2024")
            self.assertEqual(spec.module_name, "CS1033 Programming Fundamentals")
            self.assertEqual(spec.paper_title, "25 Batch (2024)")
            self.assertEqual(spec.year_batch, "2024")
            self.assertEqual(spec.id_prefix, "cs1033_2024")
            self.assertEqual(spec.source_pdf_filename, "24 Batch(2025).pdf")
            self.assertEqual(spec.page_number_convention, "physical one-based PDF pages")
            self.assertEqual(
                generator.package_folder_for("25", "2024", Path(temp) / "packages"),
                Path(temp) / "packages" / "25_Batch_2024",
            )

            with patch("builtins.input", side_effect=[str(source), "", ""]):
                inferred = generator.collect_new_paper_details()
            self.assertIsNotNone(inferred)
            inferred_spec, inferred_batch = inferred
            self.assertEqual(inferred_batch, "24")
            self.assertEqual(inferred_spec.paper_title, "24 Batch (2025)")

            with patch("builtins.input", side_effect=[str(source), "25", "2024"]):
                overridden = generator.collect_new_paper_details()
            self.assertIsNotNone(overridden)
            overridden_spec, overridden_batch = overridden
            self.assertEqual(overridden_batch, "25")
            self.assertEqual(overridden_spec.paper_title, "25 Batch (2024)")

    def test_multiline_variations_and_aggregate_errors(self) -> None:
        text = "  Q1-Q4 | normal | page 3 | first\r\n5\u20136 | normal_code | pages 4-5 | second\n7 | shared-cod | 6 | typo\n8 | normal | no pages | bad"
        groups, issues = generator.parse_group_block(text)
        self.assertEqual([item.question_numbers for item in groups], [[1, 2, 3, 4], [5, 6]])
        self.assertEqual([issue.line_number for issue in issues], [3, 4])
        self.assertIn("did you mean 'shared_code'", issues[0].message)
        self.assertIn("missing PDF page range", issues[1].message)

    def test_all_page_forms_and_unsupported_types(self) -> None:
        self.assertEqual(generator.parse_package_pages("page 3"), (3,))
        self.assertEqual(generator.parse_package_pages("pages 3-4"), (3, 4))
        self.assertEqual(generator.parse_package_pages("3-4"), (3, 4))
        with self.assertRaisesRegex(ValueError, "unsupported"):
            generator.parse_package_group("1 | unknown | 3 | no")

    def test_session_undo_is_one_action_at_a_time(self) -> None:
        session = generator.PackageSession(paper(), [], [])
        for line in ("1 | normal | 3 | one", "2 | normal | 4 | two", "3 | normal | 5 | three"):
            session.add_group(group(line))
        session.terminate_group_entry()
        self.assertEqual(session.undo(), "Group entry reopened.")
        self.assertEqual(len(session.groups), 3)
        self.assertEqual(session.undo(), "Undid the latest change.")
        self.assertEqual([item.question_numbers for item in session.groups], [[1], [2]])
        self.assertEqual(session.undo(), "Undid the latest change.")
        self.assertEqual([item.question_numbers for item in session.groups], [[1]])
        self.assertEqual(session.undo(), "Undid the latest change.")
        self.assertEqual(session.undo(), "Nothing to undo.")
        self.assertTrue(generator.is_back_command("BACK"))
        self.assertTrue(generator.is_back_command("Undo"))
        self.assertFalse(generator.is_exit_command("undo"))

    def test_confirmation_defaults_yes_and_exit_is_separate(self) -> None:
        session = generator.PackageSession(paper(), [group("1 | normal | 3 | one")], [])
        for value, expected in (("", True), ("y", True), ("YES", True), ("n", None), ("No", None), ("exit", None)):
            with self.subTest(value=value):
                with patch("builtins.input", return_value=value):
                    self.assertEqual(generator.ask_package_generation_confirmation(session), expected)


class CropperOutputLocationTests(unittest.TestCase):
    def create_cropper_package(self, root: Path) -> Path:
        package = root / "24_Batch_2025"
        package.mkdir()
        (package / cropper.PACKAGE_MASTER_FILENAME).write_text("master", encoding="utf-8")
        (package / cropper.PACKAGE_PLAN_FILENAME).write_text("{}", encoding="utf-8")
        return package

    def test_package_is_detected_from_json_path_and_selected_package_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            package = self.create_cropper_package(Path(temp))
            json_path = package / "JSON" / "group.json"
            self.assertEqual(cropper.detect_cs_package_folder(json_path), package)
            self.assertEqual(cropper.detect_cs_package_folder(package), package)
            images, output_json = cropper.output_folder_defaults(Path(temp) / "outside.json", package)
            self.assertEqual(images, package / "images")
            self.assertEqual(output_json, package / "JSON")

    def test_package_defaults_use_images_and_json_subfolders(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            package = self.create_cropper_package(Path(temp))
            json_path = package / "JSON" / "group.json"
            images, output_json = cropper.output_folder_defaults(json_path)
            self.assertEqual(images, package / "images")
            self.assertEqual(output_json, package / "JSON")
            self.assertFalse(images.exists())
            self.assertFalse(output_json.exists())

    def test_repo_root_is_rejected_and_unrelated_json_folder_is_not_a_default(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            repo_root = root / "repo"
            unrelated = root / "JSON files"
            with patch.object(cropper, "REPO_ROOT", repo_root):
                with self.assertRaisesRegex(ValueError, "repository root"):
                    cropper.validate_output_folder(repo_root, "Images")
            images, output_json = cropper.output_folder_defaults(unrelated / "group.json")
            self.assertEqual(images, unrelated / "images")
            self.assertEqual(output_json, unrelated / "JSON")
            self.assertNotEqual(output_json, unrelated)

    def test_user_output_overrides_are_accepted_without_creating_folders(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            custom_images = Path(temp) / "custom-images"
            custom_json = Path(temp) / "custom-json"
            with patch("builtins.input", side_effect=[str(custom_images), str(custom_json)]), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(cropper._step_output_folder("Images", Path(temp) / "images"), custom_images)
                self.assertEqual(cropper._step_output_folder("JSON", Path(temp) / "JSON"), custom_json)
            self.assertFalse(custom_images.exists())
            self.assertFalse(custom_json.exists())

    def test_exit_before_confirmation_writes_nothing(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            package = self.create_cropper_package(Path(temp))
            json_path = package / "JSON" / "group.json"
            pdf_path = package / "source.pdf"
            with patch("builtins.input", side_effect=["exit"]), contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(cropper._Exit):
                    cropper.run_extractor(txt_path=json_path, pdf_path=pdf_path)
            self.assertFalse((package / "images").exists())
            self.assertFalse((package / "JSON").exists())


class InteractiveSmokeTests(unittest.TestCase):
    def test_multiline_back_blank_undo_and_default_yes(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "24 Batch(2025).pdf"
            source.write_bytes(b"%PDF-test")
            packages_root = Path(temp) / "packages"
            root = packages_root / "25_Batch_2024"
            answers = [
                str(source), "25", "2024",
                "1 | normal | page 3 | first",
                "2 | normal_code | page 4 | second",
                "3 | shared_code | page 5 | third",
                "",
                "back",
                "back",
                "3 | shared_flowchart | page 5 | replacement",
                "",
                "accept",
                "",
            ]
            output = io.StringIO()
            with patch.object(generator, "DEFAULT_PACKAGE_ROOT", packages_root), patch("builtins.input", side_effect=answers), contextlib.redirect_stdout(output):
                self.assertEqual(generator.generate_extraction_package(), 0)
            plan = json.loads((root / generator.PLAN_FILENAME).read_text(encoding="utf-8"))
            self.assertEqual(len(plan["chunks"]), 3)
            self.assertTrue(all(entry["status"] == "pending" for entry in plan["chunks"]))
            self.assertIn("Group entry reopened.", output.getvalue())
            self.assertIn("Prepared CS extraction package", output.getvalue())

    def test_setup_prompts_are_limited_and_existing_folder_is_protected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "24 Batch(2025).pdf"
            source.write_bytes(b"%PDF-test")
            packages_root = Path(temp) / "packages"
            prompts: list[str] = []
            answers = iter([
                str(source), "25", "2024",
                "1 | normal | page 3 | first", "", "accept", "n",
            ])

            def fake_input(prompt: str) -> str:
                prompts.append(prompt)
                return next(answers)

            with patch.object(generator, "DEFAULT_PACKAGE_ROOT", packages_root), patch("builtins.input", side_effect=fake_input):
                self.assertEqual(generator.generate_extraction_package(), 0)
            setup_prompts = "\n".join(prompts)
            self.assertIn("Source PDF path", setup_prompts)
            self.assertIn("Batch number", setup_prompts)
            self.assertIn("Paper year", setup_prompts)
            for removed in ("Module name", "Paper title", "ID prefix", "filename", "Page-number convention", "Output package folder"):
                self.assertNotIn(removed, setup_prompts)

            target = packages_root / "25_Batch_2024"
            target.mkdir(parents=True)
            sentinel = target / "keep.txt"
            sentinel.write_text("unchanged", encoding="utf-8")
            with patch.object(generator, "DEFAULT_PACKAGE_ROOT", packages_root), patch("builtins.input", side_effect=[str(source), "25", "2024"]):
                self.assertEqual(generator.generate_extraction_package(), 1)
            self.assertEqual(sentinel.read_text(encoding="utf-8"), "unchanged")


if __name__ == "__main__":
    unittest.main()
