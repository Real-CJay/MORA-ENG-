#!/usr/bin/env python3
"""Export lazy-loaded legacy subject chunks to JSON question packs.

The source files assign JSON-compatible object literals to
window.MORA_SUBJECT_CHUNKS["<subject>"]. This script extracts and parses only
that assigned object; it does not execute the JavaScript source.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


BUCKETS = ("pastUnit", "pastPaper", "targetHard", "targetNormal")
ASSIGNMENT_RE = re.compile(
    r"window\.MORA_SUBJECT_CHUNKS\s*\[\s*(['\"])(?P<subject>.*?)\1\s*\]\s*=",
    re.DOTALL,
)


class ExportError(Exception):
    pass


def skip_string(source: str, index: int) -> int:
    quote = source[index]
    index += 1
    while index < len(source):
        ch = source[index]
        if ch == "\\":
            index += 2
            continue
        index += 1
        if ch == quote:
            return index
    raise ExportError("unterminated string while scanning assignment")


def skip_comment(source: str, index: int) -> int:
    if source.startswith("//", index):
        newline = source.find("\n", index + 2)
        return len(source) if newline == -1 else newline + 1
    if source.startswith("/*", index):
        end = source.find("*/", index + 2)
        if end == -1:
            raise ExportError("unterminated block comment while scanning assignment")
        return end + 2
    return index


def find_balanced_object(source: str, start: int) -> str:
    object_start = source.find("{", start)
    if object_start == -1:
        raise ExportError("could not find object literal after MORA_SUBJECT_CHUNKS assignment")

    depth = 0
    index = object_start
    while index < len(source):
        if source[index] in "'\"`":
            index = skip_string(source, index)
            continue
        if source.startswith("//", index) or source.startswith("/*", index):
            index = skip_comment(source, index)
            continue
        if source[index] == "{":
            depth += 1
        elif source[index] == "}":
            depth -= 1
            if depth == 0:
                return source[object_start : index + 1]
        index += 1

    raise ExportError("unterminated object literal in MORA_SUBJECT_CHUNKS assignment")


def extract_subject_chunk(path: Path) -> tuple[str, dict[str, Any]]:
    source = path.read_text(encoding="utf-8")
    match = ASSIGNMENT_RE.search(source)
    if not match:
        raise ExportError(f"{path}: no window.MORA_SUBJECT_CHUNKS assignment found")

    subject = match.group("subject")
    object_text = find_balanced_object(source, match.end())
    try:
        chunk = json.loads(object_text)
    except json.JSONDecodeError as exc:
        raise ExportError(f"{path}: chunk object is not JSON-compatible at line {exc.lineno}, column {exc.colno}: {exc.msg}") from exc

    if not isinstance(chunk, dict):
        raise ExportError(f"{path}: extracted chunk is not an object")

    return subject, chunk


def make_pack(subject: str, bucket: str, questions: list[Any]) -> dict[str, Any]:
    return {
        "schemaVersion": 2,
        "subject": subject,
        "bucket": bucket,
        "stimuli": {},
        "images": {},
        "questions": questions,
    }


def export_subject(path: Path, out_dir: Path) -> list[Path]:
    subject, chunk = extract_subject_chunk(path)
    written: list[Path] = []

    for bucket in BUCKETS:
        questions = chunk.get(bucket, [])
        if not isinstance(questions, list):
            raise ExportError(f"{path}: bucket {bucket!r} is not an array")

        pack_path = out_dir / subject / f"{bucket}.json"
        pack_path.parent.mkdir(parents=True, exist_ok=True)
        pack_path.write_text(
            json.dumps(make_pack(subject, bucket, questions), ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"exported {subject}/{bucket}: {len(questions)} questions -> {pack_path}")
        written.append(pack_path)

    return written


def run_validator(validator: Path, packs: list[Path]) -> int:
    if not packs:
        print("No packs exported; skipping validation.")
        return 0

    print()
    print(f"Validating {len(packs)} exported packs with {validator}...")
    sys.stdout.flush()
    command = [sys.executable, str(validator), *[str(path) for path in packs]]
    completed = subprocess.run(command, check=False)
    return completed.returncode


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Export subject_data/*.js legacy chunks into JSON question packs.")
    parser.add_argument("--source-dir", default="subject_data", help="Directory containing legacy subject chunk JS files")
    parser.add_argument("--out-dir", default="content/question-packs", help="Directory to receive exported JSON packs")
    parser.add_argument("--validator", default="tools/validate_questions.py", help="Question-pack validator to run after export")
    parser.add_argument("--skip-validation", action="store_true", help="Export only; do not run the validator")
    args = parser.parse_args(argv)

    source_dir = Path(args.source_dir)
    out_dir = Path(args.out_dir)
    validator = Path(args.validator)

    if not source_dir.is_dir():
        print(f"ERROR: source directory not found: {source_dir}", file=sys.stderr)
        return 1
    if not args.skip_validation and not validator.is_file():
        print(f"ERROR: validator not found: {validator}", file=sys.stderr)
        return 1

    js_files = sorted(source_dir.glob("*.js"))
    if not js_files:
        print(f"ERROR: no .js files found in {source_dir}", file=sys.stderr)
        return 1

    written: list[Path] = []
    try:
        for path in js_files:
            written.extend(export_subject(path, out_dir))
    except (OSError, ExportError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.skip_validation:
        return 0
    return run_validator(validator, written)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
