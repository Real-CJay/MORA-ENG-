#!/usr/bin/env python3
"""Generate Claude prompts for Mora Quiz schemaVersion 2 question packs.

The default workflow is the current block-based schema. Legacy flat MCQ prompts
remain available only when the user explicitly selects legacy mode.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from pathlib import Path
import re
import shutil
import subprocess
import sys
from typing import Callable, Sequence


VALID_BUCKETS = ("pastUnit", "pastPaper", "targetHard", "targetNormal")
VALID_QUESTION_TYPES = (
    "mcq",
    "multi_select",
    "numeric",
    "short_answer",
    "structured",
    "written",
    "code_output",
    "matching",
    "image_based",
)
VALID_BLOCK_TYPES = ("text", "math", "image", "code", "table")
VALID_ANSWER_MODES = ("single", "multiple", "numeric", "text", "self_mark", "manual")
VALID_MATCH_MODES = ("any", "all")

COMMON_MODULE_LABELS = {
    "materials": "Materials",
    "mechanics": "Mechanics",
    "fluid": "Fluid Mechanics",
    "math": "Mathematics",
    "cs": "Computer Science",
}

QUESTION_TYPE_GUIDANCE = {
    "mcq": "MCQ with labeled options and answer mode single.",
    "multi_select": "Multi-select with labeled options and answer mode multiple.",
    "numeric": "Numeric-entry question with answer mode numeric.",
    "short_answer": "Short-answer question with answer mode text.",
    "structured": "Structured working question, usually self_mark or manual.",
    "written": "Written/proof/explanation question, usually self_mark or manual.",
    "code_output": "Code tracing/output question; use code blocks when source code appears.",
    "matching": "Matching-style question type, but do not invent a matching answer mode.",
    "image_based": "Question that depends on one or more image blocks or shared image stimuli.",
}

BLOCK_GUIDANCE = {
    "text": (
        "Text blocks: use {\"type\":\"text\",\"value\":\"...\"} for prose. "
        "Inline math may stay inside text as \\( ... \\) or $...$."
    ),
    "math": (
        "Math blocks: use {\"type\":\"math\",\"latex\":\"...\",\"display\":true} "
        "for standalone formulas. Use \\frac{numerator}{denominator} for fractions; "
        "do not use malformed shortcuts like \\frac12. Preserve units and symbols."
    ),
    "code": (
        "Code blocks: use {\"type\":\"code\",\"language\":\"python\",\"value\":\"...\"}. "
        "Keep indentation and newlines exactly when they affect meaning."
    ),
    "table": (
        "Table blocks: use {\"type\":\"table\",\"header\":true,\"rows\":[[...],[...]]}. "
        "Every row must be an array of strings."
    ),
    "image": (
        "Image blocks: register each asset under pack-level images, then reference it "
        "with {\"type\":\"image\",\"assetId\":\"...\"}. Include useful alt text."
    ),
}

ANSWER_GUIDANCE = {
    "single": "{\"mode\":\"single\",\"value\":\"b\"}",
    "multiple": "{\"mode\":\"multiple\",\"value\":[\"a\",\"c\"],\"matchMode\":\"all\"}",
    "numeric": "{\"mode\":\"numeric\",\"value\":0.000001,\"tolerance\":0.02,\"toleranceType\":\"relative\"}",
    "text": "{\"mode\":\"text\",\"value\":[\"EU\",\"European Union\"],\"matchMode\":\"any\"}",
    "self_mark": "{\"mode\":\"self_mark\",\"value\":null}",
    "manual": "{\"mode\":\"manual\",\"value\":null}",
}


@dataclass(frozen=True)
class PromptConfig:
    module_key: str = "materials"
    module_label: str = ""
    bucket: str = "pastUnit"
    unit: str = ""
    topic: str = ""
    year: str = ""
    paper: str = ""
    id_prefix: str = ""
    context_notes: str = ""
    destination_note: str = ""
    source_scenario: str = "pasted source text"
    source_text: str = ""
    marking_scheme: str = ""
    question_types: tuple[str, ...] = ("mcq",)
    answer_modes: tuple[str, ...] = ("single",)
    block_types: tuple[str, ...] = field(default_factory=lambda: VALID_BLOCK_TYPES)
    auto_block_types: bool = True
    use_existing_ids: bool = False
    legacy: bool = False


def slug_identifier(value: str, fallback: str = "MODULE") -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_").upper()
    return slug or fallback


def default_id_prefix(module_key: str, year: str = "") -> str:
    prefix = slug_identifier(module_key)
    year_part = slug_identifier(year, "") if year else ""
    return f"{prefix}_{year_part}" if year_part else prefix


def display_label_for(module_key: str, explicit: str = "") -> str:
    if explicit.strip():
        return explicit.strip()
    return COMMON_MODULE_LABELS.get(module_key.strip().lower(), module_key.strip() or "Custom module")


def discover_module_keys(root: Path | None = None) -> list[str]:
    """Best-effort discovery from quiz_data.js without modifying curriculum data."""
    base = root or Path(__file__).resolve().parents[1]
    quiz_data = base / "quiz_data.js"
    if not quiz_data.exists():
        return []
    text = quiz_data.read_text(encoding="utf-8", errors="ignore")
    found = []
    for pattern in (r"\bdataKey\s*:\s*['\"]([^'\"]+)['\"]", r"\bkey\s*:\s*['\"]([^'\"]+)['\"]"):
        for match in re.finditer(pattern, text):
            key = match.group(1).strip()
            if key and key not in found:
                found.append(key)
    return found


def _split_tokens(value: str) -> list[str]:
    return [part.strip() for part in re.split(r"[,;]", value) if part.strip()]


def _parse_allowed_tokens(
    value: str,
    allowed: Sequence[str],
    option_name: str,
    *,
    allow_auto: bool = False,
) -> tuple[tuple[str, ...], bool]:
    raw = value.strip()
    allowed_set = set(allowed)
    if not raw:
        return tuple(), False
    if allow_auto and raw.lower() in {"auto", "mixed", "automatic"}:
        return tuple(allowed), True
    tokens = _split_tokens(raw)
    normalized = []
    for token in tokens:
        if token.lower() == "all":
            return tuple(allowed), False
        if token not in allowed_set:
            allowed_text = ", ".join(allowed)
            raise ValueError(f"{option_name} value {token!r} is unsupported. Use one of: {allowed_text}")
        normalized.append(token)
    if not normalized:
        return tuple(), False
    return tuple(dict.fromkeys(normalized)), False


def parse_question_types(value: str) -> tuple[str, ...]:
    parsed, _ = _parse_allowed_tokens(value, VALID_QUESTION_TYPES, "question type")
    return parsed or ("mcq",)


def parse_answer_modes(value: str) -> tuple[str, ...]:
    parsed, _ = _parse_allowed_tokens(value, VALID_ANSWER_MODES, "answer mode")
    return parsed or ("single",)


def parse_block_types(value: str) -> tuple[tuple[str, ...], bool]:
    parsed, auto = _parse_allowed_tokens(value, VALID_BLOCK_TYPES, "block type", allow_auto=True)
    return parsed or VALID_BLOCK_TYPES, auto


def _indent_multiline(text: str, fallback: str) -> str:
    value = text if text else fallback
    return "\n".join(f"  {line}" if line else "" for line in value.splitlines())


def _json_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _selected_lines(selected: Sequence[str], source: dict[str, str]) -> str:
    return "\n".join(f"- {item}: {source[item]}" for item in selected)


def build_schema_v2_prompt(config: PromptConfig) -> str:
    module_key = config.module_key.strip() or "materials"
    module_label = display_label_for(module_key, config.module_label)
    bucket = config.bucket if config.bucket in VALID_BUCKETS else "pastUnit"
    id_prefix = config.id_prefix.strip() or default_id_prefix(module_key, config.year)
    question_types = config.question_types or ("mcq",)
    answer_modes = config.answer_modes or ("single",)
    block_types = config.block_types or VALID_BLOCK_TYPES
    block_mode_label = "automatic mixed content" if config.auto_block_types else ", ".join(block_types)
    source_fallback = (
        "No source text was supplied to this prompt generator. Use only the material the user "
        "pastes, describes, or attaches in this Claude chat. This generator does not parse PDFs."
    )

    block_lines = _selected_lines(block_types, BLOCK_GUIDANCE)
    answer_lines = "\n".join(f"- {mode}: {ANSWER_GUIDANCE[mode]}" for mode in answer_modes)
    type_lines = _selected_lines(question_types, QUESTION_TYPE_GUIDANCE)
    existing_id_rule = (
        "Preserve existing IDs only when the source explicitly supplies IDs and they already start "
        f"with {id_prefix}_. Otherwise create new IDs."
        if config.use_existing_ids
        else "Create new IDs unless the source explicitly says an existing ID must be preserved."
    )

    return f"""Mora Quiz universal question-pack generation prompt

