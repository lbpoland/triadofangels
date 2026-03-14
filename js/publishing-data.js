// js/publishing-data.js — Publishing library data (ESM)
// Single source of truth for the Publishing section.
// GitHub Pages (static hosting): data must be truthful. No fabricated titles, blurbs, dates, or links.
//
// This file drives:
// - /publishing.html (library grid + shelves + filters)
// - /publishing/sagas/* (saga hubs)
// - /publishing/series/* (series hubs)
// - /publishing/books/* (book pages)
// - /book.html (fallback renderer when a canonicalPath is not present)

const SITE_ORIGIN = "https://www.triadofangels.com";

const ensureString = (v) => (typeof v === "string" ? v : "");
const ensureArray = (v) => (Array.isArray(v) ? v : []);

const safeDate = (d) => {
  const s = ensureString(d).trim();
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
};

// ------------------------
// Amazon regional URL helper
// ------------------------
// Supported regions are deterministic Amazon marketplace domains; no fabricated IDs.
const AMAZON_DOMAINS = {
  // Core markets (explicitly referenced in earlier data)
  US: "https://www.amazon.com/dp/",
  UK: "https://www.amazon.co.uk/dp/",
  DE: "https://www.amazon.de/dp/",
  FR: "https://www.amazon.fr/dp/",
  ES: "https://www.amazon.es/dp/",
  IT: "https://www.amazon.it/dp/",

  // Additional Amazon marketplaces (domain mapping only).
  // Note: ASIN availability can vary by region; if a region does not carry a title,
  // Amazon will show a not-found or redirect experience. This mapping is still truthful
  // and deterministic: it produces the canonical regional dp/ASIN link.
  AU: "https://www.amazon.com.au/dp/",
  CA: "https://www.amazon.ca/dp/",
  JP: "https://www.amazon.co.jp/dp/",
  IN: "https://www.amazon.in/dp/",
  NL: "https://www.amazon.nl/dp/",
  SE: "https://www.amazon.se/dp/",
  PL: "https://www.amazon.pl/dp/",
  BR: "https://www.amazon.com.br/dp/",
  MX: "https://www.amazon.com.mx/dp/",
  SG: "https://www.amazon.sg/dp/",
};

export const amazonUrlFor = (asin, region) => {
  const a = ensureString(asin).trim();
  if (!a) return "";
  const r = ensureString(region).trim().toUpperCase();
  const base = AMAZON_DOMAINS[r] || AMAZON_DOMAINS.US;
  return `${base}${encodeURIComponent(a)}`;
};

// ------------------------
// Data locked to shipped covers plus provided Amazon ASINs/links
// ------------------------
//
// NOTE: If/when additional formats or store links become available, add them here—truthfully.
//
// Saga: The God Story Saga (Amazon series page ASIN: B0GPWWN7LD)
// Series: The Unseen Age
// Volumes:
//  - Volume I: Before Breath (ASIN: B0GPWC4527)
//  - Volume II: The Garden and the Fracture (ASIN: B0GQP9FP81)
//  - Volume III: The Watchers' Descent (ASIN: B0GR4HYXZW)

export const sagas = [
  {
    id: "the-god-story-saga",
    title: "The God Story Saga",
    shortTitle: "The God Story Saga",
    description: "A wider story world carrying the spiritual, symbolic, and long-form side of Triad of Angels through ToA Studios publishing.",
    canonicalPath: "/publishing/sagas/the-god-story-saga/",
    art: {
      wide: "/assets/images/books/the-god-story-saga/hero-wide.webp",
    },
    stores: {
      amazonRegional: {
        AU: amazonUrlFor("B0GPWWN7LD", "AU"),
        US: amazonUrlFor("B0GPWWN7LD", "US"),
        UK: amazonUrlFor("B0GPWWN7LD", "UK"),
        CA: amazonUrlFor("B0GPWWN7LD", "CA"),
        DE: amazonUrlFor("B0GPWWN7LD", "DE"),
        FR: amazonUrlFor("B0GPWWN7LD", "FR"),
        ES: amazonUrlFor("B0GPWWN7LD", "ES"),
        IT: amazonUrlFor("B0GPWWN7LD", "IT"),
        JP: amazonUrlFor("B0GPWWN7LD", "JP"),
        IN: amazonUrlFor("B0GPWWN7LD", "IN"),
        NL: amazonUrlFor("B0GPWWN7LD", "NL"),
        SE: amazonUrlFor("B0GPWWN7LD", "SE"),
      },
    },
  },
];

