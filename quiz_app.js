// quiz_app.js — Application logic, state, renderers

// Helper: get current subject registry entry
function subj() { return SUBJECTS[state.currentSubject] || SUBJECTS.materials; }

// Returns the active past-paper pool based on appMode
function pastPool() {
  const s = subj();
  return state.appMode === 'fullpaper' ? s.pastPaper : s.pastUnit;
}

// progressKey for past modes
let state = {
  screen: 'landing',
  appMode: null,       // 'pastpaper' or 'target'
  currentSubject: 'materials',
  topics: [1,2,3,4,5],
  mode: 'standard',
  count: 20,
  questions: [],
  current: 0,
  answered: false,
  selected: -1,
  score: 0,
  results: [],
  showReview: false,
  timerSeconds: 0,
  timerInterval: null,
  countdownLimit: 0,
  countdownRemaining: 0,
  targetHardOnly: false,
  categoryMode: 'pastpaper',
  categoryEntry: '',
  directoryQuery: '',
  directorySubject: 'all',
  directorySource: 'all',
  directoryOpenId: '',
  viewAllQuestions: [],  // pool for the view-all browser
  viewAllTitle: '',      // heading shown in that screen
  viewAllBack: 'home',  // screen to return to
  viewAllToken: '',     // token used to start quiz from browse screen
  resumeOffset: 0,      // questions already answered before this session (for display)
  // ── Exam mode ──
  examPages: [],        // array of question arrays (one per page)
  examCurrentPage: 0,
  examAnswers: {},      // { questionId: selectedOptionIndex } — survives page nav
  examSubmitted: false
};

let _landingAnimDone = false;
let _routerReady = false;
let _isApplyingRoute = false;
let _lastRoutePath = '';
let _allowQuizBackOnce = false;

function targetPoolForSubject(subjectEntry = subj()) {
  return state.targetHardOnly ? subjectEntry.targetHard : subjectEntry.targetNormal;
}

function targetModeLabel() {
  return state.targetHardOnly ? 'Hard Target' : 'Normal Target';
}

const MoraSubjectData = window.MoraSubjectData;
if (!MoraSubjectData) {
  throw new Error('MoraSubjectData must load before quiz_app.js');
}

var rootAssetPath = MoraSubjectData.rootAssetPath;
var isUnitOffline = MoraSubjectData.isUnitOffline;
var isPaperOffline = MoraSubjectData.isPaperOffline;
var _markOfflineItem = MoraSubjectData._markOfflineItem;
var _hasAnyOffline = MoraSubjectData._hasAnyOffline;
var subjectCount = MoraSubjectData.subjectCount;
var subjectTotalCount = MoraSubjectData.subjectTotalCount;
var isSubjectLoaded = MoraSubjectData.isSubjectLoaded;
var applySubjectData = MoraSubjectData.applySubjectData;
var ensureSubjectData = MoraSubjectData.ensureSubjectData;
var ensureAllSubjectData = MoraSubjectData.ensureAllSubjectData;
var getSubjectLoadError = MoraSubjectData.getSubjectLoadError;

// ── Offline / Download (per-unit and per-paper) ───────────────────────────────
const MoraOfflineCache = window.MoraOfflineCache;
if (!MoraOfflineCache) {
  throw new Error('MoraOfflineCache must load before quiz_app.js');
}
var _cacheSubjectData = MoraOfflineCache.cacheSubjectData;
var _cacheImages = MoraOfflineCache.cacheImages;

const MoraQuizUtils = window.MoraQuizUtils;
if (!MoraQuizUtils) {
  throw new Error('MoraQuizUtils must load before quiz_app.js');
}
var shuffle = MoraQuizUtils.shuffle;
var shuffleQuestionOptions = MoraQuizUtils.shuffleQuestionOptions;
var formatTime = MoraQuizUtils.formatTime;
var unitClass = MoraQuizUtils.unitClass;
var clampQuestionCount = MoraQuizUtils.clampQuestionCount;

const MoraTransitionHelpers = window.MoraTransitionHelpers;
if (!MoraTransitionHelpers) {
  throw new Error('MoraTransitionHelpers must load before quiz_app.js');
}
var SUBJECT_TRANSITIONS = MoraTransitionHelpers.SUBJECT_TRANSITIONS;
var TRANSITION_SEEN_KEY = MoraTransitionHelpers.TRANSITION_SEEN_KEY;
var hasSeenTransition = MoraTransitionHelpers.hasSeenTransition;
var markTransitionSeen = MoraTransitionHelpers.markTransitionSeen;
var wait = MoraTransitionHelpers.wait;
var preloadImage = MoraTransitionHelpers.preloadImage;
var preloadSubjectTransitionAssets = MoraTransitionHelpers.preloadSubjectTransitionAssets;

async function downloadForOffline(type, subjectKey, id) {
  const safeId = String(id).replace(/[\s'"]/g, '-');
  const btn = document.getElementById(`ol-btn-${type}-${subjectKey}-${safeId}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span style="opacity:0.6;font-size:0.79rem;">Saving...</span>'; }
  try {
    const s = await ensureSubjectData(subjectKey);
    const questions = type === 'unit'
      ? s.pastUnit.filter(q => q.unit === Number(id))
      : s.pastPaper.filter(q => String(q.year) === String(id));
    const images = [...new Set(questions.filter(q => q.img).map(q => rootAssetPath(q.img)))];
    await _cacheSubjectData(subjectKey);
    await _cacheImages(images);
    _markOfflineItem(type, subjectKey, id, true);
  } catch(e) {}
  renderApp();
}

async function removeFromOffline(type, subjectKey, id) {
  _markOfflineItem(type, subjectKey, id, false);
  if (!_hasAnyOffline(subjectKey)) {
    const src = rootAssetPath(`subject_data/${subjectKey}.js?v=${MoraSubjectData.SUBJECT_DATA_VERSION}`);
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'REMOVE_SUBJECT', url: src, subjectKey });
    }
  }
  renderApp();
}

function _offlineBtn(type, subjectKey, id) {
  const saved  = type === 'unit' ? isUnitOffline(subjectKey, id) : isPaperOffline(subjectKey, id);
  const safeId = String(id).replace(/[\s'"]/g, '-');
  const idArg  = type === 'unit' ? id : `'${String(id).replace(/'/g, "\\'")}'`;
  if (saved) {
    return `<div class="offline-action saved-offline-action">
      <span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Saved offline
      </span>
      <button onclick="removeFromOffline('${type}','${subjectKey}',${idArg})"
        style="background:none;border:none;color:var(--text-muted);font-size:0.7rem;cursor:pointer;font-family:inherit;padding:0;transition:color 0.13s;"
        onmouseover="this.style.color='#f87171'"
        onmouseout="this.style.color='var(--text-muted)'">Remove</button>
    </div>`;
  }
  return `<button id="ol-btn-${type}-${subjectKey}-${safeId}" onclick="downloadForOffline('${type}','${subjectKey}',${idArg})"
    class="offline-action save-offline-action"
    style="background:rgba(108,139,239,0.07);border-color:rgba(108,139,239,0.2);color:var(--accent-light);"
    onmouseover="this.style.background='rgba(108,139,239,0.13)';this.style.borderColor='rgba(108,139,239,0.4)'"
    onmouseout="this.style.background='rgba(108,139,239,0.07)';this.style.borderColor='rgba(108,139,239,0.2)'">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v13M7 11l5 5 5-5"/><line x1="2" y1="21" x2="22" y2="21"/></svg>
    Save offline
  </button>`;
}

window.downloadForOffline = downloadForOffline;
window.removeFromOffline  = removeFromOffline;
let _appTutorialStep = 0;
let _appTutorialActive = false;
let _appTutorialPrevState = null;

let chatState = {
  isOpen: false,
  messages: [{ role: 'model', text: "Hello Machan. I'm Januda Ayya but you can call me Sudu. Stuck on a tricky question? Throw it at me. Explaining difficult topics is like cutting through butter for me."}],
  isTyping: false
};

function screenNeedsSubjectData(screen) {
  return ['subjectHome', 'pastpaperHome', 'paperHome', 'home', 'targetHome', 'quiz', 'examQuiz', 'results', 'allDone'].includes(screen);
}

function renderSubjectLoading() {
  const s = subj();
  const loadError = getSubjectLoadError(state.currentSubject);
  const message = loadError
    ? loadError
    : 'Loading questions...';
  const retry = loadError
    ? `<button class="primary" onclick="ensureSubjectData('${state.currentSubject}').then(renderApp).catch(()=>renderApp())">Retry</button>`
    : '';
  return `
    <div class="subject-loading-shell">
      <div class="subject-loading-card" style="--card-color:${s.color};--card-shadow:${s.color}22;">
        <div class="subject-loading-icon" style="background:${s.colorBg};border-color:${s.color}55;color:${s.color};">${s.icon}</div>
        <h2>${s.label}</h2>
        <p>${message}</p>
        ${retry}
      </div>
    </div>
  `;
}


// ── Persistence: save & restore quiz progress ────────────────────────────────
// ── Persistence: remember answers across sessions ────────────────────────────
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.4, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    };
    beep(880, 0, 0.18); beep(880, 0.22, 0.18); beep(880, 0.44, 0.18);
    beep(1100, 0.7, 0.4);
  } catch(e) {}
}

function startTimer() {
  stopTimer();
  state.timerSeconds = 0;
  state.timerPaused = false;
  if (state.countdownLimit > 0) {
    state.countdownRemaining = state.countdownLimit;
  }
  state.timerInterval = setInterval(() => {
    if (state.timerPaused) return;
    state.timerSeconds++;
    if (state.countdownLimit > 0) {
      state.countdownRemaining = Math.max(0, state.countdownLimit - state.timerSeconds);
      const el = document.getElementById('quiz-timer');
      if (el) {
        el.textContent = formatTime(state.countdownRemaining);
        el.style.color = state.countdownRemaining <= 30 ? '#f87171' : '';
        el.style.fontWeight = state.countdownRemaining <= 30 ? '700' : '';
      }
      if (state.countdownRemaining <= 0) {
        stopTimer();
        playAlarm();
        // force end quiz
        state.screen = 'results';
        state.showReview = false;
        renderApp();
        // flash overlay
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;inset:0;background:rgba(248,113,113,0.18);z-index:9999;pointer-events:none;animation:flashFade 1s ease forwards;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1000);
      }
    } else {
      const el = document.getElementById('quiz-timer');
      if (el) el.textContent = formatTime(state.timerSeconds);
    }
  }, 1000);
}

function pauseTimer() {
  state.timerPaused = true;
  const btn = document.getElementById('pauseTimerBtn');
  const timerEl = document.getElementById('quiz-timer');
  if (btn) { btn.textContent = 'Resume'; btn.title = 'Resume timer'; }
  if (timerEl) timerEl.style.opacity = '0.45';
}

function resumeTimer() {
  state.timerPaused = false;
  const btn = document.getElementById('pauseTimerBtn');
  const timerEl = document.getElementById('quiz-timer');
  if (btn) { btn.textContent = 'Pause'; btn.title = 'Pause timer'; }
  if (timerEl) timerEl.style.opacity = '';
}

function togglePauseTimer() {
  if (state.timerPaused) resumeTimer(); else pauseTimer();
}

function stopTimer() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}

function startQuiz(onlyWrong = false) {
  // appMode is already set to 'pastpaper' or 'fullpaper' by the caller
  const s = subj();
  const activeMode = state.appMode; // 'pastpaper' or 'fullpaper'
  const allPast = pastPool();
  let pool = [];

  if (onlyWrong && state.results.length > 0) {
    const wrongIds = state.results.filter(r => !r.correct).map(r => r.id);
    pool = allPast.filter(q => wrongIds.includes(q.id));
  } else if (activeMode === 'fullpaper') {
    pool = state.topics.length > 0
      ? allPast.filter(q => state.topics.includes(q.year))
      : [...allPast];
    const answered = Object.keys(answerHistory);
    const unanswered = pool.filter(q => !answered.includes(q.id));
    pool = unanswered.length > 0 ? unanswered : pool;
  } else {
    if (state.topics.length === 0) { alert('Please select at least one unit.'); return; }
    pool = allPast.filter(q => state.topics.includes(q.unit));
    pool.sort((a, b) => a.unit - b.unit);
    const answered = Object.keys(answerHistory);
    const unanswered = pool.filter(q => !answered.includes(q.id));
    pool = unanswered.length > 0 ? unanswered : pool;
    if (state.mode === 'weak' && state.results.length > 0) {
      const wrong = new Set(state.results.filter(r => !r.correct).map(r => r.id));
      const wrongQs = pool.filter(q => wrong.has(q.id));
      pool = wrongQs.length > 0 ? wrongQs : pool;
    }
    // Smart (spaced repetition) mode — reorder by SR weights
    if (state.mode === 'smart') {
      pool = buildSmartPool(pool, state.currentSubject);
    }
  }

  if (pool.length === 0) { alert('No questions available for the selected filter.'); return; }

  // Full scope pool (including already-answered) — used for allDone check and resume offset
  const fullScope = onlyWrong ? pool : (
    activeMode === 'fullpaper'
      ? (state.topics.length > 0 ? allPast.filter(q => state.topics.includes(q.year)) : allPast)
      : allPast.filter(q => state.topics.includes(q.unit))
  );

  // Check if all questions have been answered
  if (!onlyWrong) {
    const answered = Object.keys(answerHistory);
    if (fullScope.length > 0 && fullScope.every(q => answered.includes(q.id))) {
      state.screen = 'allDone';
      state.allDoneMode = activeMode;
      renderApp();
      return;
    }
    // How many already answered in this scope → used to show "Q 8 of 30" not "Q 1 of 22"
    state.resumeOffset = fullScope.filter(q => answered.includes(q.id)).length;
  } else {
    state.resumeOffset = 0;
  }

  state.questions = pool.map(q => ({...q}));
  state.current = 0;
  state.answered = false;
  state.selected = -1;
  state.score = 0;
  state.results = [];
  state.screen = 'quiz';
  startTimer();
  renderApp();
  setTimeout(_maybeNudgeShortcuts, 800);
}

function startTargetQuiz() {
  state.appMode = 'target';
  const s = subj();
  let sourcePool = [...targetPoolForSubject(s)];

  // Filter by selected units
  if (state.topics.length > 0) {
    sourcePool = sourcePool.filter(q => state.topics.includes(q.unit));
  }

  if (sourcePool.length === 0) { alert('No questions available for the selected units.'); return; }

  // Filter out already-answered questions
  const answered = Object.keys(answerHistory);
  const unanswered = sourcePool.filter(q => !answered.includes(q.id));

  // Check if all answered
  if (unanswered.length === 0) {
    state.screen = 'allDone';
    state.allDoneMode = 'target';
    renderApp();
    return;
  }

  let pool = shuffle(unanswered).map(shuffleQuestionOptions);
  state.questions = pool.slice(0, Math.min(state.count, pool.length));
  state.current = 0;
  state.answered = false;
  state.selected = -1;
  state.score = 0;
  state.results = [];
  state.screen = 'quiz';
  startTimer();
  renderApp();
}

function goHome() {
  stopTimer();
  state.screen = 'landing';
  renderApp();
}

function selectAnswer(idx) {
  if (state.answered) return;
  state.answered = true;
  state.selected = idx;
  const q = state.questions[state.current];
  const correct = idx === q.ans;
  if (correct) state.score++;
  state.results.push({ id: q.id, correct, selected: idx, question: q });
  // Update in-memory history
  answerHistory[q.id] = { selected: idx, correct, timestamp: Date.now() };
  // Save to Supabase (no-op for guests)
  dbSaveAnswer(state.currentSubject, q.id, idx, correct);
  renderApp();
  maybeNudgeJanuda();
}

function next() {
  state.current++;
  state.answered = false;
  state.selected = -1;
  if (state.current >= state.questions.length) {
    state.screen = 'results';
    state.showReview = false;
    stopTimer();
    // Save completed session to Supabase (no-op for guests)
    dbSaveSession(
      state.currentSubject,
      state.appMode,
      state.score,
      state.questions.length,
      state.timerSeconds,
      state.countdownLimit
    );
  }
  renderApp();
}

// ── Keyboard Shortcuts ────────────────────────────────────────────────────────
const SHORTCUTS = [
  { keys: ['1','2','3',' …'],  desc: 'Select answer option (matches option count)' },
  { keys: ['Enter'],           desc: 'Submit / next question' },
  { keys: ['Backspace'],       desc: 'Go back one question (if unanswered)' },
  { keys: ['Space'],           desc: 'Pause / resume timer' },
  { keys: ['F'],               desc: 'Flag / unflag current question' },
  { keys: ['Alt+H'],           desc: 'Go to home screen' },
  { keys: ['Esc'],             desc: 'Quit quiz / close overlay' },
  { keys: ['?'],               desc: 'Show this shortcuts panel' },
];

function showShortcutsPanel() {
  document.getElementById('shortcutsPanel')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="shortcutsPanel" class="guest-auth-overlay" onclick="if(event.target===this)document.getElementById('shortcutsPanel')?.remove()">
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:20px;padding:1.6rem 1.5rem;max-width:360px;width:calc(100% - 2rem);position:relative;">
        <button class="auth-close" onclick="document.getElementById('shortcutsPanel')?.remove()">×</button>
        <div style="font-size:0.68rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent-light);margin-bottom:1rem;">⌨ Keyboard Shortcuts</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${SHORTCUTS.map(s => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <span style="font-size:0.82rem;color:var(--text-muted);">${s.desc}</span>
              <span style="display:flex;gap:4px;flex-shrink:0;">${s.keys.map(k =>
                `<kbd style="background:var(--surface2);border:1px solid var(--border);border-radius:5px;font-family:'DM Mono',monospace;font-size:0.72rem;padding:2px 7px;color:var(--text);">${k}</kbd>`
              ).join('<span style="color:var(--text-muted);font-size:0.7rem;align-self:center;">or</span>')}</span>
            </div>`).join('')}
        </div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin-top:1rem;text-align:center;">Shortcuts only active during a quiz</p>
      </div>
    </div>
  `);
}
window.showShortcutsPanel = showShortcutsPanel;

// Wire up global keyboard handler for quiz
(function initQuizKeyboard() {
  const SHORTCUT_NUDGE_KEY = 'mora_shortcut_nudge_seen';
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('appTutorialOverlay') || document.getElementById('profileTutorialOverlay')) {
        e.preventDefault();
        return;
      }
      if (document.getElementById('timerModal')?.style.display === 'block') {
        e.preventDefault();
        closeTimerModal();
        return;
      }
      if (document.getElementById('shortcutsPanel')) { e.preventDefault(); document.getElementById('shortcutsPanel').remove(); return; }
      if (document.getElementById('routeLeaveQuizPrompt')) { e.preventDefault(); cancelRouteLeaveQuiz(); return; }
      if (state.screen === 'quiz' || state.screen === 'examQuiz') { e.preventDefault(); confirmLeaveActiveQuiz(); return; }
    }

    // Don't fire if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === '?') {
      if (state.screen === 'quiz' || state.screen === 'examQuiz') { e.preventDefault(); showShortcutsPanel(); return; }
      return;
    }

    // Alt+H → home from anywhere
    if (e.altKey && e.key.toUpperCase() === 'H') {
      e.preventDefault();
      if (state.screen === 'quiz' || state.screen === 'examQuiz') {
        confirmLeaveActiveQuiz();
      } else {
        stopTimer();
        state.screen = 'landing';
        renderApp();
      }
      return;
    }

    if (state.screen !== 'quiz') return;

    // 1–8 → select answer option (supports up to 8 options)
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= 8 && !state.answered) {
      const idx = num - 1;
      if (idx < (state.questions[state.current]?.opts?.length ?? 0)) {
        e.preventDefault();
        selectAnswer(idx);
      }
      return;
    }

    // Enter → next question
    if (e.key === 'Enter' && state.answered) {
      e.preventDefault();
      next();
      return;
    }

    // Backspace → go back one step (only when not mid-answer)
    if (e.key === 'Backspace' && !state.answered && state.current > 0) {
      e.preventDefault();
      state.current--;
      state.answered = false;
      state.selected = -1;
      renderApp();
      return;
    }

    // Space → pause/resume
    if (e.key === ' ') {
      e.preventDefault();
      if (typeof togglePauseTimer === 'function') togglePauseTimer();
      return;
    }

    // F → flag
    if (e.key.toUpperCase() === 'F' && state.questions[state.current]) {
      e.preventDefault();
      toggleFlagUI(state.currentSubject, state.questions[state.current].id);
      return;
    }
  });

  // One-time nudge on first quiz entry (desktop only)
  window._quizShortcutNudgeFired = false;
})();

function _maybeNudgeShortcuts() {
  if (window._quizShortcutNudgeFired) return;
  if (window.matchMedia('(pointer:coarse)').matches) return; // skip on touch devices
  if (localStorage.getItem('mora_shortcut_nudge_seen')) return;
  window._quizShortcutNudgeFired = true;
  localStorage.setItem('mora_shortcut_nudge_seen', '1');

  // Figure out max option count for current question
  const q = state.questions?.[state.current];
  const maxOpt = q?.opts?.length ?? 4;
  const rangeLabel = maxOpt <= 1 ? '1' : `1–${maxOpt}`;

  function _kbd(t) {
    return `<kbd style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-family:'DM Mono',monospace;font-size:0.72rem;color:var(--text);">${t}</kbd>`;
  }

  const toast = document.createElement('div');
  toast.style.cssText = [
    'position:fixed;bottom:5.5rem;left:50%;transform:translateX(-50%);',
    'background:var(--surface2);border:1px solid var(--border);border-radius:12px;',
    'padding:10px 18px;font-size:0.8rem;color:var(--text-muted);',
    'z-index:9000;box-shadow:0 4px 24px rgba(0,0,0,0.35);',
    'display:flex;align-items:center;gap:10px;white-space:nowrap;',
    'animation:fadeInUp 0.35s ease;'
  ].join('');

  toast.innerHTML = [
    `⌨ ${_kbd(rangeLabel)} to answer`,
    `${_kbd('Enter')} to submit / next`,
    `more at ${_kbd('?')}`,
  ].join('<span style="color:var(--border-hover);margin:0 2px;">·</span>');

  // Make it clickable to open the panel
  toast.style.cursor = 'pointer';
  toast.style.pointerEvents = 'auto';
  toast.title = 'Click to see all shortcuts';
  toast.addEventListener('click', () => { toast.remove(); showShortcutsPanel(); });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

function getGrade(pct) {
  if (state.appMode === 'target') {
    if (pct >= 75) return {label:'A', msg:'Excellent performance - outstanding mastery!', color:'#4ade80'};
    if (pct >= 65) return {label:'B', msg:'Good work - solid understanding shown.', color:'#7dd3fc'};
    if (pct >= 50) return {label:'C', msg:'Passing - review the weaker areas.', color:'#fbbf24'};
    if (pct >= 35) return {label:'S', msg:'Satisfactory - more practice needed.', color:'#f97316'};
    return {label:'F', msg:'Needs improvement - keep studying!', color:'#f87171'};
  }
  if (pct >= 85) return {label:'Excellent', msg:'Outstanding performance!', color:'#4ade80'};
  if (pct >= 70) return {label:'Good', msg:'Solid understanding shown.', color:'#7dd3fc'};
  if (pct >= 50) return {label:'Passing', msg:'Review the tricky topics.', color:'#fbbf24'};
  return {label:'Needs work', msg:'Practice more and try again!', color:'#f87171'};
}

function unitTag(u) {
  const units = subj().units;
  return units[u] || '';
}

function startPaper(yr) {
  state.appMode = 'fullpaper';
  state.topics = [yr];
  showModePickerModal('fullpaper');
}

function startAllPapers() {
  state.appMode = 'fullpaper';
  state.topics = [];
  showModePickerModal('fullpaper');
}

// ── Exam Mode ─────────────────────────────────────────────────────────────────
let _pendingExamMode   = false;
let _modePickerPending = null;   // quiz mode stored while mode picker is open
let _modePickerBypass  = false;

function showModePickerModal(quizMode, bypassGuestPrompt = false) {
  const cfg = window._appSettings || {};
  // Skip picker if: target mode, exam disabled globally, or this mode not in allowed list
  const examAllowed = cfg.exam_mode_enabled !== false
    && (cfg.exam_mode_modes ?? ['pastpaper','fullpaper']).includes(quizMode);
  if (quizMode === 'target' || !examAllowed) {
    showTimerModal(quizMode, bypassGuestPrompt);
    return;
  }
  if (!bypassGuestPrompt && typeof isGuest === 'function' && isGuest()
      && typeof guestModeAccepted === 'function' && !guestModeAccepted()) {
    showGuestQuizPrompt(quizMode);
    return;
  }
  _modePickerPending = quizMode;
  _modePickerBypass  = bypassGuestPrompt;
  document.getElementById('modePickerModal')?.remove();
  const s = subj();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="modePickerModal" class="guest-auth-overlay" onclick="if(event.target===this)document.getElementById('modePickerModal')?.remove()">
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:20px;padding:1.8rem 1.5rem;max-width:460px;width:calc(100% - 2rem);position:relative;">
        <button class="auth-close" onclick="document.getElementById('modePickerModal')?.remove()">×</button>
        <div style="font-size:0.68rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent-light);margin-bottom:1rem;">How do you want to practise?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">

          <button onclick="_pickQuizMode('practice')"
            style="background:var(--surface2);border:1.5px solid var(--border);border-radius:16px;padding:1.4rem 1rem;cursor:pointer;text-align:left;font-family:inherit;transition:border-color 0.15s,background 0.15s;"
            onmouseover="this.style.borderColor='${s.color}'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="font-size:1.8rem;margin-bottom:0.6rem;">📚</div>
            <div style="font-size:0.95rem;font-weight:700;color:var(--text);margin-bottom:0.35rem;">Practice</div>
            <div style="font-size:0.76rem;color:var(--text-muted);line-height:1.55;">Instant feedback after each answer with explanations.</div>
          </button>

          <button onclick="_pickQuizMode('exam')"
            style="background:var(--surface2);border:1.5px solid var(--border);border-radius:16px;padding:1.4rem 1rem;cursor:pointer;text-align:left;font-family:inherit;transition:border-color 0.15s,background 0.15s;"
            onmouseover="this.style.borderColor='#8090c8'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="font-size:1.8rem;margin-bottom:0.6rem;">📝</div>
            <div style="font-size:0.95rem;font-weight:700;color:var(--text);margin-bottom:0.35rem;">Exam</div>
            <div style="font-size:0.76rem;color:var(--text-muted);line-height:1.55;">All questions at once. Answers revealed only after you submit.</div>
          </button>

        </div>
      </div>
    </div>
  `);
}
window.showModePickerModal = showModePickerModal;

function _pickQuizMode(mode) {
  document.getElementById('modePickerModal')?.remove();
  _pendingExamMode = (mode === 'exam');
  showTimerModal(_modePickerPending, _modePickerBypass);
}
window._pickQuizMode = _pickQuizMode;

// Build paginated exam pages, keeping context/image-linked questions together
function buildExamPages(questions, target = 12) {
  // Step 1: group consecutive questions sharing a context or img
  const groups = [];
  let i = 0;
  while (i < questions.length) {
    const grp = [questions[i]];
    let j = i + 1;
    while (j < questions.length) {
      const prev = questions[j - 1], cur = questions[j];
      const sharedCtx = prev.context && cur.context && prev.context === cur.context;
      const sharedImg = prev.img     && cur.img     && prev.img     === cur.img;
      if (sharedCtx || sharedImg) { grp.push(cur); j++; } else break;
    }
    groups.push(grp);
    i = j;
  }
  // Step 2: pack groups into pages of ~target questions
  const pages = [];
  let page = [];
  for (const grp of groups) {
    if (page.length > 0 && page.length + grp.length > target) {
      pages.push(page);
      page = [...grp];
    } else {
      page.push(...grp);
    }
  }
  if (page.length > 0) pages.push(page);
  return pages;
}

function showExamTransition(subjectLabel, callback) {
  document.getElementById('examTransitionOverlay')?.remove();
  const el = document.createElement('div');
  el.id = 'examTransitionOverlay';
  el.innerHTML = `
    <div class="et-rings">
      <div class="et-ring"></div><div class="et-ring"></div><div class="et-ring"></div>
    </div>
    <div class="et-scan"></div>
    <div class="et-content">
      <div class="et-label">EXAM</div>
      <div class="et-label et-mode">MODE</div>
      <div class="et-subject">${subjectLabel}</div>
    </div>`;
  document.body.appendChild(el);
  // Dismiss + call callback after animation completes
  const tid = setTimeout(() => {
    el.classList.add('et-out');
    setTimeout(() => { el.remove(); callback(); }, 500);
  }, 2400);
  // Tap to skip
  el.addEventListener('click', () => { clearTimeout(tid); el.remove(); callback(); }, { once: true });
}

function startExamQuiz() {
  const allPast = pastPool();
  let pool = [];
  if (state.appMode === 'fullpaper') {
    pool = state.topics.length > 0
      ? allPast.filter(q => state.topics.includes(q.year))
      : [...allPast];
  } else {
    if (state.topics.length === 0) { alert('Please select at least one unit.'); return; }
    pool = allPast.filter(q => state.topics.includes(q.unit));
    pool.sort((a, b) => a.unit - b.unit);
  }
  if (pool.length === 0) { alert('No questions available.'); return; }

  state.questions       = pool.map(q => ({...q}));
  state.examPages       = buildExamPages(state.questions);
  state.examCurrentPage = 0;
  state.examAnswers     = {};
  state.examSubmitted   = false;
  state.score           = 0;
  state.results         = [];
  state.screen          = 'examQuiz';
  document.body.classList.add('exam-active');
  startTimer();
  // Show dramatic transition overlay, then render the exam
  const s = subj();
  const label = state.appMode === 'fullpaper' && state.topics.length === 1
    ? `${s.label} · ${state.topics[0]}`
    : s.label;
  showExamTransition(label, () => renderApp());
}
window.startExamQuiz = startExamQuiz;

function examSelectAnswer(qId, optIdx) {
  state.examAnswers[qId] = optIdx;
  // DOM-only: no full re-render so page position & other answers stay intact
  const card = document.getElementById('eq-' + qId);
  if (card) {
    card.querySelectorAll('.exam-opt').forEach((btn, i) => {
      btn.classList.toggle('exam-selected', i === optIdx);
      btn.querySelector('.exam-opt-letter')?.classList.toggle('sel', i === optIdx);
    });
  }
  const prog = document.querySelector('.exam-progress');
  if (prog) prog.textContent = `${Object.keys(state.examAnswers).length} / ${state.questions.length} answered`;
}
window.examSelectAnswer = examSelectAnswer;

// Flag toggle — DOM-only update, no re-render
async function toggleFlagUI(subject, qId) {
  const adding = await toggleFlag(subject, qId);
  document.querySelectorAll(`#flag-${qId}, #eflag-${qId}`).forEach(btn => {
    btn.classList.toggle('flagged', adding);
    btn.title = adding ? 'Remove flag' : 'Flag for review';
  });
}
window.toggleFlagUI = toggleFlagUI;

