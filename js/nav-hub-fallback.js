(function initToaNavHubFallback(){
  const boot = () => {
    try {
      if (globalThis.__toaNavHubBound) return;
      const nav = document.querySelector('[data-nav="primary"]');
      if (!nav) return;

      const panel = nav.querySelector('.nav-hub-panel');
      const toggles = Array.from(nav.querySelectorAll('[data-hub-toggle="true"]'));
      const backdrop = nav.querySelector('.nav-hub-backdrop');
      const previewImg = panel ? panel.querySelector('.nav-hub-preview__img') : null;
      const previewTitle = panel ? panel.querySelector('.nav-hub-preview__title') : null;
      const previewDesc = panel ? panel.querySelector('.nav-hub-preview__desc') : null;
      const mobileToolsRow = panel ? panel.querySelector('.nav-hub-mobile-tools') : null;

      if (!panel || !toggles.length) return;
      if (panel.dataset.toaFallbackBound === 'true') return;
      panel.dataset.toaFallbackBound = 'true';
      try { globalThis.__toaNavHubBound = true; } catch {}

      const isCompactPortrait = () => Boolean(window.matchMedia && window.matchMedia('(max-width: 900px) and (orientation: portrait)').matches);
      const isCompact = () => Boolean(window.matchMedia && window.matchMedia('(max-width: 900px)').matches);

      const currentTheme = () => {
        const theme = (document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'toa').toLowerCase();
        return theme === 'contrast' ? 'dark' : theme;
      };

      const syncMobileTools = () => {
        if (!(mobileToolsRow instanceof HTMLElement)) return;
        mobileToolsRow.querySelectorAll('[data-mobile-theme]').forEach((btn) => {
          const active = btn.getAttribute('data-mobile-theme') === currentTheme();
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          if (btn.dataset.fallbackThemeBound === 'true') return;
          btn.dataset.fallbackThemeBound = 'true';
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

      const setExpanded = (open) => {
        toggles.forEach((t) => {
          try { t.setAttribute('aria-expanded', open ? 'true' : 'false'); } catch {}
          try {
            if (t.classList.contains('nav-toggle')) {
              t.setAttribute('aria-label', open ? 'Close site menu' : 'Open site menu');
            }
          } catch {}
        });
      };

      const syncAccordionMode = () => {
        panel.querySelectorAll('.nav-hub-acc-btn').forEach((btn) => {
          const list = btn.nextElementSibling;
          if (!(list instanceof HTMLElement)) return;
          if (!isCompact()) {
            btn.setAttribute('aria-expanded', 'true');
            btn.setAttribute('tabindex', '-1');
            btn.setAttribute('aria-disabled', 'true');
            list.hidden = false;
          } else {
            const open = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('tabindex', '0');
            btn.removeAttribute('aria-disabled');
            list.hidden = !open;
          }
        });
      };

      const resetAccordions = () => {
        if (!isCompactPortrait()) return;
        panel.querySelectorAll('.nav-hub-acc-btn').forEach((btn) => {
          const list = btn.nextElementSibling;
          btn.setAttribute('aria-expanded', 'false');
          btn.setAttribute('tabindex', '0');
          btn.removeAttribute('aria-disabled');
          if (list instanceof HTMLElement) list.hidden = true;
        });
      };

      const updatePreview = (link) => {
        if (!(link instanceof Element)) return;
        const src = link.getAttribute('data-hub-img');
        const title = link.getAttribute('data-hub-title') || (link.textContent || '').trim();
        const desc = link.getAttribute('data-hub-desc') || '';
        if (previewImg && src) previewImg.src = src;
        if (previewTitle) previewTitle.textContent = title;
        if (previewDesc) previewDesc.textContent = desc;
      };

      const open = () => {
        resetAccordions();
        panel.hidden = false;
        panel.removeAttribute('aria-hidden');
        panel.classList.add('nav-hub-panel--open');
        document.documentElement.classList.add('nav-hub-open');
        document.body.classList.add('nav-hub-lock');
        setExpanded(true);
        if (backdrop) {
          backdrop.hidden = false;
          backdrop.removeAttribute('aria-hidden');
          backdrop.classList.add('is-open');
          backdrop.tabIndex = 0;
        }
        const first = panel.querySelector('a[data-hub-img]');
        if (first) updatePreview(first);
        syncAccordionMode();
        syncMobileTools();
      };

      const close = (restoreFocus) => {
        resetAccordions();
        panel.classList.remove('nav-hub-panel--open');
        panel.hidden = true;
        panel.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('nav-hub-open');
        document.body.classList.remove('nav-hub-lock');
        setExpanded(false);
        if (backdrop) {
          backdrop.classList.remove('is-open');
          backdrop.hidden = true;
          backdrop.setAttribute('aria-hidden', 'true');
          backdrop.tabIndex = -1;
        }
        if (restoreFocus) {
          try { toggles[0].focus({ preventScroll: true }); } catch {}
        }
      };

      toggles.forEach((toggle) => {
        const handler = (e) => {
          try { e.preventDefault(); } catch {}
          try { e.stopPropagation(); } catch {}
          if (panel.hidden) open();
          else close(false);
        };
        toggle.addEventListener('click', handler);
        toggle.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          handler(e);
        });
      });

      if (backdrop) backdrop.addEventListener('click', () => close(true));
      panel.addEventListener('click', (e) => { if (e.target === panel) close(true); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(true); });
      document.addEventListener('pointerdown', (e) => {
        if (panel.hidden) return;
        const t = e.target;
        if (!(t instanceof Node)) return;
        if (panel.contains(t)) return;
        if (toggles.some((btn) => btn.contains(t))) return;
        close(false);
      }, { capture: true });

      panel.addEventListener('mouseover', (e) => {
        const link = e.target instanceof Element ? e.target.closest('a[data-hub-img]') : null;
        if (link) updatePreview(link);
      });
      panel.addEventListener('focusin', (e) => {
        const link = e.target instanceof Element ? e.target.closest('a[data-hub-img]') : null;
        if (link) updatePreview(link);
      });

      panel.querySelectorAll('.nav-hub-acc-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          if (!isCompact()) return;
          e.preventDefault();
          const willOpen = btn.getAttribute('aria-expanded') !== 'true';
          panel.querySelectorAll('.nav-hub-acc-btn').forEach((other) => {
            const list = other.nextElementSibling;
            other.setAttribute('aria-expanded', other === btn && willOpen ? 'true' : 'false');
            if (list instanceof HTMLElement) list.hidden = !(other === btn && willOpen);
          });
        });
      });

      window.addEventListener('resize', () => { syncAccordionMode(); syncMobileTools(); }, { passive: true });
      window.addEventListener('toa:themechange', syncMobileTools);
      syncAccordionMode();
      syncMobileTools();
    } catch {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
