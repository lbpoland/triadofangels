// js/search-runtime-helpers.js
// Search-page-specific runtime helpers extracted from the page controller so
// search ownership can live on a dedicated helper contract instead of inside
// the page module itself.

import { albumCanonicalPath, trackCanonicalPath, bookCanonicalPath, gameCanonicalPath } from './routes.js';

const safeStr = (v) => (typeof v === 'string' ? v.trim() : '');
const ensureSitePath = (pathOrUrl) => {
  const s = safeStr(pathOrUrl);
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return s;
  return '/' + s.replace(/^\/+/, '');
};

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const asList = (value) => (Array.isArray(value) ? value : []);

export const SEARCH_SCOPE_LABELS = Object.freeze({
  all: 'All',
  music: 'Music',
  publishing: 'Publishing',
  games: 'Games',
});

export function normalizeSearchScope(value) {
  const scope = safeStr(value).toLowerCase();
  if (scope === 'music' || scope === 'publishing' || scope === 'games') return scope;
  return 'all';
}

export function syncSearchScopeButtons(buttons, activeScope) {
  const cleanScope = normalizeSearchScope(activeScope);
  for (const button of Array.isArray(buttons) ? buttons : []) {
    if (!button || typeof button.getAttribute !== 'function' || typeof button.setAttribute !== 'function') continue;
    const buttonScope = normalizeSearchScope(button.getAttribute('data-search-scope'));
    const isActive = buttonScope === cleanScope;
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    if (button.classList && button.classList.contains('chip')) button.classList.toggle('chip--active', isActive);
  }
  return cleanScope;
}

export function syncSearchClearButton(clearBtn, inputValue = '') {
  if (!clearBtn || typeof clearBtn.hidden === 'undefined') return false;
  const hasValue = Boolean(safeStr(inputValue));
  clearBtn.hidden = !hasValue;
  return hasValue;
}

export function syncSearchControllerUi({ buttons = [], clearBtn = null, activeScope = 'all', inputValue = '' } = {}) {
  const scope = syncSearchScopeButtons(buttons, activeScope);
  const hasQuery = syncSearchClearButton(clearBtn, inputValue);
  return { scope, hasQuery };
}

export function getSearchScopeHintMessage(scope) {
  switch (normalizeSearchScope(scope)) {
    case 'music':
      return 'No music matches in the current scope yet. Try All, open Music directly, or search a lyric phrase instead.';
    case 'publishing':
      return 'No publishing matches in the current scope yet. Try All, open Publishing directly, or search a series or volume title.';
    case 'games':
      return 'No game matches in the current scope yet. Try All or browse the live game catalog directly.';
    default:
      return 'No exact matches yet. Try a shorter phrase, a broader search, or move into Music, Publishing, Lyrics, or Videos directly.';
  }
}

export function readSearchUrlState(href = '') {
  try {
    const source = safeStr(href) || (typeof window !== 'undefined' ? window.location.href : '');
    const url = new URL(source, typeof window !== 'undefined' ? window.location.origin : 'https://triadofangels.com');
    return {
      query: safeStr(url.searchParams.get('q')),
      scope: normalizeSearchScope(url.searchParams.get('scope')),
    };
  } catch {
    return { query: '', scope: 'all' };
  }
}

export function readSearchControllerState({ href = '', buttons = [], fallbackScope = 'all' } = {}) {
  const urlState = readSearchUrlState(href);
  const scope = syncSearchScopeButtons(buttons, urlState.scope || fallbackScope);
  return {
    query: safeStr(urlState.query),
    scope,
  };
}

