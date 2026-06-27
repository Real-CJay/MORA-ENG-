#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
claude_prompt_generator.py
==========================
Builds a prompt you paste into Claude so it answers your MCQ questions
and returns them as a ready-to-import JSON array for your quiz app.

HOW TO RUN (Windows terminal):
  python claude_prompt_generator.py
  (Always include the .py extension — Windows does not auto-find scripts otherwise)

Workflow:
  1. Run this script → answer the prompts → copy the output prompt
  2. Open a NEW Claude chat
  3. Attach your PDF (or paste questions when asked)
  4. Paste the prompt
  5. Claude replies with a JSON array
  6. Save the reply as  questions.json
  7. quiz_manager.py  →  Questions  →  Import from JSON
"""


# ── navigation signals ────────────────────────────────────────────────────────

import os
import shutil
import subprocess


class _Back(Exception):
    """Raised when the user types 'back' at any prompt."""

class _Exit(Exception):
    """Raised when the user types 'exit' at any prompt."""


def _raw_input(display_prompt: str) -> str:
    """Central input: intercepts 'back' and 'exit' anywhere."""
    val = input(display_prompt).strip()
    if val.lower() == "exit":
        raise _Exit
    if val.lower() == "back":
        raise _Back
    return val


# ── helpers ───────────────────────────────────────────────────────────────────

def banner(msg):
    w = max(len(msg) + 4, 66)
    print(f"\n\033[1;44m  {msg:<{w-4}}  \033[0m\n")

def section(msg):
    print(f"\n\033[96m{'─'*66}\033[0m\n  \033[1m{msg}\033[0m\n\033[96m{'─'*66}\033[0m")

def ask(prompt, default=None):
    suffix = f" [{default}]" if default is not None else ""
    val = _raw_input(f"  ? {prompt}{suffix}: ")
    return val if val else (str(default) if default is not None else "")

def choose(prompt, options):
    print()
    items = [o if isinstance(o, tuple) else (o, o) for o in options]
    for i, (label, _) in enumerate(items, 1):
        print(f"    {i}. {label}")
    print(f"    0. Quit")
    print()
    while True:
        raw = _raw_input(f"  ? {prompt}: ")
        if raw == "0":
            return None
        if raw.isdigit() and 1 <= int(raw) <= len(items):
            return items[int(raw)-1][1]
        print("  Invalid — try again.")


# ── Shared instruction blocks (not passed through .format() — inserted after) ─

def copy_to_clipboard(text: str):
    errors = []

    try:
        import pyperclip
        pyperclip.copy(text)
        return True, "pyperclip"
    except Exception as e:
        errors.append(f"pyperclip: {e}")

    clip_path = shutil.which("clip")
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
        except Exception as e:
            errors.append(f"clip.exe: {e}")

    powershell = shutil.which("powershell") or shutil.which("pwsh")
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
        except Exception as e:
            errors.append(f"Set-Clipboard: {e}")

    return False, "; ".join(errors) or "no clipboard backend found"


def build_math_rules(show_substitution: bool, show_simplification: bool) -> str:
    """Build the MATH_RULES block based on user preferences for calc step verbosity."""
    # Always show: formula and result. Substitution and simplification are optional.
    calc_steps = ["Formula"]
    if show_substitution:
        calc_steps.append("substitution")
    if show_simplification:
        calc_steps.append("simplification")
    calc_steps.append("result")
    calc_line = " → ".join(calc_steps)

    return f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATION ORDER — MANDATORY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Process questions ONE AT A TIME, in order:
    1. Work out the answer for question N (captured in the exp field).
    2. Immediately output the complete JSON object for question N.
    3. Only then move on to question N+1.

  STRICT PROHIBITIONS:
    • Do NOT read through all questions before writing any JSON.
    • Do NOT produce a "thinking" or "working" section before the JSON array.
    • Do NOT answer all (or multiple) questions first, then build the JSON.
    • Do NOT do any review, verification, or re-check pass after the closing ].

  The FIRST character of your response must be [
  The JSON array must grow question by question as you go.
  After you write the closing ] of the JSON array, STOP immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION QUALITY — STRICT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  • "exp" MUST contain a definitive, fully worked explanation.
  • DO NOT write phrases like "I think", "probably", "it seems",
    "the answer is likely", "one could argue", "checking the
    options", "let me verify", "upon inspection", or any other
    hedging/filler language. Work it out completely and state it
    with certainty.
  • For calculation questions: {calc_line}.
  • For conceptual questions: state clearly why the correct
    option is right. For wrong options, only explain ones a
    student would plausibly pick — skip obviously wrong distractors.
  • If a question is ambiguous, work from first principles
    to reach a definite conclusion — never leave the student
    with an uncertain explanation."""


# Default MATH_RULES (used as a fallback / for non-interactive contexts)
MATH_RULES = build_math_rules(show_substitution=True, show_simplification=True)


# ── Marking scheme instruction blocks ────────────────────────────────────────

MARKING_SCHEME_RULES = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MARKING SCHEME — AUTHORITATIVE ANSWERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  A marking scheme is attached alongside the question PDF.
  Treat the marking scheme as the authoritative source of correct
  answers. Use those answers directly — do not override them.

  Your job for each question:
    • Read the correct answer from the marking scheme.
    • Write a full, confident explanation for why that answer
      is correct, working from first principles.
    • Do NOT second-guess or override the marking scheme answer
      unless your working reveals a clear error (see below).

MARKING SCHEME ERRORS:
  Occasionally a marking scheme contains a wrong answer.
  If your working conclusively shows the marked answer is wrong:
    • Do NOT include that question in the main JSON array.
    • Add it to the DEFECTS block (after ====DEFECTS====) with:
        - Original question number, full question text, all options
          verbatim (plain text, no JSON).
        - Marked answer from the scheme.
        - Your computed correct answer.
        - One-line reason why the marked answer is wrong.
    • Separate each entry with a line of dashes.

  WHEN TO FLAG: If your working produces a result that contradicts
  the marking scheme AND you cannot identify a clear error in your
  own method, flag it as a defect. You do not need to know WHY the
  scheme is wrong — getting a different number is sufficient.
  Do NOT keep the question in the JSON and write a confused exp
  field. If you are uncertain, the question belongs in DEFECTS.
