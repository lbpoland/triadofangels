// js/data.js
// Runtime music catalog helpers.
// Content source of truth now lives in content/source/music-library.authoritative.json
// and is built into js/generated/music-library.data.js by tools/toa-content-build.mjs.
// This module preserves the existing runtime helper surface for album/track pages.

import { sanitizeTrackId } from './utils.js';
import { toAbsoluteSiteUrl, parseApproxDate, buildAlbumTrackList, inferAlbumBuckets } from './music-page-helpers.js';
import { albums as generatedAlbums } from './generated/music-library.data.js';
import { albumPositionIndex, trackPositionIndexByAlbum } from './generated/music-library.indexes.js';
import { albumsById, albumsByPath, tracksByAlbumAndId, tracksByPath } from './generated/music-library.lookup.js';

export const albums = generatedAlbums;

/* =======================================================================
   Data normalization + helpers
   RULES:
   - Do NOT hand-edit js/generated/music-library.data.js.
   - Update the authoritative content JSON, then run the content build/QA flow.
   - The runtime helper surface below stays stable for existing pages/controllers.
======================================================================= */

const SITE_ORIGIN = 'https://www.triadofangels.com';

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

const ensureObject = (v) => (isPlainObject(v) ? v : {});

const ensureString = (v) => (typeof v === 'string' ? v : '');

const normalizeAlbum = (album) => {
  if (!isPlainObject(album)) return;

  album.id = ensureString(album.id);
  album.title = ensureString(album.title);
  album.artist = ensureString(album.artist);
  album.genre = ensureString(album.genre);
  album.year = ensureString(album.year);
  album.releaseDate = ensureString(album.releaseDate);
  album.cover = ensureString(album.cover);

  // Optional descriptive fields (safe fallbacks for rendering/UI)
  album.description = ensureString(album.description) || ensureString(album.artistInfo) || ensureString(album.artistDescription);
  album.artistInfo = ensureString(album.artistInfo);
  album.artistDescription = ensureString(album.artistDescription);
  // Optional tags
  album.tags = Array.isArray(album.tags) ? album.tags : [];

  album.links = ensureObject(album.links);
  album.tracks = Array.isArray(album.tracks) ? album.tracks : [];

  // Track meta map is stored under album.lyrics (legacy name kept for compatibility).
  album.lyrics = ensureObject(album.lyrics);

  Object.keys(album.lyrics).forEach((trackId) => {
    const t = ensureObject(album.lyrics[trackId]);
    t.file = ensureString(t.file);
    t.text = ensureString(t.text);
    t.duration = ensureString(t.duration);
    t.description = ensureString(t.description);
    t.story = ensureString(t.story);
    t.behindTheScenes = ensureString(t.behindTheScenes);
    t.musicPlayerId = ensureString(t.musicPlayerId);
    t.video = t.video || null;
    t.links = ensureObject(t.links);
    album.lyrics[trackId] = t;
  });
};

albums.forEach(normalizeAlbum);

// Helper exports are now sourced from js/music-page-helpers.js so non-detail runtime pages
// can adopt the same deterministic logic without importing this bridge module.
export { toAbsoluteSiteUrl, parseApproxDate, buildAlbumTrackList, inferAlbumBuckets };


const titleFromId = (id) => {
  const s = ensureString(id).replace(/-/g, ' ').trim();
  if (!s) return '';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Build a normalized track list for an album.
 * - Title order is derived from album.tracks (legacy array of strings) when present.
 * - Any extra entries in album.lyrics not represented in album.tracks are appended.
 */

export const getAlbumById = (albumId) => {
  const id = ensureString(albumId);
  if (albumsById?.[id]) return albumsById[id];
  const pos = albumPositionIndex?.[id];
  if (typeof pos === 'number' && albums[pos]) return albums[pos];
  return albums.find((a) => a.id === id) || null;
};

export const getAlbumByPath = (albumPath) => {
  const key = ensureString(albumPath).trim();
  if (!key) return null;
  return albumsByPath?.[key] || null;
};

export const getTrackById = (albumId, trackId) => {
  const albumKey = ensureString(albumId);
  const id = sanitizeTrackId(ensureString(trackId));
  if (tracksByAlbumAndId?.[albumKey]?.[id]) return tracksByAlbumAndId[albumKey][id];
  const album = getAlbumById(albumId);
  if (!album) return null;
  const list = buildAlbumTrackList(album);
  const pos = trackPositionIndexByAlbum?.[albumKey]?.[id];
  if (typeof pos === 'number' && list[pos]) return list[pos];
  return list.find((t) => t.id === id) || null;
};

export const getTrackByPath = (trackPath) => {
  const key = ensureString(trackPath).trim();
  if (!key) return null;
  return tracksByPath?.[key] || null;
};
