// js/streaming.js — Streaming hub enhancements (Wave O + Wave AP)
// Wave O:
// - Profile toggle updates the “Quick Listen” artist buttons (Triad vs ToA)
// - Album Jump selector driven by /js/data.js (truth-only catalog)
// - Per-album platform buttons for available links
// Wave AP:
// - Multi-instance Artist Gateway: supports Quick Listen panels on multiple pages (Streaming + About)
// - Verified Links Finder: search + scope filter for fast discovery on /streaming.html
// - Verified Links Copy buttons: progressive enhancement (no-JS fallback remains intact)
//
// CSP-safe: no inline scripts, no eval, no inline handlers.

import { albums } from './data.js';
import { applyStreamFinderHistoryState, applyStreamFinderRenderedState, applyStreamFinderScopeSelectionRuntimeState, buildStreamFinderIndex, clearAndFocusStreamFinderRuntimeState, handleStreamFinderEscapeRuntimeState, syncStreamFinderFromUrlState } from './finder-runtime-helpers.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function hydrateStreamingFacts() {
  const linksEl = document.getElementById('streaming-meta-links');
  const albumsEl = document.getElementById('streaming-meta-albums');
  const profilesEl = document.getElementById('streaming-meta-profiles');
  const proofEl = document.getElementById('streaming-proof-stat');
  const bridgeEl = document.getElementById('streaming-bridge-stat');
  const returnsEl = document.getElementById('streaming-returns-stat');
  if (!linksEl && !albumsEl && !profilesEl && !proofEl && !bridgeEl && !returnsEl) return;

  const links = $$('.stream-item', document.getElementById('verified-links')).length;
  const albums = $$('#toa-album-select option').filter((o) => o.value).length;
  const profiles = $$('[data-profile]', document.getElementById('gateway')).length;

  if (linksEl) linksEl.textContent = String(links);
  if (albumsEl) albumsEl.textContent = String(albums);
  if (profilesEl) profilesEl.textContent = String(profiles);
  if (proofEl) proofEl.textContent = `${links} verified links • ${albums} album links • ${profiles} profiles`;
  if (bridgeEl) bridgeEl.textContent = `${links} verified links • ${albums} album links • return to music, videos, search, or support when you need to.`;
  if (returnsEl) returnsEl.textContent = `${links} verified links • ${profiles} profiles • music, videos, and search stay close at hand`;
}

const ARTIST_PAGES = {
  triad: {
    label: 'Triad of Angels',
    links: {
      spotify: 'https://open.spotify.com/artist/57KgHoxG7paxKh3Q4pLXvP',
      appleMusic: 'https://music.apple.com/us/artist/triad-of-angels/1811109753',
      youTubeMusic: 'https://music.youtube.com/channel/UC4gnDALvpQXk7yHcKXmTMyQ',
      youtube: 'https://www.youtube.com/@triadofangels',
    },
  },
  toa: {
    label: 'ToA Studios',
    links: {
      spotify: 'https://open.spotify.com/artist/40BdnWGmvTVO60uEp1MLrA',
      appleMusic: 'https://music.apple.com/us/artist/toa-studios/1812346019',
      youTubeMusic: 'https://music.youtube.com/channel/UCtzgypYznTLsnVW_mZbVzVg',
      youtube: 'https://www.youtube.com/@ToAStudios',
    },
  },
};

const PLATFORM_LABELS = {
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  youTubeMusic: 'YouTube Music',
  youtube: 'YouTube',
};

const PLATFORM_ORDER = [
  'spotify',
  'appleMusic',
  'youTubeMusic',
  'youtube',
];

function safeText(s, fallback = '') {
  const t = typeof s === 'string' ? s.trim() : '';
  return t || fallback;
}

function normalizeArtist(s) {
  return safeText(s).toLowerCase();
}

function albumSortKey(a) {
  const year = safeText(a?.year).toLowerCase();
  return `${year} ${safeText(a?.title).toLowerCase()}`.trim();
}

function getAlbumGroups(list) {
  const triad = [];
  const toa = [];
  for (const a of list) {
    const artist = normalizeArtist(a?.artist);
    if (artist.includes('triad')) triad.push(a);
    else if (artist.includes('toa') || artist.includes('studios')) toa.push(a);
    else triad.push(a);
  }
  triad.sort((x, y) => albumSortKey(x).localeCompare(albumSortKey(y)));
  toa.sort((x, y) => albumSortKey(x).localeCompare(albumSortKey(y)));
  return { triad, toa };
}

