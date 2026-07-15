#!/usr/bin/env python3
"""Main CS block-schema extraction workflow tool.

This tool is intentionally CS-specific for the first extraction stage. It keeps
prompt generation, review, and full-paper merge in one user-facing menu so the
normal workflow starts with:

    python tools/cs_block_prompt_generator.py
"""

from __future__ import annotations

import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
import uuid
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

try:
    from cs_extraction_review import (
        ImageManifestEntry,
        Review,
        find_json_files,
        format_image_manifest,
        load_payload_with_manifest,
        maybe_print_correction_prompt,
        normalize_payload,
        print_review,
        review_file,
        review_image_manifest_consistency,
        review_parse_error,
        review_question,
    )
except ImportError:  # pragma: no cover - useful only if imported as a package
    from .cs_extraction_review import (  # type: ignore
        ImageManifestEntry,
        Review,
        find_json_files,
        format_image_manifest,
        load_payload_with_manifest,
        maybe_print_correction_prompt,
        normalize_payload,
        print_review,
        review_file,
        review_image_manifest_consistency,
        review_parse_error,
        review_question,
    )


DEFAULT_MODULE = "CS1033 Programming Fundamentals"
DEFAULT_YEAR = "2024"
SCRIPT_DIR = Path(__file__).resolve().parent
SUPPORTED_GROUP_TYPES = {
    "normal",
    "normal_code",
    "shared_flowchart",
    "shared_code",
    "algorithm_trace",
    "code_table",
    "statement_group",
    "image_question",
    "mixed",
}

GROUP_TYPE_GUIDANCE = {
    "normal": [
        "This group likely contains independent questions.",
        "Use the normal strict CS block rules for each question.",
    ],
    "normal_code": [
        "This group likely contains independent Python/code/output questions.",
        "Keep every Python or code snippet as a code block, never as plain text.",
        "Preserve indentation and line breaks exactly.",
    ],
    "shared_flowchart": [
        "This group likely depends on one shared diagram or flowchart.",
        "Use image blocks for the flowchart if transcription is risky.",
        "Do not repeat the full flowchart inside every question if a shared stimulus block is supported by this prompt style.",
    ],
    "shared_code": [
        "This group likely depends on one shared code or pseudocode block.",
        "Preserve indentation exactly.",
        "Keep the shared code as a code block or shared stimulus, not inline plain text.",
    ],
    "algorithm_trace": [
        "This group likely asks for algorithm tracing or state changes.",
        "Preserve algorithm state and execution order clearly.",
        "Use code and table blocks where appropriate.",
    ],
    "code_table": [
        "This group likely includes code with tabular state, trace tables, or data tables.",
        "Preserve rows and columns.",
        "Use a table block only if the table can be represented cleanly; otherwise use an image block.",
    ],
    "statement_group": [
        "This group likely includes I/II/III or similar statement sets.",
        "Do not flatten I/II/III statements into one paragraph.",
        "Use separate text or list-style blocks for each statement.",
    ],
    "image_question": [
        "This group likely depends on a figure, chart, diagram, or screenshot.",
        "Do not invent image content.",
        "Use image blocks if the figure is needed to answer the question.",
    ],
    "mixed": [
        "This group may contain mixed CS question layouts.",
        "Use the normal strict CS block rules and choose text, code, table, or image blocks based on the source layout.",
    ],
}


@dataclass(frozen=True)
class QuestionGroup:
    q_start: int
    q_end: int
    group_type: str = "mixed"
    page_start: int | None = None
    page_end: int | None = None
    note: str = ""

    @property
    def label(self) -> str:
        if self.q_start == self.q_end:
            return f"Q{self.q_start}"
        return f"Q{self.q_start}-Q{self.q_end}"

    @property
    def filename_slug(self) -> str:
        return f"{self.filename_range}_{self.group_type}"

    @property
    def filename_range(self) -> str:
        if self.q_start == self.q_end:
            return f"Q{self.q_start:03d}"
        return f"Q{self.q_start:03d}-Q{self.q_end:03d}"

    @property
    def pages(self) -> list[int]:
        if self.page_start is None:
            return []
        end = self.page_end if self.page_end is not None else self.page_start
        return list(range(self.page_start, end + 1))

    @property
    def pages_label(self) -> str:
        if self.page_start is None:
            return "not specified"
        end = self.page_end if self.page_end is not None else self.page_start
        if self.page_start == end:
            return f"page {self.page_start}"
        return f"pages {self.page_start}-{end}"


# The package workflow deliberately has its own small model. QuestionGroup and
# the functions below it remain the legacy standalone-Markdown path.
MASTER_FILENAME = "CS_EXTRACTION_MASTER.md"
PLAN_FILENAME = "prompt_plan.json"
CHUNKS_DIRNAME = "chunks"
MASTER_SCHEMA_VERSION = "1.0"
CHUNK_SCHEMA_VERSION = "1.0"
PLAN_SCHEMA_VERSION = "1.0"
ANSWER_TYPES = ("single_choice",)
CONTENT_TYPES = (
    "text",
    "math",
    "code_python",
    "code_pseudocode",
    "table",
    "image",
)


@dataclass(frozen=True)
class MasterSection:
    key: str
    version: str
    body: str


@dataclass(frozen=True)
class PaperSpec:
    module_name: str
    paper_title: str
    year_batch: str
    id_prefix: str
    source_pdf_filename: str
    answer_source_filename: str = ""
    page_number_convention: str = (
        "PDF page = physical one-based PDF page; Printed page = number printed in "
        "the paper; Answer page = physical one-based marking-scheme page."
    )

    def identity(self) -> dict[str, str]:
        return {
            "moduleName": self.module_name,
            "paperTitle": self.paper_title,
            "yearBatch": self.year_batch,
            "idPrefix": self.id_prefix,
            "sourcePdfFilename": self.source_pdf_filename,
            "answerSourceFilename": self.answer_source_filename,
            "pageNumberConvention": self.page_number_convention,
        }

    @classmethod
    def from_identity(cls, value: dict[str, Any]) -> "PaperSpec":
        required = (
            "moduleName",
            "paperTitle",
            "yearBatch",
            "idPrefix",
            "sourcePdfFilename",
            "answerSourceFilename",
            "pageNumberConvention",
        )
        missing = [key for key in required if not isinstance(value.get(key), str)]
        if missing:
            raise ValueError(f"master paper identity is missing: {', '.join(missing)}")
        return cls(
            module_name=value["moduleName"],
            paper_title=value["paperTitle"],
            year_batch=value["yearBatch"],
            id_prefix=value["idPrefix"],
            source_pdf_filename=value["sourcePdfFilename"],
            answer_source_filename=value["answerSourceFilename"],
            page_number_convention=value["pageNumberConvention"],
        )


@dataclass(frozen=True)
class ChunkSpec:
    q_start: int
    q_end: int
    chunk_type: str
    pdf_pages: tuple[int, ...]
    notes: str = ""
    content_types: tuple[str, ...] = ("text",)
    printed_pages: tuple[int, ...] = ()
    answer_pages: tuple[int, ...] = ()
    source_line: int | None = None

    @property
    def question_numbers(self) -> list[int]:
        return list(range(self.q_start, self.q_end + 1))

    @property
    def label(self) -> str:
        if self.q_start == self.q_end:
            return f"Q{self.q_start}"
        return f"Q{self.q_start}-Q{self.q_end}"

    @property
    def filename_range(self) -> str:
        if self.q_start == self.q_end:
            return f"Q{self.q_start:03d}"
        return f"Q{self.q_start:03d}-Q{self.q_end:03d}"

    @property
    def pages_label(self) -> str:
        if len(self.pdf_pages) == 1:
            return str(self.pdf_pages[0])
        return f"{self.pdf_pages[0]}-{self.pdf_pages[-1]}"


@dataclass(frozen=True)
class ParseIssue:
    line_number: int
    message: str

    def display(self) -> str:
        return f"Line {self.line_number}: {self.message}"


@dataclass
class UndoEvent:
    kind: str
    index: int | None = None
    before: Any = None
    after: Any = None


@dataclass
class PackageSession:
    paper: PaperSpec
    groups: list[ChunkSpec]
    history: list[UndoEvent]
    group_entry_open: bool = True
    baseline_history_count: int = 0

    def add_group(self, group: ChunkSpec, insert_at: int | None = None) -> None:
        if insert_at is None:
            insert_at = len(self.groups)
        self.groups.insert(insert_at, group)
        self.history.append(UndoEvent("group_added", insert_at, after=group))

    def edit_group(self, index: int, group: ChunkSpec) -> None:
        before = self.groups[index]
        self.groups[index] = group
        self.history.append(UndoEvent("group_edited", index, before=before, after=group))

    def delete_group(self, index: int) -> None:
        removed = self.groups.pop(index)
        self.history.append(UndoEvent("group_deleted", index, before=removed))

    def replace_groups(self, groups: list[ChunkSpec]) -> None:
        before = list(self.groups)
        self.groups = list(groups)
        self.history.append(UndoEvent("groups_replaced", before=before, after=list(groups)))

    def terminate_group_entry(self) -> None:
        if self.group_entry_open:
            self.group_entry_open = False
            self.history.append(UndoEvent("group_entry_terminated"))

    def undo(self) -> str:
        if len(self.history) <= self.baseline_history_count:
            return "Nothing to undo."
        event = self.history.pop()
        if event.kind == "group_added" and event.index is not None:
            self.groups.pop(event.index)
        elif event.kind == "group_edited" and event.index is not None:
            self.groups[event.index] = event.before
        elif event.kind == "group_deleted" and event.index is not None:
            self.groups.insert(event.index, event.before)
        elif event.kind == "groups_replaced":
            self.groups = list(event.before)
        elif event.kind == "group_entry_terminated":
            self.group_entry_open = True
            return "Group entry reopened."
        else:
            return "Nothing to undo."
        return "Undid the latest change."


@dataclass
class PackageUpdate:
    output_dir: Path
    is_new_package: bool
    master_text: str
    plan_text: str
    chunk_texts: dict[Path, str]
    warnings: list[str]
    source_bytes: dict[Path, bytes]
    master_changed: bool


