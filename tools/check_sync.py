#!/usr/bin/env python3
"""Content-safe compatibility checks and Git-backed file inventory (stdlib only)."""
from __future__ import annotations

import argparse
import ast
from datetime import datetime, timezone
import fnmatch
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
# Fixed commands: the manifest cannot inject executable shell commands.
TESTS = {
    'curriculum-runtime': ['node', '--test', 'tests/curriculum.test.cjs'],
    'curriculum-database': ['node', '--test', 'tests/curriculum-database.test.cjs'],
    'chat-controls': ['node', '--test', 'tests/chat-controls.test.cjs'],
    'prompt': ['python', '-B', '-m', 'unittest', 'discover', '-s', 'tools/tests', '-p', 'test_claude_prompt_generator.py'],
    'samples': ['python', '-B', '-m', 'unittest', 'discover', '-s', 'tools/tests', '-p', 'test_sample_bank.py'],
    'imports': ['python', '-B', '-m', 'unittest', 'discover', '-s', 'tools/tests', '-p', 'test_quiz_manager.py'],
    'cs': ['python', '-B', '-m', 'unittest', 'discover', '-s', 'tools/tests', '-p', 'test_cs_block_prompt_generator.py'],
    'registry': ['python', '-B', 'tools/registry_check.py'],
    'sync': ['python', '-B', '-m', 'unittest', 'discover', '-s', 'tools/tests', '-p', 'test_sync_check.py'],
    'sample-runtime': ['node', '--test', 'tests/samples.test.cjs', 'tests/sample-explorer.test.cjs'],
    'offline': ['node', '--test', 'tests/offline.test.cjs'],
    'runtime': ['node', '--test', 'tests/runtime.test.cjs', 'tests/security.test.cjs'],
}


def git(root, *args):
    result = subprocess.run(['git', *args], cwd=root, capture_output=True, timeout=30)
    if result.returncode:
        raise ValueError('GIT_COMMAND_FAILED')
    return result.stdout.decode('utf-8', errors='replace')


def matches(path, patterns):
    return any(fnmatch.fnmatchcase(path, pattern) for pattern in patterns)


def owners(path, manifest):
    return [name for name, item in manifest['contracts'].items() if matches(path, item['paths'])]


def read(root, path):
    return (root / path).read_text(encoding='utf-8-sig')


def literal_constants(source):
    result = {}
    for item in ast.parse(source).body:
        if isinstance(item, ast.Assign):
            for target in item.targets:
                if isinstance(target, ast.Name) and target.id.startswith('VALID_'):
                    result[target.id] = set(ast.literal_eval(item.value))
    return result


