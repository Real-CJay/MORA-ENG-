#!/usr/bin/env python3
"""Read-only content validation. JSON output contains metadata/codes, never prose.

Reuses schema validation, the live compatibility gate and the non-executing
chunk parser. This is a diagnostic, not an import permission or academic check.
"""
from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import json
import re
import sys
from pathlib import Path

import export_legacy_subjects as exporter
import quiz_manager as manager
import validate_questions as schema

ROOT = Path(__file__).resolve().parents[1]
FIELDS = set("questions schemaVersion subject bucket images stimuli body explanation options answer value label mode type id unit year text opts ans exp context img imgAlt src alt title rows header latex display language source status stimulusId tolerance toleranceType matchMode orderedMatch extraAllowed".split())


def safe_id(value):
    """IDs are metadata. Malformed identifiers never become output text."""
    if isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_-]{1,96}", value):
        return value
    if value is None:
        return None
    return "redacted_" + hashlib.sha256(str(value).encode("utf-8", errors="replace")).hexdigest()[:12]


def safe_field(path):
    if path.startswith("images."):
        return "images[*]"
    if path.startswith("stimuli."):
        return "stimuli[*]"
    if re.fullmatch(r"[A-Za-z]+(?:\[\d+\])*(?:\.[A-Za-z]+(?:\[\d+\])*)*", path):
        if all(part in FIELDS for part in re.findall(r"[A-Za-z]+", path)):
            return path
    return "$"


def schema_code(message):
    # Only fixed literals leave this function. Unknown rules fail generically.
    for fragment, code in (
        ("unsafe content", "UNSAFE_CONTENT"),
        ("missing or out-of-root image", "IMAGE_UNRESOLVED"),
        ("local image file does not exist", "IMAGE_UNRESOLVED"),
        ("invalid missing-image", "IMAGE_PLACEHOLDER"),
        ("not found in images registry", "IMAGE_REFERENCE"),
        ("references a stimulus", "STIMULUS_REFERENCE"),
        ("duplicate id", "DUPLICATE_ID"),
        ("duplicate option", "DUPLICATE_OPTION_LABEL"),
        ("missing id", "ID_REQUIRED"),
        ("legacy format detected", "LEGACY_FORMAT"),
        ("missing source", "SOURCE_MISSING"),
        ("missing year/unit", "YEAR_UNIT_MISSING"),
        ("without imgAlt", "IMAGE_ALT_MISSING"),
        ("invalid question type", "QUESTION_TYPE"),
        ("invalid block type", "BLOCK_TYPE"),
        ("invalid answer mode", "ANSWER_MODE"),
        ("answer value", "ANSWER_VALUE"),
        ("answer label", "ANSWER_VALUE"),
        ("ans out of range", "ANSWER_INDEX"),
        ("tolerance", "ANSWER_TOLERANCE"),
        ("matchMode", "ANSWER_MATCH_MODE"),
        ("math", "MATH_SYNTAX"),
        ("LaTeX", "MATH_SYNTAX"),
    ):
        if fragment in message:
            return code
    return "SCHEMA_RULE"


class SafeReporter(schema.Reporter):
    def __init__(self, questions):
        super().__init__()
        self.questions = questions if isinstance(questions, list) else []

    def record(self, severity, path, code):
        match = re.match(r"questions\[(\d+)\]", path)
        index = int(match[1]) if match else None
        question = self.questions[index] if index is not None and index < len(self.questions) else None
        issue = {"severity": severity, "field": safe_field(path), "code": code}
        if index is not None:
            issue["questionIndex"] = index
            issue["questionId"] = safe_id(question.get("id")) if isinstance(question, dict) else None
        (self.errors if severity == "error" else self.warnings).append(issue)

    def error(self, path, message):
        self.record("error", path, schema_code(message))

    def warn(self, path, message):
        self.record("warning", path, schema_code(message))


def live_issue(message):
    for fragment, field, code in (
        ("live ID", "id", "LIVE_ID"),
        ("subject does not match", "subject", "MODULE_MISMATCH"),
        ("preview-only", "type", "PREVIEW_ONLY"),
        ("live opts", "opts", "LIVE_OPTIONS"),
        ("live ans", "ans", "LIVE_ANSWER_INDEX"),
        ("live question text", "text", "LIVE_TEXT"),
        ("unknown destination unit", "unit", "UNIT_UNKNOWN"),
        ("out-of-root image", "img", "IMAGE_UNRESOLVED"),
        ("img must", "img", "LIVE_IMAGE_PATH"),
        ("unsafe content", "$", "UNSAFE_CONTENT"),
    ):
        if fragment in message:
            return field, code
    return "$", "LIVE_RULE"


