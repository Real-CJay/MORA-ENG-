#!/usr/bin/env python3
"""Validate Mora Quiz schemaVersion 2 question packs.

Pure standard-library validator for the block-based question schema. It also
accepts legacy flat questions and reports migration warnings.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Any


VALID_BUCKETS = {"pastUnit", "pastPaper", "targetHard", "targetNormal"}
VALID_QUESTION_TYPES = {
    "mcq",
    "multi_select",
    "numeric",
    "short_answer",
    "structured",
    "written",
    "code_output",
    "matching",
    "image_based",
}
VALID_BLOCK_TYPES = {"text", "math", "image", "code", "table"}
VALID_ANSWER_MODES = {"single", "multiple", "numeric", "text", "self_mark", "manual"}
VALID_MATCH_MODES = {"any", "all"}
VALID_TOLERANCE_TYPES = {"relative", "absolute"}
VALID_STATUS = {"draft", "published"}
UNSAFE_RE = re.compile(r"(<script|<iframe|onclick=|onerror=|javascript:)", re.IGNORECASE)
LETTERS = "abcdefghijklmnopqrstuvwxyz"


class Reporter:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, path: str, message: str) -> None:
        self.errors.append(f"{path}: {message}")

    def warn(self, path: str, message: str) -> None:
        self.warnings.append(f"{path}: {message}")


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def is_http_url(value: str) -> bool:
    return value.startswith("http://") or value.startswith("https://")


def is_local_src(value: str) -> bool:
    if not value or is_http_url(value):
        return False
    return not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", value)


def check_unsafe(value: Any, path: str, reporter: Reporter) -> None:
    if isinstance(value, str) and UNSAFE_RE.search(value):
        reporter.error(path, "unsafe content detected")


def unescaped_dollar_count(value: str) -> int:
    count = 0
    escaped = False
    for ch in value:
        if ch == "\\" and not escaped:
            escaped = True
            continue
        if ch == "$" and not escaped:
            count += 1
        escaped = False
    return count


def math_spans(value: str) -> list[tuple[str, str]]:
    spans: list[tuple[str, str]] = []
    patterns = [
        (r"\\\[(.*?)\\\]", "display"),
        (r"\\\((.*?)\\\)", "inline"),
        (r"(?<!\\)\$\$(.*?)(?<!\\)\$\$", "display-dollar"),
        (r"(?<!\\)\$(.*?)(?<!\\)\$", "inline-dollar"),
    ]
    for pattern, label in patterns:
        for match in re.finditer(pattern, value, flags=re.DOTALL):
            spans.append((label, match.group(1)))
    return spans


def check_katex_text(value: Any, path: str, reporter: Reporter) -> None:
    if not isinstance(value, str):
        return
    if value.count(r"\(") != value.count(r"\)"):
        reporter.warn(path, "unbalanced KaTeX inline delimiters \\( / \\)")
    if value.count(r"\[") != value.count(r"\]"):
        reporter.warn(path, "unbalanced KaTeX display delimiters \\[ / \\]")
    if unescaped_dollar_count(value) % 2 == 1:
        reporter.warn(path, "odd number of unescaped $ math delimiters")
    for _, body in math_spans(value):
        if "<" in body or ">" in body:
            reporter.warn(path, "raw < or > inside math delimiters")


def check_latex(value: Any, path: str, reporter: Reporter) -> None:
    if isinstance(value, str) and ("<" in value or ">" in value):
        reporter.warn(path, "raw < or > inside math delimiters")


def validate_block(block: Any, path: str, images: dict[str, Any], reporter: Reporter) -> None:
    if not isinstance(block, dict):
        reporter.error(path, "block must be an object")
        return

    block_type = block.get("type")
    if block_type not in VALID_BLOCK_TYPES:
        reporter.error(path, f"invalid block type {block_type!r}")
        return

    if block_type == "text":
        value = block.get("value")
        if not isinstance(value, str):
            reporter.error(path, "text block requires string value")
        check_unsafe(value, f"{path}.value", reporter)
        check_katex_text(value, f"{path}.value", reporter)

    elif block_type == "math":
        latex = block.get("latex")
        if not isinstance(latex, str):
            reporter.error(path, "math block requires string latex")
        if "display" in block and not isinstance(block.get("display"), bool):
            reporter.error(path, "math block display must be boolean when present")
        check_unsafe(latex, f"{path}.latex", reporter)
        check_latex(latex, f"{path}.latex", reporter)

    elif block_type == "image":
        asset_id = block.get("assetId")
        if not isinstance(asset_id, str) or not asset_id:
            reporter.error(path, "image block requires assetId")
        elif asset_id not in images:
            reporter.error(path, f"image assetId {asset_id!r} not found in images registry")

    elif block_type == "code":
        value = block.get("value")
        if not isinstance(value, str):
            reporter.error(path, "code block requires string value")
        if "language" in block and not isinstance(block.get("language"), str):
            reporter.error(path, "code block language must be a string when present")
        check_unsafe(value, f"{path}.value", reporter)

    elif block_type == "table":
        rows = block.get("rows")
        if not isinstance(rows, list) or not rows:
            reporter.error(path, "table block requires non-empty rows")
        elif not all(isinstance(row, list) and all(isinstance(cell, str) for cell in row) for row in rows):
            reporter.error(path, "table rows must be arrays of strings")
        if "header" in block and not isinstance(block.get("header"), bool):
            reporter.error(path, "table header must be boolean when present")
        if isinstance(rows, list):
            for r_index, row in enumerate(rows):
                if isinstance(row, list):
                    for c_index, cell in enumerate(row):
                        check_unsafe(cell, f"{path}.rows[{r_index}][{c_index}]", reporter)
                        check_katex_text(cell, f"{path}.rows[{r_index}][{c_index}]", reporter)


def validate_blocks(blocks: Any, path: str, images: dict[str, Any], reporter: Reporter) -> None:
    if not isinstance(blocks, list):
        reporter.error(path, "must be an array of blocks")
        return
    for index, block in enumerate(blocks):
        validate_block(block, f"{path}[{index}]", images, reporter)


def validate_images_registry(images: Any, images_root: str | None, reporter: Reporter) -> dict[str, Any]:
    if images is None:
        return {}
    if not isinstance(images, dict):
        reporter.error("images", "must be an object")
        return {}

    for asset_id, entry in images.items():
        path = f"images.{asset_id}"
        if not isinstance(entry, dict):
            reporter.error(path, "image registry entry must be an object")
            continue
        src = entry.get("src")
        if not isinstance(src, str) or not src:
            reporter.error(path, 'image registry entry missing "src"')
            continue
        check_unsafe(src, f"{path}.src", reporter)
        check_unsafe(entry.get("alt"), f"{path}.alt", reporter)
        if images_root and is_local_src(src):
            full_path = os.path.normpath(os.path.join(images_root, src.replace("/", os.sep)))
            if not os.path.exists(full_path):
                reporter.error(f"{path}.src", f"local image file does not exist: {full_path}")
    return images


def validate_stimuli(stimuli: Any, images: dict[str, Any], reporter: Reporter) -> dict[str, Any]:
    if stimuli is None:
        return {}
    if not isinstance(stimuli, dict):
        reporter.error("stimuli", "must be an object")
        return {}

    for stimulus_id, stimulus in stimuli.items():
        path = f"stimuli.{stimulus_id}"
        if not isinstance(stimulus, dict):
            reporter.error(path, "stimulus must be an object")
            continue
        check_unsafe(stimulus.get("title"), f"{path}.title", reporter)
        if "body" in stimulus:
            validate_blocks(stimulus.get("body"), f"{path}.body", images, reporter)
        for index, asset_id in enumerate(stimulus.get("images") or []):
            if asset_id not in images:
                reporter.error(f"{path}.images[{index}]", f"image assetId {asset_id!r} not found in images registry")
    return stimuli


def is_legacy_question(question: dict[str, Any]) -> bool:
    legacy_keys = {"text", "opts", "ans", "exp", "img", "imgAlt"}
    return bool(legacy_keys.intersection(question)) and "answer" not in question and "body" not in question


def legacy_answer_index(answer: Any) -> int | None:
    if isinstance(answer, int) and not isinstance(answer, bool):
        return answer
    if isinstance(answer, str):
        raw = answer.strip().lower()
        if len(raw) == 1 and raw in LETTERS:
            return LETTERS.index(raw)
        if raw.isdigit():
            return int(raw)
    return None


def validate_legacy_question(
    question: dict[str, Any],
    path: str,
    pack_subject: Any,
    seen_ids: set[str],
    reporter: Reporter,
) -> None:
    reporter.warn(path, "legacy format detected; migrate this question to block schema")
    question_id = question.get("id")
    if not question_id:
        reporter.error(path, "missing id")
    elif question_id in seen_ids:
        reporter.error(path, f"duplicate id {question_id!r}")
    else:
        seen_ids.add(question_id)

    if not question.get("subject") and not pack_subject:
        reporter.error(path, "missing subject")

    question_type = question.get("type", "mcq")
    if question_type not in VALID_QUESTION_TYPES:
        reporter.error(path, f"invalid question type {question_type!r}")

    if question_type == "mcq":
        opts = question.get("opts")
        if not isinstance(opts, list) or not opts:
            reporter.error(path, "legacy mcq has empty opts")
        else:
            answer_index = legacy_answer_index(question.get("ans"))
            if answer_index is None or answer_index < 0 or answer_index >= len(opts):
                reporter.error(path, "legacy mcq ans out of range")

    check_unsafe(question.get("text"), f"{path}.text", reporter)
    check_katex_text(question.get("text"), f"{path}.text", reporter)
    check_unsafe(question.get("exp"), f"{path}.exp", reporter)
    check_katex_text(question.get("exp"), f"{path}.exp", reporter)

    if question.get("img") and not question.get("imgAlt"):
        reporter.warn(path, "legacy img present without imgAlt")
    if not question.get("source"):
        reporter.warn(path, "missing source")
    if not question.get("year") or not question.get("unit"):
        reporter.warn(path, "missing year/unit")


def option_labels(options: Any, path: str, images: dict[str, Any], reporter: Reporter) -> list[str]:
    labels: list[str] = []
    if not isinstance(options, list):
        reporter.error(path, "options must be an array")
        return labels
    for index, option in enumerate(options):
        option_path = f"{path}[{index}]"
        if not isinstance(option, dict):
            reporter.error(option_path, "option must be an object")
            continue
        label = option.get("label")
        if not isinstance(label, str) or not label:
            reporter.error(option_path, "option requires non-empty string label")
        else:
            labels.append(label)
        validate_blocks(option.get("body"), f"{option_path}.body", images, reporter)
    return labels


def validate_answer(answer: Any, labels: list[str], path: str, reporter: Reporter) -> None:
    if not isinstance(answer, dict):
        reporter.error(path, "answer must be an object")
        return

    mode = answer.get("mode")
    value = answer.get("value")
    if mode not in VALID_ANSWER_MODES:
        reporter.error(path, f"invalid answer mode {mode!r}")
        return

    match_mode = answer.get("matchMode")
    if match_mode is not None and match_mode not in VALID_MATCH_MODES:
        reporter.error(path, f"matchMode present but not one of {sorted(VALID_MATCH_MODES)}")
    if ("orderedMatch" in answer or "extraAllowed" in answer) and match_mode != "all":
        reporter.error(path, 'orderedMatch or extraAllowed present without matchMode:"all"')

    if mode == "single":
        if value not in labels:
            reporter.error(path, f"single answer value {value!r} not in option labels")

    elif mode == "multiple":
        if not isinstance(value, list):
            reporter.error(path, "multiple answer value must be an array")
        else:
            for answer_label in value:
                if answer_label not in labels:
                    reporter.error(path, f"multiple answer label {answer_label!r} not in option labels")

    elif mode == "numeric":
        if isinstance(value, list):
            if not value:
                reporter.error(path, "numeric answer value array is empty")
            for index, item in enumerate(value):
                if not is_number(item):
                    reporter.error(f"{path}.value[{index}]", "numeric answer array element is not a number")
            if len(value) >= 2 and match_mode is None:
                reporter.error(path, "numeric answer array with 2+ entries requires matchMode")
        elif not is_number(value):
            reporter.error(path, "numeric answer value is not a number")
        tolerance = answer.get("tolerance")
        if tolerance is not None and (not is_number(tolerance) or tolerance < 0):
            reporter.error(path, "numeric tolerance must be a non-negative number")
        tolerance_type = answer.get("toleranceType")
        if tolerance_type is not None and tolerance_type not in VALID_TOLERANCE_TYPES:
            reporter.error(path, 'numeric toleranceType must be "relative" or "absolute"')

    elif mode == "text":
        if isinstance(value, list):
            if not all(isinstance(item, str) for item in value):
                reporter.error(path, "text answer array must contain only strings")
            if len(value) >= 2 and match_mode is None:
                reporter.error(path, "text answer array with 2+ entries requires matchMode")
        elif not isinstance(value, str):
            reporter.error(path, "text answer value must be a string or array of strings")

    elif mode in {"self_mark", "manual"}:
        if value is not None:
            reporter.error(path, f"{mode} answer value must be null")

    if isinstance(value, str):
        check_unsafe(value, f"{path}.value", reporter)
        check_katex_text(value, f"{path}.value", reporter)
    elif isinstance(value, list):
        for index, item in enumerate(value):
            check_unsafe(item, f"{path}.value[{index}]", reporter)
            check_katex_text(item, f"{path}.value[{index}]", reporter)


def validate_question(
    question: Any,
    index: int,
    pack_subject: Any,
    stimuli: dict[str, Any],
    images: dict[str, Any],
    seen_ids: set[str],
    reporter: Reporter,
) -> None:
    path = f"questions[{index}]"
    if not isinstance(question, dict):
        reporter.error(path, "question must be an object")
        return

    if is_legacy_question(question):
        validate_legacy_question(question, path, pack_subject, seen_ids, reporter)
        return

    question_id = question.get("id")
    if not question_id:
        reporter.error(path, "missing id")
    elif question_id in seen_ids:
        reporter.error(path, f"duplicate id {question_id!r}")
    else:
        seen_ids.add(question_id)

    if not question.get("subject") and not pack_subject:
        reporter.error(path, "missing subject")

    question_type = question.get("type")
    if question_type not in VALID_QUESTION_TYPES:
        reporter.error(path, f"invalid question type {question_type!r}")

    status = question.get("status")
    if status is not None and status not in VALID_STATUS:
        reporter.warn(path, "status not in {draft, published}")
    if not question.get("source"):
        reporter.warn(path, "missing source")
    if not question.get("year") or not question.get("unit"):
        reporter.warn(path, "missing year/unit")

    stimulus_id = question.get("stimulusId")
    has_valid_stimulus = False
    if stimulus_id:
        if stimulus_id not in stimuli:
            reporter.error(path, f"stimulusId {stimulus_id!r} references a stimulus that does not exist")
        else:
            has_valid_stimulus = True

    body = question.get("body")
    if isinstance(body, list) and body:
        validate_blocks(body, f"{path}.body", images, reporter)
    elif not has_valid_stimulus:
        reporter.error(path, "empty body unless a valid stimulusId is set")

    validate_blocks(question.get("explanation", []), f"{path}.explanation", images, reporter)
    answer = question.get("answer")

    labels: list[str] = []
    options = question.get("options")
    if question_type in {"mcq", "multi_select"}:
        if not isinstance(options, list) or len(options) < 2:
            reporter.error(path, "mcq/multi_select requires at least 2 options")
        labels = option_labels(options, f"{path}.options", images, reporter)
        if len(labels) != len(set(labels)):
            reporter.error(path, "duplicate option labels")
    elif options is not None:
        labels = option_labels(options, f"{path}.options", images, reporter)

    validate_answer(answer, labels, f"{path}.answer", reporter)

    if answer and isinstance(answer, dict) and answer.get("mode") in {"self_mark", "manual"}:
        explanation = question.get("explanation")
        if not isinstance(explanation, list) or not explanation:
            reporter.warn(path, "self_mark/manual question has no explanation/model answer")

    for image_index, asset_id in enumerate(question.get("images") or []):
        if asset_id not in images:
            reporter.error(f"{path}.images[{image_index}]", f"image assetId {asset_id!r} not found in images registry")


def validate_pack(pack: Any, images_root: str | None) -> Reporter:
    reporter = Reporter()
    if not isinstance(pack, dict):
        reporter.error("$", "pack must be a JSON object")
        return reporter

    if pack.get("schemaVersion") != 2:
        reporter.error("schemaVersion", "must be 2")
    pack_subject = pack.get("subject")
    if not pack_subject:
        reporter.error("subject", "missing subject")
    bucket = pack.get("bucket")
    if bucket not in VALID_BUCKETS:
        reporter.error("bucket", f"must be one of {sorted(VALID_BUCKETS)}")

    images = validate_images_registry(pack.get("images", {}), images_root, reporter)
    stimuli = validate_stimuli(pack.get("stimuli", {}), images, reporter)

    questions = pack.get("questions")
    if not isinstance(questions, list):
        reporter.error("questions", "must be an array")
        return reporter

    seen_ids: set[str] = set()
    for index, question in enumerate(questions):
        validate_question(question, index, pack_subject, stimuli, images, seen_ids, reporter)

    return reporter


def load_json(path: str) -> tuple[Any, str | None]:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle), None
    except json.JSONDecodeError as exc:
        return None, f"JSON parse error at line {exc.lineno}, column {exc.colno}: {exc.msg}"
    except OSError as exc:
        return None, str(exc)


def print_report(path: str, reporter: Reporter, question_count: int | None) -> None:
    print(f"\n== {path} ==")
    if question_count is not None:
        print(f"Questions: {question_count}")

    if reporter.errors:
        print(f"Errors ({len(reporter.errors)}):")
        for item in reporter.errors:
            print(f"  ERROR: {item}")
    else:
        print("Errors: 0")

    if reporter.warnings:
        print(f"Warnings ({len(reporter.warnings)}):")
        for item in reporter.warnings:
            print(f"  WARNING: {item}")
    else:
        print("Warnings: 0")

    result = "FAIL" if reporter.errors else "PASS"
    print(f"Result: {result}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Validate Mora Quiz schemaVersion 2 question packs.")
    parser.add_argument("packs", nargs="+", help="JSON pack file(s) to validate")
    parser.add_argument("--images-root", help="Optional root path for checking local image src files")
    args = parser.parse_args(argv)

    total_errors = 0
    for path in args.packs:
        pack, load_error = load_json(path)
        if load_error:
            reporter = Reporter()
            reporter.error(path, load_error)
            print_report(path, reporter, None)
            total_errors += 1
            continue

        reporter = validate_pack(pack, args.images_root)
        question_count = len(pack.get("questions", [])) if isinstance(pack, dict) and isinstance(pack.get("questions"), list) else None
        print_report(path, reporter, question_count)
        total_errors += len(reporter.errors)

    return 1 if total_errors else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
