#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
pdf_image_extractor.py
======================
Reads Claude's output .txt file (JSON + ====IMAGES==== block),
lets you crop each figure from the PDF with a mouse, and saves
the cropped images to the correct IMAGES/ subfolders.

Also writes  questions_ready.json  with "img" paths updated to
the full relative path (ready for quiz_manager.py import).

Requirements:
    pip install pymupdf pillow opencv-python

Usage:
    python pdf_image_extractor.py

Crop window controls:
    Drag mouse   — draw selection box
    Space/Enter  — confirm crop
    R            — redo (redraw box on same page)
    S            — skip this figure
    Q            — quit immediately
"""

import os
import re
import sys
import json
import textwrap
from pathlib import Path

import cv2
import fitz          # PyMuPDF
import numpy as np
from PIL import Image

# ── Navigation signals ────────────────────────────────────────────────────────

class _Back(Exception):
    """Raised when user types 'back'."""

class _Exit(Exception):
    """Raised when user types 'exit' or presses Q in crop window."""

# ── Console helpers ───────────────────────────────────────────────────────────

def _raw_input(prompt: str) -> str:
    val = input(prompt).strip()
    if val.lower() == "exit":
        raise _Exit
    if val.lower() == "back":
        raise _Back
    return val


def banner(msg: str):
    w = max(len(msg) + 4, 60)
    print(f"\n\033[1;44m  {msg:<{w-4}}  \033[0m\n")


def section(msg: str):
    print(f"\n\033[96m{'─'*60}\033[0m\n  \033[1m{msg}\033[0m\n\033[96m{'─'*60}\033[0m")


def ok(msg: str):
    print(f"  \033[92m✓\033[0m  {msg}")


def warn(msg: str):
    print(f"  \033[93m⚠\033[0m  {msg}")


def err(msg: str):
    print(f"  \033[91m✗\033[0m  {msg}")


def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    val = _raw_input(f"  ? {prompt}{suffix}: ")
    return val if val else default

# ── Parsing ───────────────────────────────────────────────────────────────────

MANIFEST_MARKERS = ("====IMAGES====", "====IMG====", "====IMAGE====")


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
    return text[:index], text[index + len(marker):]


def parse_images_block(text: str) -> list:
    """
    Parse the ====IMAGES==== block from Claude's output.
    Returns a list of dicts:
      { filename, page, questions, unit, folder, description }
    """
    _, block = split_manifest_text(text)
    if not block.strip():
        return []

    entries = []
    # Split on separator lines (--- or ────)
    raw_entries = re.split(r'\n\s*(?:---+|─{3,})\s*\n', block)

    for raw in raw_entries:
        raw = raw.strip()
        if not raw:
            continue

        def field(name: str) -> str:
            m = re.search(rf'^{name}\s*:\s*(.+)$', raw, re.MULTILINE | re.IGNORECASE)
            return m.group(1).strip() if m else ""

        filename    = field("FILENAME")
        page_str    = field("PAGE")
        questions   = field("QUESTIONS")
        unit_str    = field("UNIT")
        folder      = field("FOLDER")
        description = field("DESCRIPTION")

        if not filename:
            continue

        try:
            page = int(page_str)
        except ValueError:
            page = 1

        unit = None
        if unit_str and unit_str.upper() != "N/A":
            m = re.search(r'\d+', unit_str)
            if m:
                unit = int(m.group())

        folder = folder.strip().rstrip("/\\")
        entries.append({
            "filename":    filename,
            "page":        page,
            "questions":   questions,
            "unit":        unit,
            "folder":      f"{folder}/" if folder else "",
            "description": description,
        })

    return entries


def parse_json_payload_block(text: str):
    """Extract the leading JSON object or array before any image manifest."""
    json_text, _ = split_manifest_text(text)
    stripped = json_text.lstrip("\ufeff \t\r\n")
    if not stripped:
        return None
    try:
        payload, _ = json.JSONDecoder().raw_decode(stripped)
        return payload
    except json.JSONDecodeError as e:
        err(f"JSON parse error: {e}")
        return None


def questions_from_payload(payload) -> list:
    if isinstance(payload, dict):
        questions = payload.get("questions", [])
        return questions if isinstance(questions, list) else []
    if isinstance(payload, list):
        return payload
    return []


def replace_payload_questions(payload, questions: list):
    if isinstance(payload, dict):
        payload["questions"] = questions
        return payload
    if isinstance(payload, list):
        return questions
    return {"questions": questions, "defects": []}


def parse_json_block(text: str) -> list:
    """Extract questions from old array-only output or new object-shaped output."""
    return questions_from_payload(parse_json_payload_block(text))


def format_images_block(entries: list) -> str:
    parts: list[str] = []
    for index, entry in enumerate(entries):
        if index:
            parts.extend(["", "---", ""])
        parts.extend([
            f"FILENAME    : {entry.get('filename', '')}",
            f"PAGE        : {entry.get('page', '')}",
            f"QUESTIONS   : {entry.get('questions', '')}",
            f"UNIT        : {entry.get('unit') if entry.get('unit') is not None else 'N/A'}",
            f"FOLDER      : {entry.get('folder', '')}",
            f"DESCRIPTION : {entry.get('description', '')}",
        ])
    return "\n".join(parts).rstrip() + ("\n" if parts else "")


def write_updated_payload(out_path: Path, payload, questions: list, entries: list) -> None:
    updated_payload = replace_payload_questions(payload, questions)
    text = json.dumps(updated_payload, indent=2, ensure_ascii=False)
    if entries:
        text += "\n\n====IMAGES====\n"
        text += format_images_block(entries)
    out_path.write_text(text, encoding="utf-8")


# ── PDF rendering ─────────────────────────────────────────────────────────────

# Zoom factor for rendering — controls pixel resolution of the output image.
# 4.0 gives ~2380×3368px for A4, which is sharp enough for fine diagram labels.
# Increase to 5.0 for very dense diagrams; decrease to 3.0 to speed things up.
PAGE_ZOOM = 4.0


def render_page(pdf_path: str, page_num: int) -> np.ndarray:
    """
    Render a PDF page (1-indexed) to an OpenCV BGR image at PAGE_ZOOM resolution.
    """
    doc  = fitz.open(pdf_path)
    page = doc[page_num - 1]
    mat  = fitz.Matrix(PAGE_ZOOM, PAGE_ZOOM)
    pix  = page.get_pixmap(matrix=mat, alpha=False)
    doc.close()

    img_pil = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)


# ── Crop window ───────────────────────────────────────────────────────────────

# Window name constant
WIN = "PDF Image Extractor  |  Drag to select  |  Space=confirm  R=redo  S=skip  Q=quit"

# Shared state for mouse callback
_sel = {"x1": 0, "y1": 0, "x2": 0, "y2": 0,
        "drawing": False, "done": False}
_base_img = None   # the unmodified page image


def _mouse_cb(event, x, y, flags, param):
    global _sel, _base_img
    if event == cv2.EVENT_LBUTTONDOWN:
        _sel.update(x1=x, y1=y, x2=x, y2=y, drawing=True, done=False)
    elif event == cv2.EVENT_MOUSEMOVE and _sel["drawing"]:
        _sel["x2"] = x
        _sel["y2"] = y
        # Draw live rectangle on a copy
        overlay = _base_img.copy()
        cv2.rectangle(overlay,
                      (_sel["x1"], _sel["y1"]),
                      (_sel["x2"], _sel["y2"]),
                      (0, 200, 0), 2)
        cv2.imshow(WIN, overlay)
    elif event == cv2.EVENT_LBUTTONUP:
        _sel["x2"]     = x
        _sel["y2"]     = y
        _sel["drawing"] = False
        _sel["done"]    = True
        overlay = _base_img.copy()
        cv2.rectangle(overlay,
                      (_sel["x1"], _sel["y1"]),
                      (_sel["x2"], _sel["y2"]),
                      (0, 255, 0), 2)
        cv2.imshow(WIN, overlay)


def _norm_rect(x1, y1, x2, y2):
    """Return (x, y, w, h) with positive width/height."""
    lx, rx = sorted([x1, x2])
    ty, by = sorted([y1, y2])
    return lx, ty, rx - lx, by - ty


def crop_figure(page_img: np.ndarray, entry: dict) -> np.ndarray | None:
    """
    Show the page in an OpenCV window with a fixed info bar above it.
    The info bar is a separate black strip — it never overlaps the page.
    Mouse coordinates are offset so the crop maps correctly to the page.
    Returns the cropped image array, or None if skipped.
    Raises _Exit if Q is pressed.
    """
    global _sel, _base_img

    h_orig, w_orig = page_img.shape[:2]

    # ── Fit page to screen ────────────────────────────────────────────────────
    MAX_H = 860   # leave room for the info bar
    MAX_W = 1400
    scale  = min(MAX_W / w_orig, MAX_H / h_orig, 1.0)
    disp_w = int(w_orig * scale)
    disp_h = int(h_orig * scale)

    page_disp = cv2.resize(page_img, (disp_w, disp_h),
                           interpolation=cv2.INTER_AREA)

    # ── Build info bar ────────────────────────────────────────────────────────
    # Fixed black strip above the page — text never touches the page area
    BAR_H    = 80
    bar      = np.zeros((BAR_H, disp_w, 3), dtype=np.uint8)
    bar_lines = [
        f"Fig: {entry['filename']}   Page {entry['page']}   Used by: {entry['questions']}",
        f"Desc: {entry['description']}",
        "Drag to select   Space/Enter = confirm   R = redo   S = skip   Q = quit",
    ]
    for i, line in enumerate(bar_lines):
        # Truncate long lines to fit bar width
        max_chars = disp_w // 7
        if len(line) > max_chars:
            line = line[:max_chars - 1] + "…"
        cv2.putText(bar, line, (8, 18 + i * 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.46,
                    (180, 180, 180), 1, cv2.LINE_AA)

    # ── Composite: bar on top, page below ────────────────────────────────────
    # The mouse Y offset = BAR_H — any click below BAR_H is on the page
    def _make_composite(page_layer: np.ndarray) -> np.ndarray:
        return np.vstack([bar, page_layer])

    while True:
        _sel.update(x1=0, y1=0, x2=0, y2=0, drawing=False, done=False)
        _base_img = _make_composite(page_disp.copy())

        total_h = BAR_H + disp_h
        cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(WIN, disp_w, total_h)
        cv2.setMouseCallback(WIN, _mouse_cb)
        cv2.imshow(WIN, _base_img)

        # Wait for user action
        while True:
            key = cv2.waitKey(20) & 0xFF
            if key in (ord('q'), ord('Q')):
                cv2.destroyAllWindows()
                raise _Exit
            if key in (ord('s'), ord('S')):
                cv2.destroyAllWindows()
                return None
            if key in (ord('r'), ord('R')):
                break   # redo — restart outer while loop
            if key in (13, 32):  # Enter or Space
                if _sel["done"]:
                    # Subtract bar offset from Y to get page-relative coords
                    x, y, w, h = _norm_rect(
                        _sel["x1"], _sel["y1"] - BAR_H,
                        _sel["x2"], _sel["y2"] - BAR_H
                    )
                    # Clamp to page display area
                    x = max(0, x)
                    y = max(0, y)
                    w = min(w, disp_w - x)
                    h = min(h, disp_h - y)
                    if w > 5 and h > 5:
                        # Scale back to full resolution
                        rx = int(x / scale)
                        ry = int(y / scale)
                        rw = int(w / scale)
                        rh = int(h / scale)
                        # Clamp to original image bounds
                        rx = max(0, min(rx, w_orig - 1))
                        ry = max(0, min(ry, h_orig - 1))
                        rw = min(rw, w_orig - rx)
                        rh = min(rh, h_orig - ry)
                        crop = page_img[ry:ry+rh, rx:rx+rw]
                        cv2.destroyAllWindows()
                        return crop
                    else:
                        warn("Selection too small — drag a larger box.")
                else:
                    warn("Draw a box first, then press Space/Enter.")


# ── Save helper ───────────────────────────────────────────────────────────────

def save_crop(crop: np.ndarray, root: Path, entry: dict) -> Path:
    """
    Save the cropped image to   root / entry['folder'] / entry['filename'].
    Creates directories as needed.
    Returns the saved path.
    """
    dest_dir = root / Path(entry["folder"])
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest     = dest_dir / entry["filename"]
    cv2.imwrite(str(dest), crop)
    return dest


# ── JSON path updater ─────────────────────────────────────────────────────────

def _update_image_block_paths(blocks: list, lookup: dict) -> None:
    """Update image block img values in-place when they match a saved crop."""
    for block in blocks:
        if not isinstance(block, dict):
            continue
        if block.get("type") != "image":
            continue
        for key in ("img", "src"):
            img = block.get(key, "")
            if not isinstance(img, str) or not img.strip():
                continue
            match = lookup.get(img) or lookup.get(Path(img.replace("\\", "/")).name)
            if match:
                block[key] = match


def update_json_img_paths(questions: list, entries: list, saved: dict) -> list:
    """
    For each entry that was saved, update the "img" field in every matching
    question to the full relative path  folder/filename.
    saved: { filename -> full_relative_path_str }
    """
    # Build lookup: filename → full relative path
    lookup = {}   # filename → "IMAGES/.../file.png"
    for entry in entries:
        fn = entry["filename"]
        if fn in saved:
            lookup[fn] = saved[fn]

    for q in questions:
        img = q.get("img", "")
        if isinstance(img, str) and img:
            match = lookup.get(img) or lookup.get(Path(img.replace("\\", "/")).name)
            if match:
                q["img"] = match

        for field in ("blocks", "body", "explanationBlocks", "explanation"):
            blocks = q.get(field)
            if isinstance(blocks, list):
                _update_image_block_paths(blocks, lookup)

    return questions


# ── Path constants ────────────────────────────────────────────────────────────

AI_EXPORTS_FOLDER = Path(r"C:\Users\CJay\Documents\ACA\QUIZ APP\AI exports")
JSON_FILES_FOLDER = Path(r"C:\Users\CJay\Documents\ACA\QUIZ APP\JSON files")
QUIZ_ROOT         = Path(r"C:\Users\CJay\Documents\ACA\QUIZ APP\QUIZ")


def _resolve_export_path(raw: str) -> Path:
    """Bare filename → AI_EXPORTS_FOLDER/name.json. Full path used as-is."""
    p = Path(raw.strip('"\''))
    if p.is_absolute() or (len(raw) > 1 and raw[1] == ':'):
        return p if p.suffix else p.with_suffix('.json')
    name = p.name if p.name else str(p)
    if not name.lower().endswith('.json'):
        name += '.json'
    return AI_EXPORTS_FOLDER / name


# ── Step functions ────────────────────────────────────────────────────────────

def _step_txt_file() -> Path:
    section("Step 1 — Claude output file")
    print(f"  Default folder: {AI_EXPORTS_FOLDER}")
    print("  Type just the filename (no extension needed) or a full path.\n")
    while True:
        raw = ask("Claude output filename")
        p   = _resolve_export_path(raw)
        if p.is_file():
            return p
        err(f"File not found: {p}")


def _step_pdf_file() -> Path:
    section("Step 2 — Original PDF")
    print("  Enter the full path to the original PDF.\n")
    while True:
        raw  = ask("Path to PDF")
        p    = Path(raw.strip('"\''))
        if p.is_file() and p.suffix.lower() == ".pdf":
            return p
        if p.is_file():
            err(f"'{p.name}' is not a PDF.")
        else:
            err(f"File not found: {p}")


# ── Core extraction ───────────────────────────────────────────────────────────

def _run_extraction(txt_path: Path, pdf_path: Path, root_dir: Path):
    """Shared extraction logic used by run_extractor()."""
    section("Parsing Claude output")
    text = txt_path.read_text(encoding="utf-8", errors="replace")

    entries = parse_images_block(text)
    if not entries:
        err("No image block found in the file.")
        print("  Accepted markers: ====IMAGES====, ====IMG====, or ====IMAGE====")
        print("  Make sure you answered Yes to images in claude_prompt_generator.py")
        return

    payload = parse_json_payload_block(text)
    questions = questions_from_payload(payload)
    if not questions:
        warn("Could not parse JSON array — output JSON will not be written.")

    ok(f"Found {len(entries)} figure(s) to extract.")
    ok(f"Found {len(questions)} question(s) in JSON.")

    print()
    for idx, e in enumerate(entries, 1):
        print(f"  {idx}. {e['filename']}")
        print(f"       Page {e['page']}  |  {e['questions']}")
        print(f"       → {e['folder']}")

    print()
    c = ask("Proceed with cropping? [Y/n]", "y").lower()
    if c in ("n", "no"):
        print("\n  Cancelled.\n")
        return

    banner("Cropping figures")
    saved:   dict = {}
    skipped: list = []

    for idx, entry in enumerate(entries, 1):
        print(f"\n{'━'*60}")
        print(f"  Figure {idx} of {len(entries)}")
        print(f"  File     : {entry['filename']}")
        print(f"  Page     : {entry['page']}")
        print(f"  Used by  : {entry['questions']}")
        print(f"  Save to  : {entry['folder']}")
        print(f"  Desc     : {entry['description']}")
        print(f"{'━'*60}")

        try:
            print(f"\n  Rendering page {entry['page']}…", end=" ", flush=True)
            page_img = render_page(str(pdf_path), entry["page"])
            print("done.")
        except Exception as exc:
            err(f"Could not render page {entry['page']}: {exc}")
            skipped.append(entry["filename"])
            continue

        print("  Opening crop window…\n")
        try:
            crop = crop_figure(page_img, entry)
        except _Exit:
            print("\n  Exiting.\n")
            break

        if crop is None:
            warn(f"Skipped: {entry['filename']}")
            skipped.append(entry["filename"])
            continue

        try:
            dest = save_crop(crop, root_dir, entry)
            rel  = str(dest.relative_to(root_dir)).replace("\\", "/")
            saved[entry["filename"]] = rel
            ok(f"Saved → {rel}")
        except Exception as exc:
            err(f"Could not save {entry['filename']}: {exc}")
            skipped.append(entry["filename"])

    section("Writing output")
    if questions and saved:
        questions = update_json_img_paths(questions, entries, saved)
        out_json  = JSON_FILES_FOLDER / txt_path.name
        write_updated_payload(out_json, payload, questions, entries)
        ok(f"Saved → {out_json}")
    elif not questions:
        warn("No JSON parsed — output file not written.")
    else:
        warn("No figures saved — output file not written.")

    print(f"\n{'═'*60}")
    print(f"  DONE")
    print(f"  Saved   : {len(saved)} figure(s)")
    print(f"  Skipped : {len(skipped)} figure(s)")
    if skipped:
        for fn in skipped:
            print(f"    • {fn}")
    print(f"{'═'*60}\n")


# ── Entry points ──────────────────────────────────────────────────────────────

def run_extractor(txt_path: Path = None, pdf_path: Path = None):
    """Callable from claude_prompt_generator.py or run standalone."""
    banner("PDF Image Extractor")
    print(f"  Images save to    : {QUIZ_ROOT}")
    print(f"  Output JSON saves : {JSON_FILES_FOLDER}")
    print("  Type  back  to undo.  Type  exit  to quit.\n")

    STEPS = [
        ("txt_path", lambda R: _step_txt_file() if txt_path is None else txt_path),
        ("pdf_path", lambda R: _step_pdf_file() if pdf_path is None else pdf_path),
    ]
    R: dict = {}
    i = 0
    while i < len(STEPS):
        key, runner = STEPS[i]
        try:
            val = runner(R)
            R[key] = val
            i += 1
        except _Back:
            if i > 0:
                i -= 1
                R.pop(STEPS[i][0], None)
                print(f"\n  \033[93m← Going back…\033[0m\n")
            else:
                print("  Already at the first step.")

    _run_extraction(R["txt_path"], R["pdf_path"], QUIZ_ROOT)


if __name__ == "__main__":
    try:
        run_extractor()
    except _Exit:
        print("\n  Exiting. Goodbye!\n")
    except KeyboardInterrupt:
        print("\n\n  Interrupted. Goodbye!\n")


def _step_pdf_file() -> Path:
    section("Step 2 — Original PDF")
    print("  Enter the path to the original PDF this output was generated from.\n")
    while True:
        raw = ask("Path to PDF")
        p   = Path(raw.strip('"').strip("'"))
        if p.is_file() and p.suffix.lower() == ".pdf":
            return p
        if p.is_file():
            err(f"'{p.name}' is not a PDF.")
        else:
            err(f"File not found: {p}")


def _step_root_dir(txt_path: Path) -> Path:
    """Root is the folder containing index.html / IMAGES/."""
    section("Step 3 — Project root folder")
    print("  This is the folder that contains index.html and the IMAGES/ folder.")
    print(f"  Default: same folder as your .txt file  ({txt_path.parent})\n")
    while True:
        raw = ask("Path to project root", str(txt_path.parent))
        p   = Path(raw.strip('"').strip("'"))
        if p.is_dir():
            return p
        err(f"Folder not found: {p}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    banner("PDF Image Extractor")
    print("  Crops figures from a PDF and saves them to the correct IMAGES/ folder.")
    print("  Type  back  to undo the last input.  Type  exit  to quit at any time.\n")

    STEPS = [
        ("txt_path",  lambda R: _step_txt_file()),
        ("pdf_path",  lambda R: _step_pdf_file()),
        ("root_dir",  lambda R: _step_root_dir(R["txt_path"])),
    ]
    SKIP_NONE: set = set()

    R: dict = {}
    i = 0
    while i < len(STEPS):
        key, runner = STEPS[i]
        try:
            val = runner(R)
            if val is None and key not in SKIP_NONE:
                return
            R[key] = val
            i += 1
        except _Back:
            if i > 0:
                i -= 1
                prev_key = STEPS[i][0]
                R.pop(prev_key, None)
                print(f"\n  \033[93m← Going back…\033[0m\n")
            else:
                print("  Already at the first step.")

    txt_path: Path = R["txt_path"]
    pdf_path: Path = R["pdf_path"]
    root_dir: Path = R["root_dir"]

    # ── Read and parse Claude's output ───────────────────────────────────────
    section("Parsing Claude output")
    text = txt_path.read_text(encoding="utf-8", errors="replace")

    entries = parse_images_block(text)
    if not entries:
        err("No image block found in the file.")
        print("  Accepted markers: ====IMAGES====, ====IMG====, or ====IMAGE====")
        print("  Make sure you used the updated claude_prompt_generator.py")
        print("  and that the PDF had images (you answered Yes when asked).")
        return

    payload = parse_json_payload_block(text)
    questions = questions_from_payload(payload)
    if not questions:
        warn("Could not parse JSON array from the file.")
        warn("Image files will be saved but questions_ready.json will not be written.")

    ok(f"Found {len(entries)} figure(s) to extract.")
    ok(f"Found {len(questions)} question(s) in JSON.")

    # ── Print figure list ─────────────────────────────────────────────────────
    print()
    for idx, e in enumerate(entries, 1):
        print(f"  {idx}. {e['filename']}")
        print(f"       Page {e['page']}  |  {e['questions']}")
        print(f"       → {e['folder']}")

    print()
    confirm = ask("Proceed with cropping? [Y/n]", "y").lower()
    if confirm in ("n", "no"):
        print("\n  Cancelled.\n")
        return

    # ── Crop loop ─────────────────────────────────────────────────────────────
    banner("Cropping figures")
    saved:   dict = {}   # filename → relative path string (for JSON update)
    skipped: list = []

    for idx, entry in enumerate(entries, 1):
        print(f"\n{'━'*60}")
        print(f"  Figure {idx} of {len(entries)}")
        print(f"  File     : {entry['filename']}")
        print(f"  Page     : {entry['page']}")
        print(f"  Used by  : {entry['questions']}")
        print(f"  Save to  : {entry['folder']}")
        print(f"  Desc     : {entry['description']}")
        print(f"{'━'*60}")

        # Render the page
        try:
            print(f"\n  Rendering page {entry['page']}…", end=" ", flush=True)
            page_img = render_page(str(pdf_path), entry["page"])
            print("done.")
        except Exception as exc:
            err(f"Could not render page {entry['page']}: {exc}")
            skipped.append(entry["filename"])
            continue

        # Crop window
        print("  Opening crop window…\n")
        try:
            crop = crop_figure(page_img, entry)
        except _Exit:
            print("\n  Exiting.\n")
            break

        if crop is None:
            warn(f"Skipped: {entry['filename']}")
            skipped.append(entry["filename"])
            continue

        # Save
        try:
            dest = save_crop(crop, root_dir, entry)
            rel  = str(dest.relative_to(root_dir)).replace("\\", "/")
            saved[entry["filename"]] = rel
            ok(f"Saved → {rel}")
        except Exception as exc:
            err(f"Could not save {entry['filename']}: {exc}")
            skipped.append(entry["filename"])

    # ── Update JSON and write output ──────────────────────────────────────────
    section("Writing output")

    JSON_FILES_FOLDER = Path(r"C:\Users\CJay\Documents\ACA\QUIZ APP\JSON files")

    if questions and saved:
        questions = update_json_img_paths(questions, entries, saved)
        out_json  = JSON_FILES_FOLDER / txt_path.name
        write_updated_payload(out_json, payload, questions, entries)
        ok(f"Saved → {out_json}")
    elif not questions:
        warn("No JSON was parsed — output file not written.")
    else:
        warn("No figures were saved — output file not written.")

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'═'*60}")
    print(f"  DONE")
    print(f"  Saved   : {len(saved)} figure(s)")
    print(f"  Skipped : {len(skipped)} figure(s)")
    if skipped:
        for fn in skipped:
            print(f"    • {fn}")
    print(f"{'═'*60}\n")


if __name__ == "__main__":
    try:
        main()
    except _Exit:
        print("\n  Exiting. Goodbye!\n")
    except KeyboardInterrupt:
        print("\n\n  Interrupted. Goodbye!\n")