function startFlaggedQuiz(unitId) {
  const s = subj();
  const flagged = getFlaggedIds(s.key);
  const pool = s.pastUnit.filter(q => q.unit === unitId && flagged.has(q.id));
  if (pool.length === 0) { alert('No flagged questions in this unit.'); return; }
  state.appMode  = 'pastpaper';
  state.topics   = [unitId];
  state.questions = pool.map(q => ({...q}));
  state.current  = 0;
  state.answered = false;
  state.selected = -1;
  state.score    = 0;
  state.results  = [];
  state.screen   = 'quiz';
  startTimer();
  renderApp();
}
window.startFlaggedQuiz = startFlaggedQuiz;

// ── Reset quiz progress for a unit or paper ───────────────────────────────────
function confirmResetProgress(type, id, label) {
  // type: 'unit' | 'paper'   id: unitId | year string
  document.getElementById('resetProgressDlg')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="resetProgressDlg" class="guest-auth-overlay" onclick="if(event.target===this)document.getElementById('resetProgressDlg')?.remove()">
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:20px;padding:1.8rem 1.5rem;max-width:380px;width:calc(100% - 2rem);position:relative;">
        <button class="auth-close" onclick="document.getElementById('resetProgressDlg')?.remove()">×</button>
        <div style="font-size:0.68rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent-light);margin-bottom:0.7rem;">Reset Progress</div>
        <h2 style="font-size:1.05rem;margin-bottom:0.5rem;">Start ${label} over?</h2>
        <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;margin-bottom:1.2rem;">
          Your answer history for this ${type === 'unit' ? 'unit' : 'paper'} will be cleared so you can attempt it fresh.<br>
          <strong style="color:var(--text);">Your quiz statistics and scores are kept.</strong>
        </p>
        <div class="guest-auth-actions">
          <button onclick="document.getElementById('resetProgressDlg')?.remove();doResetProgress('${type}','${String(id).replace(/'/g,"\\'")}','${label.replace(/'/g,"\\'")}')">Reset &amp; Start Fresh</button>
          <button class="guest-primary" onclick="document.getElementById('resetProgressDlg')?.remove()">Keep Progress</button>
        </div>
      </div>
    </div>
  `);
}
window.confirmResetProgress = confirmResetProgress;

async function doResetProgress(type, id, label) {
  const s = subj();
  let qIds = [];
  if (type === 'unit') {
    qIds = s.pastUnit.filter(q => q.unit === Number(id)).map(q => q.id);
  } else {
    qIds = s.pastPaper.filter(q => String(q.year) === String(id)).map(q => q.id);
  }
  // Remove from local answerHistory object
  qIds.forEach(qId => { delete answerHistory[qId]; });
  // Remove from DB / localStorage
  await dbResetAnswers(s.key, qIds).catch(() => {});
  renderApp();
}
window.doResetProgress = doResetProgress;

function examGoToPage(delta) {
  const next = state.examCurrentPage + delta;
  if (next < 0 || next >= state.examPages.length) return;
  state.examCurrentPage = next;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.examGoToPage = examGoToPage;

function submitExamConfirm() {
  const total     = state.questions.length;
  const answered  = Object.keys(state.examAnswers).length;
  const missing   = total - answered;
  document.getElementById('examSubmitDlg')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="examSubmitDlg" class="guest-auth-overlay" onclick="if(event.target===this)document.getElementById('examSubmitDlg')?.remove()">
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:20px;padding:1.8rem 1.5rem;max-width:380px;width:calc(100% - 2rem);position:relative;">
        <button class="auth-close" onclick="document.getElementById('examSubmitDlg')?.remove()">×</button>
        <div style="font-size:0.68rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#8090c8;margin-bottom:0.7rem;">Submit Exam</div>
        <h2 style="font-size:1.05rem;margin-bottom:0.5rem;">
          ${missing > 0 ? missing + ' question' + (missing > 1 ? 's' : '') + ' unanswered' : '✓ All questions answered'}
        </h2>
        <p style="font-size:0.86rem;color:var(--text-muted);line-height:1.6;margin-bottom:1.2rem;">
          ${missing > 0 ? `<strong style="color:#f87171;">${missing}</strong> question${missing>1?'s':''} left blank. ` : ''}
          Once submitted your answers are locked and the review is shown.
        </p>
        <div class="guest-auth-actions">
          <button class="primary" onclick="document.getElementById('examSubmitDlg')?.remove();submitExamPaper()">Submit Paper</button>
          <button class="guest-primary" onclick="document.getElementById('examSubmitDlg')?.remove()">Keep going</button>
        </div>
      </div>
    </div>
  `);
}
window.submitExamConfirm = submitExamConfirm;

async function submitExamPaper() {
  document.getElementById('examSubmitDlg')?.remove();
  stopTimer();
  document.body.classList.remove('exam-active');
  state.results = state.questions.map(q => ({
    id:       q.id,
    question: q,
    selected: state.examAnswers[q.id] ?? -1,
    correct:  (state.examAnswers[q.id] ?? -1) === q.ans
  }));
  state.score      = state.results.filter(r => r.correct).length;
  state.showReview = true;
  state.screen     = 'results';
  // Save to DB
  for (const r of state.results) {
    if (r.selected >= 0)
      await dbSaveAnswer(state.currentSubject, r.id, r.selected, r.correct).catch(() => {});
  }
  await dbSaveSession(state.currentSubject, state.appMode, state.score,
                      state.questions.length, state.timerSeconds, state.countdownLimit).catch(() => {});
  renderApp();
  setTimeout(renderMath, 120);
}
window.submitExamPaper = submitExamPaper;

// ── View All Questions ────────────────────────────────────────────────────────
// `questions` may be a real array OR a string token: 'pastUnit_unit_N' / 'pastPaper_year_YYYY'
function _resolveViewAllPool(questions) {
  if (Array.isArray(questions)) return questions;
  const s = subj();
  if (typeof questions === 'string') {
    const unitMatch = questions.match(/^pastUnit_unit_(\d+)$/);
    if (unitMatch) return s.pastUnit.filter(q => q.unit === Number(unitMatch[1]));
    const yearMatch = questions.match(/^pastPaper_year_(.+)$/);
    if (yearMatch) return s.pastPaper.filter(q => String(q.year) === yearMatch[1]);
  }
  return [];
}

function showViewAllConfirm(token, title, backScreen) {
  document.getElementById('viewAllConfirm')?.remove();
  const resolved = _resolveViewAllPool(token);
  const n = resolved.length;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="viewAllConfirm" class="guest-auth-overlay" onclick="if(event.target===this)document.getElementById('viewAllConfirm')?.remove()">
      <div class="guest-auth-card" role="dialog" aria-modal="true" style="max-width:380px;">
        <button class="auth-close" onclick="document.getElementById('viewAllConfirm')?.remove()">×</button>
        <div class="guest-auth-kicker">Full Paper</div>
        <h2 style="font-size:1.15rem;margin-bottom:0.5rem;">${title}</h2>
        <p style="font-size:0.88rem;color:var(--text-muted);line-height:1.6;">
          Shows all <strong style="color:var(--text);">${n} question${n!==1?'s':''}</strong>.
          Tap <strong style="color:var(--text);">Show Answer</strong> next to any question to reveal its answer and explanation.
        </p>
        <div class="guest-auth-actions">
          <button class="primary" onclick="document.getElementById('viewAllConfirm')?.remove();openViewAll(window._viewAllPending.q,window._viewAllPending.t,window._viewAllPending.b,window._viewAllPending.k)">Show Full Paper →</button>
          <button class="guest-primary" onclick="document.getElementById('viewAllConfirm')?.remove()">Cancel</button>
        </div>
      </div>
    </div>
  `);
  window._viewAllPending = { q: resolved, t: title, b: backScreen, k: token };
}

function openViewAll(questions, title, backScreen, token) {
  state.viewAllQuestions = questions;
  state.viewAllTitle = title;
  state.viewAllBack = backScreen || 'home';
  state.viewAllToken = typeof token === 'string' ? token : '';
  state.screen = 'viewAll';
  renderApp();
}
window.openViewAll = openViewAll;

// Start quiz directly from the browse/view-all screen
function startViewAllQuiz() {
  const token = state.viewAllToken;
  const unitMatch = token.match(/^pastUnit_unit_(\d+)$/);
  if (unitMatch) {
    const id = Number(unitMatch[1]);
    state.appMode = 'pastpaper';
    state.topics  = [id];
    state.screen  = 'home';
    showModePickerModal('pastpaper');
    return;
  }
  const yearMatch = token.match(/^pastPaper_year_(.+)$/);
  if (yearMatch) {
    startPaper(yearMatch[1]);
    return;
  }
}
window.startViewAllQuiz = startViewAllQuiz;

function selectAllTopics() {
  const s = subj();
  state.topics = Object.keys(s.units).map(Number).filter(id => s.pastUnit.filter(q => q.unit === id).length > 0);
  renderApp();
}
function deselectAllTopics() {
  const s = subj();
  const active = Object.keys(s.units).map(Number).filter(id => s.pastUnit.filter(q => q.unit === id).length > 0);
  if (active.length > 0) state.topics = [active[0]];
  renderApp();
}
function selectAllTargetTopics() {
  const s = subj();
  const pool = targetPoolForSubject(s);
  state.topics = Object.keys(s.units).map(Number).filter(id => pool.filter(q => q.unit === id).length > 0);
  renderApp();
}
function deselectAllTargetTopics() {
  const s = subj();
  const pool = targetPoolForSubject(s);
  const active = Object.keys(s.units).map(Number).filter(id => pool.filter(q => q.unit === id).length > 0);
  if (active.length > 0) state.topics = [active[0]];
  renderApp();
}

function toggleTopic(id) {
  // Don't allow selecting units that have no questions
  const s = subj();
  if (s.pastUnit.filter(q => q.unit === id).length === 0) return;
  if (state.topics.includes(id) && state.topics.length > 1) {
    state.topics = state.topics.filter(t => t !== id);
  } else if (!state.topics.includes(id)) {
    state.topics.push(id);
  }
  renderApp();
}

function toggleTargetTopic(id) {
  const s = subj();
  const pool = targetPoolForSubject(s);
  if (pool.filter(q => q.unit === id).length === 0) return;
  if (state.topics.includes(id) && state.topics.length > 1) {
    state.topics = state.topics.filter(t => t !== id);
  } else if (!state.topics.includes(id)) {
    state.topics.push(id);
  }
  renderApp();
}

function setMode(m) { state.mode = m; renderApp(); }

// ── Spaced Repetition ─────────────────────────────────────────────────────────
function buildSmartPool(questions, subject) {
  const cfg = window._appSettings || {};
  const W = {
    never:      Math.max(0, Number(cfg.sr_weight_never      ?? 5)),
    correct:    Math.max(0, Number(cfg.sr_weight_correct    ?? 0)),
    wrong:      Math.max(0, Number(cfg.sr_weight_wrong      ?? 3)),
    multiWrong: Math.max(0, Number(cfg.sr_weight_multi_wrong ?? 5)),
  };
  const perf = typeof getPerfCache === 'function' ? getPerfCache() : {};

  const scored = questions.map(q => {
    const hist = answerHistory[q.id];
    const p    = perf[q.id];
    let w;
    if (!hist) {
      w = W.never;
    } else if (hist.correct) {
      w = W.correct;
    } else if (p && Number(p.incorrect_count) > 1) {
      w = W.multiWrong;
    } else {
      w = W.wrong;
    }
    return { q, w };
  });

  // Filter out zero-weight (mastered) — fallback to all if everything is mastered
  const active = scored.filter(x => x.w > 0);
  const pool   = (active.length > 0 ? active : scored).map(x => x);

  // Weighted shuffle: repeat each entry by weight then shuffle
  const bag = [];
  for (const { q, w } of pool) for (let i = 0; i < w; i++) bag.push(q);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  // Deduplicate while preserving weighted order
  const seen = new Set();
  return bag.filter(q => { if (seen.has(q.id)) return false; seen.add(q.id); return true; })
            .map(q => ({...q}));
}

function setQuestionCount(value, maxAvailable) {
  state.count = clampQuestionCount(value, maxAvailable);
  renderApp();
}

function renderQuestionCountPicker(maxAvailable, accent = 'var(--accent)') {
  const max = Math.max(1, parseInt(maxAvailable, 10) || 1);
  const presets = [20, 50, 100];
  const isCustom = !presets.includes(state.count);
  const chip = n => `
    <button type="button"
      class="question-count-chip ${state.count === n ? 'selected' : ''}"
      onclick="setQuestionCount(${n}, ${max})">
      ${n}
    </button>`;

  return `
    <div class="question-count-picker" style="--count-accent:${accent};">
      <div class="question-count-head">
        <span>Questions</span>
        <small>${max} available</small>
      </div>
      <div class="question-count-options">
        ${presets.map(chip).join('')}
        <label class="question-count-custom ${isCustom ? 'selected' : ''}">
          <span>Custom</span>
          <input type="number" min="1" max="${max}" value="${isCustom ? state.count : ''}"
            placeholder="${Math.min(20, max)}"
            onchange="setQuestionCount(this.value, ${max})"
            onfocus="this.select()">
        </label>
      </div>
    </div>`;
}

function routeSubjectKey() {
  return SUBJECTS[state.currentSubject]?.key || state.currentSubject || 'materials';
}

function routeForState() {
  const subject = routeSubjectKey();
  const routes = {
    landing: '/',
    categorySubjects: state.categoryMode === 'target' ? '/target-quiz' : '/past-papers',
    subjectHome: `/subjects/${subject}`,
    pastpaperHome: `/subjects/${subject}/past-papers`,
    home: `/subjects/${subject}/past-papers/units`,
    paperHome: `/subjects/${subject}/past-papers/full`,
    targetHome: `/subjects/${subject}/target`,
    questionDirectory: '/questions',
    quiz: `/quiz/${subject}`,
    examQuiz: `/quiz/${subject}/exam`,
    results: `/quiz/${subject}/results`,
    allDone: `/quiz/${subject}/all-done`,
    history: '/history',
    stats: '/stats',
    dashboard: '/dashboard',
    profile: '/profile',
    analytics: '/analytics',
    weakAreas: '/weak-areas',
    achievements: '/achievements',
    leaderboards: '/leaderboards',
    admin: '/admin'
  };
  return routes[state.screen] || '/';
}

function canUseAppHistory() {
  return location.protocol === 'http:' || location.protocol === 'https:';
}

function syncRouteFromState(replace = false) {
  if (_isApplyingRoute || !_routerReady || !canUseAppHistory() || !history.pushState) return;
  const path = routeForState();
  if (path === _lastRoutePath && location.pathname === path) return;
  const payload = {
    screen: state.screen,
    subject: state.currentSubject,
    appMode: state.appMode,
    categoryMode: state.categoryMode,
    categoryEntry: state.categoryEntry,
    mode: state.mode,
    targetHardOnly: state.targetHardOnly,
    topics: Array.isArray(state.topics) ? [...state.topics] : []
  };
  const method = replace || !_lastRoutePath ? 'replaceState' : 'pushState';
  history[method](payload, '', path);
  _lastRoutePath = path;
}

function setupRouteDefaults(subjectKey) {
  const s = SUBJECTS[subjectKey];
  if (!s) return;
  state.currentSubject = subjectKey;
  state.topics = Object.keys(s.units).map(Number);
}

function applyRoute(path, routeState) {
  const parts = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  let nextScreen = 'landing';
  let subjectKey = routeState?.subject || state.currentSubject;
  let nextAppMode = routeState?.appMode ?? state.appMode;
  let nextCategoryEntry = routeState?.categoryEntry || '';

  if (parts[0] === 'subjects' && parts[1] && SUBJECTS[parts[1]]) {
    subjectKey = parts[1];
    setupRouteDefaults(subjectKey);
    if (parts[2] === 'past-papers' && parts[3] === 'units') {
      nextScreen = 'home';
      nextAppMode = 'pastpaper';
    } else if (parts[2] === 'past-papers' && parts[3] === 'full') {
      nextScreen = 'paperHome';
      nextAppMode = 'fullpaper';
      state.topics = [];
    } else if (parts[2] === 'past-papers') {
      nextScreen = 'pastpaperHome';
    } else if (parts[2] === 'target') {
      nextScreen = 'targetHome';
      nextAppMode = 'target';
    } else {
      nextScreen = 'subjectHome';
    }
  } else if (parts[0] === 'quiz' && parts[1] && SUBJECTS[parts[1]]) {
    subjectKey = parts[1];
    if (parts[2] === 'results') nextScreen = state.questions.length ? 'results' : 'subjectHome';
    else if (parts[2] === 'all-done') nextScreen = 'allDone';
    else nextScreen = state.questions.length ? 'quiz' : 'subjectHome';
  } else {
    const simpleRoutes = {
      history: 'history',
      stats: 'stats',
      dashboard: 'dashboard',
      profile: 'profile',
      analytics: 'analytics',
      'weak-areas': 'weakAreas',
      achievements: 'achievements',
      leaderboards: 'leaderboards',
      'past-papers': 'categorySubjects',
      'target-quiz': 'categorySubjects',
      questions: 'questionDirectory',
      admin: 'admin'
    };
    nextScreen = simpleRoutes[parts[0]] || 'landing';
    if (parts[0] === 'past-papers') state.categoryMode = 'pastpaper';
    if (parts[0] === 'target-quiz') state.categoryMode = 'target';
  }

  state.currentSubject = subjectKey;
  if (Array.isArray(routeState?.topics)) state.topics = routeState.topics;
  if (routeState?.mode) state.mode = routeState.mode;
  if (routeState?.categoryMode) state.categoryMode = routeState.categoryMode;
  state.categoryEntry = nextCategoryEntry;
  if (typeof routeState?.targetHardOnly === 'boolean') state.targetHardOnly = routeState.targetHardOnly;
  state.appMode = nextAppMode;
  state.screen = nextScreen;
  _isApplyingRoute = true;
  renderApp();
  _isApplyingRoute = false;
  _lastRoutePath = location.pathname;
}

function confirmLeaveActiveQuiz() {
  document.getElementById('routeLeaveQuizPrompt')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="routeLeaveQuizPrompt" class="guest-auth-overlay">
      <div class="guest-auth-card guest-confirm-card" role="dialog" aria-modal="true">
        <button class="auth-close" onclick="document.getElementById('routeLeaveQuizPrompt')?.remove()">×</button>
        <div class="guest-auth-kicker">Active quiz</div>
        <h2>Leave this quiz?</h2>
        <p>Your current attempt will stop. Answer history already submitted will stay, but this running quiz will end.</p>
        <div class="guest-auth-actions">
          <button class="guest-primary" onclick="confirmRouteLeaveQuiz()">Leave quiz</button>
          <button class="primary" onclick="cancelRouteLeaveQuiz()">Stay here</button>
        </div>
      </div>
    </div>
  `);
}

function confirmRouteLeaveQuiz() {
  document.getElementById('routeLeaveQuizPrompt')?.remove();
  document.body.classList.remove('exam-active');
  _allowQuizBackOnce = true;
  stopTimer();
  if (canUseAppHistory()) history.back();
  else {
    state.screen = state.appMode === 'target' ? 'targetHome' : (state.appMode === 'fullpaper' ? 'paperHome' : 'home');
    renderApp();
  }
}

function cancelRouteLeaveQuiz() {
  document.getElementById('routeLeaveQuizPrompt')?.remove();
  syncRouteFromState(true);
}

function initRouter() {
  if (_routerReady) return;
  if (!canUseAppHistory()) {
    _routerReady = false;
    renderApp();
    return;
  }
  _routerReady = true;
  if (location.hash.startsWith('#subject-')) {
    const subjectKey = location.hash.replace('#subject-', '');
    if (SUBJECTS[subjectKey]) {
      history.replaceState({}, '', '/');
      enterSubject(subjectKey);
      return;
    }
  }
  applyRoute(location.pathname, history.state);
  syncRouteFromState(true);
  window.addEventListener('popstate', event => {
    if (state.screen === 'quiz' && !_allowQuizBackOnce) {
      history.pushState(history.state, '', routeForState());
      _lastRoutePath = location.pathname;
      confirmLeaveActiveQuiz();
      return;
    }
    _allowQuizBackOnce = false;
    applyRoute(location.pathname, event.state || {});
  });
}

window.confirmRouteLeaveQuiz = confirmRouteLeaveQuiz;
window.cancelRouteLeaveQuiz = cancelRouteLeaveQuiz;

function renderMath() {
  if (typeof renderMathInElement !== 'function') {
    if (!renderMath._retryCount) renderMath._retryCount = 0;
    if (renderMath._retryCount < 12) {
      renderMath._retryCount++;
      setTimeout(renderMath, 180);
    }
    return;
  }
  renderMath._retryCount = 0;
  const target = document.getElementById('app');
  if (!target) return;
  renderMathInElement(target, {
    delimiters: [
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false},
      {left: '\\(', right: '\\)', display: false},
      {left: '\\[', right: '\\]', display: true}
    ],
    throwOnError: false,
    output: 'html'
  });
}

let revealObserver = null;
function applyScrollReveal() {
  const root = document.getElementById('app');
  if (!root) return;
  const revealSelectors = state.screen === 'landing'
    ? ['.lp-feature-showcase', '.lp-section-header', '.lp-tile']
    : ['.results', '.results-stats .rs-card', '.review-item', '.target-stat-card'];
  const items = root.querySelectorAll(revealSelectors.join(','));
  if (!items.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el => el.classList.add('reveal-in'));
    return;
  }
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach((el, i) => {
    el.classList.add('reveal-item');
    el.style.setProperty('--reveal-delay', Math.min(i % 9, 8) * 32 + 'ms');
    revealObserver.observe(el);
  });
}