export function applySearchControllerState({ inputEl = null, buttons = [], clearBtn = null, href = '', fallbackScope = 'all', query, scope } = {}) {
  let nextQuery = typeof query === 'undefined' ? '' : safeStr(query);
  let nextScope = typeof scope === 'undefined' ? '' : normalizeSearchScope(scope);

  if (typeof query === 'undefined' && typeof scope === 'undefined') {
    const urlState = readSearchUrlState(href);
    nextQuery = safeStr(urlState.query);
    nextScope = normalizeSearchScope(urlState.scope || fallbackScope);
  } else {
    if (typeof query === 'undefined') nextQuery = safeStr(inputEl?.value);
    if (typeof scope === 'undefined') nextScope = normalizeSearchScope(fallbackScope);
  }

  if (inputEl && typeof inputEl.value !== 'undefined') inputEl.value = nextQuery;
  const uiState = syncSearchControllerUi({ buttons, clearBtn, activeScope: nextScope, inputValue: nextQuery });
  return {
    query: nextQuery,
    scope: uiState.scope,
    hasQuery: uiState.hasQuery,
  };
}

export function applySearchInputRuntimeState({ inputEl = null, buttons = [], clearBtn = null, noResultsEl = null, query = '', scope = 'all' } = {}) {
  if (noResultsEl && typeof noResultsEl.hidden !== 'undefined') noResultsEl.hidden = true;
  return applySearchControllerState({
    inputEl,
    buttons,
    clearBtn,
    query,
    scope,
  });
}

export function clearAndFocusSearchRuntimeState({ inputEl = null, buttons = [], clearBtn = null, noResultsEl = null, scope = 'all', focusOptions = { preventScroll: true } } = {}) {
  const nextState = applySearchInputRuntimeState({
    inputEl,
    buttons,
    clearBtn,
    noResultsEl,
    query: '',
    scope,
  });
  try {
    inputEl?.focus(focusOptions);
  } catch {}
  return nextState;
}

export function applySearchSuggestionRuntimeState({ buttonEl = null, inputEl = null, buttons = [], clearBtn = null, noResultsEl = null, scope = 'all', focusOptions = { preventScroll: true } } = {}) {
  const query = safeStr(buttonEl && typeof buttonEl.getAttribute === 'function' ? buttonEl.getAttribute('data-search-suggest') : '');
  if (!query) {
    return {
      query: '',
      scope: normalizeSearchScope(scope),
      hasQuery: false,
      applied: false,
    };
  }
  const nextState = applySearchInputRuntimeState({
    inputEl,
    buttons,
    clearBtn,
    noResultsEl,
    query,
    scope,
  });
  try {
    inputEl?.focus(focusOptions);
  } catch {}
  return {
    ...nextState,
    query,
    applied: true,
  };
}

export function handleSearchEscapeRuntimeState({ inputEl = null, buttons = [], clearBtn = null, noResultsEl = null, scope = 'all', focusOptions = { preventScroll: true } } = {}) {
  const hasQuery = Boolean(safeStr(inputEl?.value));
  if (!hasQuery) {
    return {
      query: '',
      scope: normalizeSearchScope(scope),
      hasQuery: false,
      cleared: false,
    };
  }
  const nextState = clearAndFocusSearchRuntimeState({
    inputEl,
    buttons,
    clearBtn,
    noResultsEl,
    scope,
    focusOptions,
  });
  return {
    ...nextState,
    query: '',
    cleared: true,
  };
}

export function buildSearchUrlHref({ href = '', pathname = '/search/', query = '', scope = 'all' } = {}) {
  try {
    const source = safeStr(href) || (typeof window !== 'undefined' ? window.location.href : pathname);
    const url = new URL(source, typeof window !== 'undefined' ? window.location.origin : 'https://triadofangels.com');
    const cleanQuery = safeStr(query);
    const cleanScope = normalizeSearchScope(scope);
    if (cleanQuery) url.searchParams.set('q', cleanQuery);
    else url.searchParams.delete('q');
    if (cleanScope !== 'all') url.searchParams.set('scope', cleanScope);
    else url.searchParams.delete('scope');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return pathname;
  }
}

export function applySearchHistoryState({ historyObj = null, locationObj = null, query = '', scope = 'all' } = {}) {
  try {
    if (!historyObj || typeof historyObj.replaceState !== 'function' || !locationObj) return '';
    const href = buildSearchUrlHref({
      href: safeStr(locationObj.href) || '',
      pathname: safeStr(locationObj.pathname) || '/search/',
      query,
      scope,
    });
    historyObj.replaceState({}, '', href);
    return href;
  } catch {
    return '';
  }
}