Role and scope:
Generate a Mora Quiz schemaVersion 2 JSON question pack for the module/dataKey "{module_key}" ({module_label}).
This universal prompt can be used for Materials, Mechanics, Fluid Mechanics, Mathematics, Computer Science, or a future custom module. Computer Science is not required or special here.
Return valid JSON only. No markdown fences. No commentary before or after the JSON.

Context:
- module/dataKey: {module_key}
- display label: {module_label}
- destination bucket: {bucket}
- unit: {config.unit or "use source material, or leave blank if genuinely unknown"}
- topic: {config.topic or "use source material, or leave blank if genuinely unknown"}
- year/paper metadata: {config.year or "unknown"}{(" / " + config.paper) if config.paper else ""}
- source scenario: {config.source_scenario}
- destination note: {config.destination_note or "none"}
- extra context notes: {config.context_notes or "none"}

Source material:
{_indent_multiline(config.source_text, source_fallback)}

Marking scheme or answer notes:
{_indent_multiline(config.marking_scheme, "  None supplied. Infer only when the source makes the answer clear; otherwise mark the question draft with a source.note.")}

Required top-level JSON object:
{{"schemaVersion":2,"subject":"{_json_string(module_key)}","bucket":"{bucket}","stimuli":{{}},"images":{{}},"questions":[]}}

