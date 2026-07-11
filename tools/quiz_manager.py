#!/usr/bin/env python3
"""
quiz_manager.py - Quiz App Content Manager
==========================================
Interactive CLI for managing subjects, units, and questions
in your Engineering Quiz HTML app.

Supports:
   Add / delete subjects
   Add / delete units inside subjects
   Add / delete questions (past-paper or target quiz)  any type (MCQ, fill,
    written, true/false, matching, numerical)
   Import JSON question files produced by claude_prompt_generator.py
   Full flowchart-guided navigation
"""

import argparse
import copy
import importlib.util
import re, sys, os, json, base64, shutil
from pathlib import Path
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any

CURRENT_QUIZ_DATA_PATH = None
CURRENT_QUIZ_ROOT = None
PENDING_SUBJECT_CHUNKS = {}

ARRAY_TYPE_TO_BUCKET = {
    'past_unit': 'pastUnit',
    'past_paper': 'pastPaper',
    'hard': 'targetHard',
    'normal': 'targetNormal',
}

BUCKET_TO_ARRAY_SUFFIX = {
    'pastUnit': 'PAST_UNIT',
    'pastPaper': 'PAST_PAPER',
    'targetHard': 'TARGET_HARD',
    'targetNormal': 'TARGET_NORMAL',
}

ARRAY_TYPE_LABELS = {
    'past_unit': 'Unit-wise Papers > Past Paper Questions',
    'past_paper': 'Full Past Papers',
    'hard': 'Target Quiz - Hard',
    'normal': 'Target Quiz - Normal',
}

ARRAY_TYPE_TO_ID_TAG = {
    'past_unit': 'pu',
    'past_paper': 'pp',
    'hard': 'th',
    'normal': 'tn',
}

VALID_DESTINATION_BUCKETS = set(ARRAY_TYPE_TO_BUCKET.values())


@dataclass
class ValidationOutcome:
    ok: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    unexpected_error: str = ''


@dataclass
class ImportPlan:
    source_path: Path
    destination_subject: str
    destination_bucket: str
    questions: list[dict[str, Any]]
    question_ids: list[str]
    new_ids: list[str]
    duplicate_ids: list[str]
    units: list[Any]
    years: list[Any]
    overrides: list[str]
    files_changed: list[Path]
    validation_warnings: list[str]
    pack_subject: Any = None
    pack_bucket: Any = None
    pack_has_stimuli: bool = False
    pack_has_images: bool = False
    can_apply: bool = True
    apply_blockers: list[str] = field(default_factory=list)

#  Navigation signals

class ExitApp(Exception):
    """Raised when the user types 'exit' at any prompt."""

class GoBack(Exception):
    """Raised when the user types 'back' at any prompt."""

def _read(prompt_str):
    """
    Central input() wrapper.
     'exit' (any case)  raises ExitApp
     'back' (any case)  raises GoBack
    """
    val = input(prompt_str)
    if val.strip().lower() == 'exit':
        raise ExitApp
    if val.strip().lower() == 'back':
        raise GoBack
    return val

#  Colour helpers
def GRN(s): return f"\033[92m{s}\033[0m"
def YLW(s): return f"\033[93m{s}\033[0m"
def RED(s): return f"\033[91m{s}\033[0m"
def CYN(s): return f"\033[96m{s}\033[0m"
def BLD(s): return f"\033[1m{s}\033[0m"
def DIM(s): return f"\033[2m{s}\033[0m"

def banner(msg):
    w = max(len(msg)+4, 60)
    print(f"\n\033[1;44m  {msg:<{w-4}}  \033[0m\n")

def section(msg):
    print(f"\n{CYN('-'*60)}\n  {BLD(msg)}\n{CYN('-'*60)}")

def ok(msg):   print(GRN(f"  [OK] {msg}"))
def warn(msg): print(YLW(f"  [WARN] {msg}"))
def err(msg):  print(RED(f"  [ERR] {msg}"))

def hint():
    """Print the exit/back hint line."""
    print(DIM("  (type 'exit' to quit  |  'back' to undo last answer)\n"))

def ask(prompt, default=None):
    suffix = f" [{default}]" if default is not None else ""
    val = _read(f"  {BLD('?')} {prompt}{suffix}: ").strip()
    return val if val else (str(default) if default is not None else "")

def choose(prompt, options, allow_back=True):
    """Numbered menu. options = list of (label, value) or list of strings."""
    print()
    items = [(o, o) if isinstance(o, str) else o for o in options]
    for i, (label, _) in enumerate(items, 1):
        print(f"  {DIM(str(i)+'.'):>5} {label}")
    if allow_back:
        print(f"  {DIM('0.'):>5} {DIM('<- Back')}")
    print()
    while True:
        raw = _read(f"  {BLD('?')} {prompt}: ").strip()
        if raw == '0' and allow_back:
            return None
        if raw.isdigit() and 1 <= int(raw) <= len(items):
            return items[int(raw)-1][1]
        err("Invalid choice - try again.")

def confirm(msg):
    return _read(f"  {YLW('?')} {msg} (y/N): ").strip().lower() == 'y'


def json_dumps(value, *, indent=2):
    return json.dumps(value, ensure_ascii=False, indent=indent)


def repo_root():
    if CURRENT_QUIZ_ROOT is not None:
        return CURRENT_QUIZ_ROOT
    return Path(__file__).resolve().parents[1]


def bucket_from_array_type(array_type):
    return ARRAY_TYPE_TO_BUCKET.get(array_type)


def array_type_from_bucket(bucket):
    for array_type, item in ARRAY_TYPE_TO_BUCKET.items():
        if item == bucket:
            return array_type
    return None


def question_to_dict(obj):
    if isinstance(obj, dict):
        return obj
    if isinstance(obj, str):
        try:
            parsed = json.loads(obj)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def question_field(obj, key, default=None):
    parsed = question_to_dict(obj)
    if parsed is not None:
        return parsed.get(key, default)

    if not isinstance(obj, str):
        return default
    if key == 'id':
        m = re.search(r'"id"\s*:\s*["\']([^"\']+)["\']', obj)
        return m.group(1) if m else default
    if key == 'unit':
        m = re.search(r'"unit"\s*:\s*(\d+)', obj)
        return int(m.group(1)) if m else default
    if key == 'year':
        m = re.search(r'"year"\s*:\s*(?:"([^"]*)"|\'([^\']*)\'|([^,\n\r}]+))', obj)
        if not m:
            return default
        raw = next((g for g in m.groups() if g is not None), '').strip()
        return raw.strip('"\'') or default
    if key == 'type':
        m = re.search(r'"type"\s*:\s*["\']([^"\']+)["\']', obj)
        return m.group(1) if m else default
    if key == 'text':
        m = re.search(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)"', obj)
        if not m:
            return default
        try:
            return json.loads('"' + m.group(1) + '"')
        except json.JSONDecodeError:
            return m.group(1)
    return default


def normalize_preview_text(value, max_len=92):
    text = re.sub(r'\s+', ' ', str(value or '')).strip()
    if len(text) <= max_len:
        return text
    return text[:max_len - 3].rstrip() + '...'


def block_preview(block):
    if not isinstance(block, dict):
        return ''
    block_type = block.get('type')
    if block_type == 'text':
        return normalize_preview_text(block.get('value'))
    if block_type == 'code':
        return normalize_preview_text(block.get('value') or block.get('code'))
    if block_type == 'math':
        return normalize_preview_text(block.get('latex') or block.get('value'))
    if block_type == 'table':
        rows = block.get('rows')
        if isinstance(rows, list) and rows:
            return normalize_preview_text(' | '.join(str(cell) for cell in rows[0]))
    if block_type == 'image':
        return normalize_preview_text(block.get('alt') or block.get('assetId') or block.get('src'))
    return ''


def question_preview_text(question, max_len=92):
    q = question_to_dict(question)
    if q is None:
        return normalize_preview_text(question_field(question, 'text', '?'), max_len)

    for key in ('text', 'context'):
        if q.get(key):
            return normalize_preview_text(q.get(key), max_len)

    for block_list_key in ('body', 'blocks', 'questionBlocks', 'explanation', 'explanationBlocks'):
        blocks = q.get(block_list_key)
        if isinstance(blocks, list):
            for block in blocks:
                preview = block_preview(block)
                if preview:
                    return normalize_preview_text(preview, max_len)

    options = q.get('options')
    if isinstance(options, list):
        for option in options:
            if isinstance(option, dict) and isinstance(option.get('body'), list):
                for block in option['body']:
                    preview = block_preview(block)
                    if preview:
                        return normalize_preview_text(preview, max_len)
            elif option:
                return normalize_preview_text(option, max_len)

    return '?'


def question_id_list(objects):
    return [qid for qid in (get_id(obj) for obj in objects) if qid]


def collect_live_question_ids(html):
    ids = {}
    for key in get_subject_keys(html):
        for array_type, bucket in ARRAY_TYPE_TO_BUCKET.items():
            var_name = get_array_var_name(key, array_type)
            _, _, objects = read_array(html, var_name)
            for obj in objects:
                qid = get_id(obj)
                if qid:
                    ids.setdefault(qid, []).append((key, bucket))
    return ids


def generated_question_id(subject_key, array_type, existing_ids):
    tag = ARRAY_TYPE_TO_ID_TAG.get(array_type, 'q')
    prefix = re.sub(r'[^A-Za-z0-9_]+', '_', subject_key).strip('_') or 'module'
    n = 1
    while True:
        qid = f"{prefix}_{tag}_{n:03d}"
        if qid not in existing_ids:
            return qid
        n += 1


#  JS parser

def extract_js_objects(text):
    objects, current = [], []
    depth, in_string, escape, quote_char = 0, False, False, ''
    for ch in text:
        if in_string:
            current.append(ch)
            if escape: escape = False
            elif ch == '\\': escape = True
            elif ch == quote_char: in_string = False
        else:
            if ch in ('"', "'", '`'):
                in_string, quote_char = True, ch
                current.append(ch)
            elif ch == '{':
                depth += 1; current.append(ch)
            elif ch == '}':
                depth -= 1; current.append(ch)
                if depth == 0 and current:
                    objects.append(''.join(current).strip())
                    current = []
            elif depth > 0:
                current.append(ch)
    return objects


def find_all_caps_arrays(html):
    header_re = re.compile(r'const\s+([A-Z][A-Z0-9_]*)\s*=\s*\[')
    results = []
    for m in header_re.finditer(html):
        name = m.group(1)
        body_start = m.end()
        depth, in_string, escape, quote_char = 1, False, False, ''
        i = body_start
        while i < len(html) and depth > 0:
            ch = html[i]
            if in_string:
                if escape: escape = False
                elif ch == '\\': escape = True
                elif ch == quote_char: in_string = False
            else:
                if ch in ('"', "'", '`'): in_string, quote_char = True, ch
                elif ch == '[': depth += 1
                elif ch == ']':
                    depth -= 1
                    if depth == 0: break
            i += 1
        end_i = i + 1
        while end_i < len(html) and html[end_i] in ' \t\n\r': end_i += 1
        if end_i < len(html) and html[end_i] == ';': end_i += 1
        results.append((m.start(), end_i, name, html[body_start:i]))
    return results