export function buildSearchEmptyState({ query = '', activeScope = 'all', labels = SEARCH_SCOPE_LABELS, totalAll = 0, total = 0, showNoResults = false } = {}) {
  const cleanQuery = safeStr(query);
  const cleanScope = normalizeSearchScope(activeScope);
  const scopeLabel = labels?.[cleanScope] || 'All';

  let summaryText = 'Ready when you are — start with a short album, track, book, or build title, or browse one of the main sections below.';
  if (cleanQuery) {
    summaryText = cleanScope !== 'all'
      ? `No ${scopeLabel.toLowerCase()} matches for “${cleanQuery}” yet.`
      : `No exact matches for “${cleanQuery}” yet.`;
  }

  return {
    scope: cleanScope,
    scopeLabel,
    summaryText,
    showNoResults: Boolean(cleanQuery) && Boolean(showNoResults),
    showScopeHint: cleanScope !== 'all' && Number(totalAll || 0) > 0 && Number(total || 0) === 0,
  };
}

export function applySearchEmptySummaryUi({ summaryEl = null, emptyState = {} } = {}) {
  const state = isPlainObject(emptyState) ? emptyState : {};
  if (summaryEl) summaryEl.textContent = safeStr(state.summaryText);
  return state;
}

export function applySearchEmptyUi({ noResultsEl = null, noResultsScopeHintEl = null, noResultsHintEl = null, emptyState = {}, activeScope = 'all', hintBuilder = getSearchScopeHintMessage } = {}) {
  const state = isPlainObject(emptyState) ? emptyState : {};
  if (noResultsEl && typeof noResultsEl.hidden !== 'undefined') noResultsEl.hidden = !Boolean(state.showNoResults);
  if (noResultsScopeHintEl && typeof noResultsScopeHintEl.hidden !== 'undefined') noResultsScopeHintEl.hidden = !Boolean(state.showScopeHint);
  if (noResultsHintEl) noResultsHintEl.textContent = typeof hintBuilder === 'function' ? hintBuilder(activeScope) : '';
  return state;
}

export function applySearchEmptyRuntimeUi({ summaryEl = null, noResultsEl = null, noResultsScopeHintEl = null, noResultsHintEl = null, query = '', activeScope = 'all', labels = SEARCH_SCOPE_LABELS, totalAll = 0, total = 0, showNoResults = false } = {}) {
  const emptyState = buildSearchEmptyState({ query, activeScope, labels, totalAll, total, showNoResults });
  applySearchEmptySummaryUi({ summaryEl, emptyState });
  applySearchEmptyUi({
    noResultsEl,
    noResultsScopeHintEl,
    noResultsHintEl,
    emptyState,
    activeScope,
  });
  return emptyState;
}

export function applySearchResultsRuntimeUi({ sectionUi = {}, summaryEl = null, liveEl = null, noResultsEl = null, noResultsScopeHintEl = null, noResultsHintEl = null, query = '', counts = {}, activeScope = 'all', labels = SEARCH_SCOPE_LABELS, totalAll = 0, total = 0, visibleSections = [] } = {}) {
  clearSearchResultsUi({
    sectionUi,
    summaryEl,
    liveEl,
    noResultsEl,
    noResultsScopeHintEl,
    noResultsHintEl,
    buttons: [],
    clearBtn: null,
    activeScope,
    inputValue: query,
  });
  applySearchSummaryUi({ summaryEl, liveEl, query, counts, activeScope, labels });
  const emptyState = applySearchEmptyRuntimeUi({
    summaryEl,
    noResultsEl,
    noResultsScopeHintEl,
    noResultsHintEl,
    query,
    activeScope,
    labels,
    totalAll,
    total,
    showNoResults: total === 0,
  });
  if (total > 0) applySearchVisibleSectionUi(sectionUi, visibleSections);
  return { emptyState, total, totalAll, counts };
}


