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

import { albums } from "../js/data.js";
import { books } from "../js/publishing-data.js";
import { sanitizeTrackId } from "../js/utils.js";
import {
  albumCanonicalPath,
  trackCanonicalPath,
  bookCanonicalPath,
  gameCanonicalPath,
} from "../js/routes.js";

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
const normalizeScope = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "music" || s === "publishing" || s === "games") return s;
  return "all";
};

const getScopeHintMessage = (scope) => {
  switch (scope) {
    case "music":
      return "No music matches in the current scope yet. Try All, open Music directly, or search a lyric phrase instead.";
    case "publishing":
      return "No publishing matches in the current scope yet. Try All, open Publishing directly, or search a series or volume title.";
    case "games":
      return "No game matches in the current scope yet. Try All or browse the live game catalog directly.";
    default:
      return "No exact matches yet. Try a shorter phrase, a broader search, or move into Music, Publishing, Lyrics, or Videos directly.";
  }
};

const SCOPE_LABEL = {
  all: "All",
  music: "Music",
  publishing: "Publishing",
  games: "Games",
};

const SCOPE_BTNS = Array.from(document.querySelectorAll('[data-search-control="scope"][data-search-scope]'));
const SUGGEST_BTNS = Array.from(document.querySelectorAll('[data-search-suggest]'));

let ACTIVE_SCOPE = "all";

function setScopePressed() {
  SCOPE_BTNS.forEach((b) => {
    const v = normalizeScope(b.getAttribute("data-search-scope"));
    const isActive = v === ACTIVE_SCOPE;
    b.setAttribute("aria-pressed", isActive ? "true" : "false");
    if (b.classList && b.classList.contains("chip")) b.classList.toggle("chip--active", isActive);
  });
}

const norm = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const safeStr = (v) => (typeof v === "string" ? v.trim() : "");

function ensureSitePath(pathOrUrl) {
  const s = safeStr(pathOrUrl);
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return "/" + s.replace(/^\/+/, "");
}

const readQueryParam = () => {
  try {
    const u = new URL(window.location.href);
    return safeStr(u.searchParams.get("q"));
  } catch {
    return "";
  }
};

const readScopeParam = () => {
  try {
    const u = new URL(window.location.href);
    return normalizeScope(u.searchParams.get("scope"));
  } catch {
    return "all";
  }
};

const writeQueryParam = (q) => {
  try {
    const u = new URL(window.location.href);
    if (q) u.searchParams.set("q", q);
    else u.searchParams.delete("q");
    if (ACTIVE_SCOPE && ACTIVE_SCOPE !== "all") u.searchParams.set("scope", ACTIVE_SCOPE);
    else u.searchParams.delete("scope");
    window.history.replaceState({}, "", u.toString());
  } catch {
    // ignore
  }
};

function albumCover(album) {
  const c = safeStr(album?.cover);
  return ensureSitePath(c) || "/assets/images/og/og-album.webp";
}

function albumTitle(album) {
  return safeStr(album?.title) || safeStr(album?.name) || safeStr(album?.id) || "Album";
}

function albumArtist(album) {
  return safeStr(album?.artist) || "Triad of Angels";
}

function trackTitle(track) {
  return safeStr(track?.title) || safeStr(track?.name) || safeStr(track?.id) || "Track";
}

function trackId(track) {
  const explicit = safeStr(track?.id) || safeStr(track?.slug);
  if (explicit) return explicit;
  const t = trackTitle(track);
  return t ? sanitizeTrackId(t) : "";
}

function flattenTracks() {
  const out = [];
  for (const a of Array.isArray(albums) ? albums : []) {
    const albumId = safeStr(a?.id) || safeStr(a?.slug);
    if (!albumId) continue;

    const list = Array.isArray(a?.tracks) ? a.tracks : [];
    for (const t of list) {
      if (typeof t === "string") {
        const tid = sanitizeTrackId(t);
        if (!tid) continue;
        out.push({
          album: a,
          track: { id: tid, title: t },
        });
        continue;
      }
      const tid = trackId(t);
      if (!tid) continue;
      out.push({
        album: a,
        track: { ...t, id: tid, title: trackTitle(t) },
      });
    }
  }
  return out;
}