MASTER_SECTIONS: dict[str, MasterSection] = {
    "base": MasterSection(
        "base", "1",
        "## Universal Extraction Contract\n\n"
        "The attached PDF pages are the source of truth. Preserve wording, option order, "
        "code, tables, figures, and numerical values. Do not invent unreadable content or "
        "unsupported answers. Output JSON only, with zero-based answer indexes. Put unresolved "
        "items in `defects`. Include source paper, PDF page, and question number metadata. Do not "
        "introduce raw HTML blocks.\n\n"
        "Use this extractor envelope:\n\n"
        "```json\n{\n  \"questions\": [],\n  \"defects\": []\n}\n```\n\n"
        "Each valid question uses only `id`, `year`, `source.paper`, `source.page`, "
        "`source.questionNumber`, `blocks`, `opts`, `ans`, and `explanationBlocks`."
    ),
    "defects": MasterSection(
        "defects", "1",
        "## Defects\n\nFor every unresolved item, add a defect with its question number, source "
        "metadata, a concise reason, and a short source excerpt when available."
    ),
    "single-choice-answer": MasterSection(
        "single-choice-answer", "1",
        "## Single-Choice Answers\n\nUse one zero-based integer `ans` index into the question's "
        "`opts` array. Do not infer an answer when the source is unclear."
    ),
    "text-block": MasterSection(
        "text-block", "1",
        "## Text Blocks\n\nUse `{ \"type\": \"text\", \"text\": \"...\" }` for prose. Keep "
        "code, mathematics, tables, and figures in their dedicated block types."
    ),
    "math-block": MasterSection(
        "math-block", "1",
        "## Math Blocks\n\nUse `{ \"type\": \"math\", \"latex\": \"...\" }` when mathematical "
        "notation needs preservation."
    ),
    "code-block-python": MasterSection(
        "code-block-python", "1",
        "## Python Code Blocks\n\nUse `{ \"type\": \"code\", \"language\": \"python\", "
        "\"text\": \"...\" }`. Preserve indentation and line breaks exactly."
    ),
    "code-block-pseudocode": MasterSection(
        "code-block-pseudocode", "1",
        "## Pseudocode Blocks\n\nUse `{ \"type\": \"code\", \"language\": \"pseudocode\", "
        "\"text\": \"...\" }`. Preserve indentation and execution order."
    ),
    "table-block": MasterSection(
        "table-block", "1",
        "## Table Blocks\n\nUse `{ \"type\": \"table\", \"rows\": [[\"Header\"], [\"Value\"]] }` "
        "only when rows and columns can be transcribed reliably; otherwise use an image block."
    ),
    "image-block": MasterSection(
        "image-block", "1",
        "## Image Blocks\n\nUse `{ \"type\": \"image\", \"img\": \"filename.png\", \"alt\": "
        "\"brief description\" }`. Before cropping, `img` must be a filename only."
    ),
    "image-manifest": MasterSection(
        "image-manifest", "1",
        "## Image Manifest\n\nWhen images are needed, append `====IMAGES====` after the JSON. Each "
        "entry must include FILENAME, PAGE, QUESTIONS, UNIT, FOLDER, and DESCRIPTION. Reuse one "
        "filename for shared images and list every question that uses it."
    ),
    "shared-content": MasterSection(
        "shared-content", "1",
        "## Shared Content\n\nPreserve shared code or setup once where the extractor format allows it. "
        "Do not flatten shared material into unrelated prose or invent omitted content."
    ),
    "shared-image": MasterSection(
        "shared-image", "1",
        "## Shared Images\n\nUse the same filename for every question that relies on one figure, and "
        "ensure the image manifest's QUESTIONS field lists all of them."
    ),
}

for _chunk_type in sorted(SUPPORTED_GROUP_TYPES):
    MASTER_SECTIONS[f"chunk-{_chunk_type.replace('_', '-')}"] = MasterSection(
        f"chunk-{_chunk_type.replace('_', '-')}",
        "1",
        f"## Chunk Relationship: {_chunk_type}\n\n"
        + "Extract this group according to its declared relationship type. Keep material shared by "
        "the listed questions consistent and preserve source structure.",
    )

CHUNK_TYPE_SECTIONS: dict[str, tuple[str, ...]] = {
    "algorithm_trace": ("chunk-algorithm-trace",),
    "code_table": ("chunk-code-table",),
    "image_question": ("chunk-image-question",),
    "mixed": ("chunk-mixed",),
    "normal": ("chunk-normal",),
    "normal_code": ("chunk-normal-code",),
    "shared_code": ("chunk-shared-code", "shared-content"),
    "shared_flowchart": ("chunk-shared-flowchart", "shared-image"),
    "statement_group": ("chunk-statement-group",),
}
CONTENT_CAPABILITY_SECTIONS: dict[str, tuple[str, ...]] = {
    "text": ("text-block",),
    "math": ("math-block",),
    "code_python": ("code-block-python",),
    "code_pseudocode": ("code-block-pseudocode",),
    "table": ("table-block",),
    "image": ("image-block", "image-manifest"),
}
ANSWER_CAPABILITY_SECTIONS = {"single_choice": ("single-choice-answer",)}
CHUNK_DEFAULT_CONTENT_TYPES: dict[str, tuple[str, ...]] = {
    "algorithm_trace": ("text", "code_pseudocode", "table"),
    "code_table": ("text", "code_python", "table"),
    "image_question": ("text", "image"),
    "mixed": ("text",),
    "normal": ("text",),
    "normal_code": ("text", "code_python"),
    "shared_code": ("text", "code_python"),
    "shared_flowchart": ("text", "image"),
    "statement_group": ("text",),
}
SECTION_START_RE = re.compile(r"<!-- MORA-CS-SECTION:([a-z0-9-]+):v([0-9]+) -->")
SECTION_END_RE = re.compile(r"<!-- END-MORA-CS-SECTION:([a-z0-9-]+) -->")
PAPER_IDENTITY_RE = re.compile(r"<!-- MORA-CS-PAPER:(\{.*?\}) -->")


def normalize_package_range(raw: str, label: str) -> tuple[int, int]:
    cleaned = raw.strip().replace("\u2013", "-").replace("\u2014", "-")
    match = re.fullmatch(r"(?:q\s*)?(\d+)\s*(?:[-:]\s*(?:q\s*)?(\d+))?", cleaned, re.IGNORECASE)
    if not match:
        raise ValueError(f"missing {label} range")
    start = int(match.group(1))
    end = int(match.group(2) or start)
    if start <= 0 or end <= 0:
        raise ValueError(f"{label} numbers must be positive")
    if end < start:
        start, end = end, start
    return start, end


def parse_package_pages(raw: str) -> tuple[int, ...]:
    cleaned = raw.strip().replace("\u2013", "-").replace("\u2014", "-")
    match = re.fullmatch(r"(?:pages?|p)?\s*(\d+)\s*(?:[-:]\s*(\d+))?", cleaned, re.IGNORECASE)
    if not match:
        raise ValueError("missing PDF page range")
    start = int(match.group(1))
    end = int(match.group(2) or start)
    if start <= 0 or end <= 0:
        raise ValueError("PDF page numbers must be positive")
    if end < start:
        start, end = end, start
    return tuple(range(start, end + 1))


def suggest_chunk_type(raw: str) -> str | None:
    candidates = difflib.get_close_matches(normalize_group_type(raw), sorted(SUPPORTED_GROUP_TYPES), n=1, cutoff=0.75)
    return candidates[0] if candidates else None


def parse_package_group(raw: str, line_number: int | None = None) -> ChunkSpec:
    parts = [part.strip() for part in raw.strip().split("|")]
    if len(parts) < 3:
        raise ValueError("expected format: questions | chunk_type | PDF pages | note")
    q_start, q_end = normalize_package_range(parts[0], "question")
    chunk_type = normalize_group_type(parts[1])
    if chunk_type not in SUPPORTED_GROUP_TYPES:
        suggestion = suggest_chunk_type(parts[1])
        suffix = f"; did you mean {suggestion!r}?" if suggestion else ""
        raise ValueError(f"unsupported chunk type {parts[1]!r}{suffix}")
    pdf_pages = parse_package_pages(parts[2])
    notes = " | ".join(parts[3:]).strip() if len(parts) > 3 else ""
    return ChunkSpec(
        q_start=q_start,
        q_end=q_end,
        chunk_type=chunk_type,
        pdf_pages=pdf_pages,
        notes=notes,
        content_types=CHUNK_DEFAULT_CONTENT_TYPES[chunk_type],
        source_line=line_number,
    )


def parse_group_block(text: str) -> tuple[list[ChunkSpec], list[ParseIssue]]:
    groups: list[ChunkSpec] = []
    issues: list[ParseIssue] = []
    for line_number, raw in enumerate(text.replace("\r\n", "\n").replace("\r", "\n").split("\n"), start=1):
        if not raw.strip():
            continue
        try:
            groups.append(parse_package_group(raw, line_number))
        except ValueError as exc:
            issues.append(ParseIssue(line_number, str(exc)))
    return groups, issues


def required_master_sections(group: ChunkSpec) -> list[str]:
    keys = ["base"]
    keys.extend(CHUNK_TYPE_SECTIONS[group.chunk_type])
    for content_type in group.content_types:
        keys.extend(CONTENT_CAPABILITY_SECTIONS[content_type])
    keys.extend(ANSWER_CAPABILITY_SECTIONS["single_choice"])
    keys.append("defects")
    return list(dict.fromkeys(keys))


def render_master_section(section: MasterSection) -> str:
    return (
        f"<!-- MORA-CS-SECTION:{section.key}:v{section.version} -->\n"
        f"{section.body.strip()}\n"
        f"<!-- END-MORA-CS-SECTION:{section.key} -->"
    )