function setSearchSectionCount(el, count, labelBase) {
  if (!el) return;
  el.textContent = String(count);
  if (labelBase) el.setAttribute('aria-label', `${labelBase} results: ${count}`);
}

function hideSearchSection(group, countEl) {
  if (group) group.hidden = true;
  setSearchSectionCount(countEl, 0);
}

function showSearchSection(group, countEl, count, labelBase) {
  if (group) group.hidden = false;
  setSearchSectionCount(countEl, count, labelBase);
}

export function applySearchVisibleSectionUi(sectionUi = {}, visibleSections = []) {
  const sectionByKind = Object.fromEntries(asList(visibleSections).map((section) => [safeStr(section?.kind).toLowerCase(), section]));
  for (const [kind, refs] of Object.entries(isPlainObject(sectionUi) ? sectionUi : {})) {
    const section = sectionByKind[safeStr(kind).toLowerCase()];
    if (refs?.wrap) refs.wrap.replaceChildren();
    if (!section) {
      hideSearchSection(refs?.group, refs?.countEl);
      continue;
    }
    showSearchSection(refs?.group, refs?.countEl, Number(section.count || 0), section.labelBase);
    if (refs?.wrap) refs.wrap.appendChild(section.fragment);
  }
  return sectionByKind;
}

export function clearSearchResultsUi({
  sectionUi = {},
  summaryEl = null,
  liveEl = null,
  noResultsEl = null,
  noResultsScopeHintEl = null,
  noResultsHintEl = null,
  buttons = [],
  clearBtn = null,
  activeScope = 'all',
  inputValue = '',
} = {}) {
  applySearchVisibleSectionUi(sectionUi, []);
  if (summaryEl) summaryEl.textContent = '';
  if (liveEl) liveEl.textContent = '0';
  syncSearchControllerUi({ buttons, clearBtn, activeScope, inputValue });
  applySearchEmptyUi({
    noResultsEl,
    noResultsScopeHintEl,
    noResultsHintEl,
    emptyState: { showNoResults: false, showScopeHint: false },
    activeScope,
  });
}

export const albumCover = (album) => ensureSitePath(album?.cover) || '/assets/images/og/og-album.webp';
export const albumTitle = (album) => safeStr(album?.title) || safeStr(album?.name) || safeStr(album?.id) || 'Album';
export const albumArtist = (album) => safeStr(album?.artist) || 'Triad of Angels';
export const trackTitle = (track) => safeStr(track?.title) || safeStr(track?.name) || safeStr(track?.id) || 'Track';

export function getSearchDatasetContract(kind, searchRuntimeMeta) {
  const key = safeStr(kind).toLowerCase();
  const datasets = isPlainObject(searchRuntimeMeta?.datasetContracts) ? searchRuntimeMeta.datasetContracts : {};
  return isPlainObject(datasets[key]) ? datasets[key] : null;
}

function readFallbackField(entry, fieldName) {
  const name = safeStr(fieldName);
  if (!name || !isPlainObject(entry)) return '';
  return safeStr(entry[name]);
}

export function resolveSearchResultHref(kind, entry, searchRuntimeMeta) {
  const key = safeStr(kind).toLowerCase();
  const contract = getSearchDatasetContract(key, searchRuntimeMeta);
  const canonicalField = safeStr(contract?.canonicalField) || 'canonicalPath';
  const canonicalPath = ensureSitePath(readFallbackField(entry, canonicalField));
  if (canonicalPath) return canonicalPath;

  const fallbackFields = isPlainObject(contract?.fallbackFields) ? contract.fallbackFields : {};
  const id = readFallbackField(entry, fallbackFields.id || 'id');

  if (key === 'albums') {
    return id ? (albumCanonicalPath(id) || `/album.html?album=${encodeURIComponent(id)}`) : '';
  }

  if (key === 'tracks') {
    const albumId = readFallbackField(entry, fallbackFields.albumId || 'albumId');
    if (albumId && id) return trackCanonicalPath(albumId, id) || `/track.html?album=${encodeURIComponent(albumId)}&track=${encodeURIComponent(id)}`;
    return '';
  }

  if (key === 'books') {
    return id ? (bookCanonicalPath(id) || `/book.html?id=${encodeURIComponent(id)}`) : '';
  }

  return '';
}