#  SUBJECTS parser

def parse_subjects_block(html):
    m = re.search(r'const\s+SUBJECTS\s*=\s*\{', html)
    if not m:
        return None, None, None
    body_start = m.end() - 1
    depth, in_string, escape, quote_char = 0, False, False, ''
    i = body_start
    while i < len(html):
        ch = html[i]
        if in_string:
            if escape: escape = False
            elif ch == '\\': escape = True
            elif ch == quote_char: in_string = False
        else:
            if ch in ('"', "'", '`'): in_string, quote_char = True, ch
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end_i = i + 1
                    while end_i < len(html) and html[end_i] in ' \t\n\r': end_i += 1
                    if end_i < len(html) and html[end_i] == ';': end_i += 1
                    return m.start(), end_i, html[m.start():end_i]
        i += 1
    return None, None, None


def get_subject_keys(html):
    _, _, raw = parse_subjects_block(html)
    if not raw:
        return []
    return re.findall(r'^\s{2}([a-zA-Z_]\w*)\s*:\s*\{', raw, re.MULTILINE)


def get_subject_meta(html, key):
    _, _, raw = parse_subjects_block(html)
    if not raw:
        return {}
    pat = re.compile(rf'\b{re.escape(key)}\s*:\s*\{{')
    m = pat.search(raw)
    if not m:
        return {}
    start = m.end() - 1
    depth, in_string, escape, qc = 0, False, False, ''
    i = start
    while i < len(raw):
        ch = raw[i]
        if in_string:
            if escape: escape = False
            elif ch == '\\': escape = True
            elif ch == qc: in_string = False
        else:
            if ch in ('"', "'", '`'): in_string, qc = True, ch
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: break
        i += 1
    block = raw[start:i+1]
    result = {}
    for field in ('label', 'icon', 'desc'):
        fm = re.search(
            rf"'{field}'\s*:\s*'([^']*)'|'{field}'\s*:\s*\"([^\"]*)\"|"
            rf"{field}\s*:\s*'([^']*)'|{field}\s*:\s*\"([^\"]*)\"", block)
        if fm:
            result[field] = next(g for g in fm.groups() if g is not None)
    um = re.search(r'units\s*:\s*\{([^}]*)\}', block)
    if um:
        units = {}
        for um2 in re.finditer(r'(\d+)\s*:\s*[\'"]([^\'"]+)[\'"]', um.group(1)):
            units[int(um2.group(1))] = um2.group(2)
        result['units'] = units
    else:
        result['units'] = {}
    return result


def get_array_var_name(subject_key, array_type):
    """
    array_type: 'past_unit' | 'past_paper' | 'hard' | 'normal'
    Legacy 'past' is treated as 'past_unit' for backwards compatibility.
    """
    if array_type == 'past':
        array_type = 'past_unit'
    K = subject_key.upper()
    if array_type == 'past_unit':  return f'{K}_PAST_UNIT'
    if array_type == 'past_paper': return f'{K}_PAST_PAPER'
    if array_type == 'hard':       return f'{K}_TARGET_HARD'
    if array_type == 'normal':     return f'{K}_TARGET_NORMAL'
    return f'{K}_{array_type.upper()}'


def set_quiz_data_path(src):
    global CURRENT_QUIZ_DATA_PATH, CURRENT_QUIZ_ROOT
    CURRENT_QUIZ_DATA_PATH = Path(src)
    CURRENT_QUIZ_ROOT = CURRENT_QUIZ_DATA_PATH.parent


def _array_name_to_subject_bucket(var_name):
    m = re.match(r'^([A-Z0-9_]+)_(PAST_UNIT|PAST_PAPER|TARGET_HARD|TARGET_NORMAL)$', var_name)
    if not m:
        return None, None
    bucket = {
        'PAST_UNIT': 'pastUnit',
        'PAST_PAPER': 'pastPaper',
        'TARGET_HARD': 'targetHard',
        'TARGET_NORMAL': 'targetNormal',
    }.get(m.group(2))
    return m.group(1).lower(), bucket


def _subject_chunk_path(subject_key):
    if CURRENT_QUIZ_ROOT is None:
        return None
    return CURRENT_QUIZ_ROOT / 'subject_data' / f'{subject_key}.js'


def _find_balanced_js_value(text, start_index, opener, closer):
    depth, in_string, escape, quote_char = 0, False, False, ''
    i = start_index
    while i < len(text):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == quote_char:
                in_string = False
        else:
            if ch in ('"', "'", '`'):
                in_string, quote_char = True, ch
            elif ch == opener:
                depth += 1
            elif ch == closer:
                depth -= 1
                if depth == 0:
                    return i + 1
        i += 1
    return None


def _chunk_assignment_bounds(text, subject_key):
    pat = re.compile(
        rf'window\.MORA_SUBJECT_CHUNKS\s*\[\s*["\']{re.escape(subject_key)}["\']\s*\]\s*=\s*\{{'
    )
    m = pat.search(text)
    if not m:
        return None, None
    obj_start = text.rfind('{', 0, m.end())
    obj_end = _find_balanced_js_value(text, obj_start, '{', '}')
    if obj_end is None:
        return None, None
    end = obj_end
    while end < len(text) and text[end] in ' \t\r\n':
        end += 1
    if end < len(text) and text[end] == ';':
        end += 1
    return obj_start, end


def _empty_chunk():
    return {
        'pastUnit': [],
        'pastPaper': [],
        'targetHard': [],
        'targetNormal': [],
    }


def _read_subject_chunk(subject_key):
    if subject_key in PENDING_SUBJECT_CHUNKS:
        return PENDING_SUBJECT_CHUNKS[subject_key]
    path = _subject_chunk_path(subject_key)
    if path is None or not path.is_file():
        return _empty_chunk()
    text = path.read_text(encoding='utf-8')
    start, end = _chunk_assignment_bounds(text, subject_key)
    if start is None:
        warn(f"Subject chunk for '{subject_key}' is malformed or missing assignment.")
        return _empty_chunk()
    raw_obj = text[start:end].rstrip().rstrip(';').strip()
    try:
        data = json.loads(raw_obj)
    except json.JSONDecodeError as e:
        warn(f"Could not parse subject_data/{subject_key}.js as JSON-like data: {e}")
        return _empty_chunk()
    chunk = _empty_chunk()
    for bucket in chunk:
        if isinstance(data.get(bucket), list):
            chunk[bucket] = copy.deepcopy(data[bucket])
    return chunk


def _object_to_js(obj):
    if isinstance(obj, str):
        return obj
    return json_dumps(obj, indent=2)


def _subject_chunk_file_text(subject_key, chunk):
    normalized = _empty_chunk()
    for bucket in normalized:
        value = chunk.get(bucket, [])
        normalized[bucket] = value if isinstance(value, list) else []
    return (
        f"// {subject_key} question data - lazy loaded by quiz_app.js\n"
        "window.MORA_SUBJECT_CHUNKS = window.MORA_SUBJECT_CHUNKS || {};\n"
        f"window.MORA_SUBJECT_CHUNKS[\"{subject_key}\"] = "
        + json.dumps(normalized, ensure_ascii=False, separators=(',', ':'))
        + ";\n"
    )


def _write_subject_chunk(subject_key, chunk):
    path = _subject_chunk_path(subject_key)
    if path is None:
        warn("Quiz root is unknown; cannot write subject_data chunk.")
        return False
    PENDING_SUBJECT_CHUNKS[subject_key] = chunk
    return True


def _write_subject_chunk_file(subject_key, chunk):
    path = _subject_chunk_path(subject_key)
    if path is None:
        warn("Quiz root is unknown; cannot write subject_data chunk.")
        return False

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(_subject_chunk_file_text(subject_key, chunk), encoding='utf-8')
    return True


def flush_pending_subject_chunks():
    for subject_key, chunk in PENDING_SUBJECT_CHUNKS.items():
        if not _write_subject_chunk_file(subject_key, chunk):
            return False
    PENDING_SUBJECT_CHUNKS.clear()
    return True


def pending_subject_chunk_texts():
    prepared = []
    for subject_key, chunk in PENDING_SUBJECT_CHUNKS.items():
        path = _subject_chunk_path(subject_key)
        if path is None:
            raise RuntimeError("Quiz root is unknown; cannot write subject_data chunk.")
        prepared.append((path, _subject_chunk_file_text(subject_key, chunk)))
    return prepared


def write_text_operations_atomically(operations):
    prepared = []
    replaced = []
    try:
        for target, text in operations:
            target = Path(target)
            target.parent.mkdir(parents=True, exist_ok=True)
            tmp = target.with_name(target.name + '.stage7tmp')
            tmp.write_text(text, encoding='utf-8')
            prepared.append(tmp)

        for target, text in operations:
            target = Path(target)
            tmp = target.with_name(target.name + '.stage7tmp')
            existed = target.exists()
            previous = target.read_bytes() if existed else None
            os.replace(tmp, target)
            replaced.append((target, existed, previous))
        return True
    except Exception as exc:
        for target, existed, previous in reversed(replaced):
            try:
                if existed:
                    target.write_bytes(previous)
                elif target.exists():
                    target.unlink()
            except OSError:
                pass
        err(f"Atomic write failed: {exc}")
        return False
    finally:
        for tmp in prepared:
            try:
                if tmp.exists():
                    tmp.unlink()
            except OSError:
                pass


def write_all_changes(out_path, html):
    operations = pending_subject_chunk_texts()
    operations.append((Path(out_path), html))
    if not write_text_operations_atomically(operations):
        return False
    PENDING_SUBJECT_CHUNKS.clear()
    return True


def _chunk_bucket_objects(subject_key, bucket):
    chunk = _read_subject_chunk(subject_key)
    return copy.deepcopy(chunk.get(bucket, []))


def sync_subject_counts(html):
    keys = get_subject_keys(html)
    if not keys:
        return html
    counts = OrderedDict()
    for key in keys:
        chunk = _read_subject_chunk(key)
        hard_count = len(chunk.get('targetHard', []))
        normal_count = len(chunk.get('targetNormal', []))
        counts[key] = OrderedDict([
            ('pastUnit', OrderedDict([('count', len(chunk.get('pastUnit', []))), ('placeholder', [])])),
            ('pastPaper', OrderedDict([('count', len(chunk.get('pastPaper', []))), ('placeholder', [])])),
            ('targetHard', OrderedDict([('count', hard_count), ('placeholder', [])])),
            ('targetNormal', OrderedDict([('count', normal_count), ('placeholder', [])])),
            ('allTarget', OrderedDict([('count', hard_count + normal_count), ('placeholder', [])])),
        ])
    replacement = 'const SUBJECT_COUNTS = ' + json.dumps(counts, indent=2, ensure_ascii=False) + ';'
    new_html, n = re.subn(
        r'const\s+SUBJECT_COUNTS\s*=\s*\{.*?\};',
        replacement,
        html,
        count=1,
        flags=re.DOTALL
    )
    if n == 0:
        warn("SUBJECT_COUNTS block not found; counts were not refreshed.")
        return html
    return new_html


