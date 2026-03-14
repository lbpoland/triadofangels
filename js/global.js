// Enable smooth scrolling only when users have not requested reduced motion.
const prefersReducedMotion = () => {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

if (!prefersReducedMotion()) {
  document.documentElement.classList.add('no-reduced-motion');
}


// =========================
// Wave MW-AB — Performance Tier Detection (Perf Wave #3)
// Purpose:
// - Gate expensive visual effects (blur / multi-layer gradients) on constrained devices.
// - Uses privacy-safe, local-only signals (no network calls, no tracking).
// Output:
// - Adds data-perf="low" or data-perf="high" on <html>.
// =========================
(function initPerfTier() {
  try {
    const root = document.documentElement;
    const nav = navigator || {};
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const saveData = Boolean(conn && conn.saveData);
    const effectiveType = conn && conn.effectiveType ? String(conn.effectiveType) : '';
    const deviceMemory = Number(nav.deviceMemory || 0);
    const cores = Number(nav.hardwareConcurrency || 0);

    const low =
      saveData ||
      (effectiveType && /(slow-2g|2g)/i.test(effectiveType)) ||
      (deviceMemory && deviceMemory <= 2) ||
      (cores && cores > 0 && cores <= 4);

    root.setAttribute('data-perf', low ? 'low' : 'high');
  } catch {
    /* ignore */
  }
})();


// =========================
// THEME SYSTEM (ToA / Dark / Light + automatic High-Contrast support)
// =========================
const THEME_STORAGE_KEY = 'toa-theme';

// Visible themes (menu): toa, dark, light
// Hidden compatibility theme: contrast (kept for forced-colors / prefers-contrast and existing stored values)
const VALID_THEMES = new Set(['toa', 'dark', 'light', 'contrast']);
const PERSISTABLE_THEMES = new Set(['toa', 'dark', 'light']);

function getSystemTheme() {
  // Brand-first: default to ToA on first visit. Users can switch and we persist their choice.
  return 'toa';
}

function prefersHighContrast() {
  try {
    return (window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches) ||
           (window.matchMedia && window.matchMedia('(forced-colors: active)').matches);
  } catch {
    return false;
  }
}

function getSavedTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    // Legacy compatibility: previously stored 'contrast' values should behave like 'dark' when persisted.
    if (v === 'contrast') return 'dark';
    return PERSISTABLE_THEMES.has(v) ? v : null;
  } catch {
    return null;
  }
}

function applyThemeToDOM(theme) {
  const t = VALID_THEMES.has(theme) ? theme : 'toa';
  document.documentElement.setAttribute('data-theme', t);
  // Mirror on body for CSS selectors that target body[data-theme].
  try { if (document.body) document.body.setAttribute('data-theme', t); } catch {}
  // Keep mobile browser UI (address bar) aligned with the active theme.
  try {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const map = { toa: '#0b0c10', dark: '#0b0c10', light: '#f7f8fb', contrast: '#000000' };
      meta.setAttribute('content', map[t] || '#0b0c10');
    }
  } catch {}
  // Notify UI components (theme menu, etc.).
  try { window.dispatchEvent(new CustomEvent('toa:themechange', { detail: { theme: t } })); } catch {}
  return t;
}

function getEffectiveTheme(savedTheme) {
  if (prefersHighContrast()) return 'contrast';
  return PERSISTABLE_THEMES.has(savedTheme) ? savedTheme : 'toa';
}

// Apply theme ASAP (best-effort) to reduce flash.
let savedTheme = getSavedTheme() || getSystemTheme();
applyThemeToDOM(getEffectiveTheme(savedTheme));

// Re-apply the effective theme when system contrast / forced-colors settings change.
(function setupContrastListeners(){
  try {
    const mqForced = window.matchMedia && window.matchMedia('(forced-colors: active)');
    const mqMore = window.matchMedia && window.matchMedia('(prefers-contrast: more)');
    const onChange = () => applyThemeToDOM(getEffectiveTheme(savedTheme));

    [mqForced, mqMore].forEach((mq) => {
      if (!mq) return;
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    });
  } catch { /* ignore */ }
})();

document.addEventListener('DOMContentLoaded', function() {

  // =========================
  // A11Y — Skip link focus fix (Wave MW-AB)
  // - Ensures keyboard focus lands on the skip destination (main landmark)
  // - Requires tabindex=-1 on #main-content (applied site-wide)
  // =========================
  (function skipLinkFocusFix(){
  // Delegated handler: avoids per-link listeners across 275+ pages.
  // Focus is moved *after* navigation to the in-page anchor.
  try {
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const a = t.closest('a.skip-link[href^="#"]');
      if (!a) return;

      const href = a.getAttribute('href') || '';
      const id = href.startsWith('#') ? href.slice(1) : '';
      if (!id) return;

      const target = document.getElementById(id);
      if (!(target instanceof HTMLElement)) return;

      // Let the browser perform the anchor jump first, then focus.
      setTimeout(() => {
        try { target.focus({ preventScroll: true }); } catch {}
      }, 0);
    }, { passive: true });
  } catch {}
})();
// =========================
// =========================
// Wave AM — SMART ANCHOR SCROLL + FOCUS (JumpNav + in-page anchors)
// =========================
// Upgrades in-page navigation:
// - Smooth scroll only when reduced motion is NOT requested.
// - Moves focus to the destination heading/section for screen-reader + keyboard continuity.
// - Updates the hash via history (keeps :target styling and back/forward correctness).
(function initSmartAnchorScrollAndFocus() {
  const SAFE_ID = /^[A-Za-z][A-Za-z0-9\-\_\:\.]*$/;

  const safeIdFromHref = (href) => {
    const h = String(href || '');
    if (!h.startsWith('#')) return '';
    const id = h.slice(1).trim();
    if (!id || id === '#') return '';
    return SAFE_ID.test(id) ? id : '';
  };

  const isFocusable = (el) => {
    if (!(el instanceof HTMLElement)) return false;
    const name = (el.tagName || '').toLowerCase();
    if (name === 'a' || name === 'button' || name === 'input' || name === 'select' || name === 'textarea') return true;
    if (el.hasAttribute('tabindex')) return true;
    return false;
  };

  const focusTarget = (target) => {
    if (!(target instanceof HTMLElement)) return;

    // Prefer focusing a heading inside the target (keeps semantics strong).
    const heading = target.matches('h1,h2,h3,h4,h5,h6') ? target : target.querySelector('h1,h2,h3,h4,h5,h6');
    const el = (heading instanceof HTMLElement) ? heading : target;

    // Ensure focusable without permanently changing tab order.
    const needsTabindex = !isFocusable(el);
    if (needsTabindex) {
      el.setAttribute('tabindex', '-1');
      el.dataset.toaTempTabindex = '1';
      el.addEventListener('blur', () => {
        try {
          if (el.dataset.toaTempTabindex === '1') {
            el.removeAttribute('tabindex');
            delete el.dataset.toaTempTabindex;
          }
        } catch {}
      }, { once: true });
    }

    try { el.focus({ preventScroll: true }); } catch { try { el.focus(); } catch {} }
  };

  const scrollToTarget = (target) => {
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    try {
      target.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
    } catch {
      // Fallback for older browsers.
      try {
        const top = target.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top, behavior });
      } catch {}
    }
  };

  // Delegate: only upgrade anchors that live in in-page navigation surfaces.
  const isEnhancedSurface = (a) => {
    if (!(a instanceof HTMLAnchorElement)) return false;
    return Boolean(
      a.closest('.page-hero__actions')
    );
  };

  document.addEventListener('click', (e) => {
    const t = e.target;
    const a = t && (t instanceof Element) ? t.closest('a[href^="#"]') : null;
    if (!a || !(a instanceof HTMLAnchorElement)) return;
    if (!isEnhancedSurface(a)) return;

    const id = safeIdFromHref(a.getAttribute('href'));
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    // Preserve modifier behavior (new tab/window) and non-left clicks.
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();

    // Update the hash without letting the browser perform an abrupt jump.
    try { history.pushState(null, '', `#${id}`); } catch { try { window.location.hash = id; } catch {} }

    scrollToTarget(target);

    // Focus after scroll start so SR users get a stable reading position.
    window.setTimeout(() => focusTarget(target), prefersReducedMotion() ? 0 : 180);
  }, { passive: false });

  // When arriving on a deep link, gently focus the destination for a11y continuity.
  const bootHash = () => {
    const id = safeIdFromHref(window.location.hash || '');
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    window.setTimeout(() => focusTarget(target), 0);
  };

  bootHash();
  window.addEventListener('hashchange', bootHash, { passive: true });
})();
// =========================
// NAV SEARCH KEYBOARD SHORTCUT (Ctrl/Cmd+K)
// =========================
(function setupNavSearchShortcut(){
  document.addEventListener('keydown', (e) => {
    const key = String(e.key || '').toLowerCase();
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || '');
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (!mod || key !== 'k') return;

    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (typing) return;

    e.preventDefault();
    window.location.href = '/search/';
  }, { passive: false });
})();

  // =========================
  // ICON BADGES (Pillar + Deck icons via WebP)
  // =========================
  // Replaces glyph icons in Pillar / Deck cards with ToA-branded WebP icons when available.
  (function setupIconBadges() {
    const mapHrefToIcon = (href) => {
      const h = String(href || '').toLowerCase();
      if (h.startsWith('/games')) return 'games';
      if (h.startsWith('/music') || h.startsWith('/lyrics') || h.startsWith('/streaming')) return 'music';
      if (h.startsWith('/publishing') || h.startsWith('/book')) return 'publishing';
      if (h.startsWith('/apps')) return 'apps';
      if (h.startsWith('/digital-store') || h.startsWith('/merch')) return 'store';
      return '';
    };

    const swapSpan = (span, icon) => {
      if (!span || !icon) return;
      // If already has an <img>, do nothing
      if (span.querySelector && span.querySelector('img')) return;

      const img = document.createElement('img');
      img.src = `/assets/images/icons/pillar-${icon}.webp`;
      img.width = 24;
      img.height = 24;
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';

      span.textContent = '';
      span.appendChild(img);
      span.dataset.icon = icon;
    };

    const pillars = Array.from(document.querySelectorAll('.pillar-card'));
    for (const a of pillars) {
      const span = a.querySelector('.pillar-card__icon');
      const icon = mapHrefToIcon(a.getAttribute('href'));
      swapSpan(span, icon);
    }

    const decks = Array.from(document.querySelectorAll('.deck-card'));
    for (const a of decks) {
      const span = a.querySelector('.deck-card__icon');
      const icon = mapHrefToIcon(a.getAttribute('href'));
      swapSpan(span, icon);
    }
  })();