export const series = [
  {
    id: "unseen-age",
    sagaId: "the-god-story-saga",
    title: "The Unseen Age",
    shortTitle: "Unseen Age",
    description: "A series set within The God Story Saga, following the fracture between innocence, rebellion, consequence, and what rises from the unseen world around them.",
    canonicalPath: "/publishing/series/unseen-age/",
  },
];

export const books = [
  {
    id: "unseen-age-v1-before-breath",
    title: "Before Breath",
    subtitle: "The Unseen Age — Volume I",
    author: "Triad of Angels",
    year: "",
    status: "Live",
    sagaId: "the-god-story-saga",
    seriesId: "unseen-age",
    seriesNumber: 1,
    genres: [],
    formats: ["Kindle eBook"],
    logline: "The opening volume of The Unseen Age, laying the foundations of the world before the fracture fully reveals itself.",
    description: "Before Breath begins the series at its source, establishing the spiritual and symbolic ground the later volumes will deepen. It is the clearest starting point for the reading order.",
    canonicalPath: "/publishing/books/unseen-age-v1-before-breath/",
    covers: {
      portrait: "/assets/images/books/unseen-age-v1-before-breath/cover-portrait.webp",
      square: "/assets/images/books/unseen-age-v1-before-breath/cover-portrait.webp",
      wide: "/assets/images/books/unseen-age-v1-before-breath/cover-portrait.webp",
    },
    stores: {
      amazonRegional: {
        AU: amazonUrlFor("B0GPWC4527", "AU"),
        US: amazonUrlFor("B0GPWC4527", "US"),
        UK: amazonUrlFor("B0GPWC4527", "UK"),
        CA: amazonUrlFor("B0GPWC4527", "CA"),
        DE: amazonUrlFor("B0GPWC4527", "DE"),
        FR: amazonUrlFor("B0GPWC4527", "FR"),
        ES: amazonUrlFor("B0GPWC4527", "ES"),
        IT: amazonUrlFor("B0GPWC4527", "IT"),
        JP: amazonUrlFor("B0GPWC4527", "JP"),
        IN: amazonUrlFor("B0GPWC4527", "IN"),
        NL: amazonUrlFor("B0GPWC4527", "NL"),
        SE: amazonUrlFor("B0GPWC4527", "SE"),
      },
    },
  },
  {
    id: "unseen-age-v2-the-garden-and-the-fracture",
    title: "The Garden and the Fracture",
    subtitle: "The Unseen Age — Volume II",
    author: "Triad of Angels",
    year: "",
    status: "Live",
    sagaId: "the-god-story-saga",
    seriesId: "unseen-age",
    seriesNumber: 2,
    genres: [],
    formats: ["Kindle eBook"],
    logline: "The second volume widens the rupture, carrying the reader deeper into consequence, division, and the changing shape of the world.",
    description: "The Garden and the Fracture continues the series by moving further into the break itself — what is lost, what is altered, and what can no longer remain untouched.",
    canonicalPath: "/publishing/books/unseen-age-v2-the-garden-and-the-fracture/",
    covers: {
      portrait: "/assets/images/books/unseen-age-v2-the-garden-and-the-fracture/cover-portrait.webp",
      square: "/assets/images/books/unseen-age-v2-the-garden-and-the-fracture/cover-portrait.webp",
      wide: "/assets/images/books/unseen-age-v2-the-garden-and-the-fracture/cover-portrait.webp",
    },
    stores: {
      amazonRegional: {
        AU: amazonUrlFor("B0GQP9FP81", "AU"),
        US: amazonUrlFor("B0GQP9FP81", "US"),
        UK: amazonUrlFor("B0GQP9FP81", "UK"),
        CA: amazonUrlFor("B0GQP9FP81", "CA"),
        DE: amazonUrlFor("B0GQP9FP81", "DE"),
        FR: amazonUrlFor("B0GQP9FP81", "FR"),
        ES: amazonUrlFor("B0GQP9FP81", "ES"),
        IT: amazonUrlFor("B0GQP9FP81", "IT"),
        JP: amazonUrlFor("B0GQP9FP81", "JP"),
        IN: amazonUrlFor("B0GQP9FP81", "IN"),
        NL: amazonUrlFor("B0GQP9FP81", "NL"),
        SE: amazonUrlFor("B0GQP9FP81", "SE"),
      },
    },
  },
  {
    id: "unseen-age-v3-the-watchers-descent",
    title: "The Watchers' Descent",
    subtitle: "The Unseen Age — Volume III",
    author: "Triad of Angels",
    year: "",
    status: "Live",
    sagaId: "the-god-story-saga",
    seriesId: "unseen-age",
    seriesNumber: 3,
    genres: [],
    formats: ["Kindle eBook"],
    logline: "The third volume descends into the darker pressure around the series, pushing the unseen conflict closer to the surface.",
    description: "The Watchers' Descent carries the series further into spiritual conflict, escalation, and the sense that the hidden world is no longer staying hidden.",
    canonicalPath: "/publishing/books/unseen-age-v3-the-watchers-descent/",
    covers: {
      portrait: "/assets/images/books/unseen-age-v3-the-watchers-descent/cover-portrait.webp",
      square: "/assets/images/books/unseen-age-v3-the-watchers-descent/cover-portrait.webp",
      wide: "/assets/images/books/unseen-age-v3-the-watchers-descent/cover-portrait.webp",
    },
    stores: {
      amazonRegional: {
        AU: amazonUrlFor("B0GR4HYXZW", "AU"),
        US: amazonUrlFor("B0GR4HYXZW", "US"),
        UK: amazonUrlFor("B0GR4HYXZW", "UK"),
        CA: amazonUrlFor("B0GR4HYXZW", "CA"),
        DE: amazonUrlFor("B0GR4HYXZW", "DE"),
        FR: amazonUrlFor("B0GR4HYXZW", "FR"),
        ES: amazonUrlFor("B0GR4HYXZW", "ES"),
        IT: amazonUrlFor("B0GR4HYXZW", "IT"),
        JP: amazonUrlFor("B0GR4HYXZW", "JP"),
        IN: amazonUrlFor("B0GR4HYXZW", "IN"),
        NL: amazonUrlFor("B0GR4HYXZW", "NL"),
        SE: amazonUrlFor("B0GR4HYXZW", "SE"),
      },
    },
  },
];