const TRACKS_INDEX = flattenTracks();

// ---------- Games Index (truth-only from /games/catalog.json) ----------
let GAMES_INDEX = [];
let GAMES_READY = false;

function gameCover() {
  return "/assets/images/og/og-games.webp";
}

function normalizeGameItem(item) {
  const id = safeStr(item?.id);
  const title = safeStr(item?.title) || id || "Game";
  const subtitle = safeStr(item?.subtitle);
  const description = safeStr(item?.description);
  const tags = Array.isArray(item?.tags) ? item.tags.map((t) => safeStr(t)).filter(Boolean) : [];
  const path = ensureSitePath(item?.path) || (id ? gameCanonicalPath(id) : "");

  return {
    id,
    title,
    subtitle,
    description,
    tags,
    path,
    status: safeStr(item?.status) || "",
    type: safeStr(item?.type) || "",
    updatedAt: safeStr(item?.updatedAt) || "",
  };
}

function hydrateSearchFacts() {
  const albumTotal = Array.isArray(albums) ? albums.length : 0;
  const trackTotal = Array.isArray(TRACKS_INDEX) ? TRACKS_INDEX.length : 0;
  const gameTotal = Array.isArray(GAMES_INDEX) ? GAMES_INDEX.length : 0;
  const bookTotal = Array.isArray(books) ? books.length : 0;
  if (FACTS.albums) FACTS.albums.textContent = String(albumTotal);
  if (FACTS.tracks) FACTS.tracks.textContent = String(trackTotal);
  if (FACTS.games) FACTS.games.textContent = String(gameTotal);
  if (FACTS.indexed) FACTS.indexed.textContent = String(albumTotal + trackTotal + gameTotal + bookTotal);
}

async function loadGamesIndex() {
  if (GAMES_READY) return GAMES_INDEX;
  try {
    const res = await fetch("/games/catalog.json", { cache: "no-store" });
    if (!res.ok) throw new Error("catalog fetch failed");
    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];
    GAMES_INDEX = items.map(normalizeGameItem).filter((x) => x && x.path);
  } catch {
    GAMES_INDEX = [];
  }
  GAMES_READY = true;
  return GAMES_INDEX;
}

function makeCard({ href, coverSrc, coverAlt, title, meta, subtitle }) {
  const card = document.createElement("article");
  card.className = "album-card";
  card.setAttribute("role", "listitem");

  const cover = document.createElement("a");
  cover.className = "album-card__cover";
  cover.href = href;

  const img = document.createElement("img");
  img.src = coverSrc;
  img.alt = coverAlt;
  img.width = 900;
  img.height = 900;
  img.decoding = "async";
  img.loading = "lazy";
  img.referrerPolicy = "no-referrer";

  cover.appendChild(img);

  const body = document.createElement("div");
  body.className = "album-card__body";

  const h = document.createElement("h4");
  h.className = "album-card__title";
  const a = document.createElement("a");
  a.href = href;
  a.textContent = title;
  h.appendChild(a);

  const pMeta = document.createElement("p");
  pMeta.className = "album-card__meta";
  pMeta.textContent = meta;

  body.appendChild(h);
  body.appendChild(pMeta);

  if (subtitle) {
    const pSub = document.createElement("p");
    pSub.className = "album-card__genre";
    pSub.textContent = subtitle;
    body.appendChild(pSub);
  }

  card.appendChild(cover);
  card.appendChild(body);
  return card;
}

function setCount(el, count, labelBase) {
  if (!el) return;
  el.textContent = String(count);
  if (labelBase) el.setAttribute("aria-label", `${labelBase} results: ${count}`);
}