def relationships(root, manifest):
    """Read only tool source, app shell metadata and synthetic packs."""
    failures = []
    def require(condition, code):
        if not condition:
            failures.append(code)
    require(manifest.get('manifestVersion') == 1, 'MANIFEST_VERSION')
    require(manifest.get('schemaVersion') == 2, 'SCHEMA_VERSION')
    require(bool(manifest['contracts']), 'EMPTY_CONTRACTS')
    for item in manifest['contracts'].values():
        require(isinstance(item.get('revision'), int) and item['revision'] > 0, 'CONTRACT_REVISION')
        require(bool(item.get('paths')) and bool(item.get('tests')), 'EMPTY_CONTRACT')
        require(all(name in TESTS for name in item['tests']), 'UNKNOWN_TEST')
    for file in ['tools/claude_prompt_generator.py', 'tools/validate_questions.py']:
        constants = literal_constants(read(root, file))
        for constant, key in [('VALID_QUESTION_TYPES', 'questionTypes'), ('VALID_ANSWER_MODES', 'answerModes'), ('VALID_BLOCK_TYPES', 'blockTypes')]:
            require(constants.get(constant) == set(manifest[key]), 'MODE_DRIFT_' + constant)
    pack = json.loads(read(root, 'examples/synthetic/preview.json'))
    catalog = json.loads(read(root, 'examples/synthetic/catalog.json'))
    require(pack.get('schemaVersion') == manifest['schemaVersion'], 'SAMPLE_SCHEMA_VERSION')
    require({q['type'] for q in pack['questions']} == set(manifest['questionTypes']), 'SAMPLE_TYPE_COVERAGE')
    require({q['answer']['mode'] for q in pack['questions']} == set(manifest['answerModes']), 'SAMPLE_MODE_COVERAGE')
    exact_id = '__dev_synthetic_preview_numeric_exact'
    exact = next((q for q in pack['questions'] if q['id'] == exact_id), {})
    require(exact.get('type') == 'numeric' and exact.get('answer', {}).get('tolerance') == 0, 'EXACT_NUMERIC_DRIFT')
    require(catalog.get('coverage', {}).get('preview-numeric-exact') == [exact_id], 'EXACT_NUMERIC_COVERAGE')
    prompt = read(root, 'tools/claude_prompt_generator.py')
    require('mode "numeric" with tolerance 0' in prompt and 'Use nonzero tolerance only' in prompt, 'EXACT_PROMPT_GUIDANCE')
    require('quiz_manager currently refuses live apply' in prompt, 'LIVE_PREVIEW_BOUNDARY')
    index, worker = read(root, 'index.html'), read(root, 'service-worker.js')
    version = re.search(r"PRECACHE_ASSET_VERSION\s*=\s*['\"]([^'\"]+)", worker)
    require(bool(version), 'MISSING_SHELL_VERSION')
    assets = re.findall(r'(?:src|href)=["\'](/[^"\']+?\?v=([^"\']+))["\']', index)
    require(bool(assets), 'MISSING_VERSIONED_ASSETS')
    if version:
        require(all(v == version[1] for _, v in assets), 'OFFLINE_VERSION_DRIFT')
    cached = set(re.findall(r"versionedAppAsset\(['\"]([^'\"]+)", worker))
    for url, _ in assets:
        path = url.split('?')[0]
        require(path in cached, 'OFFLINE_ASSET_MISSING')
        require((root / path.lstrip('/')).is_file(), 'APP_ASSET_MISSING')
    for path in cached:
        require((root / path.lstrip('/')).is_file(), 'CACHED_ASSET_MISSING')
    return sorted(set(failures))