export function buildSearchGamesIndex(items = [], normalize) {
  const normalizeText = typeof normalize === 'function'
    ? normalize
    : (value) => String(value ?? '').toLowerCase().trim();
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const id = safeStr(item?.id);
    const title = safeStr(item?.title) || id || 'Game';
    const subtitle = safeStr(item?.subtitle);
    const description = safeStr(item?.description);
    const tags = Array.isArray(item?.tags) ? item.tags.map((t) => safeStr(t)).filter(Boolean) : [];
    const status = safeStr(item?.status) || '';
    const type = safeStr(item?.type) || '';
    const updatedAt = safeStr(item?.updatedAt) || '';
    const path = ensureSitePath(item?.path) || (id ? gameCanonicalPath(id) : '');
    return {
      id,
      title,
      subtitle,
      description,
      tags,
      path,
      status,
      type,
      updatedAt,
      searchText: normalizeText([title, subtitle, description, tags.join(' '), status, type].join(' ')),
    };
  }).filter((entry) => entry && entry.path);
}

export function buildSearchGameCardData(entry) {
  const id = safeStr(entry?.id);
  const title = safeStr(entry?.title) || id || 'Game';
  const typeLabel = safeStr(entry?.type) || 'Build';
  const updatedLabel = safeStr(entry?.updatedAt) ? `Updated ${safeStr(entry?.updatedAt)}` : '';
  return {
    href: ensureSitePath(entry?.path) || (id ? gameCanonicalPath(id) : '/games/'),
    coverSrc: ensureSitePath(entry?.cover) || '/assets/images/og/og-games.webp',
    coverAlt: safeStr(entry?.coverAlt) || `ToA Games — ${title}`,
    title,
    meta: ['Games', typeLabel, updatedLabel].filter(Boolean).join(' • '),
    subtitle: safeStr(entry?.subtitle) || 'Playable build',
  };
}



export function buildSearchResultCard({ href, coverSrc, coverAlt, title, meta, subtitle }) {
  const card = document.createElement('article');
  card.className = 'album-card';
  card.setAttribute('role', 'listitem');

  const cover = document.createElement('a');
  cover.className = 'album-card__cover';
  cover.href = href;

  const img = document.createElement('img');
  img.src = coverSrc;
  img.alt = coverAlt;
  img.width = 900;
  img.height = 900;
  img.decoding = 'async';
  img.loading = 'lazy';
  img.referrerPolicy = 'no-referrer';
  cover.appendChild(img);

  const body = document.createElement('div');
  body.className = 'album-card__body';

  const heading = document.createElement('h4');
  heading.className = 'album-card__title';
  const link = document.createElement('a');
  link.href = href;
  link.textContent = title;
  heading.appendChild(link);

  const metaLine = document.createElement('p');
  metaLine.className = 'album-card__meta';
  metaLine.textContent = meta;

  body.appendChild(heading);
  body.appendChild(metaLine);

  if (subtitle) {
    const subtitleLine = document.createElement('p');
    subtitleLine.className = 'album-card__genre';
    subtitleLine.textContent = subtitle;
    body.appendChild(subtitleLine);
  }

  card.appendChild(cover);
  card.appendChild(body);
  return card;
}


export function buildSearchResultListFragment(kind, entries, searchRuntimeMeta, options = {}) {
  const key = safeStr(kind).toLowerCase();
  const list = Array.isArray(entries) ? entries : [];
  const limit = Number.isFinite(Number(options?.limit)) ? Number(options.limit) : list.length;
  const fragment = document.createDocumentFragment();
  const capped = list.slice(0, Math.max(0, limit));
  for (const entry of capped) {
    if (key === 'games') {
      fragment.appendChild(buildSearchResultCard(buildSearchGameCardData(entry)));
      continue;
    }
    fragment.appendChild(buildSearchResultCard(buildSearchCatalogCardData(key, entry, searchRuntimeMeta)));
  }
  return fragment;
}

