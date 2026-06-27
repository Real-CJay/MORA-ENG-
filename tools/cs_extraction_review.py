#!/usr/bin/env python3
"""Review generated CS block JSON without modifying it."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


HTML_TAG_RE = re.compile(
    r"</?\s*(?:a|b|br|code|div|em|i|li|ol|p|pre|span|strong|sub|sup|table|td|th|tr|u|ul)\b[^>]*>",
    re.IGNORECASE,
)
ROMAN_FLAT_RE = re.compile(r"\bI\s*[.)].+\bII\s*[.)].+\bIII\s*[.)]", re.IGNORECASE | re.DOTALL)
PYTHON_KEYWORDS_RE = re.compile(
    r"\b(def|class|for|while|if|elif|else|return|import|from|print|range|len|append|pop|True|False|None)\b"
)
ASSIGNMENT_RE = re.compile(r"(?m)^\s*[A-Za-z_][A-Za-z0-9_\[\].]*\s*=\s*.+$")
PSEUDOCODE_RE = re.compile(
    r"\b(BEGIN|END|ENDIF|END IF|WHILE|FOR EACH|REPEAT|UNTIL|PUSH|POP|ENQUEUE|DEQUEUE)\b",
    re.IGNORECASE,
)


class Review:
    def __init__(self, label: str) -> None:
        self.label = label
        self.issues: dict[str, list[str]] = {
            "missing IDs": [],
            "duplicate IDs": [],
            "missing source pages": [],
            "missing question numbers": [],
            "questions with no options": [],
            "option count not equal to 5": [],
            "code-looking text inside text blocks": [],
            "raw HTML-like tags in explanation blocks": [],
            "I/II/III-looking text flattened into one block": [],
            "suspicious one-line Python code": [],
            "image blocks missing image paths": [],
            "answer index out of range": [],
        }
        self.total_questions = 0
        self.total_defects = 0

    def add(self, category: str, message: str) -> None:
        self.issues[category].append(message)

    @property
    def issue_count(self) -> int:
        return sum(len(items) for items in self.issues.values())


def load_payload(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def normalize_payload(payload: Any) -> tuple[list[dict[str, Any]], list[Any]]:
    if isinstance(payload, dict):
        questions = payload.get("questions", [])
        defects = payload.get("defects", [])
    elif isinstance(payload, list):
        questions = payload
        defects = []
    else:
        return [], []

    if not isinstance(questions, list):
        questions = []
    if not isinstance(defects, list):
        defects = []

    question_dicts = [q for q in questions if isinstance(q, dict)]
    return question_dicts, defects


def question_label(question: dict[str, Any], index: int) -> str:
    qid = question.get("id")
    if isinstance(qid, str) and qid:
        return qid
    source = question.get("source")
    if isinstance(source, dict) and source.get("questionNumber") is not None:
        return f"Q{source.get('questionNumber')}"
    return f"question #{index + 1}"


def block_text(block: dict[str, Any]) -> str:
    for key in ("text", "value", "latex"):
        value = block.get(key)
        if isinstance(value, str):
            return value
    return ""


def iter_blocks(question: dict[str, Any]) -> list[tuple[str, int, dict[str, Any]]]:
    found: list[tuple[str, int, dict[str, Any]]] = []
    for field in ("blocks", "explanationBlocks", "body", "explanation"):
        blocks = question.get(field)
        if not isinstance(blocks, list):
            continue
        for index, block in enumerate(blocks):
            if isinstance(block, dict):
                found.append((field, index, block))
    return found


def looks_like_code(text: str) -> bool:
    if not text:
        return False
    score = 0
    if "\n" in text and (ASSIGNMENT_RE.search(text) or PYTHON_KEYWORDS_RE.search(text)):
        score += 2
    if PYTHON_KEYWORDS_RE.search(text):
        score += 1
    if ASSIGNMENT_RE.search(text):
        score += 1
    if PSEUDOCODE_RE.search(text):
        score += 1
    if re.search(r"\b[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)", text):
        score += 1
    if re.search(r"^\s*(if|for|while|def|class)\b.*:\s*$", text, re.MULTILINE):
        score += 2
    return score >= 2


def suspicious_one_line_python(text: str) -> bool:
    if "\n" in text:
        return False
    if "\\n" in text:
        return True
    indicators = len(PYTHON_KEYWORDS_RE.findall(text))
    if ";" in text:
        return True
    if indicators >= 2:
        return True
    if len(text) > 100 and (ASSIGNMENT_RE.search(text) or PYTHON_KEYWORDS_RE.search(text)):
        return True
    return False


def image_path(block: dict[str, Any]) -> str:
    for key in ("img", "src", "path"):
        value = block.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def review_question(review: Review, question: dict[str, Any], index: int) -> None:
    label = question_label(question, index)
    qid = question.get("id")
    if not isinstance(qid, str) or not qid.strip():
        review.add("missing IDs", label)

    source = question.get("source")
    if not isinstance(source, dict) or source.get("page") in (None, ""):
        review.add("missing source pages", label)
    if not isinstance(source, dict) or source.get("questionNumber") in (None, ""):
        review.add("missing question numbers", label)

    opts = question.get("opts")
    if not isinstance(opts, list) or not opts:
        review.add("questions with no options", label)
        opts_len = 0
    else:
        opts_len = len(opts)
        if opts_len != 5:
            review.add("option count not equal to 5", f"{label}: {opts_len} option(s)")

    ans = question.get("ans")
    if not isinstance(ans, int) or isinstance(ans, bool) or ans < 0 or ans >= opts_len:
        review.add("answer index out of range", f"{label}: ans={ans!r}, options={opts_len}")

    for field, block_index, block in iter_blocks(question):
        kind = block.get("type")
        text = block_text(block)
        block_label = f"{label} {field}[{block_index}]"

        if kind == "text" and looks_like_code(text):
            review.add("code-looking text inside text blocks", block_label)

        if field in {"explanationBlocks", "explanation"} and text and HTML_TAG_RE.search(text):
            review.add("raw HTML-like tags in explanation blocks", block_label)

        if kind == "text" and ROMAN_FLAT_RE.search(text):
            review.add("I/II/III-looking text flattened into one block", block_label)

        if kind == "code" and str(block.get("language", "")).lower() == "python":
            if suspicious_one_line_python(text):
                review.add("suspicious one-line Python code", block_label)

        if kind == "image" and not image_path(block):
            review.add("image blocks missing image paths", block_label)


def review_file(path: Path) -> Review:
    review = Review(str(path))
    payload = load_payload(path)
    questions, defects = normalize_payload(payload)
    review.total_questions = len(questions)
    review.total_defects = len(defects)

    ids = [q.get("id") for q in questions if isinstance(q.get("id"), str) and q.get("id")]
    for qid, count in Counter(ids).items():
        if count > 1:
            review.add("duplicate IDs", f"{qid}: {count} occurrences")

    for index, question in enumerate(questions):
        review_question(review, question, index)

    return review


def find_json_files(paths: list[str]) -> list[Path]:
    found: list[Path] = []
    for raw in paths:
        path = Path(raw)
        if path.is_dir():
            found.extend(sorted(path.rglob("*.json")))
        else:
            found.append(path)
    return found


def print_review(review: Review) -> None:
    print(f"\n{review.label}")
    print(f"  total questions: {review.total_questions}")
    print(f"  total defects: {review.total_defects}")

    if review.issue_count == 0:
        print("  review issues: 0")
        return

    print(f"  review issues: {review.issue_count}")
    for category, items in review.issues.items():
        print(f"  {category}: {len(items)}")
        for item in items:
            print(f"    - {item}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Inspect generated CS block JSON and report likely extraction problems."
    )
    parser.add_argument("paths", nargs="+", help="JSON file(s) or directories to review")
    args = parser.parse_args(argv)

    paths = find_json_files(args.paths)
    if not paths:
        print("No JSON files found.", file=sys.stderr)
        return 1

    exit_code = 0
    for path in paths:
        try:
            review = review_file(path)
        except Exception as exc:
            print(f"\n{path}")
            print(f"  error: {exc}")
            exit_code = 1
            continue
        print_review(review)
        if review.issue_count:
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