function orderedLinks(linksObj) {
  const src = linksObj && typeof linksObj === 'object' ? linksObj : {};
  const out = [];
  const seen = new Set();
  for (const k of PLATFORM_ORDER) {
    const url = safeText(src[k]);
    if (!url) continue;
    out.push({ key: k, label: PLATFORM_LABELS[k] || k, url });
    seen.add(k);
  }
  for (const [k, v] of Object.entries(src)) {
    if (seen.has(k)) continue;
    const url = safeText(v);
    if (!url) continue;
    out.push({ key: k, label: PLATFORM_LABELS[k] || k, url });
  }
  return out;
}

function buildPlatformButton({ key, label, url }) {
  const a = document.createElement('a');
  a.className = 'platform-link';
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('referrerpolicy', 'no-referrer');
  a.setAttribute('data-platform', key);
  a.setAttribute('aria-label', `${label} (opens in a new tab)`);
  a.setAttribute('role', 'listitem');
  a.innerHTML = `<span class="platform-link__icon" aria-hidden="true">♪</span><span>${label}</span>`;
  return a;
}

function setDisabledLink(a, label) {
  a.className = 'platform-link';
  a.href = '#';
  a.setAttribute('aria-disabled', 'true');
  a.setAttribute('tabindex', '-1');
  a.setAttribute('role', 'listitem');
  a.innerHTML = `<span class="platform-link__icon" aria-hidden="true">♪</span><span>${label}</span>`;
}

function renderAlbumPlatformRow(row, album) {
  if (!row) return;
  row.innerHTML = '';

  const links = orderedLinks(album?.links);
  if (!links.length) {
    const p = document.createElement('p');
    p.className = 'muted micro listen-hint';
    p.textContent = 'No album-level links were found for this selection.';
    row.appendChild(p);
    return;
  }

  links.slice(0, 8).forEach((l) => row.appendChild(buildPlatformButton(l)));
}

// Shared clipboard helper (prefers global implementation when available).
async function copyText(text) {
  const value = String(text || '').trim();
  if (!value) return false;

  try {
    if (typeof window !== 'undefined' && window.__toaCopyText) {
      return Boolean(await window.__toaCopyText(value));
    }
  } catch {}

  // Fallback path for pages that don't load global.js first (or older snapshots).
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {}

  try {
    const ta = document.createElement('textarea');
    ta.className = 'toa-clipboard';
    ta.setAttribute('readonly', '');
    ta.value = value;
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    return Boolean(ok);
  } catch {
    return false;
  }
}

function toast(msg) {
  const text = String(msg || '').trim();
  if (!text) return;
  try { if (window.__toaToast) window.__toaToast(text, { duration: 3200 }); } catch {}
}

// =========================================================
// Wave AP — Multi-instance Artist Gateway (Streaming + About)
// Markup contract:
// - root container: [data-gateway="artist"]
// - profile buttons: .seg-toggle__btn[data-profile]
// - platform row: [data-gateway-row="artist"] containing anchors with data-platform keys
// - status: [data-gateway-status="artist"] (optional)
// =========================================================
function initArtistGateways() {
  const gateways = $$('[data-gateway="artist"]');
  if (!gateways.length) return;

  gateways.forEach((gateway) => {
    const segButtons = $$('.seg-toggle__btn', gateway);
    const row = $('[data-gateway-row="artist"]', gateway);
    const status = $('[data-gateway-status="artist"]', gateway);

    if (!segButtons.length || !row) return;

    const setProfile = (profile) => {
      const p = profile === 'toa' ? 'toa' : 'triad';

      // Update pressed state scoped to this gateway.
      segButtons.forEach((b) => {
        b.setAttribute('aria-pressed', (b.dataset.profile === p) ? 'true' : 'false');
      });

      // Update anchors in place (keeps layout stable).
      const links = ARTIST_PAGES[p]?.links || {};
      const anchors = $$('a.platform-link', row);
      anchors.forEach((a) => {
        const key = safeText(a.getAttribute('data-platform'));
        const url = safeText(links[key]);
        if (url) {
          a.href = url;
          a.setAttribute('aria-disabled', 'false');
          a.removeAttribute('tabindex');
          if (!a.hasAttribute('referrerpolicy')) a.setAttribute('referrerpolicy', 'no-referrer');
        } else {
          // Defensive disable if a key isn't supported in this snapshot.
          a.href = '#';
          a.setAttribute('aria-disabled', 'true');
          a.setAttribute('tabindex', '-1');
  a.setAttribute('role', 'listitem');
        }
      });

      if (status) {
        status.textContent = `Showing ${ARTIST_PAGES[p].label} artist pages. Switch profile to update buttons.`;
      }
    };

    segButtons.forEach((b) => {
      b.addEventListener('click', () => setProfile(b.dataset.profile || 'triad'));
    });

    setProfile('triad');
  });
}