Schema rules:
- Use schemaVersion 2 exactly.
- Use bucket exactly "{bucket}".
- Use subject "{module_key}" at pack level and include subject on each new question when practical.
- questions must be an array of current-schema question objects.
- Allowed question types in this prompt: {", ".join(question_types)}.
- Validator-supported question types are: {", ".join(VALID_QUESTION_TYPES)}.
- Allowed answer modes in this prompt: {", ".join(answer_modes)}.
- Validator-supported answer modes are: {", ".join(VALID_ANSWER_MODES)}.
- Validator-supported matchMode values are: {", ".join(VALID_MATCH_MODES)}.
- Expected content blocks: {block_mode_label}.
- Supported block types are only: {", ".join(VALID_BLOCK_TYPES)}.
- There is no html block type. Do not output type "html", raw HTML blocks, or HTML as an escape hatch.

Question type guidance:
{type_lines}

Block guidance:
{block_lines}

Answer guidance:
{answer_lines}
- For self_mark and manual, value must be null exactly, for example {ANSWER_GUIDANCE["self_mark"]} and {ANSWER_GUIDANCE["manual"]}.
- True/false questions should be modelled as mcq options, usually labels a and b, with answer mode single.
- Matching may be used as a question type only. Do not create answer mode "matching"; it is not validator-supported.
- Ordered matching or ordered short-answer checks, when needed, must use mode text or multiple with matchMode "all" plus orderedMatch true. orderedMatch and extraAllowed are valid only with matchMode "all".
- Exact numeric answers must use mode "numeric" with tolerance 0. Do not invent a numeric_exact question type or answer mode.
- Use nonzero tolerance only when the question explicitly permits approximation or a justified numerical margin. Do not apply tolerance to exact integer/root answers automatically.
- For approximate numeric answers near zero use toleranceType "absolute"; otherwise relative tolerance may be appropriate.

ID rules:
- Every question id must be globally unique across the whole app, not only inside this pack.
- Every new id must be module-prefixed and start with "{id_prefix}_".
- Use stable, readable IDs such as "{id_prefix}_Q001" or "{id_prefix}_UNIT1_Q001".
- {existing_id_rule}
- Do not recycle IDs for distinct questions. Do not use semester or department as the save identity.

Images and shared context:
- Pack-level stimuli and images are allowed in this generated JSON for review, validation, and future pack workflows.
- A non-empty pack-level stimuli object or images registry can be validated and reviewed, but quiz_manager currently refuses live apply because subject_data chunks cannot preserve pack-level shared context yet.
- Do not flatten, duplicate, or hide shared context merely to bypass that quiz_manager limitation.
- For shared passages, figures, or tables, use stimuli with stimulusId when that is the most faithful representation.
- For image blocks, register the asset in images and reference by assetId. Include alt text and sourcePage when known.

