/* ToA Games — Save Slots Lab
   - Validates Save Slots + Autosave (local-only)
   - Uses TOA_Input for bindings (keyboard + touch + optional gamepad)
   - Uses TOA_GameKit for pause/settings/save slots/export/import
*/
(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const gameId = 'toa-save-slots-lab';

  const state = {
    x: 0.5,
    y: 0.5,
    score: 0,
    shards: []
  };

  const settings = { reducedMotion: false, highContrast: false, sound: true, touchControls: true };

  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };

  let paused = false;
  function setPaused(p) { paused = !!p; }

  // Input layer
  const fallbackKeys = new Set();
  const input = (window.TOA_Input && typeof window.TOA_Input.create === 'function')
    ? window.TOA_Input.create({ gameId })
    : null;

  const detachKeyboard = input
    ? input.attachKeyboard(document)
    : (function () {
        const onDown = (e) => {
          const k = String(e.key || '');
          if (!k) return;
          if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(k)) {
            e.preventDefault();
            fallbackKeys.add(k.toLowerCase());
          }
        };
        const onUp = (e) => {
          const k = String(e.key || '');
          if (!k) return;
          fallbackKeys.delete(k.toLowerCase());
        };
        document.addEventListener('keydown', onDown, { passive: false });
        document.addEventListener('keyup', onUp, { passive: false });
        return () => {
          document.removeEventListener('keydown', onDown);
          document.removeEventListener('keyup', onUp);
        };
      })();

  // Touch controls
  const touchWrap = document.getElementById('touch-controls');
  function bindTouch(btnId, action) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const down = (e) => {
      e.preventDefault();
      if (input) input.setAction(action, true);
      else fallbackKeys.add(action);
    };
    const up = (e) => {
      e.preventDefault();
      if (input) input.setAction(action, false);
      else fallbackKeys.delete(action);
    };

    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  }

  bindTouch('btn-up', 'moveUp');
  bindTouch('btn-down', 'moveDown');
  bindTouch('btn-left', 'moveLeft');
  bindTouch('btn-right', 'moveRight');

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width * dpr));
    const h = Math.max(240, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function ensureShards() {
    if (Array.isArray(state.shards) && state.shards.length) return;
    state.shards = [];
    for (let i = 0; i < 12; i++) {
      state.shards.push({
        x: Math.random() * 0.9 + 0.05,
        y: Math.random() * 0.9 + 0.05,
        taken: false
      });
    }
  }
  ensureShards();

  function applySettings(next) {
    settings.reducedMotion = !!next.reducedMotion;
    settings.highContrast = !!next.highContrast;
    settings.sound = next.sound !== false;
    settings.touchControls = next.touchControls !== false;

    if (touchWrap) {
      const show = settings.touchControls && window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
      touchWrap.hidden = !show;
    }
  }

  function applyInputBindings(b) {
    if (!input || !b) return;
    try { input.setBindings(b); } catch {}
  }

  function getInputBindings() {
    try { return input ? input.getBindings() : null; } catch { return null; }
  }

  function applyState(bundleState) {
    if (!bundleState || typeof bundleState !== 'object') return;
    state.x = clamp(Number(bundleState.x ?? state.x), 0, 1);
    state.y = clamp(Number(bundleState.y ?? state.y), 0, 1);
    state.score = clamp(Number(bundleState.score ?? state.score), 0, 999999);

    if (Array.isArray(bundleState.shards)) {
      state.shards = bundleState.shards.map((s) => ({
        x: clamp(Number(s.x ?? 0.5), 0.02, 0.98),
        y: clamp(Number(s.y ?? 0.5), 0.02, 0.98),
        taken: !!s.taken
      }));
    }
    ensureShards();
  }

  function getState() {
    return {
      x: state.x,
      y: state.y,
      score: state.score,
      shards: Array.isArray(state.shards) ? state.shards : []
    };
  }

  const kit = window.TOA_GameKit && window.TOA_GameKit.initShell({
    gameId,
    version: '1.0.0',
    setPaused,
    isPaused: () => paused,
    applySettings,
    applyState,
    getState,
    applyInputBindings,
    getInputBindings
  });

  const btnResume = document.getElementById('btn-resume');
  const btnResumeInline = document.getElementById('btn-resume-inline');
  const onResume = (e) => { e.preventDefault(); kit?.resume?.(); };
  btnResume?.addEventListener('click', onResume);
  btnResumeInline?.addEventListener('click', onResume);

  setText('lab-meta-system', 'Save slots lab');
  setText('lab-meta-save', '3 slots + autosave');
  setText('lab-meta-access', 'Keyboard + touch + contrast');
  setText('lab-runtime-stat', 'Playable save validation');
  setText('lab-controls-stat', 'WASD / arrows / touch');

  try { canvas.tabIndex = 0; } catch {}
  canvas.addEventListener('focus', () => kit?.toast?.show?.('Canvas focused — collect shards and save into slots'));

  function axisFallback() {
    const right = (fallbackKeys.has('arrowright') || fallbackKeys.has('d')) ? 1 : 0;
    const left  = (fallbackKeys.has('arrowleft') || fallbackKeys.has('a')) ? 1 : 0;
    const down  = (fallbackKeys.has('arrowdown') || fallbackKeys.has('s')) ? 1 : 0;
    const up    = (fallbackKeys.has('arrowup') || fallbackKeys.has('w')) ? 1 : 0;
    return { x: right - left, y: down - up };
  }

  function axis() {
    if (input) {
      try { return input.getAxis(); } catch { return { x: 0, y: 0 }; }
    }
    return axisFallback();
  }

  function step() {
    if (!paused) {
      const a = axis();
      const speed = 0.006;
      state.x = clamp(state.x + a.x * speed, 0.03, 0.97);
      state.y = clamp(state.y + a.y * speed, 0.03, 0.97);

      // Collect shards
      for (const sh of state.shards) {
        if (sh.taken) continue;
        const dx = sh.x - state.x;
        const dy = sh.y - state.y;
        if ((dx * dx + dy * dy) < 0.0025) {
          sh.taken = true;
          state.score += 10;
        }
      }

      // Regenerate slowly when reduced motion is OFF (tiny life)
      if (!settings.reducedMotion && Math.random() < 0.002) {
        const empty = state.shards.find(s => s.taken);
        if (empty) {
          empty.taken = false;
          empty.x = Math.random() * 0.9 + 0.05;
          empty.y = Math.random() * 0.9 + 0.05;
        }
      }
    }

    draw();
    requestAnimationFrame(step);
  }

  function draw() {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    const hc = settings.highContrast;

    ctx.fillStyle = hc ? '#000' : '#07070a';
    ctx.fillRect(0, 0, w, h);

    // Shards
    for (const sh of state.shards) {
      if (sh.taken) continue;
      const x = sh.x * w;
      const y = sh.y * h;
      ctx.fillStyle = hc ? '#fff' : 'rgba(208, 167, 58, 0.95)';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, w * 0.006), 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    const px = state.x * w;
    const py = state.y * h;
    ctx.fillStyle = hc ? '#fff' : 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(px, py, Math.max(6, w * 0.009), 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = hc ? '#fff' : 'rgba(255,255,255,0.82)';
    ctx.font = '700 14px Montserrat, system-ui, sans-serif';
    ctx.fillText(paused ? 'PAUSED' : 'RUNNING', 12, 22);

    ctx.font = '600 14px Montserrat, system-ui, sans-serif';
    ctx.fillText('Score: ' + state.score, 12, 44);

    ctx.font = '500 12px Montserrat, system-ui, sans-serif';
    ctx.fillText('Settings → Save Slots to test persistence. Export/Import is per-slot.', 12, 64);
  }

  step();

  // cleanup
  window.addEventListener('beforeunload', () => { try { detachKeyboard && detachKeyboard(); } catch {} });
})();
