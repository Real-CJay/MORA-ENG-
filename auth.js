// auth.js N/A Supabase authentication & data layer
// Load BEFORE quiz_app.js in index.html

// ── Supabase client ───────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://zjjvtqcuaqyccxdklvbs.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqanZ0cWN1YXF5Y2N4ZGtsdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTE4OTIsImV4cCI6MjA5NTc4Nzg5Mn0.B7Hqy5w0HZlJZZAtAnoxztaZsl7qIUdRdigCiHWR90M';

const AUTH_REMEMBER_KEY = 'eq_auth_remember_me';
const GUEST_ID_KEY = 'mora_guest_id_v1';
const GUEST_SESSIONS_KEY = 'mora_guest_quiz_sessions_v1';
const GUEST_ACCEPTED_KEY = 'mora_guest_mode_accepted_v1';
const GUEST_COMPLETED_KEY = 'mora_guest_completed_quizzes_v1';
const GUEST_REMIND_AFTER_KEY = 'mora_guest_signin_remind_after_v1';
const GUEST_IMPORTED_KEY = 'mora_guest_progress_imported_v1';
const authStorage = {
  getItem(key) {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  },
  setItem(key, value) {
    if (localStorage.getItem(AUTH_REMEMBER_KEY) === '0') {
      localStorage.removeItem(key);
      sessionStorage.setItem(key, value);
    } else {
      sessionStorage.removeItem(key);
      localStorage.setItem(key, value);
    }
  },
  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage
  }
});

// ── Auth state ────────────────────────────────────────────────────────────────
let authUser    = null;   // supabase user object, null = guest
let authReady   = false;  // true once initial session check is done
let userProfile = null;   // cached user_profiles row (includes is_admin)
let _dbPermissionWarned = false;
let _authRefreshInFlight = null;
let _authRefreshLastAttempt = 0;   // timestamp of last refreshSession call
let _authStateSubscribed = false;

const _AUTH_REFRESH_COOLDOWN_MS = 30000; // never refresh more than once per 30 s

function dbIsPermissionError(error) {
  return error && (error.code === '42501' || /permission denied/i.test(error.message || ''));
}

function dbWarnOnce(label, error) {
  if (dbIsPermissionError(error)) {
    if (!_dbPermissionWarned) {
      _dbPermissionWarned = true;
      console.warn('Supabase permissions need the latest SQL migration. The app will continue with local/empty progress until grants are applied.');
    }
    return;
  }
  if (error) console.warn(label + ':', error.message || error);
}

async function dbRefreshSessionForRetry() {
  if (isGuest()) return false;
  // Rate-limit manual refresh calls so we never trigger a 429
  const now = Date.now();
  if (now - _authRefreshLastAttempt < _AUTH_REFRESH_COOLDOWN_MS) return false;
  if (!_authRefreshInFlight) {
    _authRefreshLastAttempt = now;
    _authRefreshInFlight = _sb.auth.refreshSession()
      .then(({ data, error }) => {
        if (error || !data?.session?.user) return false;
        authUser = data.session.user;
        return true;
      })
      .catch(() => false)
      .finally(() => { _authRefreshInFlight = null; });
  }
  return _authRefreshInFlight;
}

async function dbRun(label, buildQuery) {
  let result = await buildQuery();
  if (dbIsPermissionError(result?.error) && await dbRefreshSessionForRetry()) {
    result = await buildQuery();
  }
  if (result?.error) dbWarnOnce(label, result.error);
  return result || {};
}

async function loadUserProfile() {
  if (isGuest()) { userProfile = null; return; }
  const { data } = await dbRun('loadUserProfile', () => _sb.from('user_profiles')
    .select('display_name, is_admin, avatar_color, avatar_bg, avatar_icon, avatar_style, avatar_url')
    .eq('id', getUserId())
    .single());
  userProfile = data || null;
}

function refreshUserProfileInBackground(shouldRender = false) {
  if (isGuest()) {
    userProfile = null;
    if (shouldRender) renderAuthPill();
    return;
  }
  loadUserProfile()
    .catch(() => { userProfile = null; })
    .finally(() => {
      renderAuthPill();
      if (shouldRender && typeof renderApp === 'function') renderApp();
    });
}

function isAdmin() { return userProfile?.is_admin === true; }

// Called once on page load N/A resolves current session
async function initAuth() {
  const { data: { session } } = await _sb.auth.getSession();
  authUser = session?.user ?? null;
  authReady = true;
  refreshUserProfileInBackground(false);

  // Listen for sign-in / sign-out events.
  // INITIAL_SESSION fires on every page load for existing sessions N/A bootAuth already
  // handles the first render, so we must not trigger a second one here.
  // TOKEN_REFRESHED is a silent background token swap N/A no UI change needed.
  if (!_authStateSubscribed) {
    _authStateSubscribed = true;
    _sb.auth.onAuthStateChange((event, session) => {
      authUser = session?.user ?? null;
      const needsRender = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED';
      refreshUserProfileInBackground(needsRender);
    });
  }
}

function isGuest()    { return authUser === null; }
function isLoggedIn() { return authUser !== null; }
function getUserId()  { return authUser?.id ?? null; }
function getDisplayName() {
  return authUser?.user_metadata?.display_name
      || authUser?.email?.split('@')[0]
      || 'User';
}

function guestJsonRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch(e) {
    return fallback;
  }
}

function guestJsonWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

function getGuestId() {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      const rand = (window.crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2)));
      id = 'guest_' + rand.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch(e) {
    return 'guest_fallback';
  }
}

function getGuestHistoryKey(subject) {
  const subjectDef = typeof SUBJECTS !== 'undefined' ? SUBJECTS[subject] : null;
  return subjectDef?.historyKey || ('mora_guest_answer_history_' + subject);
}

function getGuestHistory(subject) {
  return guestJsonRead(getGuestHistoryKey(subject), {});
}

function saveGuestHistory(subject, history) {
  guestJsonWrite(getGuestHistoryKey(subject), history || {});
}

function getGuestSessions() {
  return guestJsonRead(GUEST_SESSIONS_KEY, []);
}

function saveGuestSessions(sessions) {
  guestJsonWrite(GUEST_SESSIONS_KEY, sessions || []);
}

function guestModeAccepted() {
  try { return localStorage.getItem(GUEST_ACCEPTED_KEY) === '1'; } catch(e) { return false; }
}

function acceptGuestMode() {
  try {
    localStorage.setItem(GUEST_ACCEPTED_KEY, '1');
    if (!localStorage.getItem(GUEST_REMIND_AFTER_KEY)) localStorage.setItem(GUEST_REMIND_AFTER_KEY, '5');
  } catch(e) {}
}

function guestCompletedCount() {
  try { return parseInt(localStorage.getItem(GUEST_COMPLETED_KEY) || '0', 10) || 0; } catch(e) { return 0; }
}

function setGuestReminderAfter(count) {
  try { localStorage.setItem(GUEST_REMIND_AFTER_KEY, String(count)); } catch(e) {}
}

function shouldShowGuestAccountReminder() {
  if (!isGuest()) return false;
  try {
    const count = guestCompletedCount();
    const remindAfter = parseInt(localStorage.getItem(GUEST_REMIND_AFTER_KEY) || '5', 10) || 5;
    return count >= 5 && count >= remindAfter;
  } catch(e) {
    return false;
  }
}

function dismissGuestAccountReminder() {
  setGuestReminderAfter(guestCompletedCount() + 5);
  document.getElementById('guestAccountReminder')?.remove();
}

function markGuestImported() {
  try { localStorage.setItem(GUEST_IMPORTED_KEY, getGuestId()); } catch(e) {}
}

function guestAlreadyImported() {
  try { return localStorage.getItem(GUEST_IMPORTED_KEY) === getGuestId(); } catch(e) { return false; }
}

async function dbSaveGuestAnalyticsSession(session) {
  if (!session || session.analytics_sent) return false;
  const { error } = await dbRun('dbSaveGuestAnalyticsSession', () => _sb.from('guest_quiz_sessions').insert({
    guest_id: session.guest_id || getGuestId(),
    subject: session.subject,
    app_mode: session.app_mode,
    score: session.score,
    total: session.total,
    time_taken: session.time_taken,
    countdown_limit: session.countdown_limit,
    completed_at: session.completed_at
  }));
  return !error;
}

async function dbSyncGuestAnalytics() {
  if (!navigator.onLine) return;
  const sessions = getGuestSessions();
  let changed = false;
  for (const session of sessions) {
    if (!session.analytics_sent && await dbSaveGuestAnalyticsSession(session)) {
      session.analytics_sent = true;
      changed = true;
    }
  }
  if (changed) saveGuestSessions(sessions);
}

async function dbImportGuestProgress() {
  if (isGuest() || guestAlreadyImported()) return false;
  const uid = getUserId();
  const subjects = Object.keys(typeof SUBJECTS !== 'undefined' ? SUBJECTS : {});
  let importedAnswers = 0;
  let importedSessions = 0;

  for (const subject of subjects) {
    const hist = getGuestHistory(subject);
    const rows = Object.entries(hist).map(([questionId, item]) => ({
      user_id: uid,
      subject,
      question_id: questionId,
      selected: item.selected,
      correct: !!item.correct,
      answered_at: new Date(item.timestamp || Date.now()).toISOString()
    }));
    if (rows.length) {
      await dbRun('dbImportGuestAnswers', () => _sb.from('answer_history').upsert(rows, { onConflict: 'user_id,subject,question_id' }));
      for (const row of rows) {
        await dbUpdatePerformance(subject, row.question_id, row.correct).catch(() => {});
      }
      importedAnswers += rows.length;
    }
  }

  const sessions = getGuestSessions();
  const sessionRows = sessions.map(s => ({
    user_id: uid,
    subject: s.subject,
    app_mode: s.app_mode,
    score: s.score,
    total: s.total,
    time_taken: s.time_taken,
    countdown_limit: s.countdown_limit,
    completed_at: s.completed_at
  }));
  if (sessionRows.length) {
    await dbRun('dbImportGuestSessions', () => _sb.from('quiz_sessions').insert(sessionRows));
    importedSessions = sessionRows.length;
  }

  await dbRun('dbLinkGuestSessions', () => _sb
    .from('guest_quiz_sessions')
    .update({ user_id: uid, is_linked: true })
    .eq('guest_id', getGuestId())
    .is('user_id', null));

  markGuestImported();
  _learningSnapshotCache = null;
  return importedAnswers > 0 || importedSessions > 0;
}

// ── Sign up ───────────────────────────────────────────────────────────────────
async function authSignUp(email, password, displayName) {
  const { data, error } = await _sb.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } }
  });
  if (error) throw error;
  return data;
}

// ── Sign in ───────────────────────────────────────────────────────────────────
async function authSignIn(email, password) {
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  authUser = data.user;
  return data;
}