"""

MATH_RULES_SUFFIX = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEFECTIVE QUESTIONS — TWO-FILE OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  A question is defective if:
    (a) The mathematically correct answer does not appear among
        the given options (bad question), OR
    (b) A marking scheme is present and its stated answer is
        conclusively wrong (bad marking scheme).

  IMPORTANT: The question text and options are typed correctly —
  there are NO spelling or transcription mistakes in the source.
  Do not assume a typo explains why the correct answer is missing.
  If your working shows the answer is not among the options,
  the question itself is defective — flag it accordingly.

  RULE: Do NOT include defective questions in the main JSON array.
  Instead, after the closing ] of the JSON array, output a second
  block separated by this exact marker line:

  ====DEFECTS====

  For each defective question in the DEFECTS block:
    • Copy the question EXACTLY as it appeared in the source —
      original question number, full question text, and every
      option label and text verbatim (plain text, no JSON, no LaTeX
      reformatting — preserve the original wording character for
      character).
    • State the correct answer you computed.
    • If a marking scheme was present, also state what the scheme said.
    • Give a one-line reason for the defect.
    • Separate each entry with a line of dashes.

  Example DEFECTS block format:

  ====DEFECTS====
  Q14 (question 14 of 30)
  If f(x) = x² + 3x, find f'(2).
  (A) 5
  (B) 6
  (C) 9
  (D) 10
  Correct answer: 7
  Reason: f'(x) = 2x + 3, so f'(2) = 7 — not among the options.
  ────────────────────────────────────────────────────────────────

  If there are NO defective questions, output the JSON array only —
  do NOT print the ====DEFECTS==== marker at all.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL — EXP FIELD HTML FORMATTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The "exp" field is injected directly as raw HTML into a <div>.
Markdown syntax is NOT processed — use HTML tags instead:

  Bold text:        <strong>text</strong>      NEVER **text**
  Paragraph break:  <br><br>                   NEVER \\n\\n
  Inline math:      $...$                       (KaTeX ✓)
  Display math:     $$...$$                     (KaTeX ✓)

CRITICAL — EXP FIELD CONTENT:
  The "exp" field must contain ONLY the final, clean explanation.
  NEVER include any of the following inside "exp":
    • Working notes or self-corrections ("wait,", "re-checking,",
      "let me re-examine", "actually,", "on reflection,")
    • Contradictions or unresolved conflicts with the marking scheme
    • Multiple competing calculations showing different results
    • Any sign that you changed your mind mid-explanation
  If you catch yourself writing any of the above, STOP — that
  question belongs in ====DEFECTS====, not in the JSON array.

  WRONG (will show literal asterisks and no line breaks):
    "**Compute det(A):** ... result.\\n\\n**Statement I:** ..."

  CORRECT (bold and spacing render properly):
    "<strong>Compute $\\\\det(A)$:</strong> ... result.<br><br>
     <strong>Statement I:</strong> ..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL — LaTeX / KaTeX MATH FORMATTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The quiz app renders math with KaTeX. Follow every rule below exactly
or the student will see broken/raw text instead of formatted math.

DELIMITERS
  • Wrap EVERY mathematical expression in $...$
  • Use \\dfrac (display fraction, full-size) for ALL fractions.
    Never write  a/b  when a proper fraction is intended.
    Never use \\frac alone — always \\dfrac.
  • Use \\displaystyle\\sum, \\displaystyle\\int, \\displaystyle\\lim
    for sums, integrals, and limits so they render at full size.

UNICODE BAN — always use LaTeX, NEVER copy-paste Unicode symbols:
  ²  ³    →  ^2  ^3         ∞     →  \\infty
  →        →  \\to           ⇒    →  \\Rightarrow
  ≤  ≥    →  \\leq  \\geq   ≠    →  \\neq
  ∈  ∉    →  \\in  \\notin  ℝ    →  \\mathbb{R}
  √        →  \\sqrt{}        ×    →  \\times
  ∫  ∑  ∏  →  \\int \\sum \\prod

LESS-THAN / GREATER-THAN INSIDE MATH — VERY IMPORTANT:
  • NEVER write raw  <  or  >  inside a $...$ expression.
  • Always use  \\lt  and  \\gt  instead.
  • Correct:    $0 \\lt x \\lt 1$
  • Wrong:      $0 < x < 1$    ← breaks HTML rendering
  This rule applies in text, opts, and exp fields equally.

BACKSLASH ENCODING IN JSON:
  Inside a JSON string, every LaTeX backslash needs to be
  written as  \\\\  (two characters: backslash backslash).
  Example:  "\\\\dfrac{1}{2}"  →  \\dfrac{1}{2}  in LaTeX.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLES of correctly formatted output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Standalone fraction options:
  opts: ["$\\\\dfrac{1}{3}$", "$0$", "$1$", "$-\\\\infty$", "None of the above."]
  opts: ["$\\\\dfrac{2}{3}$", "$\\\\dfrac{3}{4}$", "$\\\\dfrac{1}{2}$", "Not integrable."]

Expression options:
  opts: [
    "$-x^2 + x\\\\ln\\\\left|\\\\dfrac{1+x}{1-x}\\\\right| + \\\\dfrac{1}{2}(1+x^2)\\\\ln(1-x^2)$",
    "$x^2 + x\\\\ln\\\\left|\\\\dfrac{1-x}{1+x}\\\\right| - \\\\dfrac{1}{2}(1+x^2)\\\\ln(1-x^2)$"
  ]

Explanation using HTML formatting + displaystyle + \\lt:
  exp: "<strong>Ratio Test:</strong> $\\\\displaystyle\\\\lim_{n\\\\to\\\\infty}\\\\dfrac{a_{n+1}}{a_n} = \\\\dfrac{(n+1)^2}{(2n+2)(2n+1)} = \\\\dfrac{1}{4} \\\\lt 1$, so the series converges absolutely."

  exp: "<strong>Uniform convergence:</strong> Since $f_n \\\\rightrightarrows x^2$ on $[0,1]$, interchange limit and integral: $\\\\displaystyle\\\\int_0^1 x^2\\\\,dx = \\\\dfrac{1}{3}$."

Multi-step explanation with paragraphs and display math:
  exp: "<strong>Compute $\\\\det(A)$:</strong> Expanding along row 1: $$\\\\det(A) = 2\\\\det\\\\begin{pmatrix}0&-2\\\\\\\\2&0\\\\end{pmatrix} = 2(0-(-4))=8.$$<br><br><strong>Statement I:</strong> Compute $A^{-1}$ via cofactors: $$A^{-1}=\\\\dfrac{1}{4}\\\\begin{pmatrix}-3&0&2\\\\\\\\0&-2&0\\\\\\\\2&0&0\\\\end{pmatrix}.$$ Verify $A\\\\cdot A^{-1}=I$. <strong>TRUE.</strong><br><br><strong>Answer:</strong> B (I and II only)."
"""

MATHS_FORMAT_EXAMPLE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — JSON array, no markdown fences:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[
  {"id": "IDPREFIX_Q1", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 0, "exp": "..."},
  {"id": "IDPREFIX_Q2", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 2, "exp": "..."}
]
"""

MATERIAL_FORMAT_EXAMPLE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — JSON array, no markdown fences:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[
  {"id": "IDPREFIX_Q1", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 1, "exp": "..."}
]
"""

MATHS_FORMAT_EXAMPLE_IMG = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — JSON array, no markdown fences:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[
  {"id": "IDPREFIX_Q1", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 0, "exp": "..."},
  {"id": "IDPREFIX_Q2", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "img": "IDPREFIX_FIG1.png", "imgAlt": "brief description of the figure",
   "opts": ["...", "..."], "ans": 1, "exp": "..."},
  {"id": "IDPREFIX_Q3", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "img": "IDPREFIX_FIG1.png", "imgAlt": "brief description of the figure",
   "opts": ["...", "..."], "ans": 2, "exp": "..."}
]

  Note: Q2 and Q3 above share the same figure — they both reference IDPREFIX_FIG1.png.
  Questions with no image omit the "img" and "imgAlt" fields entirely.
