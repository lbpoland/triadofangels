// js/videos.js — Videos hub enhancements (Wave MW-AC)
// Goals:
// - Advanced filtering (query + scope) across featured videos
// - View toggle: Rails (carousels) vs Grid (scan-friendly)
// - Accessibility-first: keyboard shortcuts, live status, no traps
// - CSP-safe: no inline handlers, no eval, no network calls

const $ = (sel, root = document) => {
  if (!root || typeof root.querySelector !== 'function') return null;
  return root.querySelector(sel);
};
const $$ = (sel, root = document) => {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  return Array.from(root.querySelectorAll(sel));
};

const safeText = (v) => String(v == null ? '' : v).trim();

const isEditable = (el) => {
  if (!(el instanceof HTMLElement)) return false;
  const name = (el.tagName || '').toLowerCase();
  if (name === 'input' || name === 'textarea' || name === 'select') return true;
  if (el.isContentEditable) return true;
  return false;
};

function hydrateVideoFacts() {
  const triad = document.getElementById('videos-meta-triad');
  const toa = document.getElementById('videos-meta-toa');
  const channels = document.getElementById('videos-meta-channels');
  const finderFeatured = document.getElementById('videos-finder-featured');
  const finderProfiles = document.getElementById('videos-finder-profiles');
  const triadStat = document.getElementById('videos-triad-stat');
  const toaStat = document.getElementById('videos-toa-stat');
  const gridStat = document.getElementById('videos-grid-stat');
  const channelStat = document.getElementById('videos-channel-stat');
  const companionStat = document.getElementById('videos-companion-stat');
  if (!triad && !toa && !channels && !finderFeatured && !finderProfiles && !triadStat && !toaStat && !gridStat && !channelStat && !companionStat) return;

  const triadRoot = document.getElementById('triad');
  const toaRoot = document.getElementById('toa');
  const channelsRoot = document.getElementById('channels');
  const gridRoot = document.getElementById('videos-grid');

  // Firefox / partial-build safety:
  // some snapshots may not ship a dedicated ToA rail section, so counts must
  // safely fall back to grid cards instead of assuming the rail root exists.

  const triadCount = $$('.index-video-item', triadRoot).length || $$('.video-card[data-video-scope="triad"]', gridRoot).length;
  const toaCount = $$('.index-video-item', toaRoot).length || $$('.video-card[data-video-scope="toa"]', gridRoot).length;
  const channelCount = $$('.platform-link', channelsRoot).length;
  const totalFeatured = triadCount + toaCount;

  if (triad) triad.textContent = String(triadCount);
  if (toa) toa.textContent = String(toaCount);
  if (channels) channels.textContent = String(channelCount);
  if (finderFeatured) finderFeatured.textContent = String(totalFeatured);
  if (finderProfiles) finderProfiles.textContent = toaCount > 0 ? '2' : '1';
  if (triadStat) triadStat.textContent = String(triadCount);
  if (toaStat) toaStat.textContent = String(toaCount);
  if (gridStat) gridStat.textContent = String(totalFeatured);
  if (channelStat) channelStat.textContent = String(channelCount);
  if (companionStat) companionStat.textContent = `${totalFeatured} featured videos • ${channelCount} official channels • collections and finder keep the watch path clear`;
}