def inspect_master_sections(text: str) -> tuple[dict[str, tuple[str, str]], list[str], list[str]]:
    """Return marker bodies, hard errors, and manual-edit warnings."""
    events: list[tuple[int, str, re.Match[str]]] = []
    events.extend((match.start(), "start", match) for match in SECTION_START_RE.finditer(text))
    events.extend((match.start(), "end", match) for match in SECTION_END_RE.finditer(text))
    events.sort(key=lambda item: item[0])
    found: dict[str, tuple[str, str]] = {}
    errors: list[str] = []
    warnings: list[str] = []
    open_section: tuple[str, str, int] | None = None

    for _, kind, match in events:
        if kind == "start":
            key, version = match.group(1), match.group(2)
            if open_section is not None:
                errors.append(f"nested or unclosed generated section {open_section[0]!r}")
            if key in found:
                errors.append(f"duplicate generated section {key!r}")
            open_section = (key, version, match.end())
            continue

        key = match.group(1)
        if open_section is None:
            errors.append(f"end marker without start marker for {key!r}")
            continue
        open_key, version, body_start = open_section
        if key != open_key:
            errors.append(f"mismatched generated section markers {open_key!r} and {key!r}")
            open_section = None
            continue
        found[key] = (version, text[body_start:match.start()])
        open_section = None

    if open_section is not None:
        errors.append(f"missing end marker for generated section {open_section[0]!r}")

    for key, (version, body) in found.items():
        known = MASTER_SECTIONS.get(key)
        if known is None:
            errors.append(f"unknown generated section {key!r}")
            continue
        if version != known.version:
            errors.append(
                f"generated section {key!r} uses incompatible version v{version}; expected v{known.version}"
            )
        elif body.replace("\r\n", "\n").strip() != known.body.strip():
            warnings.append(f"generated section {key!r} was manually edited and will be preserved")
    return found, errors, warnings


def build_master_header(paper: PaperSpec) -> str:
    identity = json.dumps(paper.identity(), ensure_ascii=False, separators=(",", ":"))
    answer_line = paper.answer_source_filename or "Not supplied"
    return textwrap.dedent(f"""\
        # CS Extraction Master

        <!-- MORA-CS-MASTER:{MASTER_SCHEMA_VERSION} -->
        <!-- MORA-CS-PAPER:{identity} -->

        ## Paper Identity

        - Module: {paper.module_name}
        - Paper title: {paper.paper_title}
        - Year/batch: {paper.year_batch}
        - Question ID prefix: {paper.id_prefix}
        - Source PDF filename: {paper.source_pdf_filename}
        - Answer/marking-scheme filename: {answer_line}
        - Page-number convention: {paper.page_number_convention}

        PDF page means the physical one-based page in the source PDF. Printed page means the page
        number printed inside the examination paper. Answer page means the physical one-based page
        in the answer or marking-scheme file.
        """).rstrip()


def parse_master_paper(text: str) -> PaperSpec:
    match = PAPER_IDENTITY_RE.search(text)
    if not match:
        raise ValueError("missing MORA-CS paper identity marker")
    try:
        value = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid master paper identity: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError("master paper identity must be an object")
    return PaperSpec.from_identity(value)