// ── Sign out ──────────────────────────────────────────────────────────────────
async function authSignOut() {
  await _sb.auth.signOut();
  authUser = null;
  // Reset to landing screen
  state.screen = 'landing';
  renderApp();
  renderAuthPill();
}

// ── Password reset ────────────────────────────────────────────────────────────
async function authResetPassword(email) {
  const { error } = await _sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  if (error) throw error;
}

// ── Answer History (Supabase version) ────────────────────────────────────────
// These replace the localStorage functions when user is logged in.

async function dbLoadAnswerHistory(subject) {
  if (isGuest()) return getGuestHistory(subject);
  const { data, error } = await dbRun('dbLoadAnswerHistory', () => _sb
    .from('answer_history')
    .select('question_id, selected, correct, answered_at')
    .eq('user_id', getUserId())
    .eq('subject', subject));
  if (error) return {};
  const hist = {};
  (data || []).forEach(r => {
    hist[r.question_id] = {
      selected: r.selected,
      correct: r.correct,
      timestamp: new Date(r.answered_at).getTime()
    };
  });
  return hist;
}

async function dbSaveAnswer(subject, questionId, selected, correct) {
  if (isGuest()) {
    const hist = getGuestHistory(subject);
    hist[questionId] = { selected, correct, timestamp: Date.now() };
    saveGuestHistory(subject, hist);
    return;
  }
  _learningSnapshotCache = null;
  // Upsert N/A update if already answered (e.g. retried question)
  const { error } = await dbRun('dbSaveAnswer', () => _sb.from('answer_history').upsert({
    user_id:     getUserId(),
    subject,
    question_id: questionId,
    selected,
    correct,
    answered_at: new Date().toISOString()
  }, { onConflict: 'user_id,subject,question_id' }));

  // Also update question_performance counters
  await dbUpdatePerformance(subject, questionId, correct);
}

async function dbUpdatePerformance(subject, questionId, correct) {
  if (isGuest()) return;
  const uid = getUserId();
  // Fetch existing row
  const { data, error } = await dbRun('dbUpdatePerformance load', () => _sb
    .from('question_performance')
    .select('correct_count, incorrect_count')
    .eq('user_id', uid)
    .eq('question_id', questionId)
    .single());
  if (error && error.code !== 'PGRST116') return;

  const cc = (data?.correct_count   || 0) + (correct ? 1 : 0);
  const ic = (data?.incorrect_count || 0) + (correct ? 0 : 1);

  await dbRun('dbUpdatePerformance save', () => _sb.from('question_performance').upsert({
    user_id:         uid,
    question_id:     questionId,
    subject,
    correct_count:   cc,
    incorrect_count: ic
  }, { onConflict: 'user_id,question_id' }));
}

// ── Save quiz session on completion ──────────────────────────────────────────
async function dbSaveSession(subject, appMode, score, total, timeTaken, countdownLimit) {
  if (isGuest()) {
    const completedCount = guestCompletedCount() + 1;
    try { localStorage.setItem(GUEST_COMPLETED_KEY, String(completedCount)); } catch(e) {}
    const sessions = getGuestSessions();
    const session = {
      local_id: 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      guest_id: getGuestId(),
      subject,
      app_mode: appMode,
      score,
      total,
      time_taken: timeTaken,
      countdown_limit: countdownLimit,
      completed_at: new Date().toISOString(),
      analytics_sent: false
    };
    if (navigator.onLine && await dbSaveGuestAnalyticsSession(session)) session.analytics_sent = true;
    sessions.push(session);
    saveGuestSessions(sessions);
    setTimeout(() => {
      if (shouldShowGuestAccountReminder() && typeof showGuestAccountReminder === 'function') {
        showGuestAccountReminder();
      }
    }, 700);
    return;
  }
  _learningSnapshotCache = null;
  await dbRun('dbSaveSession', () => _sb.from('quiz_sessions').insert({
    user_id:         getUserId(),
    subject,
    app_mode:        appMode,
    score,
    total,
    time_taken:      timeTaken,
    countdown_limit: countdownLimit,
    completed_at:    new Date().toISOString()
  }));
}

// ── Load quiz history ─────────────────────────────────────────────────────────
async function dbLoadHistory(limit = 30) {
  if (isGuest()) return getGuestSessions().slice().sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)).slice(0, limit);
  const { data, error } = await dbRun('dbLoadHistory', () => _sb
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', getUserId())
    .order('completed_at', { ascending: false })
    .limit(limit));
  if (error) return [];
  return data || [];
}

// ── Load stats ────────────────────────────────────────────────────────────────
async function dbLoadStats() {
  if (isGuest()) {
    const sessions = getGuestSessions();
    if (sessions.length === 0) return { sessions: [], bySubject: {}, total: 0 };
    const totalQuizzes = sessions.length;
    const totalCorrect = sessions.reduce((s, r) => s + (Number(r.score) || 0), 0);
    const totalQ = sessions.reduce((s, r) => s + (Number(r.total) || 0), 0);
    const avgPct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
    const bestSession = sessions.reduce((best, r) =>
      (r.total > 0 && r.score / r.total > (best?.score / best?.total || 0)) ? r : best, null);
    const bySubject = {};
    sessions.forEach(r => {
      if (!bySubject[r.subject]) bySubject[r.subject] = { correct: 0, total: 0, count: 0 };
      bySubject[r.subject].correct += Number(r.score) || 0;
      bySubject[r.subject].total += Number(r.total) || 0;
      bySubject[r.subject].count++;
    });
    return { sessions, totalQuizzes, totalCorrect, totalQ, avgPct, bestSession, bySubject };
  }
  const { data, error } = await dbRun('dbLoadStats', () => _sb
    .from('quiz_sessions')
    .select('subject, app_mode, score, total, time_taken, completed_at')
    .eq('user_id', getUserId()));
  if (error) return null;
  const sessions = data || [];
  if (sessions.length === 0) return { sessions: [], bySubject: {}, total: 0 };

  const totalQuizzes  = sessions.length;
  const totalCorrect  = sessions.reduce((s, r) => s + r.score, 0);
  const totalQ        = sessions.reduce((s, r) => s + r.total, 0);
  const avgPct        = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const bestSession   = sessions.reduce((best, r) =>
    (r.total > 0 && r.score / r.total > (best?.score / best?.total || 0)) ? r : best, null);

  // Per-subject breakdown
  const bySubject = {};
  sessions.forEach(r => {
    if (!bySubject[r.subject]) bySubject[r.subject] = { correct: 0, total: 0, count: 0 };
    bySubject[r.subject].correct += r.score;
    bySubject[r.subject].total   += r.total;
    bySubject[r.subject].count++;
  });

  return { sessions, totalQuizzes, totalCorrect, totalQ, avgPct, bestSession, bySubject };
}

// ── Weak questions ────────────────────────────────────────────────────────────
async function dbLoadWeakQuestions(subject, limit = 10) {
  if (isGuest()) return [];
  const { data, error } = await dbRun('dbLoadWeakQuestions', () => _sb
    .from('question_performance')
    .select('question_id, correct_count, incorrect_count')
    .eq('user_id', getUserId())
    .eq('subject', subject)
    .gt('incorrect_count', 0)
    .order('incorrect_count', { ascending: false })
    .limit(limit));
  if (error) return [];
  return data || [];
}

// ── Question Flags ────────────────────────────────────────────────────────────
const _flagsCache  = {};          // subject → Set<questionId>
const FLAGS_PREFIX = 'mora_flags_v1_';

function _flagKey(subject) { return FLAGS_PREFIX + subject; }

function _flagsForSubject(subject) {
  if (!_flagsCache[subject]) {
    try {
      const raw = localStorage.getItem(_flagKey(subject));
      _flagsCache[subject] = new Set(raw ? JSON.parse(raw) : []);
    } catch(e) { _flagsCache[subject] = new Set(); }
  }
  return _flagsCache[subject];
}

function _saveLocalFlags(subject) {
  try {
    localStorage.setItem(_flagKey(subject), JSON.stringify([..._flagsForSubject(subject)]));
  } catch(e) {}
}

function isFlagged(subject, qId) {
  return _flagsForSubject(subject).has(qId);
}

function getFlagCount(subject) {
  return _flagsForSubject(subject).size;
}

function getFlaggedIds(subject) {
  return _flagsForSubject(subject);
}

async function toggleFlag(subject, qId) {
  const set = _flagsForSubject(subject);
  const adding = !set.has(qId);
  if (adding) set.add(qId); else set.delete(qId);
  _saveLocalFlags(subject);
  // Sync to DB for logged-in users
  if (!isGuest()) {
    if (adding) {
      await dbRun('flag add', () => _sb.from('user_flags').upsert(
        { user_id: getUserId(), subject, question_id: qId }, { onConflict: 'user_id,question_id' }
      )).catch(() => {});
    } else {
      await dbRun('flag remove', () => _sb.from('user_flags')
        .delete().eq('user_id', getUserId()).eq('question_id', qId)
      ).catch(() => {});
    }
  }
  return adding;
}

// ── Performance cache (for spaced repetition) ────────────────────────────────
// Keyed by questionId → { correct_count, incorrect_count }
let _perfCache = {};

async function dbLoadPerformance(subject) {
  _perfCache = {};
  if (isGuest()) return;
  const { data } = await dbRun('load perf', () =>
    _sb.from('question_performance')
      .select('question_id,correct_count,incorrect_count')
      .eq('user_id', getUserId())
      .eq('subject', subject)
  );
  if (data) data.forEach(r => { _perfCache[r.question_id] = r; });
}

function getPerfCache() { return _perfCache; }

async function dbResetAnswers(subject, questionIds) {
  if (!questionIds || questionIds.length === 0) return;
  if (isGuest()) {
    // Guest: remove from localStorage history
    const hist = getGuestHistory(subject);
    questionIds.forEach(id => delete hist[id]);
    saveGuestHistory(subject, hist);
    return;
  }
  // Logged in: delete rows in batches of 50 (Supabase IN clause limit)
  const uid = getUserId();
  for (let i = 0; i < questionIds.length; i += 50) {
    const batch = questionIds.slice(i, i + 50);
    await dbRun('reset answers', () =>
      _sb.from('answer_history')
        .delete()
        .eq('user_id', uid)
        .eq('subject', subject)
        .in('question_id', batch)
    );
  }
}

async function dbLoadFlags(subject) {
  if (isGuest()) return;
  const { data } = await dbRun('load flags', () =>
    _sb.from('user_flags').select('question_id').eq('user_id', getUserId()).eq('subject', subject)
  );
  if (data && data.length) {
    const set = _flagsForSubject(subject);
    data.forEach(r => set.add(r.question_id));
    _saveLocalFlags(subject);
  }
}

// ── App Settings ──────────────────────────────────────────────────────────────
let _appSettings = {
  exam_mode_enabled: true,
  exam_mode_modes: ['pastpaper', 'fullpaper'],
  timer_enabled: true,
  flags_enabled: true,
  leaderboard_public: true,
  leaderboard_modes: ['pastpaper', 'target']
};

