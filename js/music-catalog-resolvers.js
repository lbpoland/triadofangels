// js/music-catalog-resolvers.js
// Controller-safe music entity resolution backed directly by generated artifacts.
// This keeps page-family controllers closer to structured generated ownership
// without breaking the stable bridge/helper modules.

import { sanitizeTrackId } from './utils.js';
import { albums } from './generated/music-library.data.js';
import { albumPositionIndex } from './generated/music-library.indexes.js';
import { albumsByPath, tracksByAlbum, tracksByAlbumAndId, tracksByPath } from './generated/music-library.lookup.js';

const asString = (value) => (typeof value === 'string' ? value.trim() : '');
const isPath = (value) => asString(value).startsWith('/');

function resolveAlbumIndex(idOrPath) {
  const key = asString(idOrPath);
  if (!key) return -1;
  const id = isPath(key) ? asString(albumsByPath?.[key]?.id) : key;
  const byIndex = typeof albumPositionIndex?.[id] === 'number' ? albumPositionIndex[id] : -1;
  if (byIndex >= 0 && albums[byIndex]) return byIndex;
  return albums.findIndex((album) => asString(album?.id) === id || asString(album?.slug) === id || asString(album?.canonicalPath) === key);
}

export function resolveAlbumRecord(idOrPath) {
  const index = resolveAlbumIndex(idOrPath);
  return index >= 0 ? albums[index] : null;
}

export function resolveAlbumControllerRecord(idOrPath) {
  const album = resolveAlbumRecord(idOrPath);
  if (!album) return null;
  const canonicalPath = asString(album?.canonicalPath) || asString(albumsByPath?.[asString(idOrPath)]?.canonicalPath);
  const compactTracks = Array.isArray(tracksByAlbum?.[album.id]) ? tracksByAlbum[album.id] : [];
  return {
    album,
    canonicalPath,
    compactTracks,
  };
}

export function resolveTrackControllerRecord(albumIdOrPath, trackIdOrPath) {
  const albumRecord = resolveAlbumControllerRecord(albumIdOrPath);
  if (!albumRecord) return null;

  const requestedTrackKey = asString(trackIdOrPath);
  const sanitizedTrackId = sanitizeTrackId(requestedTrackKey);
  const compactTracks = albumRecord.compactTracks;

  let compactTrack = null;
  if (sanitizedTrackId && tracksByAlbumAndId?.[albumRecord.album.id]?.[sanitizedTrackId]) {
    compactTrack = tracksByAlbumAndId[albumRecord.album.id][sanitizedTrackId];
  } else if (isPath(requestedTrackKey) && tracksByPath?.[requestedTrackKey]) {
    compactTrack = tracksByPath[requestedTrackKey];
  }

  if (!compactTrack && sanitizedTrackId) {
    compactTrack = compactTracks.find((track) => sanitizeTrackId(track?.id) === sanitizedTrackId || sanitizeTrackId(track?.title) === sanitizedTrackId) || null;
  }

  const trackIndex = compactTrack ? compactTracks.findIndex((track) => asString(track?.id) === asString(compactTrack?.id)) : -1;

  return {
    album: albumRecord.album,
    albumCanonicalPath: albumRecord.canonicalPath,
    compactTracks,
    track: compactTrack,
    trackIndex,
  };
}
