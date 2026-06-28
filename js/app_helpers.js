// app_helpers.js - Pure helpers shared by classic app scripts.
(function () {
  'use strict';

  const helpers = window.MoraHelpers = window.MoraHelpers || {};

  const MOJIBAKE_CP1252_BYTES = new Map([
    [0x20AC, 0x80], [0x201A, 0x82], [0x0192, 0x83], [0x201E, 0x84],
    [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02C6, 0x88],
    [0x2030, 0x89], [0x0160, 0x8A], [0x2039, 0x8B], [0x0152, 0x8C],
    [0x017D, 0x8E], [0x2018, 0x91], [0x2019, 0x92], [0x201C, 0x93],
    [0x201D, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
    [0x02DC, 0x98], [0x2122, 0x99], [0x0161, 0x9A], [0x203A, 0x9B],
    [0x0153, 0x9C], [0x017E, 0x9E], [0x0178, 0x9F]
  ]);
  const MOJIBAKE_PATTERN = /[\u00C3\u00C2\u00E2\u00F0][\u0080-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]*/g;
  const MOJIBAKE_DECODER = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: false }) : null;

  function decodeMojibakeSegment(segment) {
    if (!MOJIBAKE_DECODER) return segment;
    const bytes = [];
    for (const ch of segment) {
      const cp = ch.codePointAt(0);
      if (cp <= 255) bytes.push(cp);
      else if (MOJIBAKE_CP1252_BYTES.has(cp)) bytes.push(MOJIBAKE_CP1252_BYTES.get(cp));
      else return segment;
    }
    const decoded = MOJIBAKE_DECODER.decode(new Uint8Array(bytes));
    return decoded.includes('\uFFFD') ? segment : decoded;
  }

  function cleanDisplayText(value) {
    let text = String(value ?? '');
    for (let i = 0; i < 6; i++) {
      const next = text.replace(MOJIBAKE_PATTERN, decodeMojibakeSegment);
      if (next === text) break;
      text = next;
    }
    return text
      .replace(/\uFFFD/g, '')
      .replace(/\u00F0\u0178[\u0080-\uFFFF]{0,3}/g, '')
      .replace(/\u00C3[\u0080-\uFFFF]?/g, '')
      .replace(/\u00C2(?=\s|$|[.,;:!?])/g, '')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ');
  }

  function normalizePlainMathText(text) {
    text = cleanDisplayText(text);
    if (text.includes('$')) return text;
    const sup = {
      '\u207B': '-', '\u207A': '+', '\u2070': '0',
      '\u00B9': '1', '\u00B2': '2', '\u00B3': '3',
      '\u2074': '4', '\u2075': '5', '\u2076': '6',
      '\u2077': '7', '\u2078': '8', '\u2079': '9'
    };
    let t = text
      .replace(/[\u207B\u207A\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079]+/g, m => {
        const converted = [...m].map(ch => sup[ch]).join('');
        return converted ? '^{' + converted + '}' : m;
      })
      .replace(/\u2212/g, '-')
      .replace(/\u2260/g, '\\neq ')
      .replace(/\u2264/g, '\\le ')
      .replace(/\u2265/g, '\\ge ');

    const piecewise = t.match(/^f\(z\)\s*=\s*\((.+)\)\/\((.+)\)\s+for\s+z\\neq\s*0,\s*0\s+for\s+z=0\.\s*(.*)$/);
    if (piecewise) {
      return `$f(z)=\\dfrac{${piecewise[1]}}{${piecewise[2]}}\\text{ for }z\\neq 0,\\quad f(0)=0.$ ${piecewise[3]}`;
    }
    t = t.replace(/\^\{\}/g, '');
    if (looksLikeStandaloneFormula(t)) {
      return wrapInlineMathQuestion(t);
    }
    return formatNakedExponents(t);
  }

  function looksLikeStandaloneFormula(text) {
    return /^[A-Za-z]\([A-Za-z0-9]\)\s*=/.test(text)
      && /\b(?:Which|What|Find|Evaluate|Calculate|Choose|Select|How)\b/i.test(text);
  }

  function wrapInlineMathQuestion(text) {
    const questionMatch = text.match(/^(.*?)(\s+(?:Which|What|Find|Evaluate|Calculate|Choose|Select|How)\b.*)$/i);
    const mathPart = questionMatch ? questionMatch[1].trim() : text.trim();
    const tail = questionMatch ? questionMatch[2].trimStart() : '';
    if (!mathPart) return cleanDisplayText(text);
    return `$${mathPart}$${tail ? ' ' + tail : ''}`;
  }

  function formatNakedExponents(text) {
    return String(text)
      .replace(/([A-Za-z0-9)\]])\^\{([+-]?\d+)\}/g, '$1<sup>$2</sup>')
      .replace(/([A-Za-z0-9)\]])\^([+-]?\d+)/g, '$1<sup>$2</sup>')
      .replace(/(\d)\s*x\s*10(?=<sup>)/gi, '$1 \u00d7 10');
  }

  function formatQuestionText(text) {
    text = normalizePlainMathText(text);
    const lines = text.split('\n');
    if (lines.length === 1) {
      return `<span class="q-intro">${text}</span>`;
    }
    const intro = lines[0];
    const stmts = lines.slice(1);
    const introHtml = `<span class="q-intro">${intro}</span>`;
    const stmtHtml = stmts.map(line => {
      if (!line.trim()) return '';
      return `<span class="q-stmt-block">${line.trim()}</span>`;
    }).join('');
    return introHtml + stmtHtml;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function renderTextBlock(value) {
    return escapeHTML(cleanDisplayText(value)).replace(/\n/g, '<br>');
  }

  Object.assign(helpers, {
    decodeMojibakeSegment,
    cleanDisplayText,
    normalizePlainMathText,
    looksLikeStandaloneFormula,
    wrapInlineMathQuestion,
    formatNakedExponents,
    formatQuestionText,
    escapeHTML,
    renderTextBlock
  });

  Object.assign(window, {
    decodeMojibakeSegment,
    cleanDisplayText,
    normalizePlainMathText,
    looksLikeStandaloneFormula,
    wrapInlineMathQuestion,
    formatNakedExponents,
    formatQuestionText,
    escapeHTML,
    renderTextBlock
  });
})();