"""

MATERIAL_FORMAT_EXAMPLE_IMG = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — JSON array, no markdown fences:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[
  {"id": "IDPREFIX_Q1", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 1, "exp": "..."},
  {"id": "IDPREFIX_Q2", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "img": "IDPREFIX_FIG1.png", "imgAlt": "brief description of the figure",
   "opts": ["...", "..."], "ans": 0, "exp": "..."},
  {"id": "IDPREFIX_Q3", "unit": UNIT, "year": "YEARTAG",
   "text": "...", "img": "IDPREFIX_FIG1.png", "imgAlt": "brief description of the figure",
   "opts": ["...", "..."], "ans": 2, "exp": "..."}
]

  Note: Q2 and Q3 above share the same figure — they both reference IDPREFIX_FIG1.png.
  Questions with no image omit the "img" and "imgAlt" fields entirely.
"""

EXPLANATION_RULES_MATERIAL = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATION ORDER — MANDATORY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Process questions ONE AT A TIME, in order:
    1. Work out the answer for question N (captured in the exp field).
    2. Immediately output the complete JSON object for question N.
    3. Only then move on to question N+1.

  STRICT PROHIBITIONS:
    • Do NOT read through all questions before writing any JSON.
    • Do NOT produce a "thinking" or "working" section before the JSON array.
    • Do NOT answer all (or multiple) questions first, then build the JSON.
    • Do NOT do any review, verification, or re-check pass after the closing ].

  The FIRST character of your response must be [
  The JSON array must grow question by question as you go.
  After you write the closing ] of the JSON array, STOP immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION QUALITY — STRICT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  • "exp" MUST be a definitive, fully worked explanation.
  • DO NOT write "I think", "probably", "it seems", "likely",
    "checking the options", "let me verify", "upon inspection",
    or any hedging/filler language. State the answer with certainty.
  • For multi-statement questions (i)(ii)(iii):
    Evaluate each statement individually, then state which
    combination is correct and why.
  • For numerical questions: show the full calculation path.
  • Explain why the correct option is right. For wrong options,
    only explain ones a student would plausibly pick — skip
    obviously wrong distractors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION CONTEXT / SHARED PASSAGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  If the paper gives a passage, setup, data table, figure description,
  or instruction BEFORE one or more questions, include that shared
  context at the start of every affected question's "text" field.

  Example:
    Source says "Use the information below to answer questions 2 and 3"
    followed by a manometer description and Figure 1.
    Then Q2's text must start with that instruction/context, followed
    by the actual Q2 wording. Q3 must also include the same context.

  Do not put shared context only in imgAlt or exp. It must be visible
  before the question text in the app.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXP FIELD — HTML FORMATTING (not Markdown):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The exp field is injected as raw HTML. Use HTML, not Markdown:
    Bold:            <strong>text</strong>     NEVER **text**
    Paragraph break: <br><br>                  NEVER \\n\\n

EXP FIELD — CONTENT:
  The "exp" field must contain ONLY the final, clean explanation.
  NEVER include working notes, self-corrections, re-checks, or
  phrases like "wait,", "re-checking,", "actually,", or any sign
  you changed your mind mid-explanation. If you are uncertain,
  move the question to ====DEFECTS==== instead.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEFECTIVE QUESTIONS — TWO-FILE OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Sometimes the correct answer does not appear among the given
  options. These are defective questions.

  IMPORTANT: The question text and options are typed correctly —
  there are NO spelling or transcription mistakes in the source.
  Do not assume a typo explains a missing answer; flag it as
  a defective question instead.

  RULE: If the correct answer is NOT in the listed options,
  do NOT include that question in the main JSON array.
  Instead, after the closing ] of the JSON array, output a second
  block for the defects file, separated by this exact marker line:

  ====DEFECTS====

  For each defective question in the DEFECTS block:
    • Copy the question EXACTLY as it appeared in the source —
      original question number, full question text, and every
      option label and text verbatim (plain text, no JSON —
      preserve the original wording character for character).
    • State the correct answer you computed.
    • If a marking scheme was present, also state what the scheme said.
    • Give a one-line reason for the defect.
    • Separate each entry with a line of dashes.

  Example DEFECTS block format:

  ====DEFECTS====
  Q14 (question 14 of 30)
  If the bond energy of X-Y is 500 kJ/mol, which statement is true?
  (A) The bond is ionic.
  (B) The bond is covalent.
  (C) The bond length is 1.5 Å.
  (D) None of the above.
  Correct answer: Bond type cannot be determined from bond energy alone.
  Reason: None of A-D follow from bond energy alone; the question is defective.
  ────────────────────────────────────────────────────────────────

  If there are NO defective questions, output the JSON array only —
  do NOT print the ====DEFECTS==== marker at all.
"""


# ── Image instruction block ───────────────────────────────────────────────────

def build_image_rules(id_prefix: str, folder: str, bank: str) -> str:
    """
    Build the IMAGE_RULES block, embedding the correct save folder and
    richer per-figure metadata so the extractor script needs no manual input.

    folder  — full relative path from root, e.g. "IMAGES/CS/Past Papers/2024/"
    bank    — one of: past_unit | past_paper | hard | normal
    """

    # For unit-wise papers the unit number differs per question, so the folder
    # contains a UNIT placeholder that Claude must fill in per figure.
    if bank == "past_unit":
        folder_note = (
            f"  The save folder for each figure is:\n"
            f"    {folder}\n"
            f"  where <N> is the unit number of the question(s) that use that figure.\n"
            f"  If a shared figure is used by questions all in the same unit, use that\n"
            f"  unit number. If (rarely) they span units, output one entry per unit."
        )
        folder_example = folder  # e.g. "IMAGES/CS/Unit Wise Past Papers/Unit <N>/"
    else:
        folder_note = (
            f"  The save folder for every figure in this paper is:\n"
            f"    {folder}"
        )
        folder_example = folder

    return f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGES — QUESTIONS WITH FIGURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Some questions in this paper include a figure (flowchart, diagram,
  table, circuit, graph, etc.). For every such question:

  1. Add an "img" field with the filename for that figure.
  2. Add an "imgAlt" field with a short plain-English description
     of what the figure shows (used as alt text).
  3. Questions that have NO figure must NOT include "img" or "imgAlt".

FILENAME RULES:
  • For a figure that belongs to ONE question only:
      "img": "{id_prefix}_Q<number>.png"
    Example:  "img": "{id_prefix}_Q7.png"

  • For a figure that is SHARED by several questions
    (e.g. "refer to the flowchart above" appears in Q3, Q4 and Q5):
      Use a shared figure name:  "{id_prefix}_FIG<n>.png"
      where <n> counts shared figures from 1.
    Every question that references that same figure must carry the
    EXACT same filename — do NOT create separate copies.
    Example: Q3, Q4 and Q5 all get  "img": "{id_prefix}_FIG1.png"

IMAGES BLOCK — append at the bottom of your response, after the JSON:
  After the JSON array (and after ====DEFECTS==== if present),
  append the images block at the very bottom of your response.
  This is NOT a separate file — it is part of the same output.
  Separate it with this exact marker line:

  ====IMAGES====

  Output one entry per UNIQUE figure, using EXACTLY this format
  (every field on its own line, entries separated by ---):

  ====IMAGES====
  FILENAME    : {id_prefix}_FIG1.png
  PAGE        : 3
  QUESTIONS   : Q3, Q4, Q5
  UNIT        : 2
  FOLDER      : {folder_example}
  DESCRIPTION : flowchart of the selection sort algorithm
  ---
  FILENAME    : {id_prefix}_Q9.png
  PAGE        : 5
  QUESTIONS   : Q9
  UNIT        : 1
  FOLDER      : {folder_example}
  DESCRIPTION : truth table for a 3-input AND-OR gate
  ---

FIELD MEANINGS:
  FILENAME    — the exact filename used in the "img" field of the JSON.
  PAGE        — the actual PDF file page number (1-indexed from the very
                first page of the PDF file, counting every page including
                the cover page, blank pages, and instruction pages as page 1, 2, etc.).
                Do NOT use the printed page number from the footer (e.g. "Page 4 of 9").
                Count every physical page in the file from the beginning.
  QUESTIONS   — comma-separated list of question IDs that reference this figure.
  UNIT        — the unit number of the question(s) using this figure.
                For non-unit-wise banks (full past paper, target), write: N/A
  FOLDER      — the exact folder path where this image should be saved.
{folder_note}

  DESCRIPTION — one short sentence describing what the figure shows.

  If NO questions have images, do NOT output the ====IMAGES==== block at all.

IMPORTANT:
  • Do NOT include image info inside the ====DEFECTS==== block.
    Defective questions are listed in plain text only — no img fields.
  • The imgAlt value must be concise (one short sentence max).
  • Never invent an image for a question that has none in the source.
  • PAGE must be the physical PDF file page number, not the printed footer number.
    Example: if the PDF has a cover on page 1 and questions start on page 2,
    a figure on the page labelled "Page 3 of 9" in the footer is actually
    PDF page 4 — that is what you must write.
"""


