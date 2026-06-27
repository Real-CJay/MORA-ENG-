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


@dataclass(frozen=True)
class QuestionGroup:
    q_start: int
    q_end: int
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
        if self.q_start == self.q_end:
            return f"q{self.q_start:02d}"
        return f"q{self.q_start:02d}_q{self.q_end:02d}"

    @property
    def pages(self) -> list[int]:
        if self.page_start is None:
            return []
        end = self.page_end if self.page_end is not None else self.page_start
        return list(range(self.page_start, end + 1))


def ask(prompt: str, default: str | None = None) -> str:
    suffix = f" [{default}]" if default not in (None, "") else ""
    value = input(f"{prompt}{suffix}: ").strip()
    return value if value else (default or "")


def normalize_path(raw: str) -> Path:
    return Path(raw.strip().strip('"').strip("'")).expanduser()


def parse_group(raw: str) -> QuestionGroup:
    """Parse lines like '1-4 pages 1-2 | shared flowchart'."""
    text = raw.strip()
    note = ""
    if "|" in text:
        text, note = [part.strip() for part in text.split("|", 1)]

    q_match = re.search(r"(?:q\s*)?(\d+)\s*(?:[-:]\s*(?:q\s*)?(\d+))?", text, re.IGNORECASE)
    if not q_match:
        raise ValueError("missing question range")

    q_start = int(q_match.group(1))
    q_end = int(q_match.group(2) or q_start)
    if q_end < q_start:
        q_start, q_end = q_end, q_start

    page_match = re.search(
        r"(?:pages?|p)\s*(\d+)\s*(?:[-:]\s*(\d+))?",
        text,
        re.IGNORECASE,
    )
    page_start = page_end = None
    if page_match:
        page_start = int(page_match.group(1))
        page_end = int(page_match.group(2) or page_start)
        if page_end < page_start:
            page_start, page_end = page_end, page_start

    return QuestionGroup(q_start, q_end, page_start, page_end, note)


def collect_groups() -> list[QuestionGroup]:
    print()
    print("Enter one small group per line.")
    print("Examples:")
    print("  1-4 pages 1-2 | shared flowchart")
    print("  8-10 p4 | shared recursive Search(A, i, k)")
    print("  51-55 pages 12-13 | shared Stack class")
    print("Leave blank when finished.")
    print()

    groups: list[QuestionGroup] = []
    while True:
        raw = input("Group: ").strip()
        if not raw:
            break
        try:
            groups.append(parse_group(raw))
        except ValueError as exc:
            print(f"Could not parse group: {exc}")

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

    return textwrap.dedent(f"""\
        You are extracting a small group of Computer Science MCQ questions into typed block JSON for the Mora Quiz app.

        SOURCE SCOPE
        - Module: {module_name}
        - Paper: {paper_name}
        - Year tag: {year_tag}
        - ID prefix: {id_prefix}
        - Requested questions: {group.label}
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
) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

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
        out_path = output_dir / f"{index:02d}_{id_prefix}_{group.filename_slug}.txt"
        out_path.write_text(prompt, encoding="utf-8")
        written.append(out_path)

    return written


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


def show_workflow_help() -> None:
    print()
    print("Simplified CS extraction workflow")
    print("  1. Run python tools\\cs_block_prompt_generator.py")
    print("  2. Choose Generate grouped Claude prompts")
    print("  3. Paste each prompt into Claude with the relevant page image(s)")
    print("  4. Save each Claude group output JSON")
    print("  5. Run this tool again")
    print("  6. Choose Review a Claude group output JSON")
    print("  7. Choose Merge reviewed group output JSON files into one full paper JSON")
    print("  8. Choose Review a merged full paper JSON")
    print("  9. Choose Open image converter/cropper only if image blocks need crops")
    print(" 10. Preview manually before import")
    print()
    print(f"Full notes: {SCRIPT_DIR / 'cs_extraction_workflow.md'}")


def generate_grouped_prompts() -> int:
    print("CS Block Prompt Generator")
    print("Creates one Claude prompt per small CS question group.")
    print()

    pdf_path = normalize_path(ask("PDF path"))
    if not pdf_path.is_file():
        print(f"Warning: PDF not found, prompts will still be generated without parsed text: {pdf_path}")

    year_tag = ask("Paper name/year tag, for example 2024", DEFAULT_YEAR)
    paper_name_default = f"CS1033 {year_tag}"
    paper_name = ask("Paper/source name, for example 23 Batch 2024", paper_name_default)
    module_name = ask("Module name", DEFAULT_MODULE)
    id_prefix = ask("ID prefix", f"cs1033_{year_tag}")
    output_default = str(Path("..") / "AI exports" / "cs_prompts" / id_prefix)
    output_dir = normalize_path(ask("Output folder for generated prompts", output_default))

    page_image_raw = ask("Page image folder if available, blank to skip", "")
    page_image_dir = normalize_path(page_image_raw) if page_image_raw else None
    if page_image_dir and not page_image_dir.is_dir():
        print(f"Warning: page image folder not found, prompts will not list image candidates: {page_image_dir}")

    groups = collect_groups()
    if not groups:
        print("No groups entered. Nothing to write.")
        return 1

    written = write_prompts(
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