// =========================
// Wave L — MICRO-MOTION REVEALS (reduced-motion safe)
// =========================
(function initRevealMotion() {
  if (!document.documentElement.classList.contains('no-reduced-motion')) return;
  if (String(document.documentElement.getAttribute('data-perf') || '') === 'low') return;

  const selectors = [
    '.page-hero__inner',
    '.search-hero',
    '.album-hero__meta',
    '.track-hero__meta',
    '.book-hero__meta',
    '.product-block',
    '.album-card',
    '.album-block',
    '.stream-card',
    '.faq-item',
    '.notice'
  ];

  const targets = new Set();

  // Include any elements that already declare data-reveal in markup.
  // Without this, sections like the Command Strip / Home decks can remain hidden on pages
  // where theme-bootstrap enables no-reduced-motion before JS runs.
  document.querySelectorAll('[data-reveal]').forEach((el) => targets.add(el));

  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach((el) => targets.add(el));
  }

  targets.forEach((el) => {
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'up');
  });

  const markVisible = (el) => {
    try { el.classList.add('is-visible'); } catch {}
  };

  // If IO is unavailable, reveal immediately.
  if (!('IntersectionObserver' in window)) {
    targets.forEach(markVisible);
    return;
  }

  // Ensure above-the-fold content is visible immediately (prevents any perceived “blank hero”).
  const fold = window.innerHeight ? window.innerHeight * 0.92 : 800;
  targets.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < fold) markVisible(el);
  });

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      markVisible(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

  targets.forEach((el) => io.observe(el));
})();


  // Ensure body has the active theme attribute (some pages rely on body selectors).
  try {
    const t = document.documentElement.getAttribute('data-theme') || 'toa';
    document.body.setAttribute('data-theme', t);
  } catch {}

  // Safe closest helper (prevents "closest is not a function" console errors when target is not an Element)
  function closestFromEventTarget(evt, selector) {
    const t = evt && evt.target;
    return (t instanceof Element) ? t.closest(selector) : null;
  }


  
  // =========================
  // A11Y NAME NORMALIZATION (label-content-name-mismatch)
  // =========================
  // Ensures that if an element has visible label text AND an aria-label, the aria-label contains the visible text.
  // This prevents Lighthouse "label-content-name-mismatch" without reducing accessibility quality.
  (function normalizeAriaLabelContentName() {
const isGlyphOnly = (s) => {
  const t = (s || '').replace(/\s+/g, '');
  if (!t) return true;

  return /^[\u00AB\u00BB\u2039\u203A\u2190-\u2193\u25B2-\u25BC\u25C0\u25D0\u25D1\u2630\u2600\u263E\u25CF\u25CB]+$/u.test(t);
};

    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

    const fixNode = (el) => {
      if (!(el instanceof Element)) return;
      if (el.hasAttribute('contenteditable')) return;
      const aria = el.getAttribute('aria-label');
      if (!aria) return;
      const visible = norm(el.textContent || '');
      if (!visible) return;
      if (isGlyphOnly(visible)) return;

      const a = norm(aria);
      const v = visible.toLowerCase();
      if (a.toLowerCase().includes(v)) return;

      // Preserve original aria context while ensuring visible label is contained
      const next = `${visible} — ${a}`.slice(0, 160);
      el.setAttribute('aria-label', next);
    };

    const scan = (root = document) => {
      root.querySelectorAll('[aria-label]').forEach(fixNode);
    };

    // Initial scan
    try { scan(document); } catch {}

    // Observe future DOM inserts (album/track/music pages generate content dynamically)
    // Performance: scan only the added subtree(s), not the whole document.
    let scheduled = false;
    const pending = new Set();

    const scheduleScan = (root) => {
      if (root && root !== document && root !== document.documentElement) {
        if (root instanceof Element) pending.add(root);
      }
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        try {
          if (pending.size) {
            for (const r of pending) scan(r);
            pending.clear();
          } else {
            scan(document);
          }
        } catch {}
      });
    };

    try {
      const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (!m.addedNodes || !m.addedNodes.length) continue;
          for (const n of m.addedNodes) {
            if (n && n.nodeType === 1) scheduleScan(n);
          }
        }
      });
      mo.observe(document.documentElement, { subtree: true, childList: true });
    } catch {}
  })();

// Shared press helper for touch/responsive browser tooling:
// binds click + Enter/Space and stops propagation so menus do not immediately self-close.
function bindReliablePress(el, handler) {
  if (!el || typeof handler !== 'function') return;
  let lastStamp = 0;
  const invoke = (e) => {
    try { e.preventDefault(); } catch {}
    try { e.stopPropagation(); } catch {}
    const now = Date.now();
    if (now - lastStamp < 220) return;
    lastStamp = now;
    handler(e);
  };
  el.addEventListener('click', invoke);
  el.addEventListener('pointerup', (e) => {
    try {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
    } catch {}
    invoke(e);
  });
  el.addEventListener('touchend', invoke, { passive: false });
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    invoke(e);
  });
}
try {
  if (typeof globalThis.bindReliablePress !== 'function') {
    globalThis.bindReliablePress = bindReliablePress;
  }
} catch {}

