#!/usr/bin/env python3
"""Generate grouped Claude prompts for CS block-schema extraction.

This tool is intentionally CS-specific for the first extraction stage. It does
not import questions into the app and does not rewrite the older prompt
generator. It creates one prompt file per small question group so code-heavy
CS1033 papers can be extracted safely into typed block JSON.
"""

from __future__ import annotations

import re
import textwrap
from dataclasses import dataclass
from pathlib import Path


DEFAULT_MODULE = "CS1033 Programming Fundamentals"
DEFAULT_YEAR = "2024"


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


def main() -> int:
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


if __name__ == "__main__":
    raise SystemExit(main())