async function dbLoadAppSettings() {
  const { data } = await dbRun('app settings', () =>
    _sb.from('app_settings').select('key,value')
  );
  if (data && data.length) {
    data.forEach(row => {
      try { _appSettings[row.key] = row.value; } catch(e) {}
    });
  }
  window._appSettings = _appSettings;
}

async function dbSaveAppSetting(key, value) {
  if (!isAdmin()) return;
  await dbRun('save setting', () =>
    _sb.from('app_settings').upsert(
      { key, value, updated_by: getUserId(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  );
  _appSettings[key] = value;
  window._appSettings = _appSettings;
}
window.dbSaveAppSetting = dbSaveAppSetting;

// ── Admin DB functions ────────────────────────────────────────────────────────

async function dbAdminOverview() {
  const { data, error } = await _sb.rpc('admin_overview');
  if (error) throw error;
  return data;
}

async function dbAdminUserStats() {
  const { data, error } = await _sb.rpc('admin_user_stats');
  if (error) throw error;
  return data || [];
}

async function dbAdminMostMissed(limit = 15) {
  const { data, error } = await _sb.rpc('admin_most_missed', { p_limit: limit });
  if (error) throw error;
  return data || [];
}

async function dbAdminDailyActivity() {
  const { data, error } = await _sb.rpc('admin_daily_activity');
  if (error) throw error;
  return data || [];
}

async function dbAdminGuestStats() {
  const { data, error } = await _sb.rpc('admin_guest_stats');
  if (error) throw error;
  return data || {};
}

async function dbAdminResetUserHistory(userId) {
  const { error } = await _sb.rpc('admin_reset_user_history', { p_user_id: userId });
  if (error) throw error;
}

// ── AUTH UI ───────────────────────────────────────────────────────────────────

// Renders the small pill in the nav bar
function renderAuthPill() {
  const container = document.getElementById('authPill');
  if (!container) return;
  if (isGuest()) {
    container.innerHTML = `
      <button onclick="showAuthModal('login')"
        style="background:var(--surface2);border:1px solid var(--border);border-radius:20px;
               color:var(--text-muted);padding:4px 14px;cursor:pointer;font-size:0.78rem;
               font-family:inherit;transition:border-color 0.15s,color 0.15s;">
        Sign in
      </button>`;
  } else {
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--accent);
                    display:flex;align-items:center;justify-content:center;
                    font-size:0.8rem;font-weight:700;color:#fff;flex-shrink:0;">
          ${getDisplayName().charAt(0).toUpperCase()}
        </div>
        <span style="font-size:0.82rem;color:var(--text-muted);max-width:120px;
                     overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${getDisplayName()}
        </span>
        <button onclick="showAccountMenu(event)"
          style="background:none;border:none;color:var(--text-muted);cursor:pointer;
                 font-size:0.75rem;padding:2px 4px;">&#9662;</button>
      </div>`;
  }
}

// Account dropdown menu
function showAccountMenu(e) {
  e.stopPropagation();
  const existing = document.getElementById('accountMenu');
  if (existing) { existing.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'accountMenu';
  menu.style.cssText = `
    position:fixed;top:54px;right:16px;
    background:var(--surface);border:1px solid var(--border);
    border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);
    z-index:1000;min-width:180px;overflow:hidden;
  `;
  menu.innerHTML = `
    <div style="padding:10px 14px;border-bottom:1px solid var(--border);">
      <div style="font-size:0.85rem;font-weight:600;color:var(--text);">${getDisplayName()}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-top:1px;">${authUser?.email || ''}</div>
    </div>
    <button onclick="state.screen='history';renderApp();document.getElementById('accountMenu')?.remove()"
      style="width:100%;text-align:left;padding:10px 14px;background:none;border:none;
             color:var(--text);cursor:pointer;font-size:0.85rem;font-family:inherit;
             display:flex;align-items:center;gap:8px;">
      History Quiz History
    </button>
    <button onclick="state.screen='stats';renderApp();document.getElementById('accountMenu')?.remove()"
      style="width:100%;text-align:left;padding:10px 14px;background:none;border:none;
             color:var(--text);cursor:pointer;font-size:0.85rem;font-family:inherit;
             display:flex;align-items:center;gap:8px;">
      Stats Statistics
    </button>
    <div style="height:1px;background:var(--border);margin:0 14px;"></div>
    <button onclick="authSignOut();document.getElementById('accountMenu')?.remove()"
      style="width:100%;text-align:left;padding:10px 14px;background:none;border:none;
             color:#f87171;cursor:pointer;font-size:0.85rem;font-family:inherit;
             display:flex;align-items:center;gap:8px;">
      Sign out
    </button>
  `;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
}

// ── Auth Modal (Login / Signup / Reset) ───────────────────────────────────────
let _authModalMode = 'login'; // 'login' | 'signup' | 'reset'
let _authCooldownTimer = null;

function _isAuthRateLimit(err) {
  const text = String(err?.message || err || '').toLowerCase();
  return text.includes('rate limit') || text.includes('too many') || err?.status === 429;
}

function _friendlyAuthError(err) {
  if (_isAuthRateLimit(err)) {
    return 'Too many email requests right now. Please wait a few minutes, then try again. If you already created the account, check your inbox or sign in after confirming.';
  }
  const text = String(err?.message || '');
  if (text.toLowerCase().includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }
  if (text.toLowerCase().includes('email not confirmed')) {
    return 'Please confirm your email first, then sign in.';
  }
  return text || 'Something went wrong.';
}

function _setAuthError(msg) {
  const el = document.getElementById('authError');
  const ok = document.getElementById('authSuccess');
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
  if (ok) ok.style.display = 'none';
}

function _setAuthSuccess(msg) {
  const el = document.getElementById('authSuccess');
  const err = document.getElementById('authError');
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
  if (err) err.style.display = 'none';
}

function _setAuthLoading(loading) {
  const btn = document.getElementById('authSubmitBtn');
  if (btn) { btn.disabled = loading; btn.style.opacity = loading ? '0.6' : '1'; }
}

function showAuthToast(message = 'Successfully logged in') {
  document.getElementById('authToast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'authToast';
  toast.className = 'auth-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="auth-toast-check" aria-hidden="true">&#10003;</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 20);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 260);
  }, 2600);
}

function _startAuthCooldown(seconds = 45) {
  const btn = document.getElementById('authSubmitBtn');
  if (!btn) return;
  if (_authCooldownTimer) clearInterval(_authCooldownTimer);
  const originalText = btn.dataset.originalText || btn.textContent;
  btn.dataset.originalText = originalText;
  let remaining = seconds;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.textContent = `Try again in ${remaining}s`;
  _authCooldownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(_authCooldownTimer);
      _authCooldownTimer = null;
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.textContent = originalText;
    } else {
      btn.textContent = `Try again in ${remaining}s`;
    }
  }, 1000);
}

async function submitAuthReset() {
  const email = document.getElementById('authEmail')?.value.trim();
  if (!email) { _setAuthError('Please enter your email.'); return; }
  try {
    await authResetPassword(email);
    _setAuthSuccess('Reset link sent! Check your inbox.');
  } catch(err) {
    _setAuthError(_friendlyAuthError(err));
  }
}

// ── History Screen ────────────────────────────────────────────────────────────
async function renderHistory() {
  const sessions = await dbLoadHistory(50);

  if (sessions.length === 0) {
    return `
    <div style="text-align:center;padding:3rem 0;">
      <div style="font-size:3rem;margin-bottom:1rem;">History</div>
      <h2 style="margin-bottom:0.5rem;">No quizzes yet</h2>
      <p style="color:var(--text-muted);">Complete a quiz to see your history here.</p>
      <button onclick="state.screen='landing';renderApp()"
        style="margin-top:1.5rem;background:var(--accent);border:none;border-radius:10px;
               color:#fff;padding:10px 20px;cursor:pointer;font-family:inherit;font-weight:600;">
        Start a Quiz
      </button>
    </div>`;
  }

  const rows = sessions.map(s => {
    const pct     = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
    const color   = pct >= 75 ? 'var(--correct)' : pct >= 50 ? '#fbbf24' : 'var(--wrong)';
    const modeStr = s.app_mode === 'target' ? 'Target Target'
                  : s.app_mode === 'fullpaper' ? 'Full Paper Full Paper' : 'Stats Past Paper';
    const dateStr = new Date(s.completed_at).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const subjectLabel = (typeof SUBJECTS !== 'undefined' && SUBJECTS[s.subject])
      ? SUBJECTS[s.subject].label : s.subject;

    return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;
                padding:1rem 1.2rem;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <div style="font-size:1.6rem;font-weight:700;color:${color};font-family:'DM Mono',monospace;
                  min-width:52px;text-align:center;">${pct}%</div>
      <div style="flex:1;min-width:120px;">
        <div style="font-weight:600;font-size:0.92rem;">${subjectLabel}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">
          ${modeStr} &nbsp;&middot;&nbsp; ${s.score}/${s.total} correct
        </div>
      </div>
      <div style="text-align:right;font-size:0.78rem;color:var(--text-muted);">
        <div>${dateStr}</div>
        <div style="margin-top:2px;">Time ${formatTime(s.time_taken)}</div>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="header" style="padding:2rem 0 1.5rem;">
    <h1>Quiz History</h1>
    <p style="color:var(--text-muted);">${sessions.length} quiz${sessions.length !== 1 ? 'zes' : ''} completed</p>
  </div>
  <div style="display:flex;flex-direction:column;gap:10px;">
    ${rows}
  </div>`;
}

// ── Stats Screen ──────────────────────────────────────────────────────────────
async function renderStats() {
  const stats = await dbLoadStats();

  if (!stats || stats.sessions.length === 0) {
    return `
    <div style="text-align:center;padding:3rem 0;">
      <div style="font-size:3rem;margin-bottom:1rem;">Stats</div>
      <h2 style="margin-bottom:0.5rem;">No data yet</h2>
      <p style="color:var(--text-muted);">Complete some quizzes to see your statistics.</p>
    </div>`;
  }

  const subjectRows = Object.entries(stats.bySubject).map(([key, s]) => {
    const pct   = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
    const color = pct >= 75 ? 'var(--correct)' : pct >= 50 ? '#fbbf24' : 'var(--wrong)';
    const label = (typeof SUBJECTS !== 'undefined' && SUBJECTS[key]) ? SUBJECTS[key].label : key;
    return `
    <div style="display:flex;align-items:center;gap:12px;padding:0.7rem 0;
                border-bottom:1px solid var(--border);">
      <div style="flex:1;font-size:0.88rem;font-weight:500;">${label}</div>
      <div style="font-size:0.78rem;color:var(--text-muted);">${s.count} quiz${s.count!==1?'zes':''}</div>
      <div style="font-family:'DM Mono',monospace;font-weight:700;color:${color};
                  min-width:44px;text-align:right;">${pct}%</div>
    </div>`;
  }).join('');

  const bestPct = stats.bestSession
    ? Math.round((stats.bestSession.score / stats.bestSession.total) * 100) : 0;

  return `
  <div class="header" style="padding:2rem 0 1.5rem;">
    <h1>Statistics</h1>
    <p style="color:var(--text-muted);">Your overall performance</p>
  </div>

  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:1.5rem;">
    ${[
      ['Q', stats.totalQuizzes, 'Quizzes'],
      ['OK', stats.totalCorrect, 'Correct'],
      ['Target', stats.avgPct + '%', 'Avg Score'],
      ['Best', bestPct + '%', 'Best Score']
    ].map(([icon, val, lbl]) => `
      <div style="flex:1;min-width:90px;background:var(--surface);border:1px solid var(--border);
                  border-radius:14px;padding:1rem;text-align:center;">
        <div style="font-size:1.4rem;margin-bottom:4px;">${icon}</div>
        <div style="font-size:1.5rem;font-weight:700;font-family:'DM Mono',monospace;
                    color:var(--accent-light);">${val}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${lbl}</div>
      </div>`).join('')}
  </div>

  <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;
              padding:1.2rem 1.4rem;">
    <h3 style="font-size:0.95rem;margin-bottom:0.8rem;color:var(--text-muted);">By Subject</h3>
    ${subjectRows || '<p style="color:var(--text-muted);font-size:0.85rem;">No data yet.</p>'}
  </div>`;
}

// ── Boot: show auth gate on first load ────────────────────────────────────────
// Called from quiz_app.js after DOM is ready
async function bootAuth() {
  await initAuth();
  renderAuthPill();
  // Load app settings (affects mode picker, flags visibility etc.)
  dbLoadAppSettings().catch(() => {});
  renderApp();

  if (!isGuest()) {
    dbLoadAnswerHistory(state.currentSubject)
      .then(hist => {
        answerHistory = hist;
        // Don't re-render on landing N/A renderLanding already fires dbLoadLearningSnapshot
        // which re-renders once the snapshot arrives (avoids a redundant double paint).
        if (state.screen !== 'landing') renderApp();
      })
      .catch(() => {});
    // Load flags for current subject in background
    dbLoadFlags(state.currentSubject).catch(() => {});
  } else {
    dbSyncGuestAnalytics().catch(() => {});
  }
}

// Premium nav account controls. These intentionally override the early simple
// definitions above while keeping the same public function names.
function renderAuthPill() {
  const container = document.getElementById('authPill');
  if (!container) return;
  if (isGuest()) {
    container.innerHTML = `
      <button class="auth-signin-btn" onclick="showAuthModal('login')">
        Sign in
      </button>`;
    return;
  }

  container.innerHTML = `
    <button class="account-pill" onclick="showAccountMenu(event)" aria-label="Open account menu">
      ${lpAvatar(userProfile || lpDefaultProfile(), 36).replace('lp-avatar', 'lp-avatar account-avatar')}
      <span class="account-name">${getDisplayName()}</span>
      <span class="account-chevron">&#9662;</span>
    </button>`;
}

function showAccountMenu(e) {
  if (e) e.stopPropagation();
  const existing = document.getElementById('accountMenu');
  if (existing) { existing.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'accountMenu';
  menu.className = 'account-menu';
  menu.innerHTML = `
    <div class="account-menu-head">
      <div class="account-menu-name">${getDisplayName()}</div>
      <div class="account-menu-email">${authUser?.email || ''}</div>
    </div>
    <button onclick="state.screen='dashboard';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Dashboard
    </button>
    <button onclick="state.screen='profile';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Profile
    </button>
    <button onclick="state.screen='analytics';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Analytics
    </button>
    <button onclick="state.screen='weakAreas';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Weak Areas
    </button>
    <button onclick="state.screen='achievements';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Achievements
    </button>
    <button onclick="state.screen='leaderboards';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Leaderboards
    </button>
    <div class="account-menu-sep"></div>
    <button onclick="state.screen='history';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Quiz History
    </button>
    <button onclick="state.screen='stats';renderApp();document.getElementById('accountMenu')?.remove()" class="account-menu-item">
      Statistics
    </button>
    <div class="account-menu-sep"></div>
    <button onclick="authSignOut();document.getElementById('accountMenu')?.remove()" class="account-menu-item danger">
      Sign out
    </button>
  `;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
}

// Learning platform data/services. These functions intentionally live in the
// auth/data layer because they aggregate Supabase-owned learning data.
const LEARNING_AVATARS = [
  { id:'initials', label:'Initials', icon:'initials', group:'Basic', color:'#dfe7ff', bg:'#1d2745' },
  { id:'engineer', label:'Engineer', iconHtml:'&#128104;&#8205;&#128295;', group:'Built-in', color:'#c7f9ff', bg:'#12313d' },
  { id:'robot', label:'AI Bot', iconHtml:'&#129302;', group:'Built-in', color:'#d7d8ff', bg:'#25204a' },
  { id:'rocket', label:'Rocket', iconHtml:'&#128640;', group:'Built-in', color:'#ffd7a8', bg:'#3c2412' },
  { id:'atom', label:'Atom', iconHtml:'&#9883;', group:'Built-in', color:'#c9f7ff', bg:'#102f42' },
  { id:'books', label:'Books', iconHtml:'&#128218;', group:'Built-in', color:'#d9f99d', bg:'#1f3018' },
  { id:'sigma', label:'Sigma', iconHtml:'&#931;', group:'Built-in', color:'#ead7ff', bg:'#291f48' },
  { id:'code', label:'Code', iconHtml:'&lt;/&gt;', group:'Built-in', color:'#bff5d2', bg:'#143321' }
];

const LEARNING_ACHIEVEMENTS = [
  { id:'first_quiz', group:'Getting Started', title:'First Quiz', desc:'Complete your first quiz.', target:1, metric:'totalQuizzes' },
  { id:'perfect_score', group:'Getting Started', title:'First Perfect Score', desc:'Score 100% in any quiz.', target:1, metric:'perfectScores' },
  { id:'first_full_paper', group:'Getting Started', title:'First Full Paper', desc:'Complete a full past paper.', target:1, metric:'fullPapers' },
  { id:'q100', group:'Progress', title:'100 Questions Answered', desc:'Answer 100 questions.', target:100, metric:'totalQuestions' },
  { id:'q500', group:'Progress', title:'500 Questions Answered', desc:'Answer 500 questions.', target:500, metric:'totalQuestions' },
  { id:'q1000', group:'Progress', title:'1000 Questions Answered', desc:'Answer 1000 questions.', target:1000, metric:'totalQuestions' },
  { id:'acc80', group:'Performance', title:'80% Accuracy', desc:'Reach 80% overall accuracy.', target:80, metric:'accuracy' },
  { id:'acc90', group:'Performance', title:'90% Accuracy', desc:'Reach 90% overall accuracy.', target:90, metric:'accuracy' },
  { id:'acc95', group:'Performance', title:'95% Accuracy', desc:'Reach 95% overall accuracy.', target:95, metric:'accuracy' },
  { id:'streak3', group:'Consistency', title:'3 Day Streak', desc:'Complete quizzes on 3 consecutive days.', target:3, metric:'longestStreak' },
  { id:'streak7', group:'Consistency', title:'7 Day Streak', desc:'Complete quizzes on 7 consecutive days.', target:7, metric:'longestStreak' },
  { id:'streak30', group:'Consistency', title:'30 Day Streak', desc:'Complete quizzes on 30 consecutive days.', target:30, metric:'longestStreak' },
  { id:'master_math', group:'Subject Mastery', title:'Mathematics Master', desc:'Reach 85% accuracy after 100 Mathematics questions.', target:1, metric:'master_math' },
  { id:'master_cs', group:'Subject Mastery', title:'Computer Science Master', desc:'Reach 85% accuracy after 100 Computer Science questions.', target:1, metric:'master_cs' },
  { id:'master_mechanics', group:'Subject Mastery', title:'Mechanics Master', desc:'Reach 85% accuracy after 100 Mechanics questions.', target:1, metric:'master_mechanics' },
  { id:'master_fluid', group:'Subject Mastery', title:'Fluid Mechanics Master', desc:'Reach 85% accuracy after 100 Fluid questions.', target:1, metric:'master_fluid' },
  { id:'master_materials', group:'Subject Mastery', title:'Material Science Master', desc:'Reach 85% accuracy after 100 Materials questions.', target:1, metric:'master_materials' }
];

let _learningSnapshotCache = null;
let _learningSnapshotAt = 0;

function lpEscape(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function lpPct(a, b) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

function lpSubjectLabel(key) {
  return (typeof SUBJECTS !== 'undefined' && SUBJECTS[key]) ? SUBJECTS[key].label : (key || 'Unknown');
}

function lpSubjectIcon(key) {
  return (typeof SUBJECTS !== 'undefined' && SUBJECTS[key]) ? SUBJECTS[key].icon : '*';
}

function lpQuestionIndex() {
  const map = {};
  if (typeof SUBJECTS === 'undefined') return map;
  Object.values(SUBJECTS).forEach(s => {
    const collect = (q, source) => {
      if (!q || !q.id) return;
      map[q.id] = {
        id: q.id,
        subject: s.key,
        subjectLabel: s.label,
        unit: q.unit ?? null,
        unitLabel: q.unit ? (s.units?.[q.unit] || ('Unit ' + q.unit)) : (q.year || source),
        section: q.year || source,
        subsection: q.unit ? (s.units?.[q.unit] || ('Unit ' + q.unit)) : (q.year || source),
        text: q.text || ''
      };
    };
    (s.pastUnit || []).forEach(q => collect(q, 'Past Paper'));
    (s.pastPaper || []).forEach(q => collect(q, 'Full Paper'));
    (s.allTarget || []).forEach(q => collect(q, 'Target Quiz'));
  });
  return map;
}

function lpDefaultProfile() {
  const name = getDisplayName();
  return {
    id: getUserId(),
    display_name: name,
    avatar_style: 'initials',
    avatar_icon: 'initials',
    avatar_color: '#8fa6f5',
    avatar_bg: '#182033',
    avatar_url: '',
    public_profile: true,
    leaderboard_visible: true,
    created_at: authUser?.created_at || new Date().toISOString()
  };
}

function lpAvatar(profile, size = 44) {
  const p = profile || lpDefaultProfile();
  if (p.avatar_url) {
    return `<span class="lp-avatar lp-avatar-image" style="width:${size}px;height:${size}px;"><img src="${lpEscape(p.avatar_url)}" alt="${lpEscape(p.display_name || 'Profile avatar')}"></span>`;
  }
  const iconDef = LEARNING_AVATARS.find(a => a.id === p.avatar_icon);
  const text = (p.avatar_icon === 'initials' || !iconDef)
    ? (p.display_name || getDisplayName() || 'U').trim().slice(0, 2).toUpperCase()
    : (iconDef.iconHtml || lpEscape(iconDef.icon));
  const bg = p.avatar_bg || iconDef?.bg || '#182033';
  const color = p.avatar_color || iconDef?.color || '#8fa6f5';
  const content = iconDef?.iconHtml && p.avatar_icon !== 'initials' ? text : lpEscape(text);
  return `<span class="lp-avatar" style="width:${size}px;height:${size}px;background:${bg};color:${color};">${content}</span>`;
}

async function dbEnsureUserProfile() {
  if (isGuest()) return null;
  const base = lpDefaultProfile();
  const existing = await dbRun('dbEnsureUserProfile.select', () => _sb
    .from('user_profiles')
    .select('*')
    .eq('id', getUserId())
    .maybeSingle());
  if (existing.data) return existing.data;
  if (existing.error && existing.error.code !== 'PGRST116') return base;

  const { data, error } = await dbRun('dbEnsureUserProfile.insert', () => _sb
    .from('user_profiles')
    .insert(base)
    .select('*')
    .single());
  if (error) {
    return base;
  }
  return data || base;
}

async function dbUpdateUserProfile(patch) {
  if (isGuest()) return null;
  const allowed = new Set([
    'display_name',
    'avatar_style',
    'avatar_icon',
    'avatar_color',
    'avatar_bg',
    'avatar_url',
    'public_profile',
    'leaderboard_visible'
  ]);
  const cleanPatch = {};
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (allowed.has(key)) cleanPatch[key] = value;
  });
  const row = {
    ...lpDefaultProfile(),
    ...(userProfile || {}),
    ...cleanPatch,
    id: getUserId(),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await dbRun('dbUpdateUserProfile', () => _sb
    .from('user_profiles')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single());
  if (error) throw error;
  _learningSnapshotCache = null;
  userProfile = data || userProfile;
  return data;
}

async function uploadProfileAvatar(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!isLoggedIn()) {
    alert('Please sign in before uploading a profile picture.');
    return;
  }
  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    input.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('Please choose an image smaller than 2 MB.');
    input.value = '';
    return;
  }

  const ext = (file.name.split('.').pop() || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
  const objectPath = `${getUserId()}/avatar-${Date.now()}.${ext}`;
  const { error } = await _sb.storage
    .from('profile-avatars')
    .upload(objectPath, file, { cacheControl: '3600', upsert: true, contentType: file.type });

  if (error) {
    alert('Avatar upload is not ready yet. Create a Supabase Storage bucket named profile-avatars and allow users to upload their own folder.');
    input.value = '';
    return;
  }

  const { data } = _sb.storage.from('profile-avatars').getPublicUrl(objectPath);
  await updateProfileSetting({
    avatar_url: data.publicUrl,
    avatar_style: 'custom',
    avatar_icon: 'custom'
  });
}

function lpComputeStreaks(sessions) {
  const days = [...new Set((sessions || []).map(s => new Date(s.completed_at).toISOString().slice(0,10)))].sort();
  let longest = 0, run = 0, prev = null;
  days.forEach(d => {
    const cur = new Date(d + 'T00:00:00Z');
    if (prev && (cur - prev) === 86400000) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  });
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const daySet = new Set(days);
  let current = 0;
  let cursor = daySet.has(today.toISOString().slice(0,10)) ? today : yesterday;
  while (daySet.has(cursor.toISOString().slice(0,10))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest };
}

function lpAggregateLearning(profile, sessions, performance, recentAnswers, storedAchievements) {
  const qIndex = lpQuestionIndex();
  const totalQuizzes = sessions.length;
  const totalQuestions = sessions.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const totalCorrect = sessions.reduce((s, r) => s + (Number(r.score) || 0), 0);
  const totalIncorrect = Math.max(0, totalQuestions - totalCorrect);
  const totalStudyTime = sessions.reduce((s, r) => s + (Number(r.time_taken) || 0), 0);
  const accuracy = lpPct(totalCorrect, totalQuestions);
  const sessionPcts = sessions.map(s => s.total > 0 ? (s.score / s.total) * 100 : 0);
  const bestScore = Math.round(Math.max(0, ...sessionPcts));
  const averageScore = sessionPcts.length ? Math.round(sessionPcts.reduce((a,b)=>a+b,0) / sessionPcts.length) : 0;
  const streaks = lpComputeStreaks(sessions);

  const bySubject = {};
  sessions.forEach(r => {
    if (!bySubject[r.subject]) bySubject[r.subject] = { subject:r.subject, quizzes:0, attempted:0, correct:0, incorrect:0, studyTime:0, bestScore:0, scores:[] };
    const b = bySubject[r.subject];
    const scorePct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
    b.quizzes += 1;
    b.attempted += Number(r.total) || 0;
    b.correct += Number(r.score) || 0;
    b.incorrect = Math.max(0, b.attempted - b.correct);
    b.studyTime += Number(r.time_taken) || 0;
    b.bestScore = Math.max(b.bestScore, scorePct);
    b.scores.push(scorePct);
  });
  Object.values(bySubject).forEach(b => {
    b.accuracy = lpPct(b.correct, b.attempted);
    b.averageScore = b.scores.length ? Math.round(b.scores.reduce((a,c)=>a+c,0) / b.scores.length) : 0;
  });

  const bySection = {};
  const bySubsection = {};
  const weakQuestions = [];
  (performance || []).forEach(p => {
    const meta = qIndex[p.question_id] || { subject:p.subject, unitLabel:'Unknown', section:'Unknown', subsection:'Unknown', text:p.question_id };
    const attempts = (Number(p.correct_count)||0) + (Number(p.incorrect_count)||0);
    const incorrect = Number(p.incorrect_count)||0;
    const correct = Number(p.correct_count)||0;
    if (!attempts) return;
    const secKey = `${meta.subject}|${meta.section}`;
    const subKey = `${meta.subject}|${meta.subsection}`;
    if (!bySection[secKey]) bySection[secKey] = { subject:meta.subject, name:meta.section, attempted:0, correct:0, incorrect:0 };
    if (!bySubsection[subKey]) bySubsection[subKey] = { subject:meta.subject, name:meta.subsection, attempted:0, correct:0, incorrect:0 };
    bySection[secKey].attempted += attempts; bySection[secKey].correct += correct; bySection[secKey].incorrect += incorrect;
    bySubsection[subKey].attempted += attempts; bySubsection[subKey].correct += correct; bySubsection[subKey].incorrect += incorrect;
    if (incorrect > 0) weakQuestions.push({ ...p, ...meta, attempts, incorrect, correct, accuracy:lpPct(correct, attempts) });
  });
  [bySection, bySubsection].forEach(group => Object.values(group).forEach(x => x.accuracy = lpPct(x.correct, x.attempted)));

  const trendMap = {};
  sessions.forEach(r => {
    const day = new Date(r.completed_at).toISOString().slice(0,10);
    if (!trendMap[day]) trendMap[day] = { date:day, quizzes:0, total:0, correct:0, time:0 };
    trendMap[day].quizzes += 1;
    trendMap[day].total += Number(r.total)||0;
    trendMap[day].correct += Number(r.score)||0;
    trendMap[day].time += Number(r.time_taken)||0;
  });
  const trends = Object.values(trendMap).sort((a,b)=>a.date.localeCompare(b.date)).slice(-30);
  trends.forEach(t => t.accuracy = lpPct(t.correct, t.total));

  const master = {};
  Object.entries(bySubject).forEach(([k,b]) => master['master_' + k] = (b.attempted >= 100 && b.accuracy >= 85) ? 1 : Math.min(0.99, b.attempted / 100));
  const achievementMetrics = {
    totalQuizzes,
    totalQuestions,
    accuracy,
    longestStreak: streaks.longest,
    perfectScores: sessions.some(s => s.total > 0 && s.score === s.total) ? 1 : 0,
    fullPapers: sessions.some(s => s.app_mode === 'fullpaper') ? 1 : 0,
    ...master
  };
  const stored = Object.fromEntries((storedAchievements || []).map(a => [a.achievement_id, a]));
  const achievements = LEARNING_ACHIEVEMENTS.map(a => {
    const value = Number(achievementMetrics[a.metric] || 0);
    const progress = a.target > 0 ? Math.min(100, Math.round((value / a.target) * 100)) : 0;
    const unlocked = value >= a.target;
    return { ...a, value, progress, unlocked, unlocked_at: stored[a.id]?.unlocked_at || (unlocked ? new Date().toISOString() : null) };
  });

  const weakSubjects = Object.values(bySubject).filter(s => s.attempted >= 10 && s.accuracy < 60).sort((a,b)=>a.accuracy-b.accuracy);
  const weakSections = Object.values(bySection).filter(s => s.attempted >= 5 && s.accuracy < 60).sort((a,b)=>a.accuracy-b.accuracy);
  const weakSubsections = Object.values(bySubsection).filter(s => s.attempted >= 5 && s.accuracy < 60).sort((a,b)=>a.accuracy-b.accuracy);
  weakQuestions.sort((a,b) => b.incorrect - a.incorrect || a.accuracy - b.accuracy);

  const recommendations = lpBuildRecommendations({ bySubject, weakSubjects, weakSections, weakSubsections, trends, sessions });

  return {
    profile,
    sessions,
    recentAnswers,
    totals: { totalQuizzes, totalQuestions, totalCorrect, totalIncorrect, accuracy, bestScore, averageScore, totalStudyTime, currentStreak:streaks.current, longestStreak:streaks.longest },
    bySubject,
    bySection,
    bySubsection,
    trends,
    weak: { weakSubjects, weakSections, weakSubsections, weakQuestions: weakQuestions.slice(0, 20) },
    achievements,
    recommendations
  };
}

function lpBuildRecommendations(data) {
  const out = [];
  data.weakSubsections.slice(0, 3).forEach(x => {
    out.push({ priority:'High', title:`Review ${x.name}`, text:`Your accuracy here is ${x.accuracy}% after ${x.attempted} attempts.` });
  });
  const subjects = Object.values(data.bySubject);
  if (subjects.length) {
    const max = Math.max(...subjects.map(s => s.attempted));
    subjects.filter(s => s.attempted < Math.max(20, max * 0.35)).slice(0, 2).forEach(s => {
      out.push({ priority:'Medium', title:`Practice more ${lpSubjectLabel(s.subject)}`, text:`You have answered ${s.attempted} questions here compared with ${max} in your most practiced subject.` });
    });
  }
  const lastBySubject = {};
  data.sessions.forEach(s => {
    const t = new Date(s.completed_at).getTime();
    lastBySubject[s.subject] = Math.max(lastBySubject[s.subject] || 0, t);
  });
  Object.keys(typeof SUBJECTS !== 'undefined' ? SUBJECTS : {}).forEach(k => {
    const days = lastBySubject[k] ? Math.floor((Date.now() - lastBySubject[k]) / 86400000) : null;
    if (days !== null && days >= 12) out.push({ priority:'Low', title:`Revisit ${lpSubjectLabel(k)}`, text:`You have not practiced this subject for ${days} days.` });
  });
  if (!out.length) out.push({ priority:'Good', title:'Keep the rhythm', text:'Your recent performance is balanced. Continue rotating subjects.' });
  return out.slice(0, 6);
}

async function dbLoadLearningSnapshot(force = false) {
  if (isGuest()) return lpAggregateLearning(lpDefaultProfile(), [], [], [], []);
  if (!force && _learningSnapshotCache && Date.now() - _learningSnapshotAt < 60000) return _learningSnapshotCache;
  const profile = await dbEnsureUserProfile();
  const [sessionsRes, perfRes, answersRes, achRes] = await Promise.all([
    dbRun('learning sessions', () => _sb.from('quiz_sessions').select('subject, app_mode, score, total, time_taken, countdown_limit, completed_at').eq('user_id', getUserId()).order('completed_at', { ascending:false }).limit(5000)),
    dbRun('learning performance', () => _sb.from('question_performance').select('subject, question_id, correct_count, incorrect_count').eq('user_id', getUserId()).limit(20000)),
    dbRun('learning answers', () => _sb.from('answer_history').select('subject, question_id, selected, correct, answered_at').eq('user_id', getUserId()).order('answered_at', { ascending:false }).limit(25)),
    dbRun('learning achievements', () => _sb.from('user_achievements').select('*').eq('user_id', getUserId()))
  ]);
  const snap = lpAggregateLearning(profile, sessionsRes.data || [], perfRes.data || [], answersRes.data || [], achRes.data || []);
  _learningSnapshotCache = snap;
  _learningSnapshotAt = Date.now();
  dbSyncAchievements(snap).catch(() => {});
  return snap;
}

async function dbSyncAchievements(snapshot) {
  if (isGuest()) return;
  const rows = snapshot.achievements
    .filter(a => a.unlocked || a.progress > 0)
    .map(a => ({ user_id:getUserId(), achievement_id:a.id, progress:a.progress, unlocked_at:a.unlocked_at }));
  if (!rows.length) return;
  await dbRun('dbSyncAchievements', () => _sb.from('user_achievements').upsert(rows, { onConflict:'user_id,achievement_id' }));
}

function lpSignInPrompt(title = 'Sign in to save this') {
  return `<div class="lp-page"><div class="lp-empty"><h2>${lpEscape(title)}</h2><p>Guests can practice and view leaderboards, but profile, analytics, achievements, and recommendations need an account.</p><button class="primary" onclick="showAuthModal('login')">Sign in</button></div></div>`;
}

function lpMetricCards(items) {
  return `<div class="lp-metric-grid">${items.map(i => `<div class="lp-metric-card"><div class="lp-metric-val">${i.val}</div><div class="lp-metric-lbl">${lpEscape(i.lbl)}</div></div>`).join('')}</div>`;
}

function lpBars(items, valueKey = 'accuracy') {
  const max = Math.max(1, ...items.map(x => Number(x[valueKey]) || 0));
  return `<div class="lp-bars">${items.map(x => `<div class="lp-bar-row"><span>${lpEscape(x.label || x.name || lpSubjectLabel(x.subject))}</span><div><i style="width:${Math.max(4, ((Number(x[valueKey])||0) / max) * 100)}%"></i></div><b>${Math.round(Number(x[valueKey])||0)}${valueKey.includes('time') || valueKey === 'attempted' ? '' : '%'}</b></div>`).join('')}</div>`;
}

async function renderDashboard() {
  if (isGuest()) return renderLanding();
  const s = await dbLoadLearningSnapshot();
  const t = s.totals;
  return `<div class="lp-page">
    <div class="lp-page-head"><div>${lpAvatar(s.profile, 54)}</div><div><h1>Welcome back, ${lpEscape(s.profile.display_name || getDisplayName())}</h1><p>Your learning dashboard</p></div></div>
    ${lpMetricCards([
      {val:'Streak ' + t.currentStreak, lbl:'Current streak'},
      {val:t.accuracy + '%', lbl:'Overall accuracy'},
      {val:t.totalQuestions, lbl:'Questions answered'},
      {val:formatTime(t.totalStudyTime), lbl:'Study time'}
    ])}
    <div class="lp-two-col">
      <section class="lp-panel"><h2>Study Recommendations</h2>${s.recommendations.map(r => `<div class="lp-rec"><b>${lpEscape(r.priority)}</b><span>${lpEscape(r.title)}</span><p>${lpEscape(r.text)}</p></div>`).join('')}</section>
      <section class="lp-panel"><h2>Weak Areas</h2>${s.weak.weakSubsections.length ? lpBars(s.weak.weakSubsections.slice(0,5)) : '<p class="muted">No weak areas detected yet.</p>'}</section>
    </div>
    <section class="lp-panel"><h2>Quick Start</h2><div class="lp-action-row">
      <button onclick="state.screen='landing';renderApp()">Subject Practice</button>
      <button onclick="state.screen='weakAreas';renderApp()">Practice Weak Areas</button>
      <button onclick="state.screen='leaderboards';renderApp()">View Leaderboards</button>
      <button onclick="state.screen='achievements';renderApp()">Achievements</button>
    </div></section>
  </div>`;
}

async function renderProfilePage() {
  if (isGuest()) return lpSignInPrompt('Profile is saved online');
  const s = await dbLoadLearningSnapshot(true);
  const t = s.totals;
  const avatarButtons = LEARNING_AVATARS.map(a => {
    const previewProfile = {
      ...s.profile,
      avatar_url: '',
      avatar_icon: a.id,
      avatar_style: a.group.toLowerCase(),
      avatar_color: a.color || s.profile.avatar_color,
      avatar_bg: a.bg || s.profile.avatar_bg
    };
    return `<button class="lp-avatar-choice ${!s.profile.avatar_url && s.profile.avatar_icon===a.id?'active':''}"
      title="${lpEscape(a.label)}"
      onclick="updateProfileSetting({avatar_url:'',avatar_icon:'${a.id}',avatar_style:'${a.group.toLowerCase()}',avatar_color:'${a.color || '#8fa6f5'}',avatar_bg:'${a.bg || '#182033'}'})">
      ${lpAvatar(previewProfile, 46)}
      <span>${lpEscape(a.label)}</span>
    </button>`;
  }).join('');
  return `<div class="lp-page">
    <div class="lp-page-head" id="profileIdentityPanel"><div>${lpAvatar(s.profile, 72)}</div><div><h1>${lpEscape(s.profile.display_name)}</h1><p>${lpEscape(authUser.email)} &middot; Joined ${new Date(s.profile.created_at || authUser.created_at).toLocaleDateString()}</p></div></div>
    <div id="profileStatsPanel">${lpMetricCards([
      {val:t.totalQuizzes, lbl:'Quizzes completed'}, {val:t.totalQuestions, lbl:'Questions answered'},
      {val:t.totalCorrect, lbl:'Correct'}, {val:t.totalIncorrect, lbl:'Incorrect'},
      {val:t.accuracy + '%', lbl:'Overall accuracy'}, {val:t.bestScore + '%', lbl:'Best score'},
      {val:t.averageScore + '%', lbl:'Average score'}, {val:formatTime(t.totalStudyTime), lbl:'Study time'},
      {val:'N/A', lbl:'Current rank'}, {val:t.currentStreak, lbl:'Current streak'}, {val:t.longestStreak, lbl:'Longest streak'}
    ])}</div>
    <section class="lp-panel" id="profileSettingsPanel"><h2>Profile Settings</h2>
      <div class="lp-form-grid">
        <label>Display name<input id="profileNameInput" value="${lpEscape(s.profile.display_name)}"></label>
        <label>Avatar color<input id="profileAvatarColor" type="color" value="${s.profile.avatar_color || '#8fa6f5'}"></label>
        <label>Background color<input id="profileAvatarBg" type="color" value="${s.profile.avatar_bg || '#182033'}"></label>
      </div>
      <div class="lp-profile-upload" id="profileAvatarPanel">
        <div>
          <strong>Profile picture</strong>
          <span>Use a built-in avatar or upload your own image.</span>
        </div>
        <input id="profileAvatarUpload" type="file" accept="image/*" onchange="uploadProfileAvatar(this)" hidden>
        <button type="button" onclick="document.getElementById('profileAvatarUpload')?.click()">Upload image</button>
        ${s.profile.avatar_url ? `<button type="button" onclick="updateProfileSetting({avatar_url:'',avatar_icon:'initials',avatar_style:'basic'})">Remove photo</button>` : ''}
      </div>
      <div class="lp-avatar-row">${avatarButtons}</div>
      <div id="profilePrivacyPanel">
        <label class="lp-toggle"><input type="checkbox" ${s.profile.public_profile?'checked':''} onchange="updateProfileSetting({public_profile:this.checked})"> Public profile</label>
        <label class="lp-toggle"><input type="checkbox" ${s.profile.leaderboard_visible?'checked':''} onchange="updateProfileSetting({leaderboard_visible:this.checked})"> Show me on leaderboards</label>
      </div>
      <button class="primary" onclick="saveProfileSettings()">Save Profile</button>
    </section>
  </div>`;
}

async function updateProfileSetting(patch) {
  try {
    await dbUpdateUserProfile(patch);
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'display_name') && _sb?.auth?.updateUser) {
      await _sb.auth.updateUser({ data: { display_name: patch.display_name } }).catch(() => {});
      if (authUser) authUser.user_metadata = { ...(authUser.user_metadata || {}), display_name: patch.display_name };
    }
    if (typeof showAuthToast === 'function') showAuthToast('Profile saved', 'success');
    renderApp();
  } catch(e) {
    alert(e.message || 'Could not update profile.');
  }
}

