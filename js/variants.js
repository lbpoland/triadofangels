// js/variants.js — Optional responsive image variants helper (CSP-safe, static-hosting safe)
// This module is intentionally tolerant: if the variants manifest does not exist, everything falls back to the original src.

const MANIFEST_URL = "/assets/images/albums/variants/manifest.json";

/** @type {Promise<object|null> | null} */
let _manifestPromise = null;

async function fetchJsonSafe(url) {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const data = await res.json();
    return (data && typeof data === "object") ? data : null;
  } catch {
    return null;
  }
}

/**
 * Load the album cover variants manifest (if present).
 * Expected format:
 * {
 *   "version": 1,
 *   "generatedAt": "...",
 *   "covers": {
 *      "/assets/images/albums/wingsoffire-album.webp": {
 *         "sizes": [320, 480, 640, 800],
 *         "pattern": "/assets/images/albums/variants/wingsoffire-album-w{w}.webp"
 *      }
 *   }
 * }
 */
export function loadAlbumVariantManifest() {
  if (_manifestPromise) return _manifestPromise;
  _manifestPromise = fetchJsonSafe(MANIFEST_URL);
  return _manifestPromise;
}

function buildSrcsetFromEntry(entry) {
  if (!entry || !Array.isArray(entry.sizes) || !entry.pattern) return "";
  const parts = [];
  for (const w of entry.sizes) {
    const url = String(entry.pattern).replace("{w}", String(w));
    parts.push(`${url} ${w}w`);
  }
  return parts.join(", ");
}

/**
 * Apply srcset/sizes to an <img> once the manifest is available.
 * If manifest is missing or the cover key is absent, it does nothing.
 */
export async function applyAlbumCoverVariants(img, coverUrl, opts = {}) {
  if (!img || !coverUrl) return;
  const manifest = await loadAlbumVariantManifest();
  if (!manifest || !manifest.covers) return;

  const key = String(coverUrl);
  const entry = manifest.covers[key] || manifest.covers[key.replace(/^https?:\/\/[^/]+/i, "")] || null;
  const srcset = buildSrcsetFromEntry(entry);
  if (!srcset) return;

  img.srcset = srcset;

  // Reasonable default sizes for square cover art.
  // - Mobile: cover typically ~45–55vw (two-column grid / rail)
  // - Desktop: cover typically ~220–260px in grid
  const sizes = opts.sizes || "(max-width: 520px) 50vw, (max-width: 980px) 33vw, 260px";
  img.sizes = sizes;
}