export function buildSearchCatalogCardData(kind, entry, searchRuntimeMeta) {
  const key = safeStr(kind).toLowerCase();
  const href = resolveSearchResultHref(key, entry, searchRuntimeMeta);
  if (key === 'tracks') {
    return {
      href,
      coverSrc: ensureSitePath(entry?.albumCover) || '/assets/images/og/og-album.webp',
      coverAlt: safeStr(entry?.coverAlt) || `${safeStr(entry?.albumTitle) || 'Album'} cover`,
      title: safeStr(entry?.title) || 'Track',
      meta: safeStr(entry?.meta) || safeStr(entry?.albumTitle) || 'Music',
      subtitle: safeStr(entry?.subtitle) || 'Music • Track',
    };
  }
  if (key === 'albums') {
    return {
      href,
      coverSrc: ensureSitePath(entry?.cover) || '/assets/images/og/og-album.webp',
      coverAlt: safeStr(entry?.coverAlt) || `${safeStr(entry?.title) || 'Album'} cover`,
      title: safeStr(entry?.title) || 'Album',
      meta: safeStr(entry?.meta) || safeStr(entry?.artist) || 'Music',
      subtitle: safeStr(entry?.subtitle) || 'Music • Album',
    };
  }
  if (key === 'books') {
    return {
      href,
      coverSrc: ensureSitePath(entry?.cover) || '/assets/images/publishing/default-book-cover.webp',
      coverAlt: safeStr(entry?.coverAlt) || `${safeStr(entry?.title) || 'Book'} cover`,
      title: safeStr(entry?.title) || 'Book',
      meta: safeStr(entry?.meta) || 'Publishing',
      subtitle: safeStr(entry?.subtitle) || 'Publishing • Book',
    };
  }
  return {
    href,
    coverSrc: '',
    coverAlt: '',
    title: safeStr(entry?.title),
    meta: safeStr(entry?.meta),
    subtitle: safeStr(entry?.subtitle),
  };
}



export function buildSearchVisibleSections(searchState, searchRuntimeMeta, options = {}) {
  const state = isPlainObject(searchState) ? searchState : {};
  const limits = isPlainObject(options?.limits) ? options.limits : {};
  const sectionDefs = [
    { kind: 'games', labelBase: 'Games', entries: asList(state.visibleGames), limit: Number(limits.games ?? 40) },
    { kind: 'tracks', labelBase: 'Tracks', entries: asList(state.visibleTracks), limit: Number(limits.tracks ?? 60) },
    { kind: 'albums', labelBase: 'Albums', entries: asList(state.visibleAlbums), limit: Number(limits.albums ?? 40) },
    { kind: 'books', labelBase: 'Books', entries: asList(state.visibleBooks), limit: Number(limits.books ?? 40) },
  ];
  return sectionDefs
    .filter((section) => section.entries.length > 0)
    .map((section) => ({
      ...section,
      count: section.entries.length,
      fragment: buildSearchResultListFragment(section.kind, section.entries, searchRuntimeMeta, { limit: section.limit }),
    }));
}

export function buildSearchTracksIndex(searchTrackResults = []) {
  if (!Array.isArray(searchTrackResults)) return [];
  return searchTrackResults.map((entry) => ({
    album: {
      id: entry.albumId,
      title: entry.albumTitle,
      cover: entry.albumCover,
      canonicalPath: entry.albumCanonicalPath,
      artist: entry.albumArtist,
      genre: entry.albumGenre || '',
    },
    track: {
      id: entry.id,
      title: entry.title,
      canonicalPath: entry.canonicalPath,
      duration: entry.duration || '',
    },
  }));
}