# ── Folder path builder ───────────────────────────────────────────────────────

def _img_folder(module_name: str, bank: str, year_tag: str = "", hard_value: str = "") -> str:
    """
    Return the IMAGES save-folder for a given bank type.
    For past_unit the unit placeholder is left as 'Unit <N>' for Claude to fill.
    """
    subj = module_name.strip()
    if bank == "past_unit":
        return f"IMAGES/{subj}/Unit Wise Past Papers/Unit <N>/"
    if bank == "past_paper":
        year = year_tag.strip() or "Unknown"
        return f"IMAGES/{subj}/Past Papers/{year}/"
    if bank == "hard":
        return f"IMAGES/{subj}/Target/Hard/"
    if bank == "normal":
        return f"IMAGES/{subj}/Target/Normal/"
    # fallback
    return f"IMAGES/{subj}/"


# ── Prompt templates ──────────────────────────────────────────────────────────
# Note: these use simple string concatenation, NOT .format(), so LaTeX
# braces inside MATH_RULES / FORMAT_EXAMPLE don't need escaping.

def make_single_unit_maths(id_prefix, unit, year_tag, module_name, questions_block, math_rules=None, marking_scheme=False, has_images=False):
    if math_rules is None:
        math_rules = MATH_RULES
    ms_block  = MARKING_SCHEME_RULES if marking_scheme else ""
    img_block = build_image_rules(id_prefix, _img_folder(module_name, "past_unit"), "past_unit") if has_images else ""
    fmt       = MATHS_FORMAT_EXAMPLE_IMG if has_images else MATHS_FORMAT_EXAMPLE
    return (
        f"You are an expert tutor for the module: {module_name}.\n"
        f"I will give you MCQ questions from a past exam paper.\n\n"
        f"Your job:\n"
        f"  • Determine the CORRECT answer for every question with certainty.\n"
        f"  • Write a thorough, definitive explanation — no hedging, no guessing.\n"
        f"  • The question text and options contain NO typos or transcription errors —\n"
        f"    treat every word, symbol and number exactly as written.\n"
        f"  • Follow ALL formatting and output rules below strictly — no exceptions.\n"
        f"  • Output FILE 1 (JSON array) for every non-defective question.\n"
        f"  • Output FILE 2 (DEFECTS block) for any defective question — see rules below.\n"
        + (f"  • Append the ====IMAGES==== block at the bottom of your response — see rules below.\n" if has_images else "")
        + f"\nFIELD RULES:\n"
        f'  "id"    →  "{id_prefix}_Q<number>"\n'
        f'  "unit"  →  {unit}   (integer)\n'
        f'  "year"  →  "{year_tag}"   (string, exactly as shown)\n'
        f'  "text"  →  Question stem copied exactly. Use \\n for line breaks.\n'
        f'  "opts"  →  List of option texts only — no A/B/C/D labels.\n'
        f'  "ans"   →  0-based integer  (A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7).\n'
        f'  "exp"   →  Full, confident, step-by-step explanation.\n\n'
        f"  • Include EVERY non-defective question in the JSON. Do NOT skip any.\n"
        f"  • Start the JSON with [  and end it with ].\n"
        f"    No markdown fences. No other text before or between the two files.\n"
        + math_rules
        + ms_block
        + MATH_RULES_SUFFIX
        + img_block
        + fmt.replace("IDPREFIX", id_prefix)
             .replace("UNIT", str(unit))
             .replace("YEARTAG", year_tag)
        + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
          "Now answer every question below (or in the attached PDF):\n"
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        + questions_block
    )


def make_whole_batch_maths(id_prefix, year_tag, unit_map, module_name, questions_block, math_rules=None, marking_scheme=False, has_images=False):
    if math_rules is None:
        math_rules = MATH_RULES
    ms_block      = MARKING_SCHEME_RULES if marking_scheme else ""
    img_block     = build_image_rules(id_prefix, _img_folder(module_name, "past_unit"), "past_unit") if has_images else ""
    fmt           = MATHS_FORMAT_EXAMPLE_IMG if has_images else MATHS_FORMAT_EXAMPLE
    unit_map_block = "\n".join(f"  Unit {u} → {t}" for t, u in unit_map)
    units = unit_map
    ex1 = units[0][1] if units else 1
    ex2 = units[1][1] if len(units) > 1 else 2
    return (
        f"You are an expert tutor for the module: {module_name}.\n"
        f"I will give you MCQ questions from a past exam paper covering multiple topics.\n\n"
        f"Your job:\n"
        f"  • Determine the CORRECT answer for every question with certainty.\n"
        f"  • Write a thorough, definitive explanation — no hedging, no guessing.\n"
        f"  • The question text and options contain NO typos or transcription errors —\n"
        f"    treat every word, symbol and number exactly as written.\n"
        f"  • Follow ALL formatting and output rules below strictly — no exceptions.\n"
        f"  • Tag each question with the correct unit number using the map below.\n"
        f"  • Output FILE 1 (JSON array) for every non-defective question.\n"
        f"  • Output FILE 2 (DEFECTS block) for any defective question — see rules below.\n"
        + (f"  • Append the ====IMAGES==== block at the bottom of your response — see rules below.\n" if has_images else "")
        + f"\nTOPIC → UNIT MAP:\n{unit_map_block}\n\n"
        f"FIELD RULES:\n"
        f'  "id"    →  "{id_prefix}_Q<number>"\n'
        f'  "unit"  →  integer from the map (based on section heading in the paper)\n'
        f'  "year"  →  "{year_tag}"   (string, exactly as shown)\n'
        f'  "text"  →  Question stem copied exactly. Use \\n for line breaks.\n'
        f'  "opts"  →  List of option texts only — no A/B/C/D labels.\n'
        f'  "ans"   →  0-based integer  (A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7).\n'
        f'  "exp"   →  Full, confident, step-by-step explanation.\n\n'
        f"  • Include EVERY non-defective question in the JSON. Do NOT skip any.\n"
        f"  • Start the JSON with [  and end it with ].\n"
        f"    No markdown fences. No other text before or between the two files.\n"
        + math_rules
        + ms_block
        + MATH_RULES_SUFFIX
        + img_block
        + fmt.replace("IDPREFIX", id_prefix)
             .replace("UNIT", str(ex1))
             .replace("YEARTAG", year_tag)
        + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
          "Now answer every question below (or in the attached PDF):\n"
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        + questions_block
    )