def describe_array_destination(var_name):
    subject_key, bucket = _array_name_to_subject_bucket(var_name)
    if subject_key and bucket and _subject_chunk_path(subject_key):
        rel = Path('subject_data') / f'{subject_key}.js'
        return f"{rel.as_posix()} / {bucket}"
    return var_name


def known_question_array_names(html):
    names = [name for _, _, name, _ in find_all_caps_arrays(html)]
    existing = set(names)
    for key in get_subject_keys(html):
        for arr_type in ('past_unit', 'past_paper', 'hard', 'normal'):
            name = get_array_var_name(key, arr_type)
            if name not in existing:
                names.append(name)
                existing.add(name)
    return names


#  Array read / write

def read_array(html, var_name):
    for start, end, name, body in find_all_caps_arrays(html):
        if name == var_name:
            return start, end, extract_js_objects(body)
    subject_key, bucket = _array_name_to_subject_bucket(var_name)
    if subject_key and bucket:
        return None, None, _chunk_bucket_objects(subject_key, bucket)
    return None, None, []


def write_array(html, var_name, objects):
    for start, end, name, body in find_all_caps_arrays(html):
        if name == var_name:
            lines = []
            for i, obj in enumerate(objects):
                rendered = _object_to_js(obj)
                obj_lines = rendered.splitlines() or ['{}']
                comma = ',' if i < len(objects) - 1 else ''
                lines.append('  ' + obj_lines[0])
                for extra in obj_lines[1:]:
                    lines.append('  ' + extra)
                if comma:
                    lines[-1] += comma
            new_block = f"const {var_name} = [\n" + '\n'.join(lines) + "\n];"
            return html[:start] + new_block + html[end:]
    subject_key, bucket = _array_name_to_subject_bucket(var_name)
    if subject_key and bucket:
        chunk = _read_subject_chunk(subject_key)
        chunk[bucket] = objects
        if _write_subject_chunk(subject_key, chunk):
            return sync_subject_counts(html)
        warn(f"Could not write subject_data/{subject_key}.js - skipping.")
        return html
    warn(f"Array {var_name} not found - skipping.")
    return html


#  Object helpers

def dict_to_js_obj(d, indent='  '):
    return json_dumps(d, indent=2)


def get_unit(obj_str):
    value = question_field(obj_str, 'unit')
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def get_id(obj_str):
    value = question_field(obj_str, 'id')
    return str(value) if value is not None and str(value) else None


def get_year(obj_str):
    value = question_field(obj_str, 'year')
    return str(value) if value is not None and str(value) else None


def display_question(obj_str, idx):
    uid  = get_unit(obj_str)
    qid  = get_id(obj_str)
    qtype = question_field(obj_str, 'type', 'mcq')
    text = question_preview_text(obj_str, 72)
    unit_label = GRN(f'U{uid}') if uid else ''
    print(f"  {DIM(str(idx)+'.'):>5} {unit_label} {BLD(str(qid))} "
          f"{DIM(f'[{qtype}]')}  {text}")


#  Questions CRUD

def add_question_interactive(html, subject_key):
    section("ADD A QUESTION")
    hint()

    meta  = get_subject_meta(html, subject_key)
    units = meta.get('units', {})

    # Each step is a callable that reads one answer.
    # Results are stored in `answers` keyed by step index.
    # GoBack decrements the step pointer so the step reruns.

    answers = {}   # step_index  value
    step = 0

    def step0():   # bank / arr_type
        return choose("Target question bank", [
            ("Unit-wise Papers > Past Paper Questions", "past_unit"),
            ("Full Past Papers",      "past_paper"),
            ("Target Quiz - Hard",                             "hard"),
            ("Target Quiz - Normal",                           "normal"),
        ])

    def step1():   # qtype
        return choose("Question type", [
            ("MCQ  Multiple Choice",   "mcq"),
            ("Fill in the Blank",       "fill"),
            ("Written / Short Answer",  "written"),
            ("True / False",            "truefalse"),
            ("Numerical / Calculation", "numerical"),
            ("Matching",                "matching"),
        ])

    def step2():   # unit (only for past_unit)
        arr_type = answers[0]
        if arr_type != 'past_unit': return None
        if units:
            uc = choose("Unit", [(f"{v} (Unit {k})", str(k)) for k, v in units.items()])
            return int(uc) if uc is not None else None
        else:
            val = ask("Unit number", 1)
            return int(val) if str(val).isdigit() else None

    def step3():   # year (for both past types)
        arr_type = answers[0]
        if arr_type not in ('past_unit', 'past_paper'): return None
        yr = ask("Year (e.g. 2019)", "")
        return int(yr) if yr.isdigit() else None

    def step4():   # question ID
        arr_type = answers[0]
        all_ids = set(collect_live_question_ids(html))
        auto_id = generated_question_id(subject_key, arr_type, all_ids)
        while True:
            qid = ask("Question ID", auto_id).strip()
            if not qid:
                err("Question ID is required.")
                continue
            if qid in all_ids:
                err("That ID already exists somewhere in the live dataset.")
                continue
            return qid

    def step5():   # question text (multiline)
        print(f"\n  {BLD('Question text')} (blank line to finish):")
        lines = []
        while True:
            line = _read("")
            if line == '' and lines:
                break
            lines.append(line)
        return '\n'.join(lines)

    def step6():   # opts / ans
        qtype = answers[1]
        if qtype == 'mcq':
            print(f"\n  Answer options (blank to finish):")
            opts = []
            while True:
                opt = _read(f"    Option {len(opts)+1}: ").strip()
                if not opt:
                    break
                opts.append(opt)
            ans = int(ask("Correct index (0-based)", 0))
            return (opts, ans)
        elif qtype == 'truefalse':
            ans = 0 if ask("Correct answer (true/false)", "true").lower() == 'true' else 1
            return (['True', 'False'], ans)
        else:
            ans = ask("Model / expected answer")
            return (None, ans)

    def step7():   # explanation
        return ask("Explanation", "")

    steps = [step0, step1, step2, step3, step4, step5, step6, step7]

    while step < len(steps):
        try:
            result = steps[step]()
            # step0 returning None means user picked  Back from bank menu  abort
            if step == 0 and result is None:
                return html
            answers[step] = result
            step += 1
        except GoBack:
            if step == 0:
                warn("Already at the first step.")
            else:
                step -= 1
                warn(f"Went back  re-entering step {step + 1} of {len(steps)}.")

    # Unpack answers
    arr_type = answers[0]
    qtype    = answers[1]
    uid      = answers.get(2)
    year     = answers.get(3)
    qid      = answers[4]
    text     = answers[5]
    opts_ans = answers[6]
    exp      = answers[7]

    var_name = get_array_var_name(subject_key, arr_type)
    _, _, objects = read_array(html, var_name)

    d = {"id": qid, "type": qtype}
    if uid  is not None: d["unit"] = uid
    if year is not None: d["year"] = year
    d["text"] = text

    if qtype in ('mcq', 'truefalse'):
        d['opts'] = opts_ans[0]
        d['ans']  = opts_ans[1]
    else:
        d['ans'] = opts_ans[1]

    d['exp'] = exp

    if   arr_type == 'hard':       d['hard'] = True
    elif arr_type == 'normal':     d['hard'] = False

    obj_str = dict_to_js_obj(d)

    if uid is not None:
        insert_after = None
        for i, o in enumerate(objects):
            if get_unit(o) == uid:
                insert_after = i
        if insert_after is not None:
            objects.insert(insert_after + 1, obj_str)
        else:
            objects.append(obj_str)
    else:
        objects.append(obj_str)

    html = write_array(html, var_name, objects)
    ok(f"Question '{qid}' added to {describe_array_destination(var_name)}.")
    return html


def delete_question_interactive(html, subject_key):
    section("DELETE A QUESTION")
    hint()
    arr_type = choose("Which bank?", [
        ("Unit-wise Papers > Past Paper Questions",  "past_unit"),
        ("Full Past Papers",       "past_paper"),
        ("Target Quiz - Hard",    "hard"),
        ("Target Quiz - Normal",  "normal"),
    ])
    if arr_type is None: return html

    var_name = get_array_var_name(subject_key, arr_type)
    _, _, objects = read_array(html, var_name)
    if not objects:
        warn("Array empty."); return html

    meta   = get_subject_meta(html, subject_key)
    units  = meta.get('units', {})
    uid_filter = None
    if arr_type == 'past_unit' and units:
        uc = choose("Filter by unit",
            [("All units", "all")] + [(f"{v} (Unit {k})", str(k)) for k,v in units.items()])
        if uc is None: return html
        if uc != 'all': uid_filter = int(uc)

    year_filter = None
    if arr_type == 'past_paper':
        years = OrderedDict()
        for o in objects:
            yr = get_year(o) or 'Unknown year'
            years[yr] = years.get(yr, 0) + 1
        yc = choose("Filter by past paper",
            [("All papers", "all")] +
            [(f"{yr} ({count})", yr) for yr, count in years.items()])
        if yc is None: return html
        if yc != 'all': year_filter = yc

    filtered = [(i, o) for i, o in enumerate(objects)
                if (uid_filter is None or get_unit(o) == uid_filter)
                and (year_filter is None or (get_year(o) or 'Unknown year') == year_filter)]
    if not filtered:
        warn("No questions match."); return html

    print(f"\n  {len(filtered)} question(s):")
    for n, (i, o) in enumerate(filtered, 1):
        display_question(o, n)
    print(f"\n  {DIM('0. <- Back')}")

    raw = ask("Number to delete")
    if not raw.isdigit() or int(raw) == 0: return html
    n = int(raw)
    if n < 1 or n > len(filtered):
        err("Out of range."); return html

    real_idx = filtered[n-1][0]
    qid = get_id(objects[real_idx])
    if confirm(f"Delete '{qid}'?"):
        objects.pop(real_idx)
        html = write_array(html, var_name, objects)
        ok(f"Deleted '{qid}'.")
    return html


