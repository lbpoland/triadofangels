// js/utils.js
// Small helpers used across the site.
// ---------------------------------------------------------------------

/** Shorthand selectors */
export const $  = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

/** Make a URL/filename-safe slug */
export function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/['’]/g, '')         // drop apostrophes
    .replace(/&/g, ' and ')       // & -> and
    .replace(/[^a-z0-9]+/g, '-')  // non-word -> hyphen
    .replace(/^-+|-+$/g, '');     // trim hyphens
}

/** Parse querystring into an object */
export function getQuery() {
  return Object.fromEntries(new URL(location.href).searchParams.entries());
}

/** Format seconds to M:SS */
export function fmtDur(totalSeconds) {
  if (!Number.isFinite(+totalSeconds)) return '';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Safely read nested prop */
export function get(obj, path, def = undefined) {
  return path.split('.').reduce((acc, key) =>
    (acc && key in acc ? acc[key] : undefined), obj) ?? def;
}

/** Extract Spotify album ID from a full URL if needed */
export function spotifyAlbumId(url) {
  if (!url) return null;
  const m = String(url).match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

/**
 * Build a lyrics filename automatically from album id + track name.
 * Try two locations in order:
 *   1) /lyrics/<albumId>/<track-slug>.txt
 *   2) /lyrics/<track-slug>.txt
 * Returns { url, tried }.
 */
export function buildLyricsURL(albumId, trackTitle) {
  const trackSlug = slugify(trackTitle);
  const tries = [
    `/lyrics/${albumId}/${trackSlug}.txt`,
    `/lyrics/${trackSlug}.txt`,
  ];
  return { url: tries[0], tried: tries };
}

/** Fetch text with graceful 404 fallback across multiple candidate URLs */
export async function fetchFirstText(candidates) {
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return { ok: true, url, text: await res.text() };
    } catch (_) {}
  }
  return { ok: false };
}

/** Create an element with classes/attrs/HTML */
export function el(tag, { className, attrs, html } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (html != null) node.innerHTML = html;
  return node;
}