def make_single_unit_material(id_prefix, unit, year_tag, module_name, questions_block, marking_scheme=False, has_images=False):
    ms_block  = MARKING_SCHEME_RULES if marking_scheme else ""
    img_block = build_image_rules(id_prefix, _img_folder(module_name, "past_unit"), "past_unit") if has_images else ""
    fmt       = MATERIAL_FORMAT_EXAMPLE_IMG if has_images else MATERIAL_FORMAT_EXAMPLE
    return (
        f"You are an expert tutor for the module: {module_name}.\n"
        f"I will give you MCQ questions from a past exam paper.\n\n"
        f"Your job:\n"
        f"  • Determine the CORRECT answer for every question with certainty.\n"
        f"  • Write a thorough, definitive explanation — no hedging, no guessing.\n"
        f"  • The question text and options contain NO typos or transcription errors —\n"
        f"    treat every word, symbol and number exactly as written.\n"
        f"  • Follow ALL formatting and output rules below strictly — no exceptions.\n"
        f"  • Output FILE 1 (JSON array) for every non-defective question.\n"
        f"  • Output FILE 2 (DEFECTS block) for any defective question — see rules below.\n"
        + (f"  • Append the ====IMAGES==== block at the bottom of your response — see rules below.\n" if has_images else "")
        + f"\nFIELD RULES:\n"
        f'  "id"    →  "{id_prefix}_Q<number>"\n'
        f'  "unit"  →  {unit}   (integer)\n'
        f'  "year"  →  "{year_tag}"   (string, exactly as shown)\n'
        f'  "text"  →  Question stem copied exactly.\n'
        f'             Use \\n for line breaks (e.g. for (i)(ii)(iii) sub-statements).\n'
        f'  "opts"  →  List of option texts only — no A/B/C/D labels.\n'
        f'  "ans"   →  0-based integer  (A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7).\n'
        f'  "exp"   →  Full, confident explanation. No hedging language.\n\n'
        f"  • Include EVERY non-defective question in the JSON. Do NOT skip any.\n"
        f"  • Start the JSON with [  and end it with ].\n"
        f"    No markdown fences. No other text before or between the two files.\n"
        + EXPLANATION_RULES_MATERIAL
        + ms_block
        + img_block
        + fmt.replace("IDPREFIX", id_prefix)
             .replace("UNIT", str(unit))
             .replace("YEARTAG", year_tag)
        + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
          "Now answer every question below (or in the attached PDF):\n"
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        + questions_block
    )


def make_whole_batch_material(id_prefix, year_tag, unit_map, module_name, questions_block, marking_scheme=False, has_images=False):
    ms_block      = MARKING_SCHEME_RULES if marking_scheme else ""
    img_block     = build_image_rules(id_prefix, _img_folder(module_name, "past_unit"), "past_unit") if has_images else ""
    fmt           = MATERIAL_FORMAT_EXAMPLE_IMG if has_images else MATERIAL_FORMAT_EXAMPLE
    unit_map_block = "\n".join(f"  Unit {u} → {t}" for t, u in unit_map)
    return (
        f"You are an expert tutor for the module: {module_name}.\n"
        f"I will give you MCQ questions from a past exam paper covering multiple topics.\n\n"
        f"Your job:\n"
        f"  • Determine the CORRECT answer for every question with certainty.\n"
        f"  • Write a thorough, definitive explanation — no hedging, no guessing.\n"
        f"  • The question text and options contain NO typos or transcription errors —\n"
        f"    treat every word, symbol and number exactly as written.\n"
        f"  • Follow ALL formatting and output rules below strictly — no exceptions.\n"
        f"  • Tag each question with the correct unit number using the map below.\n"
        f"  • Output FILE 1 (JSON array) for every non-defective question.\n"
        f"  • Output FILE 2 (DEFECTS block) for any defective question — see rules below.\n"
        + (f"  • Append the ====IMAGES==== block at the bottom of your response — see rules below.\n" if has_images else "")
        + f"\nTOPIC → UNIT MAP:\n{unit_map_block}\n\n"
        f"FIELD RULES:\n"
        f'  "id"    →  "{id_prefix}_Q<number>"\n'
        f'  "unit"  →  integer from the map (based on section heading in the paper)\n'
        f'  "year"  →  "{year_tag}"   (string, exactly as shown)\n'
        f'  "text"  →  Question stem copied exactly.\n'
        f'             Use \\n for line breaks.\n'
        f'  "opts"  →  List of option texts only — no A/B/C/D labels.\n'
        f'  "ans"   →  0-based integer  (A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7).\n'
        f'  "exp"   →  Full, confident explanation. No hedging language.\n\n'
        f"  • Include EVERY non-defective question in the JSON. Do NOT skip any.\n"
        f"  • Start the JSON with [  and end it with ].\n"
        f"    No markdown fences. No other text before or between the two files.\n"
        + EXPLANATION_RULES_MATERIAL
        + ms_block
        + img_block
        + fmt.replace("IDPREFIX", id_prefix)
             .replace("UNIT", str(unit_map[0][1] if unit_map else 1))
             .replace("YEARTAG", year_tag)
        + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
          "Now answer every question below (or in the attached PDF):\n"
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        + questions_block
    )


def make_target(id_prefix, hard_value, module_name, questions_block, math_rules=None, marking_scheme=False, has_images=False):
    if math_rules is None:
        math_rules = MATH_RULES
    ms_block  = MARKING_SCHEME_RULES if marking_scheme else ""
    _bank     = "hard" if hard_value == "true" else "normal"
    img_block = build_image_rules(id_prefix, _img_folder(module_name, _bank), _bank) if has_images else ""
    return (
        f"You are an expert tutor for the module: {module_name}.\n"
        f"I will give you MCQ questions from a quiz bank.\n\n"
        f"Your job:\n"
        f"  • Determine the CORRECT answer for every question with certainty.\n"
        f"  • Write a thorough, definitive explanation — no hedging, no guessing.\n"
        f"  • The question text and options contain NO typos or transcription errors —\n"
        f"    treat every word, symbol and number exactly as written.\n"
        f"  • Follow ALL formatting and output rules below strictly — no exceptions.\n"
        f"  • Output FILE 1 (JSON array) for every non-defective question.\n"
        f"  • Output FILE 2 (DEFECTS block) for any defective question — see rules below.\n"
        + (f"  • Append the ====IMAGES==== block at the bottom of your response — see rules below.\n" if has_images else "")
        + f"\nFIELD RULES:\n"
        f'  "id"    →  "{id_prefix}_Q<number>"\n'
        f'  "hard"  →  {hard_value}\n'
        f'  "text"  →  Question stem copied exactly. Use \\n for line breaks.\n'
        f'  "opts"  →  List of option texts only — no A/B/C/D labels.\n'
        f'  "ans"   →  0-based integer  (A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7).\n'
        f'  "exp"   →  Full, confident, step-by-step explanation.\n\n'
        f"  • Include EVERY non-defective question in the JSON. Do NOT skip any.\n"
        f"  • Start the JSON with [  and end it with ].\n"
        f"    No markdown fences. No other text before or between the two files.\n"
        + math_rules
        + ms_block
        + MATH_RULES_SUFFIX
        + img_block
        + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
          "Now answer every question below:\n"
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        + questions_block
    )


