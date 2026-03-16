// search/search.js — Site search (ESM)
// Searches across:
// - Music: albums + tracks
// - Publishing: books
// - Games: truth-only playable builds (from /games/catalog.json)
//
// Safety:
// - No unsafe HTML injection (DOM nodes only)
// - Works with /search/?q=... deep links
// - Accessible form semantics + keyboard discipline (Enter submit, Escape clear)
// - Focus order: summary is announced without trapping

import { searchAlbumResults, searchBookResults, searchTrackResults, searchSummary, searchRuntimeMeta } from "../js/generated/site-search.data.js";
import { SEARCH_SCOPE_LABELS, announceSearchSummary, applySearchControllerState, applySearchDatasetFactsUi, applySearchEmptyRuntimeUi, applySearchHistoryState, applySearchInputRuntimeState, applySearchResultsRuntimeUi, applySearchSuggestionRuntimeState, handleSearchEscapeRuntimeState, buildSearchDatasetFacts, buildSearchGamesIndex, buildSearchResultsState, buildSearchVisibleSections, clearAndFocusSearchRuntimeState, clearSearchResultsUi, normalizeSearchScope } from "../js/search-runtime-helpers.js";

const qs = (sel, root = document) => root.querySelector(sel);

const FACTS = {
  albums: qs('#search-meta-albums'),
  tracks: qs('#search-meta-tracks'),
  games: qs('#search-meta-games'),
  live: qs('#search-results-live'),
  indexed: qs('#search-results-indexed'),
};

const UI = {
  form: qs("#search-form"),
  input: qs("#search-input"),
  summary: qs("#results-summary"),
  noResults: qs("#no-results"),
  noResultsScopeHint: qs("#no-results-scope-hint"),
  clearBtn: qs('button[data-action="clear"]'),

  gamesGroup: qs("#games-group"),
  tracksGroup: qs("#tracks-group"),
  albumsGroup: qs("#albums-group"),
  booksGroup: qs("#books-group"),

  gamesCount: qs("#games-count"),
  tracksCount: qs("#tracks-count"),
  albumsCount: qs("#albums-count"),
  booksCount: qs("#books-count"),

  gamesWrap: qs("#games-results"),
  tracksWrap: qs("#tracks-results"),
  albumsWrap: qs("#albums-results"),
  booksWrap: qs("#books-results"),
};

// Scoped results (Wave V10-38)
// Purpose:
//   - Let visitors clamp results to a pillar without losing URL shareability.
//   - Keep the underlying index unified; scope only changes what is rendered.
const SCOPE_BTNS = Array.from(document.querySelectorAll('[data-search-control="scope"][data-search-scope]'));
const SUGGEST_BTNS = Array.from(document.querySelectorAll('[data-search-suggest]'));

let ACTIVE_SCOPE = "all";


const norm = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const safeStr = (v) => (typeof v === "string" ? v.trim() : "");

const TRACKS_INDEX = searchTrackResults;

const SECTION_UI = {
  games: { group: UI.gamesGroup, countEl: UI.gamesCount, wrap: UI.gamesWrap },
  tracks: { group: UI.tracksGroup, countEl: UI.tracksCount, wrap: UI.tracksWrap },
  albums: { group: UI.albumsGroup, countEl: UI.albumsCount, wrap: UI.albumsWrap },
  books: { group: UI.booksGroup, countEl: UI.booksCount, wrap: UI.booksWrap },
};

function hydrateSearchFacts() {
  const facts = buildSearchDatasetFacts({
    searchRuntimeMeta,
    gamesIndex: GAMES_INDEX,
  });
  applySearchDatasetFactsUi({ factsEls: FACTS, facts });
}

async function loadGamesIndex() {
  if (GAMES_READY) return GAMES_INDEX;
  try {
    const res = await fetch("/games/catalog.json", { cache: "no-store" });
    if (!res.ok) throw new Error("catalog fetch failed");
    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];
    GAMES_INDEX = buildSearchGamesIndex(items, norm);
  } catch {
    GAMES_INDEX = [];
  }
  GAMES_READY = true;
  return GAMES_INDEX;
}

function clearResults() {
  clearSearchResultsUi({
    sectionUi: SECTION_UI,
    summaryEl: UI.summary,
    liveEl: FACTS.live,
    noResultsEl: UI.noResults,
    noResultsScopeHintEl: UI.noResultsScopeHint,
    noResultsHintEl: document.getElementById('no-results-hint'),
    buttons: SCOPE_BTNS,
    clearBtn: UI.clearBtn,
    activeScope: ACTIVE_SCOPE,
    inputValue: UI.input?.value,
  });
}


function renderEmpty(q, { showNoResults = false, announce = false } = {}) {
  clearResults();

  applySearchEmptyRuntimeUi({
    summaryEl: UI.summary,
    noResultsEl: UI.noResults,
    noResultsScopeHintEl: UI.noResultsScopeHint,
    noResultsHintEl: document.getElementById("no-results-hint"),
    query: q,
    activeScope: ACTIVE_SCOPE,
    labels: SEARCH_SCOPE_LABELS,
    showNoResults,
  });
  announceSearchSummary({ summaryEl: UI.summary, announce });
}


