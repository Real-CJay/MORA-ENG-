#!/usr/bin/env node
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptLegacyQuestion, isLegacyQuestion } from '../js/legacy_adapter.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PACKS_DIR = 'content/question-packs';
const DEFAULT_REPORT = 'tools/full_dataset_adapter_dry_run_report.md';
const DEFAULT_MANIFEST = 'dev/dataset_renderer_manifest.json';
const VALID_RENDER_TYPES = new Set(['mcq', 'image_based', 'multi_select', 'numeric', 'short_answer', 'structured']);
const HTML_TAG_RE = /<\s*\/?\s*[a-z][^>]*>/i;
const UNSAFE_HTML_RE = /<\s*(script|iframe)\b|on(?:click|error|load)\s*=|javascript:/i;
const LATEX_RE = /\\\(|\\\)|\\\[|\\\]|\$[^$]+\$|\\(?:frac|sqrt|sum|int|lim|alpha|beta|gamma|theta|lambda|mu|nu|rho|sigma|omega|Delta|pi|mathrm|mathbb|cdot|times|le|ge|neq)\b|(?:\^|_)\{[^}]+\}/;
const MOJIBAKE_RE = /[\u00C2\u00C3\u00E2\uFFFD]/;

function parseArgs(argv) {
  const args = {
    packsDir: DEFAULT_PACKS_DIR,
    report: DEFAULT_REPORT,
    manifest: DEFAULT_MANIFEST,
    sampleLimit: 60,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--packs-dir') args.packsDir = argv[++index];
    else if (item === '--report') args.report = argv[++index];
    else if (item === '--manifest') args.manifest = argv[++index];
    else if (item === '--sample-limit') args.sampleLimit = Number(argv[++index]);
    else if (item === '-h' || item === '--help') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }

  if (!Number.isFinite(args.sampleLimit) || args.sampleLimit < 1) args.sampleLimit = 60;
  return args;
}

function printHelp() {
  console.log(`Usage: node tools/full_dataset_adapter_dry_run.mjs [options]

Options:
  --packs-dir <dir>    Source exported packs directory (default: ${DEFAULT_PACKS_DIR})
  --report <path>      Markdown report output (default: ${DEFAULT_REPORT})
  --manifest <path>    Dev preview manifest output (default: ${DEFAULT_MANIFEST})
  --sample-limit <n>   Max issue samples per category in report (default: 60)
`);
}

function toRepoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function valueText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function textFromBlock(block) {
  if (!block || typeof block !== 'object') return valueText(block);
  if (block.type === 'text') return valueText(block.value ?? block.text);
  if (block.type === 'math') return valueText(block.latex ?? block.value ?? block.text);
  if (block.type === 'code') return valueText(block.value ?? block.code);
  if (block.type === 'table') return asArray(block.rows).flat().map(valueText).join(' ');
  if (block.type === 'image') return valueText(block.alt ?? block.caption ?? block.assetId);
  return valueText(block.value ?? block.text);
}

function rawSearchText(question) {
  if (!question || typeof question !== 'object') return '';
  const parts = [
    question.id,
    question.subject,
    question.unit,
    question.topic,
    question.year,
    question.context,
    question.text,
    question.exp,
    ...asArray(question.opts),
  ];
  if (Array.isArray(question.body)) parts.push(...question.body.map(textFromBlock));
  if (Array.isArray(question.explanation)) parts.push(...question.explanation.map(textFromBlock));
  if (Array.isArray(question.options)) {
    for (const option of question.options) {
      if (option && typeof option === 'object' && Array.isArray(option.body)) {
        parts.push(...option.body.map(textFromBlock));
      } else {
        parts.push(valueText(option));
      }
    }
  }
  return parts.map(valueText).filter(Boolean).join('\n');
}

function rawContentText(question) {
  if (!question || typeof question !== 'object') return '';
  const parts = [
    question.context,
    question.text,
    question.exp,
    question.imgAlt,
    ...asArray(question.opts),
  ];
  if (Array.isArray(question.body)) parts.push(...question.body.map(textFromBlock));
  if (Array.isArray(question.explanation)) parts.push(...question.explanation.map(textFromBlock));
  if (Array.isArray(question.options)) {
    for (const option of question.options) {
      if (option && typeof option === 'object' && Array.isArray(option.body)) {
        parts.push(...option.body.map(textFromBlock));
      } else {
        parts.push(valueText(option));
      }
    }
  }
  return parts.map(valueText).filter(Boolean).join('\n');
}

function stripForSnippet(text, limit = 220) {
  return text.replace(/\s+/g, ' ').trim().slice(0, limit).trimEnd();
}