let _renderScheduled = false;
function renderApp() {
  // Debounce: if a render is already queued for this animation frame, skip.
  // This collapses multiple synchronous or near-simultaneous renderApp() calls
  // (e.g. from button handlers or back-to-back state updates) into one paint.
  if (_renderScheduled) return;
  _renderScheduled = true;
  requestAnimationFrame(() => {
    _renderScheduled = false;
    _doRenderApp();
  });
}
function _doRenderApp() {
  syncRouteFromState();
  const app = document.getElementById('app');
  const back = document.getElementById('nav-back');
  const animateView = state.screen !== 'quiz';
  if (app) app.classList.remove('app-view-enter');
  if (state.screen === 'landing') {
    back.innerHTML = '';
  } else if (['history','stats','dashboard','profile','analytics','weakAreas','achievements','leaderboards','questionDirectory','admin','categorySubjects'].includes(state.screen)) {
    back.innerHTML = `<button class="btn-home" onclick="state.screen='landing';renderApp()">&larr; Home</button>`;
  } else if (state.screen === 'subjectHome') {
    back.innerHTML = `<button class="btn-home" onclick="state.screen='categorySubjects';renderApp()">&larr; Subjects</button>`;
  } else if (state.screen === 'viewAll') {
    back.innerHTML = `<button class="btn-home" onclick="state.screen=state.viewAllBack;renderApp()">&larr; Back</button>`;
  } else if (state.screen === 'home' || state.screen === 'targetHome' || state.screen === 'paperHome') {
    const fromCategory = (state.screen === 'home' && state.categoryEntry === 'pastpaper')
      || (state.screen === 'paperHome' && state.categoryEntry === 'pastpaper')
      || (state.screen === 'targetHome' && state.categoryEntry === 'target');
    const backTarget = fromCategory ? 'categorySubjects' : 'subjectHome';
    const backLabel = fromCategory ? 'Subjects' : subj().label;
    back.innerHTML = `<button class="btn-home" onclick="state.screen='${backTarget}';renderApp()">&larr; ${backLabel}</button>`;
  } else if (state.screen === 'examQuiz') {
    back.innerHTML = `<button class="btn-home" onclick="confirmLeaveActiveQuiz()">&larr; Leave Exam</button>`;
  } else if (state.screen === 'quiz' || state.screen === 'results' || state.screen === 'allDone') {
    const dest = state.appMode === 'target' ? 'targetHome'
      : state.appMode === 'fullpaper' ? 'paperHome' : 'home';
    const label = state.appMode === 'target' ? '&larr; Target Quiz'
      : state.appMode === 'fullpaper' ? '&larr; Full Papers' : '&larr; Past Paper';
    back.innerHTML = `<button class="btn-home" onclick="stopTimer();state.screen='${dest}';renderApp()">${label}</button>`;
  }

  if (app && screenNeedsSubjectData(state.screen) && !isSubjectLoaded(state.currentSubject)) {
    app.innerHTML = renderSubjectLoading();
    ensureSubjectData(state.currentSubject)
      .then(() => {
        if (screenNeedsSubjectData(state.screen)) renderApp();
      })
      .catch(() => {
        if (screenNeedsSubjectData(state.screen)) renderApp();
      });
    return;
  }

  if (state.screen === 'landing') {
    app.innerHTML = renderLanding();
    if (_landingAnimDone) {
      app.classList.add('landing-no-anim');
    } else {
      _landingAnimDone = true;
      app.classList.remove('landing-no-anim');
    }
  }
  else if (state.screen === 'subjectHome') app.innerHTML = renderSubjectHome();
  else if (state.screen === 'categorySubjects') app.innerHTML = renderCategorySubjects();
  else if (state.screen === 'pastpaperHome') app.innerHTML = renderPastpaperHome();
  else if (state.screen === 'paperHome') app.innerHTML = renderPaperHome();
  else if (state.screen === 'home') app.innerHTML = renderHome();
  else if (state.screen === 'targetHome') app.innerHTML = renderTargetHome();
  else if (state.screen === 'quiz') app.innerHTML = renderQuiz();
  else if (state.screen === 'results') app.innerHTML = renderResults();
  else if (state.screen === 'allDone') app.innerHTML = renderAllDone();
  else if (state.screen === 'history') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderHistory().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'stats') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderStats().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'dashboard') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderDashboard().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'profile') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderProfilePage().then(html => {
      app.innerHTML = html;
      applyScrollReveal();
      if (typeof maybeShowProfileTutorial === 'function') maybeShowProfileTutorial();
    });
  }
  else if (state.screen === 'analytics') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderAnalyticsPage().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'weakAreas') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderWeakAreasPage().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'achievements') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderAchievementsPage().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'leaderboards') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading...</div>';
    renderLeaderboardsPage().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'questionDirectory') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading question directory...</div>';
    renderQuestionDirectoryPage().then(html => { app.innerHTML = html; applyScrollReveal(); setTimeout(renderMath, 60); });
  }
  else if (state.screen === 'admin') {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Loading admin data...</div>';
    renderAdminPage().then(html => { app.innerHTML = html; applyScrollReveal(); });
  }
  else if (state.screen === 'examQuiz') app.innerHTML = renderExamQuiz();
  else if (state.screen === 'viewAll') app.innerHTML = renderViewAll();
  // Re-apply body overflow setting after any render (survives innerHTML swap since zoom is on #app)
  if (typeof window._applyAppZoom === 'function' && typeof window._getAppScaler === 'function') {
    if (!window._getAppScaler()) window._applyAppZoom();
  }
  if (animateView && app) {
    void app.offsetWidth;
    app.classList.add('app-view-enter');
  }
  applyScrollReveal();
  setTimeout(renderMath, 120);
  if (state.screen === 'landing') setTimeout(maybeShowAppTutorial, 450);
}

function appScrollToElement(id, duration = 620) {
  const target = document.getElementById(id);
  if (!target) return;
  const startY = window.scrollY || document.documentElement.scrollTop || 0;
  const nav = document.querySelector('.nav-bar');
  const navH = nav ? nav.getBoundingClientRect().height : 0;
  const targetY = Math.max(0, target.getBoundingClientRect().top + startY - navH - 16);
  const distance = targetY - startY;

  if (Math.abs(distance) < 4) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, targetY);
    return;
  }

  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + distance * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

window.appScrollToElement = appScrollToElement;

function initCompactNavOnScroll() {
  const nav = document.querySelector('.nav-bar');
  if (!nav || nav.dataset.compactScrollReady === '1') return;
  nav.dataset.compactScrollReady = '1';
  let scheduled = false;
  let lastCompact = false;
  const update = () => {
    scheduled = false;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const compact = lastCompact ? y > 38 : y > 96;
    if (compact === lastCompact) return;
    lastCompact = compact;
    nav.classList.toggle('nav-compact', compact);
    document.body.classList.toggle('nav-is-compact', compact);
  };
  const requestUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCompactNavOnScroll, { once: true });
} else {
  initCompactNavOnScroll();
}

function enterSubject(subjectKey) {
  return enterSubjectMode(subjectKey, 'subjectHome');
}

function enterSubjectMode(subjectKey, destination = 'subjectHome') {
  const s = SUBJECTS[subjectKey];
  if (!s || subjectTotalCount(subjectKey) === 0) return;
  const finish = () => {
    state.currentSubject = subjectKey;
    state.topics = Object.keys(SUBJECTS[subjectKey].units).map(Number);
    state.categoryEntry = destination === 'pastpaper' || destination === 'target' ? destination : '';
    if (destination === 'pastpaper') {
      state.appMode = 'fullpaper';
      state.topics = [];
      state.screen = 'paperHome';
    } else if (destination === 'target') {
      state.appMode = 'target';
      state.targetHardOnly = false;
      state.screen = 'targetHome';
    } else {
      state.screen = 'subjectHome';
    }
    renderApp();
  };
  const loadData = ensureSubjectData(subjectKey);
  const loadHistory = dbLoadAnswerHistory(subjectKey)
    .then(h => { answerHistory = h; })
    .catch(() => { answerHistory = {}; });
  // Load flags + performance data in background
  if (typeof dbLoadFlags === 'function')       dbLoadFlags(subjectKey).catch(() => {});
  if (typeof dbLoadPerformance === 'function') dbLoadPerformance(subjectKey).catch(() => {});
  const splash = SUBJECT_TRANSITIONS[subjectKey];
  if (!splash || hasSeenTransition(subjectKey)) {
    Promise.allSettled([loadData, loadHistory]).finally(finish);
    return;
  }
  markTransitionSeen(subjectKey);
  Promise.race([preloadImage(rootAssetPath(splash.image)), wait(900)]).finally(() => {
    showSubjectTransition(splash);
    setTimeout(() => Promise.allSettled([loadData, loadHistory]).finally(finish), 240);
  });
}

window.enterSubject = enterSubject;
window.enterSubjectMode = enterSubjectMode;

function openCategorySubjectPicker(mode) {
  state.categoryMode = mode === 'target' ? 'target' : 'pastpaper';
  state.categoryEntry = '';
  state.screen = 'categorySubjects';
  renderApp();
}

function selectCategorySubject(subjectKey) {
  enterSubjectMode(subjectKey, state.categoryMode === 'target' ? 'target' : 'pastpaper');
}

window.openCategorySubjectPicker = openCategorySubjectPicker;
window.selectCategorySubject = selectCategorySubject;

document.addEventListener('click', event => {
  const tile = event.target.closest?.('[data-subject-key]');
  if (!tile || tile.classList.contains('lp-tile-empty')) return;
  const subjectKey = tile.getAttribute('data-subject-key');
  if (!subjectKey) return;
  event.preventDefault();
  enterSubject(subjectKey);
});

document.addEventListener('click', event => {
  const actionEl = event.target.closest?.('[data-nav-action]');
  if (!actionEl) return;
  const action = actionEl.getAttribute('data-nav-action');
  if (!action) return;
  event.preventDefault();

  if (action === 'pastpaperHome') {
    state.categoryEntry = '';
    state.screen = 'pastpaperHome';
  } else if (action === 'targetHome') {
    state.categoryEntry = '';
    state.appMode = 'target';
    state.targetHardOnly = false;
    state.topics = Object.keys(SUBJECTS[state.currentSubject].units).map(Number);
    state.screen = 'targetHome';
  } else if (action === 'pastpaperUnits') {
    state.categoryEntry = '';
    state.appMode = 'pastpaper';
    state.topics = Object.keys(SUBJECTS[state.currentSubject].units).map(Number);
    state.screen = 'home';
  } else if (action === 'fullPapers') {
    state.categoryEntry = '';
    state.appMode = 'fullpaper';
    state.topics = [];
    state.screen = 'paperHome';
  } else if (action === 'questionDirectory') {
    state.categoryEntry = '';
    state.directorySubject = state.currentSubject || 'all';
    state.directorySource = 'all';
    state.directoryQuery = '';
    state.directoryOpenId = '';
    state.screen = 'questionDirectory';
  } else {
    return;
  }

  renderApp();
});

function showSubjectTransition(config) {
  document.getElementById('subjectTransition')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'subjectTransition';
  overlay.className = 'subject-transition-overlay';
  overlay.innerHTML = `
    <div class="subject-transition-card">
      <div class="subject-transition-title">${config.title}</div>
      <img class="subject-transition-img" src="${rootAssetPath(config.image)}" alt="${config.title}" loading="eager" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
      <div class="subject-transition-fallback" style="display:none;">Add image: ${config.image}</div>
      ${config.caption ? `<div class="subject-transition-caption">${config.caption}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('closing'), 1650);
  setTimeout(() => {
    overlay.remove();
  }, 2000);
}

function renderUnitChipPicker({ units, sourcePool, selected, answeredIds, toggleFn, accent, emptyLabel = 'Coming soon' }) {
  const unitIds = Object.keys(units).map(Number).sort((a, b) => {
    const aQ = sourcePool.filter(q => q.unit === a).length;
    const bQ = sourcePool.filter(q => q.unit === b).length;
    if ((aQ === 0) !== (bQ === 0)) return (aQ === 0) - (bQ === 0);
    return a - b;
  });
  return `<div class="unit-chip-grid" style="--unit-accent:${accent};">
    ${unitIds.map(id => {
      const uQs = sourcePool.filter(q => q.unit === id);
      const done = uQs.filter(q => answeredIds.includes(q.id)).length;
      const isEmpty = uQs.length === 0;
      const isSelected = selected.includes(id);
      return `<button type="button"
        class="unit-chip ${isSelected ? 'selected' : ''} ${isEmpty ? 'disabled' : ''}"
        ${isEmpty ? 'disabled' : `onclick="${toggleFn}(${id})"`}
        title="Unit ${String(id).padStart(2, '0')} · ${units[id]}">
        <span class="unit-chip-code">Unit ${String(id).padStart(2, '0')}</span>
        <span class="unit-chip-title">${units[id]}</span>
        <span class="unit-chip-meta">${isEmpty ? emptyLabel : `${done}/${uQs.length} answered`}</span>
      </button>`;
    }).join('')}
  </div>`;
}

function renderTargetHome() {
  const s = subj();
  const hardCount = s.targetHard.length;
  const normalCount = s.targetNormal.length;
  const allAnswered = Object.keys(answerHistory);
  const sourcePool = targetPoolForSubject(s);
  const units = s.units;

  const selectedPool = sourcePool.filter(q => state.topics.includes(q.unit));
  const rem = selectedPool.filter(q => !allAnswered.includes(q.id)).length;
  const maxCount = selectedPool.length;
  const accent = state.targetHardOnly ? '#f87171' : '#43d7ff';

  return `
  <div class="header" style="padding:2rem 0 1.5rem;">
    <div class="header-badge" style="background:#10252d;border-color:#43d7ff44;color:#43d7ff;">${s.icon} ${s.label} - Target Questions</div>
    <h1 style="margin-bottom:0.5rem;">${targetModeLabel()}</h1>
    <p>${state.targetHardOnly ? `<span style="color:#f87171;font-weight:600;">Hard target questions - ${hardCount} total</span>` : `Normal target questions - ${normalCount} total`}</p>
  </div>

  <div class="mode-row" style="margin:0 0 1.2rem;">
    <button class="mode-btn ${!state.targetHardOnly?'active':''}" onclick="state.targetHardOnly=false;selectAllTargetTopics()">Normal Target</button>
    <button class="mode-btn ${state.targetHardOnly?'active':''}" onclick="state.targetHardOnly=true;selectAllTargetTopics()" style="${state.targetHardOnly?'background:#c0392b;border-color:#c0392b;':''}">Hard Target</button>
  </div>

  <div class="unit-chip-panel">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:0.75rem;">
    <h2 style="font-size:1rem;margin:0;color:var(--text);">Select Units</h2>
    <div style="display:flex;gap:8px;">
    <button onclick="selectAllTargetTopics()" style="background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);padding:4px 12px;font-size:0.74rem;cursor:pointer;font-family:inherit;transition:border-color 0.15s,color 0.15s;" onmouseover="this.style.borderColor='#f87171';this.style.color='#f87171'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-muted)'">Select All</button>
    <button onclick="deselectAllTargetTopics()" style="background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);padding:4px 12px;font-size:0.74rem;cursor:pointer;font-family:inherit;transition:border-color 0.15s,color 0.15s;" onmouseover="this.style.borderColor='var(--border-hover)';this.style.color='var(--text)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-muted)'">Deselect All</button>
    </div>
  </div>
  ${renderUnitChipPicker({ units, sourcePool, selected: state.topics, answeredIds: allAnswered, toggleFn: 'toggleTargetTopic', accent, emptyLabel: 'No questions' })}
  </div>

  <div style="margin:0.8rem 0;font-size:0.85rem;color:var(--text-muted);">
    ${selectedPool.length === 0
      ? `<span style="color:#f87171;">Select at least one unit to start.</span>`
      : rem > 0
        ? `<span style="color:var(--accent-light);">${rem} unseen</span> of ${selectedPool.length} questions in selected units`
        : `<span style="color:var(--correct);">All ${selectedPool.length} questions answered!</span>`
    }
  </div>

  <div style="background:#121827;border:1px solid #263047;border-left:3px solid ${accent};border-radius:0 12px 12px 0;padding:0.9rem 1.1rem;margin-bottom:1.5rem;font-size:0.85rem;color:var(--text-muted);">
    <strong style="color:${accent};">${targetModeLabel()}:</strong> Already-answered questions are tracked for your statistics.
  </div>

  ${renderQuestionCountPicker(maxCount, accent)}
  <button class="start-btn hov-target-red" style="background:${accent};margin-top:1.5rem;" onclick="showTimerModal('target')">Start ${targetModeLabel()} &rarr;</button>
  `;
}


function buildReviewText() {
  const pct = Math.round((state.score/state.questions.length)*100) || 0;
  const mode = state.appMode === 'target' ? 'Target Quiz' : 'Past Paper Quiz';
  const timeStr = state.countdownLimit > 0 && state.countdownRemaining === 0
    ? "Time\'s up!" : formatTime(state.timerSeconds);
  let lines = [
    `${subj().label} Quiz — ${mode}`,
    `Score: ${state.score}/${state.questions.length} (${pct}%)   Time: ${timeStr}`,
    `Date: ${new Date().toLocaleDateString()}`,
    '─'.repeat(48)
  ];
  state.results.forEach((r, i) => {
    const q = r.question;
    lines.push(`\nQ${i+1}. ${q.text.replace(/\n/g,' ')}`);
    lines.push(`   Your answer: ${q.opts[r.selected]}  ${r.correct ? '✓' : '✗'}`);
    if (!r.correct) lines.push(`   Correct:     ${q.opts[q.ans]}`);
    lines.push(`   Explanation: ${q.exp}`);
  });
  return lines.join('\n');
}

function buildReviewHTML() {
  const pct = Math.round((state.score/state.questions.length)*100) || 0;
  const grade = getGrade(pct);
  const mode = state.appMode === 'target' ? 'Target Quiz' : 'Past Paper Quiz';
  const timeStr = state.countdownLimit > 0 && state.countdownRemaining === 0
    ? "Time's up!" : formatTime(state.timerSeconds);
  const wrong = state.results.filter(r => !r.correct).length;
  const C = (tag, attrs, inner) => '<' + tag + (attrs ? ' ' + attrs : '') + '>' + inner + '</' + tag + '>';
  const statCard = (val, lbl, color) =>
    C('div','style="background:#1a1d27;border:1px solid #2e3348;border-radius:10px;padding:0.8rem 1.2rem;text-align:center;"',
      C('div','style="font-size:1.6rem;font-weight:700;color:' + color + ';"', val) +
      C('div','style="font-size:0.78rem;color:#8b90a8;"', lbl));
  const rows = state.results.map((r, i) => {
    const q = r.question;
    const bg = r.correct ? '#0d2b1a' : '#2b0d0d';
    const bdr = r.correct ? '#1a5c35' : '#5c1a1a';
    const icon = r.correct ? '&#10003;' : '&#10007;';
    const iconColor = r.correct ? '#4ade80' : '#f87171';
    const qText = q.text.split('<').join('&lt;').split('\n').join('<br>');
    const wrongLine = !r.correct
      ? C('div','style="font-size:0.85rem;color:#aaa;"','Correct: ' + C('strong','style="color:#4ade80;"', q.opts[q.ans]))
      : '';
    return C('div','style="background:' + bg + ';border:1px solid ' + bdr + ';border-radius:10px;padding:1rem;margin-bottom:10px;"',
      C('div','style="font-weight:600;margin-bottom:6px;font-size:0.93rem;"',
        icon + ' ' + C('span','style="color:' + iconColor + ';"', icon) + ' Q' + (i+1) + '. ' + qText) +
      C('div','style="font-size:0.85rem;color:#aaa;"','Your answer: ' + C('strong','style="color:' + iconColor + ';"', q.opts[r.selected])) +
      wrongLine +
      C('div','style="font-size:0.82rem;color:#888;margin-top:6px;border-top:1px solid #333;padding-top:6px;"', q.exp)
    );
  }).join('');
  const css = 'body{font-family:system-ui,sans-serif;background:#0f1117;color:#e8eaf4;max-width:760px;margin:0 auto;padding:2rem 1rem;}h1{font-size:1.6rem;margin-bottom:0.3rem;}p{color:#8b90a8;}';
  const statsRow = C('div','style="display:flex;gap:16px;margin:1.2rem 0;flex-wrap:wrap;"',
    statCard(pct + '%', 'Score', grade.color) +
    statCard(state.score, 'Correct', '#4ade80') +
    statCard(wrong, 'Incorrect', '#f87171') +
    statCard(timeStr, 'Time', '#8fa6f5'));
  const body = C('h1','','Quiz Review') +
    C('p','', mode + ' &nbsp;-&nbsp; ' + new Date().toLocaleDateString()) +
    statsRow +
    C('h2','style="font-size:1.1rem;margin:1.5rem 0 1rem;"','All Questions') +
    rows;
  return '<!DOCTYPE html>' +
    C('html','',
      C('head','', C('meta','charset="UTF-8"','') + C('title','','Quiz Review \u2014 ' + mode) + C('style','', css)) +
      C('body','', body));
}

function saveReviewAsHTML() {
  const html = buildReviewHTML();
  const blob = new Blob([html], {type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const mode = state.appMode === 'target' ? 'target' : 'pastpaper';
  a.download = `quiz-review-${mode}-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function shareReview() {
  const text = buildReviewText();
  if (navigator.share) {
    navigator.share({ title: 'Quiz Review', text }).catch(()=>{});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = [...document.querySelectorAll('.results-btns button')].find(b => b.textContent.includes('Share'));
      if (btn) { const orig = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(()=>btn.textContent=orig, 2000); }
    }).catch(()=>alert('Could not copy to clipboard.'));
  } else {
    alert(text.slice(0, 300) + '\n\n[Open browser console and call buildReviewText() for full text]');
  }
}


// ── Timer Modal ──────────────────────────────────────────────────────────────
let _pendingStartMode = null;

const TIMER_PRESETS = [
  { mins: 5,  label: 'Quick' },
  { mins: 10, label: 'Standard' },
  { mins: 15, label: 'Relaxed' },
  { mins: 20, label: 'Thorough' },
  { mins: 30, label: 'Extended' },
  { mins: 45, label: 'Marathon' }
];

let _selectedTimerMins = null;

function appTutorialStorageKey() {
  let userPart = 'guest';
  try {
    if (typeof getUserId === 'function' && getUserId()) userPart = getUserId();
  } catch(e) {}
  return 'mora_quiz_app_tutorial_v2_seen_' + userPart;
}

function hasSeenAppTutorial() {
  try { return localStorage.getItem(appTutorialStorageKey()) === '1'; } catch(e) { return true; }
}

function markAppTutorialSeen() {
  try { localStorage.setItem(appTutorialStorageKey(), '1'); } catch(e) {}
}

function lockTutorialInteraction() {
  document.body.classList.add('app-tutorial-locked');
}

function unlockTutorialInteraction() {
  if (!document.getElementById('appTutorialOverlay') && !document.getElementById('profileTutorialOverlay')) {
    document.body.classList.remove('app-tutorial-locked');
  }
}

function maybeShowAppTutorial() {
  if (_appTutorialActive || hasSeenAppTutorial() || document.getElementById('authModal')) return;
  if (state.screen !== 'landing') return;
  startAppTutorial();
}

const APP_TUTORIAL_STEPS = [
  {
    title: 'Choose a subject',
    text: 'Start by picking the subject you want to practise. Active subjects are saved with your local progress.',
    selector: '#subjectCards',
    action: async () => {
      state.screen = 'landing';
      renderApp();
    }
  },
  {
    title: 'Choose quiz type',
    text: 'Inside a subject, choose Past Papers for exam questions or Target Quiz for curated hard practice.',
    selector: '.quiz-mode-grid',
    action: async () => {
      await ensureSubjectData('materials').catch(() => {});
      state.currentSubject = 'materials';
      state.topics = Object.keys(SUBJECTS.materials.units).map(Number);
      state.screen = 'subjectHome';
      renderApp();
    }
  },
  {
    title: 'Select units and question count',
    text: 'Pick the units you want. Selected cards look different, and non-full-paper quizzes let you choose the question count.',
    selector: '.topic-grid',
    action: async () => {
      await ensureSubjectData('materials').catch(() => {});
      state.currentSubject = 'materials';
      state.appMode = 'pastpaper';
      state.topics = Object.keys(SUBJECTS.materials.units).map(Number).filter(id => SUBJECTS.materials.pastUnit.some(q => q.unit === id));
      state.screen = 'home';
      renderApp();
    }
  },
  {
    title: 'Set timer and start',
    text: 'When you press Start Quiz, choose a timer or use No Timer. The tutorial stops here and will not start a real quiz.',
    selector: '#timerModalBox',
    action: async () => {
      closeTimerModal();
      showTimerModal('pastpaper', true);
    }
  }
];

async function startAppTutorial() {
  if (_appTutorialActive) return;
  _appTutorialActive = true;
  lockTutorialInteraction();
  _appTutorialStep = 0;
  _appTutorialPrevState = {
    screen: state.screen,
    currentSubject: state.currentSubject,
    appMode: state.appMode,
    topics: Array.isArray(state.topics) ? [...state.topics] : [],
    targetHardOnly: state.targetHardOnly
  };
  await renderAppTutorialStep();
}

async function renderAppTutorialStep() {
  const step = APP_TUTORIAL_STEPS[_appTutorialStep];
  if (!step) return finishAppTutorial();
  await step.action();
  document.getElementById('appTutorialOverlay')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="appTutorialOverlay" class="app-tutorial-overlay">
      <div id="appTutorialSpotlight" class="app-tutorial-spotlight"></div>
      <div class="app-tutorial-card" role="dialog" aria-modal="true">
        <div class="app-tutorial-kicker">Quick start ${_appTutorialStep + 1}/${APP_TUTORIAL_STEPS.length}</div>
        <h2>${step.title}</h2>
        <p>${step.text}</p>
        <div class="app-tutorial-actions">
          <button onclick="skipAppTutorial()">Skip</button>
          <button ${_appTutorialStep === 0 ? 'disabled' : ''} onclick="prevAppTutorialStep()">Back</button>
          <button class="primary" onclick="nextAppTutorialStep()">${_appTutorialStep === APP_TUTORIAL_STEPS.length - 1 ? 'Got it' : 'Next'}</button>
        </div>
      </div>
    </div>
  `);
  positionAppTutorialSpotlight(step.selector);
}

function positionAppTutorialSpotlight(selector) {
  const target = document.querySelector(selector);
  const spot = document.getElementById('appTutorialSpotlight');
  if (!target || !spot) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    const rect = target.getBoundingClientRect();
    spot.style.left = Math.max(10, rect.left - 10) + 'px';
    spot.style.top = Math.max(10, rect.top - 10) + 'px';
    spot.style.width = Math.min(window.innerWidth - 20, rect.width + 20) + 'px';
    spot.style.height = Math.min(window.innerHeight - 20, rect.height + 20) + 'px';
  }, 260);
}

function restoreAppTutorialState() {
  closeTimerModal();
  if (_appTutorialPrevState) {
    state.screen = _appTutorialPrevState.screen || 'landing';
    state.currentSubject = _appTutorialPrevState.currentSubject || state.currentSubject;
    state.appMode = _appTutorialPrevState.appMode || null;
    state.topics = Array.isArray(_appTutorialPrevState.topics) ? [..._appTutorialPrevState.topics] : state.topics;
    state.targetHardOnly = !!_appTutorialPrevState.targetHardOnly;
  } else {
    state.screen = 'landing';
  }
  _appTutorialPrevState = null;
}

function finishAppTutorial() {
  markAppTutorialSeen();
  document.getElementById('appTutorialOverlay')?.remove();
  _appTutorialActive = false;
  unlockTutorialInteraction();
  restoreAppTutorialState();
  renderApp();
}

function skipAppTutorial() {
  finishAppTutorial();
}

function nextAppTutorialStep() {
  if (_appTutorialStep >= APP_TUTORIAL_STEPS.length - 1) return finishAppTutorial();
  _appTutorialStep++;
  renderAppTutorialStep();
}

function prevAppTutorialStep() {
  if (_appTutorialStep <= 0) return;
  _appTutorialStep--;
  renderAppTutorialStep();
}