Source fidelity and uncertainty:
- Preserve the source meaning, numbers, units, symbols, code indentation, table rows, option order, and question grouping.
- Do not invent missing facts, answers, diagrams, pages, or source citations.
- If the source is ambiguous or incomplete, keep the item as status "draft" and add a concise source.note explaining the uncertainty.
- If answers are not present for a written/proof question, use self_mark or manual with value null and provide a model explanation from the source only when justified.
- Explanations should be block arrays, not legacy exp strings.

Validation checklist before output:
- Top-level JSON parses with no comments and no trailing commas.
- schemaVersion is the number 2.
- No markdown fences or extra text surround the JSON.
- No html blocks appear anywhere.
- Every question has id, type, body or stimulusId, answer, explanation, and status.
- MCQ/multi_select options have labels and block-array bodies.
- single/multiple answer labels match option labels.
- numeric/text arrays with two or more values include matchMode.
- manual/self_mark values are null.
- Image assetIds used by blocks exist in the pack-level images registry.
- The JSON should be compatible with tools/validate_questions.py and with quiz_manager.py dry-run preview. Remember that quiz_manager live apply refuses non-empty pack-level stimuli/images for now.

Output:
Return the JSON object only."""


def build_legacy_prompt(config: PromptConfig) -> str:
    module_key = config.module_key.strip() or "materials"
    id_prefix = config.id_prefix.strip() or default_id_prefix(module_key, config.year)
    source_fallback = (
        "No source text was supplied to this prompt generator. Use only material pasted, "
        "described, or attached in this Claude chat."
    )
    return f"""Mora Quiz legacy-compatible flat MCQ prompt

This is explicit legacy mode. It is not the default current schemaVersion 2 workflow.
Return valid JSON only: a JSON array of flat question objects. No markdown fences. No commentary.

Legacy object fields:
- id: globally unique, module-prefixed, starting with "{id_prefix}_"
- unit
- year
- text
- opts: array of option strings
- ans: answer label such as "a"
- exp: explanation string
- type: "mcq"

Rules:
- Use this only for older flat MCQ workflows that will be reviewed, wrapped, converted, or imported carefully.
- Do not output schemaVersion 2 unless the user leaves legacy mode.
- Do not use HTML blocks or raw HTML as structure.
- Use clear math text or LaTeX such as \\frac{{numerator}}{{denominator}} when needed.
- Preserve source wording, units, option order, and answer evidence.
- If an answer is uncertain, set exp to explain the uncertainty instead of inventing.

Module/dataKey: {module_key}
Unit: {config.unit or "use source material"}
Year/paper: {config.year or "unknown"}{(" / " + config.paper) if config.paper else ""}

Source material:
{_indent_multiline(config.source_text, source_fallback)}

