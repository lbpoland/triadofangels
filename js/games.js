/* TOA GAMES HUB SCRIPT
   Scope: games studio + games arcade hub pages
   Constraints:
   - Static-only, no network calls, no tracking
   - No inline JS
   - Keyboard-first
*/

(function () {
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  function hydrateGamesFacts() {
    const counts = {
      gamesLive: $$('#games-playable-grid .hub-card').length,
      gamesPlanning: $$('#games-planning .hub-card').length,
      gamesRoutes: $$('#games-next .support-card').length,
      gamesLiveSection: $$('#games-live .hub-card').length,
      arcadeLive: $$('#arcade-builds-grid .hub-card').length,
      arcadeStatus: $$('#arcade-status .coming-soon-card').length,
      arcadeRoutes: $$('#arcade-next .support-card').length,
    };

    const values = [
      ['games-meta-live', counts.gamesLive],
      ['games-meta-planning', counts.gamesPlanning],
      ['games-meta-routes', counts.gamesRoutes],
      ['arcade-meta-live', counts.arcadeLive],
      ['arcade-meta-status', counts.arcadeStatus],
      ['arcade-meta-routes', counts.arcadeRoutes],
      ['games-playable-live', counts.gamesLive],
      ['games-playable-routes', counts.gamesRoutes],
      ['games-planning-count', counts.gamesPlanning],
      ['games-planning-live', counts.gamesLive],
      ['games-live-count', counts.gamesLiveSection],
      ['games-live-support', 1],
      ['arcade-builds-live', counts.arcadeLive],
      ['arcade-builds-routes', counts.arcadeRoutes],
    ];

    for (const [id, value] of values) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.textContent = String(value);
    }
  }

  function updateCountBadges() {
    const badges = $$('[data-games-count]');
    for (const b of badges) {
      const targetSel = b.getAttribute('data-games-count');
      if (!targetSel) continue;
      const target = $(targetSel);
      if (!target) continue;
      const cards = $$('.hub-card', target);
      b.textContent = String(cards.length);
    }
  }

  function setupFilter() {
    const forms = $$('[data-games-filter]');
    for (const form of forms) {
      const input = $('input[type="search"]', form);
      const targetSel = form.getAttribute('data-games-filter-target');
      const statusSel = form.getAttribute('data-games-filter-status');
      if (!input || !targetSel) continue;

      const target = $(targetSel);
      if (!target) continue;

      const status = statusSel ? $(statusSel) : null;
      const clearBtn = $('[data-games-clear]', form);
      const empty = target.id ? document.getElementById(target.id.replace(/-grid$/, '-empty')) : null;
      const resetBtn = empty ? $('[data-games-reset]', empty) : null;
      const cards = () => $$('.hub-card', target);

      const normalize = (s) => String(s || '').toLowerCase().trim();

      const apply = () => {
        const q = normalize(input.value);
        let shown = 0;
        const all = cards();
        for (const c of all) {
          const title = normalize($('.hub-card__title', c)?.textContent);
          const desc = normalize($('.hub-card__desc', c)?.textContent);
          const kicker = normalize($('.hub-card__kicker', c)?.textContent);
          const meta = normalize(c.getAttribute('data-tags') || '');

          const hit = !q || title.includes(q) || desc.includes(q) || kicker.includes(q) || meta.includes(q);
          c.hidden = !hit;
          c.setAttribute('aria-hidden', hit ? 'false' : 'true');
          if (hit) shown++;
        }

        if (clearBtn) clearBtn.hidden = !q;

        if (status) {
          const total = all.length;
          const label = (target.id === "arcade-builds-grid") ? "arcade builds" : "live builds";
          status.textContent = q
            ? `${shown} of ${total} ${label} shown for “${input.value}”.`
            : `Showing all ${shown} ${label}.`;
        }

        if (empty) empty.hidden = shown !== 0;
      };

      const clear = () => {
        input.value = '';
        input.focus({ preventScroll: true });
        apply();
      };

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        apply();
      });

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          clear();
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          clear();
        });
      }

      input.addEventListener('input', () => {
        window.requestAnimationFrame(apply);
      });

      form.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          clear();
        }
      });

      // initialize
      apply();
    }
  }

  function init() {
    hydrateGamesFacts();
    updateCountBadges();
    setupFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