// =========================
  // THEME MENU UI
  // =========================
  (function setupThemeMenu() {
    const toggle = document.getElementById('theme-toggle');
    const menu = document.getElementById('theme-menu');
    if (!toggle || !menu) return;

    const items = Array.from(menu.querySelectorAll('[data-theme]'));
    if (!items.length) return;

    function currentTheme() {
      const htmlT = document.documentElement.getAttribute('data-theme');
      const bodyT = (document.body && document.body.getAttribute('data-theme')) || null;
      // Read-only: NEVER write attributes here (this function is called from observers/listeners).
      // Writing attributes inside a MutationObserver callback can cause recursive mutation loops
      // and freeze the browser (what you experienced in Firefox).
      const t = (VALID_THEMES.has(htmlT) ? htmlT : (VALID_THEMES.has(bodyT) ? bodyT : 'toa'));
      // Theme menu is visible-only (ToA/Dark/Light). Treat contrast as Dark for UI state.
      return t === 'contrast' ? 'dark' : t;
    }

    function syncMenu() {
      const t = currentTheme();
      items.forEach(btn => {
        const isActive = btn.getAttribute('data-theme') === t;
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
    }

    // Keep menu state accurate even if theme changes outside this menu (e.g., stored value applied on load).
    try {
      let _themeSyncRaf = 0;
      window.addEventListener('toa:themechange', () => {
        if (_themeSyncRaf) return;
        _themeSyncRaf = requestAnimationFrame(() => { _themeSyncRaf = 0; syncMenu(); });
      });
      const obs = new MutationObserver(() => {
        if (_themeSyncRaf) return;
        _themeSyncRaf = requestAnimationFrame(() => { _themeSyncRaf = 0; syncMenu(); });
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch {}

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      syncMenu();
      // focus active item
      const t = currentTheme();
      const active = items.find(btn => btn.getAttribute('data-theme') === t) || items[0];
      active.focus({ preventScroll: true });
    }

    function closeMenu({ restoreFocus = true } = {}) {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }

    try {
      globalThis.toaCloseThemeMenu = (opts = {}) => {
        const { restoreFocus = false } = opts || {};
        closeMenu({ restoreFocus });
      };
    } catch {}

    function isOpen() {
      return !menu.hidden;
    }

    function setThemeAndClose(theme) {
      // Persist user preference (visible themes only) but keep system contrast overrides in effect.
      const nextSaved = PERSISTABLE_THEMES.has(theme) ? theme : 'toa';
      savedTheme = nextSaved;
      try { localStorage.setItem(THEME_STORAGE_KEY, nextSaved); } catch {}
      applyThemeToDOM(getEffectiveTheme(savedTheme));
      syncMenu();
      closeMenu();
    }

    const bindPress = (globalThis && typeof globalThis.bindReliablePress === 'function') ? globalThis.bindReliablePress : bindReliablePress;

    bindPress(toggle, (e) => {
      if (isOpen()) closeMenu({ restoreFocus: false });
      else openMenu();
    });

    items.forEach(btn => {
      bindPress(btn, (e) => {
        const theme = btn.getAttribute('data-theme');
        setThemeAndClose(theme);
      });

      btn.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key === 'ArrowDown' || key === 'ArrowUp') {
          e.preventDefault();
          const dir = key === 'ArrowDown' ? 1 : -1;
          const i = items.indexOf(btn);
          const next = items[(i + dir + items.length) % items.length];
          next.focus({ preventScroll: true });
        }
        if (key === 'Home') {
          e.preventDefault();
          items[0].focus({ preventScroll: true });
        }
        if (key === 'End') {
          e.preventDefault();
          items[items.length - 1].focus({ preventScroll: true });
        }
        if (key === 'Escape') {
          e.preventDefault();
          closeMenu();
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        closeMenu();
      }
    });

    document.addEventListener('pointerdown', (e) => {
      if (!isOpen()) return;
      const target = e.target;
      if (target instanceof Node && (menu.contains(target) || toggle.contains(target))) return;
      closeMenu({ restoreFocus: false });
    }, { capture: true });

    // close menu if focus leaves to elsewhere
    document.addEventListener('focusin', (e) => {
      if (!isOpen()) return;
      const target = e.target;
      if (target instanceof Node && (menu.contains(target) || toggle.contains(target))) return;
      closeMenu({ restoreFocus: false });
    });

    // initialize
    syncMenu();
    closeMenu({ restoreFocus: false });
  })();


  // =========================
  // STREAMING DETAILS MENUS (Album cards)
  // =========================
  // Purpose:
  // - Ensure <details class="streaming"> behaves like a proper keyboard-first menu.
  // - Prevent "stuck open" states and keyboard traps.
  // - Keep ARIA wiring stable for audits and SRs.
  (function setupStreamingDetailsMenus(){
    const set = new Set();
    let uid = 0;

    const getItems = (menu) => Array.from(menu.querySelectorAll('a[href]'));

    const wire = (details) => {
      if (!(details instanceof HTMLDetailsElement)) return null;
      const summary = details.querySelector('summary');
      const menu = details.querySelector('.menu');
      if (!(summary instanceof HTMLElement) || !(menu instanceof HTMLElement)) return null;

      if (!menu.id) {
        uid += 1;
        menu.id = `toa-stream-menu-${uid}`;
      }

      summary.setAttribute('aria-controls', menu.id);
      summary.setAttribute('aria-haspopup', 'menu');
      summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');

      // Defensive roles (music.js sets these, but legacy cards may not)
      if (!menu.hasAttribute('role')) menu.setAttribute('role', 'menu');
      getItems(menu).forEach((a) => { if (!a.hasAttribute('role')) a.setAttribute('role', 'menuitem'); });

      return { summary, menu };
    };

    const close = (details, { restoreFocus = false } = {}) => {
      const wired = wire(details);
      if (!wired) return;
      const { summary } = wired;
      if (!details.open) return;
      details.open = false;
      summary.setAttribute('aria-expanded', 'false');
      if (restoreFocus) { try { summary.focus({ preventScroll: true }); } catch {} }
    };

    const closeAllExcept = (keep) => {
      for (const d of set) {
        if (d === keep) continue;
        if (!d.open) continue;
        close(d);
      }
    };

    const focusFirst = (details) => {
      const wired = wire(details);
      if (!wired) return;
      const { menu } = wired;
      const items = getItems(menu);
      if (!items.length) return;
      try { items[0].focus({ preventScroll: true }); } catch {}
    };

    const focusLast = (details) => {
      const wired = wire(details);
      if (!wired) return;
      const { menu } = wired;
      const items = getItems(menu);
      if (!items.length) return;
      try { items[items.length - 1].focus({ preventScroll: true }); } catch {}
    };

    const ensure = (d) => {
      if (!(d instanceof HTMLDetailsElement)) return;
      if (set.has(d)) return;
      const wired = wire(d);
      if (!wired) return;
      const { summary, menu } = wired;
      set.add(d);

      d.addEventListener('toggle', () => {
        const w = wire(d);
        if (!w) return;
        w.summary.setAttribute('aria-expanded', d.open ? 'true' : 'false');

        if (d.open) {
          closeAllExcept(d);
          window.setTimeout(() => focusFirst(d), 0);
        }
      });

      summary.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(d, { restoreFocus: true }); return; }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          d.open = true;
          wire(d);
          window.setTimeout(() => focusFirst(d), 0);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          d.open = true;
          wire(d);
          window.setTimeout(() => focusLast(d), 0);
        }
      });

      menu.addEventListener('keydown', (e) => {
        const items = getItems(menu);
        if (!items.length) return;

        const i = items.indexOf(document.activeElement);
        const focusAt = (idx) => {
          const n = ((idx % items.length) + items.length) % items.length;
          try { items[n].focus({ preventScroll: true }); } catch {}
        };

        if (e.key === 'Escape') { e.preventDefault(); close(d, { restoreFocus: true }); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); focusAt(i >= 0 ? i + 1 : 0); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); focusAt(i >= 0 ? i - 1 : -1); }
        if (e.key === 'Home')      { e.preventDefault(); focusAt(0); }
        if (e.key === 'End')       { e.preventDefault(); focusAt(-1); }
      });

      menu.addEventListener('click', (e) => {
        const t = e.target;
        const a = t && (t instanceof Element) ? t.closest('a[href]') : null;
        if (!a) return;
        close(d, { restoreFocus: false });
      });
    };

    // Initial scan
    document.querySelectorAll('details.streaming').forEach((d) => ensure(d));

    // Dynamic pages: bind future album cards via subtree observer
    try {
      const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (!m.addedNodes || !m.addedNodes.length) continue;
          for (const n of m.addedNodes) {
            if (!n || n.nodeType !== 1) continue;
            const el = n;
            if (el.matches && el.matches('details.streaming')) ensure(el);
            if (el.querySelectorAll) el.querySelectorAll('details.streaming').forEach((d) => ensure(d));
          }
        }
      });
      mo.observe(document.documentElement, { subtree: true, childList: true });
    } catch {}

    // Click outside closes
    document.addEventListener('click', (e) => {
      const t = e.target;
      for (const d of set) {
        if (!d.open) continue;
        if (t instanceof Node && d.contains(t)) continue;
        close(d);
      }
    }, { passive: true });

    // Focus leaving closes (prevents keyboard traps)
    document.addEventListener('focusin', (e) => {
      const t = e.target;
      for (const d of set) {
        if (!d.open) continue;
        if (t instanceof Node && d.contains(t)) continue;
        close(d);
      }
    });

    // Global ESC closes top-most open streaming menu
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      for (const d of set) {
        if (!d.open) continue;
        e.preventDefault();
        close(d, { restoreFocus: true });
        break;
      }
    });
  })();


  // =========================
  // FOOTER GRID AREA HARDENING (Cross-page robustness)
  // =========================


  // =========================
  // FOOTER GRID AREA HARDENING (Cross-page robustness)
  // =========================
  // Problem:
  // - Footer CSS originally mapped columns by :nth-child(), which becomes fragile if
  //   any page injects/omits a column or changes ordering.
  // Fix:
  // - At runtime, derive stable data-footer-area attributes from the first heading label
  //   inside each nav column (Pillars / Hubs / Playable) plus explicit brand/social blocks.
  // - CSS prefers [data-footer-area] when present, while keeping nth-child as a no-JS fallback.
  (function setupFooterAreaMapping() {
    const footer = document.querySelector('footer.site-footer');
    if (!footer) return;

    const inner = footer.querySelector('.footer-inner');
    if (!inner) return;

    // If the template already provides stable mapping attributes, do nothing.
    try { if (inner.querySelector('[data-footer-area]')) return; } catch {}

    const normalize = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

    const mapLabelToArea = (label) => {
      const t = normalize(label);
      if (!t) return '';
      if (t.includes('pillar')) return 'pillars';
      if (t.includes('hub')) return 'hubs';
      if (t.includes('play')) return 'playable';
      return '';
    };

    const children = Array.from(inner.children).filter((el) => el && el.nodeType === 1);
    for (const el of children) {
      if (!(el instanceof Element)) continue;

      if (el.classList.contains('footer-brand')) {
        el.setAttribute('data-footer-area', 'brand');
        continue;
      }
      if (el.classList.contains('footer-social')) {
        el.setAttribute('data-footer-area', 'social');
        continue;
      }

      if (el.matches('nav.footer-col')) {
        const h = el.querySelector('.footer-heading');
        const label = h ? (h.textContent || '') : '';
        const area = mapLabelToArea(label);
        if (area) el.setAttribute('data-footer-area', area);
      }
    }
  })();

  // =========================
  // LANDMARK + FOOTER CURRENT-PAGE HARDENING
  // =========================
  (function setupLandmarksAndFooterCurrent() {
    const normalizePath = (p) => {
      let s = String(p || '/');
      s = s.split('?')[0].split('#')[0];
      if (s === '/index.html') s = '/';
      return s.replace(/\/{2,}/g, '/');
    };

    const here = normalizePath(window.location.pathname);

    const footerNavs = Array.from(document.querySelectorAll('footer nav'));
    for (const nav of footerNavs) {
      nav.querySelectorAll('a[aria-current]').forEach((a) => a.removeAttribute('aria-current'));
      const links = Array.from(nav.querySelectorAll('a[href]'));

      const exact = links.find((a) => normalizePath(a.getAttribute('href') || '') === here);
      if (exact) exact.setAttribute('aria-current', 'page');

      if (!nav.hasAttribute('aria-label')) nav.setAttribute('aria-label', 'Footer navigation');
    }

    const header = document.querySelector('header.site-header, header[role="banner"], header');
    if (header && !header.hasAttribute('role')) header.setAttribute('role', 'banner');

    const main = document.getElementById('main-content') || document.querySelector('main');
    if (main) {
      if (!main.hasAttribute('role')) main.setAttribute('role', 'main');
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    }

    const footer = document.querySelector('footer');
    if (footer) {
      if (!footer.hasAttribute('role')) footer.setAttribute('role', 'contentinfo');
      if (!footer.hasAttribute('aria-label')) footer.setAttribute('aria-label', 'Site footer');
    }
  })();


  // =========================
  // SHARED PAGE CONTEXT FACTS (header + footer)
  // =========================
  const getPageContextFacts = () => {
    const body = document.body;
    if (!body) {
      return { view: 'Current page', role: 'Page', theme: 'ToA' };
    }

    const role = String(body.getAttribute('data-page-role') || '').trim().toLowerCase();
    const classes = new Set(String(body.className || '').split(/\s+/).filter(Boolean));
    const theme = String(document.documentElement.getAttribute('data-theme') || 'toa').trim().toLowerCase();

    const view = (() => {
      if (classes.has('index-page')) return 'Flagship home';
      if (classes.has('music-page')) return 'Music browse + compare';
      if (classes.has('videos-page')) return 'Video watch + companion';
      if (classes.has('streaming-page')) return 'Streaming return map';
      if (classes.has('lyrics-page')) return 'Lyrics hub';
      if (classes.has('search-page')) return 'Search hub';
      if (classes.has('publishing-page') && classes.has('saga-page')) return 'Saga detail';
      if (classes.has('publishing-page') && classes.has('series-page')) return 'Series detail';
      if (classes.has('publishing-page')) return 'Publishing hub';
      if (classes.has('album-page')) return 'Album release ladder';
      if (classes.has('track-page')) return 'Track detail';
      if (classes.has('book-page')) return 'Book detail';
      if (classes.has('apps-page')) return 'Apps hub';
      if (classes.has('games-page') && classes.has('games-arcade-page')) return 'Games Arcade';
      if (classes.has('games-page')) return 'Games Studio';
      if (classes.has('game-runtime')) return 'Playable runtime';
      if (classes.has('about-page')) return 'Studio story + answers';
      if (classes.has('contact-page')) return 'Contact route match';
      if (classes.has('merch-page')) return 'Merch';
      if (classes.has('digital-store-page')) return 'Digital Store';
      if (classes.has('privacy-page')) return 'Privacy checklist';
      if (classes.has('terms-page')) return 'Terms checklist';
      if (classes.has('error-page')) return 'Recovery page';
      return '';
    })();

    const roleLabel = (() => {
      if (!role) return 'Current page';
      if (role === 'flagship') return 'Flagship route';
      if (role === 'section') return 'Section hub';
      if (role === 'detail') return 'Detail page';
      if (role === 'utility') return 'Utility page';
      if (role === 'app') return 'Interactive page';
      return role.charAt(0).toUpperCase() + role.slice(1);
    })();

    const themeLabel = (() => {
      if (theme === 'dark') return 'Dark Mode';
      if (theme === 'light') return 'Light Mode';
      return 'ToA Theme';
    })();

    return {
      view: view || roleLabel,
      role: roleLabel,
      theme: themeLabel,
    };
  };

  (function setupHeaderContextFacts() {
    const viewTarget = document.getElementById('nav-context-view');
    const roleTarget = document.getElementById('nav-context-role');
    const themeTarget = document.getElementById('nav-context-theme');
    if (!viewTarget && !roleTarget && !themeTarget) return;

    const apply = () => {
      const facts = getPageContextFacts();
      if (viewTarget) viewTarget.textContent = facts.view;
      if (roleTarget) roleTarget.textContent = facts.role;
      if (themeTarget) themeTarget.textContent = facts.theme;
    };

    apply();

    try {
      const root = document.documentElement;
      const obs = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'attributes' && record.attributeName === 'data-theme') {
            apply();
            break;
          }
        }
      });
      obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    } catch {}
  })();

  // =========================
  // FOOTER CONTEXT FACTS (shared footer prelude)
  // =========================
  (function setupFooterContextFacts() {
    const viewTarget = document.getElementById('footer-context-view');
    const roleTarget = document.getElementById('footer-context-role');
    const themeTarget = document.getElementById('footer-context-theme');
    if (!viewTarget && !roleTarget && !themeTarget) return;

    const apply = () => {
      const facts = getPageContextFacts();
      if (viewTarget) viewTarget.textContent = facts.view;
      if (roleTarget) roleTarget.textContent = facts.role;
      if (themeTarget) themeTarget.textContent = facts.theme;
    };

    apply();

    try {
      const root = document.documentElement;
      const obs = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'attributes' && record.attributeName === 'data-theme') {
            apply();
            break;
          }
        }
      });
      obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    } catch {}
  })();

  


  

  // =========================
  // CHIP ROW FOCUS-FOLLOW (Keyboard clarity on horizontal scrollers)
  // - Many chip rows become horizontal scrollers on ≤768.
  // - Ensure the focused chip stays visible without requiring manual scroll.
  // =========================
  (function setupChipRowFocusFollow() {
    const rows = Array.from(document.querySelectorAll('.chip-row'));
    if (!rows.length) return;

    const ensureInView = (row, el) => {
      try {
        if (!(row instanceof HTMLElement) || !(el instanceof HTMLElement)) return;
        if (row.scrollWidth <= row.clientWidth + 2) return;

        const pad = 12;
        const c = row.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const leftDelta = (r.left - c.left) - pad;
        const rightDelta = (r.right - c.right) + pad;

        const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
        if (leftDelta < 0) row.scrollBy({ left: leftDelta, behavior });
        else if (rightDelta > 0) row.scrollBy({ left: rightDelta, behavior });
      } catch {}
    };

    rows.forEach((row) => {
      row.addEventListener('focusin', (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (!row.contains(t)) return;
        ensureInView(row, t);
      });
    });
  })();

  // =========================
  // UNIVERSAL CAROUSEL/SLIDER NAVIGATION (Albums, Music Videos, Home Videos)
  // =========================
  function setupCarouselNav(config) {
    // config:
    // {
    //   buttonSelector, itemSelector,
    //   leftClass, rightClass,
    //   carouselFocusableSelector // optional selector to apply keyboard nav
    // }
    const buttons = Array.from(document.querySelectorAll(config.buttonSelector));
    if (!buttons.length) return;

    const byCarousel = new Map();

    function getCarousel(id) {
      if (!id) return null;
      return document.getElementById(id);
    }

    function getScrollAmount(carousel) {
      const item = carousel.querySelector(config.itemSelector);
      if (!item) return 0;
      const cs = window.getComputedStyle(carousel);
      const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      return item.getBoundingClientRect().width + gap;
    }


    const isTextEntry = (el) => {
      if (!(el instanceof Element)) return false;
      const tag = el.tagName;
      if (tag === 'TEXTAREA') return true;
      if (tag !== 'INPUT') return false;
      const t = String(el.getAttribute('type') || 'text').toLowerCase();
      return !(t === 'button' || t === 'submit' || t === 'reset' || t === 'checkbox' || t === 'radio');
    };

    const ensureInView = (carousel, el) => {
      try {
        if (!(carousel instanceof HTMLElement) || !(el instanceof HTMLElement)) return;
        const pad = 14;
        const c = carousel.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const leftDelta = (r.left - c.left) - pad;
        const rightDelta = (r.right - c.right) + pad;

        const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
        if (leftDelta < 0) carousel.scrollBy({ left: leftDelta, behavior });
        else if (rightDelta > 0) carousel.scrollBy({ left: rightDelta, behavior });
      } catch {
        /* ignore */
      }
    };

    const buildFocusTargets = (carousel) => {
      try {
        const items = Array.from(carousel.querySelectorAll(config.itemSelector));
        const targets = [];
        for (const item of items) {
          if (!(item instanceof Element)) continue;
          // Prefer an obvious interactive inside the item
          const t = item.querySelector('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
          if (t instanceof HTMLElement) targets.push(t);
        }
        return targets;
      } catch {
        return [];
      }
    };
    function updateButtonStates(id) {
      const entry = byCarousel.get(id);
      if (!entry) return;
      const { carousel, leftButtons, rightButtons, containers } = entry;

      const scrollable = (carousel.scrollWidth - carousel.clientWidth) > 2;
      if (containers && containers.length) {
        containers.forEach((c) => {
          if (!(c instanceof HTMLElement)) return;
          // Only render nav controls when there is actual overflow.
          c.hidden = !scrollable;
          c.setAttribute('aria-hidden', String(!scrollable));
        });
      }

      if (!scrollable) {
        // Keep disabled state consistent even when hidden.
        leftButtons.forEach(b => { b.disabled = true; b.setAttribute('aria-disabled', 'true'); });
        rightButtons.forEach(b => { b.disabled = true; b.setAttribute('aria-disabled', 'true'); });
        return;
      }

      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      const atStart = carousel.scrollLeft <= 1;
      const atEnd = carousel.scrollLeft >= (maxScrollLeft - 1);

      leftButtons.forEach(b => { b.disabled = atStart; b.setAttribute('aria-disabled', String(atStart)); });
      rightButtons.forEach(b => { b.disabled = atEnd; b.setAttribute('aria-disabled', String(atEnd)); });
    }

    function scheduleUpdate(id) {
      const entry = byCarousel.get(id);
      if (!entry) return;
      if (entry.raf) cancelAnimationFrame(entry.raf);
      entry.raf = requestAnimationFrame(() => updateButtonStates(id));
    }

    function registerButton(button) {
      const id = button.getAttribute('data-carousel');
      const carousel = getCarousel(id);
      if (!carousel) return;

      const container = button.closest('.carousel-nav-buttons');

      let entry = byCarousel.get(id);
      if (!entry) {
        entry = {
          id,
          carousel,
          raf: 0,
          leftButtons: [],
          rightButtons: [],
          containers: [],
          ro: null
        };
        byCarousel.set(id, entry);

        carousel.addEventListener('scroll', () => scheduleUpdate(id), { passive: true });
        // Resize observer keeps boundary states correct on responsive changes
        if ('ResizeObserver' in window) {
          entry.ro = new ResizeObserver(() => scheduleUpdate(id));
          entry.ro.observe(carousel);
        } else {
          window.addEventListener('resize', () => scheduleUpdate(id), { passive: true });
        }

        

        // Focus-follow: keep focused items visible inside horizontal scrollers
        carousel.addEventListener('focusin', (e) => {
          const t = e.target;
          if (!(t instanceof HTMLElement)) return;
          if (!carousel.contains(t)) return;
          // If focus is inside a card/item, keep it in view
          ensureInView(carousel, t);
        });

        // Roving focus within carousel items (ArrowLeft/ArrowRight/Home/End)
        carousel.addEventListener('keydown', (e) => {
          const key = e.key;
          if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;

          const active = document.activeElement;
          if (!(active instanceof HTMLElement)) return;
          if (!carousel.contains(active)) return;
          if (isTextEntry(active)) return;

          const targets = buildFocusTargets(carousel);
          if (!targets.length) return;

          let i = targets.indexOf(active);
          if (i < 0) {
            // If focus is on a nested element, snap to the nearest item target
            const host = active.closest(config.itemSelector);
            if (host) {
              const inner = host.querySelector('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
              if (inner instanceof HTMLElement) i = targets.indexOf(inner);
            }
          }
          if (i < 0) return;

          let next = i;
          if (key === 'ArrowLeft') next = i - 1;
          if (key === 'ArrowRight') next = i + 1;
          if (key === 'Home') next = 0;
          if (key === 'End') next = targets.length - 1;

          const n = ((next % targets.length) + targets.length) % targets.length;
          const el = targets[n];
          e.preventDefault();
          try { el.focus({ preventScroll: true }); } catch {}
          ensureInView(carousel, el);
        });
// Keyboard navigation on the carousel itself
        const focusable = carousel.matches(config.carouselFocusableSelector || '*') ? carousel : null;
        if (focusable) {
          if (!focusable.hasAttribute('tabindex')) focusable.setAttribute('tabindex', '0');
          focusable.addEventListener('keydown', (e) => {
            const key = e.key;
            if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;

            const amount = getScrollAmount(carousel) || 320;
            const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
            if (key === 'ArrowLeft') carousel.scrollBy({ left: -amount, behavior });
            if (key === 'ArrowRight') carousel.scrollBy({ left: amount, behavior });
            if (key === 'Home') carousel.scrollTo({ left: 0, behavior });
            if (key === 'End') carousel.scrollTo({ left: carousel.scrollWidth, behavior });
            e.preventDefault();
          });
        }
      }

      if (container && !entry.containers.includes(container)) entry.containers.push(container);

      const isLeft = button.classList.contains(config.leftClass);
      const isRight = button.classList.contains(config.rightClass);
      if (isLeft) entry.leftButtons.push(button);
      if (isRight) entry.rightButtons.push(button);

      function scrollCarousel() {
        const amount = getScrollAmount(carousel);
        if (!amount) return;
        const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
        if (isLeft) carousel.scrollBy({ left: -amount, behavior });
        if (isRight) carousel.scrollBy({ left: amount, behavior });
      }

      button.addEventListener('click', scrollCarousel);

      // Modern browsers no longer require touchstart shims for responsive activation.
      // Keeping one activation path avoids accidental double-trigger on hybrid devices.

      // Initial state
      scheduleUpdate(id);
    }

    buttons.forEach(registerButton);
  }

  // Album carousels (horizontal scroll)
  setupCarouselNav({
    buttonSelector: '.album-nav-button',
    itemSelector: '.album-block',
    leftClass: 'album-nav-left',
    rightClass: 'album-nav-right',
    carouselFocusableSelector: '.album-track, .album-carousel'
  });

  // Music video carousels
  setupCarouselNav({
    buttonSelector: '.music-video-nav-button',
    itemSelector: '.music-video-item',
    leftClass: 'music-video-nav-left',
    rightClass: 'music-video-nav-right',
    carouselFocusableSelector: '.music-video-carousel'
  });

  // Home page/index video carousels
  setupCarouselNav({
    buttonSelector: '.index-video-nav-button',
    itemSelector: '.index-video-item',
    leftClass: 'index-video-nav-left',
    rightClass: 'index-video-nav-right',
    carouselFocusableSelector: '.index-video-carousel'
  });

  // Home page: Now Live deck carousel
  setupCarouselNav({
    buttonSelector: '.home-live-nav-button',
    itemSelector: '.deck-card',
    leftClass: 'home-live-nav-left',
    rightClass: 'home-live-nav-right',
    carouselFocusableSelector: '.home-live-carousel'
  });

  // Home page: Pillar carousel (mobile scroll)
  setupCarouselNav({
    buttonSelector: '.pillar-nav-button',
    itemSelector: '.pillar-card',
    leftClass: 'pillar-nav-left',
    rightClass: 'pillar-nav-right',
    carouselFocusableSelector: '.pillar-carousel'
  });

  // =========================
  // Horizontal Rails — Keyboard + Focus-Scroll Support (Wave MW-AH)
  // Targets:
  // - .series-rail (Publishing hubs + library rails)
  // - .shelf__row (Publishing shelves)
  // Goal: prevent keyboard users from losing focus off-screen in horizontal scrollers.
  // =========================
  (function setupHorizontalRails(){
    const rails = Array.from(document.querySelectorAll('.series-rail, .shelf__row'));
    if (!rails.length) return;

    const isTextEntry = (el) => {
      if (!(el instanceof Element)) return false;
      const tag = el.tagName;
      if (tag === 'TEXTAREA') return true;
      if (tag !== 'INPUT') return false;
      const t = String(el.getAttribute('type') || 'text').toLowerCase();
      return !(t === 'button' || t === 'submit' || t === 'reset' || t === 'checkbox' || t === 'radio');
    };

    const focusables = (rail) => {
      try {
        return Array.from(rail.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter((x) => x instanceof HTMLElement);
      } catch {
        return [];
      }
    };

    const ensureInView = (rail, el) => {
      try {
        if (!(rail instanceof HTMLElement) || !(el instanceof HTMLElement)) return;
        const pad = 14;
        const c = rail.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const leftDelta = (r.left - c.left) - pad;
        const rightDelta = (r.right - c.right) + pad;
        const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
        if (leftDelta < 0) rail.scrollBy({ left: leftDelta, behavior });
        else if (rightDelta > 0) rail.scrollBy({ left: rightDelta, behavior });
      } catch { /* ignore */ }
    };

    rails.forEach((rail) => {
      if (!(rail instanceof HTMLElement)) return;

      rail.addEventListener('focusin', (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (!rail.contains(t)) return;
        ensureInView(rail, t);
      });

      rail.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;

        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) return;
        if (!rail.contains(active)) return;
        if (isTextEntry(active)) return;

        const items = focusables(rail);
        if (!items.length) return;

        let i = items.indexOf(active);
        if (i < 0) {
          const host = active.closest('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
          if (host instanceof HTMLElement) i = items.indexOf(host);
        }
        if (i < 0) return;

        let next = i;
        if (key === 'ArrowLeft') next = Math.max(0, i - 1);
        if (key === 'ArrowRight') next = Math.min(items.length - 1, i + 1);
        if (key === 'Home') next = 0;
        if (key === 'End') next = items.length - 1;

        if (next !== i) {
          e.preventDefault();
          const el = items[next];
          try { el.focus({ preventScroll: true }); } catch {}
          ensureInView(rail, el);
        }
      });
    });
  })();


});


