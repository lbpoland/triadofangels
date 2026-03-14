// js/lyrics.js — Lyrics library page controller (ESM)
// Builds a searchable, grouped lyrics index from js/data.js.
// Links point to canonical track folder pages.
//
// A11y + UX:
// - Toolbar is a real form role="search"; submit is prevented (no reload)
// - Escape clears filters and restores focus
// - Results meta is role="status" and stays truth-only
// - List semantics: #lyrics-album-list role=list and albums role=listitem
//
// Performance:
// - Render batching via requestAnimationFrame (avoids re-render storms)
// - DOM nodes only (no unsafe HTML injection)

import { albums, buildAlbumTrackList, parseApproxDate } from './data.js';
import { trackCanonicalPath, albumCanonicalPath } from './routes.js';

const qs = (sel, root = document) => root.querySelector(sel);
const ensureString = (v) => (typeof v === 'string' ? v.trim() : '');
const normalize = (s) => ensureString(s).toLowerCase();

const state = {
  query: '',
  sort: 'featured'
};

let BASE_BLOCKS = [];
let raf = 0;
let lastKey = '';

function hasLyrics(track) {
  const file = ensureString(track?.file);
  const text = ensureString(track?.text);
  return Boolean(file || text);
}

function normalizeCover(album) {
  const c = ensureString(album?.cover);
  if (!c) return '';
  if (c.startsWith('http://') || c.startsWith('https://')) return c;
  return c.startsWith('/') ? c : '/' + c.replace(/^\/+/, '');
}

function buildAlbumBlocks() {
  const list = [];

  for (const album of albums || []) {
    const albumId = ensureString(album?.id);
    if (!albumId) continue;

    const tracks = buildAlbumTrackList(album).filter(hasLyrics);
    if (!tracks.length) continue;

    list.push({
      album,
      albumId,
      title: ensureString(album?.title) || albumId,
      artist: ensureString(album?.artist) || 'Triad of Angels & ToA Studios',
      genre: ensureString(album?.genre),
      year: ensureString(album?.year),
      cover: normalizeCover(album),
      tracks
    });
  }

  return list;
}

function applyQuery(blocks) {
  const q = normalize(state.query);
  if (!q) return blocks;

  return blocks
    .map((b) => {
      const albumHay = [b.title, b.artist, b.genre, b.year].map(normalize).join(' ');
      const tracks = b.tracks.filter((t) => {
        const hay = [t.title, t.story, t.behindTheScenes].map(normalize).join(' ');
        return albumHay.includes(q) || hay.includes(q);
      });
      if (!tracks.length && !albumHay.includes(q)) return null;
      return { ...b, tracks };
    })
    .filter(Boolean);
}

function sortBlocks(blocks) {
  const arr = [...blocks];

  if (state.sort === 'az' || state.sort === 'za') {
    arr.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    if (state.sort === 'za') arr.reverse();
    return arr;
  }

  if (state.sort === 'album') {
    // Keep data order
    return arr;
  }

  // featured: newest first, then Triad of Angels first
  arr.sort((a, b) => {
    const aTriad = normalize(a.artist).includes('triad') ? 0 : 1;
    const bTriad = normalize(b.artist).includes('triad') ? 0 : 1;
    if (aTriad !== bTriad) return aTriad - bTriad;
    return parseApproxDate(b.album) - parseApproxDate(a.album);
  });
  return arr;
}

function hydrateLyricsFacts(blocks) {
  const albumEl = document.getElementById('lyrics-meta-albums');
  const trackEl = document.getElementById('lyrics-meta-tracks');
  const artistEl = document.getElementById('lyrics-meta-artists');
  const sectionAlbums = document.getElementById('lyrics-library-albums');
  const sectionTracks = document.getElementById('lyrics-library-tracks');
  const sectionArtists = document.getElementById('lyrics-library-artists');
  if (!albumEl && !trackEl && !artistEl && !sectionAlbums && !sectionTracks && !sectionArtists) return;

  const albumsTotal = blocks.length;
  const trackTotal = blocks.reduce((sum, block) => sum + block.tracks.length, 0);
  const artistTotal = new Set(blocks.map((block) => normalize(block.artist)).filter(Boolean)).size;

  if (albumEl) albumEl.textContent = String(albumsTotal);
  if (trackEl) trackEl.textContent = String(trackTotal);
  if (artistEl) artistEl.textContent = String(artistTotal);
  if (sectionAlbums) sectionAlbums.textContent = String(albumsTotal);
  if (sectionTracks) sectionTracks.textContent = String(trackTotal);
  if (sectionArtists) sectionArtists.textContent = String(artistTotal);
}

function setMetaText(totalAlbums, totalTracks) {
  const meta = qs('#lyrics-results-meta');
  if (!meta) return;

  const badge = document.getElementById('lyrics-count-badge');
  if (badge) {
    badge.textContent = String(totalTracks);
    badge.setAttribute('aria-label', `${totalTracks} track${totalTracks === 1 ? '' : 's'} with lyrics`);
  }

  const q = ensureString(state.query);
  const prefix = q ? `Results for “${q}” — ` : '';
  meta.textContent = `${prefix}${totalAlbums} album${totalAlbums === 1 ? '' : 's'} • ${totalTracks} track${totalTracks === 1 ? '' : 's'} with lyrics`;
}

