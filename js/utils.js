// js/utils.js
// Shared lightweight utilities (no DOM assumptions). Keep this file dependency-free.

export function sanitizeTrackId(input = "") {
  // Used for query params, lyric keys, and track IDs.
  // Deterministic: lowercase, strip diacritics, keep a-z0-9, collapse to hyphens.
  const s0 = String(input ?? "").trim().toLowerCase();
  if (!s0) return "";

  // Normalize unicode and remove diacritics.
  let s = s0.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // Replace common punctuation variants.
  s = s
    .replace(/[’'`]/g, "")                 // apostrophes
    .replace(/[“”"]/g, "")                 // quotes
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ");

  // Replace any non-alphanumeric with hyphen, then collapse.
  s = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return s;
}

export function slugToTitle(slug = "") {
  const s = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  if (!s) return "";
  const stop = new Set(["of","the","and","a","an","to","in","on","for","at","by","from","with"]);
  return s
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i !== 0 && stop.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function safeText(s, max = 240) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

export function setMetaContent(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return false;
  el.setAttribute("content", value);
  return true;
}

export function setLinkHref(selector, href) {
  const el = document.querySelector(selector);
  if (!el) return false;
  el.setAttribute("href", href);
  return true;
}

export function ensureJsonLdScript() {
  let el = document.getElementById("dynamic-jsonld");
  if (el && el.tagName.toLowerCase() === "script") return el;
  el = document.createElement("script");
  el.id = "dynamic-jsonld";
  el.type = "application/ld+json";
  (document.head || document.documentElement).appendChild(el);
  return el;
}

export function writeJsonLd(obj) {
  const el = ensureJsonLdScript();
  el.textContent = JSON.stringify(obj);
  return el;
}

export function buildProdUrl(pathname, paramsObj) {
  const u = new URL(pathname, "https://www.triadofangels.com");
  if (paramsObj && typeof paramsObj === "object") {
    for (const [k, v] of Object.entries(paramsObj)) {
      if (v === undefined || v === null || v === "") continue;
      u.searchParams.set(k, String(v));
    }
  }
  return u.href;
}