function showGuestQuizPrompt(mode) {
  document.getElementById('guestQuizPrompt')?.remove();
  document.getElementById('guestConfirmPrompt')?.remove();
  window._pendingGuestQuizMode = mode;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="guestQuizPrompt" class="guest-auth-overlay">
      <div class="guest-auth-card" role="dialog" aria-modal="true">
        <button class="auth-close" onclick="document.getElementById('guestQuizPrompt')?.remove()">×</button>
        <div class="guest-auth-kicker">Before you start</div>
        <h2>Sign in to save your progress</h2>
        <p>Create an account to sync progress across devices, or continue as a guest and save basic progress on this device.</p>
        <div class="guest-auth-actions">
          <button class="guest-primary" onclick="showGuestContinueConfirm('${mode}')">Continue as guest</button>
          <button class="primary" onclick="document.getElementById('guestQuizPrompt')?.remove();showAuthModal('login')">Sign in</button>
          <button onclick="document.getElementById('guestQuizPrompt')?.remove();showAuthModal('signup')">Create account</button>
        </div>
      </div>
    </div>
  `);
}

function showGuestContinueConfirm(mode) {
  document.getElementById('guestConfirmPrompt')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="guestConfirmPrompt" class="guest-auth-overlay">
      <div class="guest-auth-card guest-confirm-card" role="dialog" aria-modal="true">
        <button class="auth-close" onclick="document.getElementById('guestConfirmPrompt')?.remove()">×</button>
        <div class="guest-auth-kicker">Guest mode</div>
        <h2>Your progress saves on this device only</h2>
        <p>You can practice as a guest and keep basic progress locally. Sign in later to sync it online and use it across devices.</p>
        <div class="guest-auth-actions">
          <button class="guest-primary" onclick="confirmGuestContinue('${mode}')">Continue anyway</button>
          <button class="primary" onclick="document.getElementById('guestConfirmPrompt')?.remove();document.getElementById('guestQuizPrompt')?.remove();showAuthModal('signup')">Create account instead</button>
          <button onclick="document.getElementById('guestConfirmPrompt')?.remove()">Go back</button>
        </div>
      </div>
    </div>
  `);
}

function confirmGuestContinue(mode) {
  document.getElementById('guestConfirmPrompt')?.remove();
  document.getElementById('guestQuizPrompt')?.remove();
  window._pendingGuestQuizMode = null;
  if (typeof acceptGuestMode === 'function') acceptGuestMode();
  showTimerModal(mode, true);
}

function showGuestAccountReminder() {
  if (document.getElementById('guestAccountReminder') || (typeof isGuest === 'function' && !isGuest())) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="guestAccountReminder" class="guest-auth-overlay">
      <div class="guest-auth-card guest-confirm-card" role="dialog" aria-modal="true">
        <button class="auth-close" onclick="dismissGuestAccountReminder()">×</button>
        <div class="guest-auth-kicker">Guest progress</div>
        <h2>You have completed 5 quizzes as a guest</h2>
        <p>Create an account to sync this progress online, keep it across devices, and unlock full stats.</p>
        <div class="guest-auth-actions">
          <button class="primary" onclick="document.getElementById('guestAccountReminder')?.remove();showAuthModal('signup')">Create account</button>
          <button class="guest-primary" onclick="document.getElementById('guestAccountReminder')?.remove();showAuthModal('login')">Sign in</button>
          <button onclick="dismissGuestAccountReminder()">Later</button>
        </div>
      </div>
    </div>
  `);
}

window.showGuestQuizPrompt = showGuestQuizPrompt;
window.showGuestContinueConfirm = showGuestContinueConfirm;
window.confirmGuestContinue = confirmGuestContinue;
window.showGuestAccountReminder = showGuestAccountReminder;

function showTimerModal(mode, bypassGuestPrompt = false) {
  if (!bypassGuestPrompt && typeof isGuest === 'function' && isGuest() && (typeof guestModeAccepted !== 'function' || !guestModeAccepted())) {
    showGuestQuizPrompt(mode);
    return;
  }
  if (mode !== 'target') state.appMode = mode;
  _pendingStartMode = mode;
  _selectedTimerMins = null;

  if ((window._appSettings || {}).timer_enabled === false) {
    state.countdownLimit = 0;
    const startMode = _pendingStartMode;
    const examMode = _pendingExamMode;
    _pendingStartMode = null;
    _pendingExamMode = false;
    beginPendingQuizStart(startMode, examMode);
    return;
  }

  const isTarget = mode === 'target';
  const accent = isTarget ? '#e74c3c' : '#6c8bef';
  const accentBg = isTarget ? '#2b0d0d' : '#1a2040';
  const modal = document.getElementById('timerModal');
  const box = document.getElementById('timerModalBox');

  // Set CSS vars on modal box
  box.style.setProperty('--tm-accent', accent);
  box.style.setProperty('--tm-accent-bg', accentBg);
  box.style.borderTop = '3px solid ' + accent;

  document.getElementById('timerModalTitle').textContent = isTarget ? 'Set a Target Quiz Time Limit?' : 'Set a Time Limit?';
  document.getElementById('timerModalSubtitle').textContent =
    'Pick a preset or enter a custom time. Hit "No Timer" to start without one.';

  // Render preset grid — fullpaper gets longer presets (30 min–3 hr)
  const presets = (mode === 'fullpaper')
    ? [
        { mins: 30,  label: '30 min' },
        { mins: 45,  label: '45 min' },
        { mins: 60,  label: '1 hr' },
        { mins: 90,  label: '1.5 hr' },
        { mins: 120, label: '2 hr' },
        { mins: 180, label: '3 hr' },
      ]
    : TIMER_PRESETS;
  const grid = document.getElementById('timerOptionGrid');
  grid.innerHTML = presets.map(p => `
    <div class="timer-option" id="topt_${p.mins}" onclick="selectPresetTimer(${p.mins})">
      <span class="to-mins">${p.mins}</span>
      <span class="to-label">${p.label}</span>
    </div>
  `).join('');

  document.getElementById('timerCustomInput').value = '';
  document.getElementById('timerStartBtn').style.background = accent;
  modal.style.display = 'block';
}

function beginPendingQuizStart(startMode, examMode) {
  maybeShowJanudaIntro(() => {
    if (startMode === 'target') {
      startTargetQuiz();
    } else if (examMode) {
      startExamQuiz();
    } else {
      startQuiz();
    }
  });
}

function selectPresetTimer(mins) {
  _selectedTimerMins = mins;
  document.querySelectorAll('.timer-option').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('topt_' + mins);
  if (el) el.classList.add('selected');
  document.getElementById('timerCustomInput').value = '';
}

function clearPresetSelection() {
  _selectedTimerMins = null;
  document.querySelectorAll('.timer-option').forEach(el => el.classList.remove('selected'));
}

function selectCustomTimer(val) {
  const n = parseInt(val);
  _selectedTimerMins = (n > 0 && n <= 180) ? n : null;
  document.querySelectorAll('.timer-option').forEach(el => el.classList.remove('selected'));
}

function closeTimerModal() {
  const modal = document.getElementById('timerModal');
  if (modal) modal.style.display = 'none';
  _pendingStartMode = null;
  _pendingExamMode = false;
  _selectedTimerMins = null;
}

function janudaIntroStorageKey() {
  let userPart = 'guest';
  try {
    if (typeof getUserId === 'function' && getUserId()) userPart = getUserId();
  } catch(e) {}
  return 'eq_januda_first_quiz_intro_seen_' + userPart;
}

function shouldShowJanudaIntro() {
  try {
    return !localStorage.getItem(janudaIntroStorageKey());
  } catch(e) {
    return false;
  }
}

function markJanudaIntroSeen() {
  try {
    localStorage.setItem(janudaIntroStorageKey(), '1');
  } catch(e) {}
}

let _janudaIntroContinue = null;

function maybeShowJanudaIntro(onContinue) {
  if (!shouldShowJanudaIntro()) {
    onContinue();
    return;
  }
  _janudaIntroContinue = onContinue;
  showJanudaIntroModal();
}

function showJanudaIntroModal() {
  document.getElementById('janudaIntroModal')?.remove();
  const rawName = (typeof getDisplayName === 'function') ? getDisplayName() : 'Machan';
  const name = String(rawName).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  document.body.insertAdjacentHTML('beforeend', `
    <div id="janudaIntroModal" class="januda-intro-overlay">
      <div class="januda-intro-card" role="dialog" aria-modal="true" aria-labelledby="janudaIntroTitle">
        <div class="januda-intro-orb">AI</div>
        <div class="januda-intro-kicker">Before your first quiz</div>
        <h2 id="janudaIntroTitle">Meet Januda Ayya</h2>
        <p class="januda-intro-copy">
          ${name}, why open Gemini to review questions when Januda Ayya is already inside the app?
          Type <strong>explain</strong>, paste a tricky question, or ask why an answer is wrong and he will walk you through it.
        </p>
        <div class="januda-intro-tip">Explaining difficult topics is like cutting through butter for him.</div>
        <div class="januda-intro-actions">
          <button class="januda-intro-secondary" onclick="startJanudaTutorial()">Take me to Januda Ayya</button>
          <button class="januda-intro-primary" onclick="continueAfterJanudaIntro()">Start quiz</button>
        </div>
      </div>
    </div>
  `);
}

function continueAfterJanudaIntro() {
  markJanudaIntroSeen();
  document.getElementById('janudaIntroModal')?.remove();
  document.getElementById('janudaTutorialModal')?.remove();
  const chatWin = document.getElementById('chatWindow');
  if (chatWin) chatWin.style.zIndex = '';
  const cont = _janudaIntroContinue;
  _janudaIntroContinue = null;
  if (cont) cont();
}

function startJanudaTutorial() {
  markJanudaIntroSeen();
  document.getElementById('janudaIntroModal')?.remove();
  openJanudaChat();
  document.getElementById('janudaTutorialModal')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="janudaTutorialModal" class="januda-tutorial-overlay">
      <div class="januda-tutorial-card" role="dialog" aria-modal="true" aria-labelledby="janudaTutorialTitle">
        <div class="januda-intro-kicker">Quick tutorial</div>
        <h2 id="janudaTutorialTitle">How to use Januda Ayya</h2>
        <div class="januda-tutorial-steps">
          <div><strong>1. Ask naturally.</strong><span>Type <b>explain</b>, paste a question, or ask why an option is wrong.</span></div>
          <div><strong>2. Send fast.</strong><span>Press <b>Enter</b> or click <b>Send</b>. Januda will answer inside this chat.</span></div>
          <div><strong>3. Switch mode.</strong><span>Use the small menu at the bottom right of the chat to switch Januda Ayya's thinking mode.</span></div>
        </div>
        <div class="januda-intro-actions">
          <button class="januda-intro-secondary" onclick="highlightModelDropdownFromTutorial(event)">Show model menu</button>
          <button class="januda-intro-primary" onclick="continueAfterJanudaIntro()">Got it, start quiz</button>
        </div>
      </div>
    </div>
  `);
  setTimeout(() => document.getElementById('chatInput')?.focus(), 120);
}

function highlightModelDropdownFromTutorial(e) {
  if (e) e.stopPropagation();
  const chatWin = document.getElementById('chatWindow');
  if (chatWin) chatWin.style.zIndex = '280';
  const dd = document.getElementById('modelDropdown');
  if (dd) dd.style.display = 'none';
  toggleModelDropdown(e);
}

function confirmTimer(noTimer = false) {
  if (noTimer) {
    state.countdownLimit = 0;
  } else {
    const customVal = parseInt(document.getElementById('timerCustomInput').value);
    const mins = _selectedTimerMins || (customVal > 0 ? customVal : 0);
    state.countdownLimit = mins > 0 ? mins * 60 : 0;
  }
  document.getElementById('timerModal').style.display = 'none';
  const startMode = _pendingStartMode;
  const examMode  = _pendingExamMode;
  _pendingStartMode = null;
  _pendingExamMode  = false;
  beginPendingQuizStart(startMode, examMode);
}

// RENDERERS

const MoraAppHelpers = window.MoraHelpers;
if (!MoraAppHelpers) {
  throw new Error('MoraHelpers must load before quiz_app.js');
}

var cleanDisplayText = MoraAppHelpers.cleanDisplayText;
var normalizePlainMathText = MoraAppHelpers.normalizePlainMathText;
var formatQuestionText = MoraAppHelpers.formatQuestionText;
var escapeHTML = MoraAppHelpers.escapeHTML;
var renderTextBlock = MoraAppHelpers.renderTextBlock;

function renderQuiz() {
  const q = state.questions[state.current];
  const _qOffset     = state.resumeOffset || 0;
  const _qDisplayNum = _qOffset + state.current + 1;
  const _qDisplayTot = _qOffset + state.questions.length;
  const pct = (_qOffset + state.current) / (_qDisplayTot) * 100;
  const formattedText = formatQuestionText(q.text);
  return `
  <div class="progress-meta">
    <span>Question ${_qDisplayNum} of ${_qDisplayTot}${_qOffset > 0 ? ` <span style="font-size:0.78rem;color:var(--text-muted);margin-left:4px;">(${_qOffset} answered)</span>` : ''}</span>
    <span style="display:flex;gap:8px;align-items:center;">
      <span style="display:inline-flex;align-items:center;gap:7px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:5px 12px;">
        <span style="font-size:1rem;">${state.countdownLimit>0?'Timer':'Timer'}</span>
        <span id="quiz-timer" style="font-family:'DM Mono',monospace;font-size:1rem;font-weight:700;letter-spacing:0.04em;${state.countdownLimit>0&&state.countdownRemaining<=30?'color:#f87171;':'color:var(--accent-light);'}">${state.countdownLimit>0?formatTime(state.countdownRemaining):formatTime(state.timerSeconds)}</span>
        <button id="pauseTimerBtn" onclick="togglePauseTimer()" title="${state.timerPaused?'Resume timer':'Pause timer'}" style="background:${state.timerPaused?'#1e2a5e':'var(--surface)'};border:1px solid ${state.timerPaused?'var(--accent)':'var(--border-hover)'};border-radius:6px;color:${state.timerPaused?'var(--accent-light)':'var(--text-muted)'};cursor:pointer;font-size:0.75rem;padding:3px 10px;line-height:1.5;transition:border-color 0.15s,background 0.15s,color 0.15s,opacity 0.15s;font-weight:600;white-space:nowrap;">${state.timerPaused?'Resume':'Pause'}</button>
      </span>
      <span style="display:inline-flex;align-items:center;gap:5px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:5px 12px;"><span style="color:var(--correct);font-weight:700;font-family:'DM Mono',monospace;font-size:0.95rem;">${state.score}</span><span style="color:var(--accent-light);font-weight:600;font-family:'DM Mono',monospace;font-size:0.95rem;">/ ${state.current}</span></span>
    </span>
  </div>
  <div class="progress-bar-wrap">
    <div class="progress-bar-fill" style="transform:scaleX(${pct/100})"></div>
  </div>
  <div class="q-card" style="--card-color:${subj().color};--card-shadow:${subj().color}22;">
    <div class="q-meta" style="position:relative;">
      ${state.appMode === 'target' ? `<span class="q-tag ${q.unit?unitClass(q.unit):''}">Target Quiz</span>` : `<span class="q-tag ${unitClass(q.unit)}">${unitTag(q.unit)}</span>`}
      ${state.appMode !== 'target' ? `<span class="q-tag">${q.year || 'Past Paper'}</span>` : ''}
      ${q.hard ? `<span class="q-tag" style="background:#2b0808;border-color:#c0392b;color:#f87171;font-weight:700;letter-spacing:0.05em;font-size:0.78rem;">Hard</span>` : ''}
      ${answerHistory[q.id] && !state.answered ? `<span class="q-tag" style="background:${answerHistory[q.id].correct?'#0d2b1a':'#2b0d0d'};border-color:${answerHistory[q.id].correct?'#1a5c35':'#5c1a1a'};color:${answerHistory[q.id].correct?'var(--correct)':'var(--wrong)'};">${answerHistory[q.id].correct?'&#10003;':'&#10007;'} prev: ${cleanDisplayText(q.opts[answerHistory[q.id].selected])}</span>` : ''}
      ${window._appSettings?.flags_enabled !== false ? `<button id="flag-${q.id}" class="flag-btn${isFlagged(state.currentSubject,q.id)?' flagged':''}" onclick="toggleFlagUI('${state.currentSubject}','${q.id}')" title="${isFlagged(state.currentSubject,q.id)?'Remove flag':'Flag for review'}">!</button>` : ''}
    </div>
    ${q.context ? `<div class="q-context"><pre>${cleanDisplayText(q.context)}</pre></div>` : ''}
    ${q.img ? `<div style="margin:0.8rem 0 1rem;text-align:center;">
      <img src="${rootAssetPath(q.img)}" alt="${q.imgAlt||'Figure'}"
        style="max-width:100%;max-height:260px;border-radius:8px;border:1px solid var(--border);background:#fff;padding:6px;cursor:zoom-in;"
        onclick="openImgViewer(this.src, this.alt, document.querySelector('.q-text')?.innerHTML || '')"
        title="Click to enlarge">
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;opacity:0.7;">Click image to enlarge</div>
    </div>` : ''}
    <div class="q-text">${formattedText}</div>
    <div class="options">
      ${q.opts.map((opt,i)=>{
        let cls = '';
        if (state.answered) {
          if (i === q.ans) cls = 'correct';
          else if (i === state.selected && i !== q.ans) cls = 'wrong';
        }
        return `<button class="opt-btn ${cls}" onclick="selectAnswer(${i})" ${state.answered?'disabled':''}>
          <span class="opt-letter">${letters[i]}</span><span>${normalizePlainMathText(opt)}</span>
        </button>`;
      }).join('')}
    </div>
    ${state.answered ? `
    <div class="explanation">
      <strong>${state.selected === q.ans ? '&#10003; Correct!' : '&#10007; Incorrect.'}</strong>
      ${cleanDisplayText(q.exp)}
    </div>
    <button class="next-btn" onclick="next()">${state.current + 1 < state.questions.length ? 'Next →' : 'View Results →'}</button>
    <div style="clear:both"></div>
    ` : ''}
  </div>
  `;
}

