#!/usr/bin/env python3
"""Main CS block-schema extraction workflow tool.

This tool is intentionally CS-specific for the first extraction stage. It keeps
prompt generation, review, and full-paper merge in one user-facing menu so the
normal workflow starts with:

    python tools/cs_block_prompt_generator.py
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import textwrap
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    from cs_extraction_review import (
        Review,
        find_json_files,
        load_payload,
        normalize_payload,
        print_review,
        review_file,
        review_question,
    )
except ImportError:  # pragma: no cover - useful only if imported as a package
    from .cs_extraction_review import (  # type: ignore
        Review,
        find_json_files,
        load_payload,
        normalize_payload,
        print_review,
        review_file,
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
        - Output valid JSON only.
        - Do not output markdown fences.
        - Do not add comments before or after the JSON.
        - Include all questions in the requested range unless defective.
        - Put uncertain, incomplete, ambiguous, unreadable, or bad questions in the defects array.
        - Do not invent figures.
        - Do not invent answers.
        - Do not render source HTML as real HTML.
        - Do not add an html block type.
        - Keep HTML-like source text escaped/plain unless manually converted into typed blocks.
        - Answer index must be 0-based.
        - Every question must include source.page and source.questionNumber.

        REQUIRED JSON SHAPE
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

        BLOCK RULES
        - Python code must use {{ "type": "code", "language": "python", "text": "..." }}.
        - Pseudo-code may use {{ "type": "code", "language": "pseudocode", "text": "..." }}.
        - Preserve Python indentation exactly.
        - Preserve pseudo-code indentation.
        - Do not flatten code into one line.
        - Flowcharts and diagrams should use {{ "type": "image", "img": "{id_prefix}_FIG1.png", "alt": "brief plain description" }}.
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

    return review


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
    print_issue_list("duplicate IDs", review.issues["duplicate IDs"])
    print_issue_list("duplicate question numbers", duplicate_question_numbers(questions))
    if expected_numbers:
        print_issue_list("missing question numbers", [f"Q{number}" for number in missing_numbers])
    print_issue_list("option count issues", review.issues["option count not equal to 5"])
    print_issue_list("answer index issues", review.issues["answer index out of range"])
    print_issue_list("raw HTML-like tags", review.issues["raw HTML-like tags in explanation blocks"])
    print_issue_list("code-looking content inside text blocks", review.issues["code-looking text inside text blocks"])
    print_issue_list("suspicious one-line code blocks", review.issues["suspicious one-line Python code"])


def merge_group_files(paths: list[Path]) -> tuple[list[dict[str, Any]], list[Any]]:
    questions_with_order: list[tuple[int, dict[str, Any]]] = []
    defects: list[Any] = []
    order = 0

    for path in paths:
        payload = load_payload(path)
        questions, group_defects = normalize_payload(payload)
        for question in questions:
            questions_with_order.append((order, question))
            order += 1
        defects.extend(group_defects)

    sorted_questions = [
        question for _, question in sorted(questions_with_order, key=question_sort_key)
    ]
    return sorted_questions, defects


def write_merged_json(output_path: Path, questions: list[dict[str, Any]], defects: list[Any]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"questions": questions, "defects": defects}
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


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
            print(f"\n{path}")
            print(f"  error: {exc}")
            continue
        print_review(review)
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
        questions, defects = merge_group_files(paths)
    except Exception as exc:
        print(f"Could not merge group files: {exc}")
        return False

    review = build_review_from_questions("merged candidate", questions, defects)
    print_merge_summary(
        group_count=len(paths),
        questions=questions,
        defects=defects,
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

    write_merged_json(output_path, questions, defects)
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
    print("Simplified CS extraction workflow")
    print("  1. Run python tools\\cs_block_prompt_generator.py")
    print("  2. Choose Generate grouped Claude prompts")
    print("  3. Enter paper details once")
    print("  4. Enter all groups as: range | type | pages | note")
    print("  5. Press Enter on a blank line and confirm the summary")
    print("  6. Paste each prompt into Claude with the relevant page image(s)")
    print("  7. Save each Claude group output JSON")
    print("  8. Run this tool again")
    print("  9. Choose Review a Claude group output JSON")
    print(" 10. Choose Merge reviewed group output JSON files into one full paper JSON")
    print(" 11. Choose Review a merged full paper JSON")
    print(" 12. Choose Open image converter/cropper only if image blocks need crops")
    print(" 13. Preview manually before import")
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


def main() -> int:
    while True:
        print()
        print("CS Block Extraction Tool")
        print("1. Generate grouped Claude prompts")
        print("2. Review a Claude group output JSON")
        print("3. Merge reviewed group output JSON files into one full paper JSON")
        print("4. Review a merged full paper JSON")
        print("5. Show workflow/help")
        print("6. Open image converter/cropper")
        print("0. Exit")
        choice = ask("Choose an option")

        if choice == "1":
            generate_grouped_prompts()
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
        elif choice == "0":
            return 0
        else:
            print("Invalid option. Choose 0-6.")


if __name__ == "__main__":
    raise SystemExit(main())
