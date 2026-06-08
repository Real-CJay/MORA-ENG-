(function() {
  const PWA_QUEUE_KEY = 'mora_quiz_pending_sync_v1';
  const INSTALL_DISMISSED_KEY = 'mora_quiz_install_dismissed_at';
  const INSTALL_REMIND_KEY = 'mora_quiz_install_remind_at';
  const COMPLETED_COUNT_KEY = 'mora_quiz_completed_count';

  let deferredInstallPrompt = null;
  let waitingWorker = null;
  let refreshingForUpdate = false;
  let updateBannerDelayTimer = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function isIosLike() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isActiveQuiz() {
    try {
      return typeof state !== 'undefined' && state.screen === 'quiz';
    } catch(e) {
      return false;
    }
  }

  function show(el, display = 'flex') {
    if (el) el.style.display = display;
  }

  function hide(el) {
    if (el) el.style.display = 'none';
  }

  function setInstallButtonVisible(visible) {
    const btn = document.getElementById('pwaInstallNavBtn');
    if (!btn) return;
    if ((visible || isIosLike()) && !isStandalone()) show(btn, 'inline-flex');
    else hide(btn);
  }

  function updateOfflineBanner() {
    const banner = document.getElementById('offlineBanner');
    if (!banner) return;
    if (navigator.onLine) hide(banner);
    else show(banner);
  }

  function queueRead() {
    try {
      return JSON.parse(localStorage.getItem(PWA_QUEUE_KEY) || '[]');
    } catch(e) {
      return [];
    }
  }

  function queueWrite(items) {
    try {
      localStorage.setItem(PWA_QUEUE_KEY, JSON.stringify(items));
    } catch(e) {}
  }

  function queuePush(type, payload) {
    const items = queueRead();
    items.push({ type, payload, queuedAt: Date.now() });
    queueWrite(items);
  }

  async function syncPending() {
    if (!navigator.onLine || typeof isGuest !== 'function' || isGuest()) return;
    if (!window.__pwaOriginalDbSaveAnswer || !window.__pwaOriginalDbSaveSession) return;

    const items = queueRead();
    if (!items.length) return;
    const remaining = [];

    for (const item of items) {
      try {
        if (item.type === 'answer') {
          const p = item.payload;
          await window.__pwaOriginalDbSaveAnswer(p.subject, p.questionId, p.selected, p.correct);
        } else if (item.type === 'session') {
          const p = item.payload;
          await window.__pwaOriginalDbSaveSession(p.subject, p.appMode, p.score, p.total, p.timeTaken, p.countdownLimit);
        }
      } catch(e) {
        remaining.push(item);
      }
    }

    queueWrite(remaining);
    if (items.length && !remaining.length && typeof showAuthToast === 'function') {
      showAuthToast('Offline progress synced');
    }
  }

  function wrapSupabaseSaves() {
    if (typeof dbSaveAnswer === 'function' && !window.__pwaOriginalDbSaveAnswer) {
      window.__pwaOriginalDbSaveAnswer = dbSaveAnswer;
      dbSaveAnswer = async function(subject, questionId, selected, correct) {
        if (typeof isGuest === 'function' && isGuest()) {
          return await window.__pwaOriginalDbSaveAnswer(subject, questionId, selected, correct);
        }
        if (!navigator.onLine) {
          queuePush('answer', { subject, questionId, selected, correct });
          return;
        }
        try {
          return await window.__pwaOriginalDbSaveAnswer(subject, questionId, selected, correct);
        } catch(e) {
          if (typeof isGuest !== 'function' || !isGuest()) {
            queuePush('answer', { subject, questionId, selected, correct });
          }
        }
      };
    }

    if (typeof dbSaveSession === 'function' && !window.__pwaOriginalDbSaveSession) {
      window.__pwaOriginalDbSaveSession = dbSaveSession;
      dbSaveSession = async function(subject, appMode, score, total, timeTaken, countdownLimit) {
        noteCompletedQuizForInstallPrompt();
        if (typeof isGuest === 'function' && isGuest()) {
          return await window.__pwaOriginalDbSaveSession(subject, appMode, score, total, timeTaken, countdownLimit);
        }
        if (!navigator.onLine) {
          queuePush('session', { subject, appMode, score, total, timeTaken, countdownLimit });
          return;
        }
        try {
          return await window.__pwaOriginalDbSaveSession(subject, appMode, score, total, timeTaken, countdownLimit);
        } catch(e) {
          if (typeof isGuest !== 'function' || !isGuest()) {
            queuePush('session', { subject, appMode, score, total, timeTaken, countdownLimit });
          }
        }
      };
    }
  }

  function noteCompletedQuizForInstallPrompt() {
    const count = (parseInt(localStorage.getItem(COMPLETED_COUNT_KEY) || '0', 10) || 0) + 1;
    localStorage.setItem(COMPLETED_COUNT_KEY, String(count));
    if (isStandalone() || !deferredInstallPrompt || isActiveQuiz()) return;

    const remindAt = parseInt(localStorage.getItem(INSTALL_REMIND_KEY) || '0', 10) || 0;
    const dismissedAt = parseInt(localStorage.getItem(INSTALL_DISMISSED_KEY) || '0', 10) || 0;
    if (count === 1 || count >= remindAt || count >= dismissedAt + 15) {
      setTimeout(showInstallPromptCard, 600);
    }
  }

  function showInstallPromptCard() {
    if (!deferredInstallPrompt || isStandalone() || document.getElementById('pwaInstallPrompt')) return;
    const count = parseInt(localStorage.getItem(COMPLETED_COUNT_KEY) || '0', 10) || 0;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="pwaInstallPrompt" class="pwa-install-overlay">
        <div class="pwa-install-card" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">
          <button class="pwa-install-close" onclick="pwaDismissInstallPrompt(15)">×</button>
          <div class="pwa-install-icon">MQ</div>
          <h2 id="pwaInstallTitle">Install Mora Quiz App to Your Device</h2>
          <p>Get faster access and study without opening browser tabs or searching for links.</p>
          <div class="pwa-install-actions">
            <button class="primary" onclick="pwaPromptInstall()">Install</button>
            <button onclick="pwaRemindInstallLater(${count})">Remind Me Later</button>
            <button onclick="pwaDismissInstallPrompt(15)">Dismiss</button>
          </div>
        </div>
      </div>
    `);
  }

  window.pwaPromptInstall = async function() {
    const prompt = deferredInstallPrompt;
    document.getElementById('pwaInstallPrompt')?.remove();
    if (!prompt) {
      if (typeof showAuthToast === 'function') showAuthToast(isIosLike() ? 'Use Share, then Add to Home Screen' : 'Use your browser menu to install Mora Quiz');
      return;
    }
    prompt.prompt();
    await prompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    setInstallButtonVisible(false);
  };

  window.pwaRemindInstallLater = function(currentCount) {
    localStorage.setItem(INSTALL_REMIND_KEY, String((currentCount || 0) + 5));
    document.getElementById('pwaInstallPrompt')?.remove();
  };

  window.pwaDismissInstallPrompt = function(offset = 15) {
    const count = parseInt(localStorage.getItem(COMPLETED_COUNT_KEY) || '0', 10) || 0;
    localStorage.setItem(INSTALL_DISMISSED_KEY, String(count + offset));
    document.getElementById('pwaInstallPrompt')?.remove();
    if (typeof showAuthToast === 'function') showAuthToast('You can install later from the nav button');
  };

  function showUpdateBanner(worker) {
    waitingWorker = worker;
    if (isActiveQuiz()) {
      if (updateBannerDelayTimer) return;
      updateBannerDelayTimer = setInterval(() => {
        if (!isActiveQuiz()) {
          clearInterval(updateBannerDelayTimer);
          updateBannerDelayTimer = null;
          showUpdateBanner(waitingWorker || worker);
        }
      }, 4000);
      return;
    }
    if (updateBannerDelayTimer) {
      clearInterval(updateBannerDelayTimer);
      updateBannerDelayTimer = null;
    }
    show(document.getElementById('updateBanner'));
  }

  window.pwaApplyUpdate = function() {
    if (!waitingWorker) return;
    refreshingForUpdate = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  async function registerServiceWorker() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    if (registration.waiting && navigator.serviceWorker.controller) {
      showUpdateBanner(registration.waiting);
    }
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(worker);
        }
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshingForUpdate && !isActiveQuiz()) window.location.reload();
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonVisible(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    setInstallButtonVisible(false);
    document.getElementById('pwaInstallPrompt')?.remove();
  });

  window.addEventListener('online', () => {
    updateOfflineBanner();
    syncPending();
  });
  window.addEventListener('offline', updateOfflineBanner);

  function bootPwaRuntime() {
    updateOfflineBanner();
    setInstallButtonVisible(Boolean(deferredInstallPrompt));
    wrapSupabaseSaves();
    syncPending();
    installKeyboardShortcuts();
    registerServiceWorker().catch(console.warn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPwaRuntime, { once: true });
  } else {
    bootPwaRuntime();
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
  }

  function handleBackShortcut(event) {
    const btn = document.querySelector('#nav-back .btn-home');
    if (!btn) return;
    event.preventDefault();
    btn.click();
  }

  function showShortcutHelp() {
    document.getElementById('shortcutHelp')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div id="shortcutHelp" class="shortcut-help-overlay" onclick="if(event.target===this)this.remove()">
        <div class="shortcut-help-card" role="dialog" aria-modal="true" aria-labelledby="shortcutHelpTitle">
          <button class="shortcut-help-close" onclick="document.getElementById('shortcutHelp')?.remove()">×</button>
          <h2 id="shortcutHelpTitle">Keyboard shortcuts</h2>
          <div class="shortcut-help-grid">
            <span>1-5</span><p>Choose an answer</p>
            <span>Enter</span><p>Confirm answer or go next</p>
            <span>P</span><p>Pause or resume timer</p>
            <span>Backspace</span><p>Back</p>
            <span>Alt + J</span><p>Open Januda Ayya</p>
            <span>Alt + M</span><p>Open model menu</p>
            <span>Alt + H</span><p>Home</p>
            <span>Alt + L</span><p>Leaderboards</p>
            <span>Alt + I</span><p>Install app</p>
          </div>
        </div>
      </div>
    `);
  }

  function installKeyboardShortcuts() {
    if (window.__moraQuizShortcutsInstalled) return;
    window.__moraQuizShortcutsInstalled = true;

    document.addEventListener('keydown', event => {
      if (isTypingTarget(event.target)) return;
      if (event.defaultPrevented) return;

      const key = event.key;
      const screen = (typeof state !== 'undefined') ? state.screen : '';

      if (key === '?' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        showShortcutHelp();
        return;
      }

      if (key === 'Backspace') {
        handleBackShortcut(event);
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const k = key.toLowerCase();
        if (k === 'j' && typeof openJanudaChat === 'function') {
          event.preventDefault();
          openJanudaChat();
        } else if (k === 'm' && typeof toggleModelDropdown === 'function' && document.getElementById('chatWindow')?.classList.contains('open')) {
          event.preventDefault();
          toggleModelDropdown(event);
        } else if (k === 'h' && typeof goHome === 'function') {
          event.preventDefault();
          goHome();
        } else if (k === 'l' && typeof renderApp === 'function' && typeof state !== 'undefined') {
          event.preventDefault();
          state.screen = 'leaderboards';
          renderApp();
        } else if (k === 'i') {
          event.preventDefault();
          window.pwaPromptInstall();
        }
        return;
      }

      if (screen !== 'quiz' || typeof state === 'undefined') return;

      if (key.toLowerCase() === 'p' && typeof togglePauseTimer === 'function') {
        event.preventDefault();
        togglePauseTimer();
        return;
      }

    });
  }
})();
