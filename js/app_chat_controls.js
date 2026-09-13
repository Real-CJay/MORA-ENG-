// Classic-script chat geometry controls. Loaded once before quiz_app.js.
// No chat messages, providers, authentication or persistence dependencies.
// Public window hooks and DOM contract: docs/stage-10-decomposition.md.

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
    w.classList.remove('maximized','split-left','split-right','minimized');
  }

  // ── Minimize ──
  window.chatWinMinimize = function() {
    const w = getWin();
    if (_winState === 'minimized') {
      // Restore
      w.style.height = _savedStyle.height || '500px';
      w.style.overflow = '';
      w.classList.remove('minimized');
      _winState = 'normal';
      document.getElementById('chatWcMin').title = 'Minimize';
    } else {
      if (_winState !== 'normal') { chatWinRestore(); }
      saveGeometry();
      _savedStyle.height = w.style.height || '500px';
      w.style.height = '54px';
      w.style.overflow = 'hidden';
      w.classList.add('minimized');
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
      if (_winState === 'minimized') chatWinRestore();
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
    if (_winState === 'minimized') chatWinRestore();
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
    getWin()?.classList.remove('minimized');
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
      if (_winState === 'minimized') chatWinRestore();
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