def snapshot(root, base):
    # --no-renames includes both sides of renames as add/delete for dependency checks.
    head = git(root, 'rev-parse', 'HEAD').strip()
    base = git(root, 'rev-parse', '--verify', '--end-of-options', base + '^{commit}').strip()
    tracked = set(filter(None, git(root, 'ls-files', '-z').split('\0')))
    untracked = set(filter(None, git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')))
    changed = set(filter(None, git(root, 'diff', '--name-only', '--no-renames', '-z', base, '--').split('\0')))
    dirty = set(filter(None, git(root, 'diff', '--name-only', '--no-renames', '-z', 'HEAD', '--').split('\0')))
    return {'head': head, 'base': base, 'tracked': tracked, 'untracked': untracked, 'changed': changed | untracked, 'dirty': dirty}


def fingerprint(root, manifest):
    """One snapshot digest, not duplicate per-file version labels. Never print diffs."""
    digest = hashlib.sha256(git(root, 'rev-parse', 'HEAD').encode())
    digest.update(git(root, 'diff', '--binary', '--no-ext-diff', '--no-textconv', 'HEAD', '--').encode())
    paths = git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
    for path in sorted(p for p in paths if p and not matches(p, manifest['excludedUntracked'])):
        digest.update(path.encode()); digest.update(b'\0')
        file = root / path
        if file.is_symlink():
            digest.update(os.readlink(file).encode())
        elif file.is_file():
            with file.open('rb') as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    digest.update(chunk)
    return digest.hexdigest()


def run_check(root, name):
    command = list(TESTS[name])
    if command[0] == 'python':
        command[0] = sys.executable
    try:
        result = subprocess.run(command, cwd=root, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=60)
        output = result.stdout + result.stderr
        count = re.search(r'(?:Ran (\d+) tests?|(?:#|ℹ) tests (\d+))', output)
        return {'name': name, 'status': 'PASS' if result.returncode == 0 else 'FAIL',
                'reason': 'DEPENDENCY_MISSING' if 'ModuleNotFoundError:' in output else None,
                'tests': int(next(v for v in count.groups() if v)) if count else None,
                'exitCode': result.returncode}
    except (OSError, subprocess.TimeoutExpired):
        return {'name': name, 'status': 'FAIL', 'reason': 'MISSING_RUNTIME_OR_TIMEOUT'}


def inventory(root, snap, manifest, checks, only=None):
    # One history scan, no per-file subprocess loop and no real content reads.
    latest = {}
    history = git(root, '-c', 'core.quotepath=false', 'log', '--format=%x1e%H%x09%cI', '--name-only', '--no-renames', 'HEAD', '--')
    for entry in history.split('\x1e')[1:]:
        lines = entry.splitlines()
        commit, date = lines[0].split('\t', 1)
        for path in lines[1:]:
            if path:
                latest.setdefault(path, (commit, date))
    blobs = {}
    for entry in git(root, 'ls-tree', '-r', '-z', 'HEAD').split('\0'):
        if entry:
            meta, path = entry.split('\t', 1)
            blobs[path] = meta.split()[2]
    rows = []
    for path in sorted(snap['tracked'] | snap['untracked'] | snap['dirty'] | set(blobs)):
        if only and path != only:
            continue
        groups = owners(path, manifest)
        commit, date = latest.get(path, (None, None))
        row = {'path': path, 'contentState': 'untracked' if path in snap['untracked'] else 'modified' if path in snap['dirty'] else 'matches_HEAD',
               'lastChangedCommit': commit, 'lastChangedAt': date, 'committedBlob': blobs.get(path),
               'contracts': groups, 'coverage': 'mapped' if groups else 'unmapped',
               'checks': [c for c in checks if any(c['name'] in manifest['contracts'][g]['tests'] for g in groups)]}
        if not (root / path).exists():
            row['contentState'] = 'deleted'
        else:
            row['workingTreeModifiedAt'] = datetime.fromtimestamp((root / path).lstat().st_mtime, timezone.utc).isoformat()
        if path in snap['untracked'] and matches(path, manifest['excludedUntracked']):
            row['coverage'] = 'excluded-untracked'
        rows.append(row)
    return rows


def build_report(root, manifest, base, all_checks=False, reviewed=False, file=None, include_inventory=False, runner=run_check):
    before = fingerprint(root, manifest)
    snap = snapshot(root, base)
    excluded = {p for p in snap['untracked'] if matches(p, manifest['excludedUntracked'])}
    changed = snap['changed'] - excluded
    groups = set(manifest['contracts']) if all_checks else {g for p in changed for g in owners(p, manifest)}
    if file:
        groups.update(owners(file, manifest))
    unknown = sorted(p for p in changed if not owners(p, manifest))
    if file and not owners(file, manifest) and file not in unknown:
        unknown.append(file)
    review = sorted(p for p in changed if matches(p, manifest['reviewPaths']))
    errors = relationships(root, manifest)
    names = sorted({n for g in groups for n in manifest['contracts'][g]['tests']})
    checks = [] if errors else [runner(root, name) for name in names]
    after = fingerprint(root, manifest)
    if after != before:
        errors.append('SOURCE_CHANGED_DURING_CHECKS')
    status = ('FAIL' if errors or any(c['status'] != 'PASS' for c in checks) else
              'UNMAPPED' if unknown else 'REVIEW NEEDED' if review and not reviewed else 'PASS')
    report = {'reportVersion': 1, 'generatedAt': datetime.now(timezone.utc).isoformat(),
              'releaseCommit': snap['head'], 'comparisonBase': snap['base'], 'manifestVersion': manifest['manifestVersion'],
              'snapshotFingerprint': after, 'workingTreeDirty': bool(snap['dirty'] or (snap['untracked'] - excluded)),
              'status': status, 'scope': 'all mapped contracts' if all_checks else 'relationships plus affected contracts',
              'changedCount': len(changed), 'excludedUntrackedCount': len(excluded), 'contracts': sorted(groups),
              'relationshipErrors': errors, 'checks': checks, 'unmapped': unknown,
              'reviewPaths': review, 'reviewAcknowledged': reviewed,
              'limits': 'Tests do not certify every file, academic correctness, hosted state or manual/browser behavior. Untracked files are not part of the committed release.'}
    if include_inventory or file:
        report['files'] = inventory(root, snap, manifest, checks, only=file)
        if file and not report['files']:
            report['status'] = 'UNMAPPED'
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--all', action='store_true', help='Run all mapped checks, not only affected groups')
    parser.add_argument('--base', help='Compare changes since this existing commit/ref; default manifest baseline')
    parser.add_argument('--file', help='Include metadata and checks for one repository-relative file')
    parser.add_argument('--inventory', action='store_true', help='Include every tracked/untracked non-ignored path; requires --output')
    parser.add_argument('--output', help='Write generated JSON report under .local-reports/')
    parser.add_argument('--json', action='store_true', help='Print report JSON instead of compact text')
    parser.add_argument('--verify-report', help='Check whether an existing JSON report still describes this exact Git/worktree snapshot; does not rerun tests')
    parser.add_argument('--reviewed', action='store_true', help='Caller acknowledges review of listed prompt/doc/manifest changes; never bypasses failures')
    args = parser.parse_args(argv)
    if args.inventory and not args.output:
        parser.error('--inventory requires --output to avoid flooding the terminal')
    try:
        manifest = json.loads(read(ROOT, 'tools/compatibility.json'))
        if args.verify_report:
            stored = json.loads(Path(args.verify_report).read_text(encoding='utf-8'))
            fresh = stored.get('snapshotFingerprint') == fingerprint(ROOT, manifest)
            print(('CURRENT' if fresh else 'STALE') + ' | snapshot comparison only; stored check status: ' +
                  ('PASS' if stored.get('status') == 'PASS' else 'NOT PASS'))
            return 0 if fresh and stored.get('status') == 'PASS' else 2
        file = args.file.replace('\\', '/') if args.file else None
        if file and (Path(file).is_absolute() or '..' in Path(file).parts):
            raise ValueError('INVALID_FILE_PATH')
        output = None
        if args.output:
            output = (ROOT / args.output).resolve()
            if not output.is_relative_to(ROOT.resolve()) or not output.is_relative_to((ROOT / '.local-reports').resolve()) or output.suffix != '.json':
                raise ValueError('REPORT_MUST_BE_LOCAL_JSON')
        report = build_report(ROOT, manifest, args.base or manifest['baselineCommit'], args.all, args.reviewed, file, args.inventory)
        if output:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(report, indent=2, ensure_ascii=True) + '\n', encoding='utf-8')
        if args.json:
            print(json.dumps(report, ensure_ascii=True))
        else:
            print(f"{report['status']} | release {report['releaseCommit'][:8]} | {report['changedCount']} changed | {len(report['checks'])} check suites")
            for check in report['checks']:
                print(f"  {check['status']} {check['name']}" + (f" ({check['tests']} tests)" if check.get('tests') is not None else '') +
                      (' ' + check['reason'] if check.get('reason') else ''))
            for category in ['relationshipErrors', 'unmapped', 'reviewPaths']:
                values = report[category]
                if values:
                    print(f"  {category}: {len(values)}" + (' (acknowledged)' if category == 'reviewPaths' and args.reviewed else ''))
                    for value in values[:5]:
                        print('    ' + json.dumps(value, ensure_ascii=True))
            if file:
                print(json.dumps(report.get('files', []), ensure_ascii=True))
            if output:
                print('  Report: ' + str(output))
            print('  Scope: ' + report['scope'] + '; ignored files excluded; no hosted/manual verification.')
        return 0 if report['status'] == 'PASS' else 1 if report['status'] == 'FAIL' else 2
    except (ValueError, KeyError, TypeError, OSError, SyntaxError, subprocess.TimeoutExpired):
        print('FAIL | checker input/runtime error; no verification claimed.')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