function render(blocks) {
  const host = qs('#lyrics-album-list');
  if (!host) return;

  const empty = qs('#lyrics-no-results');

  host.setAttribute('aria-busy', 'true');
  host.dataset.loading = 'true';
  host.replaceChildren();

  let trackCount = 0;

  const frag = document.createDocumentFragment();

  for (const b of blocks) {
    trackCount += b.tracks.length;

    const card = document.createElement('article');
    card.className = 'lyrics-album';
    card.setAttribute('role', 'listitem');

    const head = document.createElement('div');
    head.className = 'lyrics-album__head';

    const coverWrap = document.createElement('a');
    coverWrap.className = 'lyrics-album__cover';
    coverWrap.href = albumCanonicalPath(b.albumId);
    coverWrap.setAttribute('aria-label', `Open album: ${b.title}`);

    if (b.cover) {
      const img = document.createElement('img');
      img.src = b.cover;
      img.alt = `${b.title} album cover`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 168;
      img.height = 168;
      img.referrerPolicy = 'no-referrer';
      coverWrap.appendChild(img);
    }

    const meta = document.createElement('div');
    meta.className = 'lyrics-album__meta';

    const h2 = document.createElement('h2');
    const a = document.createElement('a');
    a.href = albumCanonicalPath(b.albumId);
    a.textContent = b.title;
    h2.appendChild(a);

    const p = document.createElement('p');
    p.textContent = b.year ? `${b.artist} • ${b.year}` : b.artist;

    meta.appendChild(h2);
    meta.appendChild(p);

    head.appendChild(coverWrap);
    head.appendChild(meta);
    card.appendChild(head);

    const list = document.createElement('div');
    list.className = 'lyrics-tracklist';

    for (const t of b.tracks) {
      const row = document.createElement('div');
      row.className = 'lyrics-track';

      const left = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'lyrics-track__title';
      title.textContent = ensureString(t.title) || t.id;

      const hint = document.createElement('p');
      hint.className = 'lyrics-track__hint';
      hint.textContent = b.genre ? b.genre : 'Open track page for lyrics + notes';

      left.appendChild(title);
      left.appendChild(hint);

      const actions = document.createElement('div');
      actions.className = 'lyrics-track__actions';

      const open = document.createElement('a');
      open.className = 'btn btn--ghost btn-small';
      open.href = trackCanonicalPath(b.albumId, t.id);
      open.textContent = 'Open';

      actions.appendChild(open);
      row.appendChild(left);
      row.appendChild(actions);

      list.appendChild(row);
    }

    card.appendChild(list);
    frag.appendChild(card);
  }

  host.appendChild(frag);

  host.setAttribute('aria-busy', 'false');
  host.dataset.loading = 'false';

  setMetaText(blocks.length, trackCount);
}

function scheduleRender() {
  if (raf) window.cancelAnimationFrame(raf);
  const key = `${state.sort}::${state.query}`;
  raf = window.requestAnimationFrame(() => {
    raf = 0;
    if (key === lastKey) return;
    lastKey = key;
    const filtered = sortBlocks(applyQuery(BASE_BLOCKS));
    render(filtered);
  });
}

function clearFilters({ focusInput = true } = {}) {
  state.query = '';
  state.sort = 'featured';

  const input = qs('#lyrics-search-input');
  const sort = qs('#lyrics-sort-select');
  if (input) input.value = '';
  if (sort) sort.value = 'featured';

  scheduleRender();

  if (focusInput) {
    try { input?.focus({ preventScroll: true }); } catch {}
  }
}

function init() {
  BASE_BLOCKS = buildAlbumBlocks();
  hydrateLyricsFacts(BASE_BLOCKS);

  const form = qs('#lyrics-toolbar');
  const input = qs('#lyrics-search-input');
  const sort = qs('#lyrics-sort-select');

  if (form) {
    form.addEventListener('submit', (e) => {
      // This toolbar is a filter UI, not a navigation search.
      e.preventDefault();
    });

    form.addEventListener('click', (e) => {
      const t = e.target;
      const btn = t && (t instanceof Element) ? t.closest('button[data-action]') : null;
      if (!btn) return;
      const action = ensureString(btn.getAttribute('data-action')).toLowerCase();
      if (action === 'clear') {
        e.preventDefault();
        clearFilters({ focusInput: true });
      }
    });

    form.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        clearFilters({ focusInput: true });
      }
    });
  }

  if (input) {
    input.addEventListener('input', () => {
      state.query = input.value || '';
      scheduleRender();
    });
  }

  if (sort) {
    sort.addEventListener('change', () => {
      state.sort = sort.value || 'featured';
      scheduleRender();
    });
  }

  // Initial paint.
  scheduleRender();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