// Footer year
(function toaSetFooterYear(){
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();

// =========================
// ACCESSIBILITY NORMALIZATION (P0)
// - Fix label-content-name mismatch by removing mismatched aria-label where visible text exists.
// - Convert inline glyph icons into generated content (CSP-safe; no inline style attr).
// =========================
(function toaAccessibilityNormalization(){
  const getVisibleText = (el) => {
    try {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('.sr-only,[aria-hidden="true"]').forEach((n) => n.remove());
      const txt = (clone.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt) return '';
      // Ignore pure glyph/punctuation
      if (!/[a-z0-9]/i.test(txt)) return '';
      return txt;
    } catch {
      return '';
    }
  };

  // Fix aria-label mismatches on text-labeled elements.
  document.querySelectorAll('[aria-label]').forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const aria = el.getAttribute('aria-label');
    if (!aria) return;

    const visible = getVisibleText(el);
    if (!visible) return;

    const a = aria.trim().toLowerCase();
    const v = visible.trim().toLowerCase();
    if (a.includes(v)) return;

    // Prefer removing aria-label so the visible text becomes the accessible name.
    if (el.matches('a, button')) {
      el.removeAttribute('aria-label');
    } else {
      el.setAttribute('aria-label', visible);
    }
  });


// Featured Albums rail keyboard support is handled by setupCarouselNav.
// Keep one listener path to avoid duplicate Arrow/Home/End scroll jumps.


// Security/Privacy: harden all target=_blank links (noopener+noreferrer) and set referrerPolicy for external URLs.
(function hardenBlankTargetLinks(){
    try {
        const anchors = document.querySelectorAll('a[target="_blank"]');
        if (!anchors || !anchors.length) return;

        const origin = location && location.origin ? location.origin : '';

        anchors.forEach(a => {
            try {
                const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
                if (!rel.includes('noopener')) rel.push('noopener');
                if (!rel.includes('noreferrer')) rel.push('noreferrer');
                a.setAttribute('rel', rel.join(' '));

                // Only apply referrer policy to external links; internal blank-target links keep default behavior.
                const href = a.getAttribute('href') || '';
                if (!href) return;

                // Ignore non-http(s) schemes (mailto/tel/etc.).
                if (!/^https?:/i.test(href)) return;

                let url;
                try { url = new URL(href, origin || undefined); } catch { return; }
                if (origin && url.origin === origin) return;

                // Privacy-first on external destinations.
                if (!a.hasAttribute('referrerpolicy')) a.setAttribute('referrerpolicy', 'no-referrer');
            } catch (_) {}
        });
    } catch (_) {}
})();


// =========================
// Wave AO — TOAST ANNOUNCER (global status feedback)
// =========================
// Centralized, accessible feedback surface for actions (copy/share/etc.) without inline JS.
// - role="status" + aria-live="polite" for screen-reader parity
// - respects prefers-reduced-motion (no transitions unless .no-reduced-motion is present)
// - safe-area aware via CSS tokens
(function initToastAnnouncer(){
  const ID = 'toa-toast';
  let el = null;
  let timer = null;

  const mount = () => {
    if (el && el.isConnected) return el;
    try { el = document.getElementById(ID); } catch {}
    if (el && el.isConnected) return el;
    if (!document.body) return null;

    el = document.createElement('div');
    el.id = ID;
    el.className = 'toa-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('data-show', '0');
    el.textContent = '';
    document.body.appendChild(el);
    return el;
  };

  const ensure = () => {
    const m = mount();
    if (m) return m;
    // If called before body exists, mount as soon as possible.
    try { document.addEventListener('DOMContentLoaded', mount, { once: true }); } catch {}
    return null;
  };

  const hide = () => {
    const m = ensure();
    if (!m) return;
    m.setAttribute('data-show', '0');
    try { document.documentElement.removeAttribute('data-toa-toast'); } catch {}
    // Clear text after transition to avoid re-announce on next show in some SRs.
    window.setTimeout(() => {
      try { m.textContent = ''; } catch {}
    }, document.documentElement.classList.contains('no-reduced-motion') ? 220 : 0);
  };

  const show = (msg, opts) => {
    const m = ensure();
    if (!m) return;

    const text = String(msg || '').trim();
    if (!text) return;

    // Optional duration override.
    const duration = (opts && Number.isFinite(opts.duration)) ? Math.max(1200, opts.duration) : 3200;

    try {
      window.clearTimeout(timer);
      timer = null;
    } catch {}

    // Update text first for SRs, then reveal.
    m.textContent = text;
    m.setAttribute('data-show', '1');

    try { document.documentElement.setAttribute('data-toa-toast', '1'); } catch {}

    timer = window.setTimeout(hide, duration);
  };

  // Expose a tiny internal API for other systems (Link Tools, etc.).
  try {
    if (!window.__toaToast) window.__toaToast = show;
  } catch {}
})();


// =========================
// Shared clipboard helper
// =========================
// Exposes a small copy helper for detail pages and other modules without
// keeping the old Link Tools surface alive in the global runtime.
(function setupClipboardHelper(){
  const copyTextFallback = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.className = 'toa-clipboard';
      ta.setAttribute('readonly', '');
      ta.value = String(text || '');
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      ta.remove();
      return Boolean(ok);
    } catch {
      return false;
    }
  };

  const copyText = async (text) => {
    const value = String(text || '');
    if (!value) return false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}

    return copyTextFallback(value);
  };

  try {
    if (!window.__toaCopyText) window.__toaCopyText = copyText;
  } catch {}
})();

