// js/publishing-catalog-resolvers.js
// Controller-safe publishing entity resolution backed directly by generated artifacts.
// This keeps page-family controllers closer to generated structured ownership
// while preserving the stable publishing bridge helpers for other consumers.

import { sagas, series, books } from './generated/publishing-library.data.js';
import { sagaPositionIndex, seriesPositionIndex, bookPositionIndex, booksBySagaIndex, booksBySeriesIndex } from './generated/publishing-library.indexes.js';
import { sagasByPath, seriesByPath, booksByPath, seriesIdsBySaga } from './generated/publishing-library.lookup.js';

const asString = (value) => (typeof value === 'string' ? value.trim() : '');
const isPath = (value) => asString(value).startsWith('/');

function resolveIndex(collection, positionIndex, pathMap, key) {
  const input = asString(key);
  if (!input) return -1;
  const id = isPath(input) ? asString(pathMap?.[input]?.id) : input;
  const byIndex = typeof positionIndex?.[id] === 'number' ? positionIndex[id] : -1;
  if (byIndex >= 0 && collection[byIndex]) return byIndex;
  return collection.findIndex((entry) => asString(entry?.id) === id || asString(entry?.slug) === id || asString(entry?.canonicalPath) === input);
}

export function resolveSagaRecord(idOrPath) {
  const index = resolveIndex(sagas, sagaPositionIndex, sagasByPath, idOrPath);
  return index >= 0 ? sagas[index] : null;
}

export function resolveSeriesRecord(idOrPath) {
  const index = resolveIndex(series, seriesPositionIndex, seriesByPath, idOrPath);
  return index >= 0 ? series[index] : null;
}

export function resolveBookRecord(idOrPath) {
  const index = resolveIndex(books, bookPositionIndex, booksByPath, idOrPath);
  return index >= 0 ? books[index] : null;
}

export function getSeriesForSagaRecords(sagaIdOrPath) {
  const saga = resolveSagaRecord(sagaIdOrPath);
  if (!saga) return [];
  const ids = Array.isArray(seriesIdsBySaga?.[saga.id]) ? seriesIdsBySaga[saga.id] : [];
  if (ids.length) return ids.map((id) => resolveSeriesRecord(id)).filter(Boolean);
  return series.filter((entry) => asString(entry?.sagaId) === saga.id);
}

export function getBooksForSagaRecords(sagaIdOrPath) {
  const saga = resolveSagaRecord(sagaIdOrPath);
  if (!saga) return [];
  const positions = Array.isArray(booksBySagaIndex?.[saga.id]) ? booksBySagaIndex[saga.id] : [];
  if (positions.length) return positions.map((index) => books[index]).filter(Boolean);
  return books.filter((entry) => asString(entry?.sagaId) === saga.id);
}

export function getBooksForSeriesRecords(seriesIdOrPath) {
  const seriesRecord = resolveSeriesRecord(seriesIdOrPath);
  if (!seriesRecord) return [];
  const positions = Array.isArray(booksBySeriesIndex?.[seriesRecord.id]) ? booksBySeriesIndex[seriesRecord.id] : [];
  if (positions.length) return positions.map((index) => books[index]).filter(Boolean);
  return books
    .filter((entry) => asString(entry?.seriesId) === seriesRecord.id)
    .slice()
    .sort((a, b) => (Number(a?.seriesNumber) || 0) - (Number(b?.seriesNumber) || 0));
}

const SITE_ORIGIN = 'https://www.triadofangels.com';

export function toAbsoluteSiteUrl(pathOrUrl) {
  const p = asString(pathOrUrl);
  if (!p) return SITE_ORIGIN;
  if (/^https?:\/\//i.test(p)) return p;
  return `${SITE_ORIGIN}${p.startsWith('/') ? p : `/${p}`}`;
}


export function resolveSeriesControllerRecord(idOrPath) {
  const seriesRecord = resolveSeriesRecord(idOrPath);
  if (!seriesRecord) return null;
  const saga = resolveSagaRecord(seriesRecord.sagaId) || null;
  const books = getBooksForSeriesRecords(seriesRecord.id);
  return {
    series: seriesRecord,
    saga,
    books,
    canonicalPath: asString(seriesRecord?.canonicalPath),
  };
}

export function resolveSagaControllerRecord(idOrPath) {
  const saga = resolveSagaRecord(idOrPath);
  if (!saga) return null;
  const relatedSeries = getSeriesForSagaRecords(saga.id);
  const relatedBooks = getBooksForSagaRecords(saga.id);
  return {
    saga,
    series: relatedSeries,
    books: relatedBooks,
    canonicalPath: asString(saga?.canonicalPath),
  };
}

export function resolveBookControllerRecord(idOrPath) {
  const book = resolveBookRecord(idOrPath);
  if (!book) return null;
  const series = resolveSeriesRecord(book.seriesId) || null;
  const saga = resolveSagaRecord(book.sagaId) || null;
  const seriesBooks = series ? getBooksForSeriesRecords(series.id) : [];
  const sagaBooks = saga ? getBooksForSagaRecords(saga.id) : [];
  return { book, series, saga, seriesBooks, sagaBooks };
}