function hideGroup(group, countEl) {
  if (group) group.hidden = true;
  setCount(countEl, 0);
}

function showGroup(group, countEl, count, labelBase) {
  if (group) group.hidden = false;
  setCount(countEl, count, labelBase);
}

function syncClearButton() {
  if (!UI.clearBtn) return;
  UI.clearBtn.hidden = !safeStr(UI.input?.value);
}

function clearResults() {
  UI.gamesWrap?.replaceChildren();
  UI.tracksWrap?.replaceChildren();
  UI.albumsWrap?.replaceChildren();
  UI.booksWrap?.replaceChildren();
  if (FACTS.live) FACTS.live.textContent = '0';

  hideGroup(UI.gamesGroup, UI.gamesCount);
  hideGroup(UI.tracksGroup, UI.tracksCount);
  hideGroup(UI.albumsGroup, UI.albumsCount);
  hideGroup(UI.booksGroup, UI.booksCount);

  if (UI.summary) UI.summary.textContent = "";
  syncClearButton();
  if (UI.noResults) UI.noResults.hidden = true;
  if (UI.noResultsScopeHint) UI.noResultsScopeHint.hidden = true;
}

function focusSummary() {
  if (!UI.summary) return;
  try {
    UI.summary.setAttribute("tabindex", "-1");
    UI.summary.focus({ preventScroll: true });
  } catch {
    // ignore
  }
}

function renderEmpty(q, { showNoResults = false, announce = false } = {}) {
  clearResults();
  if (!UI.summary) return;

  const scopeLabel = SCOPE_LABEL[ACTIVE_SCOPE] || "All";
  if (!q) {
    UI.summary.textContent = "Type a search above, or browse one of the main sections below.";
  } else if (ACTIVE_SCOPE !== "all") {
    UI.summary.textContent = `No ${scopeLabel.toLowerCase()} matches for “${q}”.`;
  } else {
    UI.summary.textContent = `No exact matches for “${q}”.`;
  }

  if (UI.noResults) UI.noResults.hidden = !showNoResults;
  if (UI.noResultsScopeHint) UI.noResultsScopeHint.hidden = ACTIVE_SCOPE === "all";
  const noResultsHint = document.getElementById("no-results-hint");
  if (noResultsHint) noResultsHint.textContent = getScopeHintMessage(ACTIVE_SCOPE);
  if (announce) focusSummary();
}

function renderSummary(qRaw, counts) {
  if (!UI.summary) return;
  const { games, tracks, albums: aCount, books: bCount } = counts;

  const total = games + tracks + aCount + bCount;
  if (FACTS.live) FACTS.live.textContent = String(total);
  const parts = [];
  if (games) parts.push(`${games} game${games === 1 ? "" : "s"}`);
  if (tracks) parts.push(`${tracks} track${tracks === 1 ? "" : "s"}`);
  if (aCount) parts.push(`${aCount} album${aCount === 1 ? "" : "s"}`);
  if (bCount) parts.push(`${bCount} book${bCount === 1 ? "" : "s"}`);

  const scopeSuffix = ACTIVE_SCOPE !== "all" ? ` (Scope: ${SCOPE_LABEL[ACTIVE_SCOPE] || "All"})` : "";
  UI.summary.textContent = `${total} result${total === 1 ? "" : "s"} for “${qRaw}”${scopeSuffix}${parts.length ? ` — ${parts.join(", ")}.` : "."}`;
}