// =========================
// Wave A11y — DETAILS ARIA EXPANSION (global)
// =========================
// Purpose: keep <summary aria-expanded> truthful as <details open> toggles.
// Applies to disclosure patterns used across the platform (command-more, etc.).
(function initDetailsAriaExpanded(){
  // Centralized <details> aria-expanded sync.
  // - Avoids per-component listeners (event delegation).
  // - Uses capture because toggle targets <details> and we want early sync.
  const sync = (d) => {
    try {
      if (!(d instanceof HTMLDetailsElement)) return;
      if (!d.hasAttribute('data-disclosure')) return;
      const s = d.querySelector('summary');
      if (!s) return;
      s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
    } catch {}
  };

  try {
    // Initial pass (SSR/static correctness)
    document.querySelectorAll('details[data-disclosure]').forEach(sync);

    // Toggle event delegation
    document.addEventListener('toggle', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLDetailsElement)) return;
      sync(t);
    }, true);
  } catch {}
})();


// =========================
// Wave AQ — FLOATING BACK TO TOP (global)
// =========================
// Purpose: fast return to the top of the main content on long pages without hunting for Link Tools.
// Behavior: appears after scrolling; scrolls to #main-content; respects reduced motion.
// Accessibility: true button; focus moves to the main heading/section after scroll.
(function initFloatingBackToTop(){
  const ID = 'toa-fab-top';
  let btn = null;
  let lastKnownY = 0;
  let ticking = false;

  const isFocusable = (el) => {
    if (!(el instanceof HTMLElement)) return false;
    const name = (el.tagName || '').toLowerCase();
    if (name === 'a' || name === 'button' || name === 'input' || name === 'select' || name === 'textarea') return true;
    if (el.hasAttribute('tabindex')) return true;
    return false;
  };

  const focusElement = (target) => {
    if (!(target instanceof HTMLElement)) return;

    const heading = target.matches('h1,h2,h3,h4,h5,h6')
      ? target
      : target.querySelector('h1,h2,h3,h4,h5,h6');

    const el = (heading instanceof HTMLElement) ? heading : target;

    const needsTabindex = !isFocusable(el);
    if (needsTabindex) {
      el.setAttribute('tabindex', '-1');
      el.dataset.toaTempTabindex = '1';
      el.addEventListener('blur', () => {
        try {
          if (el.dataset.toaTempTabindex === '1') {
            el.removeAttribute('tabindex');
            delete el.dataset.toaTempTabindex;
          }
        } catch {}
      }, { once: true });
    }

    try { el.focus({ preventScroll: true }); } catch { try { el.focus(); } catch {} }
  };

  const scrollAndFocusMain = () => {
    const main = document.getElementById('main-content');
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';

    if (main) {
      try {
        main.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
      } catch {
        try {
          const top = main.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top, behavior });
        } catch {}
      }

      // Mirror Smart Anchor UX: focus after scroll begins.
      window.setTimeout(() => focusElement(main), prefersReducedMotion() ? 0 : 180);
      return;
    }

    try { window.scrollTo({ top: 0, behavior }); } catch { try { window.scrollTo(0, 0); } catch {} }
  };

  const ensure = () => {
    if (btn && btn.isConnected) return btn;
    if (!document.body) return null;

    btn = document.createElement('button');
    btn.id = ID;
    btn.className = 'toa-fab toa-fab--top';
    btn.type = 'button';
    btn.hidden = true;
    btn.setAttribute('data-show', '0');
    btn.setAttribute('aria-label', 'Back to top');
    btn.setAttribute('title', 'Back to top');
    btn.innerHTML = '<span class="toa-fab__label" aria-hidden="true">Top</span><span class="sr-only">Back to top</span>';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollAndFocusMain();
    });

    document.body.appendChild(btn);
    return btn;
  };

  const shouldShow = (y) => {
    try { if (document.body && document.body.classList.contains('nav-open')) return false; } catch {}

    // Desktop: footer provides the explicit text control.
    // Mobile/Tablet: keep the floating control for long-scroll ergonomics.
    try { if ((window.innerWidth || 0) >= 1025) return false; } catch {}

    const compactViewport = (window.innerWidth || 0) <= 640;
    const threshold = compactViewport
      ? Math.max(820, Math.floor(window.innerHeight * 1.35))
      : Math.max(560, Math.floor(window.innerHeight * 0.95));
    return y > threshold;
  };

  const update = () => {
    ticking = false;
    const b = ensure();
    if (!b) return;

    const y = lastKnownY;
    const show = shouldShow(y);

    if (!show && document.activeElement === b) {
      // Don’t strand focus on a disappearing control.
      scrollAndFocusMain();
    }

    b.hidden = !show;
    b.setAttribute('data-show', show ? '1' : '0');
  };

  const onScroll = () => {
    lastKnownY = window.scrollY || window.pageYOffset || 0;
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  const mq = (() => {
    try { return window.matchMedia('(max-width: 1024px)'); } catch { return null; }
  })();

  let listening = false;

  const attach = () => {
    if (listening) return;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    listening = true;
  };

  const detach = () => {
    if (!listening) return;
    try { window.removeEventListener('scroll', onScroll); } catch {}
    try { window.removeEventListener('resize', onScroll); } catch {}
    listening = false;

    // Hide + reset state when deactivated (desktop tier).
    try {
      const b = ensure();
      if (b) {
        b.hidden = true;
        b.setAttribute('data-show', '0');
      }
    } catch {}
  };

  const applyMode = () => {
    const isActive = mq ? mq.matches : ((window.innerWidth || 0) < 1025);
    if (isActive) {
      ensure();
      attach();
      onScroll();
    } else {
      detach();
    }
  };

  const boot = () => {
    applyMode();
    // React to breakpoint changes without running scroll logic on desktop.
    try {
      if (mq) mq.addEventListener('change', applyMode);
    } catch {
      // Fallback: resize already toggles the mode (detached on desktop).
      window.addEventListener('resize', applyMode, { passive: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();


// =========================
// Wave AQ — HOME "NOW LIVE" DECK FILTERS (progressive enhancement)
// =========================
// Purpose: let users filter the Now Live deck by pillar without losing the carousel.
// Behavior: injects a chip-row filter rail + live count; hides non-matching cards using [hidden].
// Accessibility: true buttons with aria-pressed; count is aria-live.
(function initHomeNowLiveDeckFilters(){
  const isHome = () => {
    try {
      const p = String(location.pathname || '');
      return document.body.classList.contains('index-page') || p === '/' || p.endsWith('/index.html');
    } catch { return false; }
  };

  if (!isHome()) return;

  const section = document.getElementById('now-live');
  const deck = document.getElementById('home-live-carousel');
  if (!section || !deck) return;

  if (section.querySelector('[data-home-live-tools="1"]')) return;

  const cards = Array.from(deck.querySelectorAll('a.deck-card'));
  if (cards.length < 3) return;

  const categorize = (href) => {
    const h = String(href || '').trim();
    if (!h) return 'other';

    let pathname = h;
    try { pathname = new URL(h, location.href).pathname || h; } catch {}

    const p = String(pathname).toLowerCase();

    if (p.startsWith('/games/')) return 'games';
    if (p === '/games.html' || p === '/games/') return 'games';

    if (p === '/streaming.html' || p.startsWith('/streaming')) return 'stream';

    if (p === '/music.html' || p.startsWith('/music/')) return 'music';
    if (p === '/album.html' || p === '/track.html') return 'music';

    if (p.startsWith('/publishing') || p.startsWith('/book') || p.startsWith('/publishing/')) return 'publishing';

    if (p.includes('store') || p.startsWith('/merch')) return 'store';

    return 'other';
  };

  const labels = {
    all: 'All',
    music: 'Music',
    stream: 'Stream',
    publishing: 'Publishing',
    games: 'Games',
    store: 'Store'
  };

  // Annotate cards + gather categories present.
  const present = new Set(['all']);
  cards.forEach((c) => {
    const cat = categorize(c.getAttribute('href'));
    c.dataset.liveCat = cat;
    present.add(cat);
  });

  // Preferred order (only render what exists).
  const order = ['all', 'music', 'stream', 'publishing', 'games', 'store'];
  const cats = order.filter((k) => present.has(k));
  if (cats.length <= 1) return;

  const tools = document.createElement('div');
  tools.className = 'home-live-tools';
  tools.dataset.homeLiveTools = '1';
  tools.setAttribute('role', 'region');
  tools.setAttribute('aria-label', 'Now Live filters');

  const ul = document.createElement('ul');
  ul.className = 'chip-row';
  ul.setAttribute('role', 'list');

  cats.forEach((cat) => {
    const li = document.createElement('li');
    li.className = 'chip-row__item';

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('data-home-live-filter', cat);
    b.setAttribute('aria-pressed', cat === 'all' ? 'true' : 'false');
    b.textContent = labels[cat] || cat;

    li.appendChild(b);
    ul.appendChild(li);
  });

  const meta = document.createElement('p');
  meta.className = 'muted micro home-live-meta';
  meta.setAttribute('aria-live', 'polite');
  meta.setAttribute('aria-atomic', 'true');

  tools.appendChild(ul);
  tools.appendChild(meta);

  const navButtons = section.querySelector('.home-live-nav-buttons');
  if (navButtons && navButtons.parentNode) {
    navButtons.parentNode.insertBefore(tools, deck);
  } else {
    deck.parentNode.insertBefore(tools, deck);
  }

const update = (active) => {
  const a = String(active || 'all');
  let shown = 0;

  cards.forEach((c) => {
    const ok = a === 'all' || c.dataset.liveCat === a;
    c.hidden = !ok;
    if (ok) shown += 1;
  });

  deck.classList.remove('is-single', 'is-double');

  if (shown === 1) {
    deck.classList.add('is-single');
  } else if (shown === 2) {
    deck.classList.add('is-double');
  }

  // Update pressed state.
  const btns = Array.from(ul.querySelectorAll('button[data-home-live-filter]'));
  btns.forEach((b) => {
    const cat = b.getAttribute('data-home-live-filter');
    b.setAttribute('aria-pressed', cat === a ? 'true' : 'false');
  });

  meta.textContent = (a === 'all')
    ? `${shown} item${shown === 1 ? '' : 's'} in this deck.`
    : `${shown} ${labels[a] || a} item${shown === 1 ? '' : 's'} shown.`;

  // Reset carousel scroll for clarity.
  try {
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    deck.scrollTo({ left: 0, behavior });
  } catch {}
};

  tools.addEventListener('click', (e) => {
    const t = e.target;
    const b = t && (t instanceof Element) ? t.closest('button[data-home-live-filter]') : null;
    if (!b) return;
    const cat = b.getAttribute('data-home-live-filter') || 'all';
    update(cat);
  });

  // Initial state.
  update('all');
})();


// =====================================================================
// Wave MAX — Elite Mega Menu + Header Height Variable
// =====================================================================
(function setupHeaderHeightCSSVar(){
  const header = document.querySelector('.site-header');
  if (!header) return;

  const apply = () => {
    try {
      const h = Math.max(56, Math.round(header.getBoundingClientRect().height || header.offsetHeight || 72));
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    } catch {}
  };

  apply();
  window.addEventListener('resize', () => { apply(); }, { passive: true });
})();

// ---------------------------------------------------------------------
// Header transparency state (Riot-like):
// - On the home hero, the header sits directly on the hero (no shaded bar)
// - Once the user scrolls, we re-enable the header surface for legibility
// ---------------------------------------------------------------------
(function setupHeaderScrollState(){
  const body = document.body;
  if (!body) return;
  const header = document.querySelector(".site-header");
  const syncHeaderHeight = () => {
    try {
      if (!header) return;
      const h = Math.max(56, Math.round(header.getBoundingClientRect().height));
      document.documentElement.style.setProperty("--header-h", h + "px");
    } catch {}
  };
  syncHeaderHeight();
  const apply = () => {
    try {
      if (window.scrollY > 10) body.classList.add('nav-scrolled');
      else body.classList.remove('nav-scrolled');
    } catch {}
  };
  apply();
  window.addEventListener('scroll', apply, { passive: true });
  try {
    if (header && 'ResizeObserver' in window) {
      const ro = new ResizeObserver(() => syncHeaderHeight());
      ro.observe(header);
    }
  } catch {}

  window.addEventListener('resize', () => { syncHeaderHeight(); apply(); }, { passive: true });
})();

// ---------------------------------------------------------------------
// Nav Hub (Explore) — single premium entry point + preview on hover
// ---------------------------------------------------------------------
(function setupNavHub(){
  const nav = document.querySelector('[data-nav="primary"]');
  if (!nav) return;

  const toggles = Array.from(nav.querySelectorAll('[data-hub-toggle="true"]'));
  const toggle = toggles[0] || null;
  const panel = nav.querySelector('.nav-hub-panel');
  const inner = panel ? panel.querySelector('.nav-hub-panel__inner') : null;
  const hubBackdrop = nav.querySelector('.nav-hub-backdrop');
  const closeButton = panel ? panel.querySelector('.nav-hub-close') : null;

  if (!toggle || !panel) return;
  try { globalThis.__toaNavHubBound = true; } catch {}

  const reliablePress = (globalThis && typeof globalThis.bindReliablePress === 'function' && globalThis.bindReliablePress) || function(el, handler) {
    if (!el || typeof handler !== 'function') return;
    const invoke = (e) => {
      try { e.preventDefault(); } catch {}
      try { e.stopPropagation(); } catch {}
      handler(e);
    };
    el.addEventListener('click', invoke);
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      invoke(e);
    });
  };

  const focusableSel = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const getFocusable = (root) => Array.from(root.querySelectorAll(focusableSel))
    .filter((el) => el && !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && !el.hidden);

  let removeFocusTrap = null;

  const trapFocus = (container, initialEl) => {
    const onKeyDown = (e) => {
      if (e.key !== 'Tab' || !isOpen()) return;
      const items = getFocusable(container);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === container) {
          e.preventDefault();
          try { last.focus({ preventScroll: true }); } catch {}
        }
        return;
      }

      if (active === last) {
        e.preventDefault();
        try { first.focus({ preventScroll: true }); } catch {}
      }
    };

    container.addEventListener('keydown', onKeyDown);
    const target = initialEl || getFocusable(container)[0] || container;
    window.setTimeout(() => {
      try { target.focus({ preventScroll: true }); } catch {}
    }, 24);

    return () => container.removeEventListener('keydown', onKeyDown);
  };

  // Remember which toggle opened the hub so we can restore focus accurately.
  let lastToggle = toggle;

  // -----------------------------
  // Scroll lock (preserve scroll position; NEVER jump to top)
  // -----------------------------
  const lockScroll = () => {
    try {
      const body = document.body;
      const docEl = document.documentElement;
      const y = window.scrollY || window.pageYOffset || 0;
      const scrollbarComp = Math.max(0, window.innerWidth - docEl.clientWidth);
      body.dataset.hubScrollY = String(y);
      body.style.position = 'fixed';
      body.style.top = `-${y}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.setProperty('--toa-scrollbar-comp', `${scrollbarComp}px`);
      docEl.style.setProperty('--toa-scrollbar-comp', `${scrollbarComp}px`);
      body.classList.add('nav-hub-lock');
    } catch {}
  };

  const unlockScroll = () => {
    try {
      const body = document.body;
      const docEl = document.documentElement;
      const y = parseInt(body.dataset.hubScrollY || '0', 10) || 0;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.removeProperty('--toa-scrollbar-comp');
      docEl.style.removeProperty('--toa-scrollbar-comp');
      body.classList.remove('nav-hub-lock');
      delete body.dataset.hubScrollY;
      window.scrollTo(0, y);
    } catch {}
  };

  const previewImg = panel.querySelector('.nav-hub-preview__img');
  const previewTitle = panel.querySelector('.nav-hub-preview__title');
  const previewDesc = panel.querySelector('.nav-hub-preview__desc');
  const mobileToolsRow = panel.querySelector('.nav-hub-mobile-tools');

  const currentTheme = () => {
    const theme = (document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'toa').toLowerCase();
    return theme === 'contrast' ? 'dark' : theme;
  };

  const syncMobileTools = () => {
    if (!(mobileToolsRow instanceof HTMLElement)) return;
    mobileToolsRow.querySelectorAll('[data-mobile-theme]').forEach((btn) => {
      const active = btn.getAttribute('data-mobile-theme') === currentTheme();
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (btn.dataset.boundMobileTheme === 'true') return;
      btn.dataset.boundMobileTheme = 'true';
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-mobile-theme') || 'toa';
        const real = document.querySelector(`#theme-menu [data-theme="${theme}"]`);
        if (real) {
          try { real.click(); } catch {}
        }
        syncMobileTools();
      });
    });
  };

  const setExpanded = (v) => {
    try {
      (toggles.length ? toggles : [toggle]).forEach((t) => {
        try { t.setAttribute('aria-expanded', v ? 'true' : 'false'); } catch {}
        // Swap the right-side icon button label for better screen reader clarity.
        try {
          if (t.classList && t.classList.contains('nav-toggle')) {
            t.setAttribute('aria-label', v ? 'Close site menu' : 'Open site menu');
          }
        } catch {}
      });
    } catch {}
  };

  let closeTimer = null;
  let openStamp = 0;

  const mobileAccordionButtons = () => Array.from(panel.querySelectorAll('.nav-hub-acc-btn'));

  const resetMobileAccordions = ({ firstOpen = false } = {}) => {
    try {
      const mobile = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
      const buttons = mobileAccordionButtons();
      if (!mobile || !buttons.length) return;
      buttons.forEach((b, i) => {
        const shouldOpen = firstOpen && i == 0;
        b.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        const list = b.nextElementSibling;
        if (list instanceof HTMLElement) list.hidden = !shouldOpen;
      });
    } catch {}
  };

  // TOA:FIX (MW-AF) — Keep JS hide timers aligned with CSS animation duration.
  // - When motion is allowed, we wait long enough for the open/close easing to finish
  //   before applying [hidden], otherwise the hub can look like it 'snaps' shut.
  // - When prefers-reduced-motion is enabled, we close immediately.
  const CLOSE_DELAY = (() => {
    try {
      const motionAllowed = document.documentElement.classList.contains('no-reduced-motion');
      // Keep in lock-step with css/style.css premium nav-hub continuity patch.
      // Slightly longer close keeps the drawer feeling smooth instead of snapping shut.
      return motionAllowed ? 880 : 0;
    } catch {
      return 760;
    }
  })();

  const updatePreview = (link) => {
    if (!link) return;
    const src = link.getAttribute('data-hub-img');
    const t = link.getAttribute('data-hub-title') || (link.textContent || '').trim();
    const d = link.getAttribute('data-hub-desc') || '';
    if (previewImg && src) { try { previewImg.src = src; } catch {} }
    if (previewTitle) previewTitle.textContent = t;
    if (previewDesc) previewDesc.textContent = d;
  };

  const isOpen = () => !panel.hidden;

  const open = () => {
    if (closeTimer) { try { clearTimeout(closeTimer); } catch {} closeTimer = null; }

    // Always reopen compact portrait/mobile accordions from a clean state.
    // The premium expectation here is that the hub itself resets when fully closed.
    resetMobileAccordions({ firstOpen: false });

    openStamp = performance && performance.now ? performance.now() : Date.now();

    // MW-BD — clear sticky-header focus residue before the panel animates in.
    try {
      const active = document.activeElement;
      if (active && typeof active.blur === 'function') active.blur();
    } catch {}

    panel.hidden = false;
    panel.removeAttribute('aria-hidden');
    try { requestAnimationFrame(() => panel.classList.add('nav-hub-panel--open')); } catch { panel.classList.add('nav-hub-panel--open'); }
    setExpanded(true);

    try { document.documentElement.classList.add('nav-hub-open'); } catch {}

    // Never let the theme popover remain open while the hub menu is open.
    try {
      if (typeof globalThis.toaCloseThemeMenu === 'function') {
        globalThis.toaCloseThemeMenu({ restoreFocus: false });
      } else {
        const themeMenu = document.getElementById('theme-menu');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeMenu) themeMenu.hidden = true;
        if (themeToggle) themeToggle.setAttribute('aria-expanded', 'false');
      }
    } catch {}

    // lock after the open class is applied (prevents layout jitters on some devices)
    lockScroll();

    // Note: close is handled by re-clicking toggles, Escape, or backdrop.

    if (hubBackdrop) {
      hubBackdrop.hidden = false;
      hubBackdrop.removeAttribute('aria-hidden');
      hubBackdrop.tabIndex = 0;
      try { requestAnimationFrame(() => hubBackdrop.classList.add('is-open')); } catch { hubBackdrop.classList.add('is-open'); }
    }

    // Prime preview to first hub link.
    const first = panel.querySelector('a[data-hub-img]');
    if (first) updatePreview(first);
    syncMobileTools();

    if (removeFocusTrap) { try { removeFocusTrap(); } catch {} removeFocusTrap = null; }

    try { panel.scrollTop = 0; } catch {}
    const closeButtonVisible = (() => {
      try {
        if (!closeButton) return false;
        if (closeButton.hidden) return false;
        const cs = window.getComputedStyle(closeButton);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
      } catch {
        return false;
      }
    })();
    const focusTarget = closeButtonVisible ? closeButton : (first || panel);
    removeFocusTrap = trapFocus(panel, focusTarget);

    resetMobileAccordions({ firstOpen: false });

    try {
      const preferredFocus = closeButtonVisible
        ? closeButton
        : (mobileAccordionButtons()[0] || first || panel);
      if (preferredFocus && typeof preferredFocus.focus === 'function') {
        requestAnimationFrame(() => {
          try { preferredFocus.focus({ preventScroll: true }); } catch { try { preferredFocus.focus(); } catch {} }
        });
      }
    } catch {}
  };

  const close = ({ restoreFocus = false } = {}) => {
    panel.classList.remove('nav-hub-panel--open');
    setExpanded(false);
    try { document.documentElement.classList.remove('nav-hub-open'); } catch {}

    // MW-BD — reset any sticky-header/menu focus residue before the hide timer completes.
    try {
      [closeButton, ...mobileAccordionButtons(), ...(toggles.length ? toggles : [toggle])].forEach((el) => {
        try { if (el && typeof el.blur === 'function') el.blur(); } catch {}
      });
    } catch {}

    // Note: no dedicated close button is required; toggles are self-contained.

    // release scroll immediately (no jump because we restore stored y)
    unlockScroll();

    if (removeFocusTrap) { try { removeFocusTrap(); } catch {} removeFocusTrap = null; }
    resetMobileAccordions({ firstOpen: false });
    closeTimer = setTimeout(() => {
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
    }, CLOSE_DELAY);

    if (hubBackdrop) {
      hubBackdrop.classList.remove('is-open');
      setTimeout(() => {
        try {
          hubBackdrop.hidden = true;
          hubBackdrop.setAttribute('aria-hidden', 'true');
          hubBackdrop.tabIndex = -1;
        } catch {}
      }, CLOSE_DELAY);
    }
    if (restoreFocus) {
      try { (lastToggle || toggle).focus({ preventScroll: true }); } catch {}
    } else {
      try { document.body.focus && document.body.focus({ preventScroll: true }); } catch {}
    }
  };

  if (closeButton) {
    reliablePress(closeButton, () => close({ restoreFocus: true }));
  }

  // Toggle open/close
  (toggles.length ? toggles : [toggle]).forEach((t) => {
    reliablePress(t, (e) => {
      lastToggle = t;
      if (isOpen()) close();
      else open();
    });
  });

  // Close on Escape
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!isOpen()) return;
    e.preventDefault();
    close({ restoreFocus: true });
  });

  // Click outside closes:
  // - Backdrop closes
  // - Clicks on the transparent panel area (outside the inner box) close
  // - Any click truly outside the panel/toggle closes
  if (hubBackdrop) hubBackdrop.addEventListener('click', () => close({ restoreFocus: true }));

  // Panel overlay click: if you click the panel container itself (not the inner), close.
  panel.addEventListener('click', (e) => {
    try {
      if (e.target === panel) close({ restoreFocus: true });
    } catch {}
  });

  // True "outside" click capture (installed once; gated to avoid open→close flicker)
  document.addEventListener('pointerdown', (e) => {
    if (!isOpen()) return;
    // avoid immediate close caused by the same click that opened it
    try {
      const now = performance && performance.now ? performance.now() : Date.now();
      if (now - openStamp < 140) return;
    } catch {}

    const t = e.target;
    if (!(t instanceof Node)) return;

    // Any hub toggle counts as an "inside" click.
    try {
      const inToggle = (toggles.length ? toggles : [toggle]).some((btn) => {
        try { return btn.contains(t); } catch { return false; }
      });
      if (inToggle) return;
    } catch {
      if (toggle.contains(t)) return;
    }
    if (panel.contains(t)) return;

    close({ restoreFocus: false });
  }, { capture: true });

  // Hover/focus updates for preview (desktop)
  panel.addEventListener('mouseover', (e) => {
    const a = (e.target instanceof Element) ? e.target.closest('a[data-hub-img]') : null;
    if (!a) return;
    updatePreview(a);
  });
  panel.addEventListener('focusin', (e) => {
    const a = (e.target instanceof Element) ? e.target.closest('a[data-hub-img]') : null;
    if (!a) return;
    updatePreview(a);
  });

  // Mobile accordion behavior (categories expand/collapse)
  const setupAccordion = () => {
    const buttons = Array.from(panel.querySelectorAll('.nav-hub-acc-btn'));
    if (!buttons.length) return;

    const isMobile = () => {
      try { return window.matchMedia && window.matchMedia('(max-width: 900px)').matches; } catch { return false; }
    };

    const applyMode = () => {
      const mobile = isMobile();
      buttons.forEach((b) => {
        const list = b.nextElementSibling;
        // TOA:FIX (MW-AF) — Desktop headings should not be extra tab-stops.
        // Accordion interaction is mobile-only; on desktop we remove the button from tab order.
        try {
          if (!mobile) {
            b.setAttribute('tabindex', '-1');
            b.setAttribute('aria-disabled', 'true');
          } else {
            b.setAttribute('tabindex', '0');
            b.removeAttribute('aria-disabled');
          }
        } catch {}

        if (!(list instanceof HTMLElement)) return;
        if (!mobile) {
          // Desktop: always open
          b.setAttribute('aria-expanded', 'true');
          list.hidden = false;
        } else {
          // Mobile: respect current aria-expanded
          const open = b.getAttribute('aria-expanded') === 'true';
          list.hidden = !open;
        }
      });
    };

    buttons.forEach((b) => {
      reliablePress(b, () => {
        try {
          if (!isMobile()) return;
          const open = b.getAttribute('aria-expanded') === 'true';
          // close others
          buttons.forEach((o) => {
            if (o === b) return;
            o.setAttribute('aria-expanded', 'false');
            const l = o.nextElementSibling;
            if (l instanceof HTMLElement) l.hidden = true;
          });
          b.setAttribute('aria-expanded', open ? 'false' : 'true');
          const list = b.nextElementSibling;
          if (list instanceof HTMLElement) list.hidden = open ? true : false;
        } catch {}
      });
    });

    applyMode();
    window.addEventListener('resize', applyMode, { passive: true });
  };

  setupAccordion();
  syncMobileTools();
  window.addEventListener('toa:themechange', syncMobileTools);

})();


// =====================================================================
// Footer "Ascend" — always scroll to true page top (not #main-content)
// =====================================================================
(function setupFooterAscend(){
  const links = Array.from(document.querySelectorAll('a.footer-backtotop'));
  if (!links.length) return;

  const goTop = (e) => {
    try { e.preventDefault(); } catch {}

    // Keep URL clean (avoid leaving a hash in history).
    try {
      if (location.hash) history.replaceState(null, document.title, location.pathname + location.search);
    } catch {}

    const behavior = (typeof prefersReducedMotion === 'function' && prefersReducedMotion()) ? 'auto' : 'smooth';
    try {
      window.scrollTo({ top: 0, left: 0, behavior });
    } catch {
      try { window.scrollTo(0, 0); } catch {}
    }
  };

  links.forEach((a) => {
    a.addEventListener('click', goTop);
    a.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      goTop(e);
    });
  });
})();


});