async function walkJsonFiles(dir) {
  const found = [];
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.json')) found.push(fullPath);
    }
  }
  await walk(dir);
  return found.sort((a, b) => toRepoRelative(a).localeCompare(toRepoRelative(b)));
}

function imagePathStatus(src) {
  if (!src || typeof src !== 'string') return { src, present: false, reason: 'missing src' };
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) {
    return { src, present: null, reason: 'external or data URL not checked' };
  }
  const cleaned = src.replace(/^\/+/, '').replace(/\\/g, '/');
  const absolute = path.join(REPO_ROOT, cleaned);
  return { src, present: fsSync.existsSync(absolute), checkedPath: cleaned };
}

function optionLabels(options) {
  return asArray(options).map((option, index) => {
    if (option && typeof option === 'object') return String(option.label ?? 'abcdefghijklmnopqrstuvwxyz'[index] ?? index + 1);
    return String('abcdefghijklmnopqrstuvwxyz'[index] ?? index + 1);
  });
}

function answerIssues(adapted) {
  const issues = [];
  const answer = adapted?.answer || {};
  const labels = optionLabels(adapted?.options);
  if (!answer.mode) issues.push('missing answer mode');
  if (answer.mode === 'single' && !labels.includes(String(answer.value))) {
    issues.push(`single answer ${JSON.stringify(answer.value)} not in option labels`);
  }
  if (answer.mode === 'multiple') {
    const values = asArray(answer.value).map(String);
    for (const value of values) {
      if (!labels.includes(value)) issues.push(`multiple answer ${JSON.stringify(value)} not in option labels`);
    }
    if (!values.length) issues.push('multiple answer has no correct labels');
  }
  return issues;
}

function inspectQuestion(raw, adapted, packInfo, index) {
  const errors = [];
  const warnings = [];
  const flags = {
    legacy: isLegacyQuestion(raw),
    hasImage: false,
    missingImage: false,
    hasMath: false,
    suspiciousHtml: false,
    unsafeHtml: false,
    mojibake: false,
    emptyText: false,
    emptyOptions: false,
    emptyExplanation: false,
    unsupportedShape: false,
  };
  const imageStatuses = [];
  const rawText = rawSearchText(raw);
  const contentText = rawContentText(raw);

  if (!raw || typeof raw !== 'object') {
    errors.push('question is not an object');
    flags.unsupportedShape = true;
  }
  if (!flags.legacy && !(raw?.body && raw?.answer)) {
    warnings.push('question is neither legacy-flat nor full block schema');
    flags.unsupportedShape = true;
  }
  if (!raw?.id) warnings.push('missing id');

  if (HTML_TAG_RE.test(contentText)) {
    flags.suspiciousHtml = true;
    warnings.push('HTML-like text found; renderer/adapter must keep this escaped as plain text');
  }
  if (UNSAFE_HTML_RE.test(contentText)) {
    flags.unsafeHtml = true;
    warnings.push('script/event/javascript-like content found; must never render as HTML');
  }
  if (LATEX_RE.test(contentText)) {
    flags.hasMath = true;
  }
  if (MOJIBAKE_RE.test(contentText)) {
    flags.mojibake = true;
    warnings.push('mojibake-looking characters detected');
  }

  if (raw?.img) {
    flags.hasImage = true;
    const status = imagePathStatus(raw.img);
    imageStatuses.push(status);
    if (status.present === false) {
      flags.missingImage = true;
      warnings.push(`image path not found: ${raw.img}`);
    }
  }

  if (!adapted || typeof adapted !== 'object') {
    errors.push('adapter did not return a question object');
  } else {
    const bodyText = asArray(adapted.body).map(textFromBlock).join('').trim();
    if (!bodyText) {
      flags.emptyText = true;
      warnings.push('adapted question body has no text content');
    }
    if (!VALID_RENDER_TYPES.has(adapted.type)) {
      flags.unsupportedShape = true;
      warnings.push(`adapted question type may not render cleanly: ${String(adapted.type)}`);
    }
    if (['mcq', 'image_based', 'multi_select'].includes(adapted.type) && asArray(adapted.options).length < 2) {
      flags.emptyOptions = true;
      errors.push('adapted selectable question has fewer than 2 options');
    }
    if (!asArray(adapted.explanation).length) {
      flags.emptyExplanation = true;
      warnings.push('adapted question has no explanation');
    }
    for (const issue of answerIssues(adapted)) warnings.push(issue);
  }

  const status = errors.length ? 'failure' : warnings.length ? 'warning' : 'ok';
  return {
    key: `${packInfo.file}#${index}`,
    file: packInfo.file,
    subject: packInfo.subject,
    bucket: packInfo.bucket,
    index,
    id: String(raw?.id || `${packInfo.subject}_${packInfo.bucket}_${index + 1}`),
    rawType: raw?.type || null,
    adaptedType: adapted?.type || null,
    answerMode: adapted?.answer?.mode || null,
    status,
    errors,
    warnings,
    flags,
    imageStatuses,
    searchText: stripForSnippet(rawText, 700),
  };
}

