/* ToA Games — shared input layer
   - Keyboard + pointer hooks (via setAction) + optional gamepad (polled)
   - Configurable bindings persisted locally (IndexedDB via TOA_IDB)
   - No external deps, no inline handlers, CSP-safe
*/
(function () {
  'use strict';

  const hasIDB = () => !!(window.TOA_IDB && typeof window.TOA_IDB.get === 'function' && typeof window.TOA_IDB.set === 'function');

  const DEFAULT_BINDINGS = Object.freeze({
    moveUp:    ['ArrowUp', 'w', 'W'],
    moveDown:  ['ArrowDown', 's', 'S'],
    moveLeft:  ['ArrowLeft', 'a', 'A'],
    moveRight: ['ArrowRight', 'd', 'D'],
    pause:     ['Escape']
  });

  const ACTIONS = Object.freeze(Object.keys(DEFAULT_BINDINGS));

  const normalizeKey = (k) => String(k || '').trim();

  function normalizeBindings(input) {
    const out = {};
    const src = (input && typeof input === 'object') ? input : {};
    for (const a of ACTIONS) {
      const raw = Array.isArray(src[a]) ? src[a] : DEFAULT_BINDINGS[a];
      const list = [];
      for (const v of raw) {
        const k = normalizeKey(v);
        if (!k) continue;
        if (!list.includes(k)) list.push(k);
      }
      out[a] = list.length ? list : DEFAULT_BINDINGS[a].slice();
    }
    return out;
  }

  async function loadBindings(gameId) {
    const id = String(gameId || '').trim();
    if (!id || !hasIDB()) return normalizeBindings(null);

    const key = 'input:' + id;
    const saved = await window.TOA_IDB.get(key);
    return normalizeBindings(saved);
  }

  async function saveBindings(gameId, bindings) {
    const id = String(gameId || '').trim();
    if (!id || !hasIDB()) return;
    const key = 'input:' + id;
    await window.TOA_IDB.set(key, normalizeBindings(bindings));
  }

  function isTypingTarget(t) {
    if (!t) return false;
    const tag = String(t.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
  }

  function createInstance(opts) {
    const gameId = String(opts?.gameId || '').trim();
    if (!gameId) throw new Error('TOA_Input: missing gameId');

    let bindings = normalizeBindings(opts?.bindings || null);

    const pressedKeys = new Set();
    const actionDown = Object.create(null);
    for (const a of ACTIONS) actionDown[a] = false;

    // direct action overrides (touch buttons etc.)
    const directDown = Object.create(null);
    for (const a of ACTIONS) directDown[a] = false;

    // gamepad
    let gamepadEnabled = true;

    function setBindings(next) {
      bindings = normalizeBindings(next);
    }

    function getBindings() {
      // return a deep-ish copy to avoid external mutation
      const out = {};
      for (const a of ACTIONS) out[a] = bindings[a].slice();
      return out;
    }

    function keyMatchesAction(key, action) {
      const list = bindings[action] || [];
      return list.includes(key);
    }

    function recomputeActions() {
      for (const a of ACTIONS) {
        let down = !!directDown[a];
        if (!down) {
          for (const k of pressedKeys) {
            if (keyMatchesAction(k, a)) { down = true; break; }
          }
        }
        actionDown[a] = down;
      }
    }

    function setAction(action, down) {
      if (!ACTIONS.includes(action)) return;
      directDown[action] = !!down;
      recomputeActions();
    }

    function handleKeyDown(e) {
      if (!e) return;
      if (isTypingTarget(e.target)) return;

      const k = normalizeKey(e.key);
      if (!k) return;

      // Only prevent default when the key is bound to an action to avoid hijacking random keys.
      let isBound = false;
      for (const a of ACTIONS) {
        if (keyMatchesAction(k, a)) { isBound = true; break; }
      }
      if (!isBound) return;

      e.preventDefault();
      pressedKeys.add(k);
      recomputeActions();
    }

    function handleKeyUp(e) {
      if (!e) return;
      const k = normalizeKey(e.key);
      if (!k) return;
      if (pressedKeys.has(k)) {
        e.preventDefault();
        pressedKeys.delete(k);
        recomputeActions();
      }
    }

    function attachKeyboard(target = document) {
      target.addEventListener('keydown', handleKeyDown, { passive: false });
      target.addEventListener('keyup', handleKeyUp, { passive: false });
      return () => {
        target.removeEventListener('keydown', handleKeyDown);
        target.removeEventListener('keyup', handleKeyUp);
      };
    }

    function getAxisFromActions() {
      const x = (actionDown.moveRight ? 1 : 0) - (actionDown.moveLeft ? 1 : 0);
      const y = (actionDown.moveDown ? 1 : 0) - (actionDown.moveUp ? 1 : 0);
      return { x, y };
    }

    function pollGamepadAxis() {
      if (!gamepadEnabled) return { x: 0, y: 0 };
      if (!('getGamepads' in navigator)) return { x: 0, y: 0 };

      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = pads && pads[0];
      if (!gp) return { x: 0, y: 0 };

      const ax0 = Number(gp.axes && gp.axes[0] != null ? gp.axes[0] : 0);
      const ax1 = Number(gp.axes && gp.axes[1] != null ? gp.axes[1] : 0);

      // deadzone
      const dz = 0.18;
      const x = Math.abs(ax0) < dz ? 0 : ax0;
      const y = Math.abs(ax1) < dz ? 0 : ax1;

      return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    }

    function getAxis() {
      // blend keyboard/touch discrete axis with gamepad analog axis
      const a = getAxisFromActions();
      const g = pollGamepadAxis();

      const x = (a.x !== 0) ? a.x : g.x;
      const y = (a.y !== 0) ? a.y : g.y;

      return { x, y };
    }

    function enableGamepad(on) {
      gamepadEnabled = !!on;
    }

    // initial compute
    recomputeActions();

    return Object.freeze({
      gameId,
      ACTIONS,
      DEFAULT_BINDINGS,
      attachKeyboard,
      setBindings,
      getBindings,
      setAction,
      getAxis,
      isDown: (action) => !!actionDown[action],
      enableGamepad
    });
  }

  window.TOA_Input = Object.freeze({
    ACTIONS,
    DEFAULT_BINDINGS,
    normalizeBindings,
    loadBindings,
    saveBindings,
    create: createInstance
  });
})();