function search(qRaw, { announce = false } = {}) {
  const q = norm(qRaw);
  if (!q) {
    writeQueryParam("");
    renderEmpty("", { showNoResults: false, announce });
    return;
  }

  writeQueryParam(qRaw);

  // Games
  const gameMatches = [];
  for (const g of Array.isArray(GAMES_INDEX) ? GAMES_INDEX : []) {
    const hay = norm([g.title, g.subtitle, g.description, (g.tags || []).join(" ")].join(" "));
    if (hay.includes(q)) gameMatches.push(g);
  }

  // Albums
  const albumMatches = [];
  for (const a of Array.isArray(albums) ? albums : []) {
    const hay = norm([
      albumTitle(a),
      albumArtist(a),
      safeStr(a?.genre),
      safeStr(a?.year),
      safeStr(a?.description),
    ].join(" "));
    if (hay.includes(q)) albumMatches.push(a);
  }

  // Tracks
  const trackMatches = [];
  for (const item of TRACKS_INDEX) {
    const a = item.album;
    const t = item.track;
    const hay = norm([trackTitle(t), albumTitle(a), albumArtist(a), safeStr(a?.genre)].join(" "));
    if (hay.includes(q)) trackMatches.push(item);
  }

  // Books
  const bookMatches = [];
  for (const b of Array.isArray(books) ? books : []) {
    const hay = norm([
      safeStr(b?.title),
      safeStr(b?.subtitle),
      safeStr(b?.series),
      safeStr(b?.author),
      safeStr(b?.description),
      safeStr(b?.tags),
    ].join(" "));
    if (hay.includes(q)) bookMatches.push(b);
  }

  // All matches are computed, then the active scope decides what is rendered.
  const allCounts = {
    games: gameMatches.length,
    tracks: trackMatches.length,
    albums: albumMatches.length,
    books: bookMatches.length,
  };

  const allow = {
    all: { games: true, tracks: true, albums: true, books: true },
    music: { games: false, tracks: true, albums: true, books: false },
    publishing: { games: false, tracks: false, albums: false, books: true },
    games: { games: true, tracks: false, albums: false, books: false },
  };

  const a = allow[ACTIVE_SCOPE] || allow.all;
  const visibleGames = a.games ? gameMatches : [];
  const visibleTracks = a.tracks ? trackMatches : [];
  const visibleAlbums = a.albums ? albumMatches : [];
  const visibleBooks = a.books ? bookMatches : [];

  const counts = {
    games: visibleGames.length,
    tracks: visibleTracks.length,
    albums: visibleAlbums.length,
    books: visibleBooks.length,
  };

  const totalAll = allCounts.games + allCounts.tracks + allCounts.albums + allCounts.books;
  const total = counts.games + counts.tracks + counts.albums + counts.books;

  clearResults();
  renderSummary(qRaw, counts);

  if (UI.noResultsScopeHint) {
    UI.noResultsScopeHint.hidden = !(ACTIVE_SCOPE !== "all" && totalAll > 0 && total === 0);
  }
  const noResultsHint = document.getElementById("no-results-hint");
  if (noResultsHint) noResultsHint.textContent = getScopeHintMessage(ACTIVE_SCOPE);

  if (total === 0) {
    if (UI.noResults) UI.noResults.hidden = false;
    if (announce) focusSummary();
    return;
  }

  // Games
  if (visibleGames.length) {
    showGroup(UI.gamesGroup, UI.gamesCount, visibleGames.length, "Games");
    const frag = document.createDocumentFragment();
    for (const g of visibleGames.slice(0, 40)) {
      const href = g.path || (g.id ? gameCanonicalPath(g.id) : "/games/");
      const meta = ["Games", safeStr(g.type) || "Build", safeStr(g.updatedAt) ? `Updated ${safeStr(g.updatedAt)}` : ""].filter(Boolean).join(" • ");
      frag.appendChild(
        makeCard({
          href,
          coverSrc: gameCover(),
          coverAlt: `ToA Games — ${g.title}`,
          title: g.title,
          meta,
          subtitle: g.subtitle ? g.subtitle : "Playable build",
        })
      );
    }
    UI.gamesWrap?.appendChild(frag);
  }

  // Tracks
  if (visibleTracks.length) {
    showGroup(UI.tracksGroup, UI.tracksCount, visibleTracks.length, "Tracks");
    const frag = document.createDocumentFragment();
    for (const { album, track } of visibleTracks.slice(0, 60)) {
      const albumId = safeStr(album?.id) || safeStr(album?.slug);
      const tid = safeStr(track?.id);
      const href = trackCanonicalPath(albumId, tid) || `/track.html?album=${encodeURIComponent(albumId)}&track=${encodeURIComponent(tid)}`;
      frag.appendChild(
        makeCard({
          href,
          coverSrc: albumCover(album),
          coverAlt: `${albumTitle(album)} cover`,
          title: trackTitle(track),
          meta: albumTitle(album),
          subtitle: "Music • Track",
        })
      );
    }
    UI.tracksWrap?.appendChild(frag);
  }

  // Albums
  if (visibleAlbums.length) {
    showGroup(UI.albumsGroup, UI.albumsCount, visibleAlbums.length, "Albums");
    const frag = document.createDocumentFragment();
    for (const a of visibleAlbums.slice(0, 40)) {
      const id = safeStr(a?.id) || safeStr(a?.slug);
      const href = albumCanonicalPath(id) || `/album.html?album=${encodeURIComponent(id)}`;
      frag.appendChild(
        makeCard({
          href,
          coverSrc: albumCover(a),
          coverAlt: `${albumTitle(a)} cover`,
          title: albumTitle(a),
          meta: `${albumArtist(a)}${safeStr(a?.year) ? ` • ${safeStr(a.year)}` : ""}`,
          subtitle: safeStr(a?.genre) ? safeStr(a.genre) : "Music • Album",
        })
      );
    }
    UI.albumsWrap?.appendChild(frag);
  }

  // Books
  if (visibleBooks.length) {
    showGroup(UI.booksGroup, UI.booksCount, visibleBooks.length, "Books");
    const frag = document.createDocumentFragment();
    for (const b of visibleBooks.slice(0, 40)) {
      const id = safeStr(b?.id) || safeStr(b?.slug);
      const href = bookCanonicalPath(id) || `/book.html?id=${encodeURIComponent(id)}`;
      frag.appendChild(
        makeCard({
          href,
          coverSrc: safeStr(b?.covers?.square) || safeStr(b?.covers?.portrait) || "/assets/images/og/og-publishing.webp",
          coverAlt: `${safeStr(b?.title) || "Book"} cover`,
          title: safeStr(b?.title) || "Book",
          meta: safeStr(b?.author) || "Publishing",
          subtitle: "Publishing • Book",
        })
      );
    }
    UI.booksWrap?.appendChild(frag);
  }

  if (announce) focusSummary();
}