def delete_unit_questions_interactive(html, subject_key):
    section("DELETE ALL QUESTIONS IN A UNIT")
    hint()
    arr_type = choose("Which bank?", [
        ("Unit-wise Papers > Past Paper Questions",  "past_unit"),
        ("Full Past Papers",       "past_paper"),
        ("Target Quiz - Hard",    "hard"),
        ("Target Quiz - Normal",  "normal"),
    ])
    if arr_type is None: return html

    var_name = get_array_var_name(subject_key, arr_type)
    _, _, objects = read_array(html, var_name)
    if not objects:
        warn("Array is already empty."); return html

    meta  = get_subject_meta(html, subject_key)
    units = meta.get('units', {})

    if arr_type == 'past_unit' and units:
        uc = choose("Select unit to clear",
            [("  All units  (clear entire bank)", "all")] +
            [(f"{v} (Unit {k})", str(k)) for k, v in units.items()])
        if uc is None: return html

        if uc == 'all':
            #  Clear all units in this bank
            count = len(objects)
            print(f"\n  {count} question(s) will be removed from {describe_array_destination(var_name)}.")
            print(DIM("  Array declaration is preserved - import/merge will still work.\n"))
            if confirm(f"Delete all {count} question(s) from {describe_array_destination(var_name)}?"):
                html = write_array(html, var_name, [])
                ok(f"Cleared {count} question(s) from {describe_array_destination(var_name)}.")
            else:
                warn("Cancelled  nothing deleted.")
            return html

        uid = int(uc)

    elif arr_type == 'past_unit':
        # No named units  ask for a raw unit number or 'all'
        raw_uid = ask("Unit number to clear (or 'all' for entire bank)")
        if raw_uid.lower() == 'all':
            count = len(objects)
            if confirm(f"Delete all {count} question(s) from {describe_array_destination(var_name)}?"):
                html = write_array(html, var_name, [])
                ok(f"Cleared {count} question(s) from {describe_array_destination(var_name)}.")
            else:
                warn("Cancelled  nothing deleted.")
            return html
        if not raw_uid.isdigit():
            err("Invalid unit number."); return html
        uid = int(raw_uid)

    elif arr_type == 'past_paper':
        years = OrderedDict()
        for o in objects:
            yr = get_year(o) or 'Unknown year'
            years[yr] = years.get(yr, 0) + 1

        yc = choose("Select past paper to clear",
            [("All Full Past Papers  (clear entire bank)", "all")] +
            [(f"{yr} ({count})", yr) for yr, count in years.items()])
        if yc is None: return html

        if yc == 'all':
            count = len(objects)
            print(f"\n  {count} question(s) will be removed from {describe_array_destination(var_name)}.")
            print(DIM("  Array declaration is preserved - import/merge will still work.\n"))
            if confirm(f"Delete all {count} question(s) from {describe_array_destination(var_name)}?"):
                html = write_array(html, var_name, [])
                ok(f"Cleared {count} question(s) from {describe_array_destination(var_name)}.")
            else:
                warn("Cancelled - nothing deleted.")
            return html

        to_delete = [o for o in objects if (get_year(o) or 'Unknown year') == yc]
        if not to_delete:
            warn(f"No questions found for {yc}."); return html

        print(f"\n  {len(to_delete)} question(s) in {GRN(yc)}:")
        for n, o in enumerate(to_delete, 1):
            display_question(o, n)

        print()
        if confirm(f"Permanently delete all {len(to_delete)} question(s) from {yc}?"):
            kept = [o for o in objects if (get_year(o) or 'Unknown year') != yc]
            html = write_array(html, var_name, kept)
            ok(f"Deleted {len(to_delete)} question(s) from {yc}.")
        else:
            warn("Cancelled - nothing deleted.")
        return html

    else:
        # Hard / Normal banks have no unit field  offer a flat clear-all
        count = len(objects)
        warn(f"This bank has no units. It contains {count} question(s).")
        print(DIM("  Array declaration is preserved - import/merge will still work.\n"))
        if confirm(f"Delete ALL {count} question(s) from {describe_array_destination(var_name)}?"):
            html = write_array(html, var_name, [])
            ok(f"Cleared {count} question(s) from {describe_array_destination(var_name)}.")
        return html

    unit_label = units.get(uid, f"Unit {uid}")
    to_delete  = [o for o in objects if get_unit(o) == uid]

    if not to_delete:
        warn(f"No questions found for {unit_label}."); return html

    print(f"\n  {len(to_delete)} question(s) in {GRN(unit_label)}:")
    for n, o in enumerate(to_delete, 1):
        display_question(o, n)

    print()
    if confirm(f"Permanently delete all {len(to_delete)} question(s) from {unit_label}?"):
        kept = [o for o in objects if get_unit(o) != uid]
        html = write_array(html, var_name, kept)
        ok(f"Deleted {len(to_delete)} question(s) from {unit_label}.")
    else:
        warn("Cancelled  nothing deleted.")
    return html


def list_questions(html, subject_key):
    section("QUESTIONS LIST")
    for arr_type, label in [('past_unit','Unit-wise Papers > Past Paper Questions'),('past_paper','Full Past Papers'),('hard','Target Questions > Hard'),('normal','Target Questions > Normal')]:
        var_name = get_array_var_name(subject_key, arr_type)
        _, _, objects = read_array(html, var_name)
        print(f"\n  {BLD(label)} [{describe_array_destination(var_name)}] - {len(objects)} question(s)")
        for i, o in enumerate(objects, 1):
            display_question(o, i)


#  Units CRUD

def add_unit(html, subject_key):
    section("ADD A UNIT")
    hint()
    meta  = get_subject_meta(html, subject_key)
    units = meta.get('units', {})
    print(f"  Existing units: {units}")

    new_num   = int(ask("New unit number", max(units.keys(), default=0)+1 if units else 1))
    new_label = ask(f"Label for Unit {new_num}", f"Unit {new_num}")

    s_start, s_end, raw = parse_subjects_block(html)
    if raw is None:
        err("SUBJECTS block not found."); return html

    pat = re.compile(rf'\b{re.escape(subject_key)}\s*:\s*\{{')
    sm  = pat.search(raw)
    if not sm:
        err(f"Subject '{subject_key}' not found."); return html

    subj_start = sm.start()
    um = re.search(r'(units\s*:\s*\{)([^}]*)\}', raw[subj_start:])
    if not um:
        err("units block not found."); return html

    units_inner = um.group(2)
    if re.search(rf'\b{new_num}\s*:', units_inner):
        err(f"Unit {new_num} already exists."); return html

    entry     = f"{new_num}:'{new_label}'"
    new_inner = units_inner.rstrip() + f', {entry}'
    new_block = um.group(1) + new_inner + '}'
    new_raw   = raw[:subj_start] + raw[subj_start:subj_start+um.start()] + new_block + raw[subj_start+um.end():]
    html      = html[:s_start] + new_raw + html[s_end:]
    ok(f"Unit {new_num} '{new_label}' added to '{subject_key}'.")
    return html


def delete_unit(html, subject_key):
    section("DELETE A UNIT")
    hint()
    meta  = get_subject_meta(html, subject_key)
    units = meta.get('units', {})
    if not units:
        warn("No units."); return html

    uc = choose("Unit to delete", [(f"{v} (Unit {k})", str(k)) for k,v in units.items()])
    if uc is None: return html
    uid = int(uc)

    var_name = get_array_var_name(subject_key, 'past_unit')
    _, _, objects = read_array(html, var_name)
    unit_qs = [o for o in objects if get_unit(o) == uid]
    if unit_qs:
        warn(f"{len(unit_qs)} unit-wise past-paper question(s) belong to Unit {uid}.")
        if not confirm("Remove them too?"):
            warn("Cancelled."); return html
        objects = [o for o in objects if get_unit(o) != uid]
        html = write_array(html, var_name, objects)
        ok(f"Removed {len(unit_qs)} question(s).")

    s_start, s_end, raw = parse_subjects_block(html)
    pat = re.compile(rf'\b{re.escape(subject_key)}\s*:\s*\{{')
    sm  = pat.search(raw)
    subj_start = sm.start()
    um = re.search(r'(units\s*:\s*\{)([^}]*)\}', raw[subj_start:])
    if um:
        new_inner = re.sub(rf',?\s*{uid}\s*:[\'"][^\'"]*[\'"]|{uid}\s*:[\'"][^\'"]*[\'"],?\s*', '', um.group(2))
        new_block = um.group(1) + new_inner.strip().strip(',') + '}'
        new_raw   = raw[:subj_start] + raw[subj_start:subj_start+um.start()] + new_block + raw[subj_start+um.end():]
        html      = html[:s_start] + new_raw + html[s_end:]
    ok(f"Unit {uid} deleted.")
    return html


def rename_unit(html, subject_key):
    section("RENAME A UNIT")
    hint()
    meta  = get_subject_meta(html, subject_key)
    units = meta.get('units', {})
    if not units:
        warn("No units found."); return html

    uc = choose("Which unit to rename?",
        [(f"{v}  (Unit {k})", str(k)) for k,v in units.items()])
    if uc is None: return html
    uid = int(uc)

    current_label = units[uid]
    new_label = ask(f"New label for Unit {uid}", current_label)
    if new_label == current_label:
        warn("Label unchanged."); return html

    s_start, s_end, raw = parse_subjects_block(html)
    if raw is None:
        err("SUBJECTS block not found."); return html

    pat = re.compile(rf'\b{re.escape(subject_key)}\s*:\s*\{{')
    sm  = pat.search(raw)
    if not sm:
        err(f"Subject '{subject_key}' not found."); return html

    subj_start = sm.start()
    um = re.search(r'(units\s*:\s*\{)([^}]*)\}', raw[subj_start:])
    if not um:
        err("units block not found."); return html

    # Replace the old label for this unit number only
    old_inner = um.group(2)
    new_inner = re.sub(
        rf"({uid}\s*:\s*)['\"]([^'\"]*)['\"]",
        lambda m: m.group(1) + f"'{new_label}'",
        old_inner
    )
    if new_inner == old_inner:
        err(f"Could not find unit {uid} entry to rename."); return html

    new_block = um.group(1) + new_inner + '}'
    new_raw   = raw[:subj_start] + raw[subj_start:subj_start+um.start()] + new_block + raw[subj_start+um.end():]
    html      = html[:s_start] + new_raw + html[s_end:]
    ok(f"Unit {uid} renamed: '{current_label}' -> '{new_label}'.")
    return html


