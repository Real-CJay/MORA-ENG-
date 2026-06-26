#!/usr/bin/env python3
"""Validate the Mora Quiz semester/department subject registry.

This is a small static checker for quiz_data.js. It intentionally avoids
executing the app JavaScript so it can run in a plain Python environment.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


STRING_RE = re.compile(r"\b{prop}\s*:\s*(['\"])(.*?)\1", re.DOTALL)
BOOL_RE = re.compile(r"\b{prop}\s*:\s*(true|false)\b")
ARRAY_RE = re.compile(r"\b{prop}\s*:\s*\[(.*?)\]", re.DOTALL)


@dataclass
class Reporter:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def error(self, path: str, message: str) -> None:
        self.errors.append(f"{path}: {message}")

    def warn(self, path: str, message: str) -> None:
        self.warnings.append(f"{path}: {message}")


@dataclass
class Semester:
    key: str
    id: str | None
    active: bool | None
    has_departments: bool | None
    department_ids: set[str]


@dataclass
class Subject:
    key: str
    registry_key: str | None
    semester_id: str | None
    department_ids: list[str] | None


def skip_string(source: str, index: int) -> int:
    quote = source[index]
    index += 1
    while index < len(source):
        ch = source[index]
        if ch == "\\":
            index += 2
            continue
        index += 1
        if ch == quote:
            break
    return index


def skip_comment(source: str, index: int) -> int:
    if source.startswith("//", index):
        newline = source.find("\n", index + 2)
        return len(source) if newline == -1 else newline + 1
    if source.startswith("/*", index):
        end = source.find("*/", index + 2)
        return len(source) if end == -1 else end + 2
    return index


def scan_balanced(source: str, start: int, opener: str, closer: str) -> int:
    depth = 0
    index = start
    while index < len(source):
        if source[index] in "'\"`":
            index = skip_string(source, index)
            continue
        if source.startswith("//", index) or source.startswith("/*", index):
            index = skip_comment(source, index)
            continue
        if source[index] == opener:
            depth += 1
        elif source[index] == closer:
            depth -= 1
            if depth == 0:
                return index
        index += 1
    raise ValueError(f"Unbalanced {opener}{closer} block")


def extract_const_object(source: str, name: str) -> str:
    match = re.search(rf"\bconst\s+{re.escape(name)}\s*=", source)
    if not match:
        raise ValueError(f"Could not find const {name}")
    start = source.find("{", match.end())
    if start == -1:
        raise ValueError(f"Could not find object literal for const {name}")
    end = scan_balanced(source, start, "{", "}")
    return source[start : end + 1]


def parse_key(source: str, index: int) -> tuple[str, int]:
    if source[index] in "'\"":
        quote = source[index]
        end = index + 1
        value = []
        while end < len(source):
            ch = source[end]
            if ch == "\\":
                if end + 1 < len(source):
                    value.append(source[end + 1])
                end += 2
                continue
            if ch == quote:
                return "".join(value), end + 1
            value.append(ch)
            end += 1
        raise ValueError("Unterminated string key")

    match = re.match(r"[A-Za-z_$][A-Za-z0-9_$-]*", source[index:])
    if not match:
        raise ValueError(f"Expected object key near {source[index:index + 30]!r}")
    key = match.group(0)
    return key, index + len(key)


def skip_spaces_and_comments(source: str, index: int) -> int:
    while index < len(source):
        if source[index].isspace():
            index += 1
            continue
        if source.startswith("//", index) or source.startswith("/*", index):
            index = skip_comment(source, index)
            continue
        break
    return index


def iter_top_level_entries(object_text: str) -> Iterable[tuple[str, str]]:
    body = object_text.strip()
    if not body.startswith("{") or not body.endswith("}"):
        raise ValueError("Expected object text")
    source = body[1:-1]
    index = 0

    while index < len(source):
        index = skip_spaces_and_comments(source, index)
        if index >= len(source):
            break
        if source[index] == ",":
            index += 1
            continue

        key, index = parse_key(source, index)
        index = skip_spaces_and_comments(source, index)
        if index >= len(source) or source[index] != ":":
            raise ValueError(f"Expected ':' after key {key!r}")
        index += 1
        value_start = skip_spaces_and_comments(source, index)
        index = value_start

        depth = 0
        while index < len(source):
            if source[index] in "'\"`":
                index = skip_string(source, index)
                continue
            if source.startswith("//", index) or source.startswith("/*", index):
                index = skip_comment(source, index)
                continue
            if source[index] in "{[(":
                depth += 1
            elif source[index] in "}])":
                depth -= 1
            elif source[index] == "," and depth == 0:
                break
            index += 1

        yield key, source[value_start:index].strip()
        if index < len(source) and source[index] == ",":
            index += 1


def string_prop(value: str, prop: str) -> str | None:
    match = re.search(STRING_RE.pattern.format(prop=re.escape(prop)), value, re.DOTALL)
    return match.group(2) if match else None


def bool_prop(value: str, prop: str) -> bool | None:
    match = re.search(BOOL_RE.pattern.format(prop=re.escape(prop)), value)
    if not match:
        return None
    return match.group(1) == "true"


def string_array_prop(value: str, prop: str) -> list[str] | None:
    match = re.search(ARRAY_RE.pattern.format(prop=re.escape(prop)), value, re.DOTALL)
    if not match:
        return None
    return re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))


def prop_value(value: str, prop: str) -> str | None:
    try:
        entries = dict(iter_top_level_entries(value))
    except ValueError:
        return None
    return entries.get(prop)


def parse_semesters(object_text: str, reporter: Reporter) -> dict[str, Semester]:
    semesters: dict[str, Semester] = {}
    seen_keys: set[str] = set()
    seen_ids: set[str] = set()

    for key, value in iter_top_level_entries(object_text):
        if key in seen_keys:
            reporter.error(f"SEMESTERS.{key}", "duplicate semester object key")
        seen_keys.add(key)

        semester_id = string_prop(value, "id")
        if not semester_id:
            reporter.error(f"SEMESTERS.{key}.id", "missing semester id")
        elif semester_id in seen_ids:
            reporter.error(f"SEMESTERS.{key}.id", f"duplicate semester id {semester_id!r}")
        else:
            seen_ids.add(semester_id)

        active = bool_prop(value, "active")
        has_departments = bool_prop(value, "hasDepartments")
        departments_raw = prop_value(value, "departments")
        department_ids: set[str] = set()

        if has_departments is True and departments_raw == "null":
            reporter.error(f"SEMESTERS.{key}.departments", "hasDepartments=true but departments is null")
        if has_departments is True and departments_raw and departments_raw != "null":
            seen_department_keys: set[str] = set()
            seen_department_ids: set[str] = set()
            for department_key, department_value in iter_top_level_entries(departments_raw):
                if department_key in seen_department_keys:
                    reporter.error(f"SEMESTERS.{key}.departments.{department_key}", "duplicate department object key")
                seen_department_keys.add(department_key)

                department_id = string_prop(department_value, "id")
                if not department_id:
                    reporter.error(f"SEMESTERS.{key}.departments.{department_key}.id", "missing department id")
                    continue
                if department_id in seen_department_ids:
                    reporter.error(
                        f"SEMESTERS.{key}.departments.{department_key}.id",
                        f"duplicate department id {department_id!r}",
                    )
                seen_department_ids.add(department_id)
                department_ids.add(department_id)

        semesters[key] = Semester(
            key=key,
            id=semester_id,
            active=active,
            has_departments=has_departments,
            department_ids=department_ids,
        )

    return semesters


def parse_subjects(object_text: str) -> list[Subject]:
    subjects: list[Subject] = []
    for key, value in iter_top_level_entries(object_text):
        subjects.append(
            Subject(
                key=key,
                registry_key=string_prop(value, "key"),
                semester_id=string_prop(value, "semesterId"),
                department_ids=string_array_prop(value, "departmentIds"),
            )
        )
    return subjects


def validate_subjects(subjects: list[Subject], semesters: dict[str, Semester], reporter: Reporter) -> None:
    semester_ids = {semester.id for semester in semesters.values() if semester.id}

    for subject in subjects:
        path = f"SUBJECTS.{subject.key}"
        if not subject.semester_id:
            reporter.error(f"{path}.semesterId", "missing semesterId")
            continue
        if subject.semester_id not in semester_ids:
            reporter.error(f"{path}.semesterId", f"semester {subject.semester_id!r} does not exist")
            continue

        semester = next(sem for sem in semesters.values() if sem.id == subject.semester_id)
        if subject.department_ids is None:
            reporter.error(f"{path}.departmentIds", "missing departmentIds")
            continue
        if not subject.department_ids:
            reporter.warn(f"{path}.departmentIds", "empty departmentIds list; module would be invisible")

        for index, department_id in enumerate(subject.department_ids):
            if department_id == "all":
                continue
            if semester.has_departments is not True:
                reporter.error(
                    f"{path}.departmentIds[{index}]",
                    f"department {department_id!r} is not valid because semester {subject.semester_id!r} has no departments",
                )
                continue
            if department_id not in semester.department_ids:
                reporter.error(
                    f"{path}.departmentIds[{index}]",
                    f"department {department_id!r} does not exist in semester {subject.semester_id!r}",
                )

    for semester in semesters.values():
        if semester.id and semester.active is False:
            for subject in subjects:
                if subject.semester_id == semester.id and subject.department_ids == ["all"]:
                    reporter.warn(
                        f"SUBJECTS.{subject.key}",
                        f"semester {semester.id!r} is archived but this all-shared module remains visible",
                    )


def print_report(registry_path: Path, reporter: Reporter, semester_count: int, subject_count: int) -> None:
    print(f"== {registry_path} ==")
    print(f"Semesters: {semester_count}")
    print(f"Subjects: {subject_count}")

    if reporter.errors:
        print(f"Errors ({len(reporter.errors)}):")
        for item in reporter.errors:
            print(f"  ERROR: {item}")
    else:
        print("Errors: 0")

    if reporter.warnings:
        print(f"Warnings ({len(reporter.warnings)}):")
        for item in reporter.warnings:
            print(f"  WARNING: {item}")
    else:
        print("Warnings: 0")

    print(f"Result: {'FAIL' if reporter.errors else 'PASS'}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Validate Mora Quiz SEMESTERS/SUBJECTS registry metadata.")
    parser.add_argument("registry", nargs="?", default="quiz_data.js", help="Path to quiz_data.js")
    args = parser.parse_args(argv)

    registry_path = Path(args.registry)
    source = registry_path.read_text(encoding="utf-8")
    reporter = Reporter()

    try:
        semesters_text = extract_const_object(source, "SEMESTERS")
        subjects_text = extract_const_object(source, "SUBJECTS")
        semesters = parse_semesters(semesters_text, reporter)
        subjects = parse_subjects(subjects_text)
        validate_subjects(subjects, semesters, reporter)
    except (OSError, ValueError) as exc:
        reporter.error(str(registry_path), str(exc))
        print_report(registry_path, reporter, 0, 0)
        return 1

    print_report(registry_path, reporter, len(semesters), len(subjects))
    return 1 if reporter.errors else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