function getFormQuery() {
  return safeStr(UI.input?.value);
}

function setFormQuery(v) {
  if (!UI.input) return;
  UI.input.value = v || "";
}

function clearAndFocus() {
  setFormQuery("");
  search("", { announce: true });
  try { UI.input?.focus({ preventScroll: true }); } catch {}
}

function bind() {
  if (!UI.form || !UI.input) return;

  // Scope controls
  ACTIVE_SCOPE = readScopeParam();
  setScopePressed();
  SCOPE_BTNS.forEach((b) => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      const next = normalizeScope(b.getAttribute("data-search-scope"));
      if (next === ACTIVE_SCOPE) return;
      ACTIVE_SCOPE = next;
      setScopePressed();
      search(getFormQuery(), { announce: true });
    });
  });

  // Suggestion chips
  SUGGEST_BTNS.forEach((b) => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      const v = safeStr(b.getAttribute("data-search-suggest"));
      if (!v) return;
      setFormQuery(v);
      syncClearButton();
      search(v, { announce: true });
      try { UI.input?.focus({ preventScroll: true }); } catch {}
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
      e.preventDefault();
      clearAndFocus();
    }
  });

  UI.input.addEventListener("input", () => {
    if (UI.noResults) UI.noResults.hidden = true;
    syncClearButton();
  });

  const initial = readQueryParam();
  hydrateSearchFacts();
  syncClearButton();

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
