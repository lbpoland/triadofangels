/* js/music-ui.js
   Shared safe DOM + head/meta + JSON-LD helpers (CSP-friendly).
*/
import { SITE_ORIGIN } from "./routes.js";
export { SITE_ORIGIN };

export function $(id) { return document.getElementById(id); }
export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function safeText(el, text) {
  if (!el) return;
  el.textContent = text == null ? "" : String(text);
}

export function clear(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === "class") node.className = String(v);
    else if (k === "text") node.textContent = String(v);
    else if (k.startsWith("aria-")) node.setAttribute(k, String(v));
    else if (k === "dataset" && typeof v === "object") {
      for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = String(dv);
    } else node.setAttribute(k, String(v));
  }
  for (const c of children || []) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

/* Head/meta helpers */
function upsertMeta(selector, attrs) {
  let m = document.head.querySelector(selector);
  if (!m) {
    m = document.createElement("meta");
    document.head.appendChild(m);
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    m.setAttribute(k, String(v));
  }
  return m;
}

export function setTitle(text) { document.title = String(text || ""); }

export function setMetaName(name, content) {
  return upsertMeta(`meta[name="${CSS.escape(name)}"]`, { name, content: String(content || "") });
}

export function setMetaProperty(property, content) {
  return upsertMeta(`meta[property="${CSS.escape(property)}"]`, { property, content: String(content || "") });
}

export function setCanonical(urlAbs) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", String(urlAbs || `${SITE_ORIGIN}/`));
}

export function injectJsonLd(obj) {
  const json = JSON.stringify(obj, null, 2);
  let s = document.getElementById("dynamic-jsonld");
  if (!s) {
    s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "dynamic-jsonld";
    document.head.appendChild(s);
  }
  s.textContent = json;
}

export function absolutizeMaybe(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${SITE_ORIGIN}${u}`;
  return `${SITE_ORIGIN}/${u}`;
}

export function clampDescription(s, max = 180) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}