def make_full_past_paper(year_tag, module_name, questions_block, marking_scheme=False, has_images=False):
    """Prompt for a full past paper — no unit field, grouped by year."""
    ms_block  = MARKING_SCHEME_RULES if marking_scheme else ""
    _pfx      = f"pp_{year_tag.replace(' ', '_')}"
    img_block = build_image_rules(_pfx, _img_folder(module_name, "past_paper", year_tag), "past_paper") if has_images else ""
    fmt_example = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — JSON array, no markdown fences:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[
  {"id": "Q1", "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 0, "exp": "..."},
  {"id": "Q2", "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 1, "exp": "..."}
]
""".replace("YEARTAG", year_tag)
    if has_images:
        fmt_example = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — JSON array, no markdown fences:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[
  {"id": "Q1", "year": "YEARTAG",
   "text": "...", "opts": ["...", "..."], "ans": 0, "exp": "..."},
  {"id": "Q2", "year": "YEARTAG",
   "text": "...", "img": "pp_YEARSLUG_FIG1.png", "imgAlt": "brief description",
   "opts": ["...", "..."], "ans": 1, "exp": "..."}
]

  Questions with no image omit "img" and "imgAlt" entirely.
""".replace("YEARTAG", year_tag).replace("YEARSLUG", year_tag.replace(" ", "_"))
    return (
        f"You are an expert tutor for the module: {module_name}.\n"
        f"I will give you MCQ questions from a full past exam paper.\n\n"
        f"Your job:\n"
        f"  • Determine the CORRECT answer for every question with certainty.\n"
        f"  • Write a thorough, definitive explanation — no hedging, no guessing.\n"
        f"  • The question text and options contain NO typos or transcription errors —\n"
        f"    treat every word, symbol and number exactly as written.\n"
        f"  • Follow ALL formatting and output rules below strictly — no exceptions.\n"
        f"  • Output FILE 1 (JSON array) for every non-defective question.\n"
        f"  • Output FILE 2 (DEFECTS block) for any defective question — see rules below.\n"
        + (f"  • Append the ====IMAGES==== block at the bottom of your response — see rules below.\n" if has_images else "")
        + f"\nFIELD RULES:\n"
        f'  "id"    →  Use the original question number from the paper: "Q<number>"\n'
        f'  "year"  →  "{year_tag}"   (string, exactly as shown)\n'
        f'  "text"  →  Question stem copied exactly.\n'
        f'             Use \\n for line breaks.\n'
        f'  "opts"  →  List of option texts only — no A/B/C/D labels.\n'
        f'  "ans"   →  0-based integer  (A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7).\n'
        f'  "exp"   →  Full, confident explanation. No hedging language.\n'
        f"  • Do NOT include a \"unit\" field — this is a full past paper.\n"
        f"  • Include EVERY non-defective question in the JSON. Do NOT skip any.\n"
        f"  • Start the JSON with [  and end it with ].\n"
        f"    No markdown fences. No other text before or between the two files.\n"
        + EXPLANATION_RULES_MATERIAL
        + ms_block
        + img_block
        + fmt_example
        + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
          "Now answer every question below (or in the attached PDF):\n"
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        + questions_block
    )


# ── Build prompt (dispatcher) ─────────────────────────────────────────────────

def build_prompt(cfg):
    bank           = cfg["bank"]
    subject        = cfg.get("subject", "maths")
    whole          = cfg.get("whole_batch", False)
    qb             = cfg["questions_block"]
    module_name    = cfg.get("module_name", "")
    math_rules     = cfg.get("math_rules", MATH_RULES)
    marking_scheme = cfg.get("marking_scheme", False)
    has_images     = cfg.get("has_images", False)

    if bank in ("hard", "normal"):
        return make_target(cfg["id_prefix"], "true" if bank == "hard" else "false", module_name, qb, math_rules, marking_scheme, has_images)

    if bank == "past_paper":
        return make_full_past_paper(cfg["year_tag"], module_name, qb, marking_scheme, has_images)

    # past (unit-wise) path
    if subject == "maths":
        if not whole:
            return make_single_unit_maths(cfg["id_prefix"], cfg["unit"], cfg["year_tag"], module_name, qb, math_rules, marking_scheme, has_images)
        return make_whole_batch_maths(cfg["id_prefix"], cfg["year_tag"], cfg["unit_map"], module_name, qb, math_rules, marking_scheme, has_images)

    # material / general
    if not whole:
        return make_single_unit_material(cfg["id_prefix"], cfg["unit"], cfg["year_tag"], module_name, qb, marking_scheme, has_images)
    return make_whole_batch_material(cfg["id_prefix"], cfg["year_tag"], cfg["unit_map"], module_name, qb, marking_scheme, has_images)


# ── main ──────────────────────────────────────────────────────────────────────


# ── step-machine main ────────────────────────────────────────────────────────
#
# Each wizard step is a small function that returns its result.
# Results are stored in a list indexed by step number.
# Typing 'back' raises _Back, which the loop catches to decrement the
# step counter by 1 — no restart, no replay.

def _step_module_name():
    section("Step 1 — Module name")
    print("  Enter the name of your module exactly as it appears in your quiz app.")
    print("  Examples:  Mathematics  |  Material Science  |  Chemistry  |  Physics\n")
    while True:
        name = _raw_input("  ? Module name: ")
        if name:
            return name
        print("  Module name cannot be blank — try again.")


def _step_subject(module_name):
    _maths_keywords = {
        "math", "maths", "mathematics", "calculus", "algebra", "analysis",
        "statistics", "stat", "probability", "engineering", "mechanics",
        "dynamics", "statics", "signals", "circuits", "thermodynamics",
        "fluid", "numerical", "computation", "differential", "linear",
        "discrete", "logic", "physics", "electromagnetic",
    }
    _lower = module_name.lower()
    subject = "maths" if any(kw in _lower for kw in _maths_keywords) else "material"
    _label = "Mathematics (KaTeX math formatting enabled)" if subject == "maths" \
             else "General / non-math (plain text formatting)"
    print(f"\n  Detected type: {_label}")
    override = _raw_input("  Is this correct? [Y/n]: ").lower()
    if override in ("n", "no"):
        flip = choose("Choose formatting type", [
            ("Mathematics / Engineering  (KaTeX math formatting)", "maths"),
            ("General / non-math  (plain text formatting)",        "material"),
        ])
        if flip is None:
            return None
        subject = flip
    return subject


def _step_calc_detail(subject):
    """Ask user how much detail they want in calculation explanations (maths only)."""
    if subject != "maths":
        return None  # skip for non-math subjects
    section("Step 1b — Calculation explanation detail")
    print("  For calculation questions the formula and final result are always shown.")
    print("  You can also include intermediate working steps.\n")

    sub_raw  = _raw_input("  ? Show substitution step? [Y/n]: ").strip().lower()
    show_sub = sub_raw not in ("n", "no")

    simp_raw  = _raw_input("  ? Show simplification steps? [Y/n]: ").strip().lower()
    show_simp = simp_raw not in ("n", "no")

    return build_math_rules(show_substitution=show_sub, show_simplification=show_simp)


def _step_bank():
    section("Step 2 — Question bank")
    return choose("Bank", [
        ("Unit-wise Past Paper  (questions grouped by unit + year)", "past"),
        ("Full Past Paper       (whole exam paper, grouped by year)", "past_paper"),
        ("Target Quiz — Hard   (hard: true)",                        "hard"),
        ("Target Quiz — Normal (hard: false)",                       "normal"),
    ])


def _step_mode():
    section("Step 3 — Single topic or whole batch?")
    return choose("Mode", [
        ("Single topic / unit  — all questions belong to ONE unit", "single"),
        ("Whole batch          — paper covers multiple topics/units", "batch"),
    ])


def _step_year():
    section("Step 4 — Year & Batch code")
    year  = ask("Exam year (e.g. 2023)", "2023")
    batch = ask("Batch/semester code (e.g. 22) — leave blank if none", "")
    return f"{year} Batch {batch}" if batch else year


def _step_single_unit():
    """Ask for a single unit number (single-topic mode)."""
    return ask("Unit number for all these questions", "1")


def _step_topic(counter):
    """Ask for one topic name; empty = done."""
    val = _raw_input(f"    Topic {counter} name (blank = done): ")
    return val  # may be empty string


def _step_topic_unit(topic, counter):
    """Ask for the unit number for a named topic."""
    return ask(f"    Unit number for '{topic}'", counter)


def _step_id_prefix(bank, module_name, whole_batch, unit, year_tag, step_n):
    section(f"Step {step_n} — ID prefix")
    print("  Used at the start of every question ID.")
    print("  Examples:  math_b22_2023  |  mat_crys_u2  |  chem_b24\n")
    _slug = "_".join(module_name.lower().split())[:12]
    if whole_batch:
        default_prefix = f"{_slug}_{year_tag.replace(' ', '_')}"
    elif bank == "past":
        default_prefix = f"{_slug}_u{unit}_{year_tag.replace(' ', '_')}"
    else:
        default_prefix = f"{_slug}_{'hard' if bank == 'hard' else 'norm'}"
    return ask("ID prefix", default_prefix)


def _step_questions(step_n2):
    section(f"Step {step_n2} — How will you give Claude the questions?")
    embed = choose("Method", [
        ("Attach the PDF directly in the Claude chat  ← recommended", "pdf"),
        ("Paste questions here — embed them in the prompt",            "paste"),
    ])
    return embed


def _step_paste():
    print("\n  Paste your questions now.")
    print("  Type  END  on its own line when finished.\n")
    lines = []
    while True:
        line = _raw_input("")
        if line.strip().upper() == "END":
            break
        lines.append(line)
    return "\n".join(lines)



def _step_marking_scheme(bank="past"):
    section("Step — Answers provided?")
    if bank in ("hard", "normal"):
        print("  Does your Q&A file already contain the correct answers?\n")
        prompt_text = "  ? Answers already in the file? [y/N]: "
    else:
        print("  Is a marking scheme PDF also attached alongside the question paper?\n")
        prompt_text = "  ? Marking scheme attached? [y/N]: "
    raw = _raw_input(prompt_text).strip().lower()
    return raw in ("y", "yes")


def _step_has_images():
    section("Step — Images / figures in the questions?")
    print("  Does this paper include any figures that questions refer to?")
    print("  (flowcharts, diagrams, circuit diagrams, graphs, tables, etc.)\n")
    raw = _raw_input("  ? Questions include figures? [y/N]: ").strip().lower()
    return raw in ("y", "yes")


def _collect_batch_topics():
    """
    Interactively collect topic/unit pairs for whole-batch mode.
    Each topic name and each unit number is its own back-able micro-step.
    Returns a list of (topic, unit_int) pairs.
    """
    print("\n  Enter each topic section and its unit number.")
    print("  Match unit numbers already in your quiz app.")
    print("  Type the topic name and press Enter; leave blank when done.\n")

    # entries[i] = {"topic": str, "unit": str}
    entries = []
    i = 0   # which entry we're currently filling

    while True:
        e = entries[i] if i < len(entries) else {}

        # ── Ask topic name ────────────────────────────────────────────────
        try:
            topic = _raw_input(f"    Topic {i+1} name (blank = done): ")
        except _Back:
            if i > 0:
                # Go back to the unit question of the previous entry
                entries = entries[:i]   # discard current (incomplete) entry
                i -= 1
                # Re-ask unit for entry i
                prev = entries[i]
                print(f"\n  \033[93m← Going back…\033[0m\n")
                try:
                    u = _raw_input(f"  ?     Unit number for '{prev['topic']}' [{i+1}]: ")
                    prev["unit"] = u if u else str(i + 1)
                    entries[i] = prev
                    i += 1   # now move forward to ask next topic
                except _Back:
                    # back again from unit → go to topic of same entry
                    entries = entries[:i]
                    print(f"\n  \033[93m← Going back…\033[0m\n")
                    # loop will re-ask topic i
                continue
            else:
                raise   # propagate to outer step-machine (back past this section)

        if topic == "":
            # User is done entering topics
            break

        # ── Ask unit number ───────────────────────────────────────────────
        try:
            u = _raw_input(f"  ?     Unit number for '{topic}' [{i+1}]: ")
            unit = u if u else str(i + 1)
        except _Back:
            # back from unit → re-ask the topic name we just entered
            print(f"\n  \033[93m← Going back…\033[0m\n")
            # don't advance i; loop will re-ask topic i
            continue

        # Commit this entry
        if i < len(entries):
            entries[i] = {"topic": topic, "unit": unit}
        else:
            entries.append({"topic": topic, "unit": unit})
        i += 1

    return [(e["topic"], int(e["unit"])) for e in entries]


def main():
    banner("CLAUDE PROMPT GENERATOR  (answer-generation mode)")
    print("  Builds a prompt so Claude answers your MCQ questions")
    print("  and returns them as quiz-app JSON.\n")
    print("  Windows tip: run as  python claude_prompt_generator.py\n")
    print("  Type  back  at any prompt to undo the previous answer.")
    print("  Type  exit  at any prompt to quit.\n")

    R = {}

    def run_module_name(R):
        return _step_module_name()

    def run_subject(R):
        return _step_subject(R["module_name"])

    def run_bank(R):
        return _step_bank()

    def run_mode(R):
        if R["bank"] != "past":
            return None
        return _step_mode()

    def run_year(R):
        if R["bank"] not in ("past", "past_paper"):
            return None
        return _step_year()

    def run_unit_section(R):
        bank = R["bank"]
        mode = R.get("mode")
        if bank == "past_paper":
            # Full past paper — no unit grouping needed
            return ("skip", "1", [])
        if bank != "past":
            return ("skip", "1", [])
        if mode == "single":
            unit = ask("Unit number for all these questions", "1")
            return ("single", unit, [])
        # batch
        unit_map = _collect_batch_topics()
        if not unit_map:
            print("  No topics entered — switching to single-unit mode.")
            unit = ask("Unit number", "1")
            return ("single", unit, [])
        return ("batch", "1", unit_map)

    def run_id_prefix(R):
        kind, unit, unit_map = R["unit_section"]
        whole_batch = (kind == "batch")
        step_n = "5" if R["bank"] == "past" else "3"
        return _step_id_prefix(
            R["bank"], R["module_name"], whole_batch, unit,
            R["year_tag"] or "", step_n)

    def run_embed(R):
        kind, unit, _ = R["unit_section"]
        step_n = "5" if R["bank"] == "past" else "3"
        step_n2 = str(int(step_n) + 1)
        return _step_questions(step_n2)

    def run_paste(R):
        if R["embed"] != "paste":
            return None
        return _step_paste()

    def run_calc_detail(R):
        return _step_calc_detail(R["subject"])

    def run_marking_scheme(R):
        return _step_marking_scheme(R["bank"])

    def run_has_images(R):
        return _step_has_images()

    STEPS = [
        ("module_name",     run_module_name),
        ("subject",         run_subject),
        ("calc_detail",     run_calc_detail),
        ("bank",            run_bank),
        ("mode",            run_mode),
        ("year_tag",        run_year),
        ("unit_section",    run_unit_section),
        ("id_prefix",       run_id_prefix),
        ("marking_scheme",  run_marking_scheme),
        ("has_images",      run_has_images),
        ("embed",           run_embed),
        ("pasted",          run_paste),
    ]

    SKIP_NONE = {"mode", "year_tag", "pasted", "unit_section", "calc_detail", "marking_scheme", "has_images"}

    # Steps that may auto-skip (return without user input) depending on context.
    # We detect a real skip by checking if the stored value is None or a
    # sentinel "skip" tuple — meaning the step ran but asked nothing.
    def _was_auto_skipped(key):
        val = R.get(key)
        if val is None:
            return True
        # unit_section returns ("skip", ...) when no unit input was needed
        if isinstance(val, tuple) and val[0] == "skip":
            return True
        return False

    i = 0
    while i < len(STEPS):
        key, runner = STEPS[i]
        try:
            val = runner(R)
            if val is None and key not in SKIP_NONE:
                return   # user chose 0 / quit on a required step
            R[key] = val
            i += 1
        except _Back:
            if i > 0:
                # Decrement past the current step, then keep decrementing
                # over any steps that auto-skipped (stored nothing or a
                # sentinel) until we reach a step that asked the user.
                i -= 1
                while i > 0 and _was_auto_skipped(STEPS[i][0]):
                    R.pop(STEPS[i][0], None)
                    i -= 1
                prev_key = STEPS[i][0]
                R.pop(prev_key, None)
                print(f"\n  \033[93m← Going back…\033[0m\n")
            else:
                print("  Already at the first question — nothing to go back to.")

    # ── Unpack results ────────────────────────────────────────────────────────
    module_name = R["module_name"]
    subject     = R["subject"]
    bank        = R["bank"]
    year_tag    = R["year_tag"] or ""
    kind, unit, unit_map = R["unit_section"]
    whole_batch = (kind == "batch")
    id_prefix   = R["id_prefix"]
    embed       = R["embed"]

    if embed == "paste":
        questions_block = R["pasted"]
    else:
        if whole_batch:
            questions_block = (
                "[All questions are in the attached PDF. "
                "Process every question, assigning the unit number "
                "from the topic section heading it appears under.]"
            )
        else:
            questions_block = (
                "[Questions are in the attached PDF — process every question you find.]"
            )

    cfg = {
        "bank":            bank,
        "subject":         subject,
        "module_name":     module_name,
        "unit":            unit,
        "year_tag":        year_tag,
        "math_rules":      R.get("calc_detail") or MATH_RULES,
        "id_prefix":       id_prefix,
        "whole_batch":     whole_batch,
        "unit_map":        unit_map,
        "questions_block": questions_block,
        "marking_scheme":  R.get("marking_scheme", False),
        "has_images":      R.get("has_images", False),
    }

    prompt = build_prompt(cfg)

    # ── Output ────────────────────────────────────────────────────────────────
    section("YOUR PROMPT  — copy everything between the lines")
    print("\n" + "═"*66)
    print(prompt)
    print("═"*66)

    # Clipboard
    copied, backend = copy_to_clipboard(prompt)
    if copied:
        print(f"\n  \033[92m✓ Prompt copied to clipboard via {backend} — just paste it into Claude.\033[0m")
    else:
        print("\n  \033[93m⚠ Could not copy to clipboard automatically.\033[0m")
        print(f"  \033[2mReason: {backend}\033[0m")

    # ── Optional save ─────────────────────────────────────────────────────────
    save = ask("\nSave prompt to a .txt file? (path or blank to skip)", "")
    if save:
        if not save.endswith(".txt"):
            save += ".txt"
        try:
            with open(save, "w", encoding="utf-8") as f:
                f.write(prompt)
            print(f"\n  ✓ Saved to {save}")
        except Exception as e:
            print(f"\n  ✗ Could not save: {e}")

    marking_scheme = R.get("marking_scheme", False)
    has_images     = R.get("has_images", False)

    # ── Next steps ────────────────────────────────────────────────────────────
    if embed == "pdf":
        if marking_scheme:
            steps = [
                "1. Open a NEW Claude chat",
                "2. Attach the QUESTION PDF",
                "3. Also attach the MARKING SCHEME PDF",
                "4. Paste the prompt (already in your clipboard)",
            ]
        else:
            steps = [
                "1. Open a NEW Claude chat",
                "2. Attach your PDF",
                "3. Paste the prompt (already in your clipboard)",
            ]
    else:
        steps = [
            "1. Open a NEW Claude chat",
            "2. Paste the prompt (already in your clipboard)",
        ]
    steps += [
        "── Claude's output:",
        "  Save Claude's FULL response as a .json file",
        "  Save it in the AI exports folder",
    ]
    if has_images:
        steps += [
            "── Images:",
            "  Run pdf_image_extractor.py (or continue below)",
            "  It will crop and save all figures automatically",
        ]
    steps += [
        "── Importing:",
        "  quiz_manager.py → Questions → Import from JSON",
        "  Choose the correct bank type",
        "  Review defects if any were flagged",
    ]

    print(f"""
  ┌─ NEXT STEPS ──────────────────────────────────────────────────┐
  │                                                               │""")
    for s in steps:
        pad = max(0, 53 - len(s))
        print(f"  │    {s}{' '*pad}│")
    print(f"""  │                                                               │
  └───────────────────────────────────────────────────────────────┘
""")

    # ── Launch extractor ──────────────────────────────────────────────────────
    if has_images:
        print("  \033[96mThis paper has images.\033[0m")
        print("  When you're ready (after saving Claude's output as a .json file),")
        print("  the image extractor can run now.\n")
        try:
            launch = _raw_input("  Run image extractor now? [Y/n]: ").strip().lower()
        except (_Back, _Exit):
            launch = "n"
        if launch in ("", "y", "yes"):
            import importlib.util
            import os as _os
            _extractor_path = _os.path.join(
                _os.path.dirname(_os.path.abspath(__file__)),
                "pdf_image_extractor.py"
            )
            try:
                spec   = importlib.util.spec_from_file_location("pdf_image_extractor", _extractor_path)
                extmod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(extmod)
                extmod.run_extractor()
            except FileNotFoundError:
                print("\n  \033[91m✗ pdf_image_extractor.py not found in the same folder.\033[0m")
                print("  Run it separately: python pdf_image_extractor.py\n")
            except Exception as exc:
                print(f"\n  \033[91m✗ Could not launch extractor: {exc}\033[0m")
                print("  Run it separately: python pdf_image_extractor.py\n")


if __name__ == "__main__":
    try:
        main()
    except _Exit:
        print("\n  Exiting. Goodbye!\n")