// ------------------------
// LOOKUPS
// ------------------------
export const getSagaById = (id) => {
  const key = ensureString(id).trim();
  if (!key) return null;
  return sagas.find((s) => s.id === key) || null;
};

export const getSeriesById = (id) => {
  const key = ensureString(id).trim();
  if (!key) return null;
  return series.find((s) => s.id === key) || null;
};

// ------------------------
// URL HELPERS
// ------------------------
export const toAbsoluteSiteUrl = (path) => {
  const p = ensureString(path).trim();
  if (!p) return SITE_ORIGIN;
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${SITE_ORIGIN}${clean}`;
};

// ------------------------
// SORT HELPERS (used by /js/publishing.js)
// ------------------------
export const parseApproxDate = (item) => {
  // Accept year ("2026"), ISO date ("2026-02-21"), or releaseDate fields.
  const year = ensureString(item?.year).trim();
  const release = ensureString(item?.releaseDate).trim();
  const date = ensureString(item?.date).trim();

  const direct = safeDate(release) ?? safeDate(date);
  if (direct !== null) return direct;

  if (/^\d{4}$/.test(year)) {
    // Mid-year for stable ordering.
    const t = Date.parse(`${year}-06-30T00:00:00Z`);
    return Number.isFinite(t) ? t : 0;
  }

  const y = safeDate(year);
  return y !== null ? y : 0;
};

// ------------------------
// DERIVED HELPERS (optional)
// ------------------------
export const getBooksForSaga = (sagaId) => {
  const key = ensureString(sagaId).trim();
  if (!key) return [];
  return books.filter((b) => ensureString(b?.sagaId).trim() === key);
};

export const getBooksForSeries = (seriesId) => {
  const key = ensureString(seriesId).trim();
  if (!key) return [];
  return books
    .filter((b) => ensureString(b?.seriesId).trim() === key)
    .slice()
    .sort((a, b) => (Number(a?.seriesNumber) || 0) - (Number(b?.seriesNumber) || 0));
};