function search(qRaw, { announce = false } = {}) {
  const q = norm(qRaw);
  if (!q) {
    applySearchHistoryState({ historyObj: window.history, locationObj: window.location, query: "", scope: ACTIVE_SCOPE });
    renderEmpty("", { showNoResults: false, announce });
    return;
  }

  applySearchHistoryState({ historyObj: window.history, locationObj: window.location, query: qRaw, scope: ACTIVE_SCOPE });

  const searchState = buildSearchResultsState({
    normalizedQuery: q,
    activeScope: ACTIVE_SCOPE,
    gamesIndex: GAMES_INDEX,
    searchAlbumResults,
    searchTrackResults: TRACKS_INDEX,
    searchBookResults,
    normalize: norm,
  });

  const allCounts = searchState.allCounts;
  const counts = searchState.counts;
  const totalAll = searchState.totalAll;
  const total = searchState.total;
  const visibleSections = buildSearchVisibleSections(searchState, searchRuntimeMeta, {
    limits: { games: 40, tracks: 60, albums: 40, books: 40 },
  });

  applySearchResultsRuntimeUi({
    sectionUi: SECTION_UI,
    summaryEl: UI.summary,
    liveEl: FACTS.live,
    noResultsEl: UI.noResults,
    noResultsScopeHintEl: UI.noResultsScopeHint,
    noResultsHintEl: document.getElementById("no-results-hint"),
    query: qRaw,
    counts,
    activeScope: ACTIVE_SCOPE,
    labels: SEARCH_SCOPE_LABELS,
    totalAll,
    total,
    visibleSections,
  });

  if (total === 0) {
    announceSearchSummary({ summaryEl: UI.summary, announce });
    return;
  }

  announceSearchSummary({ summaryEl: UI.summary, announce });
}

function getFormQuery() {
  return safeStr(UI.input?.value);
}

function setFormQuery(v) {
  if (!UI.input) return;
  UI.input.value = v || "";
}

function clearAndFocus() {
  clearAndFocusSearchRuntimeState({ inputEl: UI.input, buttons: SCOPE_BTNS, clearBtn: UI.clearBtn, noResultsEl: UI.noResults, scope: ACTIVE_SCOPE });
  search('', { announce: true });
}

function bind() {
  if (!UI.form || !UI.input) return;

  // Scope controls
  const initialControllerState = applySearchControllerState({ inputEl: UI.input, buttons: SCOPE_BTNS, clearBtn: UI.clearBtn, href: window.location.href, fallbackScope: ACTIVE_SCOPE });
  ACTIVE_SCOPE = initialControllerState.scope;
  SCOPE_BTNS.forEach((b) => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      const next = normalizeSearchScope(b.getAttribute("data-search-scope"));
      if (next === ACTIVE_SCOPE) return;
      ACTIVE_SCOPE = applySearchControllerState({ inputEl: UI.input, buttons: SCOPE_BTNS, clearBtn: UI.clearBtn, query: getFormQuery(), scope: next }).scope;
      search(getFormQuery(), { announce: true });
    });
  });

  // Suggestion chips
  SUGGEST_BTNS.forEach((b) => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      const nextState = applySearchSuggestionRuntimeState({ buttonEl: b, inputEl: UI.input, buttons: SCOPE_BTNS, clearBtn: UI.clearBtn, noResultsEl: UI.noResults, scope: ACTIVE_SCOPE });
      if (!nextState.applied) return;
      search(nextState.query, { announce: true });
    });
  });

  UI.form.addEventListener("submit", (e) => {
    e.preventDefault();
    search(getFormQuery(), { announce: true });
  });

  UI.form.addEventListener("click", (e) => {
    const t = e.target;
    const btn = t && (t instanceof Element) ? t.closest("button[data-action]") : null;
    if (!btn) return;

    const action = String(btn.getAttribute("data-action") || "").trim().toLowerCase();
    if (action === "clear") {
      e.preventDefault();
      clearAndFocus();
    }
  });

  UI.input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const nextState = handleSearchEscapeRuntimeState({ inputEl: UI.input, buttons: SCOPE_BTNS, clearBtn: UI.clearBtn, noResultsEl: UI.noResults, scope: ACTIVE_SCOPE });
      if (nextState.cleared) {
        e.preventDefault();
        search('', { announce: true });
      }
    }
  });

  UI.input.addEventListener("input", () => {
    applySearchInputRuntimeState({ inputEl: UI.input, buttons: SCOPE_BTNS, clearBtn: UI.clearBtn, noResultsEl: UI.noResults, query: UI.input?.value, scope: ACTIVE_SCOPE });
  });

  const initial = initialControllerState.query;
  hydrateSearchFacts();
  applySearchControllerState({ inputEl: UI.input, buttons: SCOPE_BTNS, clearBtn: UI.clearBtn, query: UI.input?.value, scope: ACTIVE_SCOPE });

  if (initial) {
    setFormQuery(initial);
    search(initial, { announce: false });
  } else {
    renderEmpty("", { showNoResults: false, announce: false });
  }

  // Games index loads async; refresh facts and re-run the active query when ready.
  loadGamesIndex().then(() => {
    hydrateSearchFacts();
    const q = getFormQuery();
    if (q) search(q, { announce: false });
  });
}

bind();