def validate_pack(pack, root=ROOT, *, live_meta=None, subject=None, seen=None):
    questions = pack.get("questions") if isinstance(pack, dict) else None
    reporter = SafeReporter(questions)
    # Catch errors from malformed nested values without echoing exceptions.
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        try:
            schema.validate_pack(pack, str(root), reporter=reporter)
        except Exception:
            reporter.record("error", "$", "VALIDATION_ABORTED")
        if isinstance(questions, list):
            for index, question in enumerate(questions):
                path = f"questions[{index}]"
                if not isinstance(question, dict):
                    continue
                qid = question.get("id")
                if seen is not None and isinstance(qid, str):
                    if qid in seen:
                        reporter.record("error", path + ".id", "GLOBAL_DUPLICATE_ID")
                    seen.add(qid)
                if live_meta is not None:
                    try:
                        for message in manager.live_question_blockers(question, subject, live_meta, root):
                            field, code = live_issue(message)
                            reporter.record("error", path + ("." + field if field != "$" else ""), code)
                    except Exception:
                        reporter.record("error", path, "LIVE_VALIDATION_ABORTED")
    return {"questions": len(questions) if isinstance(questions, list) else 0,
            "errors": len(reporter.errors), "warnings": len(reporter.warnings),
            "issues": reporter.errors + reporter.warnings,
            "checks": "schema-and-live" if live_meta is not None else "schema-only"}


def failure(code):
    return {"questions": 0, "errors": 1, "warnings": 0,
            "issues": [{"severity": "error", "field": "$", "code": code}], "checks": "incomplete"}


def validate_file(path, root=ROOT):
    try:
        pack = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    except Exception:
        return failure("INPUT_UNREADABLE")
    return validate_pack(pack, root)


def validate_repository(root=ROOT):
    """Parse data as JSON; no JS execution, writes or export files."""
    root = Path(root).resolve()
    reports, seen = [], set()
    try:
        registry = (root / "quiz_data.js").read_text(encoding="utf-8-sig")
        subjects = manager.get_subject_keys(registry)
        if not subjects:
            return [failure("REGISTRY_UNREADABLE")]
        files = sorted((root / "subject_data").glob("*.js"))
        found = set()
        for path in files:
            try:
                subject, chunk = exporter.extract_subject_chunk(path)
                found.add(subject)
                if subject not in subjects or path.stem != subject:
                    reports.append(failure("MODULE_UNREGISTERED"))
                    continue
                meta = manager.get_subject_meta(registry, subject)
                for bucket in exporter.BUCKETS:
                    pack = exporter.make_pack(subject, bucket, chunk.get(bucket, []))
                    result = validate_pack(pack, root, live_meta=meta, subject=subject, seen=seen)
                    result.update(module=safe_id(subject), bucket=bucket)
                    reports.append(result)
            except Exception:
                reports.append(failure("CHUNK_UNREADABLE"))
        for subject in sorted(set(subjects) - found):
            result = failure("CHUNK_MISSING")
            result["module"] = safe_id(subject)
            reports.append(result)
    except Exception:
        reports.append(failure("REPOSITORY_UNREADABLE"))
    return reports


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("packs", nargs="*", help="JSON packs (schema checks only)")
    parser.add_argument("--root", type=Path, default=ROOT, help="Repository/image root")
    parser.add_argument("--live-repo", action="store_true", help="Validate registered live chunks, IDs, units and images")
    parser.add_argument("--max-issues", type=int, default=20, help="Output limit; counts/exit code always reflect all issues")
    args = parser.parse_args(argv)
    if not args.packs and not args.live_repo:
        parser.error("provide JSON packs or --live-repo")
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        reports = [validate_file(path, args.root) for path in args.packs]
        if args.live_repo:
            reports.extend(validate_repository(args.root))
    errors = sum(r["errors"] for r in reports)
    warnings = sum(r["warnings"] for r in reports)
    budget = max(0, args.max_issues)
    selected = [[] for _ in reports]
    # A long list of legacy warnings must not conceal errors in later files.
    for severity in ("error", "warning"):
        for index, report in enumerate(reports):
            for issue in report["issues"]:
                if issue["severity"] == severity and budget:
                    selected[index].append(issue)
                    budget -= 1
    for index, report in enumerate(reports):
        report["inputIndex"] = index
        report["omittedIssues"] = len(report["issues"]) - len(selected[index])
        report["issues"] = selected[index]
    print(json.dumps({"reportVersion": 1, "errors": errors, "warnings": warnings,
                      "questions": sum(r["questions"] for r in reports), "reports": reports}, ensure_ascii=True))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