Output the JSON array only."""


def build_prompt(config: PromptConfig) -> str:
    return build_legacy_prompt(config) if config.legacy else build_schema_v2_prompt(config)


def write_output_file(path: Path, text: str, *, overwrite: bool = False) -> None:
    if path.suffix.lower() not in {".md", ".txt"}:
        raise ValueError("Prompt output path must end in .md or .txt")
    if path.exists() and not overwrite:
        raise FileExistsError(f"Refusing to overwrite existing file: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text + ("\n" if not text.endswith("\n") else ""), encoding="utf-8")


def copy_to_clipboard(
    text: str,
    *,
    allow_pyperclip: bool = True,
    which: Callable[[str], str | None] = shutil.which,
) -> tuple[bool, str]:
    errors: list[str] = []

    if allow_pyperclip:
        try:
            import pyperclip  # type: ignore

            pyperclip.copy(text)
            return True, "pyperclip"
        except Exception as exc:  # pragma: no cover - environment dependent
            errors.append(f"pyperclip: {exc}")

    clip_path = which("clip")
    if clip_path:
        try:
            subprocess.run(
                [clip_path],
                input=text,
                text=True,
                encoding="utf-16le",
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            return True, "clip.exe"
        except Exception as exc:  # pragma: no cover - environment dependent
            errors.append(f"clip.exe: {exc}")

    powershell = which("powershell") or which("pwsh")
    if powershell:
        try:
            subprocess.run(
                [powershell, "-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
                input=text,
                text=True,
                encoding="utf-8",
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            return True, "Set-Clipboard"
        except Exception as exc:  # pragma: no cover - environment dependent
            errors.append(f"Set-Clipboard: {exc}")

    return False, "; ".join(errors) or "no clipboard backend found"


def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    raw = input(f"{prompt}{suffix}: ").strip()
    return raw if raw else default


def ask_yes_no(prompt: str, *, default: bool = False) -> bool:
    suffix = "Y/n" if default else "y/N"
    while True:
        raw = input(f"{prompt} ({suffix}): ").strip().lower()
        if not raw:
            return default
        if raw in {"y", "yes"}:
            return True
        if raw in {"n", "no"}:
            return False
        print("Please answer y or n.")


def ask_multiline(prompt: str) -> str:
    print(prompt)
    print("Enter .done on its own line when finished. Leave blank then .done to skip.")
    lines: list[str] = []
    while True:
        line = input()
        if line.strip() == ".done":
            return "\n".join(lines).strip()
        lines.append(line)


def choose_tokens(prompt: str, allowed: Sequence[str], default: str, *, allow_auto: bool = False) -> tuple[tuple[str, ...], bool]:
    allowed_text = ", ".join(allowed)
    auto_hint = ", auto" if allow_auto else ""
    while True:
        raw = ask(f"{prompt} ({allowed_text}{auto_hint})", default)
        try:
            return _parse_allowed_tokens(raw, allowed, prompt, allow_auto=allow_auto)
        except ValueError as exc:
            print(exc)


def build_config_interactively() -> PromptConfig:
    print("Mora Quiz Claude Prompt Generator")
    print("Default: schemaVersion 2 question pack. Type Ctrl+C to cancel.")
    discovered = discover_module_keys()
    if discovered:
        print("Discovered module keys: " + ", ".join(discovered))

    legacy = ask_yes_no("Use explicit legacy-compatible flat MCQ mode?", default=False)
    default_module = "materials" if "materials" in discovered or not discovered else discovered[0]
    module_key = ask("Module/dataKey", default_module)
    module_label = ask("Display label", display_label_for(module_key))
    bucket = ask("Destination bucket", "pastUnit")
    while bucket not in VALID_BUCKETS:
        print("Bucket must be one of: " + ", ".join(VALID_BUCKETS))
        bucket = ask("Destination bucket", "pastUnit")

    unit = ask("Unit", "")
    topic = ask("Topic", "")
    year = ask("Year", "")
    paper = ask("Paper/source label", "")
    id_prefix = ask("ID prefix", default_id_prefix(module_key, year))
    context_notes = ask("Semester/context notes", "")
    destination_note = ask("Destination note", "")
    source_scenario = ask("Source scenario", "pasted source text")
    question_types, _ = choose_tokens("Question types", VALID_QUESTION_TYPES, "mcq")
    answer_modes, _ = choose_tokens("Answer modes", VALID_ANSWER_MODES, "single")
    block_types, auto_block_types = choose_tokens("Block/content types", VALID_BLOCK_TYPES, "auto", allow_auto=True)
    use_existing_ids = ask_yes_no("Source already contains IDs to preserve?", default=False)
    marking_scheme = ask_multiline("Paste marking scheme/answer notes if available.")
    source_text = ask_multiline("Paste source questions, source description, ranges, image notes, or PDF description.")

    return PromptConfig(
        module_key=module_key,
        module_label=module_label,
        bucket=bucket,
        unit=unit,
        topic=topic,
        year=year,
        paper=paper,
        id_prefix=id_prefix,
        context_notes=context_notes,
        destination_note=destination_note,
        source_scenario=source_scenario,
        source_text=source_text,
        marking_scheme=marking_scheme,
        question_types=question_types or ("mcq",),
        answer_modes=answer_modes or ("single",),
        block_types=block_types or VALID_BLOCK_TYPES,
        auto_block_types=auto_block_types,
        use_existing_ids=use_existing_ids,
        legacy=legacy,
    )


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate a Mora Quiz Claude prompt. Defaults to schemaVersion 2 packs.",
    )
    parser.add_argument("--module", default="materials", help="Module/dataKey or custom future module key")
    parser.add_argument("--module-label", default="", help="Human display label for the module")
    parser.add_argument("--bucket", default="pastUnit", choices=VALID_BUCKETS, help="Destination bucket")
    parser.add_argument("--unit", default="", help="Unit metadata or label")
    parser.add_argument("--topic", default="", help="Topic metadata or label")
    parser.add_argument("--year", default="", help="Year metadata")
    parser.add_argument("--paper", default="", help="Paper/source metadata")
    parser.add_argument("--id-prefix", default="", help="Required prefix for new question IDs")
    parser.add_argument("--context", default="", help="Semester/context notes")
    parser.add_argument("--destination-note", default="", help="Destination/import note for the generated prompt")
    parser.add_argument("--source-scenario", default="pasted source text", help="Source scenario description")
    parser.add_argument("--source", default="", help="Source text/description to embed in the prompt")
    parser.add_argument("--source-file", help="Read source text/description from a UTF-8 file")
    parser.add_argument("--marking-scheme", default="", help="Marking scheme or answer notes")
    parser.add_argument("--question-types", default="mcq", help="Comma-separated question types, or all")
    parser.add_argument("--answer-modes", default="single", help="Comma-separated answer modes, or all")
    parser.add_argument("--block-types", default="auto", help="Comma-separated block types, all, or auto")
    parser.add_argument("--existing-ids", action="store_true", help="Tell Claude to preserve source IDs when valid")
    parser.add_argument("--legacy", action="store_true", help="Generate explicit legacy-compatible flat MCQ prompt")
    parser.add_argument("--output", help="Save prompt to a .md or .txt file")
    parser.add_argument("--overwrite", action="store_true", help="Allow overwriting --output")
    parser.add_argument("--copy", action="store_true", help="Attempt to copy the generated prompt to the clipboard")
    return parser


def config_from_args(args: argparse.Namespace, parser: argparse.ArgumentParser) -> PromptConfig:
    try:
        question_types = parse_question_types(args.question_types)
        answer_modes = parse_answer_modes(args.answer_modes)
        block_types, auto_block_types = parse_block_types(args.block_types)
    except ValueError as exc:
        parser.error(str(exc))

    source_text = args.source
    if args.source_file:
        source_text = Path(args.source_file).read_text(encoding="utf-8")

    return PromptConfig(
        module_key=args.module,
        module_label=display_label_for(args.module, args.module_label),
        bucket=args.bucket,
        unit=args.unit,
        topic=args.topic,
        year=args.year,
        paper=args.paper,
        id_prefix=args.id_prefix,
        context_notes=args.context,
        destination_note=args.destination_note,
        source_scenario=args.source_scenario,
        source_text=source_text,
        marking_scheme=args.marking_scheme,
        question_types=question_types,
        answer_modes=answer_modes,
        block_types=block_types,
        auto_block_types=auto_block_types,
        use_existing_ids=args.existing_ids,
        legacy=args.legacy,
    )


def run_interactive() -> int:
    try:
        config = build_config_interactively()
    except KeyboardInterrupt:
        print("\nCancelled.")
        return 130

    prompt = build_prompt(config)
    print("\n" + "=" * 72)
    print(prompt)
    print("=" * 72)

    if ask_yes_no("Copy prompt to clipboard?", default=True):
        ok, backend = copy_to_clipboard(prompt)
        print(f"Clipboard: {'copied via ' + backend if ok else 'not copied - ' + backend}")

    if ask_yes_no("Save prompt to .md or .txt file?", default=False):
        while True:
            raw_path = ask("Output path", "mora_quiz_prompt.md")
            path = Path(raw_path)
            overwrite = False
            if path.exists():
                overwrite = ask_yes_no(f"{path} exists. Overwrite?", default=False)
                if not overwrite:
                    print("Choose a different path or answer yes to overwrite.")
                    continue
            try:
                write_output_file(path, prompt, overwrite=overwrite)
            except ValueError as exc:
                print(exc)
                continue
            print(f"Saved prompt: {path}")
            break
    return 0


def main(argv: list[str] | None = None) -> int:
    if argv is None:
        argv = sys.argv[1:]
    if not argv:
        return run_interactive()

    parser = build_arg_parser()
    args = parser.parse_args(argv)
    config = config_from_args(args, parser)
    prompt = build_prompt(config)

    if args.output:
        try:
            write_output_file(Path(args.output), prompt, overwrite=args.overwrite)
        except (OSError, ValueError) as exc:
            parser.error(str(exc))
    else:
        print(prompt)

    if args.copy:
        ok, backend = copy_to_clipboard(prompt)
        if not ok:
            print(f"Clipboard copy failed: {backend}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
