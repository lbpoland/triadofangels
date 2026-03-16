// js/publishing-data.js — Publishing library runtime helpers (ESM)
// Structured content source of truth now lives in:
// - content/source/publishing-library.authoritative.json
// Built runtime module:
// - js/generated/publishing-library.data.js
//
// This file preserves the existing helper/runtime surface for the publishing pages
// while moving primary catalog ownership away from hand-authored JS blobs.

import {
  sagas as generatedSagas,
  series as generatedSeries,
  books as generatedBooks,
} from './generated/publishing-library.data.js';
import { sagaPositionIndex, seriesPositionIndex, booksBySagaIndex, booksBySeriesIndex } from './generated/publishing-library.indexes.js';
import { sagasById, sagasByPath, seriesById, seriesByPath, booksById, booksByPath, bookIdsBySaga, bookIdsBySeries } from './generated/publishing-library.lookup.js';
import { amazonUrlFor, parseApproxDate, toAbsoluteSiteUrl } from './publishing-page-helpers.js';

const ensureString = (v) => (typeof v === "string" ? v : "");
const ensureArray = (v) => (Array.isArray(v) ? v : []);

export const sagas = generatedSagas;
export const series = generatedSeries;
export const books = generatedBooks;

// Helper exports are now sourced from js/publishing-page-helpers.js so non-detail runtime pages
// can adopt the same deterministic logic without importing this bridge module.
export { amazonUrlFor, parseApproxDate, toAbsoluteSiteUrl };

// ------------------------
// LOOKUPS
// ------------------------
export const getSagaById = (id) => {
  const key = ensureString(id).trim();
  if (!key) return null;
  if (sagasById?.[key]) return sagasById[key];
  const pos = sagaPositionIndex?.[key];
  if (typeof pos === 'number' && sagas[pos]) return sagas[pos];
  return sagas.find((s) => s.id === key) || null;
};

export const getSagaByPath = (canonicalPath) => {
  const key = ensureString(canonicalPath).trim();
  if (!key) return null;
  return sagasByPath?.[key] || null;
};

export const getSeriesById = (id) => {
  const key = ensureString(id).trim();
  if (!key) return null;
  if (seriesById?.[key]) return seriesById[key];
  const pos = seriesPositionIndex?.[key];
  if (typeof pos === 'number' && series[pos]) return series[pos];
  return series.find((s) => s.id === key) || null;
};

export const getSeriesByPath = (canonicalPath) => {
  const key = ensureString(canonicalPath).trim();
  if (!key) return null;
  return seriesByPath?.[key] || null;
};

export const getBookById = (id) => {
  const key = ensureString(id).trim();
  if (!key) return null;
  return booksById?.[key] || books.find((book) => ensureString(book?.id).trim() === key) || null;
};

export const getBookByPath = (canonicalPath) => {
  const key = ensureString(canonicalPath).trim();
  if (!key) return null;
  return booksByPath?.[key] || null;
};

// ------------------------
// DERIVED HELPERS (optional)
// ------------------------
export const getBooksForSaga = (sagaId) => {
  const key = ensureString(sagaId).trim();
  if (!key) return [];
  const ids = bookIdsBySaga?.[key];
  if (Array.isArray(ids) && ids.length) {
    return ids.map((id) => booksById?.[id] || books.find((book) => ensureString(book?.id).trim() === id)).filter(Boolean);
  }
  const positions = booksBySagaIndex?.[key];
  if (Array.isArray(positions) && positions.length) {
    return positions.map((index) => books[index]).filter(Boolean);
  }
  return books.filter((b) => ensureString(b?.sagaId).trim() === key);
};

export const getBooksForSeries = (seriesId) => {
  const key = ensureString(seriesId).trim();
  if (!key) return [];
  const ids = bookIdsBySeries?.[key];
  if (Array.isArray(ids) && ids.length) {
    return ids.map((id) => booksById?.[id] || books.find((book) => ensureString(book?.id).trim() === id)).filter(Boolean);
  }
  const positions = booksBySeriesIndex?.[key];
  if (Array.isArray(positions) && positions.length) {
    return positions.map((index) => books[index]).filter(Boolean);
  }
  return books
    .filter((b) => ensureString(b?.seriesId).trim() === key)
    .slice()
    .sort((a, b) => (Number(a?.seriesNumber) || 0) - (Number(b?.seriesNumber) || 0));
};
