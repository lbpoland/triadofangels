/* ToA Games — Foundation Demo (Wave H: shared input layer)
   - Uses TOA_Input for configurable bindings (keyboard + touch + optional gamepad)
   - Minimal starfield (disabled when reduced motion is enabled)
   - Uses TOA_GameKit for pause/settings/save/export/import
*/
(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const state = { x: 0.5, y: 0.5, vx: 0, vy: 0, heading: 0, ticks: 0 };

  const settings = { reducedMotion: false, highContrast: false, sound: true, touchControls: true };

  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };

  let paused = false;
  function setPaused(p) { paused = !!p; }

  // ---------- Shared Input Layer ----------
  const gameId = 'toa-foundation-demo';

  // Fallback keyboard state if TOA_Input isn't present
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

  // Touch controls (use input.setAction)
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

  // ---------- Responsive Canvas ----------
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

  // ---------- Starfield ----------
  const stars = [];
  function initStars() {
    stars.length = 0;
    const n = 120;
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.2, s: Math.random() * 0.25 + 0.05 });
    }
  }
  initStars();

  // ---------- Settings Hooks ----------
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
    state.vx = clamp(Number(bundleState.vx ?? 0), -2, 2);
    state.vy = clamp(Number(bundleState.vy ?? 0), -2, 2);
    state.heading = Number(bundleState.heading ?? 0);
    state.ticks = Number(bundleState.ticks ?? 0);
  }

  function getState() {
    return { x: state.x, y: state.y, vx: state.vx, vy: state.vy, heading: state.heading, ticks: state.ticks };
  }

  const kit = window.TOA_GameKit && window.TOA_GameKit.initShell({
    gameId,
    version: '1.1.0',
    setPaused,
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

  setText('foundation-meta-system', 'UI shell + input kit');
  setText('foundation-meta-save', 'Slots + export/import');
  setText('foundation-meta-access', 'Keyboard + touch + contrast');
  setText('foundation-runtime-stat', 'Playable foundation runtime');
  setText('foundation-controls-stat', 'WASD / arrows / touch');

  // Canvas focusability for keyboard users
  try { canvas.tabIndex = 0; } catch {}
  canvas.addEventListener('focus', () => kit?.toast?.show?.('Canvas focused — use bindings to move'));

  function fallbackAxis() {
    const right = (fallbackKeys.has('arrowright') || fallbackKeys.has('d')) ? 1 : 0;
    const left  = (fallbackKeys.has('arrowleft') || fallbackKeys.has('a')) ? 1 : 0;
    const down  = (fallbackKeys.has('arrowdown') || fallbackKeys.has('s')) ? 1 : 0;
    const up    = (fallbackKeys.has('arrowup') || fallbackKeys.has('w')) ? 1 : 0;
    return { x: right - left, y: down - up };
  }

  function step() {
    if (!paused) {
      const axis = input ? input.getAxis() : fallbackAxis();
      const ax = clamp(Number(axis.x || 0), -1, 1);
      const ay = clamp(Number(axis.y || 0), -1, 1);

      const accel = 0.0035;
      state.vx = clamp(state.vx + ax * accel, -0.02, 0.02);
      state.vy = clamp(state.vy + ay * accel, -0.02, 0.02);

      state.vx *= 0.98;
      state.vy *= 0.98;

      state.x = clamp(state.x + state.vx, 0.02, 0.98);
      state.y = clamp(state.y + state.vy, 0.02, 0.98);

      if (Math.abs(state.vx) + Math.abs(state.vy) > 0.0003) {
        state.heading = Math.atan2(state.vy, state.vx);
      }

      state.ticks += 1;

      if (!settings.reducedMotion) {
        for (const st of stars) {
          st.y += st.s * 0.0018;
          if (st.y > 1) st.y = 0;
        }
      }
    }

    draw();
    requestAnimationFrame(step);
  }

  function drawShip(cx, cy, ang, scale, hc) {
    const r = scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);

    ctx.beginPath();
    ctx.moveTo(r * 1.25, 0);
    ctx.lineTo(-r * 0.9, r * 0.75);
    ctx.lineTo(-r * 0.65, 0);
    ctx.lineTo(-r * 0.9, -r * 0.75);
    ctx.closePath();

    ctx.fillStyle = hc ? '#f6f7ff' : 'rgba(208, 167, 58, 0.92)';
    ctx.strokeStyle = hc ? '#111' : 'rgba(0,0,0,0.75)';
    ctx.lineWidth = Math.max(1, r * 0.12);

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    const hc = settings.highContrast;

    ctx.fillStyle = hc ? '#000' : '#07070a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = hc ? '#fff' : 'rgba(255,255,255,0.75)';
    for (const st of stars) {
      const x = st.x * w;
      const y = st.y * h;
      const r = st.r * (hc ? 1.25 : 1.0);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawShip(state.x * w, state.y * h, state.heading, Math.max(10, Math.min(22, w * 0.02)), hc);

    ctx.fillStyle = hc ? '#fff' : 'rgba(255,255,255,0.82)';
    ctx.font = '600 14px Montserrat, system-ui, sans-serif';
    ctx.fillText(paused ? 'PAUSED' : 'RUNNING', 12, 22);

    ctx.font = '500 12px Montserrat, system-ui, sans-serif';
    ctx.fillText('Rebind in Settings • Save/Export/Import available • ESC pauses', 12, 42);
  }

  step();

  // Cleanup on unload
  window.addEventListener('beforeunload', () => { try { detachKeyboard && detachKeyboard(); } catch {} });
})();