// =========================================================
// Wave O — Album Jump (Streaming page only)
// =========================================================
function initAlbumJump() {
  const select = $('#toa-album-select');
  const row = $('#toa-album-platform-row');
  const status = $('#toa-album-status');

  if (!select || !row) return;

  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select an album…';
  placeholder.selected = true;
  placeholder.disabled = true;
  select.appendChild(placeholder);

  const groups = getAlbumGroups(Array.isArray(albums) ? albums : []);
  const addGroup = (label, arr) => {
    if (!arr.length) return;
    const og = document.createElement('optgroup');
    og.label = label;
    for (const a of arr) {
      const opt = document.createElement('option');
      opt.value = safeText(a?.id);
      const title = safeText(a?.title, 'Untitled');
      const year = safeText(a?.year);
      opt.textContent = year ? `${title} — ${year}` : title;
      og.appendChild(opt);
    }
    select.appendChild(og);
  };

  addGroup('Triad of Angels', groups.triad);
  addGroup('ToA Studios', groups.toa);

  // Disabled row initial (keeps layout calm)
  ['Spotify', 'Apple Music', 'YouTube Music', 'YouTube'].forEach((label) => {
    const a = document.createElement('a');
    setDisabledLink(a, label);
    row.appendChild(a);
  });

  if (status) status.textContent = 'Choose an album to show platform buttons.';

  select.addEventListener('change', () => {
    const id = safeText(select.value);
    const found = (Array.isArray(albums) ? albums : []).find((a) => safeText(a?.id) === id);
    if (!found) return;

    renderAlbumPlatformRow(row, found);

    if (status) {
      const title = safeText(found?.title, 'Album');
      const artist = safeText(found?.artist, 'Artist');
      status.textContent = `Showing streaming buttons for: ${title} — ${artist}.`;
    }
  });
}

// =========================================================
// Wave AP — Verified Links Copy Buttons (Streaming page only)
// Progressive enhancement:
// - Wraps each verified link in .stream-item and appends a Copy button
// - No-JS fallback remains as plain anchors
// =========================================================
function enhanceVerifiedLinks() {
  const grid = $('.stream-grid');
  if (!grid) return;

  const lists = $$('.stream-links', grid);
  lists.forEach((list) => {
    if (list.dataset.enhanced === '1') return;
    list.dataset.enhanced = '1';

    const anchors = $$('a', list);
    anchors.forEach((a) => {
      // Skip if already wrapped.
      if (a.closest('.stream-item')) return;

      const wrap = document.createElement('div');
      wrap.className = 'stream-item';
      wrap.setAttribute('role', 'listitem');

      const rawText = safeText(a.textContent);
      const label = rawText.split('\n')[0].trim() || 'Link';
      const badge = (a.querySelector && a.querySelector('.badge')) ? safeText(a.querySelector('.badge').textContent) : '';
      let host = '';
      try { host = (new URL(a.href)).hostname || ''; } catch {}
      wrap.dataset.search = `${label} ${badge} ${host} ${a.href}`.toLowerCase();

      // Insert wrapper before anchor, then move anchor inside wrapper.
      a.parentNode.insertBefore(wrap, a);
      wrap.appendChild(a);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stream-copy';
      btn.setAttribute('data-stream-copy', '1');
      btn.dataset.url = a.href;
      btn.dataset.label = label;
      btn.setAttribute('aria-label', `Copy ${label} link`);
      btn.textContent = 'Copy';
      wrap.appendChild(btn);
    });
  });

  grid.addEventListener('click', async (e) => {
    const t = e.target;
    const btn = t && (t instanceof Element) ? t.closest('button.stream-copy[data-stream-copy="1"]') : null;
    if (!btn) return;

    e.preventDefault();
    const url = safeText(btn.dataset.url);
    const label = safeText(btn.dataset.label, 'Link');

    const ok = await copyText(url);
    if (ok) toast(`Copied ${label} link.`);
    else toast('Copy failed. Please copy from the address bar.');
  }, { passive: false });
}