def rename_subject(html):
    section("RENAME A SUBJECT")
    hint()
    keys  = get_subject_keys(html)
    if not keys:
        warn("No subjects found."); return html

    metas = {k: get_subject_meta(html, k) for k in keys}
    subj_key = choose("Which subject to rename?",
        [(f"{metas[k].get('label','?')} [{k}]", k) for k in keys])
    if subj_key is None: return html

    current = metas[subj_key]
    print(f"\n  Current label : {current.get('label','')}")
    print(f"  Current desc  : {current.get('desc','')}")
    print(f"  Current icon  : {current.get('icon','')}")
    print()

    new_label = ask("New display label", current.get('label', ''))
    new_desc  = ask("New description",   current.get('desc',  ''))
    new_icon  = ask("New emoji icon",    current.get('icon',  ''))

    s_start, s_end, raw = parse_subjects_block(html)
    if raw is None:
        err("SUBJECTS block not found."); return html

    # Find this subject's block inside SUBJECTS
    pat = re.compile(rf'\b{re.escape(subj_key)}\s*:\s*\{{')
    sm  = pat.search(raw)
    if not sm:
        err(f"Subject '{subj_key}' not found."); return html

    subj_start = sm.start()
    # Find the end of this subject entry (depth-counting)
    depth, in_string, escape, qc = 0, False, False, ''
    i = sm.end() - 1
    while i < len(raw):
        ch = raw[i]
        if in_string:
            if escape: escape = False
            elif ch == '\\': escape = True
            elif ch == qc: in_string = False
        else:
            if ch in ('"', "'", '`'): in_string, qc = True, ch
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: break
        i += 1
    subj_block = raw[subj_start:i+1]

    # Replace label, desc, icon fields using targeted regex
    def replace_field(block, field, new_val):
        # Matches:  field: 'old'  or  field: "old"   with optional spaces
        return re.sub(
            rf"({field}\s*:\s*)['\"]([^'\"]*)['\"]",
            lambda m: m.group(1) + f"'{new_val}'",
            block,
            count=1
        )

    new_block = subj_block
    if new_label != current.get('label', ''):
        new_block = replace_field(new_block, 'label', new_label)
    if new_desc != current.get('desc', ''):
        new_block = replace_field(new_block, 'desc', new_desc)
    if new_icon != current.get('icon', ''):
        new_block = replace_field(new_block, 'icon', new_icon)

    new_raw  = raw[:subj_start] + new_block + raw[subj_start+len(subj_block):]
    html     = html[:s_start] + new_raw + html[s_end:]
    ok(f"Subject '{subj_key}' updated.")
    return html


#  Subjects CRUD

SUBJECT_ENTRY_TPL = """
  {key}: {{
    key: '{key}',
    label: '{label}',
    icon: '{icon}',
    color: '{color}',
    colorBg: '{colorBg}',
    desc: '{desc}',
    pastUnit: {KEY}_PAST_UNIT,
    pastPaper: {KEY}_PAST_PAPER,
    targetHard: {KEY}_TARGET_HARD,
    targetNormal: {KEY}_TARGET_NORMAL,
    allTarget: ALL_{KEY}_TARGET,
    units: {{{units_js}}},
    unitColors: [{unitColors_js}],
    historyKey: 'msq_history_{key}',
    progressKeyPastUnit: 'msq_progress_unit_{key}',
    progressKeyPastPaper: 'msq_progress_paper_{key}',
    progressKeyTarget: 'msq_target_progress_{key}',
  }},"""

ARRAY_STUB = "const {name} = [\n];\n"
ALL_TARGET_STUB = "const ALL_{KEY}_TARGET = [...{KEY}_TARGET_HARD, ...{KEY}_TARGET_NORMAL];\n"


def add_subject(html):
    section("ADD A SUBJECT")
    hint()
    key   = ask("Subject key (lowercase, no spaces, e.g. thermo)").strip().lower()
    label = ask("Display label (e.g. Thermodynamics)")
    icon  = ask("Emoji icon", "")
    color = ask("Accent colour (hex)", "#6c8bef")
    colorBg = ask("Background colour (hex)", "#1a2040")
    desc  = ask("Short description")

    units = {}
    print(f"\n  Add units (blank number to finish):")
    while True:
        num = ask(f"  Unit number", "" if units else "1")
        if not num: break
        ulabel = ask(f"  Label for Unit {num}")
        units[int(num)] = ulabel

    KEY = key.upper()
    units_js     = ', '.join(f"{k}:'{v}'" for k,v in units.items())
    unitColors_js = ', '.join(f"'unit{k}'" for k in units)

    subj_block = SUBJECT_ENTRY_TPL.format(
        key=key, KEY=KEY, label=label, icon=icon, color=color,
        colorBg=colorBg, desc=desc, units_js=units_js, unitColors_js=unitColors_js
    )

    s_start, s_end, raw = parse_subjects_block(html)
    if raw is None:
        err("SUBJECTS block not found."); return html

    # Insert before the last closing }
    insert_pos = raw.rfind('}')
    new_raw = raw[:insert_pos] + subj_block + '\n' + raw[insert_pos:]
    html = html[:s_start] + new_raw + html[s_end:]

    # Insert array stubs before SUBJECTS
    stubs = (ARRAY_STUB.format(name=f"{KEY}_PAST_UNIT") +
             ARRAY_STUB.format(name=f"{KEY}_PAST_PAPER") +
             ARRAY_STUB.format(name=f"{KEY}_TARGET_HARD") +
             ARRAY_STUB.format(name=f"{KEY}_TARGET_NORMAL") +
             ALL_TARGET_STUB.format(KEY=KEY))
    s_start2, _, _ = parse_subjects_block(html)
    html = html[:s_start2] + stubs + html[s_start2:]
    ok(f"Subject '{key}' added.")
    return html


def delete_subject(html):
    section("DELETE A SUBJECT")
    hint()
    keys = get_subject_keys(html)
    if not keys:
        warn("No subjects found."); return html

    metas = {k: get_subject_meta(html, k) for k in keys}
    key = choose("Subject to delete",
        [(f"{metas[k].get('label','?')} [{k}]", k) for k in keys])
    if key is None: return html
    if not confirm(f"Delete ALL data for '{key}'? This is permanent."):
        return html

    KEY = key.upper()

    # Remove from SUBJECTS block
    s_start, s_end, raw = parse_subjects_block(html)
    pat = re.compile(rf'\b{re.escape(key)}\s*:\s*\{{')
    sm  = pat.search(raw)
    if sm:
        depth, in_string, escape, qc = 0, False, False, ''
        i = sm.end() - 1
        while i < len(raw):
            ch = raw[i]
            if in_string:
                if escape: escape = False
                elif ch == '\\': escape = True
                elif ch == qc: in_string = False
            else:
                if ch in ('"', "'", '`'): in_string, qc = True, ch
                elif ch == '{': depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0: break
            i += 1
        b_start, b_end = sm.start(), i+1
        if b_end < len(raw) and raw[b_end] == ',': b_end += 1
        new_raw = raw[:b_start] + raw[b_end:]
        html = html[:s_start] + new_raw + html[s_end:]

    # Remove array declarations (process in reverse to keep offsets valid)
    for suffix in ('_PAST_UNIT', '_PAST_PAPER', '_TARGET_HARD', '_TARGET_NORMAL'):
        name = KEY + suffix
        arrays = find_all_caps_arrays(html)
        for start, end, arr_name, _ in reversed(arrays):
            if arr_name == name:
                html = html[:start] + html[end:]
                break

    # Remove ALL_..._TARGET spread line
    html = re.sub(
        rf'const\s+ALL_{KEY}_TARGET\s*=\s*\[.*?\];\n?', '', html, flags=re.DOTALL)

    ok(f"Subject '{key}' removed.")
    return html


#  JSON import

DEFAULT_JSON_FOLDER = r"C:\Users\CJay\Documents\ACA\QUIZ APP\JSON files"

def _resolve_json_path(raw: str) -> Path:
    """
    Turn user input into a full JSON path.
    - If it looks like a full path (has a drive letter or starts with \\), use as-is.
    - Otherwise treat as a filename inside DEFAULT_JSON_FOLDER.
    - Adds .json extension if missing.
    """
    p = Path(raw.strip('"\''))
    # Full path detection: has a drive letter (e.g. C:) or is absolute
    if p.is_absolute() or (len(raw) > 1 and raw[1] == ':'):
        if p.suffix.lower() != '.json':
            p = p.with_suffix('.json')
        return p
    # Bare filename  resolve against default folder
    name = p.name if p.name else str(p)
    if not name.lower().endswith('.json'):
        name += '.json'
    return Path(DEFAULT_JSON_FOLDER) / name


