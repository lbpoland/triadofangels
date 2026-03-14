import { sanitizeTrackId } from './utils.js';
/* js/routes.js
   Canonical folder routing + legacy template compatibility.
*/
export const SITE_ORIGIN = "https://www.triadofangels.com";

function stripIndexHtml(seg) {
  return seg === "index.html" ? "" : seg;
}

function cleanSegments(pathname) {
  const raw = String(pathname || "/")
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(stripIndexHtml)
    .filter(Boolean);

  return raw.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
}

function encSeg(s) {
  return encodeURIComponent(String(s || "").trim());
}

export function parseRouteFromLocation(loc = window.location) {
  const seg = cleanSegments(loc.pathname);

  if (seg[0] === "music" && seg[1] === "albums" && seg[2]) {
    return { kind: "album", albumId: seg[2] };
  }
  if (seg[0] === "music" && seg[1] === "tracks" && seg[2] && seg[3]) {
    return { kind: "track", albumId: seg[2], trackId: seg[3] };
  }
  if (seg[0] === "publishing" && seg[1] === "books" && seg[2]) {
    return { kind: "book", bookId: seg[2] };
  }
  if (seg[0] === "games" && seg[1]) {
    return { kind: "game", gameId: seg[1] };
  }
  return { kind: "unknown" };
}

export function getQueryParam(name, loc = window.location) {
  const u = new URL(loc.href);
  const v = u.searchParams.get(name);
  return v ? v.trim() : "";
}

export function getAlbumId(loc = window.location) {
  const r = parseRouteFromLocation(loc);
  if (r.kind === "album" && r.albumId) return r.albumId;
  return getQueryParam("album", loc) || getQueryParam("id", loc);
}

export function getTrackIds(loc = window.location) {
  const r = parseRouteFromLocation(loc);
  if (r.kind === "track" && r.albumId && r.trackId) {
    return { albumId: r.albumId, trackId: r.trackId };
  }

  // Legacy support:
  // - /track.html?album=<album>&track=<track>
  // - /track.html?album=<album>&id=<track>  (older)
  // - /track.html?id=<track>&album=<album>  (older)
  const albumId = getQueryParam("album", loc) || "";
  const trackId = getQueryParam("track", loc) || getQueryParam("id", loc) || "";

  return { albumId, trackId };
}

export function getBookId(loc = window.location) {
  const r = parseRouteFromLocation(loc);
  if (r.kind === "book" && r.bookId) return r.bookId;
  return getQueryParam("id", loc) || getQueryParam("book", loc);
}

export function albumCanonicalPath(albumId) {
  return `/music/albums/${encSeg(albumId)}/`;
}
export function albumCanonicalAbs(albumId) {
  return `${SITE_ORIGIN}${albumCanonicalPath(albumId)}`;
}

export function trackCanonicalPath(albumId, trackId) {
  const safeTrackId = sanitizeTrackId(trackId) || String(trackId || '').trim();
  return `/music/tracks/${encSeg(albumId)}/${encSeg(safeTrackId)}/`;
}
export function trackCanonicalAbs(albumId, trackId) {
  return `${SITE_ORIGIN}${trackCanonicalPath(albumId, trackId)}`;
}

export function bookCanonicalPath(bookId) {
  return `/publishing/books/${encSeg(bookId)}/`;
}
export function bookCanonicalAbs(bookId) {
  return `${SITE_ORIGIN}${bookCanonicalPath(bookId)}`;
}

/* Legacy templates kept functional */
export function albumLegacyPath(albumId) {
  return `/album.html?album=${encSeg(albumId)}`;
}
export function trackLegacyPath(albumId, trackId) {
  const safeTrackId = sanitizeTrackId(trackId) || String(trackId || '').trim();
  return `/track.html?album=${encSeg(albumId)}&track=${encSeg(safeTrackId)}`;
}
export function bookLegacyPath(bookId) {
  return `/book.html?id=${encSeg(bookId)}`;
}
export function gameCanonicalPath(gameId) {
  return `/games/${encSeg(gameId)}/`;
}
export function gameCanonicalAbs(gameId) {
  return `${SITE_ORIGIN}${gameCanonicalPath(gameId)}`;
}