function incrementFlag(totals, item) {
  if (item.status === 'failure') totals.failures += 1;
  else totals.successes += 1;
  if (item.status === 'warning') totals.warningQuestions += 1;
  for (const [flag, value] of Object.entries(item.flags)) {
    if (value) totals.flags[flag] = (totals.flags[flag] || 0) + 1;
  }
}

function addSample(samples, category, item, message) {
  if (!samples[category]) samples[category] = [];
  samples[category].push({
    file: item.file,
    id: item.id,
    index: item.index,
    message,
    snippet: item.searchText,
  });
}

function formatCount(value) {
  return String(value ?? 0);
}

function table(rows) {
  if (!rows.length) return '_None._';
  const widths = [];
  for (const row of rows) row.forEach((cell, index) => { widths[index] = Math.max(widths[index] || 0, String(cell).length); });
  return rows.map((row, rowIndex) => {
    const line = `| ${row.map((cell, index) => String(cell).padEnd(widths[index])).join(' | ')} |`;
    if (rowIndex === 0) {
      return `${line}\n| ${widths.map(width => '-'.repeat(width)).join(' | ')} |`;
    }
    return line;
  }).join('\n');
}

function sampleSection(title, samples, limit) {
  const clipped = samples.slice(0, limit);
  if (!clipped.length) return `### ${title}\n\n_None._\n`;
  const lines = clipped.map(sample => {
    const where = `${sample.file}#${sample.index + 1}${sample.id ? ` (${sample.id})` : ''}`;
    return `- ${where}: ${sample.message}${sample.snippet ? `\n  - Snippet: ${sample.snippet}` : ''}`;
  });
  return `### ${title}\n\n${lines.join('\n')}\n`;
}

