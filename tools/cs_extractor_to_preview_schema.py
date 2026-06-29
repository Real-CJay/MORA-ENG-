#!/usr/bin/env python3
"""Convert reviewed CS extractor JSON into Mora Quiz preview schema packs.

This is a tooling-only bridge for dev previews. It does not create live subject
data and does not modify input files.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


LETTERS = "abcdefghijklmnopqrstuvwxyz"
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
MANIFEST_MARKERS = ("====IMAGES====", "====IMG====", "====IMAGE====")
URL_RE = re.compile(r"^(?:https?:|data:|blob:|file:)", re.IGNORECASE)


class ConversionError(Exception):
    """Hard conversion failure."""


@dataclass
class ConversionContext:
    subject: str
    warnings: list[str]
    images: dict[str, dict[str, Any]]
    image_ids_by_src: dict[str, str]

    def warn(self, path: str, message: str) -> None:
        self.warnings.append(f"{path}: {message}")


def split_manifest_text(text: str) -> tuple[str, str]:
    upper_text = text.upper()
    positions: list[tuple[int, str]] = []
    for marker in MANIFEST_MARKERS:
        index = upper_text.find(marker)
        if index != -1:
            positions.append((index, marker))
    if not positions:
        return text, ""
    index, marker = min(positions, key=lambda item: item[0])
    return text[:index], text[index + len(marker) :]


def load_payload(path: Path) -> tuple[Any, str]:
    text = path.read_text(encoding="utf-8-sig")
    json_text, manifest_text = split_manifest_text(text)
    stripped = json_text.lstrip("\ufeff \t\r\n")
    if not stripped:
        raise ConversionError("missing JSON payload before image manifest")
    try:
        decoder = json.JSONDecoder()
        payload, end = decoder.raw_decode(stripped)
    except json.JSONDecodeError as exc:
        raise ConversionError(
            f"JSON parse error at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ) from exc
    if stripped[end:].strip():
        raise ConversionError("unexpected non-JSON text before image manifest")
    return payload, manifest_text


def normalize_questions(payload: Any) -> tuple[list[dict[str, Any]], list[Any], dict[str, Any]]:
    metadata: dict[str, Any] = {}
    if isinstance(payload, list):
        questions = payload
        defects: list[Any] = []
    elif isinstance(payload, dict):
        questions = payload.get("questions")
        defects = payload.get("defects", [])
        for key in ("paper", "module", "year", "source", "metadata"):
            if key in payload:
                metadata[key] = payload[key]
    else:
        raise ConversionError("input must be a JSON object or array")

    if not isinstance(questions, list):
        raise ConversionError("missing questions array")
    if not questions:
        raise ConversionError("questions array is empty")
    if not isinstance(defects, list):
        defects = [defects]

    normalized: list[dict[str, Any]] = []
    for index, question in enumerate(questions):
        if isinstance(question, dict):
            normalized.append(question)
        else:
            metadata.setdefault("droppedItems", []).append(index)
    if not normalized:
        raise ConversionError("questions array has no question objects")
    return normalized, defects, metadata


def sanitize_asset_id(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", value.strip())
    cleaned = cleaned.strip("_").lower()
    return cleaned[:90] or "image"


def filename_from_path(src: str) -> str:
    return src.strip().replace("\\", "/").rstrip("/").rsplit("/", 1)[-1]


def looks_filename_only(src: str) -> bool:
    cleaned = src.strip()
    return bool(cleaned) and not URL_RE.match(cleaned) and "/" not in cleaned and "\\" not in cleaned


def string_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return str(value)


def block_text(block: dict[str, Any]) -> str:
    for key in ("value", "text", "code", "latex"):
        value = block.get(key)
        if isinstance(value, str):
            return value
    return ""


def unique_asset_id(base: str, ctx: ConversionContext) -> str:
    candidate = sanitize_asset_id(base)
    if candidate not in ctx.images:
        return candidate
    counter = 2
    while f"{candidate}_{counter}" in ctx.images:
        counter += 1
    return f"{candidate}_{counter}"


def register_image(src: str, block: dict[str, Any], path: str, ctx: ConversionContext) -> str:
    if src in ctx.image_ids_by_src:
        asset_id = ctx.image_ids_by_src[src]
        alt = block.get("alt") or block.get("imgAlt")
        if alt and not ctx.images[asset_id].get("alt"):
            ctx.images[asset_id]["alt"] = string_value(alt)
        return asset_id

    filename = filename_from_path(src)
    base = filename.rsplit(".", 1)[0] if "." in filename else filename
    asset_id = unique_asset_id(f"{ctx.subject}_{base}", ctx)
    entry: dict[str, Any] = {"src": src}
    alt = block.get("alt") or block.get("imgAlt")
    if alt:
        entry["alt"] = string_value(alt)
    caption = block.get("caption") or block.get("description")
    if caption:
        entry["caption"] = string_value(caption)
    source_page = block.get("sourcePage") or block.get("page")
    if source_page is not None:
        entry["sourcePage"] = source_page
    ctx.images[asset_id] = entry
    ctx.image_ids_by_src[src] = asset_id
    if looks_filename_only(src):
        ctx.warn(path, f"filename-only image ref {src!r}; cropper may need to update it before preview")
    return asset_id


def normalize_text_block(block: dict[str, Any], path: str, ctx: ConversionContext) -> dict[str, Any]:
    value = block.get("value", block.get("text", ""))
    if not isinstance(value, str):
        ctx.warn(path, "text block content is not a string; converted with str()")
        value = string_value(value)
    out: dict[str, Any] = {"type": "text", "value": value}
    if isinstance(block.get("inline"), bool):
        out["inline"] = block["inline"]
    return out


def normalize_code_block(block: dict[str, Any], path: str, ctx: ConversionContext) -> dict[str, Any]:
    value = block.get("value")
    if value is None:
        value = block.get("code")
    if value is None:
        value = block.get("text")
    if not isinstance(value, str) or value == "":
        ctx.warn(path, "code block has no code/text/value content")
        value = "" if value is None else string_value(value)
    out: dict[str, Any] = {"type": "code", "value": value}
    language = block.get("language")
    if language is not None:
        out["language"] = string_value(language)
    return out


def normalize_image_block(block: dict[str, Any], path: str, ctx: ConversionContext) -> dict[str, Any]:
    asset_id = block.get("assetId")
    if isinstance(asset_id, str) and asset_id.strip():
        if asset_id.strip() not in ctx.images:
            ctx.warn(path, f"image assetId {asset_id!r} has no images registry entry")
        return {"type": "image", "assetId": asset_id.strip()}

    src = block.get("src") or block.get("img") or block.get("path")
    if not isinstance(src, str) or not src.strip():
        ctx.warn(path, "image block has no img/src/assetId")
        return {"type": "image", "assetId": ""}

    asset_id = register_image(src.strip(), block, path, ctx)
    return {"type": "image", "assetId": asset_id}


def normalize_math_block(block: dict[str, Any], path: str, ctx: ConversionContext) -> dict[str, Any]:
    latex = block.get("latex", block.get("value", block.get("text", "")))
    if not isinstance(latex, str) or latex == "":
        ctx.warn(path, "math block has no latex/value/text content")
        latex = "" if latex is None else string_value(latex)
    out: dict[str, Any] = {"type": "math", "latex": latex}
    if "display" in block:
        out["display"] = bool(block.get("display"))
    return out


def normalize_table_block(block: dict[str, Any], path: str, ctx: ConversionContext) -> dict[str, Any]:
    rows = block.get("rows")
    if not isinstance(rows, list) or not rows:
        ctx.warn(path, "table block has no rows")
        rows = []
    normalized_rows: list[list[str]] = []
    for row_index, row in enumerate(rows):
        if not isinstance(row, list):
            ctx.warn(f"{path}.rows[{row_index}]", "table row is not an array; wrapped as one cell")
            normalized_rows.append([string_value(row)])
        else:
            normalized_rows.append([string_value(cell) for cell in row])
    out: dict[str, Any] = {"type": "table", "rows": normalized_rows}
    if "header" in block:
        out["header"] = bool(block.get("header"))
    return out


def normalize_block(block: Any, path: str, ctx: ConversionContext) -> dict[str, Any]:
    if isinstance(block, str) or isinstance(block, int) or isinstance(block, float):
        return {"type": "text", "value": string_value(block)}
    if not isinstance(block, dict):
        ctx.warn(path, "block is not an object; converted to text")
        return {"type": "text", "value": string_value(block)}

    block_type = block.get("type")
    if block_type == "text" or (block_type is None and ("text" in block or "value" in block)):
        return normalize_text_block(block, path, ctx)
    if block_type == "code":
        return normalize_code_block(block, path, ctx)
    if block_type == "image":
        return normalize_image_block(block, path, ctx)
    if block_type == "math":
        return normalize_math_block(block, path, ctx)
    if block_type == "table":
        return normalize_table_block(block, path, ctx)

    ctx.warn(path, f"unknown block type {block_type!r}; converted to text")
    text = block_text(block)
    if not text:
        text = json.dumps(block, ensure_ascii=False, sort_keys=True)
    return {"type": "text", "value": text}


def normalize_blocks(blocks: Any, path: str, ctx: ConversionContext) -> list[dict[str, Any]]:
    if blocks is None:
        return []
    if not isinstance(blocks, list):
        ctx.warn(path, "blocks field is not an array; converted as one text block")
        return [{"type": "text", "value": string_value(blocks)}]
    return [normalize_block(block, f"{path}[{index}]", ctx) for index, block in enumerate(blocks)]


def normalize_option(option: Any, index: int, path: str, ctx: ConversionContext) -> dict[str, Any]:
    fallback_label = LETTERS[index] if index < len(LETTERS) else str(index + 1)
    if isinstance(option, dict):
        label = string_value(option.get("label") or option.get("id") or fallback_label).strip().lower()
        if isinstance(option.get("body"), list):
            body = normalize_blocks(option["body"], f"{path}.body", ctx)
        elif isinstance(option.get("blocks"), list):
            body = normalize_blocks(option["blocks"], f"{path}.blocks", ctx)
        elif "value" in option or "text" in option:
            body = [{"type": "text", "value": string_value(option.get("value", option.get("text", "")))}]
        else:
            ctx.warn(path, "option object has no body/blocks/text/value; using empty text")
            body = [{"type": "text", "value": ""}]
    else:
        label = fallback_label
        body = [{"type": "text", "value": string_value(option)}]
    return {"label": label or fallback_label, "body": body}


def answer_label_from_value(value: Any, labels: list[str]) -> str | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return labels[value] if 0 <= value < len(labels) else None
    if isinstance(value, str):
        raw = value.strip().lower()
        if raw in labels:
            return raw
        if len(raw) == 1 and raw in LETTERS:
            return raw if raw in labels else None
        if raw.isdigit():
            index = int(raw)
            return labels[index] if 0 <= index < len(labels) else None
    return None


def normalize_answer(question: dict[str, Any], labels: list[str], path: str, ctx: ConversionContext) -> dict[str, Any]:
    ans = question.get("ans")
    if isinstance(ans, list):
        values: list[str] = []
        for item_index, item in enumerate(ans):
            label = answer_label_from_value(item, labels)
            if label is None:
                ctx.warn(f"{path}.ans[{item_index}]", f"invalid answer value {item!r}")
            else:
                values.append(label)
        return {"mode": "multiple", "value": values}

    label = answer_label_from_value(ans, labels)
    if label is None:
        ctx.warn(f"{path}.ans", f"invalid ans {ans!r} for {len(labels)} option(s)")
        label = ""
    return {"mode": "single", "value": label}


def question_type(question: dict[str, Any], answer: dict[str, Any]) -> str:
    raw_type = question.get("type")
    if isinstance(raw_type, str) and raw_type in VALID_QUESTION_TYPES:
        return raw_type
    if answer.get("mode") == "multiple":
        return "multi_select"
    return "mcq"


def convert_question(question: dict[str, Any], index: int, ctx: ConversionContext) -> dict[str, Any]:
    path = f"questions[{index}]"
    qid = question.get("id")
    if not isinstance(qid, str) or not qid.strip():
        qid = f"cs_preview_q{index + 1:03d}"
        ctx.warn(f"{path}.id", f"missing id; generated {qid}")

    body_source = question.get("blocks")
    if body_source is None:
        body_source = question.get("body")
    if body_source is None and question.get("text") is not None:
        body_source = [{"type": "text", "text": question.get("text")}]
    body = normalize_blocks(body_source, f"{path}.blocks", ctx)
    if isinstance(question.get("img"), str) and question["img"].strip():
        body.append(normalize_image_block({
            "type": "image",
            "img": question["img"],
            "alt": question.get("imgAlt"),
        }, f"{path}.img", ctx))
    if not body:
        ctx.warn(f"{path}.blocks", "question has no body/blocks")

    explanation_source = question.get("explanationBlocks")
    if explanation_source is None:
        explanation_source = question.get("explanation")
    if explanation_source is None and question.get("exp") is not None:
        explanation_source = [{"type": "text", "text": question.get("exp")}]
    explanation = normalize_blocks(explanation_source, f"{path}.explanationBlocks", ctx)

    opts = question.get("opts")
    if opts is None:
        opts = question.get("options")
    if not isinstance(opts, list) or not opts:
        ctx.warn(f"{path}.opts", "missing opts/options array")
        opts = []
    options = [normalize_option(option, opt_index, f"{path}.opts[{opt_index}]", ctx) for opt_index, option in enumerate(opts)]
    labels = [option["label"] for option in options]
    answer = normalize_answer(question, labels, path, ctx)

    converted: dict[str, Any] = {
        "id": qid.strip(),
        "subject": ctx.subject,
        "unit": question.get("unit", "N/A"),
        "type": question_type(question, answer),
        "body": body,
        "options": options,
        "answer": answer,
        "explanation": explanation,
        "status": question.get("status", "draft"),
    }

    if question.get("year") is not None:
        converted["year"] = question["year"]
    if isinstance(question.get("source"), dict):
        converted["source"] = question["source"]
    elif question.get("source") is not None:
        converted["source"] = {"label": question["source"]}
    else:
        ctx.warn(f"{path}.source", "missing source")

    metadata: dict[str, Any] = {}
    for key in ("defects", "notes", "reviewNotes"):
        if key in question:
            metadata[key] = question[key]
    if metadata:
        converted["metadata"] = metadata
        if metadata.get("defects"):
            ctx.warn(path, "question-level defects present")

    image_ids = sorted(collect_image_asset_ids(converted.get("body", [])) | collect_image_asset_ids(converted.get("explanation", [])))
    if image_ids:
        converted["images"] = image_ids

    return converted


def collect_image_asset_ids(blocks: list[dict[str, Any]]) -> set[str]:
    ids: set[str] = set()
    for block in blocks:
        if block.get("type") == "image" and isinstance(block.get("assetId"), str) and block.get("assetId"):
            ids.add(block["assetId"])
    return ids


def convert_payload(
    payload: Any,
    *,
    input_path: Path,
    manifest_text: str,
    subject: str,
    bucket: str,
    include_manifest_metadata: bool,
) -> tuple[dict[str, Any], list[str]]:
    questions, defects, input_metadata = normalize_questions(payload)
    warnings: list[str] = []
    input_images = payload.get("images") if isinstance(payload, dict) else None
    initial_images = dict(input_images) if isinstance(input_images, dict) else {}
    ctx = ConversionContext(
        subject=subject,
        warnings=warnings,
        images=initial_images,
        image_ids_by_src={
            entry.get("src"): asset_id
            for asset_id, entry in initial_images.items()
            if isinstance(asset_id, str) and isinstance(entry, dict) and isinstance(entry.get("src"), str)
        },
    )

    if defects:
        ctx.warn("defects", f"{len(defects)} top-level defect(s) present")
    if manifest_text.strip():
        if include_manifest_metadata:
            ctx.warn("====IMAGES====", "manifest embedded in output metadata")
        else:
            ctx.warn("====IMAGES====", "manifest entries present but not embedded in clean JSON output")

    converted_questions = [
        convert_question(question, index, ctx)
        for index, question in enumerate(questions)
    ]

    metadata: dict[str, Any] = {
        "convertedFrom": "cs-extractor",
        "sourceFile": str(input_path),
    }
    if input_metadata:
        metadata["inputMetadata"] = input_metadata
    if defects:
        metadata["defects"] = defects
    if manifest_text.strip():
        metadata["imageManifestPresent"] = True
        if include_manifest_metadata:
            metadata["imageManifest"] = manifest_text.strip()

    pack = {
        "schemaVersion": 2,
        "subject": subject,
        "bucket": bucket,
        "stimuli": {},
        "images": ctx.images,
        "questions": converted_questions,
        "metadata": metadata,
    }
    return pack, warnings


def write_json(path: Path, payload: dict[str, Any], pretty: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(
        payload,
        ensure_ascii=False,
        indent=2 if pretty else None,
        separators=None if pretty else (",", ":"),
    )
    path.write_text(text + "\n", encoding="utf-8")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Convert reviewed CS extraction JSON to Mora Quiz preview/schema v2 JSON."
    )
    parser.add_argument("input", help="Reviewed CS extraction JSON file")
    parser.add_argument("output", help="Output preview/schema JSON file")
    parser.add_argument("--subject", default="cs", help="Pack subject id; default: cs")
    parser.add_argument("--bucket", default="pastPaper", choices=sorted(VALID_BUCKETS), help="Pack bucket; default: pastPaper")
    parser.add_argument("--pretty", action="store_true", help="Write indented JSON")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when warnings are emitted")
    parser.add_argument(
        "--include-manifest-metadata",
        action="store_true",
        help="Embed any trailing ====IMAGES==== manifest text in output metadata",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    output_path = Path(args.output)

    try:
        payload, manifest_text = load_payload(input_path)
        pack, warnings = convert_payload(
            payload,
            input_path=input_path,
            manifest_text=manifest_text,
            subject=args.subject,
            bucket=args.bucket,
            include_manifest_metadata=args.include_manifest_metadata,
        )
        write_json(output_path, pack, args.pretty)
    except (ConversionError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    for warning in warnings:
        print(f"WARNING: {warning}")

    print()
    print("CS extractor to preview schema conversion complete")
    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    print(f"Questions converted: {len(pack.get('questions', []))}")
    print(f"Warnings: {len(warnings)}")

    if args.strict and warnings:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