def _load_validator_module(root=None):
    root = Path(root or repo_root())
    validator_path = root / 'tools' / 'validate_questions.py'
    if not validator_path.is_file():
        raise FileNotFoundError(f"official validator not found: {validator_path}")
    spec = importlib.util.spec_from_file_location('_mora_validate_questions', validator_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load validator module: {validator_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    for attr in ('load_json', 'validate_pack'):
        if not hasattr(module, attr):
            raise RuntimeError(f"validator is missing required function: {attr}")
    return module


def run_official_validation(json_path, root=None):
    try:
        validator = _load_validator_module(root)
        pack, load_error = validator.load_json(str(json_path))
        if load_error:
            return None, ValidationOutcome(False, errors=[load_error])
        reporter = validator.validate_pack(pack, None)
        return pack, ValidationOutcome(
            ok=not reporter.errors,
            errors=list(reporter.errors),
            warnings=list(reporter.warnings),
        )
    except Exception as exc:
        return None, ValidationOutcome(False, unexpected_error=str(exc))


def print_validation_outcome(outcome):
    if outcome.unexpected_error:
        err("Official validator failed unexpectedly:")
        print(f"    {outcome.unexpected_error}")
        return
    if outcome.errors:
        err(f"Validation errors ({len(outcome.errors)}):")
        for item in outcome.errors:
            print(f"    ERROR: {item}")
    if outcome.warnings:
        warn(f"Validation warnings ({len(outcome.warnings)}):")
        for item in outcome.warnings:
            print(f"    WARNING: {item}")
    if outcome.ok and not outcome.warnings:
        ok("Official validation passed with no warnings.")


def load_validated_pack(json_path, root=None):
    pack, outcome = run_official_validation(json_path, root)
    print_validation_outcome(outcome)
    if outcome.unexpected_error or outcome.errors or not outcome.ok:
        return None, outcome
    return pack, outcome


def _pack_context_blockers(pack):
    blockers = []
    if isinstance(pack.get('stimuli'), dict) and pack.get('stimuli'):
        blockers.append(
            "live subject_data chunks cannot preserve pack-level stimuli without a storage/integration decision"
        )
    if isinstance(pack.get('images'), dict) and pack.get('images'):
        blockers.append(
            "live subject_data chunks cannot preserve pack-level images registry without a storage/integration decision"
        )
    return blockers


def _destination_files(subject_key):
    files = []
    chunk_path = _subject_chunk_path(subject_key)
    if chunk_path is not None:
        files.append(chunk_path)
    if CURRENT_QUIZ_DATA_PATH is not None:
        files.append(CURRENT_QUIZ_DATA_PATH)
    return files


def destination_overrides(array_type, force_unit=None, force_year=None, force_hard=None):
    overrides = OrderedDict()
    if force_unit is not None:
        overrides['unit'] = force_unit
    if force_year is not None:
        overrides['year'] = force_year
    if force_hard is not None:
        overrides['hard'] = force_hard
    elif array_type == 'hard':
        overrides['hard'] = True
    elif array_type == 'normal':
        overrides['hard'] = False
    return overrides


def _apply_overrides_to_question(question, overrides):
    q = copy.deepcopy(question)
    messages = []
    qid = str(q.get('id', '<missing id>'))
    for field_name, value in overrides.items():
        before_marker = '<missing>'
        before = q.get(field_name, before_marker)
        if before != value:
            action = 'add' if before is before_marker else 'override'
            messages.append(f"{qid}: {action} {field_name}: {before!r} -> {value!r}")
            q[field_name] = value
    return q, messages


def prepare_import_plan(html, source_path, pack, validation_warnings, subject_key, array_type, overrides=None):
    destination_bucket = bucket_from_array_type(array_type)
    if destination_bucket not in VALID_DESTINATION_BUCKETS:
        raise ValueError(f"Unsupported destination bucket: {destination_bucket}")
    if subject_key not in get_subject_keys(html):
        raise ValueError(f"Unknown destination module/dataKey: {subject_key}")
    if not isinstance(pack, dict) or not isinstance(pack.get('questions'), list):
        raise ValueError("Validated pack must be an object with a questions array.")

    live_ids = collect_live_question_ids(html)
    seen = set()
    duplicate_ids = []
    missing_ids = []
    planned_questions = []
    override_messages = []
    ids = []

    for index, source_question in enumerate(pack['questions']):
        if not isinstance(source_question, dict):
            raise ValueError(f"questions[{index}] is not an object")
        qid = source_question.get('id')
        if not qid:
            missing_ids.append(f"questions[{index}]")
            continue
        qid = str(qid)
        ids.append(qid)
        if qid in seen or qid in live_ids:
            duplicate_ids.append(qid)
        seen.add(qid)
        question, messages = _apply_overrides_to_question(source_question, overrides or {})
        planned_questions.append(question)
        override_messages.extend(messages)

    blockers = []
    if missing_ids:
        blockers.append("missing question IDs: " + ', '.join(missing_ids))
    if duplicate_ids:
        blockers.append("duplicate/colliding question IDs: " + ', '.join(sorted(set(duplicate_ids))))
    blockers.extend(_pack_context_blockers(pack))

    units = sorted({q.get('unit') for q in planned_questions if q.get('unit') is not None}, key=lambda item: str(item))
    years = sorted({q.get('year') for q in planned_questions if q.get('year') is not None}, key=lambda item: str(item))
    return ImportPlan(
        source_path=Path(source_path),
        destination_subject=subject_key,
        destination_bucket=destination_bucket,
        questions=planned_questions,
        question_ids=ids,
        new_ids=[qid for qid in ids if qid not in live_ids],
        duplicate_ids=sorted(set(duplicate_ids)),
        units=units,
        years=years,
        overrides=override_messages,
        files_changed=_destination_files(subject_key),
        validation_warnings=list(validation_warnings or []),
        pack_subject=pack.get('subject'),
        pack_bucket=pack.get('bucket'),
        pack_has_stimuli=bool(pack.get('stimuli')),
        pack_has_images=bool(pack.get('images')),
        can_apply=not blockers,
        apply_blockers=blockers,
    )


def print_import_preview(plan):
    section("IMPORT PREVIEW")
    print(f"  Source JSON path:       {plan.source_path}")
    print(f"  Destination module:     {plan.destination_subject}")
    print(f"  Destination bucket:     {plan.destination_bucket}")
    print(f"  Pack subject/bucket:    {plan.pack_subject!r} / {plan.pack_bucket!r}")
    print(f"  Question count:         {len(plan.questions)}")
    print(f"  Pack-level stimuli:     {'yes' if plan.pack_has_stimuli else 'no'}")
    print(f"  Pack-level images:      {'yes' if plan.pack_has_images else 'no'}")
    print(f"  Units affected:         {plan.units if plan.units else 'none'}")
    print(f"  Years affected:         {plan.years if plan.years else 'none'}")
    print("  Files that would change:")
    for path in plan.files_changed:
        print(f"    - {path}")

    print("\n  Question IDs:")
    for qid in plan.question_ids:
        marker = 'duplicate' if qid in plan.duplicate_ids else 'new'
        print(f"    - {qid} [{marker}]")

    print("\n  Question previews:")
    for idx, question in enumerate(plan.questions, 1):
        print(f"    {idx}. {question.get('id', '<missing id>')} - {question_preview_text(question, 80)}")

    print("\n  Fields that would be added/overridden:")
    if plan.overrides:
        for item in plan.overrides:
            print(f"    - {item}")
    else:
        print("    none")

    print("\n  Validation warnings:")
    if plan.validation_warnings:
        for item in plan.validation_warnings:
            print(f"    WARNING: {item}")
    else:
        print("    none")

    if plan.apply_blockers:
        print(f"\n  {RED('Apply refused:')}")
        for item in plan.apply_blockers:
            print(f"    - {item}")
    else:
        print(f"\n  {GRN('Apply is available after explicit confirmation.')}")


def apply_import_plan(html, plan):
    if not plan.can_apply:
        raise RuntimeError("Cannot apply import plan: " + '; '.join(plan.apply_blockers))
    array_type = array_type_from_bucket(plan.destination_bucket)
    var_name = get_array_var_name(plan.destination_subject, array_type)
    _, _, objects = read_array(html, var_name)
    objects = list(objects)
    objects.extend(copy.deepcopy(plan.questions))
    return write_array(html, var_name, objects)


def import_json_questions(html, subject_key):
    section("IMPORT FROM JSON")
    hint()
    print(f"  Default folder: {DEFAULT_JSON_FOLDER}")
    print("  Type just the filename (with or without .json) or a full path.\n")
    raw = ask("JSON filename or full path").strip()
    json_path = _resolve_json_path(raw)
    if not os.path.isfile(json_path):
        err(f"Not found: {json_path}"); return html

    pack, outcome = load_validated_pack(json_path)
    if pack is None:
        err("Import refused because official validation did not pass.")
        return html

    questions = pack.get('questions', [])
    if not questions:
        warn("Empty questions list."); return html
    print(f"\n  Found {len(questions)} validated question(s) in JSON.")

    arr_type = choose("Import into", [
        ("Unit-wise Papers > Past Paper Questions",  "past_unit"),
        ("Full Past Papers",    "past_paper"),
        ("Target Quiz - Hard",                   "hard"),
        ("Target Quiz - Normal",                 "normal"),
    ])
    if arr_type is None: return html

    meta  = get_subject_meta(html, subject_key)
    units = meta.get('units', {})

    force_unit = None
    if arr_type == 'past_unit':
        uc = choose("Assign unit",
            [("Keep unit from JSON (if present)", "keep")] +
            [(f"{v} (Unit {k})", str(k)) for k,v in units.items()])
        if uc is None: return html
        if uc != 'keep': force_unit = int(uc)

    overrides = destination_overrides(arr_type, force_unit=force_unit)
    try:
        plan = prepare_import_plan(html, json_path, pack, outcome.warnings, subject_key, arr_type, overrides)
    except ValueError as exc:
        err(str(exc)); return html
    print_import_preview(plan)

    if not plan.can_apply:
        err("Dry run only. Resolve the apply blocker(s) before live import.")
        return html
    if not confirm("Apply this import now?"):
        warn("Dry run complete. No repository files were modified.")
        return html

    html = apply_import_plan(html, plan)
    ok(f"Prepared import of {len(plan.questions)} question(s) -> {describe_array_destination(get_array_var_name(subject_key, arr_type))}.")
    warn("Changes are pending until you choose Save & exit.")
    return html


#  Merge from extracted HTML (all logic copied verbatim from merge_questions.py)

def _merge_parse_and_restore_img(script_text: str, skel_html: str) -> str:
    m = re.search(r'const\s+REMOVED_IMG_SCRIPT\s*=\s*"([A-Za-z0-9+/=]+)"', script_text)
    if not m:
        print("  [IMG] No REMOVED_IMG_SCRIPT found - skipping.")
        return skel_html
    try:
        block = base64.b64decode(m.group(1)).decode('utf-8')
        count = block.count('"__IMG_')
        if '</body>' in skel_html:
            skel_html = skel_html.replace('</body>', block + '\n</body>', 1)
        else:
            skel_html += '\n' + block
        print(f"  [IMG] Restored script block with {count} image(s).")
        return skel_html
    except Exception as e:
        print(f"  [IMG] Restore failed: {e}")
        return skel_html


def _merge_get_section(obj_str: str) -> int:
    """Read the _section metadata injected by the extractor."""
    m = re.search(r'"_section"\s*:\s*(\d+)', obj_str)
    return int(m.group(1)) if m else 0


def _merge_strip_section_field(obj_str: str) -> str:
    """Remove the _section metadata field before writing back to the final HTML."""
    cleaned = re.sub(r',\s*"_section"\s*:\s*\d+\s*', '', obj_str)
    return cleaned


def _merge_parse_removed_file(rem_html: str) -> dict:
    """
    Returns { arr_name: { section_int: [obj_str, ...] } }
    Copied verbatim from merge_questions.py :: parse_removed_file()
    """
    from collections import OrderedDict
    script_m = re.search(
        r'<script id="removed-data">(.*?)</script>', rem_html, re.DOTALL
    )
    if not script_m:
        err('Cannot find <script id="removed-data"> in the extracted HTML file.')
        return {}

    script_text = script_m.group(1)
    arrays = find_all_caps_arrays(script_text)

    result = {}
    for _, _, name, body in arrays:
        if not name.startswith('REMOVED_'):
            continue
        orig_name = name[len('REMOVED_'):]
        objects = extract_js_objects(body)

        by_section = OrderedDict()
        for obj in objects:
            sec = _merge_get_section(obj)
            by_section.setdefault(sec, []).append(_merge_strip_section_field(obj))

        result[orig_name] = by_section
        total = sum(len(v) for v in by_section.values())
        sections = sorted(by_section.keys())
        print(f"  [{orig_name}] {total} item(s) across section(s): {sections}")

    return result


def _merge_array(skel_objects: list, removed_by_section: dict) -> list:
    """
    Re-insert removed questions into the skeleton list.
    Copied verbatim from merge_questions.py :: merge_array()
    """
    from collections import OrderedDict
    has_units = any(get_unit(o) is not None for o in skel_objects)
    flat_only  = list(removed_by_section.keys()) == [0]

    if not has_units or flat_only:
        removed_flat = removed_by_section.get(0, [])
        if len(skel_objects) < 2:
            return skel_objects + removed_flat
        return [skel_objects[0]] + removed_flat + skel_objects[1:]

    skel_by_unit = OrderedDict()
    for obj in skel_objects:
        u = get_unit(obj)
        if u is None:
            u = -1
        skel_by_unit.setdefault(u, []).append(obj)

    all_units = sorted(set(list(skel_by_unit.keys()) + list(removed_by_section.keys())))
    merged = []

    for unit in all_units:
        skel_qs    = skel_by_unit.get(unit, [])
        removed_qs = removed_by_section.get(unit, [])

        if not skel_qs:
            warn(f"Unit {unit}: no skeleton entries  appending removed directly.")
            merged.extend(removed_qs)
        elif len(skel_qs) == 1:
            merged.extend(skel_qs)
            if removed_qs:
                warn(f"Unit {unit}: 1 skeleton entry + {len(removed_qs)} removed  appending after.")
                merged.extend(removed_qs)
        else:
            first      = skel_qs[0]
            last       = skel_qs[-1]
            extra_kept = skel_qs[1:-1]
            merged.append(first)
            merged.extend(removed_qs)
            merged.extend(extra_kept)
            merged.append(last)

        total = len(skel_qs) + len(removed_qs)
        print(f"  Unit {unit}: {len(skel_qs)} kept + {len(removed_qs)} re-inserted = {total} total.")

    return merged


def merge_from_extracted_html(html: str) -> str:
    """Menu action: merge a _removed.html file back into the current skeleton HTML."""
    section("MERGE FROM EXTRACTED HTML")
    print("  This re-inserts questions that were extracted by extract_questions.py.")
    print("  The extracted file is the  *_removed.html  file it produced.\n")

    rem_path = ask("Path to the extracted (_removed.html) file").strip().strip('"\'')
    if not os.path.isfile(rem_path):
        err(f"File not found: {rem_path}"); return html

    with open(rem_path, encoding='utf-8') as f:
        rem_html = f.read()

    # Verify it looks like a removed-data file
    if 'id="removed-data"' not in rem_html:
        err("That file doesn't look like a removed-questions file "
            '(missing <script id="removed-data">).')
        return html

    print("\n  Parsing extracted file...")
    removed_data = _merge_parse_removed_file(rem_html)

    if not removed_data:
        warn("No REMOVED_ arrays found in that file  nothing to merge."); return html

    # Restore IMG block
    script_m = re.search(r'<script id="removed-data">(.*?)</script>', rem_html, re.DOTALL)
    if script_m:
        html = _merge_parse_and_restore_img(script_m.group(1), html)

    print("\n  Locating arrays in current HTML...")
    arrays = find_all_caps_arrays(html)
    found_names = known_question_array_names(html)
    print(f"  Arrays in HTML : {found_names}")
    print(f"  Arrays to merge: {list(removed_data.keys())}")

    matched = [name for name in removed_data if name in found_names]
    if not matched:
        warn("None of the extracted arrays match arrays in the current HTML."); return html

    for name in matched:
        print(f"\n  Merging [{name}]...")
        _, _, skel_objects = read_array(html, name)
        removed_by_sec = removed_data[name]

        total_removed = sum(len(v) for v in removed_by_sec.values())
        if total_removed == 0:
            print("    Nothing was removed for this array - skipping.")
            continue

        merged = _merge_array(skel_objects, removed_by_sec)

        html = write_array(html, name, merged)

    ok("Merge complete.")
    return html


def delete_all_questions_one_subject(html, subject_key):
    section("DELETE ALL QUESTIONS IN THIS SUBJECT")
    hint()
    meta  = get_subject_meta(html, subject_key)
    label = meta.get('label', subject_key)

    print(f"  This empties all three banks (past-paper, hard target, normal target)")
    print(f"  for {BLD(label)}.")
    print(f"  Array declarations are kept - import/merge will still work afterwards.\n")

    # Count per bank
    total = 0
    breakdown = []
    for arr_type, bank_label in [('past_unit','Unit-wise Papers > Past Paper Questions'), ('past_paper','Full Past Papers'), ('hard','Target Questions > Hard'), ('normal','Target Questions > Normal')]:
        var_name = get_array_var_name(subject_key, arr_type)
        _, _, objects = read_array(html, var_name)
        breakdown.append((bank_label, var_name, len(objects)))
        total += len(objects)

    for bank_label, var_name, count in breakdown:
        status = str(count) + " question(s)" if count else DIM("empty")
        print(f"    {bank_label:20}  [{var_name}]    {status}")

    if total == 0:
        print()
        warn("All arrays for this subject are already empty."); return html

    print(f"\n  {YLW(f'Total: {total} question(s)')}\n")

    if not confirm(f"Permanently delete all {total} question(s) from {label}?"):
        warn("Cancelled  nothing deleted."); return html

    for arr_type in ['past_unit', 'past_paper', 'hard', 'normal']:
        var_name = get_array_var_name(subject_key, arr_type)
        _, _, objects = read_array(html, var_name)
        if objects:
            html = write_array(html, var_name, [])

    ok(f"Cleared {total} question(s) from {label}. Arrays are preserved for import.")
    print(DIM("  You can now import fresh questions via JSON or _removed.html merge."))
    return html


#  Nuke all questions (across every subject)

def delete_all_questions_all_subjects(html):
    section("DELETE ALL QUESTIONS  ALL SUBJECTS")
    hint()
    print("  This empties EVERY question array in the file (past-paper,")
    print("  hard target, and normal target) for every subject.")
    print("  The array declarations are kept, so import from JSON and")
    print(f"  merge from _removed.html {BLD('will still work')} afterwards.\n")

    keys = get_subject_keys(html)
    if not keys:
        warn("No subjects found in this file."); return html

    # Count what will be removed
    total = 0
    breakdown = []
    for key in keys:
        meta  = get_subject_meta(html, key)
        label = meta.get('label', key)
        for arr_type in ('past_unit', 'past_paper', 'hard', 'normal'):
            var_name = get_array_var_name(key, arr_type)
            _, _, objects = read_array(html, var_name)
            if objects:
                breakdown.append((label, var_name, len(objects)))
                total += len(objects)

    if total == 0:
        warn("All arrays are already empty  nothing to delete."); return html

    print(f"  {BLD('Questions that will be deleted:')}")
    for label, var_name, count in breakdown:
        print(f"    {GRN(label):30}  {var_name} -> {count} question(s)")
    print(f"\n  {YLW(f'Total: {total} question(s) across {len(breakdown)} array(s)')}\n")

    if not confirm(f"Permanently delete ALL {total} questions from every subject?"):
        warn("Cancelled  nothing deleted."); return html

    # Double-confirm because this is destructive
    print(f"\n  {RED('Last chance.')} This cannot be undone once saved.")
    if not confirm("Are you sure?"):
        warn("Cancelled  nothing deleted."); return html

    cleared = 0
    for key in keys:
        for arr_type in ('past_unit', 'past_paper', 'hard', 'normal'):
            var_name = get_array_var_name(key, arr_type)
            _, _, objects = read_array(html, var_name)
            if objects:
                html = write_array(html, var_name, [])
                cleared += len(objects)

    ok(f"Cleared {cleared} question(s). All arrays are now empty but still present.")
    print(DIM("  You can now import fresh questions via JSON or _removed.html merge."))
    return html


#  Short notes manager

def _js_string(value):
    return json.dumps(str(value or ""), ensure_ascii=False)

def slugify(value):
    value = (value or "").strip().lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    value = re.sub(r'-+', '-', value).strip('-')
    return value or 'short-note'

def short_notes_root():
    if CURRENT_QUIZ_ROOT is None:
        return None
    return CURRENT_QUIZ_ROOT / 'short_notes'

def short_notes_manifest_path():
    root = short_notes_root()
    return root / 'notes_manifest.js' if root else None

def read_short_notes_manifest():
    path = short_notes_manifest_path()
    if not path or not path.exists():
        return []
    text = path.read_text(encoding='utf-8')
    m = re.search(r'window\.MORA_SHORT_NOTES\s*=\s*\[(.*)\]\s*;?', text, re.S)
    if not m:
        return []
    entries = []
    for obj in re.finditer(r'\{(.*?)\}', m.group(1), re.S):
        body = obj.group(1)
        item = {}
        for key in ['id', 'subject', 'module', 'title', 'description', 'file']:
            km = re.search(rf'\b{key}\s*:\s*("([^"\\]|\\.)*"|\'([^\'\\]|\\.)*\')', body, re.S)
            if km:
                raw = km.group(1)
                try:
                    item[key] = json.loads(raw if raw.startswith('"') else '"' + raw[1:-1].replace('"', '\\"') + '"')
                except Exception:
                    item[key] = raw.strip('"\'')
        if item.get('id') and item.get('file'):
            entries.append(item)
    return entries

def write_short_notes_manifest(entries):
    root = short_notes_root()
    path = short_notes_manifest_path()
    if not root or not path:
        err("Quiz root is unknown; cannot write short notes manifest.")
        return False
    root.mkdir(parents=True, exist_ok=True)
    lines = ["window.MORA_SHORT_NOTES = ["]
    for i, note in enumerate(entries):
        comma = "," if i < len(entries) - 1 else ""
        lines += [
            "  {",
            f"    id: {_js_string(note.get('id'))},",
            f"    subject: {_js_string(note.get('subject'))},",
            f"    module: {_js_string(note.get('module'))},",
            f"    title: {_js_string(note.get('title'))},",
            f"    description: {_js_string(note.get('description'))},",
            f"    file: {_js_string(note.get('file'))}",
            f"  }}{comma}",
        ]
    lines.append("];")
    path.write_text("\n".join(lines) + "\n", encoding='utf-8')
    return True

def list_short_notes(html):
    notes = read_short_notes_manifest()
    if not notes:
        warn("No short notes are registered yet.")
        return
    metas = {k: get_subject_meta(html, k) for k in get_subject_keys(html)}
    grouped = OrderedDict()
    for note in notes:
        grouped.setdefault(note.get('subject', 'general'), []).append(note)
    for subject, rows in grouped.items():
        label = metas.get(subject, {}).get('label') or rows[0].get('module') or subject
        print(f"\n  {BLD(label)} [{subject}]")
        for note in rows:
            print(f"    - {GRN(note.get('title', '?'))}  {DIM(note.get('file', ''))}")

def add_short_note(html):
    section("ADD SHORT NOTE HTML")
    hint()
    src = ask("Path to short note HTML").strip().strip('"\'')
    src_path = Path(src)
    if not src_path.is_file():
        err(f"File not found: {src}")
        return html
    if src_path.suffix.lower() not in ('.html', '.htm'):
        warn("This does not look like an HTML file, but it will still be copied.")

    keys = get_subject_keys(html)
    if not keys:
        warn("No subjects found. Add a subject first.")
        return html
    metas = {k: get_subject_meta(html, k) for k in keys}
    subject = choose("Short note subject/module", [(f"{metas[k].get('label','?')} [{k}]", k) for k in keys])
    if subject is None:
        return html
    module = metas.get(subject, {}).get('label') or subject

    clean_stem = re.sub(r'^(mathematics|material|materials|fluid|mechanics|computer science|cs)\s*[-_]\s*', '', src_path.stem, flags=re.I).strip()
    title = ask("Lesson title shown in app", clean_stem or src_path.stem)
    description = ask("Short description", f"{module} short note for {title}.")
    note_id = ask("Note id", f"{subject}-{slugify(title)}")
    file_name = ask("Saved HTML filename", f"{slugify(title)}.html")
    if not file_name.lower().endswith(('.html', '.htm')):
        file_name += '.html'

    dest_dir = short_notes_root() / subject
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / Path(file_name).name
    if dest_path.exists():
        yn = ask(f"{dest_path.name} exists. Overwrite? (y/N)", "N").lower()
        if yn not in ('y', 'yes'):
            base = dest_path.stem
            suffix = dest_path.suffix
            n = 2
            while (dest_dir / f"{base}-{n}{suffix}").exists():
                n += 1
            dest_path = dest_dir / f"{base}-{n}{suffix}"

    shutil.copy2(src_path, dest_path)
    rel_file = dest_path.relative_to(CURRENT_QUIZ_ROOT).as_posix()

    entries = [n for n in read_short_notes_manifest() if n.get('id') != note_id]
    entries.append({
        'id': note_id,
        'subject': subject,
        'module': module,
        'title': title,
        'description': description,
        'file': rel_file,
    })
    if write_short_notes_manifest(entries):
        ok(f"Added short note: {title} -> {rel_file}")
    return html

def delete_short_note(html):
    section("DELETE SHORT NOTE")
    notes = read_short_notes_manifest()
    if not notes:
        warn("No short notes are registered yet.")
        return html
    choice = choose("Short note to delete", [(f"{n.get('title','?')} [{n.get('subject','?')}]", n.get('id')) for n in notes])
    if choice is None:
        return html
    note = next((n for n in notes if n.get('id') == choice), None)
    yn = ask("Remove copied HTML file too? (y/N)", "N").lower()
    entries = [n for n in notes if n.get('id') != choice]
    if write_short_notes_manifest(entries):
        ok(f"Removed manifest entry: {choice}")
    if note and yn in ('y', 'yes'):
        file_path = CURRENT_QUIZ_ROOT / note.get('file', '')
        if file_path.exists() and short_notes_root() in file_path.resolve().parents:
            file_path.unlink()
            ok(f"Deleted file: {file_path}")
    return html

def manage_short_notes(html):
    while True:
        section("SHORT NOTES")
        try:
            action = choose("Short notes", [
                ("Add / import HTML short note", "add"),
                ("List short notes", "list"),
                ("Delete a short note", "delete"),
            ])
        except GoBack:
            break
        if action is None:
            break
        try:
            if action == "add":
                html = add_short_note(html)
            elif action == "list":
                list_short_notes(html)
            elif action == "delete":
                html = delete_short_note(html)
        except GoBack:
            warn("Returned to short notes menu.")
    return html


#  Main loop

def main_menu(html):
    while True:
        banner("QUIZ MANAGER - MAIN MENU")
        print(DIM("  type 'exit' at any prompt to quit  |  'back' to undo last answer\n"))
        keys  = get_subject_keys(html)
        metas = {k: get_subject_meta(html, k) for k in keys}

        try:
            action = choose("What would you like to do?", [
                ("Manage questions in a subject",            "questions"),
                ("Manage units in a subject",                "units"),
                ("Merge from extracted HTML (_removed.html)", "merge"),
                ("Manage short notes",                      "short_notes"),
                ("Rename a subject",                         "rename_subject"),
                ("Add a new subject",                        "add_subject"),
                ("Delete a subject",                         "delete_subject"),
                ("Delete ALL questions in ALL subjects",      "nuke_questions"),
                ("Save & exit",                              "save"),
            ], allow_back=False)
        except GoBack:
            warn("Already at the main menu - nothing to go back to.")
            continue

        if action == "save":
            return html

        try:
            if action == "merge":
                html = merge_from_extracted_html(html)

            elif action == "short_notes":
                html = manage_short_notes(html)

            elif action == "rename_subject":
                html = rename_subject(html)

            elif action == "add_subject":
                html = add_subject(html)

            elif action == "delete_subject":
                html = delete_subject(html)

            elif action == "nuke_questions":
                html = delete_all_questions_all_subjects(html)

            elif action in ("questions", "units"):
                if not keys:
                    warn("No subjects - add one first."); continue
                subj_key = choose("Select subject",
                    [(f"{metas[k].get('label','?')} [{k}]", k) for k in keys])
                if subj_key is None: continue

                if action == "units":
                    while True:
                        try:
                            ua = choose(f"Units  [{subj_key}]", [
                                ("Rename a unit", "rename"),
                                ("Add a unit",    "add"),
                                ("Delete a unit", "del"),
                                ("List units",    "list"),
                            ])
                        except GoBack:
                            break   # GoBack at submenu = go back to main menu
                        if ua is None: break
                        try:
                            if   ua == "rename": html = rename_unit(html, subj_key)
                            elif ua == "add":    html = add_unit(html, subj_key)
                            elif ua == "del":    html = delete_unit(html, subj_key)
                            elif ua == "list":
                                m = get_subject_meta(html, subj_key)
                                for k, v in m.get('units', {}).items():
                                    print(f"  {GRN(f'Unit {k}')}: {v}")
                        except GoBack:
                            warn("Returned to units menu.")

                elif action == "questions":
                    while True:
                        try:
                            qa = choose(f"Questions  [{subj_key}]", [
                                ("Add a question manually",               "add"),
                                ("Delete a question",                     "del"),
                                ("Delete all questions in a unit / paper", "del_unit"),
                                ("Delete all questions in this subject",  "del_subject_qs"),
                                ("Import questions from JSON",            "import"),
                                ("List all questions",                    "list"),
                            ])
                        except GoBack:
                            break   # GoBack at submenu = go back to main menu
                        if qa is None: break
                        try:
                            if   qa == "add":            html = add_question_interactive(html, subj_key)
                            elif qa == "del":            html = delete_question_interactive(html, subj_key)
                            elif qa == "del_unit":       html = delete_unit_questions_interactive(html, subj_key)
                            elif qa == "del_subject_qs": html = delete_all_questions_one_subject(html, subj_key)
                            elif qa == "import":         html = import_json_questions(html, subj_key)
                            elif qa == "list":           list_questions(html, subj_key)
                        except GoBack:
                            warn("Returned to questions menu.")

        except GoBack:
            warn("Returned to main menu.")


DEFAULT_QUIZ_DATA = r"C:\Users\CJay\Documents\ACA\QUIZ APP\QUIZ\quiz_data.js"


def parse_optional_scalar(value):
    if value is None:
        return None
    text = str(value)
    return int(text) if text.isdigit() else text


def parse_optional_bool(value):
    if value is None:
        return None
    raw = str(value).strip().lower()
    if raw in ('1', 'true', 'yes', 'y'):
        return True
    if raw in ('0', 'false', 'no', 'n'):
        return False
    raise argparse.ArgumentTypeError("expected true/false")


def normalize_cli_bucket(value):
    if value in ARRAY_TYPE_TO_BUCKET:
        return value
    array_type = array_type_from_bucket(value)
    if array_type:
        return array_type
    raise argparse.ArgumentTypeError(
        "bucket must be one of pastUnit, pastPaper, targetHard, targetNormal"
    )


def run_noninteractive_import(args):
    quiz_data_path = Path(args.quiz_data)
    if not quiz_data_path.is_file():
        err(f"File not found: {quiz_data_path}")
        return 1
    set_quiz_data_path(str(quiz_data_path))
    html = quiz_data_path.read_text(encoding='utf-8')

    pack, outcome = load_validated_pack(Path(args.import_json), repo_root())
    if pack is None:
        err("Import refused because official validation did not pass.")
        return 1

    overrides = destination_overrides(
        args.bucket,
        force_unit=parse_optional_scalar(args.unit),
        force_year=parse_optional_scalar(args.year),
        force_hard=args.hard,
    )
    try:
        plan = prepare_import_plan(
            html,
            Path(args.import_json),
            pack,
            outcome.warnings,
            args.subject,
            args.bucket,
            overrides,
        )
    except ValueError as exc:
        err(str(exc))
        return 1

    print_import_preview(plan)

    if not args.apply:
        warn("Dry run complete. No repository files were modified.")
        return 0
    if not plan.can_apply:
        err("Apply refused. Resolve the preview blocker(s) first.")
        return 1

    updated_html = apply_import_plan(html, plan)
    if not write_all_changes(quiz_data_path, updated_html):
        return 1
    ok(f"Applied import of {len(plan.questions)} question(s).")
    return 0


def build_arg_parser():
    parser = argparse.ArgumentParser(
        description="Mora Quiz content manager. Run without arguments for interactive mode."
    )
    parser.add_argument('--quiz-data', default=DEFAULT_QUIZ_DATA, help='Path to quiz_data.js')
    parser.add_argument('--import-json', help='Validate and preview/import a schemaVersion 2 question pack')
    parser.add_argument('--subject', help='Destination module/dataKey for --import-json')
    parser.add_argument(
        '--bucket',
        type=normalize_cli_bucket,
        help='Destination bucket: pastUnit, pastPaper, targetHard, or targetNormal'
    )
    parser.add_argument('--unit', help='Explicit destination unit override shown in preview')
    parser.add_argument('--year', help='Explicit destination year override shown in preview')
    parser.add_argument('--hard', type=parse_optional_bool, help='Explicit hard metadata override: true/false')
    parser.add_argument('--apply', action='store_true', help='Apply after preview; omitted means dry run')
    return parser


def cli_main(argv):
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    if args.import_json:
        missing = [name for name in ('subject', 'bucket') if getattr(args, name) in (None, '')]
        if missing:
            parser.error('--import-json requires --subject and --bucket')
        return run_noninteractive_import(args)
    parser.print_help()
    return 0


def interactive_main():
    banner("QUIZ APP CONTENT MANAGER v1.0")
    print(DIM("  This tool edits quiz_data.js and subject_data/*.js."))
    print(DIM("  Keep quiz_data.js in the same folder as index.html.\n"))
    try:
        src = ask("Path to quiz_data.js", DEFAULT_QUIZ_DATA).strip().strip('"\'')
    except (ExitApp, GoBack):
        print("\n  Bye!\n"); sys.exit(0)

    if not os.path.isfile(src):
        err(f"File not found: {src}"); sys.exit(1)

    set_quiz_data_path(src)

    with open(src, encoding='utf-8') as f:
        html = f.read()
    ok(f"Loaded: {src}  ({len(html):,} bytes)")

    try:
        html = main_menu(html)
    except ExitApp:
        print(RED("\n  Exited without saving.\n")); sys.exit(0)

    try:
        out = ask("Save to (Enter = overwrite same file)", src).strip().strip('"\'') or src
    except (ExitApp, GoBack):
        print(RED("\n  Exited without saving.\n")); sys.exit(0)

    if not write_all_changes(out, html):
        err("Could not save all quiz data changes."); sys.exit(1)
    ok(f"Saved -> {out}")
    print()


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    if argv:
        return cli_main(argv)
    interactive_main()
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except ExitApp:
        print(RED("\n  Exited.\n")); sys.exit(0)
    except KeyboardInterrupt:
        print("\n  Interrupted.\n"); sys.exit(0)