def read_text_preserving_newlines(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return handle.read()


def validate_filename(filename: str, label: str) -> str:
    clean = Path(filename.strip().strip('"').strip("'")).name
    if not clean or clean in {".", ".."}:
        raise ValueError(f"{label} filename is required")
    if clean != filename.strip().strip('"').strip("'"):
        raise ValueError(f"{label} must be a filename, not a local path")
    return clean


def contains_local_path(value: str) -> bool:
    return bool(re.search(r"(?:[A-Za-z]:[\\/]|\\\\)", value))


def validate_paper(paper: PaperSpec) -> None:
    for label, value in (
        ("module name", paper.module_name),
        ("paper title", paper.paper_title),
        ("year/batch", paper.year_batch),
        ("ID prefix", paper.id_prefix),
    ):
        if not value.strip():
            raise ValueError(f"{label} is required")
        if contains_local_path(value):
            raise ValueError(f"{label} must not contain a local path")
    validate_filename(paper.source_pdf_filename, "source PDF")
    if paper.answer_source_filename:
        validate_filename(paper.answer_source_filename, "answer source")


def load_new_plan(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"could not read prompt plan: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError("prompt plan must be an object")
    if "groups" in value or "pdfPath" in value:
        raise ValueError("legacy prompt_plan.json detected; select a new sibling package folder")
    if value.get("planSchemaVersion") != PLAN_SCHEMA_VERSION:
        raise ValueError(f"unsupported prompt plan schema {value.get('planSchemaVersion')!r}")
    if value.get("masterFile") != MASTER_FILENAME:
        raise ValueError("prompt plan masterFile does not match the package master")
    chunks = value.get("chunks")
    if not isinstance(chunks, list):
        raise ValueError("prompt plan chunks must be an array")
    seen_ids: set[str] = set()
    for index, entry in enumerate(chunks):
        if not isinstance(entry, dict):
            raise ValueError(f"prompt plan chunks[{index}] must be an object")
        chunk_id = entry.get("chunkId")
        if not isinstance(chunk_id, str) or not re.fullmatch(r"\d{3,}", chunk_id):
            raise ValueError(f"prompt plan chunks[{index}] has an invalid chunkId")
        if chunk_id in seen_ids:
            raise ValueError(f"prompt plan has duplicate chunkId {chunk_id}")
        seen_ids.add(chunk_id)
        if not isinstance(entry.get("file"), str) or not entry["file"].startswith(f"{CHUNKS_DIRNAME}/"):
            raise ValueError(f"prompt plan chunks[{index}] has an invalid file")
        if not isinstance(entry.get("questionNumbers"), list) or not entry["questionNumbers"]:
            raise ValueError(f"prompt plan chunks[{index}] has invalid questionNumbers")
        if entry.get("chunkType") not in SUPPORTED_GROUP_TYPES:
            raise ValueError(f"prompt plan chunks[{index}] has an unsupported chunkType")
        if not isinstance(entry.get("status"), str):
            raise ValueError(f"prompt plan chunks[{index}] is missing status")
    return value


def package_state(output_dir: Path) -> tuple[bool, PaperSpec | None, str, dict[str, Any]]:
    """Read an existing new package without modifying it."""
    if not output_dir.exists():
        return True, None, "", {"planSchemaVersion": PLAN_SCHEMA_VERSION, "masterFile": MASTER_FILENAME, "chunks": []}
    if not output_dir.is_dir():
        raise ValueError(f"output path is not a folder: {output_dir}")
    entries = list(output_dir.iterdir())
    if not entries:
        return True, None, "", {"planSchemaVersion": PLAN_SCHEMA_VERSION, "masterFile": MASTER_FILENAME, "chunks": []}
    master_path = output_dir / MASTER_FILENAME
    plan_path = output_dir / PLAN_FILENAME
    if not master_path.exists() or not plan_path.exists():
        if plan_path.exists():
            try:
                load_new_plan(plan_path)
            except ValueError as exc:
                raise ValueError(str(exc)) from exc
        raise ValueError("output folder is not an empty folder or a complete CS extraction package")
    master_text = read_text_preserving_newlines(master_path)
    paper = parse_master_paper(master_text)
    plan = load_new_plan(plan_path)
    chunks_dir = output_dir / CHUNKS_DIRNAME
    if not chunks_dir.is_dir():
        raise ValueError("existing package is missing its chunks folder")
    for entry in plan["chunks"]:
        if not (output_dir / entry["file"]).is_file():
            raise ValueError(f"existing package is missing chunk file {entry['file']}")
    return False, paper, master_text, plan


def chunk_filename(chunk_id: str, group: ChunkSpec) -> str:
    return f"{chunk_id}_{group.filename_range}_{group.chunk_type}.json"


def page_values_are_valid(values: tuple[int, ...]) -> bool:
    return bool(values) and all(isinstance(value, int) and not isinstance(value, bool) and value > 0 for value in values)


def build_chunk_payload(chunk_id: str, group: ChunkSpec) -> dict[str, Any]:
    shared_content: list[dict[str, Any]] = []
    images: list[dict[str, Any]] = []
    if group.chunk_type == "shared_code":
        shared_content.append({
            "kind": "python_code",
            "usedBy": group.question_numbers,
            "description": group.notes or f"Shared code used by {group.label}.",
        })
    if group.chunk_type in {"shared_flowchart", "image_question"}:
        kind = "flowchart" if group.chunk_type == "shared_flowchart" else "figure"
        stem = f"SHARED_{kind.upper()}_{chunk_id}" if group.chunk_type == "shared_flowchart" else f"Q{group.q_start:03d}_FIG1"
        images.append({
            "kind": kind,
            "sourcePdfPage": group.pdf_pages[0],
            "usedBy": group.question_numbers,
            "suggestedFilename": f"{stem}.png",
            "description": group.notes or f"{kind.title()} used by {group.label}.",
        })
    return {
        "chunkSchemaVersion": CHUNK_SCHEMA_VERSION,
        "masterSchemaVersion": MASTER_SCHEMA_VERSION,
        "chunkId": chunk_id,
        "questionNumbers": group.question_numbers,
        "chunkType": group.chunk_type,
        "contentTypes": list(group.content_types),
        "answerTypes": list(ANSWER_TYPES),
        "requiredMasterSections": required_master_sections(group),
        "pdfPages": list(group.pdf_pages),
        "printedPages": list(group.printed_pages),
        "answerPages": list(group.answer_pages),
        "sharedContent": shared_content,
        "images": images,
        "notes": group.notes,
    }


def validate_chunk_payload(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    question_numbers = payload.get("questionNumbers")
    if not isinstance(question_numbers, list) or not question_numbers or any(
        not isinstance(value, int) or isinstance(value, bool) or value <= 0 for value in question_numbers
    ):
        errors.append("questionNumbers must contain positive integers")
    elif len(question_numbers) != len(set(question_numbers)):
        errors.append("questionNumbers must not contain duplicates")
    if payload.get("chunkType") not in SUPPORTED_GROUP_TYPES:
        errors.append("chunkType is unsupported")
    if payload.get("answerTypes") != ["single_choice"]:
        errors.append("answerTypes must equal ['single_choice']")
    if isinstance(payload.get("notes"), str) and contains_local_path(payload["notes"]):
        errors.append("notes must not contain a local path")
    content_types = payload.get("contentTypes")
    if not isinstance(content_types, list) or not content_types or any(value not in CONTENT_TYPES for value in content_types):
        errors.append("contentTypes contains an unsupported capability")
    for field in ("pdfPages", "printedPages", "answerPages"):
        values = payload.get(field)
        if not isinstance(values, list) or any(
            not isinstance(value, int) or isinstance(value, bool) or value <= 0 for value in values
        ):
            errors.append(f"{field} must contain only positive integers")
    required = payload.get("requiredMasterSections")
    if not isinstance(required, list) or any(key not in MASTER_SECTIONS for key in required):
        errors.append("requiredMasterSections contains an unknown section")
    allowed_questions = set(question_numbers) if isinstance(question_numbers, list) else set()
    for field in ("sharedContent", "images"):
        entries = payload.get(field)
        if not isinstance(entries, list):
            errors.append(f"{field} must be an array")
            continue
        for index, entry in enumerate(entries):
            if not isinstance(entry, dict):
                errors.append(f"{field}[{index}] must be an object")
                continue
            used_by = entry.get("usedBy")
            if not isinstance(used_by, list) or not used_by or not set(used_by).issubset(allowed_questions):
                errors.append(f"{field}[{index}].usedBy must belong to this chunk")
            if field == "images":
                source_page = entry.get("sourcePdfPage")
                if not isinstance(source_page, int) or isinstance(source_page, bool) or source_page <= 0:
                    errors.append(f"images[{index}].sourcePdfPage must be a positive page")
                elif source_page not in payload.get("pdfPages", []):
                    errors.append(f"images[{index}].sourcePdfPage must belong to pdfPages")
                filename = entry.get("suggestedFilename")
                if not isinstance(filename, str) or not re.fullmatch(r"[A-Za-z0-9_.-]+", filename):
                    errors.append(f"images[{index}].suggestedFilename is unsafe")
    return errors


def build_updated_master(existing_text: str, paper: PaperSpec, groups: list[ChunkSpec]) -> tuple[str, list[str]]:
    found, errors, warnings = inspect_master_sections(existing_text) if existing_text else ({}, [], [])
    if errors:
        raise ValueError("; ".join(errors))
    required: list[str] = []
    for group in groups:
        required.extend(required_master_sections(group))
    missing = [key for key in dict.fromkeys(required) if key not in found]
    additions = "\n\n".join(render_master_section(MASTER_SECTIONS[key]) for key in missing)
    if not existing_text:
        text = build_master_header(paper)
        if additions:
            text += "\n\n" + additions
        return text.rstrip() + "\n", warnings
    if additions:
        separator = "\n" if existing_text.endswith("\n") else "\n\n"
        return existing_text + separator + additions + "\n", warnings
    return existing_text, warnings


def existing_question_numbers(plan: dict[str, Any]) -> set[int]:
    values: set[int] = set()
    for entry in plan.get("chunks", []):
        values.update(value for value in entry.get("questionNumbers", []) if isinstance(value, int))
    return values


def prepare_package_update(
    output_dir: Path,
    paper: PaperSpec,
    groups: list[ChunkSpec],
    *,
    is_new_package: bool,
    existing_master: str = "",
    existing_plan: dict[str, Any] | None = None,
) -> PackageUpdate:
    validate_paper(paper)
    if not groups:
        raise ValueError("at least one group is required")
    if existing_master and parse_master_paper(existing_master).identity() != paper.identity():
        raise ValueError("paper identity does not match the existing package folder")
    plan = json.loads(json.dumps(existing_plan or {
        "planSchemaVersion": PLAN_SCHEMA_VERSION,
        "masterFile": MASTER_FILENAME,
        "chunks": [],
    }))
    used_questions = existing_question_numbers(plan)
    existing_ids = {entry["chunkId"] for entry in plan["chunks"]}
    next_id = max((int(value) for value in existing_ids), default=0) + 1
    chunk_texts: dict[Path, str] = {}

    for group in groups:
        overlap = sorted(used_questions.intersection(group.question_numbers))
        if overlap:
            raise ValueError(f"{group.label} overlaps existing question numbers: {overlap}")
        chunk_id = f"{next_id:03d}"
        next_id += 1
        filename = chunk_filename(chunk_id, group)
        chunk_path = output_dir / CHUNKS_DIRNAME / filename
        if chunk_path.exists() or chunk_path in chunk_texts:
            raise ValueError(f"chunk file already exists: {chunk_path}")
        payload = build_chunk_payload(chunk_id, group)
        errors = validate_chunk_payload(payload)
        if errors:
            raise ValueError(f"{group.label}: {'; '.join(errors)}")
        chunk_texts[chunk_path] = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
        plan["chunks"].append({
            "chunkId": chunk_id,
            "file": f"{CHUNKS_DIRNAME}/{filename}",
            "questionNumbers": group.question_numbers,
            "chunkType": group.chunk_type,
            "status": "pending",
        })
        used_questions.update(group.question_numbers)

    master_text, warnings = build_updated_master(existing_master, paper, groups)
    plan_text = json.dumps(plan, indent=2, ensure_ascii=False) + "\n"
    source_bytes: dict[Path, bytes] = {}
    if not is_new_package:
        master_path = output_dir / MASTER_FILENAME
        plan_path = output_dir / PLAN_FILENAME
        source_bytes = {master_path: master_path.read_bytes(), plan_path: plan_path.read_bytes()}
        source_master = source_bytes[master_path].decode("utf-8")
        if source_master != existing_master:
            raise ValueError("master changed while preparing the update")
    return PackageUpdate(
        output_dir,
        is_new_package,
        master_text,
        plan_text,
        chunk_texts,
        warnings,
        source_bytes,
        is_new_package or master_text != existing_master,
    )


def write_text_file(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text)
        handle.flush()
        os.fsync(handle.fileno())


def write_temp_file(path: Path, text: str) -> Path:
    temp_path = path.with_name(f".{path.name}.mora-tmp-{uuid.uuid4().hex}")
    write_text_file(temp_path, text)
    return temp_path


def remove_tree_if_present(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)


def commit_package_update(update: PackageUpdate, replace_func: Callable[[str, str], Any] = os.replace) -> None:
    output_dir = update.output_dir
    if update.is_new_package:
        if output_dir.exists() and any(output_dir.iterdir()):
            raise ValueError("new package output folder is no longer empty")
        selected_empty_folder = output_dir.exists()
        staging = output_dir.with_name(f".{output_dir.name}.mora-package-{uuid.uuid4().hex}")
        try:
            write_text_file(staging / MASTER_FILENAME, update.master_text)
            for target, text in update.chunk_texts.items():
                write_text_file(staging / CHUNKS_DIRNAME / target.name, text)
            write_text_file(staging / PLAN_FILENAME, update.plan_text)
            # Validate the staged files before exposing the package folder.
            staged_master = (staging / MASTER_FILENAME).read_text(encoding="utf-8")
            parse_master_paper(staged_master)
            load_new_plan(staging / PLAN_FILENAME)
            if output_dir.exists():
                output_dir.rmdir()
            replace_func(str(staging), str(output_dir))
        except Exception:
            remove_tree_if_present(staging)
            if selected_empty_folder and not output_dir.exists() and output_dir.parent.exists():
                # Recreate only the known-empty folder that was selected by the user.
                output_dir.mkdir(parents=False, exist_ok=True)
            raise
        return

    master_path = output_dir / MASTER_FILENAME
    plan_path = output_dir / PLAN_FILENAME
    snapshots = update.source_bytes
    if set(snapshots) != {master_path, plan_path}:
        raise ValueError("missing existing-package snapshots")
    if master_path.read_bytes() != snapshots[master_path] or plan_path.read_bytes() != snapshots[plan_path]:
        raise ValueError("package files changed while preparing the update")
    temp_paths: dict[Path, Path] = {}
    created_chunks: list[Path] = []
    replaced_paths: list[Path] = []
    try:
        if update.master_changed:
            temp_paths[master_path] = write_temp_file(master_path, update.master_text)
        temp_paths[plan_path] = write_temp_file(plan_path, update.plan_text)
        for chunk_path, text in update.chunk_texts.items():
            if chunk_path.exists():
                raise ValueError(f"chunk file already exists: {chunk_path}")
            temp_paths[chunk_path] = write_temp_file(chunk_path, text)
        if master_path.read_bytes() != snapshots[master_path] or plan_path.read_bytes() != snapshots[plan_path]:
            raise ValueError("package files changed while preparing the update")
        if update.master_changed:
            replace_func(str(temp_paths[master_path]), str(master_path))
            replaced_paths.append(master_path)
        for chunk_path in update.chunk_texts:
            if chunk_path.exists():
                raise ValueError(f"chunk file appeared during update: {chunk_path}")
            replace_func(str(temp_paths[chunk_path]), str(chunk_path))
            created_chunks.append(chunk_path)
        # Commit the plan last so it never references a missing chunk.
        replace_func(str(temp_paths[plan_path]), str(plan_path))
        replaced_paths.append(plan_path)
    except Exception:
        for chunk_path in created_chunks:
            if chunk_path.exists():
                chunk_path.unlink()
        for path in reversed(replaced_paths):
            restore = write_temp_file(path, snapshots[path].decode("utf-8"))
            os.replace(str(restore), str(path))
        raise
    finally:
        for temp_path in temp_paths.values():
            if temp_path.exists():
                temp_path.unlink()


def package_summary(groups: list[ChunkSpec]) -> None:
    print()
    print("Extraction package groups")
    for index, group in enumerate(groups, start=1):
        print(f"{index}. {group.label}")
        print(f"   Type: {group.chunk_type}")
        print(f"   PDF pages: {group.pages_label}")
        print(f"   Content: {', '.join(group.content_types)}")
        print(f"   Note: {group.notes or '-'}")


def is_back_command(raw: str) -> bool:
    return raw.strip().lower() in {"back", "undo"}


def is_exit_command(raw: str) -> bool:
    return raw.strip().lower() in {"exit", "cancel"}


def collect_new_paper_details() -> PaperSpec | None:
    print()
    print("New CS extraction package")
    print("Type back or undo to revise the previous field. Type exit or cancel to return to the menu.")
    fields = [
        ("module_name", "Module name", DEFAULT_MODULE),
        ("paper_title", "Paper title", ""),
        ("year_batch", "Year or batch", DEFAULT_YEAR),
        ("id_prefix", "Question ID prefix", ""),
        ("source_pdf_filename", "Source PDF filename", ""),
        ("answer_source_filename", "Answer or marking-scheme filename, optional", ""),
        (
            "page_number_convention",
            "Page-number convention",
            PaperSpec.page_number_convention,
        ),
    ]
    values: dict[str, str] = {}
    index = 0
    while index < len(fields):
        key, label, default = fields[index]
        suffix = f" [{default}]" if default else ""
        raw = input(f"{label}{suffix}: ").strip()
        if is_exit_command(raw):
            return None
        if is_back_command(raw):
            if index == 0:
                print("Already at the first paper field.")
            else:
                index -= 1
                values.pop(fields[index][0], None)
            continue
        value = raw or default
        if key == "source_pdf_filename" and not value:
            print("Source PDF filename is required.")
            continue
        try:
            if key in {"source_pdf_filename", "answer_source_filename"} and value:
                value = validate_filename(value, label)
        except ValueError as exc:
            print(exc)
            continue
        if key != "answer_source_filename" and not value:
            print(f"{label} is required.")
            continue
        values[key] = value
        index += 1
    paper = PaperSpec(**values)
    try:
        validate_paper(paper)
    except ValueError as exc:
        print(f"Invalid paper details: {exc}")
        return None
    return paper


def print_group_entry_instructions() -> None:
    print()
    print("Paste all groups below, one group per line.")
    print("Format: questions | chunk_type | PDF pages | note")
    print("Example: 1-4 | shared_flowchart | pages 3-4 | Fig. 1 flowchart")
    print("Press Enter on an empty line or type done when finished.")
    print("Type back or undo to reverse the latest action. Type exit or cancel to stop.")
    print("Supported types: " + ", ".join(sorted(SUPPORTED_GROUP_TYPES)))


def resolve_parse_issues(
    session: PackageSession,
    issues: list[ParseIssue],
) -> bool:
    pending = {issue.line_number: issue for issue in issues}
    while pending:
        print()
        print("Some pasted lines need correction:")
        for issue in pending.values():
            print(f"  {issue.display()}")
        command = input("fix <line>, delete <line>, add, replace, back, or cancel: ").strip()
        if is_exit_command(command):
            return False
        if is_back_command(command):
            print(session.undo())
            continue
        lower = command.lower()
        if lower == "add":
            raw = input("Group line: ")
            try:
                session.add_group(parse_package_group(raw))
            except ValueError as exc:
                print(f"Could not add group: {exc}")
            continue
        if lower == "replace":
            session.replace_groups([])
            pending.clear()
            session.group_entry_open = True
            return True
        match = re.fullmatch(r"(fix|delete)\s+(\d+)", lower)
        if not match:
            print("Use fix <line>, delete <line>, add, replace, back, or cancel.")
            continue
        action, raw_line = match.groups()
        line_number = int(raw_line)
        if line_number not in pending:
            print(f"Line {line_number} is not awaiting correction.")
            continue
        if action == "delete":
            pending.pop(line_number)
            continue
        replacement = input(f"Replacement for line {line_number}: ")
        try:
            insert_at = sum(
                1 for group in session.groups
                if group.source_line is not None and group.source_line < line_number
            )
            session.add_group(parse_package_group(replacement, line_number), insert_at)
        except ValueError as exc:
            pending[line_number] = ParseIssue(line_number, str(exc))
        else:
            pending.pop(line_number)
    return True


def collect_package_groups(session: PackageSession) -> bool:
    print_group_entry_instructions()
    raw_lines: list[str] = []
    while session.group_entry_open:
        raw = input("Group: ")
        if is_exit_command(raw):
            return False
        if is_back_command(raw):
            print(session.undo())
            continue
        if raw.strip().lower() == "done" or not raw.strip():
            if raw_lines:
                groups, issues = parse_group_block("\n".join(raw_lines))
                for group in groups:
                    session.add_group(group)
                raw_lines.clear()
                if issues and not resolve_parse_issues(session, issues):
                    return False
                if not session.groups:
                    continue
            if not session.groups:
                print("No groups entered yet.")
                continue
            session.terminate_group_entry()
            return True
        raw_lines.append(raw)
    return True


def edit_group_from_prompt(session: PackageSession, index: int) -> None:
    current = session.groups[index]
    print(f"Current group: {current.label} | {current.chunk_type} | pages {current.pages_label} | {current.notes or '-'}")
    raw = input("Replacement group line, or back to keep it: ")
    if is_back_command(raw):
        return
    if is_exit_command(raw):
        return
    try:
        replacement = parse_package_group(raw, current.source_line)
    except ValueError as exc:
        print(f"Could not edit group: {exc}")
        return
    session.edit_group(index, replacement)


def preview_package_groups(session: PackageSession) -> bool:
    while True:
        package_summary(session.groups)
        raw = input("accept, edit <number>, delete <number>, add, replace, back, or cancel: ").strip()
        if raw.lower() == "accept":
            return True
        if is_exit_command(raw):
            return False
        if is_back_command(raw):
            print(session.undo())
            if session.group_entry_open:
                return False
            continue
        if raw.lower() == "add":
            session.group_entry_open = True
            return False
        if raw.lower() == "replace":
            session.replace_groups([])
            session.group_entry_open = True
            return False
        match = re.fullmatch(r"(edit|delete)\s+(\d+)", raw.lower())
        if not match:
            print("Use accept, edit <number>, delete <number>, add, replace, back, or cancel.")
            continue
        action, raw_index = match.groups()
        index = int(raw_index) - 1
        if index < 0 or index >= len(session.groups):
            print("That group number does not exist.")
            continue
        if action == "edit":
            edit_group_from_prompt(session, index)
        else:
            session.delete_group(index)
            if not session.groups:
                session.group_entry_open = True
                return False


def ask_package_generation_confirmation(session: PackageSession) -> bool | None:
    while True:
        raw = input("Generate extraction package files for these groups? [Y/n]: ").strip()
        if is_exit_command(raw):
            return None
        if is_back_command(raw):
            print(session.undo())
            return False
        if not raw or raw.lower() in {"y", "yes"}:
            return True
        if raw.lower() in {"n", "no"}:
            return None
        print("Enter y, yes, n, no, back, undo, exit, or cancel.")


def generate_extraction_package() -> int:
    print("CS Extraction Package Generator")
    print("Creates one compact package folder for one paper. PDF pages remain the AI source of truth.")
    output_default = str(Path("..") / "AI exports" / "cs_packages" / "new_paper")
    raw_output = input(f"Output package folder [{output_default}]: ").strip()
    if is_exit_command(raw_output):
        return 0
    output_dir = normalize_path(raw_output or output_default)
    try:
        is_new, existing_paper, existing_master, existing_plan = package_state(output_dir)
    except ValueError as exc:
        print(f"Cannot use output folder: {exc}")
        return 1

    if is_new:
        paper = collect_new_paper_details()
        if paper is None:
            return 0
    else:
        assert existing_paper is not None
        paper = existing_paper
        print()
        print(f"Reusing existing package for: {paper.paper_title} ({paper.year_batch})")
        print(f"Source PDF filename: {paper.source_pdf_filename}")

    session = PackageSession(paper=paper, groups=[], history=[])
    while True:
        if session.group_entry_open:
            if not collect_package_groups(session):
                print("Package generation cancelled. No files were written.")
                return 0
        if not preview_package_groups(session):
            if session.group_entry_open:
                continue
            print("Package generation cancelled. No files were written.")
            return 0
        decision = ask_package_generation_confirmation(session)
        if decision is False:
            if session.group_entry_open:
                continue
            continue
        if decision is None:
            print("Package generation cancelled. No files were written.")
            return 0
        break

    try:
        update = prepare_package_update(
            output_dir,
            paper,
            session.groups,
            is_new_package=is_new,
            existing_master=existing_master,
            existing_plan=existing_plan,
        )
        for warning in update.warnings:
            print(f"Warning: {warning}")
        commit_package_update(update)
    except (OSError, ValueError) as exc:
        print(f"Package files were not written: {exc}")
        return 1

    print()
    print(f"Prepared CS extraction package: {output_dir}")
    print(f"  {output_dir / MASTER_FILENAME}")
    print(f"  {output_dir / PLAN_FILENAME}")
    for path in update.chunk_texts:
        print(f"  {path}")
    return 0


def ask(prompt: str, default: str | None = None) -> str:
    suffix = f" [{default}]" if default not in (None, "") else ""
    value = input(f"{prompt}{suffix}: ").strip()
    return value if value else (default or "")


def normalize_path(raw: str) -> Path:
    return Path(raw.strip().strip('"').strip("'")).expanduser()


def normalize_group_type(raw: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", raw.strip().lower()).strip("_")


def parse_question_range(raw: str) -> tuple[int, int]:
    match = re.fullmatch(r"(?:q\s*)?(\d+)\s*(?:[-:]\s*(?:q\s*)?(\d+))?", raw.strip(), re.IGNORECASE)
    if not match:
        raise ValueError("missing question range")
    start = int(match.group(1))
    end = int(match.group(2) or start)
    if end < start:
        start, end = end, start
    return start, end


def parse_pages(raw: str) -> tuple[int | None, int | None]:
    raw = raw.strip()
    if not raw:
        return None, None
    match = re.search(r"(?:pages?|p)?\s*(\d+)\s*(?:[-:]\s*(\d+))?", raw, re.IGNORECASE)
    if not match:
        raise ValueError("missing page range")
    start = int(match.group(1))
    end = int(match.group(2) or start)
    if end < start:
        start, end = end, start
    return start, end


def parse_group(raw: str) -> QuestionGroup:
    """Parse 'range | type | pages | note'."""
    parts = [part.strip() for part in raw.strip().split("|")]
    if len(parts) < 3:
        raise ValueError("expected format: range | type | pages | note")

    q_start, q_end = parse_question_range(parts[0])
    group_type = normalize_group_type(parts[1])
    page_start, page_end = parse_pages(parts[2])
    note = " | ".join(parts[3:]).strip() if len(parts) > 3 else ""

    return QuestionGroup(q_start, q_end, group_type, page_start, page_end, note)


def collect_groups() -> list[QuestionGroup]:
    print()
    print("Enter question groups one by one.")
    print("Press Enter on a blank line when finished.")
    print()
    print("Format:")
    print("  range | type | pages | note")
    print()
    print("Examples:")
    print("  1-4 | shared_flowchart | pages 3-4 | Fig. 1 flowchart")
    print("  8-10 | shared_code | pages 5-6 | recursive Search(A, i, k)")
    print("  11-20 | normal_code | pages 6-9 | independent code/output questions")
    print("  51-55 | shared_code | pages 18-20 | Stack class")
    print("  60-61 | algorithm_trace | pages 22-23 | heap sort code")
    print("  62-65 | shared_code | pages 23-25 | linked-list class")
    print()
    print("Supported types:")
    print("  " + ", ".join(sorted(SUPPORTED_GROUP_TYPES)))
    print()

    groups: list[QuestionGroup] = []
    while True:
        raw = input("Group: ").strip()
        if not raw:
            break
        try:
            group = parse_group(raw)
        except ValueError as exc:
            print(f"Could not parse group: {exc}")
            continue

        if group.group_type not in SUPPORTED_GROUP_TYPES:
            print(f"Unknown group type: {group.group_type}")
            if not ask_yes_no("Continue using mixed for this group?", default=False):
                print("Group skipped. Re-enter it with a supported type.")
                continue
            group = QuestionGroup(
                group.q_start,
                group.q_end,
                "mixed",
                group.page_start,
                group.page_end,
                group.note,
            )

        groups.append(group)

    return groups


def extract_pdf_text(pdf_path: Path, pages: list[int]) -> dict[int, str]:
    """Best-effort text extraction. Page images remain the source of truth."""
    if not pages or not pdf_path.is_file():
        return {}

    try:
        import fitz  # type: ignore
    except Exception:
        return {}

    extracted: dict[int, str] = {}
    try:
        doc = fitz.open(str(pdf_path))
    except Exception:
        return {}

    try:
        for page_num in pages:
            if page_num < 1 or page_num > len(doc):
                continue
            page = doc[page_num - 1]
            text = page.get_text("text").strip()
            if text:
                extracted[page_num] = text
    finally:
        doc.close()

    return extracted


def candidate_page_images(image_dir: Path, pages: list[int]) -> list[str]:
    if not pages or not image_dir.is_dir():
        return []

    image_files = [
        p for p in image_dir.iterdir()
        if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    ]
    matches: list[str] = []
    for page in pages:
        patterns = [
            re.compile(rf"(^|[^0-9]){page}([^0-9]|$)", re.IGNORECASE),
            re.compile(rf"p(?:age)?[_ -]?0*{page}([^0-9]|$)", re.IGNORECASE),
        ]
        for image in image_files:
            if any(pattern.search(image.stem) for pattern in patterns):
                matches.append(str(image))
    return sorted(dict.fromkeys(matches))


def format_page_list(pages: list[int]) -> str:
    if not pages:
        return "not specified"
    if len(pages) == 1:
        return str(pages[0])
    return f"{pages[0]}-{pages[-1]}"


def build_parsed_text_block(parsed_text: dict[int, str]) -> str:
    if not parsed_text:
        return "No parsed PDF text was embedded. Use the attached page image(s) only."

    parts = []
    for page_num, text in parsed_text.items():
        parts.append(f"--- Parsed text from page {page_num} ---\n{text}")
    return "\n\n".join(parts)


def safe_folder_label(label: str, fallback: str) -> str:
    raw = label.strip() or fallback
    cleaned = re.sub(r'[<>:"|?*\x00-\x1f]+', " ", raw)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    return cleaned or fallback


def default_image_folder(paper_name: str, year_tag: str) -> str:
    label = safe_folder_label(paper_name, year_tag or "CS Paper")
    return f"IMAGES/CS/Past Papers/{label}/"


def build_prompt(
    *,
    group: QuestionGroup,
    pdf_path: Path,
    paper_name: str,
    year_tag: str,
    module_name: str,
    id_prefix: str,
    page_image_dir: Path | None,
    page_images: list[str],
    parsed_text: dict[int, str],
) -> str:
    page_image_lines = "\n".join(f"- {path}" for path in page_images) if page_images else "- Attach the relevant page image(s) manually."
    parsed_text_block = build_parsed_text_block(parsed_text)
    note_line = group.note or "No extra group note provided."
    guidance_lines = "\n".join(f"- {line}" for line in GROUP_TYPE_GUIDANCE.get(group.group_type, GROUP_TYPE_GUIDANCE["mixed"]))
    image_folder = default_image_folder(paper_name, year_tag)

    return textwrap.dedent(f"""\
        You are extracting a small group of Computer Science MCQ questions into typed block JSON for the Mora Quiz app.

        SOURCE SCOPE
        - Module: {module_name}
        - Paper: {paper_name}
        - Year tag: {year_tag}
        - ID prefix: {id_prefix}
        - Requested questions: {group.label}
        - Group type: {group.group_type}
        - Source pages: {format_page_list(group.pages)}
        - Group note: {note_line}
        - PDF path for human reference: {pdf_path}
        - Page image folder for human reference: {page_image_dir or "not provided"}

        ATTACHMENTS
        Use the attached page image(s) as the source of truth for layout, indentation, tables, figures, flowcharts, and option text.
        Use parsed text only as a helper. If parsed text disagrees with the page image, trust the page image.
        Attach only the relevant PDF page images or crops for this group.

        Suggested page image files, if available:
        {page_image_lines}

        GROUP TYPE GUIDANCE
        {guidance_lines}

        OUTPUT RULES
        - Output the question JSON first.
        - If any figure, diagram, chart, screenshot, code layout, or table needs cropping, append a bottom image manifest starting with exactly ====IMAGES====.
        - Do not output markdown fences.
        - Do not add comments before the JSON.
        - Include all questions in the requested range unless defective.
        - Put uncertain, incomplete, ambiguous, unreadable, or bad questions in the defects array.
        - Do not invent figures.
        - Do not invent answers.
        - Do not render source HTML as real HTML.
        - Do not add an html block type.
        - Keep HTML-like source text escaped/plain unless manually converted into typed blocks.
        - Answer index must be 0-based.
        - Every question must include source.page and source.questionNumber.
        - Before cropping, question image references must be filenames only, not IMAGES/... full paths.
        - Reuse the same filename wherever one shared figure is used by multiple questions.

        REQUIRED JSON SHAPE FIRST
        {{
          "questions": [
            {{
              "id": "{id_prefix}_Q11",
              "year": "{year_tag}",
              "source": {{
                "paper": "{paper_name}",
                "page": 6,
                "questionNumber": 11
              }},
              "blocks": [
                {{
                  "type": "text",
                  "text": "What will be the result when the following Python code is executed?"
                }},
                {{
                  "type": "code",
                  "language": "python",
                  "text": "B = [1, True, \\"12345\\", [3.5]]\\ntype(B[2][3])"
                }}
              ],
              "opts": [
                "<class 'float'>",
                "<class 'int'>",
                "<class 'bool'>",
                "<class 'str'>",
                "<class 'list'>"
              ],
              "ans": 3,
              "explanationBlocks": [
                {{
                  "type": "text",
                  "text": "B[2] is the string \\"12345\\". Index 3 of that string is the character \\"4\\", so its type is str."
                }}
              ]
            }}
          ],
          "defects": []
        }}

        IMAGE MANIFEST SHAPE, ONLY WHEN IMAGES ARE USED
        Append this after the JSON object. Use the exact marker and field names.

        ====IMAGES====
        FILENAME    : {id_prefix}_Q11_FIG1.png
        PAGE        : 6
        QUESTIONS   : Q11
        UNIT        : N/A
        FOLDER      : {image_folder}
        DESCRIPTION : short human description of the figure

        ---

        FILENAME    : {id_prefix}_SHARED_FLOWCHART_1.png
        PAGE        : 7
        QUESTIONS   : Q12, Q13, Q14
        UNIT        : N/A
        FOLDER      : {image_folder}
        DESCRIPTION : shared flowchart used by questions 12 through 14

        BLOCK RULES
        - Python code must use {{ "type": "code", "language": "python", "text": "..." }}.
        - Pseudo-code may use {{ "type": "code", "language": "pseudocode", "text": "..." }}.
        - Preserve Python indentation exactly.
        - Preserve pseudo-code indentation.
        - Do not flatten code into one line.
        - Flowcharts and diagrams should use image blocks with alt text, not legacy imgAlt.
        - Use image blocks as {{ "type": "image", "img": "{id_prefix}_FIG1.png", "alt": "brief plain description" }}.
        - The img value must be only the filename before cropping; the cropper will replace it with FOLDER/FILENAME later.
        - Every image block filename must have a matching FILENAME row in ====IMAGES====.
        - The manifest QUESTIONS field must list every question that uses that filename.
        - If a table or code layout is too risky to transcribe, use an image block instead.
        - Tables should use {{ "type": "table", "rows": [["Header 1", "Header 2"], ["A", "B"]] }} only if they can be represented cleanly.
        - Do not flatten tables into paragraphs.
        - I/II/III statements should be separate text or list-style blocks, not one paragraph.
        - Do not use raw HTML tags like <strong> or <br> in explanation blocks.
        - Fractions should use proper LaTeX, for example "\\\\dfrac{{1}}{{3}}", not inline slash fractions when mathematical rendering is intended.

        DEFECT RULES
        For every defective item, include enough detail for a human to revisit the source:
        {{
          "questionNumber": 12,
          "source": {{ "paper": "{paper_name}", "page": 6, "questionNumber": 12 }},
          "reason": "Unreadable option C in the attached page image.",
          "rawText": "short source excerpt if available"
        }}

        SELF-CHECK BEFORE FINAL OUTPUT
        - Every non-defective question in {group.label} is present.
        - Every question has exactly 5 options unless the source clearly has a different count.
        - Every answer index is 0-based.
        - Every source page is present.
        - Code-looking content is not inside a plain text block.
        - Code blocks contain newline characters where needed.
        - No raw HTML tags exist in explanation blocks.
        - Every image block has img and alt.
        - Every image filename used in questions appears once in ====IMAGES====.
        - Every shared image lists all matching questions in the manifest.
        - Do not place full image paths in question JSON before cropping.
        - I/II/III statements are not flattened into one paragraph.
        - No markdown fences are used.

        PARSED TEXT HELPER
        {parsed_text_block}
        """)


def write_prompts(
    groups: list[QuestionGroup],
    *,
    pdf_path: Path,
    paper_name: str,
    year_tag: str,
    module_name: str,
    id_prefix: str,
    output_dir: Path,
    page_image_dir: Path | None,
) -> tuple[list[Path], Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    records: list[dict[str, Any]] = []

    for index, group in enumerate(groups, start=1):
        pages = group.pages
        parsed_text = extract_pdf_text(pdf_path, pages)
        page_images = candidate_page_images(page_image_dir, pages) if page_image_dir else []
        prompt = build_prompt(
            group=group,
            pdf_path=pdf_path,
            paper_name=paper_name,
            year_tag=year_tag,
            module_name=module_name,
            id_prefix=id_prefix,
            page_image_dir=page_image_dir,
            page_images=page_images,
            parsed_text=parsed_text,
        )
        filename = f"{index:03d}_{group.filename_slug}.md"
        out_path = output_dir / filename
        out_path.write_text(prompt, encoding="utf-8")
        written.append(out_path)
        records.append({
            "index": index,
            "filename": filename,
            "questionRange": group.label,
            "groupType": group.group_type,
            "pages": group.pages_label,
            "pageNumbers": pages,
            "note": group.note,
            "pageImages": page_images,
        })

    index_path = output_dir / "PROMPT_INDEX.md"
    write_prompt_index(
        index_path,
        paper_name=paper_name,
        year_tag=year_tag,
        id_prefix=id_prefix,
        output_dir=output_dir,
        pdf_path=pdf_path,
        page_image_dir=page_image_dir,
        records=records,
    )

    plan_path = output_dir / "prompt_plan.json"
    write_prompt_plan(
        plan_path,
        pdf_path=pdf_path,
        paper_name=paper_name,
        year_tag=year_tag,
        module_name=module_name,
        id_prefix=id_prefix,
        output_dir=output_dir,
        page_image_dir=page_image_dir,
        groups=groups,
    )

    return written, index_path, plan_path


def write_prompt_index(
    path: Path,
    *,
    paper_name: str,
    year_tag: str,
    id_prefix: str,
    output_dir: Path,
    pdf_path: Path,
    page_image_dir: Path | None,
    records: list[dict[str, Any]],
) -> None:
    lines = [
        "# CS Prompt Index",
        "",
        f"- Paper name: {paper_name}",
        f"- Year: {year_tag}",
        f"- ID prefix: {id_prefix}",
        f"- Image crop folder: {default_image_folder(paper_name, year_tag)}",
        f"- Output folder: {output_dir}",
        f"- PDF path: {pdf_path}",
        f"- Page image folder: {page_image_dir or 'not provided'}",
        "",
        "Attach only the listed page images or PDF pages for each Claude prompt.",
        "",
        "| # | Prompt file | Question range | Group type | Pages | Note | Attach to Claude |",
        "|---|---|---|---|---|---|---|",
    ]

    for record in records:
        attach = format_attachment_hint(record["pageNumbers"], record["pageImages"])
        lines.append(
            "| {index} | {filename} | {questionRange} | {groupType} | {pages} | {note} | {attach} |".format(
                index=record["index"],
                filename=record["filename"],
                questionRange=record["questionRange"],
                groupType=record["groupType"],
                pages=record["pages"],
                note=escape_table_cell(record["note"] or "-"),
                attach=escape_table_cell(attach),
            )
        )

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def format_attachment_hint(page_numbers: list[int], page_images: list[str]) -> str:
    if page_images:
        return "; ".join(page_images)
    if page_numbers:
        return f"PDF pages {format_page_list(page_numbers)} or matching page images/crops"
    return "Relevant PDF page images/crops for this group"


def escape_table_cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ")


def write_prompt_plan(
    path: Path,
    *,
    pdf_path: Path,
    paper_name: str,
    year_tag: str,
    module_name: str,
    id_prefix: str,
    output_dir: Path,
    page_image_dir: Path | None,
    groups: list[QuestionGroup],
) -> None:
    plan = {
        "pdfPath": str(pdf_path),
        "paperName": paper_name,
        "year": year_tag,
        "moduleName": module_name,
        "idPrefix": id_prefix,
        "imageCropFolder": default_image_folder(paper_name, year_tag),
        "outputPromptFolder": str(output_dir),
        "pageImageFolder": str(page_image_dir) if page_image_dir else "",
        "groups": [
            {
                "range": group.label,
                "qStart": group.q_start,
                "qEnd": group.q_end,
                "type": group.group_type,
                "pages": group.pages_label,
                "pageStart": group.page_start,
                "pageEnd": group.page_end,
                "note": group.note,
                "promptFilename": f"{index:03d}_{group.filename_slug}.md",
            }
            for index, group in enumerate(groups, start=1)
        ],
    }
    path.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def ask_yes_no(prompt: str, default: bool = False) -> bool:
    suffix = "[Y/n]" if default else "[y/N]"
    raw = ask(f"{prompt} {suffix}", "").lower()
    if not raw:
        return default
    return raw in {"y", "yes"}


def parse_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.isdigit():
            return int(stripped)
    return None


def question_number(question: dict[str, Any]) -> int | None:
    source = question.get("source")
    if isinstance(source, dict):
        parsed = parse_int(source.get("questionNumber"))
        if parsed is not None:
            return parsed
    return None


def id_question_number(question: dict[str, Any]) -> int | None:
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


def question_sort_key(item: tuple[int, dict[str, Any]]) -> tuple[int, int, int]:
    original_index, question = item
    qno = question_number(question)
    if qno is not None:
        return (0, qno, original_index)
    id_qno = id_question_number(question)
    if id_qno is not None:
        return (1, id_qno, original_index)
    return (2, original_index, original_index)


def parse_expected_range(raw: str) -> set[int]:
    expected: set[int] = set()
    raw = raw.strip()
    if not raw:
        return expected
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        match = re.fullmatch(r"(\d+)\s*[-:]\s*(\d+)", part)
        if match:
            start = int(match.group(1))
            end = int(match.group(2))
            if end < start:
                start, end = end, start
            expected.update(range(start, end + 1))
            continue
        if part.isdigit():
            expected.add(int(part))
            continue
        raise ValueError(f"could not parse expected range part: {part!r}")
    return expected


def collect_review_paths() -> list[Path]:
    raw = ask("JSON file/folder, or semicolon-separated JSON files")
    if not raw:
        return []
    parts = [p.strip() for p in raw.split(";") if p.strip()] if ";" in raw else [raw]
    return find_json_files(parts)


def collect_group_paths() -> list[Path]:
    raw = ask("Group JSON folder, or semicolon-separated group JSON files")
    if not raw:
        return []

    if ";" in raw:
        paths = [normalize_path(part) for part in raw.split(";") if part.strip()]
    else:
        path = normalize_path(raw)
        if path.is_dir():
            paths = sorted(path.glob("*.json"))
        else:
            paths = [path]

    valid_paths: list[Path] = []
    for path in paths:
        if path.is_file():
            valid_paths.append(path)
        else:
            print(f"Skipping missing file: {path}")
    return valid_paths


def build_review_from_questions(
    label: str,
    questions: list[dict[str, Any]],
    defects: list[Any],
    manifest_entries: list[ImageManifestEntry] | None = None,
    manifest_warnings: list[str] | None = None,
) -> Review:
    review = Review(label)
    review.total_questions = len(questions)
    review.total_defects = len(defects)

    ids = [q.get("id") for q in questions if isinstance(q.get("id"), str) and q.get("id")]
    for qid, count in Counter(ids).items():
        if count > 1:
            review.add("duplicate IDs", f"{qid}: {count} occurrences")

    for index, question in enumerate(questions):
        review_question(review, question, index)

    review_image_manifest_consistency(review, questions, manifest_entries or [], manifest_warnings or [])
    return review


def clone_manifest_entry(entry: ImageManifestEntry) -> ImageManifestEntry:
    return ImageManifestEntry(
        filename=entry.filename,
        page=entry.page,
        questions=list(entry.questions),
        unit=entry.unit,
        folder=entry.folder,
        description=entry.description,
        source_label=entry.source_label,
        entry_index=entry.entry_index,
    )


def merge_manifest_question_lists(existing: list[str], new_items: list[str]) -> None:
    seen = {item.strip().lower() for item in existing if item.strip()}
    for item in new_items:
        normalized = item.strip().lower()
        if normalized and normalized not in seen:
            existing.append(item)
            seen.add(normalized)


def merge_manifest_entries(entries: list[ImageManifestEntry]) -> tuple[list[ImageManifestEntry], list[str]]:
    merged: list[ImageManifestEntry] = []
    by_filename: dict[str, ImageManifestEntry] = {}
    warnings: list[str] = []

    for entry in entries:
        key = entry.key
        if not key:
            continue
        if key not in by_filename:
            copy = clone_manifest_entry(entry)
            by_filename[key] = copy
            merged.append(copy)
            continue

        existing = by_filename[key]
        if existing.metadata_without_questions() != entry.metadata_without_questions():
            warnings.append(
                f"{entry.filename}: duplicate manifest filename has conflicting PAGE, UNIT, FOLDER, or DESCRIPTION"
            )
        merge_manifest_question_lists(existing.questions, entry.questions)

    return merged, warnings


def duplicate_question_numbers(questions: list[dict[str, Any]]) -> list[str]:
    counts = Counter(
        qno for qno in (question_number(question) for question in questions)
        if qno is not None
    )
    return [f"Q{qno}: {count} occurrences" for qno, count in sorted(counts.items()) if count > 1]


def print_issue_list(label: str, items: list[str]) -> None:
    print(f"  {label}: {len(items)}")
    for item in items:
        print(f"    - {item}")


def print_merge_summary(
    *,
    group_count: int,
    questions: list[dict[str, Any]],
    defects: list[Any],
    manifest_entries: list[ImageManifestEntry],
    manifest_warnings: list[str],
    review: Review,
    expected_numbers: set[int],
) -> None:
    present_numbers = {
        qno for qno in (question_number(question) for question in questions)
        if qno is not None
    }
    missing_numbers = sorted(expected_numbers - present_numbers) if expected_numbers else []

    print()
    print("Merge summary")
    print(f"  total group files: {group_count}")
    print(f"  total questions: {len(questions)}")
    print(f"  total defects: {len(defects)}")
    print(f"  total image manifest entries: {len(manifest_entries)}")
    print_issue_list("duplicate IDs", review.issues["duplicate IDs"])
    print_issue_list("duplicate question numbers", duplicate_question_numbers(questions))
    if expected_numbers:
        print_issue_list("missing question numbers", [f"Q{number}" for number in missing_numbers])
    print_issue_list("option count issues", review.issues["option count not equal to 5"])
    print_issue_list("answer index issues", review.issues["answer index out of range"])
    print_issue_list("raw HTML-like tags", review.issues["raw HTML-like tags in explanation blocks"])
    print_issue_list("code-looking content inside text blocks", review.issues["code-looking text inside text blocks"])
    print_issue_list("suspicious one-line code blocks", review.issues["suspicious one-line Python code"])
    print_issue_list("image manifest merge warnings", manifest_warnings)
    print_issue_list("question image refs without manifest rows", review.issues["question image references missing manifest entries"])
    print_issue_list("manifest rows referencing missing questions", review.issues["manifest entries reference missing questions"])
    print_issue_list("unused manifest filenames", review.issues["manifest filenames unused by questions"])
    print_issue_list("shared image question mismatches", review.issues["shared image manifest question mismatch"])
    print_issue_list("image full-path-before-crop warnings", review.issues["image references use full paths before crop"])


def merge_group_files(paths: list[Path]) -> tuple[list[dict[str, Any]], list[Any], list[ImageManifestEntry], list[str]]:
    questions_with_order: list[tuple[int, dict[str, Any]]] = []
    defects: list[Any] = []
    manifest_entries: list[ImageManifestEntry] = []
    manifest_warnings: list[str] = []
    order = 0

    for path in paths:
        payload, group_manifest_entries, group_manifest_warnings = load_payload_with_manifest(path)
        questions, group_defects = normalize_payload(payload)
        for question in questions:
            questions_with_order.append((order, question))
            order += 1
        defects.extend(group_defects)
        manifest_entries.extend(group_manifest_entries)
        manifest_warnings.extend(group_manifest_warnings)

    sorted_questions = [
        question for _, question in sorted(questions_with_order, key=question_sort_key)
    ]
    merged_manifest_entries, merge_warnings = merge_manifest_entries(manifest_entries)
    return sorted_questions, defects, merged_manifest_entries, manifest_warnings + merge_warnings


def write_merged_json(
    output_path: Path,
    questions: list[dict[str, Any]],
    defects: list[Any],
    manifest_entries: list[ImageManifestEntry],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"questions": questions, "defects": defects}
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    if manifest_entries:
        text += "\n====IMAGES====\n"
        text += format_image_manifest(manifest_entries)
    output_path.write_text(text, encoding="utf-8")


def run_review_menu(label: str) -> bool:
    print()
    print(label)
    paths = collect_review_paths()
    if not paths:
        print("No JSON files selected.")
        return False

    reviewed_any = False
    for path in paths:
        try:
            review = review_file(path)
        except Exception as exc:
            review = review_parse_error(path, exc)
        print_review(review)
        maybe_print_correction_prompt(review)
        reviewed_any = True
    return reviewed_any


def run_merge_menu() -> bool:
    print()
    print("Merge reviewed group output JSON files")
    paths = collect_group_paths()
    if not paths:
        print("No group JSON files selected.")
        return False

    expected_numbers: set[int] = set()
    expected_raw = ask("Expected question range, for example 1-80, blank to skip", "")
    if expected_raw:
        try:
            expected_numbers = parse_expected_range(expected_raw)
        except ValueError as exc:
            print(f"Invalid expected range: {exc}")
            return False

    try:
        questions, defects, manifest_entries, manifest_warnings = merge_group_files(paths)
    except Exception as exc:
        print(f"Could not merge group files: {exc}")
        return False

    review = build_review_from_questions(
        "merged candidate",
        questions,
        defects,
        manifest_entries,
        manifest_warnings,
    )
    print_merge_summary(
        group_count=len(paths),
        questions=questions,
        defects=defects,
        manifest_entries=manifest_entries,
        manifest_warnings=manifest_warnings,
        review=review,
        expected_numbers=expected_numbers,
    )

    if not ask_yes_no("Write merged JSON now?", default=False):
        print("Merge output was not written.")
        return False

    default_output = paths[0].parent / "cs_merged_full_paper.json"
    output_path = normalize_path(ask("Output merged JSON path", str(default_output)))
    if output_path.exists() and not ask_yes_no(f"Overwrite existing file {output_path}?", default=False):
        print("Merge output was not written.")
        return False

    write_merged_json(output_path, questions, defects, manifest_entries)
    print(f"Saved merged JSON: {output_path}")
    return True


def open_image_converter() -> int:
    extractor = SCRIPT_DIR / "pdf_image_extractor.py"
    if not extractor.is_file():
        print(f"Image converter/cropper not found: {extractor}")
        return 1

    print()
    print("Opening image converter/cropper.")
    print("Provide the Claude output JSON and PDF path when it asks.")
    sys.stdout.flush()
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    run_kwargs: dict[str, Any] = {"env": env}
    if not sys.stdin.isatty():
        run_kwargs.update({"input": "exit\nexit\n", "text": True})
    try:
        completed = subprocess.run([sys.executable, str(extractor)], **run_kwargs)
    except OSError as exc:
        print(f"Could not launch image converter/cropper: {exc}")
        return 1
    return completed.returncode


def ask_open_image_converter() -> None:
    if ask_yes_no("Do you want to open the image converter/cropper now?", default=False):
        open_image_converter()


def print_group_summary(groups: list[QuestionGroup]) -> None:
    print()
    print("Prompt group summary")
    for index, group in enumerate(groups, start=1):
        note = group.note or "-"
        print(
            f"Group {index}: {group.label}, {group.group_type}, "
            f"{group.pages_label}, {note}"
        )


def show_workflow_help() -> None:
    print()
    print("CS extraction package workflow")
    print("  1. Run python tools\\cs_block_prompt_generator.py")
    print("  2. Choose Generate CS extraction package")
    print("  3. Create one package folder for one paper and enter paper details once")
    print("  4. Paste all groups as: range | type | pages | note")
    print("  5. Press Enter on a blank line, review the normalized summary, and confirm")
    print("  6. Upload CS_EXTRACTION_MASTER.md once, then attach the PDF/pages and chunk JSON to the AI")
    print("  7. Save each AI group output JSON, plus ====IMAGES==== if images are used")
    print("  8. Run this tool again to review and merge group output JSON files")
    print("  9. Open the image converter/cropper only if image blocks need crops")
    print(" 10. Preview manually before import")
    print()
    print("The PDF/pages remain the source of truth; package chunks never embed parsed PDF text.")
    print("Image refs before cropping should be filenames only; the cropper writes IMAGES/... paths later.")
    print("Option 7 keeps the old standalone Markdown prompt workflow for legacy use only.")
    print()
    print("Example group:")
    print("  1-4 | shared_flowchart | pages 3-4 | Fig. 1 flowchart")
    print()
    print(f"Full notes: {SCRIPT_DIR / 'cs_extraction_workflow.md'}")


def generate_grouped_prompts() -> int:
    print("CS Block Prompt Generator")
    print("Creates one Claude prompt per small CS question group.")
    print()

    pdf_path = normalize_path(ask("PDF path"))
    if not pdf_path.is_file():
        print(f"Warning: PDF not found, prompts will still be generated without parsed text: {pdf_path}")

    paper_name = ask("Paper name", "23 Batch 2024")
    year_tag = ask("Year", DEFAULT_YEAR)
    module_name = ask("Module name", DEFAULT_MODULE)
    id_prefix = ask("ID prefix", f"cs1033_{year_tag}")
    output_default = str(Path("..") / "AI exports" / "cs_prompts" / id_prefix)
    output_dir = normalize_path(ask("Output prompt folder", output_default))

    page_image_raw = ask("Page image folder, optional", "")
    page_image_dir = normalize_path(page_image_raw) if page_image_raw else None
    if page_image_dir and not page_image_dir.is_dir():
        print(f"Warning: page image folder not found, prompts will not list image candidates: {page_image_dir}")

    groups = collect_groups()
    if not groups:
        print("No groups entered. Nothing to write.")
        return 1

    print_group_summary(groups)
    if not ask_yes_no("Generate prompts for these groups?", default=False):
        print("No prompt files were written.")
        return 0

    written, index_path, plan_path = write_prompts(
        groups,
        pdf_path=pdf_path,
        paper_name=paper_name,
        year_tag=year_tag,
        module_name=module_name,
        id_prefix=id_prefix,
        output_dir=output_dir,
        page_image_dir=page_image_dir if page_image_dir and page_image_dir.is_dir() else None,
    )

    print()
    print(f"Wrote {len(written)} prompt file(s):")
    for path in written:
        print(f"  {path}")
    print(f"  {index_path}")
    print(f"  {plan_path}")
    print()
    print("Do not ask Claude to convert the full 80-question paper at once.")
    return 0


def print_cli_help() -> None:
    print("CS Block Extraction Tool")
    print("Run without arguments for the interactive package, review, merge, and crop workflow.")
    print("Option 1 creates the current CS extraction package; option 7 creates legacy standalone prompts.")


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if args:
        if args[0] in {"-h", "--help"}:
            print_cli_help()
            return 0
        print(f"Unknown option: {args[0]}")
        print_cli_help()
        return 2
    while True:
        print()
        print("CS Block Extraction Tool")
        print("1. Generate CS extraction package")
        print("2. Review a Claude group output JSON")
        print("3. Merge reviewed group output JSON files into one full paper JSON")
        print("4. Review a merged full paper JSON")
        print("5. Show workflow/help")
        print("6. Open image converter/cropper")
        print("7. Generate legacy standalone Markdown prompts")
        print("0. Exit")
        choice = ask("Choose an option")

        if choice == "1":
            generate_extraction_package()
        elif choice == "2":
            if run_review_menu("Review a Claude group output JSON"):
                ask_open_image_converter()
        elif choice == "3":
            if run_merge_menu():
                ask_open_image_converter()
        elif choice == "4":
            if run_review_menu("Review a merged full paper JSON"):
                ask_open_image_converter()
        elif choice == "5":
            show_workflow_help()
        elif choice == "6":
            open_image_converter()
        elif choice == "7":
            generate_grouped_prompts()
        elif choice == "0":
            return 0
        else:
            print("Invalid option. Choose 0-7.")


if __name__ == "__main__":
    raise SystemExit(main())