function renderResults() {
  const pct = Math.round((state.score/state.questions.length)*100) || 0;
  const grade = getGrade(pct);
  const wrong = state.results.filter(r=>!r.correct).length;
  
  let reviewHtml = '';
  if (state.showReview) {
    reviewHtml = `
    <div class="review-list">
      <h3>Review (${state.results.length} questions)</h3>
      ${state.results.map(r=>`
        <div class="review-item ${r.correct?'correct-item':'wrong-item'}">
          ${r.question.img ? `<div style="margin-bottom:0.5rem;text-align:center;">
            <img src="${rootAssetPath(r.question.img)}" alt="${r.question.imgAlt||'Figure'}"
              style="max-width:100%;max-height:180px;border-radius:6px;border:1px solid var(--border);background:#fff;padding:4px;cursor:zoom-in;"
              onclick="openImgViewer(this.src, this.alt, ${JSON.stringify(cleanDisplayText(r.question.text).replace(/\n/g,' '))})"
              title="Click to enlarge">
          </div>` : ''}
          <div class="ri-q">${cleanDisplayText(r.question.text).replace(/\n/g,' ')}</div>
          <div class="ri-ans">
            ${r.correct
              ? `<span class="c">&#10003; ${normalizePlainMathText(r.question.opts[r.question.ans])}</span>`
              : `<span class="w">&#10007; You chose: ${normalizePlainMathText(r.question.opts[r.selected])}</span>
                 <span class="c">&#10003; Correct: ${normalizePlainMathText(r.question.opts[r.question.ans])}</span>`
            }
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  return `
  <div class="results">
    <div class="score-circle" style="border-color:${grade.color};box-shadow:0 0 40px ${grade.color}33;">
      <span class="sc-num" style="color:${grade.color};">${pct}%</span>
      <span class="sc-label">${state.score}/${state.questions.length}</span>
    </div>
    <h2 style="color:${grade.color};font-size:${state.appMode==='target'?'2.8rem':'1.8rem'};margin-bottom:0.3rem;">${grade.label}</h2>
    <p>${grade.msg}</p>
    ${state.appMode === 'target' ? `
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:1rem 0 0.5rem;font-size:0.78rem;">
      <span style="padding:3px 10px;border-radius:100px;background:#1a0a0a;border:1px solid #5a1a1a;color:#f87171;">F &lt;35%</span>
      <span style="padding:3px 10px;border-radius:100px;background:#1a1008;border:1px solid #6b3a0a;color:#f97316;">S 35–50%</span>
      <span style="padding:3px 10px;border-radius:100px;background:#1a1600;border:1px solid #6b5c00;color:#fbbf24;">C 50–65%</span>
      <span style="padding:3px 10px;border-radius:100px;background:#081518;border:1px solid #0a4a5c;color:#7dd3fc;">B 65–75%</span>
      <span style="padding:3px 10px;border-radius:100px;background:#0a1e0a;border:1px solid #1a5c1a;color:#4ade80;">A 75%+</span>
    </div>` : ''}
    <div class="results-stats">
      <div class="rs-card good"><div class="rs-val">${state.score}</div><div class="rs-lbl">Correct</div></div>
      <div class="rs-card bad"><div class="rs-val">${wrong}</div><div class="rs-lbl">Incorrect</div></div>
      <div class="rs-card mid"><div class="rs-val">${state.questions.length}</div><div class="rs-lbl">Total</div></div>
      <div class="rs-card mid"><div class="rs-val" style="${state.countdownLimit>0&&state.countdownRemaining===0?'color:#f87171;':''}">${state.countdownLimit>0&&state.countdownRemaining===0?'Time&#39;s up!':formatTime(state.timerSeconds)}</div><div class="rs-lbl">Time</div></div>
    </div>
    ${(() => {
      const unitStats = {};
      const units = subj().units;
      state.results.forEach(r => {
        const u = r.question.unit;
        if (!u) return;
        if (!unitStats[u]) unitStats[u] = { correct: 0, total: 0, name: units[u] || ('Unit ' + u) };
        unitStats[u].total++;
        if (r.correct) unitStats[u].correct++;
      });
      const keys = Object.keys(unitStats).map(Number).sort();
      if (keys.length <= 1) return '';
      return '<div style="margin:1.2rem 0 0.5rem;background:var(--surface2);border:1px solid var(--border);border-radius:14px;overflow:hidden;">'
        + '<div style="padding:10px 14px;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border);">Per Unit Breakdown</div>'
        + keys.map(u => {
            const st = unitStats[u];
            const p = Math.round(st.correct / st.total * 100);
            const col = p >= 70 ? '#4ade80' : p >= 50 ? '#fbbf24' : '#f87171';
            return '<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-top:1px solid var(--border);">'
              + '<div style="font-size:0.8rem;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + st.name + '</div>'
              + '<div style="flex:2;background:var(--surface);border-radius:4px;height:6px;overflow:hidden;">'
              +   '<div style="height:100%;width:' + p + '%;background:' + col + ';border-radius:4px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1);"></div>'
              + '</div>'
              + '<div style="font-size:0.78rem;font-family:\'DM Mono\',monospace;font-weight:700;color:' + col + ';min-width:44px;text-align:right;">' + st.correct + '/' + st.total + '</div>'
              + '</div>';
          }).join('')
        + '</div>';
    })()}
    ${typeof renderPostQuizInsights === 'function' ? renderPostQuizInsights() : ''}
    <div class="results-btns">
      <button class="primary" onclick="${state.appMode==='target'?'startTargetQuiz':'startQuiz'}()">New Quiz</button>
      ${wrong > 0 && state.appMode !== 'target' ? `<button class="warning" onclick="startQuiz(true)">Retry Incorrect</button>` : ''}
      <button onclick="state.showReview=!state.showReview;renderApp()">${state.showReview?'Hide':'Show'} Review</button>
      <button onclick="saveReviewAsHTML()" title="Save review as HTML file">💾 Save</button>
      <button onclick="shareReview()" title="Copy results to clipboard">📋 Share</button>
      <button onclick="goHome()">&#127968; Home</button>
    </div>
    ${reviewHtml}
  </div>
  `;
}

function renderLanding() {
  const allSubjects = Object.values(SUBJECTS);
  const totalQuestions = allSubjects.reduce((sum, s) => sum + subjectTotalCount(s.key), 0);
  const learningSnapshot = (typeof _learningSnapshotCache !== 'undefined' && isLoggedIn && isLoggedIn()) ? _learningSnapshotCache : null;
  if (isLoggedIn && isLoggedIn() && !learningSnapshot && typeof dbLoadLearningSnapshot === 'function') {
    dbLoadLearningSnapshot().then(() => { if (state.screen === 'landing') renderApp(); }).catch(() => {});
  }

  const subjectStats = allSubjects.map(s => {
    let answered = 0, correct = 0;
    const dbSubject = learningSnapshot?.bySubject?.[s.key];
    if (dbSubject) {
      answered = dbSubject.attempted || 0;
      correct = dbSubject.correct || 0;
    } else try {
      const raw = localStorage.getItem(s.historyKey);
      const hist = raw ? JSON.parse(raw) : {};
      const entries = Object.values(hist);
      answered = entries.length;
      correct  = entries.filter(e => e.correct).length;
    } catch(e) {}
    const total = subjectTotalCount(s.key);
    const pct   = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { ...s, answered, correct, total, pct };
  });

  const totalAnswered = learningSnapshot?.totals?.totalQuestions ?? subjectStats.reduce((sum, x) => sum + x.answered, 0);
  const totalCorrect  = learningSnapshot?.totals?.totalCorrect ?? subjectStats.reduce((sum, x) => sum + x.correct,  0);
  const globalPct     = learningSnapshot?.totals?.accuracy ?? (totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0);
  const streak        = learningSnapshot?.totals?.currentStreak ?? parseInt(localStorage.getItem('eq_streak') || '0');

  function ring(pct, color, size, stroke) {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const dash  = (pct / 100) * circ;
    const cx = size / 2, cy = size / 2;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="transform:rotate(-90deg);">'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="' + stroke + '"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-dasharray="' + dash + ' ' + circ + '" stroke-linecap="round" style="transition:stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1);"/>'
      + '</svg>';
  }

  const sortedSubjects = [...subjectStats].sort((a, b) => (a.total === 0) - (b.total === 0));

  const subjectCards = sortedSubjects.map(s => {
    const empty = s.total === 0;
    const clickHandler = empty ? '' : ('onclick="enterSubject(\'' + s.key + '\')" data-subject-key="' + s.key + '"');
    const progressW = s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0;
    const statusLabel = empty ? 'Coming soon' : (s.answered > 0 ? s.answered + ' answered - ' + progressW + '%' : 'Available');
    const statusColor = empty ? 'var(--text-muted)' : (s.answered > 0 ? s.color : '#4ade80');
    const statusClass = empty ? 'status-coming-soon' : (s.answered > 0 ? 'status-progress' : 'status-available');
    const arrow = !empty ? ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:' + s.color + ';opacity:0.7;flex-shrink:0;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>') : '';
    const iconBg = s.color + '20';
    const iconBorder = s.color + '40';
    const tag = empty ? 'div' : 'a';
    const href = empty ? '' : (' href="#subject-' + s.key + '"');
    return '<' + tag + href + ' ' + clickHandler + ' class="lp-tile' + (empty ? ' lp-tile-empty' : '') + '" style="--tile-color:' + s.color + ';--tile-glow:' + s.color + '14;">'
      + '<div class="lp-tile-top">'
      +   '<div class="lp-tile-icon-wrap" style="background:' + iconBg + ';border:1.5px solid ' + iconBorder + ';">' + s.icon + '</div>'
      + '</div>'
      + '<h3 class="lp-tile-title">' + s.label + '</h3>'
      + '<p class="lp-tile-desc">' + s.desc + '</p>'
      + '<div class="lp-tile-footer">'
      +   '<span class="lp-tile-status ' + statusClass + '" style="color:' + statusColor + ';">' + statusLabel + '</span>'
      +   arrow
      + '</div>'
      + (!empty && s.answered > 0 ? '<div class="lp-tile-prog"><div class="lp-tile-prog-fill" style="transform:scaleX(' + (progressW/100) + ');background:' + s.color + ';box-shadow:0 0 8px ' + s.color + '55;"></div></div>' : '')
      + '</' + tag + '>';
  }).join('');

  return '<div class="lp-hero">'
    + '<div class="lp-hero-glow"></div>'
    + '<div class="lp-hero-grid"></div>'
    + '<div class="lp-hero-content">'
    +   '<div class="lp-badge">EXAM APP BY CJAY</div>'
    +   '<h1 class="lp-hero-title">Practice smarter for<br><span class="lp-hero-gradient">Mora Exams</span></h1>'
    +   '<p class="lp-hero-sub">Master past papers, tackle hard questions, and get instant AI explanations.</p>'
    +   '<div class="lp-stats-row">'
    +     '<div class="lp-stat-glass"><div class="lp-stat-val">' + totalQuestions.toLocaleString() + '</div><div class="lp-stat-lbl">Questions</div></div>'
    +     '<div class="lp-stat-sep"></div>'
    +     '<div class="lp-stat-glass"><div class="lp-stat-val" style="color:#4ade80;">' + totalAnswered + '</div><div class="lp-stat-lbl">Answered</div></div>'
    +     '<div class="lp-stat-sep"></div>'
    +     '<div class="lp-stat-glass"><div class="lp-stat-val" style="color:#fbbf24;">' + globalPct + '%</div><div class="lp-stat-lbl">Accuracy</div></div>'
    +     '<div class="lp-stat-sep"></div>'
    +     '<div class="lp-stat-glass"><div class="lp-stat-val lp-streak-val" style="color:#f97316;"><span aria-hidden="true">&#128293;</span> ' + streak + '</div><div class="lp-stat-lbl">Day Streak</div></div>'
    +   '</div>'
    +   '<div class="lp-readiness">'
    +     '<div class="lp-readiness-label"><span>Exam Readiness</span><span style="color:#a78bfa;font-weight:700;">' + globalPct + '%</span></div>'
    +     '<div class="lp-readiness-track"><div class="lp-readiness-fill" style="width:' + globalPct + '%;"></div><div class="lp-readiness-glow" style="left:' + Math.max(0, globalPct - 2) + '%;"></div></div>'
    +   '</div>'
    +   '<div class="lp-hero-actions"><button class="lp-start-practicing" onclick="appScrollToElement(\'subjectCards\', 620)">Start Practicing</button><button class="lp-start-practicing secondary" onclick="state.screen=\'leaderboards\';renderApp()">Leaderboards</button></div>'
    + '</div>'
    + '</div>'
    + '<div class="lp-feature-strip lp-feature-showcase">'
    +   '<div class="lp-feature" onclick="openCategorySubjectPicker(\'pastpaper\')" style="--feature-color:#7fa3ff;--feature-glow:rgba(127,163,255,0.24);cursor:pointer;"><div class="lp-feature-icon">PP</div><div class="lp-feature-text"><strong>Past Papers</strong><span>Real exam questions by unit or year</span></div></div>'
    +   '<div class="lp-feature-div"></div>'
    +   '<div class="lp-feature" onclick="openCategorySubjectPicker(\'target\')" style="--feature-color:#43d7ff;--feature-glow:rgba(67,215,255,0.22);cursor:pointer;"><div class="lp-feature-icon">TQ</div><div class="lp-feature-text"><strong>Target Quiz</strong><span>Curated hard questions for top grades</span></div></div>'
    +   '<div class="lp-feature-div"></div>'
    +   '<div class="lp-feature" onclick="openJanudaChat()" style="--feature-color:#b989ff;--feature-glow:rgba(185,137,255,0.23);cursor:pointer;"><div class="lp-feature-icon">JA</div><div class="lp-feature-text"><strong>Januda Ayya</strong><span>Instant AI explanations for any question</span></div></div>'
    + '</div>'
    + '<div class="lp-section" id="subjectCards">'
    +   '<div class="lp-section-header"><h2 class="lp-section-title">Choose a Subject</h2><span class="lp-section-sub">' + allSubjects.filter(s => subjectTotalCount(s.key) > 0).length + ' active</span></div>'
    +   '<div class="lp-tile-grid">' + subjectCards + '</div>'
    + '</div>'
    + (typeof isAdmin === 'function' && isAdmin()
        ? '<div style="text-align:center;padding:1.5rem 0 2.5rem;">'
          + '<button onclick="state.screen=\'admin\';renderApp()" style="background:transparent;border:1px solid #2e3348;border-radius:10px;color:var(--text-muted);padding:7px 20px;font-size:0.78rem;cursor:pointer;font-family:inherit;transition:border-color 0.2s,color 0.2s;" onmouseover="this.style.borderColor=\'#5a6ef0\';this.style.color=\'#a0a8d0\'" onmouseout="this.style.borderColor=\'#2e3348\';this.style.color=\'var(--text-muted)\'">Admin Dashboard</button>'
          + '</div>'
        : '');
}

function subjectCategoryCount(subjectKey, mode) {
  if (mode === 'target') return subjectCount(subjectKey, 'allTarget');
  return subjectCount(subjectKey, 'pastUnit') + subjectCount(subjectKey, 'pastPaper');
}

function renderCategorySubjects() {
  const mode = state.categoryMode === 'target' ? 'target' : 'pastpaper';
  const title = mode === 'target' ? 'Target Quiz' : 'Past Papers';
  const subtitle = mode === 'target'
    ? 'Choose a subject for curated normal and hard target questions.'
    : 'Choose a subject for unit-wise or full past paper practice.';
  const badge = mode === 'target' ? 'TQ' : 'PP';
  const accent = mode === 'target' ? '#43d7ff' : '#7fa3ff';
  const sorted = Object.values(SUBJECTS).map(s => ({
    ...s,
    categoryCount: subjectCategoryCount(s.key, mode)
  })).sort((a, b) => {
    if ((a.categoryCount === 0) !== (b.categoryCount === 0)) return a.categoryCount === 0 ? 1 : -1;
    return b.categoryCount - a.categoryCount;
  });

  const cards = sorted.map(s => {
    const empty = s.categoryCount === 0;
    const tag = empty ? 'div' : 'a';
    const href = empty ? '' : ` href="#${mode}-${s.key}"`;
    const clickHandler = empty ? '' : `onclick="selectCategorySubject('${s.key}')"`;
    const statusLabel = empty ? 'Coming soon' : `${s.categoryCount} questions`;
    const statusClass = empty ? 'status-coming-soon' : 'status-available';
    const statusColor = empty ? 'var(--text-muted)' : (mode === 'target' ? '#43d7ff' : s.color);
    const arrow = empty ? '' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:' + statusColor + ';opacity:0.8;flex-shrink:0;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    return '<' + tag + href + ' ' + clickHandler + ' class="lp-tile' + (empty ? ' lp-tile-empty' : '') + '" style="--tile-color:' + statusColor + ';--tile-glow:' + statusColor + '14;">'
      + '<div class="lp-tile-top">'
      +   '<div class="lp-tile-icon-wrap" style="background:' + s.color + '20;border:1.5px solid ' + s.color + '40;">' + s.icon + '</div>'
      + '</div>'
      + '<h3 class="lp-tile-title">' + s.label + '</h3>'
      + '<p class="lp-tile-desc">' + s.desc + '</p>'
      + '<div class="lp-tile-footer">'
      +   '<span class="lp-tile-status ' + statusClass + '" style="color:' + statusColor + ';">' + statusLabel + '</span>'
      +   arrow
      + '</div>'
      + '</' + tag + '>';
  }).join('');

  return `
  <div class="header" style="padding:2rem 0 1.5rem;">
    <div class="header-badge" style="background:#111827;border-color:${accent}44;color:${accent};">${badge} - ${title}</div>
    <h1 style="margin-bottom:0.5rem;">${title}</h1>
    <p>${subtitle}</p>
  </div>
  <div class="lp-section" style="padding-top:0;">
    <div class="lp-section-header">
      <h2 class="lp-section-title">Choose a Subject</h2>
      <span class="lp-section-sub">${sorted.filter(s => s.categoryCount > 0).length} active</span>
    </div>
    <div class="lp-tile-grid">${cards}</div>
  </div>`;
}

function renderSubjectHome() {
  const s = subj();
  const unitwiseCount = subjectCount(s.key, 'pastUnit') + subjectCount(s.key, 'allTarget');
  const paperCount = subjectCount(s.key, 'pastPaper');
  const noUnitwise = unitwiseCount === 0;
  const noPaper = paperCount === 0;

  function comingSoonBadge() {
    return '<div class="coming-soon-badge" style="position:absolute;top:12px;right:12px;background:#2a2a3a;border:1px solid #444;border-radius:100px;font-size:9px;font-weight:700;letter-spacing:0.05em;color:#aaa;padding:2px 9px;text-transform:uppercase;">Coming Soon</div>';
  }

  const unitwiseCard = `
    <div ${noUnitwise ? '' : `data-nav-action="pastpaperHome"`}
      class="mode-card quiz-mode-card subject-mode-card${noUnitwise ? ' coming-soon-card' : ''}" style="--card-color:${s.color};--card-shadow:${s.color}22;${noUnitwise ? 'opacity:0.48;cursor:not-allowed;filter:grayscale(0.45);' : 'cursor:pointer;'}">
      ${noUnitwise ? comingSoonBadge() : ''}
      <div class="subject-mode-icon">UW</div>
      <h2>Unit-wise Papers</h2>
      <p>Practice by unit, including target questions.</p>
      <div class="subject-mode-meta">${unitwiseCount} questions</div>
    </div>`;
  const paperCard = `
    <div ${noPaper ? '' : `data-nav-action="fullPapers"`}
      class="mode-card quiz-mode-card subject-mode-card${noPaper ? ' coming-soon-card' : ''}" style="--card-color:#7fa3ff;--card-shadow:#7fa3ff22;${noPaper ? 'opacity:0.48;cursor:not-allowed;filter:grayscale(0.45);' : 'cursor:pointer;'}">
      ${noPaper ? comingSoonBadge() : ''}
      <div class="subject-mode-icon">FP</div>
      <h2>Full Past Papers</h2>
      <p>Attempt complete papers by batch or year.</p>
      <div class="subject-mode-meta">${paperCount} questions</div>
    </div>`;
  const cards = noUnitwise && !noPaper ? paperCard + unitwiseCard
              : noPaper && !noUnitwise ? unitwiseCard + paperCard
              : unitwiseCard + paperCard;

  return `
  <div class="header" style="padding:2rem 0 1.5rem;">
    <div class="header-badge" style="background:${s.colorBg};border-color:${s.color}44;color:${s.color};">${s.icon} ${s.label}</div>
    <h1 style="margin-bottom:0.5rem;">${s.label}</h1>
    <p>${s.desc}</p>
  </div>
  <div class="quiz-mode-grid subject-mode-grid">
    ${cards}
  </div>`;
}

function renderPastpaperHome() {
  const s = subj();
  const unitCount = subjectCount(s.key, 'pastUnit');
  const targetCount = subjectCount(s.key, 'allTarget');
  const noUnit = unitCount === 0;
  const noTarget = targetCount === 0;

  const csTag = '<div class="coming-soon-badge" style="position:absolute;top:10px;right:10px;background:#2a2a3a;border:1px solid #444;border-radius:100px;font-size:9px;font-weight:700;letter-spacing:0.05em;color:#aaa;padding:2px 9px;text-transform:uppercase;">Coming Soon</div>';

  const unitCard = `
    <div ${noUnit ? '' : "data-nav-action=\"pastpaperUnits\""}
      class="mode-card quiz-mode-card subject-mode-card${noUnit ? ' coming-soon-card' : ''}" style="--card-color:${s.color};--card-shadow:${s.color}22;${noUnit ? 'opacity:0.48;cursor:not-allowed;filter:grayscale(0.45);' : 'cursor:pointer;'}">
      ${noUnit ? csTag : ''}
      <div class="subject-mode-icon">PP</div>
      <h2>Past Paper Questions</h2>
      <p>Unit-wise questions from real exam papers.</p>
      <div class="subject-mode-meta">${unitCount} questions</div>
    </div>`;

  const targetCard = `
    <div ${noTarget ? '' : "data-nav-action=\"targetHome\""}
      class="mode-card quiz-mode-card subject-mode-card${noTarget ? ' coming-soon-card' : ''}" style="--card-color:#43d7ff;--card-shadow:#43d7ff22;${noTarget ? 'opacity:0.48;cursor:not-allowed;filter:grayscale(0.45);' : 'cursor:pointer;'}">
      ${noTarget ? csTag : ''}
      <div class="subject-mode-icon">TQ</div>
      <h2>Target Questions</h2>
      <p>Normal and hard curated unit practice.</p>
      <div class="subject-mode-meta">${targetCount} questions</div>
    </div>`;

  // Active cards first, Coming Soon pushed back
  const cards = noUnit && !noTarget ? targetCard + unitCard
              : noTarget && !noUnit ? unitCard + targetCard
              : unitCard + targetCard;

  return `
  <div class="header" style="padding:2rem 0 1.5rem;">
    <div class="header-badge" style="background:${s.colorBg};border-color:${s.color}44;color:${s.color};">${s.icon} ${s.label} - Unit-wise Papers</div>
    <h1 style="margin-bottom:0.5rem;">Unit-wise Papers</h1>
    <p>Choose a question bank, then select the units you want.</p>
  </div>
  <div class="quiz-mode-grid subject-mode-grid">
    ${cards}
  </div>`;
}

function renderPaperHome() {
  const s = subj();
  // Sort: in-progress first, then not started, then completed
  const allPapers = [...new Set(s.pastPaper.map(q => q.year))].sort().sort((a, b) => {
    const aQs = s.pastPaper.filter(q => q.year === a);
    const bQs = s.pastPaper.filter(q => q.year === b);
    const aD  = aQs.filter(q => Object.keys(answerHistory).includes(q.id)).length;
    const bD  = bQs.filter(q => Object.keys(answerHistory).includes(q.id)).length;
    const aComplete = aQs.length > 0 && aD === aQs.length;
    const bComplete = bQs.length > 0 && bD === bQs.length;
    const aProgress = aD > 0 && !aComplete;
    const bProgress = bD > 0 && !bComplete;
    if (aComplete !== bComplete) return aComplete ? 1 : -1;
    if (aProgress !== bProgress) return aProgress ? -1 : 1;
    return String(a).localeCompare(String(b));
  });
  const answered = Object.keys(answerHistory);
  const paperCards = allPapers.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No full past papers loaded yet. Use quiz_manager.py to import questions.</p>'
    : allPapers.map(yr => {
        const yQs  = s.pastPaper.filter(q => q.year === yr);
        const done = yQs.filter(q => answered.includes(q.id)).length;
        const pct  = yQs.length > 0 ? Math.round((done / yQs.length) * 100) : 0;
        const allDone = done === yQs.length && yQs.length > 0;
        const statusColor = allDone ? 'var(--correct)' : (done > 0 ? 'var(--accent-light)' : 'var(--text-muted)');
        const statusText  = allDone ? '&#10003; Completed' : (done > 0 ? done + ' answered' : 'Not started');
        const yrSafe  = yr.replace(/'/g, "\\'");
        const yrTitle = yr + ' Past Paper';
        // Wrapper: card on top, "Show Full Paper" button below — completely separate, no event conflict
        return '<div style="display:flex;flex-direction:column;gap:6px;">'
          + '<div class="topic-card full-paper-card" onclick="startPaper(\'' + yrSafe + '\')" style="cursor:pointer;--card-color:' + s.color + ';--card-shadow:' + s.color + '22;margin-bottom:0;">'
          +   '<span class="tc-count">' + done + '/' + yQs.length + '</span>'
          +   '<div class="tc-icon">Paper</div>'
          +   '<h3>' + yr + '</h3>'
          +   '<div class="paper-card-meta">' + yQs.length + ' questions</div>'
          +   '<div class="paper-card-progress">'
          +     '<div style="width:' + pct + '%;background:' + (allDone ? 'var(--correct)' : 'var(--accent)') + ';"></div>'
          +   '</div>'
          +   '<div class="paper-card-status" style="color:' + statusColor + ';">' + statusText + '</div>'
          + '</div>'
          + (done > 0
              ? '<button onclick="confirmResetProgress(\'paper\',\'' + yrSafe + '\',\'' + yr + ' Past Paper\')"'
              +   ' style="width:100%;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:0.78rem;padding:7px 0;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;transition:background 0.15s,border-color 0.15s,color 0.15s;"'
              +   ' onmouseover="this.style.background=\'var(--surface)\';this.style.borderColor=\'#f87171\';this.style.color=\'#f87171\'"'
              +   ' onmouseout="this.style.background=\'transparent\';this.style.borderColor=\'var(--border)\';this.style.color=\'var(--text-muted)\'">Reset Progress</button>'
              : '')
          + '<div class="paper-card-actions">'
          + '<button data-token="pastPaper_year_' + yrSafe + '" data-title="' + yr + ' Past Paper" data-back="paperHome"'
          +   ' onclick="showViewAllConfirm(this.dataset.token,this.dataset.title,this.dataset.back)"'
          +   ' class="paper-secondary-action"'
          +   ' onmouseover="this.style.background=\'var(--surface)\';this.style.borderColor=\'' + s.color + '\';this.style.color=\'' + s.color + '\'"'
          +   ' onmouseout="this.style.background=\'var(--surface2)\';this.style.borderColor=\'var(--border)\';this.style.color=\'var(--text-muted)\'">'
          +   '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/></svg>'
          +   ' Show Full Paper'
          + '</button>'
          + _offlineBtn('paper', s.key, yr)
          + '</div>'
          + '</div>';
      }).join('');

  return `
  <div class="header">
    <div class="header-badge" style="background:${s.colorBg};border-color:${s.color}44;color:${s.color};">${s.icon} ${s.label} - Full Papers</div>
    <h1>Full Past Papers</h1>
    <p>Tap a paper to start it</p>
  </div>
  <div class="topic-grid">${paperCards}</div>
  <button class="start-btn" style="background:${s.color};" onclick="startAllPapers()">Start All Papers &rarr;</button>
  `;
}

function renderAllDone() {
  const s = subj();
  const mode = state.allDoneMode || state.appMode;
  const isTarget = mode === 'target';
  const totalQ = isTarget ? targetPoolForSubject(s).length : pastPool().length;
  const answered = Object.keys(answerHistory).filter(id => {
    const pool = isTarget ? targetPoolForSubject(s) : pastPool();
    return pool.some(q => q.id === id);
  });
  const correct = answered.filter(id => answerHistory[id] && answerHistory[id].correct).length;
  const pct = totalQ > 0 ? Math.round((correct/totalQ)*100) : 0;

  // Build full review of all answered questions
  const pool = isTarget ? targetPoolForSubject(s) : pastPool();
  const reviewItems = pool.filter(q => answerHistory[q.id]).map((q,i) => {
    const ah = answerHistory[q.id];
    const isCorrect = ah.correct;
    const bg = isCorrect ? 'var(--correct-bg)' : 'var(--wrong-bg)';
    const bdr = isCorrect ? 'var(--correct-border)' : 'var(--wrong-border)';
    const icon = isCorrect ? '✓' : '✗';
    const ic = isCorrect ? 'var(--correct)' : 'var(--wrong)';
    return `<div style="background:${bg};border:1px solid ${bdr};border-radius:12px;padding:1rem 1.2rem;margin-bottom:8px;font-size:0.86rem;">
      <div style="font-weight:600;margin-bottom:5px;color:${ic};">${icon} Q${i+1}. ${q.text.replace(/\n/g,'<br>')}</div>
      <div style="color:var(--text-muted);">Your answer: <strong style="color:${ic};">${q.opts[ah.selected] ?? '?'}</strong></div>
      ${!isCorrect ? `<div style="color:var(--text-muted);">Correct: <strong style="color:var(--correct);">${q.opts[q.ans]}</strong></div>` : ''}
      <div style="font-size:0.8rem;color:#888;margin-top:6px;border-top:1px solid #333;padding-top:6px;">${q.exp}</div>
    </div>`;
  }).join('');

  return `
  <div style="text-align:center;padding:2rem 0 1rem;">
    <div style="font-size:3.5rem;margin-bottom:1rem;">🏆</div>
    <h1 style="margin-bottom:0.5rem;color:${s.color};">All Questions Completed!</h1>
    <p style="color:var(--text-muted);margin-bottom:1.5rem;">You've answered every ${isTarget?'Target':'Past Paper'} question in <strong style="color:${s.color};">${s.label}</strong>. Here's your complete record.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:1.5rem;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1rem 1.5rem;min-width:100px;">
        <div style="font-size:1.8rem;font-weight:700;color:${s.color};font-family:'DM Mono',monospace;">${answered.length}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">Answered</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1rem 1.5rem;min-width:100px;">
        <div style="font-size:1.8rem;font-weight:700;color:var(--correct);font-family:'DM Mono',monospace;">${correct}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">Correct</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1rem 1.5rem;min-width:100px;">
        <div style="font-size:1.8rem;font-weight:700;color:var(--wrong);font-family:'DM Mono',monospace;">${answered.length - correct}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">Incorrect</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1rem 1.5rem;min-width:100px;">
        <div style="font-size:1.8rem;font-weight:700;color:#fbbf24;font-family:'DM Mono',monospace;">${pct}%</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">Overall Score</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:2rem;">
      <button onclick="state.screen=isTarget?'targetHome':(state.allDoneMode==='fullpaper'?'paperHome':'home');renderApp()" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:0.7rem 1.3rem;cursor:pointer;">← Back to Setup</button>
    </div>
  </div>
  <div style="text-align:left;">
    <h2 style="font-size:1.1rem;margin-bottom:1rem;color:var(--text-muted);">Complete Review</h2>
    ${reviewItems || '<p style="color:var(--text-muted);text-align:center;">No answers recorded yet.</p>'}
  </div>`;
}


// ── Question Directory ───────────────────────────────────────────────────────
const MoraDirectoryData = window.MoraDirectoryData;
if (!MoraDirectoryData) {
  throw new Error('MoraDirectoryData must load before quiz_app.js');
}
var ensureDirectoryDataLoaded = MoraDirectoryData.ensureDirectoryDataLoaded;
var directoryRecords = MoraDirectoryData.directoryRecords;

function filteredDirectoryRecords() {
  const query = String(state.directoryQuery || '').trim().toLowerCase();
  return directoryRecords().filter(row => {
    if (state.directorySubject !== 'all' && row.subjectKey !== state.directorySubject) return false;
    if (state.directorySource !== 'all' && row.source !== state.directorySource) return false;
    if (!query) return true;
    const q = row.q;
    const haystack = [
      row.subjectLabel, row.sourceLabel, row.unitLabel, row.year, q.id, cleanDisplayText(q.text), cleanDisplayText(q.exp),
      ...(Array.isArray(q.opts) ? q.opts.map(cleanDisplayText) : [])
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

function renderDirectoryResults() {
  const rows = filteredDirectoryRecords().slice(0, 120);
  const total = filteredDirectoryRecords().length;
  if (!rows.length) return '<div class="directory-empty">No matching questions found.</div>';
  return rows.map(row => {
    const q = row.q;
    const open = state.directoryOpenId === row.id;
    const meta = [
      row.subjectLabel,
      row.sourceLabel,
      row.unit ? `Unit ${String(row.unit).padStart(2, '0')}` : '',
      row.year || ''
    ].filter(Boolean).join(' · ');
    return `<article class="directory-row ${open ? 'open' : ''}" style="--row-accent:${row.color};">
      <button class="directory-row-head" onclick="toggleDirectoryQuestion('${row.id.replace(/'/g, "\\'")}')">
        <span class="directory-meta">${escapeHTML(meta)}</span>
        <strong>${renderTextBlock(q.text).slice(0, 260)}${String(q.text || '').length > 260 ? '...' : ''}</strong>
      </button>
      ${open ? `<div class="directory-detail">
        ${q.img ? `<button class="directory-image-btn" onclick="openImgViewer('${rootAssetPath(q.img).replace(/'/g, "\\'")}')">Open image</button>` : ''}
        <div class="directory-question">${renderTextBlock(q.text)}</div>
        ${Array.isArray(q.opts) ? `<div class="directory-options">${q.opts.map((opt, i) =>
          `<div class="${i === q.ans ? 'correct' : ''}"><span>${String.fromCharCode(65+i)}</span>${renderTextBlock(opt)}</div>`
        ).join('')}</div>` : ''}
        ${q.exp ? `<div class="directory-exp"><strong>Explanation</strong><br>${renderTextBlock(q.exp)}</div>` : ''}
        <button class="directory-ask" onclick="askJanudaFromDirectory('${row.id.replace(/'/g, "\\'")}')">Ask Januda Ayya</button>
      </div>` : ''}
    </article>`;
  }).join('') + (total > rows.length ? `<div class="directory-empty">Showing first ${rows.length} of ${total}. Narrow the search to see more.</div>` : '');
}

function toggleDirectoryQuestion(recordId) {
  state.directoryOpenId = state.directoryOpenId === recordId ? '' : recordId;
  renderApp();
}

function askJanudaFromDirectory(recordId) {
  const row = directoryRecords().find(r => r.id === recordId);
  if (!row) return;
  openJanudaChat();
  const input = document.getElementById('chatInput');
  if (input) {
    const q = row.q;
    input.value = `Explain this ${row.sourceLabel} question clearly:\n\n${q.text}\n\nOptions:\n${(q.opts || []).map((o, i) => `${String.fromCharCode(65+i)}. ${o}`).join('\n')}`;
    input.focus();
  }
}

function updateDirectoryFilter(key, value) {
  state[key] = value;
  state.directoryOpenId = '';
  const results = document.getElementById('directoryResults');
  if (results) {
    const rows = filteredDirectoryRecords();
    const count = document.querySelector('.directory-count');
    if (count) count.textContent = `${rows.length} matching question${rows.length === 1 ? '' : 's'}`;
    results.innerHTML = renderDirectoryResults();
    setTimeout(renderMath, 40);
  } else {
    renderApp();
  }
}

async function renderQuestionDirectoryPage() {
  await ensureDirectoryDataLoaded();
  const rows = filteredDirectoryRecords();
  return `
  <div class="header" style="padding:2rem 0 1.2rem;">
    <div class="header-badge" style="background:#10252d;border-color:#43d7ff44;color:#43d7ff;">QD - Search</div>
    <h1 style="margin-bottom:0.5rem;">Question Directory</h1>
    <p>Search questions, answers, explanations, units, and papers without starting a quiz.</p>
  </div>
  <div class="directory-shell">
    <div class="directory-controls">
      <input class="directory-search" value="${escapeHTML(state.directoryQuery)}" placeholder="Search questions, formulas, years, units..."
        oninput="updateDirectoryFilter('directoryQuery', this.value)">
      <select onchange="updateDirectoryFilter('directorySubject', this.value)">
        <option value="all" ${state.directorySubject === 'all' ? 'selected' : ''}>All subjects</option>
        ${Object.entries(SUBJECTS).map(([key, s]) => `<option value="${key}" ${state.directorySubject === key ? 'selected' : ''}>${escapeHTML(s.label)}</option>`).join('')}
      </select>
      <select onchange="updateDirectoryFilter('directorySource', this.value)">
        <option value="all" ${state.directorySource === 'all' ? 'selected' : ''}>All banks</option>
        <option value="pastUnit" ${state.directorySource === 'pastUnit' ? 'selected' : ''}>Unit-wise Past Paper</option>
        <option value="pastPaper" ${state.directorySource === 'pastPaper' ? 'selected' : ''}>Full Past Paper</option>
        <option value="targetNormal" ${state.directorySource === 'targetNormal' ? 'selected' : ''}>Normal Target</option>
        <option value="targetHard" ${state.directorySource === 'targetHard' ? 'selected' : ''}>Hard Target</option>
      </select>
    </div>
    <div class="directory-count">${rows.length} matching question${rows.length === 1 ? '' : 's'}</div>
    <div id="directoryResults">${renderDirectoryResults()}</div>
  </div>`;
}

// ── Admin Page ────────────────────────────────────────────────────────────────
function lookupQuestion(questionId) {
  for (const key of Object.keys(SUBJECTS)) {
    const s = SUBJECTS[key];
    for (const pool of [s.pastUnit, s.pastPaper, s.targetNormal, s.targetHard]) {
      const q = pool.find(q => q.id === questionId);
      if (q) return q;
    }
  }
  return null;
}

function _adminToggle(key, currentVal, label, hint) {
  const on = currentVal === true || currentVal === 'true';
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;padding:0.9rem 0;border-bottom:1px solid #1e2235;">
    <div>
      <div style="font-size:0.88rem;font-weight:600;color:var(--text);">${label}</div>
      ${hint ? `<div style="font-size:0.74rem;color:var(--text-muted);margin-top:2px;">${hint}</div>` : ''}
    </div>
    <button onclick="adminToggleSetting('${key}',${!on})" style="
      width:46px;height:26px;border-radius:13px;border:none;cursor:pointer;
      background:${on?'#4ade80':'#2e3348'};position:relative;transition:background 0.2s;flex-shrink:0;">
      <span style="position:absolute;top:3px;${on?'right:3px':'left:3px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:left 0.2s,right 0.2s;display:block;"></span>
    </button>
  </div>`;
}

function _adminCheckboxGroup(key, currentArr, options, label, hint) {
  const arr = Array.isArray(currentArr) ? currentArr : [];
  const checks = options.map(([val, lbl]) => `
    <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;margin-right:16px;">
      <input type="checkbox" ${arr.includes(val)?'checked':''} onchange="adminToggleArraySetting('${key}','${val}',this.checked)"
        style="accent-color:#6c8bef;width:15px;height:15px;">
      ${lbl}
    </label>`).join('');
  return `
  <div style="padding:0.9rem 0;border-bottom:1px solid #1e2235;">
    <div style="font-size:0.88rem;font-weight:600;color:var(--text);margin-bottom:4px;">${label}</div>
    ${hint ? `<div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:8px;">${hint}</div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:4px;">${checks}</div>
  </div>`;
}

function _adminWeightInput(key, val, label) {
  return `<div style="background:#111320;border:1px solid #1e2235;border-radius:10px;padding:8px 10px;">
    <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:4px;">${label}</div>
    <input type="number" min="0" max="10" step="1" value="${Number(val)}"
      onchange="adminSaveNumberSetting('${key}',this.value)"
      style="width:100%;background:transparent;border:none;color:var(--text);font-size:1.1rem;font-weight:700;font-family:'DM Mono',monospace;text-align:center;outline:none;">
  </div>`;
}

async function adminSaveNumberSetting(key, rawVal) {
  const val = Math.max(0, Math.min(10, Math.round(Number(rawVal))));
  await dbSaveAppSetting(key, val);
}
window.adminSaveNumberSetting = adminSaveNumberSetting;

function renderAdminSettings() {
  const cfg = window._appSettings || {};
  return `
  <div style="background:#1a1d27;border:1px solid #2e3348;border-radius:14px;overflow:hidden;margin-bottom:2rem;">
    <div style="padding:1rem 1.2rem;border-bottom:1px solid #2e3348;display:flex;align-items:center;gap:10px;">
      <div style="font-size:0.85rem;font-weight:600;color:var(--text);">App Settings</div>
      <div style="font-size:0.72rem;color:var(--text-muted);">Changes apply immediately for all users</div>
    </div>
    <div style="padding:0 1.2rem 0.5rem;">
      ${_adminToggle('exam_mode_enabled', cfg.exam_mode_enabled ?? true,
          'Exam Mode',
          'Show the Practice / Exam mode picker before starting a past paper quiz')}
      ${_adminCheckboxGroup('exam_mode_modes', cfg.exam_mode_modes ?? ['pastpaper','fullpaper'],
          [['pastpaper','Unit-wise Past Papers'],['fullpaper','Full Papers']],
          'Exam Mode applies to',
          'Which quiz types offer the Exam option')}
      ${_adminToggle('timer_enabled', cfg.timer_enabled ?? true,
          'Timer Setup',
          'Show the timer picker before quiz starts. Disable this for instant quiz starts.')}
      ${_adminToggle('flags_enabled', cfg.flags_enabled ?? true,
          'Question Flags',
          'Allow users to flag questions for later review')}
      ${_adminToggle('leaderboard_public', cfg.leaderboard_public ?? true,
          'Public Leaderboard',
          'Show leaderboard to all users (including guests)')}
      ${_adminCheckboxGroup('leaderboard_modes', cfg.leaderboard_modes ?? ['pastpaper','target'],
          [['pastpaper','Unit-wise Past Papers'],['target','Target Quiz'],['fullpaper','Full Papers']],
          'Overall leaderboard counts',
          'Full Papers are excluded by default. The separate Past Paper Accuracy board always uses unit-wise past paper quizzes.')}

      <div style="padding:0.9rem 0 0.3rem;border-bottom:1px solid #1e2235;">
        <div style="font-size:0.88rem;font-weight:600;color:var(--text);margin-bottom:4px;">Smart Mode Weights</div>
        <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:10px;">Controls how often each question type appears. 0 = skip, higher = more frequent.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${_adminWeightInput('sr_weight_never',      cfg.sr_weight_never      ?? 5, 'Never attempted')}
          ${_adminWeightInput('sr_weight_correct',    cfg.sr_weight_correct    ?? 0, 'Answered correctly')}
          ${_adminWeightInput('sr_weight_wrong',      cfg.sr_weight_wrong      ?? 3, 'Answered wrong (once)')}
          ${_adminWeightInput('sr_weight_multi_wrong',cfg.sr_weight_multi_wrong ?? 5, 'Wrong multiple times')}
        </div>
      </div>
    </div>
  </div>`;
}

function adminConfirmResetHistory(userId, displayName) {
  document.getElementById('adminResetDlg')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="adminResetDlg" class="guest-auth-overlay" onclick="if(event.target===this)document.getElementById('adminResetDlg')?.remove()">
      <div style="background:var(--surface);border:1.5px solid #5c1a1a;border-radius:20px;padding:1.8rem 1.5rem;max-width:380px;width:calc(100% - 2rem);position:relative;">
        <button class="auth-close" onclick="document.getElementById('adminResetDlg')?.remove()">×</button>
        <div style="font-size:0.68rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#f87171;margin-bottom:0.7rem;">⚠ Destructive Action</div>
        <h2 style="font-size:1.05rem;margin-bottom:0.5rem;">Reset history for ${displayName}?</h2>
        <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;margin-bottom:1.2rem;">
          This permanently deletes all quiz sessions, answer history, performance data, achievements, and flags for this account.<br>
          <strong style="color:#f87171;">This cannot be undone.</strong>
        </p>
        <div class="guest-auth-actions">
          <button onclick="adminDoResetHistory('${userId}','${displayName}')" style="background:#c0392b;border:none;border-radius:10px;color:#fff;font-weight:700;padding:0.6rem 1.4rem;cursor:pointer;font-family:inherit;font-size:0.9rem;">Yes, Reset Everything</button>
          <button class="guest-primary" onclick="document.getElementById('adminResetDlg')?.remove()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}
window.adminConfirmResetHistory = adminConfirmResetHistory;

async function adminDoResetHistory(userId, displayName) {
  document.getElementById('adminResetDlg')?.remove();
  try {
    await dbAdminResetUserHistory(userId);
    // Show toast
    showAuthToast(`History reset for ${displayName}`);
    // Refresh admin page
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Refreshing…</div>';
      renderAdminPage().then(html => { app.innerHTML = html; applyScrollReveal(); });
    }
  } catch(e) {
    alert('Reset failed: ' + (e.message || e));
  }
}
window.adminDoResetHistory = adminDoResetHistory;

async function adminToggleSetting(key, value) {
  await dbSaveAppSetting(key, value);
  // Re-render admin page to reflect new state
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Saving…</div>';
    renderAdminPage().then(html => { app.innerHTML = html; });
  }
}
window.adminToggleSetting = adminToggleSetting;

async function adminToggleArraySetting(key, val, checked) {
  const arr = Array.isArray(window._appSettings?.[key]) ? [...window._appSettings[key]] : [];
  if (checked && !arr.includes(val)) arr.push(val);
  if (!checked) { const i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1); }
  await dbSaveAppSetting(key, arr);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Saving…</div>';
    renderAdminPage().then(html => { app.innerHTML = html; });
  }
}
window.adminToggleArraySetting = adminToggleArraySetting;

async function renderAdminPage() {
  if (!isAdmin()) return '<div style="text-align:center;padding:4rem;color:#f87171;">Access denied.</div>';

  let overview, users, missed, activity, guests;
  try {
    await ensureAllSubjectData();
    [overview, users, missed, activity, guests] = await Promise.all([
      dbAdminOverview(),
      dbAdminUserStats(),
      dbAdminMostMissed(15),
      dbAdminDailyActivity(),
      dbAdminGuestStats().catch(() => ({}))
    ]);
  } catch(e) {
    return '<div style="text-align:center;padding:4rem;color:#f87171;">Failed to load admin data: ' + e.message + '</div>';
  }

  const globalAcc = overview.total_questions > 0
    ? Math.round(overview.total_correct / overview.total_questions * 100) : 0;

  function statCard(val, lbl, color) {
    return `<div style="background:#1a1d27;border:1px solid #2e3348;border-radius:14px;padding:1.1rem 1.3rem;text-align:center;flex:1;min-width:120px;">
      <div style="font-size:1.7rem;font-weight:700;color:${color};font-family:'DM Mono',monospace;">${val}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px;">${lbl}</div>
    </div>`;
  }

  // Most missed questions rows
  const missedRows = missed.map(r => {
    const q = lookupQuestion(r.question_id);
    const preview = q ? q.text.replace(/\n/g, ' ').substring(0, 80) + (q.text.length > 80 ? '…' : '') : r.question_id;
    const accColor = r.accuracy < 30 ? '#f87171' : r.accuracy < 50 ? '#fbbf24' : '#4ade80';
    return `<tr style="border-top:1px solid #1e2235;">
      <td style="padding:10px 12px;font-size:0.8rem;color:var(--text-muted);font-family:'DM Mono',monospace;white-space:nowrap;">${r.question_id}</td>
      <td style="padding:10px 12px;font-size:0.82rem;color:var(--text);">${preview}</td>
      <td style="padding:10px 12px;text-align:center;font-family:'DM Mono',monospace;font-size:0.82rem;color:var(--text-muted);">${r.total_attempts}</td>
      <td style="padding:10px 12px;text-align:center;font-family:'DM Mono',monospace;font-weight:700;color:${accColor};">${r.accuracy}%</td>
    </tr>`;
  }).join('');

  // User rows
  const userRows = users.map((u, i) => {
    const accColor = !u.total_q ? 'var(--text-muted)' : u.accuracy >= 70 ? '#4ade80' : u.accuracy >= 50 ? '#fbbf24' : '#f87171';
    const lastActive = u.last_active ? new Date(u.last_active).toLocaleDateString() : '—';
    const safeName = (u.display_name || 'this user').replace(/'/g, "\\'");
    const safeId   = u.user_id;
    return `<tr style="border-top:1px solid #1e2235;">
      <td style="padding:9px 12px;font-size:0.82rem;color:var(--text);font-weight:500;">${u.display_name || '—'}</td>
      <td style="padding:9px 12px;font-size:0.78rem;color:var(--text-muted);">${u.email || '—'}</td>
      <td style="padding:9px 12px;text-align:center;font-family:'DM Mono',monospace;font-size:0.82rem;color:var(--text-muted);">${u.quizzes}</td>
      <td style="padding:9px 12px;text-align:center;font-family:'DM Mono',monospace;font-size:0.82rem;color:var(--text-muted);">${u.total_q}</td>
      <td style="padding:9px 12px;text-align:center;font-family:'DM Mono',monospace;font-weight:700;color:${accColor};">${u.total_q ? u.accuracy + '%' : '—'}</td>
      <td style="padding:9px 12px;text-align:right;font-size:0.75rem;color:var(--text-muted);">${lastActive}</td>
      <td style="padding:9px 12px;text-align:center;">
        <button onclick="adminConfirmResetHistory('${safeId}','${safeName}')"
          style="background:transparent;border:1px solid #5c1a1a;border-radius:7px;color:#f87171;font-size:0.72rem;padding:3px 10px;cursor:pointer;font-family:inherit;transition:background 0.15s,border-color 0.15s;"
          onmouseover="this.style.background='#2b0d0d';this.style.borderColor='#c0392b'"
          onmouseout="this.style.background='transparent';this.style.borderColor='#5c1a1a'"
          title="Reset all quiz history for this user">Reset</button>
      </td>
    </tr>`;
  }).join('');

  // Activity bar chart (last 14 days)
  const activityDays = activity.slice(0, 14).reverse();
  const maxQ = Math.max(...activityDays.map(d => Number(d.questions)), 1);
  const activityBars = activityDays.map(d => {
    const h = Math.round(Number(d.questions) / maxQ * 56);
    const label = new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
      <div style="font-size:9px;color:var(--text-muted);font-family:'DM Mono',monospace;">${d.quizzes}</div>
      <div style="width:100%;background:#1e2235;border-radius:4px;height:60px;display:flex;align-items:flex-end;">
        <div style="width:100%;height:${h}px;background:#5a6ef0;border-radius:3px 3px 0 0;min-height:2px;transition:height 0.6s;"></div>
      </div>
      <div style="font-size:9px;color:var(--text-muted);font-family:'DM Mono',monospace;transform:rotate(-40deg);transform-origin:top center;margin-top:4px;">${label}</div>
    </div>`;
  }).join('');

  const tableStyle = 'width:100%;border-collapse:collapse;font-size:0.85rem;';
  const thStyle = 'padding:8px 12px;text-align:left;font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #2e3348;';

  return `
  <div class="header" style="padding:2rem 0 1.5rem;">
    <div class="header-badge" style="background:#1a1d27;border-color:#2e3348;color:#a0a8d0;">Admin Dashboard</div>
    <h1 style="margin-bottom:0.4rem;">Dashboard</h1>
    <p style="color:var(--text-muted);">Platform statistics — visible to admins only</p>
  </div>

  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:1.5rem;">
    ${statCard(overview.total_users, 'Total Users', '#7dd3fc')}
    ${statCard(overview.active_7d, 'Active (7d)', '#4ade80')}
    ${statCard(overview.active_30d, 'Active (30d)', '#a78bfa')}
    ${statCard(overview.total_quizzes, 'Total Quizzes', '#fbbf24')}
    ${statCard(globalAcc + '%', 'Overall Accuracy', globalAcc >= 60 ? '#4ade80' : '#f87171')}
    ${statCard(overview.quizzes_today, 'Today', '#f9a8d4')}
  </div>

  ${activityDays.length > 0 ? `
  <div style="background:#1a1d27;border:1px solid #2e3348;border-radius:14px;padding:1.2rem 1.3rem;margin-bottom:1.5rem;">
    <div style="font-size:0.82rem;font-weight:600;color:var(--text);margin-bottom:1rem;">Quiz Activity - Last 14 Days</div>
    <div style="display:flex;gap:4px;align-items:flex-end;padding-bottom:24px;">${activityBars}</div>
    <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Numbers above bars = quizzes completed that day</div>
  </div>` : ''}

  ${missed.length > 0 ? `
  <div style="background:#1a1d27;border:1px solid #2e3348;border-radius:14px;overflow:hidden;margin-bottom:1.5rem;">
    <div style="padding:1rem 1.2rem;border-bottom:1px solid #2e3348;">
      <div style="font-size:0.85rem;font-weight:600;color:var(--text);">Most Missed Questions</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Globally lowest accuracy (min. 2 attempts)</div>
    </div>
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>
          <th style="${thStyle}">ID</th>
          <th style="${thStyle}">Question Preview</th>
          <th style="${thStyle}text-align:center;">Attempts</th>
          <th style="${thStyle}text-align:center;">Accuracy</th>
        </tr></thead>
        <tbody>${missedRows}</tbody>
      </table>
    </div>
  </div>` : ''}

  ${(() => {
    // Guest stats section
    const gAcc = guests.total_questions > 0
      ? Math.round(guests.total_correct / guests.total_questions * 100) : 0;
    const convRate = guests.total_guests > 0
      ? Math.round(guests.converted / guests.total_guests * 100) : 0;
    return guests.total_guests > 0 ? `
    <div style="background:#1a1d27;border:1px solid #2e3348;border-radius:14px;overflow:hidden;margin-bottom:1.5rem;">
      <div style="padding:1rem 1.2rem;border-bottom:1px solid #2e3348;display:flex;align-items:center;gap:8px;">
        <div style="font-size:0.85rem;font-weight:600;color:var(--text);">Guest Users</div>
        <div style="font-size:0.72rem;color:var(--text-muted);">Unregistered visitors</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;padding:1.1rem 1.2rem;">
        ${statCard(guests.total_guests,    'Unique Guests',    '#7dd3fc')}
        ${statCard(guests.active_7d,       'Active (7d)',      '#a78bfa')}
        ${statCard(guests.active_30d,      'Active (30d)',     '#818cf8')}
        ${statCard(guests.total_quizzes,   'Guest Quizzes',   '#fbbf24')}
        ${statCard(gAcc + '%',             'Avg Accuracy',    gAcc >= 60 ? '#4ade80' : '#f87171')}
        ${statCard(convRate + '%',         'Conversion Rate', convRate >= 20 ? '#4ade80' : '#fbbf24')}
      </div>
      <div style="padding:0 1.2rem 0.9rem;font-size:0.74rem;color:var(--text-muted);">
        Conversion rate = guests who later created an account. Total questions answered by guests: <strong style="color:var(--text);">${guests.total_questions ?? 0}</strong>
      </div>
    </div>` : '';
  })()}

  ${users.length > 0 ? `
  <div style="background:#1a1d27;border:1px solid #2e3348;border-radius:14px;overflow:hidden;margin-bottom:2rem;">
    <div style="padding:1rem 1.2rem;border-bottom:1px solid #2e3348;display:flex;justify-content:space-between;align-items:baseline;">
      <div style="font-size:0.85rem;font-weight:600;color:var(--text);">All Users</div>
      <div style="font-size:0.75rem;color:var(--text-muted);">${users.length} registered</div>
    </div>
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>
          <th style="${thStyle}">Name</th>
          <th style="${thStyle}">Email</th>
          <th style="${thStyle}text-align:center;">Quizzes</th>
          <th style="${thStyle}text-align:center;">Questions</th>
          <th style="${thStyle}text-align:center;">Accuracy</th>
          <th style="${thStyle}text-align:right;">Last Active</th>
          <th style="${thStyle}text-align:center;">Actions</th>
        </tr></thead>
        <tbody>${userRows}</tbody>
      </table>
    </div>
  </div>` : '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No users yet.</p>'}

  ${renderAdminSettings()}
  `;
}

// ── View All Questions (browse mode) ─────────────────────────────────────────
// Answers are hidden by default; each question has a per-question reveal toggle.
function _vaReveal(idx) {
  const ans  = document.getElementById('va-ans-'  + idx);
  const btn  = document.getElementById('va-btn-'  + idx);
  if (!ans || !btn) return;
  const showing = ans.style.display !== 'none';
  ans.style.display  = showing ? 'none' : 'block';
  btn.innerHTML = showing
    ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/></svg>Reveal Answer'
    : '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>Hide Answer';
}
window._vaReveal = _vaReveal;

function renderExamQuiz() {
  const s        = subj();
  const pages    = state.examPages;
  const pageIdx  = state.examCurrentPage;
  const page     = pages[pageIdx] || [];

  // Global index of first question on this page
  let globalStart = 0;
  for (let i = 0; i < pageIdx; i++) globalStart += pages[i].length;

  const totalAnswered = Object.keys(state.examAnswers).length;
  const total         = state.questions.length;
  const isFirst       = pageIdx === 0;
  const isLast        = pageIdx === pages.length - 1;
  const pageStart     = globalStart + 1;
  const pageEnd       = globalStart + page.length;

  const timerVal = state.countdownLimit > 0
    ? formatTime(state.countdownRemaining)
    : formatTime(state.timerSeconds);
  const timerColor = state.countdownLimit > 0 && state.countdownRemaining < 300
    ? '#f87171' : '#a0a8c8';

  const qCards = page.map((q, pIdx) => {
    const globalNum  = globalStart + pIdx + 1;
    const selectedOpt = state.examAnswers[q.id] ?? -1;
    const opts = q.opts.map((opt, oi) => {
      const sel = oi === selectedOpt;
      return `<button class="exam-opt${sel?' exam-selected':''}" onclick="examSelectAnswer('${q.id}',${oi})">
        <span class="exam-opt-letter${sel?' sel':''}"> ${letters[oi]}</span>
        <span>${normalizePlainMathText(opt)}</span>
      </button>`;
    }).join('');

    return `
    <div class="exam-q-card" id="eq-${q.id}">
      <div class="exam-q-meta">
        <span class="exam-q-num">Q${globalNum}</span>
        ${q.unit ? `<span class="q-tag ${unitClass(q.unit)}" style="font-size:0.7rem;">${unitTag(q.unit)}</span>` : ''}
        ${q.year ? `<span class="q-tag" style="font-size:0.7rem;">${q.year}</span>` : ''}
        ${q.hard ? `<span class="q-tag" style="background:#1a0808;border-color:#5c1a1a;color:#f87171;font-size:0.7rem;">Hard</span>` : ''}
        ${selectedOpt >= 0 ? `<span style="margin-left:auto;background:#10152a;border:1px solid #304080;color:#8090c8;border-radius:6px;font-size:0.7rem;padding:2px 8px;font-family:'DM Mono',monospace;">✓ ${letters[selectedOpt]}</span>` : ''}
        ${window._appSettings?.flags_enabled !== false ? `<button id="eflag-${q.id}" class="flag-btn${isFlagged(state.currentSubject,q.id)?' flagged':''}" onclick="toggleFlagUI('${state.currentSubject}','${q.id}')" title="Flag for review" style="margin-left:${selectedOpt>=0?'4px':'auto'};">!</button>` : ''}
      </div>
      ${q.context ? `<div class="q-context" style="margin-bottom:0.6rem;"><pre>${cleanDisplayText(q.context)}</pre></div>` : ''}
      ${q.img ? `<div style="margin:0.5rem 0;text-align:center;"><img src="${rootAssetPath(q.img)}" alt="${q.imgAlt||'Figure'}" style="max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--border);background:#fff;padding:4px;cursor:zoom-in;" onclick="openImgViewer(this.src,this.alt,'')"></div>` : ''}
      <div class="q-text" style="margin:0.6rem 0 0.9rem;font-size:0.9rem;line-height:1.6;">${formatQuestionText(q.text)}</div>
      <div class="exam-opts">${opts}</div>
    </div>`;
  }).join('');

  // Page dots — show up to 12 dots, collapse to numbers beyond that
  const dotNav = pages.length <= 12
    ? pages.map((_, i) => `<span class="exam-dot${i===pageIdx?' active':''}" onclick="examGoToPage(${i - pageIdx})" title="Page ${i+1}"></span>`).join('')
    : `<span style="font-size:0.78rem;color:var(--text-muted);font-family:'DM Mono',monospace;">${pageIdx+1} / ${pages.length}</span>`;

  return `
  <div class="exam-wrap">

    <div class="exam-header">
      <div class="exam-header-left">
        <span class="exam-badge">EXAM</span>
        <span class="exam-subject">${s.label}</span>
      </div>
      <div class="exam-header-right">
        <span class="exam-progress">${totalAnswered} / ${total} answered</span>
        <span style="font-family:'DM Mono',monospace;font-size:0.88rem;color:${timerColor};">${timerVal}</span>
        <button class="exam-submit-btn" onclick="submitExamConfirm()">Submit Paper</button>
      </div>
    </div>

    <div class="exam-page-indicator">
      Page ${pageIdx+1} of ${pages.length} &nbsp;·&nbsp; Questions ${pageStart}–${pageEnd}
    </div>

    <div class="exam-questions">${qCards}</div>

    <div class="exam-page-nav">
      <button class="exam-nav-btn" onclick="examGoToPage(-1)" ${isFirst?'disabled':''}>← Prev</button>
      <div class="exam-page-dots">${dotNav}</div>
      ${isLast
        ? `<button class="exam-nav-btn exam-nav-submit" onclick="submitExamConfirm()">Submit →</button>`
        : `<button class="exam-nav-btn" onclick="examGoToPage(1)">Next →</button>`}
    </div>

  </div>`;
}

function renderViewAll() {
  const s  = subj();
  const qs = state.viewAllQuestions;
  if (!qs || qs.length === 0) {
    return `<div style="text-align:center;padding:4rem 1rem;color:var(--text-muted);">No questions found.</div>`;
  }
  const title = state.viewAllTitle;

  const eyeIcon = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/></svg>`;

  const items = qs.map((q, i) => {
    const prevAns = answerHistory[q.id];

    // Plain options — no highlighting (answers hidden until revealed)
    const optRows = q.opts.map((opt, oi) =>
      `<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface2);margin-bottom:6px;">
        <span style="min-width:22px;height:22px;border-radius:50%;background:var(--border);display:inline-flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:var(--text-muted);flex-shrink:0;">${letters[oi]}</span>
        <span style="color:var(--text);font-size:0.875rem;line-height:1.45;">${normalizePlainMathText(opt)}</span>
      </div>`
    ).join('');

    // Revealed answer section — correct option highlighted + explanation
    const revealRows = q.opts.map((opt, oi) => {
      const isCorrect = oi === q.ans;
      const wasPicked = prevAns && prevAns.selected === oi;
      const bg     = isCorrect ? 'var(--correct-bg)'  : (wasPicked ? 'var(--wrong-bg)'    : 'var(--surface2)');
      const border = isCorrect ? 'var(--correct-border)' : (wasPicked ? 'var(--wrong-border)' : 'var(--border)');
      const color  = isCorrect ? 'var(--correct)'     : (wasPicked ? 'var(--wrong)'       : 'var(--text-muted)');
      const weight = isCorrect ? '600' : '400';
      return `<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border-radius:10px;border:1px solid ${border};background:${bg};margin-bottom:6px;">
        <span style="min-width:22px;height:22px;border-radius:50%;background:${isCorrect?'var(--correct)':'var(--border)'};display:inline-flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:${isCorrect?'#000':'var(--text-muted)'};flex-shrink:0;">${letters[oi]}</span>
        <span style="color:${color};font-weight:${weight};font-size:0.875rem;line-height:1.45;">${normalizePlainMathText(opt)}</span>
        ${isCorrect  ? `<span style="margin-left:auto;font-size:0.75rem;color:var(--correct);font-weight:700;flex-shrink:0;white-space:nowrap;">✓ Correct</span>` : ''}
        ${wasPicked && !isCorrect ? `<span style="margin-left:auto;font-size:0.75rem;color:var(--wrong);font-weight:700;flex-shrink:0;white-space:nowrap;">Your answer</span>` : ''}
      </div>`;
    }).join('');

    const seenBadge = prevAns
      ? `<span style="background:${prevAns.correct?'#0d2b1a':'#2b0d0d'};border:1px solid ${prevAns.correct?'#1a5c35':'#5c1a1a'};color:${prevAns.correct?'var(--correct)':'var(--wrong)'};border-radius:100px;font-size:0.7rem;font-weight:700;padding:2px 9px;">${prevAns.correct?'✓ Answered correctly':'✗ Answered incorrectly'}</span>`
      : '';

    return `
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:16px;padding:1.3rem 1.4rem;margin-bottom:14px;">
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:0.8rem;">
        <span style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;font-size:0.7rem;color:var(--text-muted);font-family:'DM Mono',monospace;padding:2px 8px;font-weight:600;">${i+1}</span>
        ${q.unit ? `<span class="q-tag ${unitClass(q.unit)}" style="font-size:0.7rem;">${unitTag(q.unit)}</span>` : ''}
        ${q.year ? `<span class="q-tag" style="font-size:0.7rem;">${q.year}</span>` : ''}
        ${q.hard ? `<span class="q-tag" style="background:#2b0808;border-color:#c0392b;color:#f87171;font-size:0.7rem;">Hard</span>` : ''}
        ${seenBadge}
      </div>
      ${q.context ? `<div class="q-context" style="margin-bottom:0.7rem;"><pre>${cleanDisplayText(q.context)}</pre></div>` : ''}
      ${q.img ? `<div style="margin-bottom:0.8rem;text-align:center;">
        <img src="${rootAssetPath(q.img)}" alt="${q.imgAlt||'Figure'}"
          style="max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--border);background:#fff;padding:6px;cursor:zoom-in;"
          onclick="openImgViewer(this.src,this.alt,'')" title="Click to enlarge">
      </div>` : ''}
      <div class="q-text" style="margin-bottom:0.9rem;font-size:0.9rem;line-height:1.6;">${formatQuestionText(q.text)}</div>
      ${optRows}
      <button id="va-btn-${i}" onclick="_vaReveal(${i})"
        style="margin-top:10px;display:inline-flex;align-items:center;background:var(--surface2);border:1px solid var(--border);border-radius:9px;color:var(--text-muted);font-size:0.78rem;padding:6px 14px;cursor:pointer;font-family:inherit;transition:border-color 0.15s,color 0.15s;"
        onmouseover="this.style.borderColor='${s.color}';this.style.color='${s.color}'"
        onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-muted)'"
      >${eyeIcon}Reveal Answer</button>
      <div id="va-ans-${i}" style="display:none;margin-top:10px;">
        ${revealRows}
        ${q.exp ? `<div class="explanation" style="margin-top:8px;"><strong>Explanation</strong> ${cleanDisplayText(q.exp)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const canStart = !!state.viewAllToken;

  return `
  <div class="header" style="padding:1.8rem 0 1rem;">
    <div class="header-badge" style="background:${s.colorBg};border-color:${s.color}44;color:${s.color};">${s.icon} ${s.label}</div>
    <h1 style="margin-bottom:0.3rem;">${title}</h1>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:${canStart?'1rem':'0'};">${qs.length} question${qs.length!==1?'s':''} · tap <strong style="color:var(--text);">Show Answer</strong> to reveal</p>
    ${canStart ? `<button onclick="startViewAllQuiz()"
      style="background:${s.color};color:#fff;border:none;border-radius:12px;padding:0.7rem 1.6rem;font-size:0.92rem;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:8px;transition:opacity 0.15s;"
      onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
      Start Quiz
    </button>` : ''}
  </div>
  <div style="margin-bottom:5rem;">${items}</div>
  ${canStart ? `
  <div style="position:sticky;bottom:1.2rem;text-align:center;">
    <button onclick="startViewAllQuiz()"
      style="background:${s.color};color:#fff;border:none;border-radius:100px;padding:0.75rem 2.2rem;font-size:0.95rem;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 24px ${s.color}55;transition:opacity 0.15s;"
      onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
      Start Quiz
    </button>
  </div>` : ''}`;
}

function renderHome() {
  const s = subj();
  const units = s.units;
  const allAnswered = Object.keys(answerHistory);
  const selectedUnits = state.topics.filter(id => s.pastUnit.some(q => q.unit === id));
  const selectedPool = s.pastUnit.filter(q => state.topics.includes(q.unit));
  const selectedActionUnit = selectedUnits.length === 1 ? selectedUnits[0] : null;
  const selectedActionLabel = selectedActionUnit ? `Unit ${String(selectedActionUnit).padStart(2,'0')} · ${units[selectedActionUnit]}` : '';

  // Sort: in-progress (some answered, not all) → not started → completed
  const unitIds = Object.keys(units).map(Number).sort((a, b) => {
    const aQs = s.pastUnit.filter(q => q.unit === a);
    const bQs = s.pastUnit.filter(q => q.unit === b);
    const aDone = aQs.filter(q => allAnswered.includes(q.id)).length;
    const bDone = bQs.filter(q => allAnswered.includes(q.id)).length;
    const aHas = aQs.length > 0, bHas = bQs.length > 0;
    const aComplete = aHas && aDone === aQs.length;
    const bComplete = bHas && bDone === bQs.length;
    const aProgress = aDone > 0 && !aComplete;
    const bProgress = bDone > 0 && !bComplete;
    // No questions → last
    if (aHas !== bHas) return aHas ? -1 : 1;
    // Completed → last
    if (aComplete !== bComplete) return aComplete ? 1 : -1;
    // In-progress → first among non-completed
    if (aProgress !== bProgress) return aProgress ? -1 : 1;
    return a - b;
  });

  return `
  <div class="header">
    <div class="header-badge" style="background:${s.colorBg};border-color:${s.color}44;color:${s.color};">${s.icon} ${s.label} - Past Paper</div>
    <h1>Past Paper Quiz</h1>
    <p>Practice past exam questions with AI explanations</p>
  </div>

  <div class="unit-chip-panel">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:0.75rem;">
    <h2 style="font-size:1rem;margin:0;color:var(--text);">Select Units</h2>
    <div style="display:flex;gap:8px;">
    <button onclick="selectAllTopics()" style="background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);padding:4px 12px;font-size:0.74rem;cursor:pointer;font-family:inherit;transition:border-color 0.15s,color 0.15s;" onmouseover="this.style.borderColor='${s.color}';this.style.color='${s.color}'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-muted)'">Select All</button>
    <button onclick="deselectAllTopics()" style="background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);padding:4px 12px;font-size:0.74rem;cursor:pointer;font-family:inherit;transition:border-color 0.15s,color 0.15s;" onmouseover="this.style.borderColor='var(--border-hover)';this.style.color='var(--text)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-muted)'">Deselect All</button>
    </div>
  </div>
  ${renderUnitChipPicker({ units, sourcePool: s.pastUnit, selected: state.topics, answeredIds: allAnswered, toggleFn: 'toggleTopic', accent: s.color })}
  ${selectedActionUnit ? `
    <div class="unit-chip-actions">
      <button
        data-token="pastUnit_unit_${selectedActionUnit}"
        data-title="${selectedActionLabel.replace(/"/g,'&quot;')}"
        data-back="home"
        onclick="showViewAllConfirm(this.dataset.token,this.dataset.title,this.dataset.back)">
        Show Selected Unit
      </button>
      ${_offlineBtn('unit', s.key, selectedActionUnit)}
      ${(() => {
        const uQs = s.pastUnit.filter(q => q.unit === selectedActionUnit);
        const flagCount = window._appSettings?.flags_enabled !== false
          ? [...getFlaggedIds(s.key)].filter(fid => uQs.some(q => q.id === fid)).length
          : 0;
        return flagCount ? `<button onclick="startFlaggedQuiz(${selectedActionUnit})">Practice ${flagCount} Flagged</button>` : '';
      })()}
    </div>` : `<div class="unit-chip-hint">Select one unit to browse or save it offline. Select multiple units to start a mixed quiz.</div>`}
  </div>

  <div class="mode-row">
    <button class="mode-btn ${state.mode==='standard'?'active':''}" onclick="setMode('standard')">Standard</button>
    <button class="mode-btn ${state.mode==='weak'?'active':''}" onclick="setMode('weak')">Weak Areas</button>
    <button class="mode-btn ${state.mode==='smart'?'active':''}" onclick="setMode('smart')" title="Prioritises questions you got wrong or never attempted">Smart</button>
  </div>

  <div style="margin:0.8rem 0;font-size:0.85rem;color:var(--text-muted);">
    ${(() => {
      const done = selectedPool.filter(q=>allAnswered.includes(q.id)).length;
      const rem = selectedPool.length - done;
      return rem > 0
        ? `<span style="color:var(--accent-light);">${rem} unseen</span> of ${selectedPool.length} questions`
        : `<span style="color:var(--correct);">All ${selectedPool.length} questions answered!</span>`;
    })()}
  </div>

  ${renderQuestionCountPicker(selectedPool.length, s.color)}
  <button class="start-btn" style="background:${s.color};" onclick="showModePickerModal('pastpaper')">Start Quiz →</button>
  `;
}

// GEMINI CHAT INTEGRATION
// ── Onboarding tooltip ───────────────────────────────────────────────────────
function markJanudaUsed() {
  try {
    localStorage.setItem('eq_januda_used', '1');
    localStorage.setItem('eq_januda_unused_answer_count', '0');
  } catch(e) {}
}

function hasUsedJanuda() {
  try {
    if (localStorage.getItem('eq_januda_used') === '1') return true;
  } catch(e) {}
  return chatState.messages.some(m => m.role === 'user');
}

function maybeNudgeJanuda() {
  let unansweredCount = 0;
  try {
    unansweredCount = parseInt(localStorage.getItem('eq_januda_unused_answer_count') || '0', 10) || 0;
    unansweredCount += 1;
    localStorage.setItem('eq_januda_unused_answer_count', String(unansweredCount));
  } catch(e) {
    unansweredCount = state.results.length;
  }
  if (unansweredCount < 20 || unansweredCount % 20 !== 0 || sessionStorage.getItem('janudaNudgeSeen_' + unansweredCount)) return;
  sessionStorage.setItem('janudaNudgeSeen_' + unansweredCount, '1');
  document.getElementById('janudaNudge')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="janudaNudge" class="januda-nudge">
      <div>
        <strong>20 questions in. Need a hand?</strong>
        <span>Ask Januda Ayya to explain any tricky question or option.</span>
      </div>
      <button onclick="openJanudaChat();document.getElementById('janudaNudge')?.remove()">Ask Januda</button>
      <button class="januda-nudge-close" onclick="document.getElementById('janudaNudge')?.remove()">×</button>
    </div>
  `);
  setTimeout(() => document.getElementById('janudaNudge')?.remove(), 9000);
}

function toggleChat() {
  chatState.isOpen = !chatState.isOpen;
  const win = document.getElementById('chatWindow');
  if (!win) return;
  if (chatState.isOpen) {
    win.style.display = 'flex';
    win.classList.add('open');
    selectProvider(_activeProvider);
    const isReady = _activeProvider === 'qwen' || _activeProvider === 'groq';
    if (isReady) document.getElementById('chatInput')?.focus();
    renderChatMessages();
  } else {
    // Full reset — strip all snap/maximize classes and all inline geometry
    win.classList.remove('open', 'maximized', 'split-left', 'split-right');
    // Clear every inline style so CSS defaults (bottom:90px right:24px 360×500) take over
    ['top','left','right','bottom','width','height','maxHeight','borderRadius','overflow','transform','transition'].forEach(p => win.style[p] = '');
    // Restore app panel if it was shifted for split
    const app = document.getElementById('app');
    if (app) { app.style.marginLeft = ''; app.style.marginRight = ''; app.style.maxWidth = ''; app.style.zoom = ''; }
    // Reset zoom
    if (typeof window._chatResetZoom === 'function') window._chatResetZoom();
    // Sync internal window-management state to normal
    if (typeof window._chatWinForceNormal === 'function') window._chatWinForceNormal();
    win.style.display = 'none';
  }
}

// ── Chat window resize ───────────────────────────────────────────────────────
function openJanudaChat() {
  const win = document.getElementById('chatWindow');
  if (!win) return;
  if (!chatState.isOpen) {
    toggleChat();
    return;
  }
  win.style.display = 'flex';
  win.classList.add('open');
  renderChatMessages();
  setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
}

(function initChatResize() {
  let resizing = null; // { type: 'n'|'w'|'nw', startX, startY, startW, startH, startRight, startBottom }

  function onMouseDown(e, type) {
    e.preventDefault();
    const win = document.getElementById('chatWindow');
    const rect = win.getBoundingClientRect();
    resizing = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      // keep right/bottom anchored via fixed positioning
    };
    // Disable transition while resizing for smooth feel
    win.style.transition = 'opacity 0.3s';
    document.body.style.userSelect = 'none';
    document.body.style.cursor = type === 'n' ? 'ns-resize' : type === 'w' ? 'ew-resize' : 'nwse-resize';
  }

  document.addEventListener('mousemove', function(e) {
    if (!resizing) return;
    const win = document.getElementById('chatWindow');
    const dx = resizing.startX - e.clientX; // dragging left = positive
    const dy = resizing.startY - e.clientY; // dragging up = positive (grow taller)

    if (resizing.type === 'n' || resizing.type === 'nw') {
      const newH = Math.max(300, Math.min(window.innerHeight - 120, resizing.startH + dy));
      win.style.height = newH + 'px';
      win.style.maxHeight = 'none';
    }
    if (resizing.type === 'w' || resizing.type === 'nw') {
      const newW = Math.max(280, Math.min(window.innerWidth - 48, resizing.startW + dx));
      win.style.width = newW + 'px';
    }
  });

  document.addEventListener('mouseup', function() {
    if (!resizing) return;
    resizing = null;
    const win = document.getElementById('chatWindow');
    win.style.transition = 'opacity 0.3s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });

  // Touch support
  function onTouchStart(e, type) {
    const touch = e.touches[0];
    onMouseDown({ preventDefault: () => e.preventDefault(), clientX: touch.clientX, clientY: touch.clientY }, type);
  }

  document.addEventListener('touchmove', function(e) {
    if (!resizing) return;
    const touch = e.touches[0];
    const fakeEvt = { clientX: touch.clientX, clientY: touch.clientY };
    // reuse mousemove logic
    const win = document.getElementById('chatWindow');
    const dx = resizing.startX - fakeEvt.clientX;
    const dy = resizing.startY - fakeEvt.clientY;
    if (resizing.type === 'n' || resizing.type === 'nw') {
      const newH = Math.max(300, Math.min(window.innerHeight - 120, resizing.startH + dy));
      win.style.height = newH + 'px'; win.style.maxHeight = 'none';
    }
    if (resizing.type === 'w' || resizing.type === 'nw') {
      const newW = Math.max(280, Math.min(window.innerWidth - 48, resizing.startW + dx));
      win.style.width = newW + 'px';
    }
  }, { passive: false });

  document.addEventListener('touchend', function() {
    if (resizing) { resizing = null; document.body.style.userSelect = ''; }
  });

  // Attach after DOM ready
  document.addEventListener('DOMContentLoaded', attach);
  // In case DOMContentLoaded already fired
  if (document.readyState !== 'loading') attach();

  function attach() {
    const n  = document.getElementById('chatResizeN');
    const w  = document.getElementById('chatResizeW');
    const nw = document.getElementById('chatResizeNW');
    if (n)  { n.addEventListener('mousedown',  e => onMouseDown(e, 'n'));  n.addEventListener('touchstart',  e => onTouchStart(e, 'n'),  {passive:false}); }
    if (w)  { w.addEventListener('mousedown',  e => onMouseDown(e, 'w'));  w.addEventListener('touchstart',  e => onTouchStart(e, 'w'),  {passive:false}); }
    if (nw) { nw.addEventListener('mousedown', e => onMouseDown(e, 'nw')); nw.addEventListener('touchstart', e => onTouchStart(e, 'nw'), {passive:false}); }
  }
}());

function markdownToHTML(text) {
  // Step 1: Extract and protect LaTeX blocks with placeholders
  const latexTokens = [];
  let safe = text;
  // display math $$...$$
  safe = safe.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => {
    latexTokens.push({ type: 'display', src: '$$' + inner + '$$' });
    return `%%LATEX${latexTokens.length - 1}%%`;
  });
  // inline math $...$  (not preceded by another $)
  safe = safe.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (_, inner) => {
    latexTokens.push({ type: 'inline', src: '$' + inner + '$' });
    return `%%LATEX${latexTokens.length - 1}%%`;
  });
  // \(...\) inline
  safe = safe.replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => {
    latexTokens.push({ type: 'inline', src: '\\(' + inner + '\\)' });
    return `%%LATEX${latexTokens.length - 1}%%`;
  });
  // \[...\] display
  safe = safe.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => {
    latexTokens.push({ type: 'display', src: '\\[' + inner + '\\]' });
    return `%%LATEX${latexTokens.length - 1}%%`;
  });

  // Step 2: Standard markdown processing on LaTeX-free text
  let html = safe
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```[\s\S]*?```/g, m => `<pre style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;font-family:'DM Mono',monospace;font-size:0.8rem;overflow-x:auto;margin:4px 0;">${m.slice(3,-3).replace(/^[a-z]+\n/,'')}</pre>`)
    .replace(/`([^`]+)`/g,'<code style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-family:\'DM Mono\',monospace;font-size:0.85em;">$1</code>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^### (.+)$/gm,'<div style="font-size:0.95rem;font-weight:700;color:var(--text);margin:10px 0 4px;">$1</div>')
    .replace(/^## (.+)$/gm,'<div style="font-size:1rem;font-weight:700;color:var(--text);margin:10px 0 4px;">$1</div>')
    .replace(/^---+$/gm,'<hr style="border:none;border-top:1px solid var(--border);margin:8px 0;">')
    .split('\n').map(line => line.trim() === '' ? '<br>' : `<p style="margin:3px 0;line-height:1.6;">${line}</p>`)
    .join('');

  // Step 3: Restore LaTeX placeholders as raw strings (KaTeX will render them)
  latexTokens.forEach((tok, i) => {
    html = html.replace(`%%LATEX${i}%%`, tok.src);
  });
  return html;
}

function renderChatMessages() {
  const body = document.getElementById('chatBody');
  if (!body) return;
  const msgs = chatState.messages;
  body.innerHTML = msgs.map((m, i) => {
    const isModel = m.role === 'model';
    const msgHTML = markdownToHTML(m.text);
    const copyBtn = isModel ? `
      <button class="chat-copy-btn" onclick="copyChatMsg(this, ${i})" title="Copy message">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy
      </button>` : '';
    const ctxAttr = `oncontextmenu="showChatContextMenu(event, ${i})"`;
    return `<div class="chat-msg-wrap ${m.role === 'user' ? 'user-wrap' : ''}" ${ctxAttr}>
      <div class="chat-msg ${m.role}" id="chat-msg-${i}">${msgHTML}</div>
      ${copyBtn}
    </div>`;
  }).join('');
  
  if (chatState.isTyping) {
    body.innerHTML += `
      <div class="chat-msg model" style="padding: 12px 14px;">
        <div class="typing-indicator">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>
    `;
    // While waiting for response, scroll to bottom to show typing indicator
    body.scrollTop = body.scrollHeight;
  } else {
    // After AI responds, scroll so the start of the last model message is visible
    const lastModelIdx = msgs.map(m => m.role).lastIndexOf('model');
    if (lastModelIdx > 0) {
      const lastModelEl = document.getElementById('chat-msg-' + lastModelIdx);
      if (lastModelEl) {
        // Small delay to let DOM paint before scrolling
        requestAnimationFrame(() => {
          lastModelEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      }
    } else {
      body.scrollTop = body.scrollHeight;
    }
  }
  // Render LaTeX inside chat — retry robustly after DOM paint
  function applyKatex() {
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false,
          errorColor: '#f87171'
        });
      } catch(e) {}
    }
  }
  requestAnimationFrame(() => {
    applyKatex();
    // Second pass after a short delay handles any deferred script timing
    setTimeout(applyKatex, 300);
  });
}

// ── Chat context menu ───────────────────────────────────────────────────────
let _ctxMenu = null;

function showChatContextMenu(e, idx) {
  e.preventDefault();
  closeContextMenu();

  const msgs = chatState.messages;
  const isUser = msgs[idx] && msgs[idx].role === 'user';

  const menu = document.createElement('div');
  menu.className = 'chat-context-menu';
  menu.id = 'chatCtxMenu';
  menu.innerHTML = `
    <button onclick="copyChatMsgById(${idx});closeContextMenu();">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy message
    </button>
    ${isUser ? `
    <button onclick="retryChatMsg(${idx});closeContextMenu();">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 .49-3.5"></path>
      </svg>
      Retry
    </button>` : ''}
  `;

  // Position near cursor, keep within viewport
  const x = Math.min(e.clientX, window.innerWidth - 180);
  const y = Math.min(e.clientY, window.innerHeight - 80);
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  document.body.appendChild(menu);
  _ctxMenu = menu;

  // Close on next click anywhere
  setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 0);
}

function closeContextMenu() {
  if (_ctxMenu) { _ctxMenu.remove(); _ctxMenu = null; }
}

async function retryChatMsg(idx) {
  const msgs = chatState.messages;
  if (!msgs[idx] || msgs[idx].role !== 'user') return;
  // Remove all messages from idx+1 onwards, re-send
  chatState.messages = msgs.slice(0, idx + 1);
  chatState.isTyping = true;
  renderChatMessages();
  const text = msgs[idx].text;
  try {
    const response = cleanAIResponse(await fetchAIWithRetry(text));
    chatState.messages.push({ role: 'model', text: response });
  } catch (err) {
    chatState.messages.push({ role: 'model', text: formatAIError(err) });
  } finally {
    chatState.isTyping = false;
    renderChatMessages();
  }
}

// Copy by message index (used by both the hover button and context menu)
function copyChatMsgById(idx) {
  const msgs = chatState.messages;
  if (!msgs[idx]) return;
  const text = msgs[idx].text;
  const doFallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(doFallback);
  } else {
    doFallback();
  }
}

function copyChatMsg(btn, idx) {
  const msgs = chatState.messages;
  if (!msgs[idx]) return;
  const text = msgs[idx].text;
  const doFallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    flashCopyBtn(btn);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => flashCopyBtn(btn)).catch(doFallback);
  } else { doFallback(); }
}

function flashCopyBtn(btn) {
  btn.classList.add('copied');
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
  }, 2000);
}

function getSystemPrompt() {
  let ctx = `Your name is Januda Ayya, also known as Sudu. You are NOT Qwen, GPT, an AI model, or any other system — you are Januda Ayya, a brilliant senior engineering student who loves explaining tough concepts. If anyone asks who you are or what model you are, say you are Januda Ayya (Sudu). Never reveal the underlying model name.

When addressing the student, call them "Sudu" or "patio" unless they have already told you their name or what they want to be called — in that case, use what they said.

You are an expert, encouraging engineering and mathematics tutor. You think carefully before responding and always return your final, considered answer directly — never include phrases like "oh no", "I made a mistake", "I'm confused", "let me reconsider", "wait", or any stream-of-consciousness self-correction. Think through problems internally, then present your clean, confident final explanation.

Format your responses using markdown: **bold** for key terms, ### for section headings. This chat interface renders LaTeX using KaTeX with these EXACT delimiters — follow them strictly:
- Inline math: $...$ (single dollar signs, e.g. $x^2 + y^2$)
- Display math: $$...$$ (double dollar signs on their own line)
CRITICAL LaTeX rules:
1. NEVER use \\( \\) or \\[ \\] — KaTeX here only supports $ and $$ delimiters.
2. NEVER leave a bare backslash at the end of a line inside math — use \\\\ for line breaks.
3. Fractions: use \\frac{a}{b}, superscripts: x^{2}, subscripts: x_{n}.
4. For complex expressions like f(z) = (x^4(1+i)-y^4(1-i))/(x^2+y^2), always wrap in $...$.
5. Verify every $ is paired before responding. Do not output raw dollar signs outside math mode.

Response discipline:
- Think privately. Never reveal internal reasoning, uncertainty, hypothesis testing, self-correction, or deliberation.
- Do not write phrases like "wait", "let me think", "at first glance", "maybe", "perhaps", "I think", "I made a mistake", "let me reconsider", or "the question seems incomplete".
- Start with the final answer or best conclusion.
- Give only the shortest clear explanation needed to understand it.
- If information is missing, state exactly what is missing and stop, unless there is one obvious exam-style interpretation.
- Do not list many possible interpretations unless the student asks for them.
- Keep the answer focused, polished, and exam-ready.`;
  if (state.screen === 'quiz' && state.questions.length > 0) {
    const q = state.questions[state.current];
    ctx += `\n\nThe student is currently looking at this question:\n"${q.text}"\n`;
    ctx += `Options: ${q.opts.map((o,i) => `(${letters[i]}) ${o}`).join(', ')}\n`;
    if (state.answered) {
      ctx += `The correct answer is: ${q.opts[q.ans]}. `;
      ctx += `Official explanation: ${q.exp}\n`;
    }
    ctx += `\nHelp them understand the underlying concepts. Do not give away the answer if they haven't answered yet. Be thorough, clear, and friendly. Use LaTeX for all math.`;
  } else {
    ctx += " Answer any engineering or mathematics questions they have. Be thorough and use LaTeX for all math expressions.";
  }
  return ctx;
}

// ── AI Provider state ────────────────────────────────────────────────────────
let _activeProvider = 'qwen'; // 'groq' | 'qwen'

function toggleModelDropdown(e) {
  e && e.stopPropagation();
  const dd = document.getElementById('modelDropdown');
  const isOpen = dd.style.display === 'block';
  dd.style.display = isOpen ? 'none' : 'block';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dd = document.getElementById('modelDropdown');
  const btn = document.getElementById('modelDropdownBtn');
  if (dd && btn && !dd.contains(e.target) && !btn.contains(e.target)) {
    dd.style.display = 'none';
  }
});

function selectProvider(provider) {
  _activeProvider = provider;
  const dd = document.getElementById('modelDropdown');
  const label = document.getElementById('modelDropdownLabel');
  const checkGroq = document.getElementById('mdCheckGroq');
  const checkQwen = document.getElementById('mdCheckQwen');

  if (provider === 'qwen') {
    if (label) label.textContent = 'Qwen3 235B';
    if (checkGroq) checkGroq.style.display = 'none';
    if (checkQwen) checkQwen.style.display = '';
    if (dd) dd.style.display = 'none';
  } else {
    if (label) label.textContent = 'GPT-OSS 120B';
    if (checkQwen) checkQwen.style.display = 'none';
    if (checkGroq) checkGroq.style.display = '';
    if (dd) dd.style.display = 'none';
  }
}

async function fetchAI(userPrompt) {
  if (_activeProvider === 'groq') return fetchGroq(userPrompt);
  return fetchQwen(userPrompt);
}

async function fetchAIWithRetry(userPrompt, maxRetries = 4) {
  const RETRYABLE = [429, 500, 502, 503, 504];
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchAI(userPrompt);
    } catch (err) {
      lastErr = err;
      // Extract status code from error message like "429: ..."
      const code = parseInt(err.message);
      const isRetryable = RETRYABLE.includes(code) || err.message.includes('429');
      if (!isRetryable || attempt === maxRetries) break;
      // Exponential backoff: 1s, 2s, 4s, 8s
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      // Show retrying indicator
      const body = document.getElementById('chatBody');
      if (body) {
        const last = body.lastElementChild;
        if (last && last.classList.contains('typing-indicator-wrap')) last.remove();
        const wrap = document.createElement('div');
        wrap.className = 'typing-indicator-wrap';
        wrap.style.cssText = 'font-size:0.75rem;color:var(--text-muted);padding:4px 8px;align-self:flex-start;';
        wrap.textContent = `⟳ Retrying… (attempt ${attempt + 2}/${maxRetries + 1})`;
        body.appendChild(wrap);
        body.scrollTop = body.scrollHeight;
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function formatAIError(err) {
  if (!navigator.onLine) {
    return 'Januda Ayya needs internet to answer. Your loaded quiz can still continue offline.';
  }
  return '⚠️ Error: ' + err.message;
}

function cleanAIResponse(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^\s*(final answer\s*:\s*)/i, 'Final answer: ')
    .trim();
}

async function fetchQwen(userPrompt) {
  return fetchJanudaProxy('qwen', userPrompt);
}

async function fetchGroq(userPrompt) {
  return fetchJanudaProxy('groq', userPrompt);
}

async function getCurrentSupabaseAccessTokenSafely() {
  try {
    if (typeof _sb === 'undefined' || !_sb?.auth?.getSession) return null;
    const { data } = await _sb.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function fetchJanudaProxy(provider, userPrompt) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = await getCurrentSupabaseAccessTokenSafely();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch('/api/januda', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      systemPrompt: getSystemPrompt(),
      userPrompt
    })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error('AI endpoint is not available on this server. Deploy to Vercel or run a local API proxy.');
    }
    throw new Error(`${res.status}: ${e?.error || e?.message || 'AI request failed.'}`);
  }

  const data = await res.json();
  return data.text || "I couldn't generate a response.";
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  markJanudaUsed();
  input.value = '';
  document.getElementById('chatSendBtn').disabled = true;
  input.disabled = true;

  chatState.messages.push({ role: 'user', text });
  chatState.isTyping = true;
  renderChatMessages();

  try {
    const response = cleanAIResponse(await fetchAIWithRetry(text));
    chatState.messages.push({ role: 'model', text: response });
  } catch (err) {
    chatState.messages.push({ role: 'model', text: formatAIError(err) });
  } finally {
    chatState.isTyping = false;
    document.getElementById('chatSendBtn').disabled = false;
    input.disabled = false;
    input.focus();
    renderChatMessages();
  }
}


// Answer history: starts empty — loaded from Supabase after login (or stays empty for guests)
let answerHistory = {};

// ── Chat window management (maximize, snap, minimize, drag-to-snap) ──────────
(function() {
  let _winState = 'normal'; // 'normal' | 'maximized' | 'split-left' | 'split-right' | 'minimized'
  let _savedStyle = {};     // stores geometry before maximize/snap
  let _snapPreview = null;
  let _snapLabel = null;
  let _dragging = false;
  let _dragOffset = { x: 0, y: 0 };
  let _currentSnap = null;  // which zone we're hovering

  function getWin() { return document.getElementById('chatWindow'); }

  function saveGeometry() {
    const w = getWin();
    _savedStyle = {
      top: w.style.top, left: w.style.left, right: w.style.right, bottom: w.style.bottom,
      width: w.style.width, height: w.style.height,
      borderRadius: w.style.borderRadius
    };
  }

  function restoreGeometry() {
    const w = getWin();
    ['top','left','right','bottom','width','height','borderRadius'].forEach(p => {
      w.style[p] = _savedStyle[p] || '';
    });
  }

  function clearSnapClasses(w) {
    w.classList.remove('maximized','split-left','split-right');
  }

  // ── Minimize ──
  window.chatWinMinimize = function() {
    const w = getWin();
    if (_winState === 'minimized') {
      // Restore
      w.style.height = _savedStyle.height || '500px';
      w.style.overflow = '';
      _winState = 'normal';
      document.getElementById('chatWcMin').title = 'Minimize';
    } else {
      if (_winState !== 'normal') { chatWinRestore(); }
      saveGeometry();
      _savedStyle.height = w.style.height || '500px';
      w.style.height = '54px';
      w.style.overflow = 'hidden';
      _winState = 'minimized';
      document.getElementById('chatWcMin').title = 'Restore';
    }
  };

  // ── Maximize ──
  window.chatWinMaximize = function() {
    const w = getWin();
    if (_winState === 'maximized') {
      chatWinRestore();
    } else {
      if (_winState === 'minimized') { w.style.height = _savedStyle.height || '500px'; w.style.overflow = ''; }
      saveGeometry();
      clearSnapClasses(w);
      w.classList.add('maximized');
      _winState = 'maximized';
      document.getElementById('chatWcMax').title = 'Restore';
    }
  };

  // ── Questions-panel zoom (split mode only) ──────────────────────────────────
  // Uses CSS `zoom` on #app. To prevent body clipping, body overflow-x is set to
  // visible in split mode, and #app gets overflow-x:auto to handle any overflow.
  let _appZoom = 1.0;
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 2.5;
  const ZOOM_BTN_STEP = 0.1;

  function clampZoom(z) { return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)); }
  function getScaler() { return document.getElementById('app'); } // #app is the zoom target

  function applyZoom() {
    const app = document.getElementById('app');
    const lbl = document.getElementById('appZoomLabel');
    if (!app) return;
    app.style.zoom = _appZoom;
    // Let #app scroll horizontally if content overflows at high zoom
    app.style.overflowX = 'auto';
    if (lbl) lbl.textContent = Math.round(_appZoom * 100) + '%';
  }

  function clearZoom() {
    _appZoom = 1.0;
    const app = document.getElementById('app');
    if (app) { app.style.zoom = ''; app.style.overflowX = ''; }
    const lbl = document.getElementById('appZoomLabel');
    if (lbl) lbl.textContent = '100%';
  }

  function ensureBodyOverflow() {} // no-op, shell handles containment now

  // Button click: dir = +1 or -1; reset = true resets to 100%
  window.splitZoomApp = function(dir, reset) {
    if (reset) { _appZoom = 1.0; }
    else { _appZoom = clampZoom(_appZoom + dir * ZOOM_BTN_STEP); }
    applyZoom();
  };

  // Expose for renderApp
  window._applyAppZoom = applyZoom;
  window._getAppScaler = getScaler;

  // Reset zoom state (called on close/restore)
  window._chatResetZoom = function() {
    clearZoom();
    showZoomControls(false);
  };

  // Touchpad pinch-to-zoom: browsers fire wheel+ctrlKey for trackpad pinch.
  (function initPinchZoom() {
    function onWheel(e) {
      if (!e.ctrlKey) return;
      if (_winState !== 'split-left' && _winState !== 'split-right') return;
      e.preventDefault();
      const sensitivity = 0.003;
      _appZoom = clampZoom(_appZoom - e.deltaY * sensitivity);
      applyZoom();
    }
    document.addEventListener('wheel', onWheel, { passive: false });
  }());

  function showZoomControls(show) {
    const ab = document.getElementById('appZoomBar');
    if (ab) ab.style.display = show ? 'flex' : 'none';
  }

  // ── Snap to side ──
  function applySnap(zone) {
    const w = getWin();
    if (_winState !== 'split-left' && _winState !== 'split-right') saveGeometry();
    clearSnapClasses(w);
    clearZoom();

    // Wrap #app in a fixed half-viewport container so zoom stays self-contained
    let shell = document.getElementById('appShell');
    const app = document.getElementById('app');
    if (!shell && app) {
      shell = document.createElement('div');
      shell.id = 'appShell';
      app.parentNode.insertBefore(shell, app);
      shell.appendChild(app);
    }

    const navBar = document.querySelector('.nav-bar');
    const navH = navBar ? (navBar.offsetHeight + 'px') : '48px';

    if (zone === 'left') {
      w.classList.add('split-left');
      _winState = 'split-left';
      if (shell) shell.style.cssText = `position:fixed;top:${navH};left:50vw;right:0;bottom:0;overflow-y:auto;overflow-x:auto;z-index:1;background:var(--bg);`;
    } else {
      w.classList.add('split-right');
      _winState = 'split-right';
      if (shell) shell.style.cssText = `position:fixed;top:${navH};left:0;right:50vw;bottom:0;overflow-y:auto;overflow-x:auto;z-index:1;background:var(--bg);`;
    }
    // Reset #app margins/maxWidth — shell handles positioning now
    if (app) { app.style.marginLeft = ''; app.style.marginRight = ''; app.style.maxWidth = ''; }

    showZoomControls(true);
    document.getElementById('chatWcMax').title = 'Restore';
  }

  function removeShell() {
    const shell = document.getElementById('appShell');
    if (!shell) return;
    const app = document.getElementById('app');
    if (app) shell.parentNode.insertBefore(app, shell);
    shell.remove();
  }

  // ── Restore ──
  function chatWinRestore() {
    const w = getWin();
    clearSnapClasses(w);
    restoreGeometry();
    w.style.overflow = '';
    _winState = 'normal';
    removeShell();
    const app = document.getElementById('app');
    if (app) { app.style.marginLeft = ''; app.style.marginRight = ''; app.style.maxWidth = ''; }
    clearZoom();
    showZoomControls(false);
    document.getElementById('chatWcMax').title = 'Maximize';
    document.getElementById('chatWcMin').title = 'Minimize';
  }
  window.chatWinRestore = chatWinRestore;

  // ── Snap button hover preview ──
  let _snapLeaveTimer = null;
  window.chatSnapHover = function(e) {
    clearTimeout(_snapLeaveTimer);
    showSnapChoicePreview(e.currentTarget);
  };
  window.chatSnapLeave = function() {
    // Delay removal so the cursor has time to move into the popup
    _snapLeaveTimer = setTimeout(() => {
      if (!_snapPreview || !_snapPreview.matches(':hover')) removeSnapPreview();
    }, 120);
  };
  window.chatSnapClick = function() {
    // Toggle: if already snapped restore, else show inline choice
    if (_winState === 'split-left' || _winState === 'split-right') {
      chatWinRestore();
    } else {
      // simple toggle to split-left
      applySnap('left');
    }
  };

  // Allow toggleChat to reset internal state
  window._chatWinForceNormal = function() {
    _winState = 'normal';
    removeShell();
    clearZoom();
    showZoomControls(false);
    document.getElementById('chatWcMax').title = 'Maximize';
    document.getElementById('chatWcMin').title = 'Minimize';
  };

  function showSnapChoicePreview(btn) {
    removeSnapPreview();
    const container = document.createElement('div');
    container.id = 'snapChoicePopup';
    container.style.cssText = `
      position:fixed;z-index:200;background:var(--surface);border:1px solid var(--border);
      border-radius:10px;padding:8px;display:flex;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,0.5);
    `;
    const rect = btn.getBoundingClientRect();
    container.style.top = (rect.bottom + 6) + 'px';
    container.style.right = (window.innerWidth - rect.right) + 'px';

    // Keep popup alive while cursor is inside it
    container.onmouseenter = () => clearTimeout(_snapLeaveTimer);
    container.onmouseleave = () => { _snapLeaveTimer = setTimeout(removeSnapPreview, 80); };

    ['Left','Right'].forEach(side => {
      const b = document.createElement('button');
      b.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px 14px;cursor:pointer;font-size:0.78rem;font-family:inherit;transition:background 0.12s,border-color 0.12s;';
      b.textContent = side;
      b.onmouseenter = () => { b.style.background='var(--accent)'; b.style.color='#fff'; showZonePreview(side.toLowerCase()); };
      b.onmouseleave = () => { b.style.background='var(--surface2)'; b.style.color='var(--text)'; removeZonePreview(); };
      b.onclick = () => { applySnap(side.toLowerCase()); removeSnapPreview(); };
      container.appendChild(b);
    });

    // Restore button if snapped
    if (_winState === 'split-left' || _winState === 'split-right') {
      const r = document.createElement('button');
      r.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px 14px;cursor:pointer;font-size:0.78rem;font-family:inherit;';
      r.textContent = 'Restore';
      r.onclick = () => { chatWinRestore(); removeSnapPreview(); };
      container.appendChild(r);
    }

    document.body.appendChild(container);
    _snapPreview = container;
    setTimeout(() => document.addEventListener('click', removeSnapPreview, { once: true }), 0);
  }

  function showZonePreview(side) {
    removeZonePreview();
    const el = document.createElement('div');
    el.className = 'snap-preview';
    el.id = 'snapZonePreview';
    if (side === 'left') { el.style.cssText = 'left:0;top:0;width:50vw;height:100vh;'; }
    else { el.style.cssText = 'left:50vw;top:0;width:50vw;height:100vh;'; }
    document.body.appendChild(el);
  }

  function removeZonePreview() {
    const el = document.getElementById('snapZonePreview');
    if (el) el.remove();
  }

  function removeSnapPreview() {
    removeZonePreview();
    if (_snapPreview) { _snapPreview.remove(); _snapPreview = null; }
    document.removeEventListener('click', removeSnapPreview);
  }

  // ── Maximize hover preview ──
  window.chatMaxHover = function(e) {
    if (_winState === 'maximized') return;
    const el = document.createElement('div');
    el.className = 'snap-preview';
    el.id = 'maxZonePreview';
    el.style.cssText = 'left:0;top:0;width:100vw;height:100vh;';
    document.body.appendChild(el);
  };
  window.chatMaxLeave = function() {
    const el = document.getElementById('maxZonePreview');
    if (el) el.remove();
  };

  // ── Drag header to snap ──
  let _dragStartX = 0, _dragStartY = 0, _dragStartRect = null;

  function initDragSnap() {
    const header = document.querySelector('.chat-header');
    if (!header) return;
    header.style.cursor = 'grab';

    header.addEventListener('mousedown', function(e) {
      // Ignore clicks on buttons
      if (e.target.closest('button') || e.target.closest('.chat-win-controls')) return;
      if (_winState === 'maximized') return;
      _dragging = true;
      _dragStartX = e.clientX;
      _dragStartY = e.clientY;
      const w = getWin();
      _dragStartRect = w.getBoundingClientRect();
      header.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      // Convert from fixed-bottom-right to fixed-top-left positioning for drag
      if (_winState === 'normal') {
        w.style.top = _dragStartRect.top + 'px';
        w.style.left = _dragStartRect.left + 'px';
        w.style.right = 'auto';
        w.style.bottom = 'auto';
        w.style.transform = 'none';
        w.style.transition = 'none';
      }
    });

    document.addEventListener('mousemove', function(e) {
      if (!_dragging) return;
      const dx = e.clientX - _dragStartX;
      const dy = e.clientY - _dragStartY;
      const w = getWin();

      if (_winState === 'split-left' || _winState === 'split-right') {
        // Unsnap on drag
        clearSnapClasses(w);
        restoreGeometry();
        removeShell();
        const app = document.getElementById('app');
        if (app) { app.style.marginLeft = ''; app.style.marginRight = ''; app.style.maxWidth = ''; }
        clearZoom();
        showZoomControls(false);
        w.style.top = _dragStartRect.top + 'px';
        w.style.left = _dragStartRect.left + 'px';
        w.style.right = 'auto';
        w.style.bottom = 'auto';
        w.style.transform = 'none';
        w.style.transition = 'none';
        _winState = 'normal';
        _dragStartRect = w.getBoundingClientRect();
        _dragStartX = e.clientX; _dragStartY = e.clientY;
        return;
      }

      w.style.top = (_dragStartRect.top + dy) + 'px';
      w.style.left = (_dragStartRect.left + dx) + 'px';

      // Detect snap zones
      const zone = getSnapZone(e.clientX, e.clientY);
      if (zone !== _currentSnap) {
        _currentSnap = zone;
        updateDragSnapPreview(zone);
      }
    });

    document.addEventListener('mouseup', function(e) {
      if (!_dragging) return;
      _dragging = false;
      header.style.cursor = 'grab';
      document.body.style.userSelect = '';
      const w = getWin();
      w.style.transition = '';

      if (_currentSnap) {
        saveGeometry();
        if (_currentSnap === 'maximize') {
          clearSnapClasses(w); w.classList.add('maximized');
          _winState = 'maximized';
        } else {
          applySnap(_currentSnap);
        }
        _currentSnap = null;
      }
      removeDragSnapPreview();
    });
  }

  function getSnapZone(x, y) {
    const W = window.innerWidth, H = window.innerHeight;
    const EDGE = 30; // px from edge
    if (y < EDGE) return 'maximize';
    if (x < EDGE) return 'left';
    if (x > W - EDGE) return 'right';
    return null;
  }

  function updateDragSnapPreview(zone) {
    removeDragSnapPreview();
    if (!zone) return;
    const el = document.createElement('div');
    el.className = 'snap-preview';
    el.id = 'dragSnapPreview';
    const lbl = document.createElement('div');
    lbl.className = 'snap-label';
    lbl.id = 'dragSnapLabel';
    if (zone === 'maximize') {
      el.style.cssText = 'left:4px;top:4px;right:4px;bottom:4px;border-radius:12px;';
      lbl.style.cssText = 'top:50%;left:50%;transform:translate(-50%,-50%);';
      lbl.textContent = 'Maximize';
    } else if (zone === 'left') {
      el.style.cssText = 'left:0;top:0;width:50vw;height:100vh;';
      lbl.style.cssText = 'top:50%;left:25vw;transform:translate(-50%,-50%);';
      lbl.textContent = 'Snap Left';
    } else {
      el.style.cssText = 'left:50vw;top:0;width:50vw;height:100vh;';
      lbl.style.cssText = 'top:50%;left:75vw;transform:translate(-50%,-50%);';
      lbl.textContent = 'Snap Right';
    }
    document.body.appendChild(el);
    document.body.appendChild(lbl);
  }

  function removeDragSnapPreview() {
    ['dragSnapPreview','dragSnapLabel'].forEach(id => { const e=document.getElementById(id); if(e) e.remove(); });
  }

  // Init after DOM ready
  const initFn = () => initDragSnap();
  if (document.readyState !== 'loading') initFn();
  else document.addEventListener('DOMContentLoaded', initFn);
}());


// ── Image Viewer Lightbox ─────────────────────────────────────────────────────
(function() {
  let _scale = 1, _tx = 0, _ty = 0;
  let _dragging = false, _lastX = 0, _lastY = 0;
  let _hintTimer = null;
  let _qVisible = false;
  let _lastTouchDist = null;

  function clampTranslate(tx, ty, scale) {
    const img = document.getElementById('imgViewerImg');
    if (!img) return [tx, ty];
    const maxX = Math.max(0, (img.naturalWidth  * scale - window.innerWidth)  / 2);
    const maxY = Math.max(0, (img.naturalHeight * scale - window.innerHeight * 0.8) / 2);
    return [
      Math.max(-maxX, Math.min(maxX, tx)),
      Math.max(-maxY, Math.min(maxY, ty))
    ];
  }

  function applyTransform(animate) {
    const img = document.getElementById('imgViewerImg');
    if (!img) return;
    img.style.transition = animate ? 'transform 0.15s ease-out' : 'none';
    img.style.transform = `translate(${_tx}px, ${_ty}px) scale(${_scale})`;
  }

  function hideHint() {
    const h = document.getElementById('imgViewerZoomHint');
    if (h) h.style.opacity = '0';
  }

  // ── Event handlers (only active while viewer is open) ─────────────────────

  function onWheel(e) {
    if (e.target.closest('#imgViewerQPanel')) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    const newScale = Math.max(0.5, Math.min(12, _scale * factor));
    const rect = document.getElementById('imgViewerImg').getBoundingClientRect();
    _tx += (e.clientX - (rect.left + rect.width  / 2)) * (1 - factor);
    _ty += (e.clientY - (rect.top  + rect.height / 2)) * (1 - factor);
    _scale = newScale;
    [_tx, _ty] = clampTranslate(_tx, _ty, _scale);
    applyTransform(false);
    hideHint();
  }

  function onMouseDown(e) {
    if (!e.target.closest('#imgViewerImg')) return;
    _dragging = true;
    _lastX = e.clientX; _lastY = e.clientY;
    e.target.classList.add('dragging');
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!_dragging) return;
    _tx += e.clientX - _lastX;
    _ty += e.clientY - _lastY;
    _lastX = e.clientX; _lastY = e.clientY;
    [_tx, _ty] = clampTranslate(_tx, _ty, _scale);
    applyTransform(false);
  }

  function onMouseUp() {
    if (!_dragging) return;
    _dragging = false;
    const img = document.getElementById('imgViewerImg');
    if (img) img.classList.remove('dragging');
  }

  function onDblClick(e) {
    if (!e.target.closest('#imgViewerImg')) return;
    _scale = 1; _tx = 0; _ty = 0;
    applyTransform(true);
  }

  function onTouchStart(e) {
    if (!e.target.closest('#imgViewerImg') && !e.target.closest('#imgViewerWrap')) return;
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      _lastTouchDist = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      _lastX = e.touches[0].clientX; _lastY = e.touches[0].clientY;
    }
    e.preventDefault();
  }

  function onTouchMove(e) {
    if (!e.target.closest('#imgViewerImg') && !e.target.closest('#imgViewerWrap')) return;
    if (e.touches.length === 2 && _lastTouchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      _scale = Math.max(0.5, Math.min(12, _scale * (dist / _lastTouchDist)));
      _lastTouchDist = dist;
    } else if (e.touches.length === 1) {
      _tx += e.touches[0].clientX - _lastX;
      _ty += e.touches[0].clientY - _lastY;
      _lastX = e.touches[0].clientX; _lastY = e.touches[0].clientY;
    }
    [_tx, _ty] = clampTranslate(_tx, _ty, _scale);
    applyTransform(false);
    e.preventDefault();
  }

  function onTouchEnd() { _lastTouchDist = null; }

  function onKeyDown(e) { if (e.key === 'Escape') window.closeImgViewer(); }

  function attachListeners() {
    const viewer = document.getElementById('imgViewer');
    viewer.addEventListener('wheel',      onWheel,      { passive: false });
    viewer.addEventListener('mousedown',  onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
    viewer.addEventListener('dblclick',   onDblClick);
    viewer.addEventListener('touchstart', onTouchStart, { passive: false });
    viewer.addEventListener('touchmove',  onTouchMove,  { passive: false });
    viewer.addEventListener('touchend',   onTouchEnd);
    document.addEventListener('keydown',  onKeyDown);
  }

  function detachListeners() {
    const viewer = document.getElementById('imgViewer');
    viewer.removeEventListener('wheel',      onWheel);
    viewer.removeEventListener('mousedown',  onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);
    viewer.removeEventListener('dblclick',   onDblClick);
    viewer.removeEventListener('touchstart', onTouchStart);
    viewer.removeEventListener('touchmove',  onTouchMove);
    viewer.removeEventListener('touchend',   onTouchEnd);
    document.removeEventListener('keydown',  onKeyDown);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.openImgViewer = function(src, alt, questionHTML) {
    const viewer   = document.getElementById('imgViewer');
    const img      = document.getElementById('imgViewerImg');
    const qPanel   = document.getElementById('imgViewerQPanel');
    const eyeLabel = document.getElementById('imgViewerEyeLabel');
    const eyeIcon  = document.getElementById('imgViewerEyeIcon');

    img.src = src;
    img.alt = alt || 'Figure';
    qPanel.innerHTML = questionHTML || '';

    _scale = 1; _tx = 0; _ty = 0; _qVisible = false;
    qPanel.style.display = 'none';
    eyeLabel.textContent = 'Show question';
    eyeIcon.textContent  = '👁';
    applyTransform(false);

    viewer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    attachListeners();

    const h = document.getElementById('imgViewerZoomHint');
    if (h) h.style.opacity = '1';
    clearTimeout(_hintTimer);
    _hintTimer = setTimeout(hideHint, 2200);
  };

  window.closeImgViewer = function() {
    document.getElementById('imgViewer').style.display = 'none';
    document.body.style.overflow = '';
    detachListeners();
  };

  window.toggleImgViewerQuestion = function() {
    const qPanel   = document.getElementById('imgViewerQPanel');
    const eyeLabel = document.getElementById('imgViewerEyeLabel');
    const eyeIcon  = document.getElementById('imgViewerEyeIcon');
    _qVisible = !_qVisible;
    qPanel.style.display = _qVisible ? 'block' : 'none';
    eyeLabel.textContent = _qVisible ? 'Hide question' : 'Show question';
    eyeIcon.textContent  = _qVisible ? '👁‍🗨' : '👁';
  };
})();


// ── Boot ──────────────────────────────────────────────────────────────────────
function exposeAppGlobals() {
  Object.assign(window, {
    state,
    SUBJECTS,
    SUBJECT_COUNTS,
    ensureSubjectData,
    ensureAllSubjectData,
    renderApp,
    goHome,
    stopTimer,
    splitZoomApp,
    appScrollToElement,
    enterSubject,
    enterSubjectMode,
    openCategorySubjectPicker,
    selectCategorySubject,
    toggleTopic,
    toggleTargetTopic,
    selectAllTopics,
    deselectAllTopics,
    selectAllTargetTopics,
    deselectAllTargetTopics,
    setQuestionCount,
    setMode,
    startQuiz,
    startTargetQuiz,
    startPaper,
    startAllPapers,
    showTimerModal,
    closeTimerModal,
    selectPresetTimer,
    clearPresetSelection,
    selectCustomTimer,
    confirmTimer,
    selectAnswer,
    next,
    togglePauseTimer,
    saveReviewAsHTML,
    shareReview,
    toggleChat,
    openJanudaChat,
    sendChatMessage,
    copyChatMsg,
    copyChatMsgById,
    retryChatMsg,
    closeContextMenu,
    toggleModelDropdown,
    selectProvider,
    chatWinMinimize,
    chatWinMaximize,
    chatSnapHover,
    chatSnapLeave,
    chatSnapClick,
    chatMaxHover,
    chatMaxLeave,
    startJanudaTutorial,
    continueAfterJanudaIntro,
    highlightModelDropdownFromTutorial,
    updateDirectoryFilter,
    toggleDirectoryQuestion,
    askJanudaFromDirectory,
    confirmRouteLeaveQuiz,
    cancelRouteLeaveQuiz,
    showGuestQuizPrompt,
    showGuestContinueConfirm,
    confirmGuestContinue,
    showGuestAccountReminder,
    startAppTutorial,
    skipAppTutorial,
    nextAppTutorialStep,
    prevAppTutorialStep,
    showViewAllConfirm,
    showModePickerModal,
    _pickQuizMode,
    examSelectAnswer,
    examGoToPage,
    submitExamConfirm,
    submitExamPaper
  });
}

exposeAppGlobals();

// Auth initialises first, then renders the app/router.
bootAuth().then(() => {
  initRouter();
  renderChatMessages();
});