function initVideosHub() {
  hydrateVideoFacts();
  const input = $('#video-search');
  const clearBtn = $('[data-video-action="clear"]');
  const resetBtn = $('[data-video-reset]');
  const presetBtns = $$('[data-video-preset]');
  const status = $('#video-search-status');
  const empty = $('#video-empty');

  const scopeBtns = $$('[data-video-control="scope"][data-video-scope]');
  const typeBtns = $$('[data-video-control="type"][data-video-type]');
  const viewBtns = $$('[data-video-control="view"][data-video-view]');

  const triadSection = document.getElementById('triad');
  const toaSection = document.getElementById('toa');
  const gridSection = document.getElementById('grid');
  const grid = document.getElementById('videos-grid');

  if (!input || !triadSection || !gridSection || !grid) return;

  const rails = [
    { scope: 'triad', section: triadSection, items: $$('.index-video-item', triadSection) },
  ];
  if (toaSection) {
    rails.push({ scope: 'toa', section: toaSection, items: $$('.index-video-item', toaSection) });
  }

  const gridCards = $$('.video-card', grid);
  const hasToaRail = Boolean(toaSection && rails.some((rail) => rail.scope === 'toa'));

  let scope = 'all';
  let type = 'all';
  let view = 'rails';

  const normalizeScope = (s) => {
    const v = safeText(s).toLowerCase();
    if (v === 'triad' || v === 'toa') return v;
    return 'all';
  };

  const normalizeView = (s) => {
    const v = safeText(s).toLowerCase();
    if (v === 'grid') return 'grid';
    return 'rails';
  };

  const normalizeType = (s) => {
    const v = safeText(s).toLowerCase();
    if (v === 'film' || v === 'video' || v === 'mix') return v;
    return 'all';
  };

  const setPressed = () => {
    scopeBtns.forEach((b) => {
      const v = normalizeScope(b.getAttribute('data-video-scope'));
      b.setAttribute('aria-pressed', (v === scope) ? 'true' : 'false');
    });

    typeBtns.forEach((b) => {
      const v = normalizeType(b.getAttribute('data-video-type'));
      b.setAttribute('aria-pressed', (v === type) ? 'true' : 'false');
    });

    viewBtns.forEach((b) => {
      const v = normalizeView(b.getAttribute('data-video-view'));
      b.setAttribute('aria-pressed', (v === view) ? 'true' : 'false');
    });
  };

  const titleOfRailItem = (item) => {
    const embed = item.querySelector && item.querySelector('lite-youtube[title]');
    const t = embed ? embed.getAttribute('title') : '';
    return safeText(t).toLowerCase();
  };

  const titleOfCard = (card) => safeText(card.getAttribute('data-video-title')).toLowerCase();

  const typeOfRailItem = (item) => normalizeType(item.getAttribute('data-video-type'));
  const typeOfCard = (card) => normalizeType(card.getAttribute('data-video-type'));

  const apply = () => {
    const q = safeText(input.value).toLowerCase();
    const hasQ = Boolean(q);

    if (clearBtn) clearBtn.hidden = !hasQ;

    // View visibility
    const effectiveView = (!hasToaRail && scope === 'toa' && view === 'rails') ? 'grid' : view;
    const showRails = (effectiveView === 'rails');
    const showGrid = (effectiveView === 'grid');

    gridSection.hidden = !showGrid;
    rails.forEach((r) => { r.section.hidden = !showRails; });

    // Apply filtering to both rails and grid (even when hidden so state stays consistent)
    let shownRailsItems = 0;
    let shownGridItems = 0;

    rails.forEach((r) => {
      const scopeOk = (scope === 'all') || (r.scope === scope);

      // Filter items
      let anyVisible = false;
      r.items.forEach((item) => {
        const t = titleOfRailItem(item);
        const it = typeOfRailItem(item);
        const typeOk = (type === 'all') || (it === type);
        const match = scopeOk && typeOk && (!hasQ || t.includes(q));
        item.hidden = !match;
        if (match) { anyVisible = true; shownRailsItems += 1; }
      });

      // Hide entire section if scope doesn't match or filtering yields no matches.
      const filteringActive = hasQ || (type !== 'all');
      r.section.hidden = !showRails || !scopeOk || (filteringActive && !anyVisible);
    });

    gridCards.forEach((card) => {
      const cardScope = normalizeScope(card.getAttribute('data-video-scope'));
      const scopeOk = (scope === 'all') || (cardScope === scope);
      const cardType = typeOfCard(card);
      const typeOk = (type === 'all') || (cardType === type);
      const t = titleOfCard(card);
      const match = scopeOk && typeOk && (!hasQ || t.includes(q));
      card.hidden = !match;
      if (match) shownGridItems += 1;
    });

    // Status
    const shown = (effectiveView === 'grid') ? shownGridItems : shownRailsItems;

    if (status) {
      const scopeLabel = scope === 'all' ? 'All' : (scope === 'toa' ? 'ToA Studios' : 'Triad');
      const typeLabel = type === 'all' ? 'All types' : (type === 'film' ? 'Album films' : (type === 'mix' ? 'Mixes' : 'Music videos'));
      const viewLabel = effectiveView === 'grid' ? 'Grid' : 'Rails';

      if (!hasQ && scope === 'all' && type === 'all') status.textContent = `Showing all ${shown} featured videos (${viewLabel} view).`;
      else if (!hasQ) status.textContent = `Showing ${shown} featured videos (${scopeLabel} • ${typeLabel} • ${viewLabel} view).`;
      else if (shown === 0) status.textContent = `No matches (Scope: ${scopeLabel} • ${typeLabel} • ${viewLabel}).`;
      else status.textContent = `${shown} matches (Scope: ${scopeLabel} • ${typeLabel} • ${viewLabel}).`;
    }

    if (empty) empty.hidden = shown !== 0;
  };

  // Buttons
  scopeBtns.forEach((b) => {
    b.addEventListener('click', () => {
      scope = normalizeScope(b.getAttribute('data-video-scope'));
      setPressed();
      apply();
    });
  });

  typeBtns.forEach((b) => {
    b.addEventListener('click', () => {
      type = normalizeType(b.getAttribute('data-video-type'));
      setPressed();
      apply();
    });
  });

  viewBtns.forEach((b) => {
    b.addEventListener('click', () => {
      view = normalizeView(b.getAttribute('data-video-view'));
      setPressed();
      apply();
    });
  });

  const reset = () => {
    scope = 'all';
    type = 'all';
    view = 'rails';
    input.value = '';
    setPressed();
    try { input.focus({ preventScroll: true }); } catch {}
    apply();
  };

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      try { input.focus({ preventScroll: true }); } catch {}
      apply();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', reset);
  }

  // Presets: buttons outside the finder can set scope/type/view and then scroll to the finder.
  presetBtns.forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    btn.addEventListener('click', () => {
      scope = normalizeScope(btn.getAttribute('data-video-scope'));
      type = normalizeType(btn.getAttribute('data-video-type'));
      view = normalizeView(btn.getAttribute('data-video-view'));
      setPressed();
      apply();

      const finder = document.getElementById('finder');
      if (finder) {
        try { finder.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
      }
      try { input.focus({ preventScroll: true }); } catch {}
    });
  });

  input.addEventListener('input', apply);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (safeText(input.value)) {
        e.preventDefault();
        input.value = '';
        apply();
      }
      return;
    }
  });

  // Note: "/" hotkey is handled globally (js/global.js) and respects [data-hotkey="search"].

  setPressed();
  apply();
}

document.addEventListener('DOMContentLoaded', initVideosHub);