export function summarizeSearchFacts({ searchSummary, searchAlbums, searchBooks, tracksIndex, gamesIndex }) {
  const albumTotal = typeof searchSummary?.albums === 'number' ? searchSummary.albums : (Array.isArray(searchAlbums) ? searchAlbums.length : 0);
  const trackTotal = typeof searchSummary?.tracks === 'number' ? searchSummary.tracks : (Array.isArray(tracksIndex) ? tracksIndex.length : 0);
  const gameTotal = Array.isArray(gamesIndex) ? gamesIndex.length : 0;
  const bookTotal = typeof searchSummary?.books === 'number' ? searchSummary.books : (Array.isArray(searchBooks) ? searchBooks.length : 0);
  return {
    albums: albumTotal,
    tracks: trackTotal,
    games: gameTotal,
    books: bookTotal,
    indexed: albumTotal + trackTotal + gameTotal + bookTotal,
  };
}

function countMap(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildResultMeta(meta) {
  return typeof meta === 'object' && meta ? meta : {};
}

export function buildSearchResultsState({
  normalizedQuery,
  activeScope,
  gamesIndex = [],
  searchAlbumResults = [],
  searchTrackResults = [],
  searchBookResults = [],
  normalize,
}) {
  const normFn = typeof normalize === 'function' ? normalize : (value) => String(value ?? '').toLowerCase().trim();
  const q = safeStr(normalizedQuery);
  const allow = {
    all: { games: true, tracks: true, albums: true, books: true },
    music: { games: false, tracks: true, albums: true, books: false },
    publishing: { games: false, tracks: false, albums: false, books: true },
    games: { games: true, tracks: false, albums: false, books: false },
  };
  const scopeRules = allow[activeScope] || allow.all;

  const gameMatches = [];
  for (const g of Array.isArray(gamesIndex) ? gamesIndex : []) {
    const haystack = safeStr(g.searchText) || normFn([g.title, g.subtitle, g.description, Array.isArray(g.tags) ? g.tags.join(' ') : ''].join(' '));
    if (haystack.includes(q)) gameMatches.push(g);
  }

  const albumMatches = (Array.isArray(searchAlbumResults) ? searchAlbumResults : []).filter((entry) => safeStr(entry.searchText).includes(q));
  const trackMatches = (Array.isArray(searchTrackResults) ? searchTrackResults : []).filter((entry) => safeStr(entry.searchText).includes(q));
  const bookMatches = (Array.isArray(searchBookResults) ? searchBookResults : []).filter((entry) => safeStr(entry.searchText).includes(q));

  const allCounts = {
    games: gameMatches.length,
    tracks: trackMatches.length,
    albums: albumMatches.length,
    books: bookMatches.length,
  };

  const visibleGames = scopeRules.games ? gameMatches : [];
  const visibleTracks = scopeRules.tracks ? trackMatches : [];
  const visibleAlbums = scopeRules.albums ? albumMatches : [];
  const visibleBooks = scopeRules.books ? bookMatches : [];

  const counts = {
    games: visibleGames.length,
    tracks: visibleTracks.length,
    albums: visibleAlbums.length,
    books: visibleBooks.length,
  };

  return {
    allCounts,
    counts,
    totalAll: allCounts.games + allCounts.tracks + allCounts.albums + allCounts.books,
    total: counts.games + counts.tracks + counts.albums + counts.books,
    visibleGames,
    visibleTracks,
    visibleAlbums,
    visibleBooks,
    mismatchHints: {
      visibleByScope: countMap([
        ...visibleAlbums.map((entry) => ({ kind: 'albums', entry })),
        ...visibleTracks.map((entry) => ({ kind: 'tracks', entry })),
        ...visibleBooks.map((entry) => ({ kind: 'books', entry })),
        ...visibleGames.map((entry) => ({ kind: 'games', entry })),
      ], (item) => item.kind),
      meta: buildResultMeta({ activeScope }),
    },
  };
}

export function buildSearchSummaryText(queryRaw, counts, activeScope, scopeLabelMap) {
  const qRaw = safeStr(queryRaw);
  const { games = 0, tracks = 0, albums = 0, books = 0 } = counts || {};
  const total = Number(games) + Number(tracks) + Number(albums) + Number(books);
  const parts = [];
  if (games) parts.push(`${games} game${games === 1 ? '' : 's'}`);
  if (tracks) parts.push(`${tracks} track${tracks === 1 ? '' : 's'}`);
  if (albums) parts.push(`${albums} album${albums === 1 ? '' : 's'}`);
  if (books) parts.push(`${books} book${books === 1 ? '' : 's'}`);
  const scopeLabel = scopeLabelMap?.[activeScope] || 'All';
  const scopeSuffix = activeScope && activeScope !== 'all' ? ` (Scope: ${scopeLabel})` : '';
  return `${total} result${total === 1 ? '' : 's'} for “${qRaw}”${scopeSuffix}${parts.length ? ` — ${parts.join(', ')}.` : '.'}`;
}

export function applySearchSummaryUi({ summaryEl = null, liveEl = null, query = '', counts = {}, activeScope = 'all', labels = SEARCH_SCOPE_LABELS } = {}) {
  const summaryText = buildSearchSummaryText(query, counts, activeScope, labels);
  const total = Number(counts?.games || 0) + Number(counts?.tracks || 0) + Number(counts?.albums || 0) + Number(counts?.books || 0);
  if (liveEl) liveEl.textContent = String(total);
  if (summaryEl) summaryEl.textContent = summaryText;
  return { summaryText, total };
}

export function buildSearchDatasetFacts({ searchRuntimeMeta, gamesIndex }) {
  const summary = (searchRuntimeMeta && typeof searchRuntimeMeta === 'object' && searchRuntimeMeta.summary) || {};
  const resultKinds = (searchRuntimeMeta && typeof searchRuntimeMeta === 'object' && searchRuntimeMeta.resultKinds) || {};
  const datasetContracts = isPlainObject(searchRuntimeMeta?.datasetContracts) ? searchRuntimeMeta.datasetContracts : {};
  const albumTotal = typeof resultKinds?.albums?.count === 'number'
    ? resultKinds.albums.count
    : (typeof datasetContracts?.albums?.count === 'number' ? datasetContracts.albums.count : (typeof summary?.albums === 'number' ? summary.albums : 0));
  const trackTotal = typeof resultKinds?.tracks?.count === 'number'
    ? resultKinds.tracks.count
    : (typeof datasetContracts?.tracks?.count === 'number' ? datasetContracts.tracks.count : (typeof summary?.tracks === 'number' ? summary.tracks : 0));
  const bookTotal = typeof resultKinds?.books?.count === 'number'
    ? resultKinds.books.count
    : (typeof datasetContracts?.books?.count === 'number' ? datasetContracts.books.count : (typeof summary?.books === 'number' ? summary.books : 0));
  const generatedTotal = typeof summary?.total === 'number' ? summary.total : albumTotal + trackTotal + bookTotal;
  const gameTotal = Array.isArray(gamesIndex) ? gamesIndex.length : 0;
  return {
    albums: albumTotal,
    tracks: trackTotal,
    books: bookTotal,
    games: gameTotal,
    indexed: generatedTotal + gameTotal,
    generatedIndexed: generatedTotal,
    governedDatasets: asList(searchRuntimeMeta?.contractDatasets).length || Object.keys(datasetContracts).length,
  };
}

export function applySearchDatasetFactsUi({ factsEls = {}, facts = {} } = {}) {
  const els = isPlainObject(factsEls) ? factsEls : {};
  const payload = isPlainObject(facts) ? facts : {};
  if (els.albums) els.albums.textContent = String(Number(payload.albums || 0));
  if (els.tracks) els.tracks.textContent = String(Number(payload.tracks || 0));
  if (els.books) els.books.textContent = String(Number(payload.books || 0));
  if (els.games) els.games.textContent = String(Number(payload.games || 0));
  if (els.indexed) els.indexed.textContent = String(Number(payload.indexed || 0));
  return payload;
}

export function announceSearchSummary({ summaryEl = null, announce = false } = {}) {
  if (!announce || !summaryEl) return false;
  try {
    summaryEl.setAttribute('tabindex', '-1');
    summaryEl.focus({ preventScroll: true });
    return true;
  } catch {
    return false;
  }
}
