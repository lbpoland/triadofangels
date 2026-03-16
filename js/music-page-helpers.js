// js/music-page-helpers.js
// Helper-only music page utilities extracted from the legacy bridge module so
// non-detail runtime pages can avoid bridge-owned helper imports.

import { sanitizeTrackId } from './utils.js';

const SITE_ORIGIN = 'https://www.triadofangels.com';
const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const ensureObject = (v) => (isPlainObject(v) ? v : {});
const ensureString = (v) => (typeof v === 'string' ? v : '');

export const toAbsoluteSiteUrl = (urlOrPath) => {
  const s = ensureString(urlOrPath).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${SITE_ORIGIN}${s}`;
  return `${SITE_ORIGIN}/${s}`;
};

export const parseApproxDate = (album) => {
  const rd = ensureString(album?.releaseDate).trim();
  if (rd) {
    const t = Date.parse(rd);
    if (!Number.isNaN(t)) return t;
  }
  const yText = ensureString(album?.year);
  const m = yText.match(/(19|20)\d{2}/);
  if (m) {
    const y = Number(m[0]);
    const t = Date.parse(`${y}-01-01`);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
};

const titleFromId = (id) => {
  const s = ensureString(id).replace(/-/g, ' ').trim();
  return s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : '';
};

const hasMeaningfulTrackMeta = (meta) => {
  const m = ensureObject(meta);
  if (!m || !Object.keys(m).length) return false;
  if (ensureString(m.title) || ensureString(m.file) || ensureString(m.text) || ensureString(m.duration) || ensureString(m.story) || ensureString(m.behindTheScenes) || ensureString(m.video)) return true;
  if (m.musicPlayerId !== null && m.musicPlayerId !== undefined && ensureString(m.musicPlayerId)) return true;
  const links = ensureObject(m.links);
  return Object.values(links).some((v) => ensureString(v));
};

export const buildAlbumTrackList = (album) => {
  const a = isPlainObject(album) ? album : {};
  const titles = Array.isArray(a.tracks) ? a.tracks : [];
  const lyricsMap = ensureObject(a.lyrics);

  const normalizedLyrics = new Map();
  Object.keys(lyricsMap).forEach((rawId) => {
    const id = sanitizeTrackId(rawId);
    if (!id) return;
    const meta = ensureObject(lyricsMap[rawId]);
    const prev = normalizedLyrics.get(id) || {};
    normalizedLyrics.set(id, { ...prev, ...meta, links: ensureObject(meta.links || prev.links) });
  });

  const map = new Map();

  titles.forEach((rawTitle, idx) => {
    const title = ensureString(rawTitle).trim();
    const id = sanitizeTrackId(title || `track-${idx + 1}`);
    const meta = ensureObject(normalizedLyrics.get(id));
    map.set(id, { id, title: title || ensureString(meta.title) || titleFromId(id) || id, index: idx, ...meta, links: ensureObject(meta.links) });
  });

  normalizedLyrics.forEach((meta, id) => {
    if (map.has(id) || !hasMeaningfulTrackMeta(meta)) return;
    map.set(id, { id, title: ensureString(meta.title) || titleFromId(id) || id, index: null, ...meta, links: ensureObject(meta.links) });
  });

  const list = [...map.values()];
  list.sort((a, b) => {
    const ai = a.index === null ? 9999 : a.index;
    const bi = b.index === null ? 9999 : b.index;
    if (ai !== bi) return ai - bi;
    return ensureString(a.title).localeCompare(ensureString(b.title), undefined, { sensitivity: 'base' });
  });
  return list;
};

export const inferAlbumBuckets = (album) => {
  const g = ensureString(album?.genre).toLowerCase();
  const out = new Set();
  if (g.includes('worship') || g.includes('gospel') || g.includes('christian')) out.add('worship');
  if (g.includes('metal') || g.includes('hardcore')) out.add('metal');
  if (g.includes('country')) out.add('country');
  if (g.includes('trance') || g.includes('edm') || g.includes('dance') || g.includes('electronic') || g.includes('dnb') || g.includes('drum')) out.add('edm');
  if (g.includes('pop')) out.add('pop');
  if (g.includes('cinematic') || g.includes('orchestral') || g.includes('score')) out.add('cinematic');
  return [...out];
};