function buildReport(result, reportPath, manifestPath, sampleLimit) {
  const packRows = [
    ['Pack', 'Questions', 'OK', 'Warnings', 'Failures', 'Images', 'Missing Images', 'HTML-like', 'Math-like', 'Mojibake'],
    ...result.packs.map(pack => [
      pack.file,
      formatCount(pack.questionCount),
      formatCount(pack.ok),
      formatCount(pack.warning),
      formatCount(pack.failure),
      formatCount(pack.flags.hasImage),
      formatCount(pack.flags.missingImage),
      formatCount(pack.flags.suspiciousHtml),
      formatCount(pack.flags.hasMath),
      formatCount(pack.flags.mojibake),
    ]),
  ];

  const flagRows = [
    ['Finding', 'Count'],
    ...Object.entries(result.totals.flags).sort((a, b) => b[1] - a[1]).map(([key, value]) => [key, value]),
  ];

  return `# Full Dataset Adapter Dry Run

Generated: ${result.generatedAt}

This is a read-only Stage 3.2 dry run. It scanned exported packs under \`${result.sourceRoot}\`, adapted questions through \`js/legacy_adapter.js\`, and wrote a dev preview manifest. It did not modify live question data or app behavior.

## Outputs

- Report: \`${reportPath}\`
- Dev preview manifest: \`${manifestPath}\`
- Dev visual preview page: \`dev/dataset_renderer_preview.html\`

## Totals

- Packs scanned: ${result.totals.packs}
- Questions scanned: ${result.totals.questions}
- Legacy-flat questions: ${result.totals.legacyQuestions}
- Adapter conversion successes: ${result.totals.successes}
- Adapter conversion failures: ${result.totals.failures}
- Questions with warnings: ${result.totals.warningQuestions}
- Empty packs: ${result.totals.emptyPacks}

## Finding Counts

${table(flagRows)}

## Pack Summary

${table(packRows)}

## Issue Samples

${sampleSection('Conversion Failures', result.samples.failures || [], sampleLimit)}

${sampleSection('Unsupported / Risky Shapes', result.samples.unsupportedShape || [], sampleLimit)}

${sampleSection('Missing Required Fields / Empty Render Surfaces', result.samples.missingFields || [], sampleLimit)}

${sampleSection('Suspicious HTML-Like Content That Must Stay Escaped', result.samples.html || [], sampleLimit)}

${sampleSection('Unsafe Script/Event-Like Content', result.samples.unsafeHtml || [], sampleLimit)}

${sampleSection('Image Path Issues', result.samples.images || [], sampleLimit)}

${sampleSection('Math / LaTeX-Looking Content', result.samples.math || [], Math.min(20, sampleLimit))}

${sampleSection('Mojibake-Looking Content', result.samples.mojibake || [], sampleLimit)}

## Notes

- HTML-like legacy content is expected in many explanations. The preview renderer currently escapes it as text via \`textContent\`; this report treats it as a migration risk to keep visible, not as permission to render HTML.
- Missing image paths are reported from filesystem checks relative to the repository root.
- Math/LaTeX-looking content is heuristic only.
- This stage did not change \`subject_data/\`, \`content/question-packs/\`, \`IMAGES/\`, or the live quiz flow.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packsRoot = path.resolve(REPO_ROOT, args.packsDir);
  const files = await walkJsonFiles(packsRoot);
  const result = {
    generatedAt: new Date().toISOString(),
    sourceRoot: args.packsDir.replace(/\\/g, '/'),
    totals: {
      packs: files.length,
      questions: 0,
      legacyQuestions: 0,
      successes: 0,
      failures: 0,
      warningQuestions: 0,
      emptyPacks: 0,
      flags: {},
    },
    packs: [],
    questions: [],
    samples: {},
  };

  for (const filePath of files) {
    const relFile = toRepoRelative(filePath);
    const rawText = await fs.readFile(filePath, 'utf8');
    const pack = JSON.parse(rawText);
    const questions = asArray(pack.questions);
    const packInfo = {
      file: relFile,
      subject: pack.subject || path.basename(path.dirname(filePath)),
      bucket: pack.bucket || path.basename(filePath, '.json'),
    };
    const packSummary = {
      ...packInfo,
      questionCount: questions.length,
      ok: 0,
      warning: 0,
      failure: 0,
      flags: {},
    };
    if (!questions.length) result.totals.emptyPacks += 1;

    questions.forEach((question, index) => {
      result.totals.questions += 1;
      if (isLegacyQuestion(question)) result.totals.legacyQuestions += 1;

      let adapted = null;
      let item;
      try {
        adapted = adaptLegacyQuestion(question, {
          subject: packInfo.subject,
          bucket: packInfo.bucket,
          index,
        }).question;
        item = inspectQuestion(question, adapted, packInfo, index);
      } catch (error) {
        item = inspectQuestion(question, null, packInfo, index);
        item.status = 'failure';
        item.errors.push(error?.message || String(error));
      }

      result.questions.push(item);
      packSummary[item.status] += 1;
      for (const [flag, value] of Object.entries(item.flags)) {
        if (value) packSummary.flags[flag] = (packSummary.flags[flag] || 0) + 1;
      }
      incrementFlag(result.totals, item);

      if (item.status === 'failure') addSample(result.samples, 'failures', item, item.errors.join('; '));
      if (item.flags.unsupportedShape) addSample(result.samples, 'unsupportedShape', item, item.warnings.concat(item.errors).join('; '));
      if (item.flags.emptyText || item.flags.emptyOptions || item.flags.emptyExplanation || item.warnings.some(warning => warning.includes('missing'))) {
        addSample(result.samples, 'missingFields', item, item.warnings.concat(item.errors).join('; '));
      }
      if (item.flags.suspiciousHtml) addSample(result.samples, 'html', item, item.warnings.find(warning => warning.includes('HTML-like')) || 'HTML-like content');
      if (item.flags.unsafeHtml) addSample(result.samples, 'unsafeHtml', item, item.warnings.find(warning => warning.includes('script')) || 'unsafe content');
      if (item.flags.missingImage) addSample(result.samples, 'images', item, item.warnings.find(warning => warning.includes('image path')) || 'missing image');
      if (item.flags.hasMath) addSample(result.samples, 'math', item, 'math/LaTeX-looking text found');
      if (item.flags.mojibake) addSample(result.samples, 'mojibake', item, 'mojibake-looking text found');
    });

    result.packs.push(packSummary);
  }

  const manifest = {
    generatedAt: result.generatedAt,
    sourceRoot: result.sourceRoot,
    totals: result.totals,
    packs: result.packs,
    questions: result.questions,
  };

  const reportPath = path.resolve(REPO_ROOT, args.report);
  const manifestPath = path.resolve(REPO_ROOT, args.manifest);
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(reportPath, buildReport(result, args.report, args.manifest, args.sampleLimit), 'utf8');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Full dataset adapter dry run complete.`);
  console.log(`Packs scanned: ${result.totals.packs}`);
  console.log(`Questions scanned: ${result.totals.questions}`);
  console.log(`Adapter conversion successes: ${result.totals.successes}`);
  console.log(`Adapter conversion failures: ${result.totals.failures}`);
  console.log(`Questions with warnings: ${result.totals.warningQuestions}`);
  console.log(`Report: ${args.report}`);
  console.log(`Manifest: ${args.manifest}`);
}

main().catch(error => {
  console.error(`ERROR: ${error?.message || error}`);
  process.exit(1);
});
