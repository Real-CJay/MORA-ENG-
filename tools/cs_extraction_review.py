#!/usr/bin/env python3
"""Review generated CS block JSON without modifying it."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


ERROR = "ERROR"
WARNING = "WARNING"
INFO = "INFO"
SEVERITIES = (ERROR, WARNING, INFO)

HTML_TAG_RE = re.compile(
    r"</?\s*(?:a|b|br|code|div|em|i|li|ol|p|pre|span|strong|sub|sup|table|td|th|tr|u|ul)\b[^>]*>",
    re.IGNORECASE,
)
ROMAN_FLAT_RE = re.compile(r"\bI\s*[.)].+\bII\s*[.)].+\bIII\s*[.)]", re.IGNORECASE | re.DOTALL)
CODE_KEYWORDS = {
    "BEGIN",
    "END",
    "IF",
    "ELSE",
    "ELIF",
    "FOR",
    "WHILE",
    "RETURN",
    "ENDIF",
    "ENDFOR",
    "ENDWHILE",
    "REPEAT",
    "UNTIL",
    "PUSH",
    "POP",
    "ENQUEUE",
    "DEQUEUE",
}
CODE_LINE_START_RE = re.compile(
    r"^\s*(?:BEGIN|END|IF|ELSE|ELIF|FOR|WHILE|RETURN|ENDIF|ENDFOR|ENDWHILE|REPEAT|UNTIL|PUSH|POP|ENQUEUE|DEQUEUE)\b"
)
ASSIGNMENT_LINE_RE = re.compile(
    "^\\s*[A-Za-z_][A-Za-z0-9_\\[\\].]*\\s*(?:=|<-|:=|\\+=|-=|\\*=|/=|\u2190)\\s*.+$"
)
FUNCTION_DEF_RE = re.compile(r"^\s*(?:def|class)\s+[A-Za-z_][A-Za-z0-9_]*\s*[\(:]", re.MULTILINE)
FUNCTION_CALL_RE = re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)")
INDEX_RE = re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]+\]){1,}")
LEN_RE = re.compile(r"\blen\s*\([^)]*\)")
SUPERSCRIPT_RE = re.compile(r"[A-Za-z][\u00b2\u00b3]|A\u00c2[\u00b2\u00b3]")
PYTHON_KEYWORDS_RE = re.compile(
    r"\b(def|class|for|while|if|elif|else|return|import|from|print|range|len|append|pop|True|False|None)\b"
)
MANIFEST_MARKERS = ("====IMAGES====", "====IMG====", "====IMAGE====")
QUESTION_RANGE_RE = re.compile(r"^(?:Q\s*)?(\d+)\s*[-:]\s*(?:Q\s*)?(\d+)$", re.IGNORECASE)


ISSUE_CATEGORIES = [
    "invalid JSON",
    "missing IDs",
    "duplicate IDs",
    "missing source pages",
    "missing question numbers",
    "questions with no options",
    "option count not equal to 5",
    "code-looking text inside text blocks",
    "code-looking terms inside prose text",
    "raw HTML-like tags in explanation blocks",
    "I/II/III-looking text flattened into one block",
    "suspicious one-line Python code",
    "image blocks missing image paths",
    "image blocks using legacy imgAlt",
    "image blocks missing alt text",
    "question image references missing manifest entries",
    "manifest entries reference missing questions",
    "manifest filenames unused by questions",
    "shared image manifest question mismatch",
    "image references use full paths before crop",
    "duplicate manifest filenames with conflicting metadata",
    "image manifest parse warnings",
    "answer index out of range",
]

CATEGORY_SEVERITY = {
    "invalid JSON": ERROR,
    "missing IDs": ERROR,
    "duplicate IDs": ERROR,
    "missing source pages": ERROR,
    "missing question numbers": ERROR,
    "questions with no options": ERROR,
    "answer index out of range": ERROR,
    "image blocks missing image paths": ERROR,
    "question image references missing manifest entries": ERROR,
    "manifest entries reference missing questions": ERROR,
    "duplicate manifest filenames with conflicting metadata": ERROR,
    "raw HTML-like tags in explanation blocks": ERROR,
    "suspicious one-line Python code": ERROR,
    "code-looking text inside text blocks": ERROR,
    "option count not equal to 5": WARNING,
    "code-looking terms inside prose text": WARNING,
    "I/II/III-looking text flattened into one block": WARNING,
    "image blocks using legacy imgAlt": WARNING,
    "image blocks missing alt text": WARNING,
    "manifest filenames unused by questions": WARNING,
    "shared image manifest question mismatch": WARNING,
    "image references use full paths before crop": WARNING,
    "image manifest parse warnings": WARNING,
}


@dataclass
class Finding:
    severity: str
    category: str
    path: str
    detail: str


@dataclass
class ImageManifestEntry:
    filename: str
    page: str = ""
    questions: list[str] = field(default_factory=list)
    unit: str = ""
    folder: str = ""
    description: str = ""
    source_label: str = ""
    entry_index: int = 0

    @property
    def key(self) -> str:
        return self.filename.strip().lower()

    @property
    def normalized_folder(self) -> str:
        return normalize_manifest_folder(self.folder)

    @property
    def relative_path(self) -> str:
        folder = self.normalized_folder
        return f"{folder}{self.filename}" if folder else self.filename

    def metadata_without_questions(self) -> tuple[str, str, str, str]:
        return (
            self.page.strip(),
            self.unit.strip(),
            self.normalized_folder,
            " ".join(self.description.split()),
        )


@dataclass
class ImageReference:
    question_label: str
    question_index: int
    path: str
    raw: str
    filename: str
    tokens: set[str]
    alt_present: bool


class Review:
    def __init__(self, label: str) -> None:
        self.label = label
        self.issues: dict[str, list[str]] = {category: [] for category in ISSUE_CATEGORIES}
        self.findings: list[Finding] = []
        self.total_questions = 0
        self.total_defects = 0
        self.source_pages: set[int] = set()
        self.question_numbers: set[int] = set()

    def add(
        self,
        category: str,
        message: str,
        *,
        path: str = "",
        detail: str = "",
        severity: str | None = None,
    ) -> None:
        if category not in self.issues:
            self.issues[category] = []
        self.issues[category].append(message)
        finding_severity = severity or CATEGORY_SEVERITY.get(category, WARNING)
        self.findings.append(Finding(finding_severity, category, path, detail or message))

    @property
    def issue_count(self) -> int:
        return len(self.findings)

    @property
    def error_count(self) -> int:
        return sum(1 for finding in self.findings if finding.severity == ERROR)

    @property
    def warning_count(self) -> int:
        return sum(1 for finding in self.findings if finding.severity == WARNING)

    @property
    def info_count(self) -> int:
        return len(self.info_lines())

    def findings_by_severity(self, severity: str) -> list[Finding]:
        return [finding for finding in self.findings if finding.severity == severity]

    def info_lines(self) -> list[str]:
        lines = [
            f"total questions: {self.total_questions}",
            f"total defects: {self.total_defects}",
        ]
        if self.source_pages:
            pages = sorted(self.source_pages)
            lines.append(f"source pages used: {format_number_range(pages)}")
        else:
            lines.append("source pages used: none recorded")
        if self.question_numbers:
            numbers = sorted(self.question_numbers)
            lines.append(f"question number range: {format_number_range(numbers)}")
        else:
            lines.append("question number range: none recorded")
        return lines


def format_number_range(numbers: list[int]) -> str:
    if not numbers:
        return "none"
    ranges: list[str] = []
    start = prev = numbers[0]
    for number in numbers[1:]:
        if number == prev + 1:
            prev = number
            continue
        ranges.append(str(start) if start == prev else f"{start}-{prev}")
        start = prev = number
    ranges.append(str(start) if start == prev else f"{start}-{prev}")
    return ", ".join(ranges)


def split_manifest_text(text: str) -> tuple[str, str]:
    upper_text = text.upper()
    marker_positions: list[tuple[int, str]] = []
    for marker in MANIFEST_MARKERS:
        index = upper_text.find(marker)
        if index != -1:
            marker_positions.append((index, marker))
    if not marker_positions:
        return text, ""

    index, marker = min(marker_positions, key=lambda item: item[0])
    return text[:index], text[index + len(marker):]


def load_json_payload_text(text: str) -> Any:
    json_text, _ = split_manifest_text(text)
    stripped = json_text.lstrip("\ufeff \t\r\n")
    if not stripped:
        raise json.JSONDecodeError("missing JSON payload before image manifest", json_text, 0)
    decoder = json.JSONDecoder()
    payload, _ = decoder.raw_decode(stripped)
    return payload


def load_payload(path: Path) -> Any:
    return load_json_payload_text(path.read_text(encoding="utf-8-sig"))


def normalize_manifest_folder(folder: str) -> str:
    normalized = folder.strip().replace("\\", "/").strip("/")
    return f"{normalized}/" if normalized else ""


def parse_manifest_questions(raw: str) -> list[str]:
    questions: list[str] = []
    for part in re.split(r"[,;]", raw):
        token = part.strip()
        if not token:
            continue
        range_match = QUESTION_RANGE_RE.fullmatch(token)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2))
            if end < start:
                start, end = end, start
            questions.extend(f"Q{number}" for number in range(start, end + 1))
            continue
        questions.append(token)
    return questions


def field_from_manifest_entry(raw: str, name: str) -> str:
    match = re.search(rf"^\s*{re.escape(name)}\s*:\s*(.*?)\s*$", raw, re.MULTILINE | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def parse_image_manifest_text(text: str, source_label: str = "") -> tuple[list[ImageManifestEntry], list[str]]:
    _, manifest_text = split_manifest_text(text)
    if not manifest_text.strip():
        return [], []

    entries: list[ImageManifestEntry] = []
    warnings: list[str] = []
    raw_entries = re.split(r"\n\s*(?:---+|─{3,})\s*\n", manifest_text)

    for raw_index, raw_entry in enumerate(raw_entries, start=1):
        raw = raw_entry.strip()
        if not raw:
            continue
        filename = field_from_manifest_entry(raw, "FILENAME")
        if not filename:
            warnings.append(f"{source_label or 'manifest'} entry {raw_index}: missing FILENAME")
            continue

        entries.append(ImageManifestEntry(
            filename=filename,
            page=field_from_manifest_entry(raw, "PAGE"),
            questions=parse_manifest_questions(field_from_manifest_entry(raw, "QUESTIONS")),
            unit=field_from_manifest_entry(raw, "UNIT"),
            folder=field_from_manifest_entry(raw, "FOLDER"),
            description=field_from_manifest_entry(raw, "DESCRIPTION"),
            source_label=source_label,
            entry_index=raw_index,
        ))

    return entries, warnings


def load_payload_with_manifest(path: Path) -> tuple[Any, list[ImageManifestEntry], list[str]]:
    text = path.read_text(encoding="utf-8-sig")
    payload = load_json_payload_text(text)
    manifest_entries, manifest_warnings = parse_image_manifest_text(text, str(path))
    return payload, manifest_entries, manifest_warnings


def format_image_manifest(entries: list[ImageManifestEntry]) -> str:
    parts: list[str] = []
    for index, entry in enumerate(entries):
        if index:
            parts.extend(["", "---", ""])
        parts.extend([
            f"FILENAME    : {entry.filename}",
            f"PAGE        : {entry.page}",
            f"QUESTIONS   : {', '.join(entry.questions)}",
            f"UNIT        : {entry.unit or 'N/A'}",
            f"FOLDER      : {entry.normalized_folder}",
            f"DESCRIPTION : {entry.description}",
        ])
    return "\n".join(parts).rstrip() + ("\n" if parts else "")


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


def is_sentence_like(text: str) -> bool:
    stripped = " ".join(text.split())
    if not stripped:
        return False
    words = re.findall(r"[A-Za-z]+", stripped)
    return len(words) >= 8 and bool(re.search(r"[.!?]$", stripped))


def code_line_score(line: str) -> int:
    stripped = line.strip()
    if not stripped:
        return 0
    score = 0
    if CODE_LINE_START_RE.match(stripped):
        score += 3
    if ASSIGNMENT_LINE_RE.match(stripped):
        score += 3
    if FUNCTION_DEF_RE.match(stripped):
        score += 3
    if re.match(r"^\s*(?:if|for|while|elif|else|try|except|def|class)\b.*:\s*$", line):
        score += 2
    if stripped.endswith(";"):
        score += 1
    if len(stripped) <= 80 and re.search("[(){}\\[\\]=]|<-|\u2190", stripped):
        score += 1
    return score


def code_text_kind(text: str) -> tuple[str | None, str]:
    """Return ERROR for actual code in text, WARNING for prose code mentions."""
    if not text:
        return None, ""

    lines = [line.rstrip() for line in text.splitlines()]
    nonempty = [line for line in lines if line.strip()]
    line_scores = [code_line_score(line) for line in nonempty]
    code_lines = sum(1 for score in line_scores if score >= 3)
    weak_code_lines = sum(1 for score in line_scores if score > 0)

    if FUNCTION_DEF_RE.search(text):
        return ERROR, "function or class definition appears inside a text block"
    if len(nonempty) >= 2 and code_lines >= 2:
        return ERROR, "multiple lines look like code or pseudocode"
    if len(nonempty) >= 3 and weak_code_lines >= 3 and not is_sentence_like(text):
        return ERROR, "several short lines look code-like"
    if any(line.startswith(("  ", "\t")) and code_line_score(line) >= 2 for line in nonempty):
        return ERROR, "indented code-like line appears inside a text block"
    assignment_count = sum(1 for line in nonempty if ASSIGNMENT_LINE_RE.match(line.strip()))
    if assignment_count >= 2:
        return ERROR, "assignment-heavy text appears inside a text block"
    uppercase_keywords = re.findall(
        r"\b(?:BEGIN|END|IF|FOR|WHILE|RETURN|ENDIF|ENDFOR|ENDWHILE|REPEAT|UNTIL)\b",
        text,
    )
    if len(uppercase_keywords) >= 3 and not is_sentence_like(text):
        return ERROR, "several algorithm keywords appear in code-like form"

    if prose_code_terms(text):
        return WARNING, "normal prose mentions code-like terms; inspect only if actual code was flattened"
    return None, ""


def prose_code_terms(text: str) -> bool:
    if not text:
        return False
    if FUNCTION_CALL_RE.search(text):
        return True
    if INDEX_RE.search(text):
        return True
    if LEN_RE.search(text):
        return True
    if SUPERSCRIPT_RE.search(text):
        return True
    if re.search(r"\b(?:IF|FOR|WHILE|RETURN|BEGIN|END)\b", text):
        return True
    return False


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
    if len(text) > 100 and (ASSIGNMENT_LINE_RE.search(text) or PYTHON_KEYWORDS_RE.search(text)):
        return True
    return False


def image_path(block: dict[str, Any]) -> str:
    for key in ("img", "src", "path", "assetId"):
        value = block.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def source_int(source: dict[str, Any], key: str) -> int | None:
    value = source.get(key)
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())
    return None


def basename_from_image_ref(value: str) -> str:
    cleaned = value.strip().replace("\\", "/")
    return cleaned.rsplit("/", 1)[-1].lower()


def image_ref_has_path(value: str) -> bool:
    cleaned = value.strip()
    return "/" in cleaned or "\\" in cleaned


def canonical_question_token(value: Any) -> str:
    if isinstance(value, bool) or value is None:
        return ""
    raw = str(value).strip()
    if not raw:
        return ""
    if raw.isdigit():
        return f"q{int(raw)}"
    q_match = re.search(r"(?:^|[_\-\s])q(?:uestion)?\s*0*(\d+)$", raw, re.IGNORECASE)
    if q_match:
        return f"q{int(q_match.group(1))}"
    return raw.lower()


def question_id_number(question: dict[str, Any]) -> int | None:
    qid = question.get("id")
    if not isinstance(qid, str):
        return None
    q_match = re.search(r"(?:^|[_-])Q(\d+)$", qid, re.IGNORECASE)
    if q_match:
        return int(q_match.group(1))
    numbers = re.findall(r"\d+", qid)
    if numbers:
        return int(numbers[-1])
    return None


def question_identity_tokens(question: dict[str, Any], index: int) -> set[str]:
    tokens: set[str] = {canonical_question_token(index + 1)}
    qid = question.get("id")
    if isinstance(qid, str) and qid.strip():
        tokens.add(qid.strip().lower())
        canonical_id = canonical_question_token(qid)
        if canonical_id:
            tokens.add(canonical_id)
    source = question.get("source")
    if isinstance(source, dict):
        qno = source_int(source, "questionNumber")
        if qno is not None:
            tokens.add(f"q{qno}")
    id_qno = question_id_number(question)
    if id_qno is not None:
        tokens.add(f"q{id_qno}")
    return {token for token in tokens if token}


def alt_text_present(container: dict[str, Any]) -> bool:
    for key in ("alt", "imgAlt"):
        value = container.get(key)
        if isinstance(value, str) and value.strip():
            return True
    return False


def collect_image_references(questions: list[dict[str, Any]]) -> list[ImageReference]:
    references: list[ImageReference] = []
    for index, question in enumerate(questions):
        label = question_label(question, index)
        tokens = question_identity_tokens(question, index)
        img = question.get("img")
        if isinstance(img, str) and img.strip():
            references.append(ImageReference(
                question_label=label,
                question_index=index,
                path=f"questions[{index}].img",
                raw=img.strip(),
                filename=basename_from_image_ref(img),
                tokens=tokens,
                alt_present=alt_text_present(question),
            ))

        for field, block_index, block in iter_blocks(question):
            if block.get("type") != "image":
                continue
            ref = image_path(block)
            if not ref:
                continue
            references.append(ImageReference(
                question_label=label,
                question_index=index,
                path=f"questions[{index}].{field}[{block_index}]",
                raw=ref,
                filename=basename_from_image_ref(ref),
                tokens=tokens,
                alt_present=alt_text_present(block),
            ))
    return references


def manifest_question_tokens(entry: ImageManifestEntry) -> set[str]:
    tokens: set[str] = set()
    for raw in entry.questions:
        canonical = canonical_question_token(raw)
        if canonical:
            tokens.add(canonical)
        if isinstance(raw, str) and raw.strip():
            tokens.add(raw.strip().lower())
    return tokens


def review_image_manifest_consistency(
    review: Review,
    questions: list[dict[str, Any]],
    entries: list[ImageManifestEntry],
    manifest_warnings: list[str] | None = None,
) -> None:
    for warning in manifest_warnings or []:
        review.add(
            "image manifest parse warnings",
            warning,
            path="====IMAGES====",
            detail=warning,
            severity=WARNING,
        )

    references = collect_image_references(questions)
    manifest_by_filename: dict[str, list[ImageManifestEntry]] = {}
    for entry in entries:
        if entry.key:
            manifest_by_filename.setdefault(entry.key, []).append(entry)

    for filename, same_filename_entries in manifest_by_filename.items():
        metadata = {
            entry.metadata_without_questions()
            for entry in same_filename_entries
        }
        if len(metadata) > 1:
            review.add(
                "duplicate manifest filenames with conflicting metadata",
                filename,
                path="====IMAGES====",
                detail=f"{filename}: duplicate FILENAME rows disagree on PAGE, UNIT, FOLDER, or DESCRIPTION",
            )

    question_tokens: dict[str, str] = {}
    for index, question in enumerate(questions):
        label = question_label(question, index)
        for token in question_identity_tokens(question, index):
            question_tokens.setdefault(token, label)

    refs_by_filename: dict[str, list[ImageReference]] = {}
    for reference in references:
        refs_by_filename.setdefault(reference.filename, []).append(reference)
        if not reference.alt_present:
            review.add(
                "image blocks missing alt text",
                reference.question_label,
                path=reference.path,
                detail="image reference should include alt or imgAlt text",
            )

        matching_entries = manifest_by_filename.get(reference.filename, [])
        if not matching_entries:
            if not entries and image_ref_has_path(reference.raw):
                continue
            review.add(
                "question image references missing manifest entries",
                reference.question_label,
                path=reference.path,
                detail=f"{reference.raw!r} has no matching FILENAME row in ====IMAGES====",
            )
            continue

        for entry in matching_entries:
            if image_ref_has_path(reference.raw) and reference.raw.replace("\\", "/").strip("/") != entry.relative_path.strip("/"):
                review.add(
                    "image references use full paths before crop",
                    reference.question_label,
                    path=reference.path,
                    detail=f"use filename only before cropping: {entry.filename}",
                )
                break

    for filename, same_filename_entries in manifest_by_filename.items():
        matching_refs = refs_by_filename.get(filename, [])
        if not matching_refs:
            review.add(
                "manifest filenames unused by questions",
                filename,
                path="====IMAGES====",
                detail=f"{filename}: manifest FILENAME is not referenced by any question image field",
            )

        used_tokens: set[str] = set()
        used_labels: set[str] = set()
        for reference in matching_refs:
            used_tokens.update(reference.tokens)
            used_labels.add(reference.question_label)

        for entry in same_filename_entries:
            listed_tokens = manifest_question_tokens(entry)
            if not listed_tokens and matching_refs:
                review.add(
                    "shared image manifest question mismatch",
                    entry.filename,
                    path="====IMAGES====",
                    detail=f"{entry.filename}: QUESTIONS is blank but image is used by {', '.join(sorted(used_labels))}",
                )
                continue

            missing_question_tokens = sorted(
                token for token in listed_tokens
                if token not in question_tokens
            )
            for token in missing_question_tokens:
                review.add(
                    "manifest entries reference missing questions",
                    entry.filename,
                    path="====IMAGES====",
                    detail=f"{entry.filename}: QUESTIONS includes {token.upper()} but no matching question was found",
                )

            for reference in matching_refs:
                if listed_tokens and not (reference.tokens & listed_tokens):
                    review.add(
                        "shared image manifest question mismatch",
                        reference.question_label,
                        path=reference.path,
                        detail=f"{entry.filename}: image is used by {reference.question_label}, but QUESTIONS does not list it",
                    )


def review_question(review: Review, question: dict[str, Any], index: int) -> None:
    label = question_label(question, index)
    q_path = f"questions[{index}]"
    qid = question.get("id")
    if not isinstance(qid, str) or not qid.strip():
        review.add("missing IDs", label, path=f"{q_path}.id", detail="missing or blank id")

    source = question.get("source")
    if not isinstance(source, dict):
        review.add("missing source pages", label, path=f"{q_path}.source.page", detail="source object missing")
        review.add("missing question numbers", label, path=f"{q_path}.source.questionNumber", detail="source object missing")
    else:
        page = source_int(source, "page")
        question_number = source_int(source, "questionNumber")
        if page is None:
            review.add("missing source pages", label, path=f"{q_path}.source.page", detail="missing source.page")
        else:
            review.source_pages.add(page)
        if question_number is None:
            review.add(
                "missing question numbers",
                label,
                path=f"{q_path}.source.questionNumber",
                detail="missing source.questionNumber",
            )
        else:
            review.question_numbers.add(question_number)

    opts = question.get("opts")
    if not isinstance(opts, list) or not opts:
        review.add("questions with no options", label, path=f"{q_path}.opts", detail="opts missing or empty")
        opts_len = 0
    else:
        opts_len = len(opts)
        if opts_len != 5:
            review.add(
                "option count not equal to 5",
                f"{label}: {opts_len} option(s)",
                path=f"{q_path}.opts",
                detail=f"expected 5 options unless the source clearly differs; found {opts_len}",
            )

    ans = question.get("ans")
    if not isinstance(ans, int) or isinstance(ans, bool) or ans < 0 or ans >= opts_len:
        review.add(
            "answer index out of range",
            f"{label}: ans={ans!r}, options={opts_len}",
            path=f"{q_path}.ans",
            detail=f"ans={ans!r}, options={opts_len}",
        )

    for field, block_index, block in iter_blocks(question):
        kind = block.get("type")
        text = block_text(block)
        block_path = f"{q_path}.{field}[{block_index}]"
        block_label = f"{label} {field}[{block_index}]"

        if kind == "text":
            severity, reason = code_text_kind(text)
            if severity == ERROR:
                review.add(
                    "code-looking text inside text blocks",
                    block_label,
                    path=f"{block_path}.text",
                    detail=reason,
                    severity=ERROR,
                )
            elif severity == WARNING:
                review.add(
                    "code-looking terms inside prose text",
                    block_label,
                    path=f"{block_path}.text",
                    detail=reason,
                    severity=WARNING,
                )

        if field in {"explanationBlocks", "explanation"} and text and HTML_TAG_RE.search(text):
            review.add(
                "raw HTML-like tags in explanation blocks",
                block_label,
                path=f"{block_path}.text",
                detail="raw HTML-like tag found in explanation block",
            )

        if kind == "text" and ROMAN_FLAT_RE.search(text):
            review.add(
                "I/II/III-looking text flattened into one block",
                block_label,
                path=f"{block_path}.text",
                detail="I/II/III statements may need separate blocks",
            )

        if kind == "code" and str(block.get("language", "")).lower() == "python":
            if suspicious_one_line_python(text):
                review.add(
                    "suspicious one-line Python code",
                    block_label,
                    path=f"{block_path}.text",
                    detail="Python code block may have been flattened onto one line",
                )

        if kind == "image":
            if not image_path(block):
                review.add(
                    "image blocks missing image paths",
                    block_label,
                    path=block_path,
                    detail="image block needs assetId or direct src/img path",
                )
            if "imgAlt" in block and "alt" not in block:
                review.add(
                    "image blocks using legacy imgAlt",
                    block_label,
                    path=f"{block_path}.imgAlt",
                    detail="block images prefer assetId plus registry alt, or direct src/img plus alt",
                )


def review_file(path: Path) -> Review:
    review = Review(str(path))
    payload, manifest_entries, manifest_warnings = load_payload_with_manifest(path)
    questions, defects = normalize_payload(payload)
    review.total_questions = len(questions)
    review.total_defects = len(defects)

    id_locations: dict[str, list[str]] = {}
    for index, question in enumerate(questions):
        qid = question.get("id")
        if isinstance(qid, str) and qid:
            id_locations.setdefault(qid, []).append(f"questions[{index}].id")
    for qid, locations in id_locations.items():
        if len(locations) > 1:
            review.add(
                "duplicate IDs",
                f"{qid}: {len(locations)} occurrences",
                path=", ".join(locations),
                detail=f"duplicate id {qid!r}",
            )

    for index, question in enumerate(questions):
        review_question(review, question, index)

    review_image_manifest_consistency(review, questions, manifest_entries, manifest_warnings)
    return review


def review_parse_error(path: Path, exc: Exception) -> Review:
    review = Review(str(path))
    review.add("invalid JSON", str(exc), path="$", detail=f"could not parse JSON: {exc}", severity=ERROR)
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
    print(f"  {INFO}:")
    for line in review.info_lines():
        print(f"    - {line}")

    for severity in (ERROR, WARNING):
        findings = review.findings_by_severity(severity)
        print(f"  {severity}: {len(findings)}")
        for finding in findings:
            path = f" [{finding.path}]" if finding.path else ""
            print(f"    - {finding.category}{path}: {finding.detail}")

    print()
    print("Decision helper:")
    print(f"ERRORS: {review.error_count}")
    print(f"WARNINGS: {review.warning_count}")
    print(f"INFO: {review.info_count}")
    print()
    if review.error_count == 0:
        print("No blocking errors found.")
    print("Suggested action:")
    if review.error_count:
        print("FIX before accepting because one or more ERROR findings are present.")
    elif review.warning_count:
        print("ACCEPT WITH MANUAL CHECK if the warnings are only prose mentions of code terms.")
        print("FIX if any warning contains actual code/pseudocode that should be a code block.")
    else:
        print("ACCEPT after normal visual inspection.")


def build_correction_prompt(review: Review) -> str:
    lines = [
        "Please correct this Mora Quiz CS extraction JSON.",
        "",
        f"File: {review.label}",
        "",
        "Issue list:",
    ]
    for finding in review.findings:
        lines.append(f"- {finding.severity} | {finding.category} | {finding.path or '(file)'} | {finding.detail}")
    if review.warning_count and review.error_count == 0:
        lines.extend([
            "",
            "Only fix these if they contain actual code/pseudocode. If they are normal prose mentions of code terms, leave them unchanged.",
        ])
    lines.extend([
        "",
        "Rules for fixing:",
        "- Preserve all valid question content and IDs unless an issue explicitly requires a change.",
        "- Move actual Python/code/pseudocode out of text blocks and into code blocks.",
        "- Keep normal prose mentions such as Search(A, i, k), A[i][j], len(A), N^2, i, j, IF, FOR, WHILE, and RETURN as text when they are ordinary sentences.",
        "- Remove raw HTML-like tags from explanationBlocks; use plain text or typed blocks instead.",
        "- Image blocks should use direct filename-only img values before cropping, for example {\"type\":\"image\",\"img\":\"paper_fig1.png\",\"alt\":\"short figure description\"}.",
        "- Keep image alt text in alt or imgAlt; do not leave image blocks without image descriptions.",
        "- If any image filename is referenced, include a matching ====IMAGES==== manifest entry with FILENAME, PAGE, QUESTIONS, UNIT, FOLDER, and DESCRIPTION.",
        "- Reuse the same image filename for shared figures and list every matching question in the manifest QUESTIONS field.",
        "- Do not insert full IMAGES/... paths until after the cropper has saved the image.",
        "- Make answer indexes 0-based and within the options array.",
        "- Keep every question source.page and source.questionNumber present.",
        "",
        "Return the full corrected JSON first.",
        "If images are referenced, append a ====IMAGES==== manifest after the JSON.",
        "First character must be `{`.",
        "No markdown fences.",
    ])
    return "\n".join(lines)


def ask_yes_no(prompt: str, default: bool = False) -> bool:
    suffix = "[Y/n]" if default else "[y/N]"
    try:
        raw = input(f"{prompt} {suffix}: ").strip().lower()
    except EOFError:
        return False
    if not raw:
        return default
    return raw in {"y", "yes"}


def maybe_print_correction_prompt(review: Review) -> None:
    if review.issue_count == 0:
        return
    if not ask_yes_no("Generate correction prompt?", default=False):
        return
    print()
    print("----- CORRECTION PROMPT START -----")
    print(build_correction_prompt(review))
    print("----- CORRECTION PROMPT END -----")


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
            review = review_parse_error(path, exc)
        print_review(review)
        maybe_print_correction_prompt(review)
        if review.error_count:
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