// =========================================================
// Wave AP — Verified Links Finder (Streaming page only)
// - Search filters across all verified link cards
// - Scope chips allow narrowing to All / Triad / ToA / Social
// =========================================================
function initStreamFinder() {
  const section = document.getElementById('finder') || document.querySelector('.stream-finder');
  if (!section) return;

  const input = $('#stream-search', section);
  const status = $('#stream-finder-status', section) || $('#stream-finder-status');
  const clearBtn = $('[data-stream-action="clear"]', section);
  const resetBtn = $('[data-stream-reset]', section);
  const empty = $('#stream-empty', section) || $('#stream-empty');
  const grid = document.getElementById('verified-links') || $('.stream-grid');

  if (!input || !grid) return;

  const form = input.closest('form');
  if (form) {
    form.addEventListener('submit', (e) => e.preventDefault());
  }

  const scopeButtons = $$('[data-stream-scope]', section);
  let scope = 'all';

  let index = buildStreamFinderIndex(grid);

  // -----------------------------------------
  // URL state (q + scope) — no tracking
  // -----------------------------------------
  let urlRaf = 0;
  const scheduleUrlWrite = (q, nextScope) => {
    if (urlRaf) return;
    urlRaf = requestAnimationFrame(() => {
      urlRaf = 0;
      applyStreamFinderHistoryState({ historyObj: window.history, locationObj: window.location, query: q, scope: nextScope });
    });
  };

  // -----------------------------------------
  // Apply filter
  // -----------------------------------------
  const apply = () => {
    // Keep index fresh if enhancement ran after init.
    // (Streaming boot order runs enhancement first, but this is defensive.)
    if (!index || !index.length) index = buildStreamFinderIndex(grid);

    const finderState = applyStreamFinderRenderedState(index, { inputEl: input, buttons: scopeButtons, clearBtn, statusEl: status, emptyEl: empty, query: input.value, scope });
    scope = finderState.scope;

    scheduleUrlWrite(input.value, scope);
  };

  // -----------------------------------------
  // Events
  // -----------------------------------------
  scopeButtons.forEach((b) => {
    b.addEventListener('click', () => {
      const nextState = applyStreamFinderScopeSelectionRuntimeState({ buttonEl: b, index, inputEl: input, buttons: scopeButtons, clearBtn, statusEl: status, emptyEl: empty, scope });
      scope = nextState.scope;
      scheduleUrlWrite(input.value, scope);
    });
  });

  const reset = () => {
    scope = 'all';
    const nextState = clearAndFocusStreamFinderRuntimeState({ index, inputEl: input, buttons: scopeButtons, clearBtn, statusEl: status, emptyEl: empty, scope });
    scope = nextState.scope;
    scheduleUrlWrite('', scope);
  };

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const nextState = clearAndFocusStreamFinderRuntimeState({ index, inputEl: input, buttons: scopeButtons, clearBtn, statusEl: status, emptyEl: empty, scope });
      scope = nextState.scope;
      scheduleUrlWrite('', scope);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', reset);
  }

  input.addEventListener('input', apply);

  // Keyboard shortcuts (Streaming finder only)
  // - Esc clears the query
  // - "/" focuses the finder when not typing elsewhere
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const nextState = handleStreamFinderEscapeRuntimeState({ index, inputEl: input, buttons: scopeButtons, clearBtn, statusEl: status, emptyEl: empty, scope });
      if (nextState.cleared) {
        e.preventDefault();
        scope = nextState.scope;
        scheduleUrlWrite('', scope);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (e.key !== '/') return;
    const active = document.activeElement;
    if (active && (active instanceof HTMLElement)) {
      const name = (active.tagName || '').toLowerCase();
      const editable = (name === 'input' || name === 'textarea' || name === 'select' || active.isContentEditable);
      if (editable) return;
    }
    e.preventDefault();
    try { input.focus({ preventScroll: true }); } catch {}
  });

  // Initialize from URL (deep-linking) and support back/forward.
  const initFromUrl = () => {
    const nextState = syncStreamFinderFromUrlState({ index, inputEl: input, buttons: scopeButtons, clearBtn, statusEl: status, emptyEl: empty, search: window.location.search || '' });
    scope = nextState.scope;
  };

  window.addEventListener('popstate', initFromUrl, { passive: true });

  initFromUrl();
}

// =========================================================
// Boot
// =========================================================
function boot() {
  hydrateStreamingFacts();
  initArtistGateways();
  initAlbumJump();
  enhanceVerifiedLinks();
  initStreamFinder();
}

document.addEventListener('DOMContentLoaded', boot);