async function saveProfileSettings() {
  const name = document.getElementById('profileNameInput')?.value.trim() || getDisplayName();
  const avatar_color = document.getElementById('profileAvatarColor')?.value || '#8fa6f5';
  const avatar_bg = document.getElementById('profileAvatarBg')?.value || '#182033';
  await updateProfileSetting({ display_name:name, avatar_color, avatar_bg });
}

const PROFILE_TUTORIAL_STEPS = [
  {
    title: 'This is your study profile',
    text: 'Your name and avatar appear here. You can use a built-in avatar or upload your own profile picture.',
    selector: '#profileIdentityPanel'
  },
  {
    title: 'Your progress summary',
    text: 'These cards show quizzes completed, accuracy, streaks, study time, and other profile-level stats.',
    selector: '#profileStatsPanel'
  },
  {
    title: 'Change your avatar',
    text: 'Pick a built-in avatar, tune its colors, or upload a custom image if you want your own picture.',
    selector: '#profileAvatarPanel'
  },
  {
    title: 'Privacy and leaderboards',
    text: 'Use these toggles to control whether your profile is public and whether you appear on leaderboards.',
    selector: '#profilePrivacyPanel'
  },
  {
    title: 'Badges and achievements',
    text: 'Badges live in the Achievements page. They unlock as you complete quizzes, build streaks, and master subjects.',
    selector: '.account-pill',
    action: () => {
      if (typeof showAuthToast === 'function') showAuthToast('Open Account > Achievements to see your badges');
    }
  }
];

