/* ToA Games — shared UI kit
   - Pause + Settings dialog
   - Focus management (trap + restore)
   - Local Save Slots + Autosave (IndexedDB)
   - Export/Import (JSON file) per-slot (portable)
   - Optional Input Bindings UI integration (TOA_Input)

   Design goals:
   - GitHub Pages safe (no secrets, no server calls)
   - CSP-safe (no inline handlers/styles)
   - Accessible (keyboard, focus trap, aria-live status)
   - Truthful (local-only storage; export/import is file-based)
*/
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const SAVE_STORE_SCHEMA = 2;
  const SLOT_IDS = ['1', '2', '3'];
  const AUTO_ID = 'auto';

  const prefersReducedMotion = () => {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch { return false; }
  };

  function safeIso() {
    try { return new Date().toISOString(); } catch { return ''; }
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function normStr(v) {
    return String(v ?? '').trim();
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3500);
  }

  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(r.error || new Error('File read failed'));
      r.readAsText(file);
    });
  }

  function trapFocus(container, initialFocusEl) {
    const focusables = () => $$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(el => el && !el.disabled && !el.getAttribute('aria-hidden'));

    function onKeyDown(e) {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === container) { e.preventDefault(); last.focus({ preventScroll: true }); }
      } else {
        if (active === last) { e.preventDefault(); first.focus({ preventScroll: true }); }
      }
    }

    container.addEventListener('keydown', onKeyDown);
    const init = initialFocusEl || focusables()[0] || container;
    try { init.focus({ preventScroll: true }); } catch {}

    return () => container.removeEventListener('keydown', onKeyDown);
  }

  function createToast() {
    const el = document.createElement('div');
    el.className = 'game-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    document.body.appendChild(el);

    let t = 0;
    return {
      show(msg, ms = 1800) {
        clearTimeout(t);
        el.textContent = String(msg || '');
        el.hidden = false;
        t = setTimeout(() => { el.hidden = true; }, ms);
      }
    };
  }

  function normalizeSettings(input) {
    const base = {
      reducedMotion: prefersReducedMotion(),
      highContrast: false,
      sound: true,
      touchControls: true,
      autosave: true
    };

    if (!input || typeof input !== 'object') return base;

    return {
      reducedMotion: !!input.reducedMotion,
      highContrast: !!input.highContrast,
      sound: input.sound !== false,
      touchControls: input.touchControls !== false,
      autosave: input.autosave !== false
    };
  }

  function applySettingsToDoc(settings) {
    document.documentElement.toggleAttribute('data-game-reduced-motion', !!settings.reducedMotion);
    document.body.setAttribute('data-game-contrast', settings.highContrast ? 'true' : 'false');
  }

  async function saveRaw(gameId, value) {
    if (!window.TOA_IDB) throw new Error('TOA_IDB missing');
    return window.TOA_IDB.set('game:' + gameId, value);
  }

  async function loadRaw(gameId) {
    if (!window.TOA_IDB) return null;
    return window.TOA_IDB.get('game:' + gameId);
  }

  function isLegacyBundle(obj, gameId) {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.gameId !== gameId) return false;
    if (!obj.meta || typeof obj.meta !== 'object') return false;
    return ('state' in obj);
  }

  function createEmptyStore(gameId) {
    const names = { '1': 'Slot 1', '2': 'Slot 2', '3': 'Slot 3' };
    return {
      schemaVersion: SAVE_STORE_SCHEMA,
      gameId,
      activeSlot: '1',
      slotNames: names,
      slots: {},
      updatedAt: safeIso()
    };
  }

  function normalizeSlotId(slotId) {
    const s = normStr(slotId);
    if (s === AUTO_ID) return AUTO_ID;
    if (SLOT_IDS.includes(s)) return s;
    return '1';
  }

  function validateSlotExport(obj, gameId) {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.exportType !== 'toa-save-slot') return false;
    if (obj.gameId !== gameId) return false;
    if (!obj.slotId) return false;
    if (!obj.bundle || typeof obj.bundle !== 'object') return false;
    return isLegacyBundle(obj.bundle, gameId);
  }

  function initShell(opts) {
    const gameId = normStr(opts?.gameId);
    if (!gameId) throw new Error('GameKit: missing gameId');

    const toast = createToast();

    const overlay = $('#game-overlay');
    const dialog = $('#game-dialog');
    const title = $('#game-dialog-title');
    const btnClose = $('#game-dialog-close');

    const btnPause = $('#btn-pause');
    const btnSettings = $('#btn-settings');
    const btnSave = $('#btn-save');
    const btnLoad = $('#btn-load');
    const btnExport = $('#btn-export');
    const btnImport = $('#btn-import');
    const fileImport = $('#file-import');

    const chkReduced = $('#chk-reduced');
    const chkContrast = $('#chk-contrast');
    const chkSound = $('#chk-sound');
    const chkTouch = $('#chk-touch');

    // Save slots UI (optional but required for platform builds that include it)
    const slotWrap = $('#toa-save-slots');
    const slotSelect = $('#save-slot-select');
    const slotName = $('#save-slot-name');
    const slotRename = $('#save-slot-rename');
    const slotSaveBtn = $('#save-slot-save');
    const slotLoadBtn = $('#save-slot-load');
    const slotExportBtn = $('#save-slot-export');
    const slotImportBtn = $('#save-slot-import');
    const autosaveLoadBtn = $('#save-slot-autosave-load');
    const chkAutosave = $('#chk-autosave');
    const slotStatus = $('#slot-status');
    const autosaveStatus = $('#autosave-status');

    // ---------- Wave H: Input bindings UI (optional) ----------
    const bindWrap = $('#toa-input-bindings');
    const bindStatus = $('#bind-status');
    const bindReset = $('#bind-reset');
    const bindKeyLabels = bindWrap ? $$('[data-bind-keys]', bindWrap) : [];
    const bindButtons = bindWrap ? $$('[data-bind-action]', bindWrap) : [];

    let currentBindings = null;
    let rebindingActive = false;
    let rebindingAction = null;
    let rebindingSlot = 0;

    const setBindStatus = (msg) => { if (bindStatus) bindStatus.textContent = String(msg || ''); };
    const hasInputLayer = () => !!(window.TOA_Input && typeof window.TOA_Input.loadBindings === 'function');

    const renderBindings = () => {
      if (!bindWrap || !currentBindings) return;
      for (const el of bindKeyLabels) {
        const action = el.getAttribute('data-bind-keys');
        if (!action) continue;
        const keys = Array.isArray(currentBindings[action]) ? currentBindings[action] : [];
        el.textContent = keys.length ? keys.join(' / ') : '—';
      }
    };

    async function loadAndApplyBindings() {
      if (!bindWrap) return null;
      if (!hasInputLayer()) { bindWrap.setAttribute('hidden', ''); return null; }

      try {
        currentBindings = await window.TOA_Input.loadBindings(gameId);
        try { opts?.applyInputBindings?.(currentBindings); } catch {}
        renderBindings();
        setBindStatus('Bindings loaded');
        return currentBindings;
      } catch {
        setBindStatus('Bindings unavailable');
        return null;
      }
    }

    async function saveAndApplyBindings(note) {
      if (!currentBindings || !hasInputLayer()) return;
      try { await window.TOA_Input.saveBindings(gameId, currentBindings); } catch {}
      try { opts?.applyInputBindings?.(currentBindings); } catch {}
      renderBindings();
      if (note) setBindStatus(note);
    }

    function beginRebind(action, slot) {
      if (!hasInputLayer()) return;
      const a = normStr(action);
      if (!a) return;

      rebindingActive = true;
      rebindingAction = a;
      rebindingSlot = clamp(Number(slot) || 0, 0, 1);

      setBindStatus('Press a key for ' + a + ' (' + (rebindingSlot === 0 ? 'primary' : 'secondary') + ')');
    }

    function endRebind() {
      rebindingActive = false;
      rebindingAction = null;
      rebindingSlot = 0;
    }

    function isModifierKey(k) {
      return k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta';
    }

    if (!overlay || !dialog) throw new Error('GameKit: missing dialog DOM');

    let open = false;
    let lastFocus = null;
    let untrap = null;

    function openDialog(label, focusEl) {
      if (open) return;
      open = true;
      lastFocus = (document.activeElement instanceof HTMLElement) ? document.activeElement : null;

      if (title) title.textContent = label || 'Menu';

      overlay.hidden = false;
      dialog.setAttribute('aria-hidden', 'false');
      untrap = trapFocus(dialog, focusEl || btnClose || null);

      try { document.body.classList.add('menu-open'); } catch {}
    }

    function closeDialog() {
      if (!open) return;
      open = false;

      overlay.hidden = true;
      dialog.setAttribute('aria-hidden', 'true');

      try { document.body.classList.remove('menu-open'); } catch {}

      if (untrap) { try { untrap(); } catch {} untrap = null; }

      if (lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch {} }
      lastFocus = null;
    }

    function setPaused(p) {
      try { opts?.setPaused?.(!!p); } catch {}
      try { document.body.toggleAttribute('data-game-paused', !!p); } catch {}
    }

    const setSlotStatus = (msg) => {
      if (slotStatus) slotStatus.textContent = String(msg || '');
    };

    const setAutosaveStatus = (msg) => {
      if (autosaveStatus) autosaveStatus.textContent = String(msg || '');
    };

    // ---------- Save store (slots + autosave) ----------
    let saveStore = createEmptyStore(gameId);

    function ensureSlotOptions() {
      if (!slotSelect) return;
      if (slotSelect.options && slotSelect.options.length >= 3) return;
      slotSelect.replaceChildren();
      for (const id of SLOT_IDS) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = saveStore.slotNames?.[id] || ('Slot ' + id);
        slotSelect.appendChild(opt);
      }
      // No auto in the select; autosave is separate.
    }

    function refreshSlotUi() {
      ensureSlotOptions();
      if (slotSelect) slotSelect.value = normalizeSlotId(saveStore.activeSlot);

      if (slotName && slotSelect) {
        const id = normalizeSlotId(slotSelect.value);
        slotName.value = String(saveStore.slotNames?.[id] || ('Slot ' + id));
      }

      // Update option labels to reflect renamed slots
      if (slotSelect) {
        for (const opt of Array.from(slotSelect.options)) {
          const id = normalizeSlotId(opt.value);
          opt.textContent = saveStore.slotNames?.[id] || ('Slot ' + id);
        }
      }

      if (chkAutosave) {
        // If we have a per-slot settings bundle, autosave toggles are reflected when loading that slot.
        // Default ON.
        if (typeof chkAutosave.checked !== 'boolean') chkAutosave.checked = true;
      }
    }

    async function loadStore() {
      const raw = await loadRaw(gameId);
      if (!raw) {
        saveStore = createEmptyStore(gameId);
        return saveStore;
      }

      // New store shape
      if (raw && typeof raw === 'object' && raw.schemaVersion >= 2 && raw.gameId === gameId && raw.slots && typeof raw.slots === 'object') {
        saveStore = {
          schemaVersion: SAVE_STORE_SCHEMA,
          gameId,
          activeSlot: normalizeSlotId(raw.activeSlot || '1'),
          slotNames: (raw.slotNames && typeof raw.slotNames === 'object') ? { ...raw.slotNames } : { '1': 'Slot 1', '2': 'Slot 2', '3': 'Slot 3' },
          slots: { ...raw.slots },
          updatedAt: raw.updatedAt || safeIso()
        };
        // Ensure required names exist
        for (const id of SLOT_IDS) {
          if (!saveStore.slotNames[id]) saveStore.slotNames[id] = 'Slot ' + id;
        }
        return saveStore;
      }

      // Legacy bundle migration (Wave E/H)
      if (isLegacyBundle(raw, gameId)) {
        const st = createEmptyStore(gameId);
        st.slots['1'] = raw;
        st.activeSlot = '1';
        st.updatedAt = safeIso();
        saveStore = st;
        await saveRaw(gameId, st);
        setSlotStatus('Migrated legacy save into Slot 1');
        return saveStore;
      }

      // Unknown shape: reset to empty but keep raw for safety? (No secrets; safe to overwrite)
      saveStore = createEmptyStore(gameId);
      return saveStore;
    }

    async function writeStore() {
      saveStore.updatedAt = safeIso();
      await saveRaw(gameId, saveStore);
      return saveStore;
    }

    function buildBundle(note) {
      const s = normalizeSettings({
        reducedMotion: !!(chkReduced && chkReduced.checked),
        highContrast: !!(chkContrast && chkContrast.checked),
        sound: !!(chkSound && chkSound.checked),
        touchControls: !!(chkTouch && chkTouch.checked),
        autosave: !!(chkAutosave ? chkAutosave.checked : true)
      });

      applySettingsToDoc(s);
      try { opts?.applySettings?.(s); } catch {}

      let state = null;
      try { state = opts?.getState?.() ?? null; } catch { state = null; }

      const bundle = {
        gameId,
        meta: {
          exportedAt: safeIso(),
          note: String(note || ''),
          version: String(opts?.version || '1.0.0')
        },
        settings: s,
        state
      };

      // Input bindings portability (Wave H)
      try {
        const b = (typeof opts?.getInputBindings === 'function') ? (opts.getInputBindings() ?? null) : currentBindings;
        if (b) bundle.inputBindings = b;
      } catch {}

      return bundle;
    }

    function getActiveSlotId() {
      if (slotSelect) return normalizeSlotId(slotSelect.value);
      return normalizeSlotId(saveStore.activeSlot || '1');
    }

    async function setActiveSlotId(slotId) {
      const s = normalizeSlotId(slotId);
      saveStore.activeSlot = s;
      await writeStore();
      refreshSlotUi();
      setSlotStatus('Active slot: ' + (saveStore.slotNames?.[s] || ('Slot ' + s)));
    }

    async function applyBundle(bundle, msg) {
      if (!bundle) return false;

      const s = normalizeSettings(bundle.settings);
      applySettingsToDoc(s);

      if (chkReduced) chkReduced.checked = s.reducedMotion;
      if (chkContrast) chkContrast.checked = s.highContrast;
      if (chkSound) chkSound.checked = s.sound;
      if (chkTouch) chkTouch.checked = s.touchControls;
      if (chkAutosave) chkAutosave.checked = s.autosave;

      try { opts?.applySettings?.(s); } catch {}
      try { opts?.applyState?.(bundle.state); } catch {}

      // Import input bindings (portable across devices)
      if (bundle.inputBindings && window.TOA_Input) {
        try {
          currentBindings = window.TOA_Input.normalizeBindings(bundle.inputBindings);
          await saveAndApplyBindings('Imported input bindings');
        } catch {}
      }

      if (msg) toast.show(msg);
      return true;
    }

    async function saveToSlot(slotId, note, quiet = false) {
      const id = normalizeSlotId(slotId);
      const bundle = buildBundle(note || ('save-slot-' + id));
      saveStore.slots[id] = bundle;
      await writeStore();
      if (!quiet) toast.show('Saved to ' + (id === AUTO_ID ? 'Autosave' : (saveStore.slotNames?.[id] || ('Slot ' + id))));
      setSlotStatus('Saved: ' + (id === AUTO_ID ? 'Autosave' : (saveStore.slotNames?.[id] || ('Slot ' + id))));
      return bundle;
    }

    async function loadFromSlot(slotId) {
      const id = normalizeSlotId(slotId);
      const bundle = saveStore.slots?.[id] || null;
      if (!bundle) {
        toast.show((id === AUTO_ID ? 'No autosave yet' : 'No save in slot'), 2200);
        return false;
      }
      await applyBundle(bundle, 'Loaded ' + (id === AUTO_ID ? 'Autosave' : (saveStore.slotNames?.[id] || ('Slot ' + id))));
      setSlotStatus('Loaded: ' + (id === AUTO_ID ? 'Autosave' : (saveStore.slotNames?.[id] || ('Slot ' + id))));
      return true;
    }

    async function exportSlot(slotId) {
      const id = normalizeSlotId(slotId);
      const bundle = saveStore.slots?.[id] || null;
      if (!bundle) { toast.show('Nothing to export', 2200); return; }

      const payload = {
        exportType: 'toa-save-slot',
        schemaVersion: 1,
        gameId,
        slotId: id,
        slotName: (id === AUTO_ID) ? 'Autosave' : (saveStore.slotNames?.[id] || ('Slot ' + id)),
        exportedAt: safeIso(),
        bundle
      };

      const fn = gameId + '__slot-' + id + '__' + safeIso().replace(/[:.]/g, '-') + '.json';
      downloadText(fn, JSON.stringify(payload, null, 2));
      toast.show('Exported ' + ((id === AUTO_ID) ? 'Autosave' : 'Slot ' + id));
    }

    async function importSlot(file, targetSlotId) {
      const raw = await readFileText(file);
      const obj = JSON.parse(raw);

      const target = normalizeSlotId(targetSlotId);

      // Accept either a slot export payload OR a legacy bundle export and import into the target slot.
      if (validateSlotExport(obj, gameId)) {
        const incoming = normalizeSlotId(obj.slotId);
        const bundle = obj.bundle;
        const into = target || incoming;

        saveStore.slots[into] = bundle;
        if (into !== AUTO_ID) {
          // Bring slot name across if provided
          const name = normStr(obj.slotName);
          if (name) saveStore.slotNames[into] = name;
        }

        await writeStore();
        refreshSlotUi();
        await applyBundle(bundle, 'Imported + loaded');
        setSlotStatus('Imported into ' + (into === AUTO_ID ? 'Autosave' : (saveStore.slotNames?.[into] || ('Slot ' + into))));
        return true;
      }

      // Legacy bundle import
      if (isLegacyBundle(obj, gameId)) {
        saveStore.slots[target] = obj;
        await writeStore();
        refreshSlotUi();
        await applyBundle(obj, 'Imported + loaded');
        setSlotStatus('Imported into ' + (target === AUTO_ID ? 'Autosave' : (saveStore.slotNames?.[target] || ('Slot ' + target))));
        return true;
      }

      toast.show('Import rejected (wrong game or invalid file)', 2600);
      return false;
    }

    // Autosave loop
    let autosaveTimer = 0;
    function clearAutosave() {
      if (autosaveTimer) {
        clearInterval(autosaveTimer);
        autosaveTimer = 0;
      }
    }

    function startAutosave() {
      clearAutosave();
      autosaveTimer = setInterval(async () => {
        try {
          if (document.hidden) return;
          if (open) return; // don't autosave while menu is open
          if (typeof opts?.isPaused === 'function' && opts.isPaused()) return;

          const active = getActiveSlotId();
          const s = normalizeSettings({
            reducedMotion: !!(chkReduced && chkReduced.checked),
            highContrast: !!(chkContrast && chkContrast.checked),
            sound: !!(chkSound && chkSound.checked),
            touchControls: !!(chkTouch && chkTouch.checked),
            autosave: !!(chkAutosave ? chkAutosave.checked : true)
          });
          if (!s.autosave) return;

          await saveToSlot(AUTO_ID, 'autosave', true);
          // Also keep the active slot updated lightly (but do not spam)
          // Active slot autosave is optional; keep it as explicit manual save to avoid surprises.
          setAutosaveStatus('Autosaved at ' + safeIso().slice(11, 19) + 'Z');
        } catch {
          // silent
        }
      }, 30000);
    }

    // ---------- Events wiring ----------

    // Input binding rebind buttons
    if (bindButtons && bindButtons.length) {
      for (const btn of bindButtons) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const action = btn.getAttribute('data-bind-action');
          const slot = btn.getAttribute('data-bind-slot');
          beginRebind(action, slot);
        });
      }
    }

    bindReset?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!window.TOA_Input) return;
      currentBindings = window.TOA_Input.normalizeBindings(window.TOA_Input.DEFAULT_BINDINGS);
      await saveAndApplyBindings('Bindings reset to defaults');
    });

    // Slot UI
    slotSelect?.addEventListener('change', async () => {
      const id = normalizeSlotId(slotSelect.value);
      await setActiveSlotId(id);
      refreshSlotUi();
    });

    slotRename?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!slotSelect || !slotName) return;
      const id = normalizeSlotId(slotSelect.value);
      const name = normStr(slotName.value);
      if (!name) { toast.show('Name required', 1800); return; }
      saveStore.slotNames[id] = name.slice(0, 48);
      await writeStore();
      refreshSlotUi();
      setSlotStatus('Renamed slot');
    });

    slotSaveBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = getActiveSlotId();
      try { await saveToSlot(id, 'manual-save'); } catch { toast.show('Save failed', 2400); }
    });

    slotLoadBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = getActiveSlotId();
      try { await loadFromSlot(id); } catch { toast.show('Load failed', 2400); }
    });

    slotExportBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = getActiveSlotId();
      try { await exportSlot(id); } catch { toast.show('Export failed', 2400); }
    });

    slotImportBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!fileImport) return;
      // Mark intent: import into active slot
      fileImport.setAttribute('data-import-target-slot', getActiveSlotId());
      fileImport.click();
    });

    autosaveLoadBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await loadFromSlot(AUTO_ID); } catch { toast.show('Load failed', 2400); }
    });

    chkAutosave?.addEventListener('change', async () => {
      // Persist autosave preference into the active slot bundle (settings are stored per slot)
      try { await saveToSlot(getActiveSlotId(), 'settings-change', true); } catch {}
      setAutosaveStatus((chkAutosave.checked ? 'Autosave enabled' : 'Autosave disabled'));
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });

    document.addEventListener('keydown', (e) => {
      // Capture a key when rebinding
      if (rebindingActive && window.TOA_Input) {
        const k = String(e.key || '');
        if (k && k !== 'Tab' && !isModifierKey(k)) {
          e.preventDefault();
          e.stopPropagation();

          if (!currentBindings) currentBindings = window.TOA_Input.normalizeBindings(null);

          const act = String(rebindingAction || '').trim();
          const slot = clamp(Number(rebindingSlot) || 0, 0, 1);

          const list = Array.isArray(currentBindings[act]) ? currentBindings[act].slice() : [];
          while (list.length < 2) list.push('');
          list[slot] = k;

          // De-dup + trim
          const next = [];
          for (const v of list) {
            const vv = String(v || '').trim();
            if (!vv) continue;
            if (!next.includes(vv)) next.push(vv);
          }
          currentBindings[act] = next;

          endRebind();
          saveAndApplyBindings('Bound ' + act + ' to ' + k);
          return;
        }
      }

      if (e.key === 'Escape' && open) { e.preventDefault(); closeDialog(); return; }
      if (e.key === 'Escape' && !open) { e.preventDefault(); setPaused(true); openDialog('Paused', btnClose || null); }
    });

    btnClose?.addEventListener('click', (e) => { e.preventDefault(); closeDialog(); });

    btnPause?.addEventListener('click', (e) => { e.preventDefault(); setPaused(true); openDialog('Paused', btnClose || null); });

    btnSettings?.addEventListener('click', (e) => {
      e.preventDefault();
      if (open) closeDialog(); else openDialog('Settings', chkReduced || btnClose || null);
    });

    // Top bar actions now operate on active slot
    btnSave?.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = getActiveSlotId();
      try { await saveToSlot(id, 'manual-save'); } catch { toast.show('Save failed', 2400); }
    });

    btnLoad?.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = getActiveSlotId();
      try { await loadFromSlot(id); } catch { toast.show('Load failed', 2400); }
    });

    btnExport?.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = getActiveSlotId();
      try { await exportSlot(id); } catch { toast.show('Export failed', 2400); }
    });

    btnImport?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!fileImport) return;
      fileImport.setAttribute('data-import-target-slot', getActiveSlotId());
      fileImport.click();
    });

    fileImport?.addEventListener('change', async () => {
      const f = fileImport.files && fileImport.files[0];
      if (!f) return;
      const target = normalizeSlotId(fileImport.getAttribute('data-import-target-slot') || getActiveSlotId());
      try {
        await importSlot(f, target);
      } catch {
        toast.show('Import failed', 2400);
      } finally {
        fileImport.value = '';
        fileImport.removeAttribute('data-import-target-slot');
      }
    });

    // Persist settings changes into the active slot
    const onSetting = async () => {
      try {
        await saveToSlot(getActiveSlotId(), 'settings-change', true);
      } catch {}
    };
    [chkReduced, chkContrast, chkSound, chkTouch].forEach((el) => el && el.addEventListener('change', onSetting));

    // Initial
    (async () => {
      try {
        await loadStore();
        refreshSlotUi();

        // Hydrate from active slot if present
        const active = normalizeSlotId(saveStore.activeSlot || '1');
        if (saveStore.slots && saveStore.slots[active]) {
          await applyBundle(saveStore.slots[active], 'Loaded ' + (saveStore.slotNames?.[active] || ('Slot ' + active)));
        }

        // If no active slot save exists, but autosave exists, keep it available
        if (saveStore.slots && saveStore.slots[AUTO_ID]) {
          setAutosaveStatus('Autosave available');
        }

      } catch {
        // ignore
      }

      try { await loadAndApplyBindings(); } catch {}

      // Start autosave loop
      try { startAutosave(); } catch {}
    })();

    return Object.freeze({
      toast,
      closeDialog,
      openSettings: () => openDialog('Settings', chkReduced || null),
      openPause: () => { setPaused(true); openDialog('Paused', btnClose || null); },
      resume: () => { setPaused(false); closeDialog(); }
    });
  }

  window.TOA_GameKit = Object.freeze({ initShell });
})();