let _profileTutorialStep = 0;
let _profileTutorialActive = false;

function profileTutorialStorageKey() {
  let userPart = 'guest';
  try {
    if (typeof getUserId === 'function' && getUserId()) userPart = getUserId();
  } catch(e) {}
  return 'mora_quiz_profile_tutorial_seen_' + userPart;
}

function hasSeenProfileTutorial() {
  try { return localStorage.getItem(profileTutorialStorageKey()) === '1'; } catch(e) { return true; }
}

function markProfileTutorialSeen() {
  try { localStorage.setItem(profileTutorialStorageKey(), '1'); } catch(e) {}
}

function maybeShowProfileTutorial() {
  if (_profileTutorialActive || hasSeenProfileTutorial() || isGuest()) return;
  if (typeof state !== 'undefined' && state.screen !== 'profile') return;
  setTimeout(startProfileTutorial, 350);
}

function startProfileTutorial() {
  if (_profileTutorialActive || hasSeenProfileTutorial()) return;
  _profileTutorialActive = true;
  if (typeof lockTutorialInteraction === 'function') lockTutorialInteraction();
  _profileTutorialStep = 0;
  renderProfileTutorialStep();
}

function renderProfileTutorialStep() {
  const step = PROFILE_TUTORIAL_STEPS[_profileTutorialStep];
  if (!step) return finishProfileTutorial();
  if (typeof step.action === 'function') step.action();
  document.getElementById('profileTutorialOverlay')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="profileTutorialOverlay" class="app-tutorial-overlay profile-tutorial-overlay">
      <div id="profileTutorialSpotlight" class="app-tutorial-spotlight"></div>
      <div class="app-tutorial-card profile-tutorial-card" role="dialog" aria-modal="true">
        <div class="app-tutorial-kicker">Profile guide ${_profileTutorialStep + 1}/${PROFILE_TUTORIAL_STEPS.length}</div>
        <h2>${lpEscape(step.title)}</h2>
        <p>${lpEscape(step.text)}</p>
        <div class="app-tutorial-actions">
          <button onclick="skipProfileTutorial()">Skip</button>
          <button ${_profileTutorialStep === 0 ? 'disabled' : ''} onclick="prevProfileTutorialStep()">Back</button>
          <button class="primary" onclick="nextProfileTutorialStep()">${_profileTutorialStep === PROFILE_TUTORIAL_STEPS.length - 1 ? 'Got it' : 'Next'}</button>
        </div>
      </div>
    </div>
  `);
  positionProfileTutorialSpotlight(step.selector);
}

function positionProfileTutorialSpotlight(selector) {
  const target = document.querySelector(selector);
  const spot = document.getElementById('profileTutorialSpotlight');
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

function finishProfileTutorial() {
  markProfileTutorialSeen();
  _profileTutorialActive = false;
  document.getElementById('profileTutorialOverlay')?.remove();
  if (typeof unlockTutorialInteraction === 'function') unlockTutorialInteraction();
}

function skipProfileTutorial() {
  finishProfileTutorial();
}

function nextProfileTutorialStep() {
  if (_profileTutorialStep >= PROFILE_TUTORIAL_STEPS.length - 1) return finishProfileTutorial();
  _profileTutorialStep += 1;
  renderProfileTutorialStep();
}

function prevProfileTutorialStep() {
  if (_profileTutorialStep <= 0) return;
  _profileTutorialStep -= 1;
  renderProfileTutorialStep();
}

Object.assign(window, {
  maybeShowProfileTutorial,
  startProfileTutorial,
  skipProfileTutorial,
  nextProfileTutorialStep,
  prevProfileTutorialStep
});

async function renderAnalyticsPage() {
  if (isGuest()) return lpSignInPrompt('Analytics need an account');
  const s = await dbLoadLearningSnapshot();
  const subjects = Object.values(s.bySubject).sort((a,b)=>b.attempted-a.attempted);
  return `<div class="lp-page"><div class="lp-page-head"><div><h1>Study Analytics</h1><p>Performance trends and subject breakdowns</p></div></div>
    ${lpMetricCards([{val:s.totals.accuracy+'%',lbl:'Accuracy'}, {val:s.totals.totalQuestions,lbl:'Questions answered'}, {val:s.totals.averageScore+'%',lbl:'Average score'}, {val:formatTime(s.totals.totalStudyTime),lbl:'Study time'}])}
    <div class="lp-two-col">
      <section class="lp-panel"><h2>Accuracy Trend</h2>${lpBars(s.trends.map(t=>({name:new Date(t.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}), accuracy:t.accuracy})).slice(-12))}</section>
      <section class="lp-panel"><h2>Subject Distribution</h2>${lpBars(subjects.map(x=>({name:lpSubjectLabel(x.subject), attempted:x.attempted})), 'attempted')}</section>
    </div>
    <section class="lp-panel"><h2>Subject Analytics</h2>${renderSubjectAnalyticsTable(subjects)}</section>
    <div class="lp-two-col"><section class="lp-panel"><h2>Section Analytics</h2>${renderAreaTable(Object.values(s.bySection).slice(0,12))}</section><section class="lp-panel"><h2>Subsection Analytics</h2>${renderAreaTable(Object.values(s.bySubsection).slice(0,12))}</section></div>
  </div>`;
}

function renderSubjectAnalyticsTable(rows) {
  if (!rows.length) return '<p class="muted">No subject analytics yet.</p>';
  return `<div class="lp-table">${rows.map(r => `<div class="lp-table-row"><b>${lpSubjectIcon(r.subject)} ${lpEscape(lpSubjectLabel(r.subject))}</b><span>${r.attempted} attempted</span><span>${r.correct} correct</span><span>${r.incorrect} incorrect</span><strong>${r.accuracy}%</strong></div>`).join('')}</div>`;
}

function renderAreaTable(rows) {
  const sorted = [...rows].sort((a,b)=>a.accuracy-b.accuracy);
  if (!sorted.length) return '<p class="muted">No data yet.</p>';
  return `<div class="lp-table compact">${sorted.map(r => `<div class="lp-table-row"><b>${lpEscape(r.name)}</b><span>${lpEscape(lpSubjectLabel(r.subject))}</span><span>${r.attempted} attempts</span><strong>${r.accuracy}%</strong></div>`).join('')}</div>`;
}

async function renderWeakAreasPage() {
  if (isGuest()) return lpSignInPrompt('Weak area tracking needs an account');
  const s = await dbLoadLearningSnapshot();
  return `<div class="lp-page"><div class="lp-page-head"><div><h1>Weak Areas</h1><p>Built from question performance data</p></div></div>
    <div class="lp-two-col"><section class="lp-panel"><h2>Weak Subjects</h2>${renderAreaTable(s.weak.weakSubjects)}</section><section class="lp-panel"><h2>Weak Sections</h2>${renderAreaTable(s.weak.weakSections)}</section></div>
    <section class="lp-panel"><h2>Weak Subsections</h2>${renderAreaTable(s.weak.weakSubsections)}</section>
    <section class="lp-panel"><h2>Frequently Missed Questions</h2>${s.weak.weakQuestions.length ? s.weak.weakQuestions.map(q => `<div class="lp-weak-q"><b>${lpEscape(q.unitLabel)}</b><p>${lpEscape(q.text).slice(0,180)}</p><span>${q.accuracy}% accuracy &middot; ${q.incorrect} incorrect &middot; ${q.attempts} attempts</span><button onclick="askJanudaAbout('${lpEscape(q.unitLabel)}')">Ask Januda</button></div>`).join('') : '<p class="muted">No missed questions yet.</p>'}</section>
    <div class="lp-action-row"><button onclick="practiceWeakArea()">Practice Weak Questions</button><button onclick="retryIncorrectFromHistory()">Retry Incorrect Questions</button><button onclick="openJanudaChat()">Ask AI Tutor About Weak Areas</button></div>
  </div>`;
}

function practiceWeakArea() {
  state.screen = 'landing';
  renderApp();
  alert('Choose a subject, then use Weak Areas mode. Your weak-area list above shows what to target first.');
}

function retryIncorrectFromHistory() {
  state.screen = 'landing';
  renderApp();
  alert('Open a subject quiz and use Retry Incorrect after a quiz. Stored weak-question practice is ready for the next phase.');
}

function askJanudaAbout(area) {
  openJanudaChat();
  const input = document.getElementById('chatInput');
  if (input) input.value = `Explain my weak area: ${area}. Give me a concise revision plan and common mistakes.`;
}

async function renderAchievementsPage() {
  if (isGuest()) return lpSignInPrompt('Achievements need an account');
  const s = await dbLoadLearningSnapshot(true);
  const groups = {};
  s.achievements.forEach(a => { if (!groups[a.group]) groups[a.group] = []; groups[a.group].push(a); });
  return `<div class="lp-page"><div class="lp-page-head"><div><h1>Achievements</h1><p>${s.achievements.filter(a=>a.unlocked).length}/${s.achievements.length} unlocked</p></div></div>
    ${Object.entries(groups).map(([g,items]) => `<section class="lp-panel"><h2>${lpEscape(g)}</h2><div class="lp-ach-grid">${items.map(a => `<div class="lp-ach ${a.unlocked?'unlocked':'locked'}"><b>${lpEscape(a.title)}</b><p>${lpEscape(a.desc)}</p><div class="lp-ach-track"><i style="width:${a.progress}%"></i></div><span>${a.unlocked ? 'Unlocked' : a.progress + '%'}</span></div>`).join('')}</div></section>`).join('')}
  </div>`;
}

async function dbLoadLeaderboard(kind = 'accuracy', period = 'all') {
  const prefix = kind === 'pastpaper_accuracy' ? 'learning_pastpaper_leaderboard' : 'learning_leaderboard';
  const view = period === 'weekly' ? `${prefix}_weekly` : period === 'monthly' ? `${prefix}_monthly` : `${prefix}_all_time`;
  let orderCol = kind === 'active' ? 'questions_answered' : kind === 'time' ? 'study_time' : 'accuracy';
  const buildQuery = () => {
    let q = _sb.from(view).select('*').order(orderCol, { ascending:false }).limit(25);
    // Minimum 10 questions for accuracy board (avoids 100% from single-question fluke)
    if (kind === 'accuracy' || kind === 'pastpaper_accuracy') q = q.gte('questions_answered', 10);
    return q;
  };
  const { data, error } = await dbRun('leaderboard', buildQuery);
  if (error) {
    return { rows: [], error: error.message || 'query failed' };
  }
  return { rows: data || [], error: null };
}

async function renderLeaderboardsPage() {
  const kind   = window._leaderboardKind   || 'accuracy';
  const period = window._leaderboardPeriod || 'all';
  const { rows, error } = await dbLoadLeaderboard(kind, period);
  const tabs    = [['accuracy','Overall Accuracy'],['pastpaper_accuracy','Past Paper Accuracy'],['active','Most Active'],['time','Study Time']];
  const periods = [['all','All-Time'],['weekly','Weekly'],['monthly','Monthly']];

  let emptyMsg;
  if (error) {
    emptyMsg = `<p class="muted">Could not load leaderboard.<br><span style="font-size:0.8rem;opacity:0.6;">${lpEscape(error)}</span></p>`;
  } else if (period !== 'all') {
    emptyMsg = `<p class="muted">No activity yet for this period. Switch to <strong>All-Time</strong> or complete more quizzes.</p>`;
  } else if (kind === 'accuracy' || kind === 'pastpaper_accuracy') {
    emptyMsg = `<p class="muted">No users with 10+ questions answered yet.<br>Complete some quizzes to appear here!</p>`;
  } else {
    emptyMsg = `<p class="muted">No quiz data yet. Complete a quiz to appear on the leaderboard.</p>`;
  }

  const rowsHtml = rows.length
    ? rows.map((r, i) => `<div class="lp-leader-row">
        <span class="rank">#${i+1}</span>
        ${lpAvatar(r, 38)}
        <b>${lpEscape(r.display_name)}</b>
        <span>${r.questions_answered} questions</span>
        <strong>${kind==='time' ? formatTime(r.study_time) : kind==='active' ? r.questions_answered : r.accuracy+'%'}</strong>
      </div>`).join('')
    : emptyMsg;

  return `<div class="lp-page">
    <div class="lp-page-head"><div><h1>Leaderboards</h1><p>Public rankings N/A complete quizzes to climb the board.</p></div></div>
    <div class="lp-tabs">${tabs.map(t=>`<button class="${kind===t[0]?'active':''}" onclick="window._leaderboardKind='${t[0]}';renderApp()">${t[1]}</button>`).join('')}</div>
    <div class="lp-tabs small">${periods.map(t=>`<button class="${period===t[0]?'active':''}" onclick="window._leaderboardPeriod='${t[0]}';renderApp()">${t[1]}</button>`).join('')}</div>
    <section class="lp-panel">${rowsHtml}</section>
  </div>`;
}

function renderPostQuizInsights() {
  const grouped = {};
  state.results.forEach(r => {
    const key = r.question.unit ? unitTag(r.question.unit) : (r.question.year || 'Quiz');
    if (!grouped[key]) grouped[key] = { total:0, correct:0 };
    grouped[key].total += 1;
    if (r.correct) grouped[key].correct += 1;
  });
  const areas = Object.entries(grouped).map(([name,x]) => ({ name, accuracy:lpPct(x.correct,x.total), total:x.total })).sort((a,b)=>b.accuracy-a.accuracy);
  const strengths = areas.filter(a => a.accuracy >= 75).slice(0,3);
  const weak = areas.filter(a => a.accuracy < 60).slice(0,3);
  return `<div class="post-insights">
    <h3>Post Quiz Insights</h3>
    <div class="lp-two-col">
      <section><h4>Strengths</h4>${strengths.length ? strengths.map(a=>`<p>${lpEscape(a.name)} &middot; ${a.accuracy}%</p>`).join('') : '<p>No clear strength yet.</p>'}</section>
      <section><h4>Needs Work</h4>${weak.length ? weak.map(a=>`<p>${lpEscape(a.name)} &middot; ${a.accuracy}%</p>`).join('') : '<p>No major weakness in this quiz.</p>'}</section>
    </div>
    <div class="lp-action-row"><button onclick="retryIncorrectFromHistory()">Retry Incorrect Questions</button><button onclick="state.screen='weakAreas';renderApp()">Practice Weak Areas</button><button onclick="openJanudaChat()">Ask Januda About Mistakes</button></div>
  </div>`;
}

// Keep profile rows warm after auth changes.
const _learningBaseInitAuth = initAuth;
initAuth = async function() {
  await _learningBaseInitAuth();
  if (isLoggedIn()) dbEnsureUserProfile().catch(() => {});
};

const _learningBaseAuthSignIn = authSignIn;
authSignIn = async function(email, password) {
  const data = await _learningBaseAuthSignIn(email, password);
  await dbEnsureUserProfile().catch(() => {});
  const imported = await dbImportGuestProgress().catch(() => false);
  window._guestProgressImportedOnAuth = imported;
  _learningSnapshotCache = null;
  return data;
};

function authPasswordField(id, label, enterHandler = 'submitAuth()') {
  return `
    <label class="auth-label">${label}</label>
    <div class="auth-pass-wrap">
      <input id="${id}" type="password" placeholder="Password" class="auth-input"
        onkeypress="if(event.key==='Enter')${enterHandler}">
      <button type="button" class="auth-eye" onclick="togglePasswordVisibility('${id}', this)" aria-label="Show password">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
    </div>`;
}

function togglePasswordVisibility(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  if (btn) btn.classList.toggle('visible', show);
}

function showAuthModal(mode = 'login') {
  _authModalMode = mode;
  document.getElementById('authModal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'authModal';
  overlay.className = 'auth-modal-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = _buildAuthForm(mode);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.querySelector('input')?.focus(), 80);
}

function _buildAuthForm(mode) {
  if (mode === 'reset') {
    return `
    <div class="auth-card">
      <button class="auth-close" onclick="document.getElementById('authModal')?.remove()">&times;</button>
      <h2>Reset password</h2>
      <p>Enter your email and we will send a reset link.</p>
      <div id="authError" class="auth-alert error" style="display:none;"></div>
      <div id="authSuccess" class="auth-alert success" style="display:none;"></div>
      <label class="auth-label">Email</label>
      <input id="authEmail" type="email" placeholder="you@example.com" class="auth-input"
        onkeypress="if(event.key==='Enter')submitAuthReset()">
      <button class="auth-primary" onclick="submitAuthReset()">Send reset link</button>
      <button class="auth-link-btn" onclick="showAuthModal('login')">Back to sign in</button>
    </div>`;
  }

  const isLogin = mode === 'login';
  const rememberChecked = localStorage.getItem(AUTH_REMEMBER_KEY) !== '0';
  const pendingGuestMode = window._pendingGuestQuizMode || '';
  const guestOption = pendingGuestMode
    ? `<button class="auth-guest-top" onclick="document.getElementById('authModal')?.remove();showGuestContinueConfirm('${pendingGuestMode}')">Continue as guest</button>`
    : '';
  return `
  <div class="auth-card">
    <button class="auth-close" onclick="document.getElementById('authModal')?.remove()">&times;</button>
    <h2>${isLogin ? 'Sign in' : 'Create account'}</h2>
    <p>${isLogin ? 'Save progress, analytics, achievements, and recommendations.' : 'Create an account to keep your progress synced.'}</p>
    ${guestOption}
    <div id="authError" class="auth-alert error" style="display:none;"></div>
    <div id="authSuccess" class="auth-alert success" style="display:none;"></div>

    ${!isLogin ? `
      <label class="auth-label">Display name</label>
      <input id="authName" type="text" placeholder="Your name" class="auth-input"
        onkeypress="if(event.key==='Enter')submitAuth()">
    ` : ''}

    <label class="auth-label">Email</label>
    <input id="authEmail" type="email" placeholder="you@example.com" class="auth-input"
      onkeypress="if(event.key==='Enter')submitAuth()">

    ${authPasswordField('authPassword', 'Password')}
    ${!isLogin ? authPasswordField('authPasswordConfirm', 'Confirm password') : ''}

    ${isLogin ? `
      <div class="auth-row">
        <label class="auth-check"><input id="authRemember" type="checkbox" ${rememberChecked ? 'checked' : ''}> Remember me</label>
        <button class="auth-inline-link" onclick="showAuthModal('reset')">Forgot password?</button>
      </div>
    ` : ''}

    <button id="authSubmitBtn" class="auth-primary" onclick="submitAuth()">${isLogin ? 'Sign in' : 'Create account'}</button>
    <button class="auth-link-btn" onclick="showAuthModal('${isLogin ? 'signup' : 'login'}')">
      ${isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
    </button>
  </div>`;
}

async function submitAuth() {
  const email    = document.getElementById('authEmail')?.value.trim();
  const password = document.getElementById('authPassword')?.value;
  const confirm  = document.getElementById('authPasswordConfirm')?.value;
  const name     = document.getElementById('authName')?.value.trim();

  _setAuthError('');
  if (!email || !password) { _setAuthError('Please fill in all required fields.'); return; }

  if (_authModalMode === 'signup') {
    if (!name) { _setAuthError('Please enter a display name.'); return; }
    if (!confirm) { _setAuthError('Please confirm your password.'); return; }
    if (password !== confirm) { _setAuthError('Passwords do not match.'); return; }
  }

  const rememberBox = document.getElementById('authRemember');
  if (_authModalMode === 'login') {
    localStorage.setItem(AUTH_REMEMBER_KEY, rememberBox && !rememberBox.checked ? '0' : '1');
  }

  _setAuthLoading(true);
  try {
    if (_authModalMode === 'signup') {
      localStorage.setItem(AUTH_REMEMBER_KEY, '1');
      const signupData = await authSignUp(email, password, name);
      if (signupData?.session?.user || signupData?.user) {
        authUser = signupData.session?.user || signupData.user;
        await dbEnsureUserProfile().catch(() => {});
        const imported = await dbImportGuestProgress().catch(() => false);
        answerHistory = await dbLoadAnswerHistory(state.currentSubject);
        document.getElementById('authModal')?.remove();
        renderAuthPill();
        renderApp();
        showAuthToast(imported ? 'Guest progress synced to your account' : 'Successfully logged in');
        if (window._pendingGuestQuizMode && typeof showTimerModal === 'function') {
          const mode = window._pendingGuestQuizMode;
          window._pendingGuestQuizMode = null;
          setTimeout(() => showTimerModal(mode, true), 120);
        }
      } else {
        _setAuthSuccess('Account created. Check your email to confirm, then sign in.');
        _setAuthLoading(false);
      }
    } else {
      await authSignIn(email, password);
      answerHistory = await dbLoadAnswerHistory(state.currentSubject);
      document.getElementById('authModal')?.remove();
      renderAuthPill();
      renderApp();
      showAuthToast(window._guestProgressImportedOnAuth ? 'Guest progress synced to your account' : 'Successfully logged in');
      window._guestProgressImportedOnAuth = false;
      if (window._pendingGuestQuizMode && typeof showTimerModal === 'function') {
        const mode = window._pendingGuestQuizMode;
        window._pendingGuestQuizMode = null;
        setTimeout(() => showTimerModal(mode, true), 120);
      }
    }
  } catch(err) {
    _setAuthError(_friendlyAuthError(err));
    _setAuthLoading(false);
    if (_isAuthRateLimit(err)) _startAuthCooldown();
  }
}

