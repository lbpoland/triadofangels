// js/publishing.js — Publishing library renderer (ESM)
// - Search + sort + filters (chips) + shelf browsing
// - Keyboard accessible and CLS-hardened covers
// - Dynamic JSON-LD ItemList injected into #dynamic-jsonld

import {
  books,
  sagas,
  series,
  getSagaById,
  getSeriesById,
  toAbsoluteSiteUrl,
  parseApproxDate,
  amazonUrlFor,
} from './publishing-data.js?v=5';

const SITE_ORIGIN = 'https://www.triadofangels.com';
const DEFAULT_COVER = '/assets/images/publishing/default-book-cover.webp';

const $ = (id) => document.getElementById(id);

const UI = {
  search: $('library-search-input'),
  sort: $('library-sort-select'),
  chips: $('library-chips'),
  meta: $('library-results-meta'),
  grid: $('library-grid'),
  empty: $('library-empty'),
  jsonld: $('dynamic-jsonld'),
  toolbar: document.querySelector('.library-toolbar'),
  reset: $('library-reset-btn'),
  countBadge: $('library-count-badge'),
  metaSagas: $('publishing-meta-sagas'),
  metaSeries: $('publishing-meta-series'),
  metaBooks: $('publishing-meta-books'),
  startStat: $('publishing-start-stat'),
  seriesStat: $('publishing-series-stat'),
  shelvesStat: $('publishing-shelves-stat'),
  libraryStat: $('publishing-library-stat'),
  shelvesCount: $('publishing-shelves-count'),
  shelvesBlock: document.getElementById('shelves'),
  seriesBlock: document.getElementById('series'),
  seriesRail: $('publishing-series-rail'),
  seriesCount: $('publishing-series-count'),
  libraryBlock: document.getElementById('library'),
};

const setGridBusy = (isBusy) => {
  if (!UI.grid) return;
  UI.grid.setAttribute('aria-busy', isBusy ? 'true' : 'false');
  UI.grid.dataset.loading = isBusy ? 'true' : 'false';
};

const setGridState = (state) => {
  if (!UI.grid) return;
  UI.grid.dataset.state = state;
};

const updateCatalogMeta = () => {
  if (UI.metaSagas) UI.metaSagas.textContent = `${sagas.length}`;
  if (UI.metaSeries) UI.metaSeries.textContent = `${series.length}`;
  if (UI.metaBooks) UI.metaBooks.textContent = `${books.length}`;

  const startSeriesVolumes = RECORDS.filter((r) => r.book.seriesId === 'unseen-age').length;
  if (UI.startStat) UI.startStat.textContent = startSeriesVolumes ? `${startSeriesVolumes} live volume${startSeriesVolumes === 1 ? '' : 's'} in reading order` : 'Reading order updates here';
};


const normalize = (value) => {
  const s = (value ?? '').toString();
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const slug = (value) => normalize(value).replace(/\s+/g, '-');

const titleize = (value) => {
  const s = (value ?? '').toString().trim();
  if (!s) return '';
  return s
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};


const detectAmazonRegion = (availableKeys) => {
  const keys = new Set((availableKeys || []).map((k) => String(k || '').trim().toUpperCase()).filter(Boolean));
  if (!keys.size) return 'US';

  const lang = (() => { try { return String(navigator.language || navigator.userLanguage || '').trim(); } catch { return ''; } })();
  const upper = lang.toUpperCase();
  const tz = (() => { try { return String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').trim(); } catch { return ''; } })();

  const candidates = [];
  const m = /-([A-Z]{2})\b/.exec(upper);
  if (m && m[1]) candidates.push(m[1]);

  if (/AUSTRALIA|SYDNEY|MELBOURNE|BRISBANE|PERTH/i.test(tz)) candidates.push('AU');
  if (/EUROPE\/LONDON/i.test(tz)) candidates.push('UK');
  if (/EUROPE\/BERLIN/i.test(tz)) candidates.push('DE');
  if (/EUROPE\/PARIS/i.test(tz)) candidates.push('FR');
  if (/EUROPE\/MADRID/i.test(tz)) candidates.push('ES');
  if (/EUROPE\/ROME/i.test(tz)) candidates.push('IT');
  if (/AMERICA\/TORONTO/i.test(tz)) candidates.push('CA');
  if (/ASIA\/TOKYO/i.test(tz)) candidates.push('JP');
  if (/ASIA\/KOLKATA/i.test(tz)) candidates.push('IN');

  for (const c of candidates) {
    if (keys.has(c)) return c;
  }

  if (keys.has('AU')) return 'AU';
  if (keys.has('US')) return 'US';

  return Array.from(keys).sort((a,b)=>a.localeCompare(b))[0];
};

const bookHref = (bookId, book) => {
  const p = book && typeof book.canonicalPath === 'string' ? book.canonicalPath.trim() : '';
  if (p) return p.endsWith('/') ? p : (p + '/');
  return `/book.html?id=${encodeURIComponent(bookId)}`;
};
const bookAbsUrl = (bookId, book) => {
  const p = book && typeof book.canonicalPath === 'string' ? book.canonicalPath.trim() : '';
  if (p) return `${SITE_ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`.replace(/\/index\.html$/,'');
  return `${SITE_ORIGIN}/book.html?id=${encodeURIComponent(bookId)}`;
};

const getPrimaryCover = (book) => {
  const c = book?.covers || {};
  const portrait = typeof c.portrait === 'string' ? c.portrait.trim() : '';
  const square = typeof c.square === 'string' ? c.square.trim() : '';
  return portrait || square || '';
};

const pickPrimaryStoreLink = (book) => {
  const stores = book?.stores || {};
  const ordered = [
    ['amazon', 'Amazon'],
    ['kobo', 'Kobo'],
    ['appleBooks', 'Apple Books'],
    ['googlePlayBooks', 'Google Play Books'],
    ['gumroad', 'Gumroad'],
    ['itch', 'itch.io'],
    ['website', 'Website'],
  ];

  for (const [key, label] of ordered) {
    const url = stores?.[key];
    if (typeof url === 'string' && url.trim()) return { key, label, url: url.trim() };
  }
  return null;
};



const hasAmazonRegional = (book) => {
  const ar = book?.stores?.amazonRegional;
  return ar && typeof ar === 'object' && !Array.isArray(ar) && Object.keys(ar).length > 0;
};

const amazonRegionalEntries = (book) => {
  const ar = book?.stores?.amazonRegional;
  if (!ar || typeof ar !== 'object' || Array.isArray(ar)) return [];
  return Object.entries(ar)
    .map(([k, v]) => [String(k).trim(), (typeof v === 'string' ? v.trim() : '')])
    .filter(([k, v]) => k && v);
};

const buildAmazonRegionAction = (book) => {
  // Builds a region selector + a primary Amazon button that updates href on selection.
  const wrap = document.createElement('div');
  wrap.className = 'region-store';
  wrap.setAttribute('data-store', 'amazon');

  const label = document.createElement('span');
  label.className = 'region-store__label';
  label.textContent = 'Amazon region';
  wrap.appendChild(label);

  const select = document.createElement('select');
  select.className = 'region-store__select';
  select.setAttribute('aria-label', 'Select Amazon region');
  select.setAttribute('data-amazon-region', '1');

  const entries = amazonRegionalEntries(book);
  const preferred = detectAmazonRegion(entries.map(([k]) => k));
  for (const [k, url] of entries) {
    const opt = document.createElement('option');
    opt.value = url;
    opt.textContent = k;
    if (k === preferred) opt.selected = true;
    select.appendChild(opt);
  }

  const btn = document.createElement('a');
  btn.className = 'btn';
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.referrerPolicy = 'no-referrer';
  btn.textContent = 'Buy (Amazon)';
  btn.setAttribute('aria-label', `Buy ${book.title || 'book'} on Amazon (opens in a new tab)`);

  // Initial href: prefer explicit stores.amazon (already region default), else first entry.
  const defaultHref = (book?.stores?.amazon && typeof book.stores.amazon === 'string' && book.stores.amazon.trim())
    ? book.stores.amazon.trim()
    : (entries[0]?.[1] || '');
  btn.href = defaultHref;

  wrap.appendChild(select);
  wrap.appendChild(btn);

  return wrap;
};

const wireAmazonRegionActions = () => {
  // Delegated change handler: update the sibling Amazon button href.
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLSelectElement)) return;
    if (!t.matches('select[data-amazon-region]')) return;

    const wrap = t.closest('.region-store');
    if (!wrap) return;
    const btn = wrap.querySelector('a.btn');
    if (!btn) return;

    const url = typeof t.value === 'string' ? t.value.trim() : '';
    if (url) btn.setAttribute('href', url);
  }, { passive: true });
};



const matchesAnyFormat = (book, selected) => {
  if (!selected.size) return true;
  const f = book?.formats || {};
  const check = (k) => !!(f?.[k] && f[k].available === true);
  for (const k of selected) {
    if (k === 'epub' && check('epub')) return true;
    if (k === 'pdf' && check('pdf')) return true;
    if (k === 'print' && check('print')) return true;
    if (k === 'audiobook' && check('audiobook')) return true;
  }
  return false;
};

const SAGA_ORDER = new Map(sagas.map((s, i) => [s.id, i]));
const SERIES_ORDER = new Map(series.map((s, i) => [s.id, i]));

const RECORDS = books.map((b) => {
  const saga = getSagaById(b.sagaId);
  const ser = getSeriesById(b.seriesId);
  const parts = [
    b.id,
    b.title,
    b.subtitle,
    b.author,
    saga?.title,
    saga?.shortTitle,
    ser?.title,
    ser?.shortTitle,
    ...(Array.isArray(b.genres) ? b.genres : []),
    ...(Array.isArray(b.tags) ? b.tags : []),
    b.logline,
    b.blurb,
  ].filter(Boolean);

  return {
    book: b,
    haystack: normalize(parts.join(' ')),
    title: normalize(b.title),
    date: parseApproxDate(b),
    sagaOrder: SAGA_ORDER.get(b.sagaId) ?? 999,
    seriesOrder: SERIES_ORDER.get(b.seriesId) ?? 999,
    seriesNumber: Number.isFinite(b.seriesNumber) ? b.seriesNumber : null,
    seriesNumberSort: Number.isFinite(b.seriesNumber) ? b.seriesNumber : 999,
  };
});

const FORMAT_DEFS = [
  { key: 'epub', label: 'EPUB' },
  { key: 'pdf', label: 'PDF' },
  { key: 'print', label: 'Print' },
  { key: 'audiobook', label: 'Audiobook' },
];

const getDistinct = (arr) => [...new Set(arr.filter(Boolean))];

const DISTINCT_GENRES = getDistinct(
  books
    .flatMap((b) => (Array.isArray(b.genres) ? b.genres : []))
    .map((g) => slug(g))
    .filter(Boolean)
);

const DISTINCT_STATUSES = getDistinct(
  books
    .map((b) => (typeof b.status === 'string' ? slug(b.status) : ''))
    .filter(Boolean)
);

const state = {
  q: '',
  sort: 'featured',
  filters: {
    saga: new Set(),
    series: new Set(),
    genre: new Set(),
    status: new Set(),
    format: new Set(),
  },
};


// ------------------------
// Deep-link filters
// - Enables saga/series hubs to link directly to filtered library states.
// - Supports: ?q=, ?sort=, ?saga=, ?series=, ?status=, ?format=, ?genre=
// - Values are validated against current Publishing data.
// ------------------------
const parseCsv = (v) => String(v || '')
  .split(',')
  .map((s) => String(s || '').trim())
  .filter(Boolean)
  .slice(0, 8);

const VALID_SORTS = new Set(['featured', 'newest', 'oldest', 'az', 'za']);

const applyDeepLinkFromUrl = () => {
  try {
    const sp = new URLSearchParams(window.location.search || '');

    const q = String(sp.get('q') || '').trim();
    const sort = String(sp.get('sort') || '').trim();
    const sagaIds = parseCsv(sp.get('saga'));
    const seriesIds = parseCsv(sp.get('series'));
    const statuses = parseCsv(sp.get('status')).map((s) => slug(s));
    const formats = parseCsv(sp.get('format')).map((s) => slug(s));
    const genres = parseCsv(sp.get('genre')).map((s) => slug(s));

    if (q) {
      state.q = q.slice(0, 120);
      if (UI.search) UI.search.value = state.q;
    }

    if (sort && VALID_SORTS.has(sort)) {
      state.sort = sort;
      if (UI.sort) UI.sort.value = sort;
    }

    sagaIds.forEach((id) => { if (getSagaById(id)) state.filters.saga.add(id); });
    seriesIds.forEach((id) => { if (getSeriesById(id)) state.filters.series.add(id); });

    statuses.forEach((s) => { if (DISTINCT_STATUSES.includes(s)) state.filters.status.add(s); });
    formats.forEach((f) => { if (FORMAT_DEFS.some((x) => x.key === f)) state.filters.format.add(f); });
    genres.forEach((g) => { if (DISTINCT_GENRES.includes(g)) state.filters.genre.add(g); });
  } catch {
    // ignore
  }
};

const syncUrlToState = () => {
  try {
    const sp = new URLSearchParams();

    const q = String(state.q || '').trim();
    if (q) sp.set('q', q.slice(0, 120));

    if (state.sort && state.sort !== 'featured') sp.set('sort', state.sort);

    const saga = Array.from(state.filters.saga);
    if (saga.length) sp.set('saga', saga.join(','));

    const ser = Array.from(state.filters.series);
    if (ser.length) sp.set('series', ser.join(','));

    const status = Array.from(state.filters.status);
    if (status.length) sp.set('status', status.join(','));

    const format = Array.from(state.filters.format);
    if (format.length) sp.set('format', format.join(','));

    const genre = Array.from(state.filters.genre);
    if (genre.length) sp.set('genre', genre.join(','));

    const next = sp.toString();
    const base = window.location.pathname || '/publishing.html';
    const url = next ? `${base}?${next}${window.location.hash || ''}` : `${base}${window.location.hash || ''}`;
    window.history.replaceState({}, '', url);
  } catch {
    // ignore
  }
};

const clearNode = (node) => {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
};

const getTokens = (query) => {
  const q = normalize(query);
  if (!q) return [];
  return q.split(' ').filter(Boolean).slice(0, 8);
};

const isChipActive = (groupKey, value) => !!state.filters[groupKey]?.has(value);

const toggleChip = (groupKey, value) => {
  const set = state.filters[groupKey];
  if (!set) return;
  if (set.has(value)) set.delete(value);
  else set.add(value);
};

const clearAllFilters = () => {
  Object.values(state.filters).forEach((s) => s.clear());
};

const getActiveFilterSummary = () => {
  const parts = [];

  if (state.filters.saga.size) {
    const labels = [...state.filters.saga]
      .map((id) => getSagaById(id)?.shortTitle || getSagaById(id)?.title || id)
      .filter(Boolean);
    if (labels.length) parts.push(`Saga: ${labels.join(', ')}`);
  }

  if (state.filters.series.size) {
    const labels = [...state.filters.series]
      .map((id) => getSeriesById(id)?.shortTitle || getSeriesById(id)?.title || id)
      .filter(Boolean);
    if (labels.length) parts.push(`Series: ${labels.join(', ')}`);
  }

  if (state.filters.genre.size) {
    const labels = [...state.filters.genre].map((g) => titleize(g));
    if (labels.length) parts.push(`Genre: ${labels.join(', ')}`);
  }

  if (state.filters.status.size) {
    const labels = [...state.filters.status].map((s) => titleize(s));
    if (labels.length) parts.push(`Status: ${labels.join(', ')}`);
  }

  if (state.filters.format.size) {
    const labels = [...state.filters.format].map((f) => titleize(f));
    if (labels.length) parts.push(`Format: ${labels.join(', ')}`);
  }

  return parts.length ? parts.join(' • ') : 'No filters';
};

const bookMatchesFilters = (book) => {
  if (state.filters.saga.size && !state.filters.saga.has(book.sagaId)) return false;
  if (state.filters.series.size && !state.filters.series.has(book.seriesId)) return false;

  if (state.filters.genre.size) {
    const genres = Array.isArray(book.genres) ? book.genres : [];
    const slugs = genres.map((g) => slug(g)).filter(Boolean);
    if (!slugs.some((g) => state.filters.genre.has(g))) return false;
  }

  if (state.filters.status.size) {
    const s = typeof book.status === 'string' ? slug(book.status) : '';
    if (!s || !state.filters.status.has(s)) return false;
  }

  if (!matchesAnyFormat(book, state.filters.format)) return false;

  return true;
};

const byTitle = (a, b) => (a.book.title || '').localeCompare(b.book.title || '', undefined, { sensitivity: 'base' });

const sortRecords = (recs, mode) => {
  if (mode === 'az') return [...recs].sort(byTitle);
  if (mode === 'za') return [...recs].sort((a, b) => byTitle(b, a));

  if (mode === 'newest') return [...recs].sort((a, b) => (b.date || 0) - (a.date || 0) || byTitle(a, b));
  if (mode === 'oldest') return [...recs].sort((a, b) => (a.date || 0) - (b.date || 0) || byTitle(a, b));

  return [...recs].sort((a, b) => {
    if (a.sagaOrder !== b.sagaOrder) return a.sagaOrder - b.sagaOrder;
    if (a.seriesOrder !== b.seriesOrder) return a.seriesOrder - b.seriesOrder;
    if (a.seriesNumberSort !== b.seriesNumberSort) return a.seriesNumberSort - b.seriesNumberSort;
    if ((b.date || 0) !== (a.date || 0)) return (b.date || 0) - (a.date || 0);
    return byTitle(a, b);
  });
};

const scoreRecord = (rec, tokens) => {
  if (!tokens.length) return 0;
  let score = 0;
  for (const tok of tokens) {
    if (rec.title.includes(tok)) score += 6;
    else if (rec.haystack.includes(tok)) score += 2;
    else return -1;
  }
  return score;
};

const filterAndRank = () => {
  const tokens = getTokens(state.q);
  const base = RECORDS.filter((r) => bookMatchesFilters(r.book));

  if (!tokens.length) return sortRecords(base, state.sort);

  const scored = [];
  for (const rec of base) {
    const s = scoreRecord(rec, tokens);
    if (s >= 0) scored.push({ rec, score: s });
  }

  scored.sort((a, b) => b.score - a.score);
  const ranked = scored.map((x) => x.rec);
  return sortRecords(ranked, state.sort);
};

const buildCoverNode = (book) => {
  const a = document.createElement('a');
  a.className = 'book-card__cover';
  a.href = bookHref(book.id, book);
  a.setAttribute('aria-label', `Open ${book.title || 'book'} details`);

  const rawCover = getPrimaryCover(book);
  const cover = (typeof rawCover === 'string' && rawCover.trim()) ? rawCover.trim() : DEFAULT_COVER;

  const img = document.createElement('img');
  img.className = 'book-card__cover-img';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = `${book.title || 'Book'} cover`;

  // Always try to show an image (premium). Fall back to the default cover, then to initials.
  img.src = cover;

  const swapToInitials = () => {
    const fallback = document.createElement('div');
    fallback.className = 'book-card__cover-fallback';

    const initials = (book.title || 'Book')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
    fallback.textContent = initials || 'B';

    a.replaceChildren(fallback);
  };

  img.onerror = () => {
    if (img.dataset.toaFallbackTried === '1') {
      swapToInitials();
      return;
    }
    img.dataset.toaFallbackTried = '1';
    img.src = DEFAULT_COVER;
  };

  a.appendChild(img);
  return a;
};

const buildBookCard = (book) => {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.setAttribute('data-book-id', book.id);

  card.appendChild(buildCoverNode(book));

  const body = document.createElement('div');
  body.className = 'book-card__body';

  const h3 = document.createElement('h3');
  h3.className = 'book-card__title';
  const titleLink = document.createElement('a');
  titleLink.href = bookHref(book.id, book);
  titleLink.textContent = book.title || book.id;
  h3.appendChild(titleLink);

  const sub = document.createElement('p');
  sub.className = 'book-card__subtitle';
  sub.textContent = book.subtitle ? book.subtitle : '';

  const meta = document.createElement('div');
  meta.className = 'book-card__meta';

  const addPill = (text, cls = '') => {
    if (!text) return;
    const s = document.createElement('span');
    s.className = cls ? `pill ${cls}` : 'pill';
    s.textContent = text;
    meta.appendChild(s);
  };

  const saga = getSagaById(book.sagaId);
  const ser = getSeriesById(book.seriesId);

  addPill(saga?.shortTitle || saga?.title || '');
  addPill(ser?.shortTitle || ser?.title || '');
  if (Number.isFinite(book.seriesNumber)) addPill(`Book ${book.seriesNumber}`);
  if (book.status) {
    const st = String(book.status).trim();
    const k = slug(st);
    addPill(st, k === 'reserved' ? 'pill--reserved' : (k ? `pill--${k}` : ''));
  }
  if (Array.isArray(book.genres) && book.genres.length) addPill(book.genres[0]);

  const logline = document.createElement('p');
  logline.className = 'book-card__logline';
  logline.textContent = book.logline ? book.logline : '';

  const actions = document.createElement('div');
  actions.className = 'book-card__actions';

  const details = document.createElement('a');
  details.className = 'btn btn--ghost';
  details.href = bookHref(book.id, book);
  details.textContent = 'Details';
  details.setAttribute('aria-label', `Open details for ${book.title || book.id}`);
  actions.appendChild(details);

  // Store actions (truthful): if Amazon regional links exist, render region selector.
  if (hasAmazonRegional(book)) {
    actions.appendChild(buildAmazonRegionAction(book));
  } else {
    const store = pickPrimaryStoreLink(book);
    if (store) {
      const buy = document.createElement('a');
      buy.className = 'btn';
      buy.href = store.url;
      buy.target = '_blank';
      buy.rel = 'noopener noreferrer';
      buy.referrerPolicy = 'no-referrer';
      buy.textContent = `Buy (${store.label})`;
      buy.setAttribute('aria-label', `Buy ${book.title} on ${store.label} (opens in a new tab)`);
      actions.appendChild(buy);
    }
  }

  body.appendChild(h3);
  if (sub.textContent) body.appendChild(sub);
  if (meta.childNodes.length) body.appendChild(meta);
  if (logline.textContent) body.appendChild(logline);
  body.appendChild(actions);

  card.appendChild(body);
  return card;
};

const renderGrid = (recs) => {
  if (!UI.grid) return;
  setGridBusy(true);

  const frag = document.createDocumentFragment();
  for (const r of recs) frag.appendChild(buildBookCard(r));

  UI.grid.replaceChildren(frag);
  setGridBusy(false);
};

const syncResetButton = () => {
  if (!UI.reset) return;
  const hasActive = Boolean((state.q || "").trim()) || state.sort !== "featured" || Object.values(state.filters).some((s) => s.size > 0);
  UI.reset.disabled = !hasActive;
  UI.reset.setAttribute("aria-disabled", hasActive ? "false" : "true");
};

const renderMeta = (count) => {
  // Meta line is both visible and SR-friendly.
  const total = Array.isArray(books) ? books.length : 0;

  if (UI.countBadge) {
    UI.countBadge.hidden = !(total > 0);
    if (total > 0) UI.countBadge.textContent = `${count} / ${total}`;
  }

  if (UI.libraryStat) {
    UI.libraryStat.textContent = total ? `${count} of ${total} live title${total === 1 ? '' : 's'} shown` : 'Library updates here as more titles go live';
  }

  if (!UI.meta) return;
  const qActive = normalize(state.q);
  const q = qActive ? `Query: “${state.q.trim()}”` : "Query: all live titles";
  const f = getActiveFilterSummary();
  UI.meta.textContent = `${count} of ${total} book${total === 1 ? "" : "s"} shown • ${q} • ${f}`;
  syncResetButton();
};

const injectJsonLd = (recs) => {
  if (!UI.jsonld) return;
  const list = recs.slice(0, 50).map((r, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: r.book.title || r.book.id,
    url: bookAbsUrl(r.book.id, r.book),
  }));

  const json = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Publishing Library | Triad of Angels',
    url: `${SITE_ORIGIN}/publishing.html`,
    numberOfItems: recs.length,
    itemListElement: list,
  };

  UI.jsonld.textContent = JSON.stringify(json);
};

const ensureShelvesRoot = () => {
  // CSP-safe + CLS-safe: do not create/insert elements at runtime.
  // The shelves root is declared in publishing.html and is optional.
  return document.getElementById('library-shelves');
};

const buildShelf = ({ heading, headingHref, subheading, items, onViewAll }) => {
  const section = document.createElement('section');
  section.className = 'shelf';

  const header = document.createElement('div');
  header.className = 'shelf__header';

  const h3 = document.createElement('h3');
  h3.className = 'shelf__title';
  if (typeof headingHref === 'string' && headingHref.trim()) {
    const link = document.createElement('a');
    link.className = 'shelf__title-link';
    link.href = headingHref.trim();
    link.textContent = heading;
    h3.appendChild(link);
  } else {
    h3.textContent = heading;
  }

  const actions = document.createElement('div');
  actions.className = 'shelf__actions';

  if (typeof headingHref === 'string' && headingHref.trim()) {
    const hub = document.createElement('a');
    hub.className = 'btn btn--ghost btn--sm';
    hub.href = headingHref.trim();
    hub.textContent = 'Open series';
    actions.appendChild(hub);
  }

  if (typeof onViewAll === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--ghost btn--sm';
    btn.textContent = 'View all';
    btn.addEventListener('click', onViewAll);
    actions.appendChild(btn);
  }

  header.appendChild(h3);
  header.appendChild(actions);
  section.appendChild(header);

  if (subheading) {
    const p = document.createElement('p');
    p.className = 'shelf__subtitle';
    p.textContent = subheading;
    section.appendChild(p);
  }

  const row = document.createElement('ul');
  row.className = 'shelf__row chip-row';
  row.setAttribute('role', 'list');
  if (prefersReducedMotion()) row.classList.add('shelf__row--reduced');

  const frag = document.createDocumentFragment();

  items.forEach((book) => {
    const item = document.createElement('li');
    item.className = 'shelf__item';
    item.setAttribute('role', 'listitem');

    const a = document.createElement('a');
    a.className = 'shelf-card';
    a.href = bookHref(book.id, book);

    const cover = getPrimaryCover(book);
    if (cover) {
      const img = document.createElement('img');
      img.className = 'shelf-card__img';
      img.src = cover;
      img.alt = `Cover art for ${book.title}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 720;
      img.height = 960;
      a.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'shelf-card__fallback';
      fallback.textContent = (book.title || 'Book').slice(0, 1).toUpperCase();
      a.appendChild(fallback);
    }

    const meta = document.createElement('div');
    meta.className = 'shelf-card__meta';

    const t = document.createElement('div');
    t.className = 'shelf-card__title';
    t.textContent = book.title || book.id;

    const s = document.createElement('div');
    s.className = 'shelf-card__sub';
    s.textContent = book.subtitle ? book.subtitle : (book.status || '');

    meta.appendChild(t);
    meta.appendChild(s);
    a.appendChild(meta);

    item.appendChild(a);
    frag.appendChild(item);
  });

  row.appendChild(frag);
  section.appendChild(row);
  return section;
};

const renderShelves = () => {
  const root = ensureShelvesRoot();
  if (!root) return;
  clearNode(root);

  const frag = document.createDocumentFragment();

  let shelfCount = 0;

  sagas.forEach((saga) => {
    const items = sortRecords(
      RECORDS.filter((r) => r.book.sagaId === saga.id),
      'featured'
    )
      .map((r) => r.book)
      .slice(0, 10);

    if (!items.length) return;

    frag.appendChild(
      buildShelf({
        heading: saga.shortTitle || saga.title,
        headingHref: saga.canonicalPath || '',
        subheading: saga.tagline || '',
        items,
        onViewAll: () => {
          clearAllFilters();
          state.filters.saga.add(saga.id);
          updateUi();
          UI.search?.focus();
        },
      })
    );
    shelfCount += 1;
  });

  series.forEach((ser) => {
    const items = sortRecords(
      RECORDS.filter((r) => r.book.seriesId === ser.id),
      'featured'
    )
      .map((r) => r.book)
      .slice(0, 10);

    if (!items.length) return;

    frag.appendChild(
      buildShelf({
        heading: ser.shortTitle || ser.title,
        headingHref: ser.canonicalPath || '',
        subheading: ser.tagline || '',
        items,
        onViewAll: () => {
          clearAllFilters();
          state.filters.series.add(ser.id);
          updateUi();
          UI.search?.focus();
        },
      })
    );
    shelfCount += 1;
  });



  // Update shelves block visibility + badge
  try {
    if (UI.shelvesBlock) UI.shelvesBlock.hidden = shelfCount === 0;
  } catch {}

  try {
    if (UI.shelvesCount) {
      UI.shelvesCount.hidden = shelfCount === 0;
      UI.shelvesCount.textContent = shelfCount ? String(shelfCount) : '';
    }
    if (UI.shelvesStat) {
      UI.shelvesStat.textContent = shelfCount ? shelfCount === 1 ? '1 generated shelf' : `${shelfCount} generated shelves` : 'Shelves update here as the live catalog expands';
    }
  } catch {}
  root.appendChild(frag);
};


const renderSeriesRail = () => {
  const rail = UI.seriesRail;
  const block = UI.seriesBlock;
  if (!rail || !block) return;

  clearNode(rail);

  // Only render series that have at least one book in the data.
  const entries = series
    .map((s) => ({
      ser: s,
      count: RECORDS.filter((r) => r.book.seriesId === s.id).length,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => String(a.ser.title || '').localeCompare(String(b.ser.title || ''), undefined, { sensitivity: 'base' }));

  const count = entries.length;

  try {
    block.hidden = count === 0;
  } catch {}

  try {
    if (UI.seriesCount) {
      UI.seriesCount.hidden = count === 0;
      UI.seriesCount.textContent = count ? String(count) : '';
    }
    if (UI.seriesStat) {
      UI.seriesStat.textContent = count ? `${count} live series in the current catalog` : 'Series update here as the catalog expands';
    }
  } catch {}

  if (!count) return;

  const frag = document.createDocumentFragment();

  for (const { ser, count: volCount } of entries) {
    const card = document.createElement('div');
    card.className = 'series-card';
    card.setAttribute('role', 'listitem');

    const link = document.createElement('a');
    link.className = 'series-card__link';
    link.href = ser.canonicalPath || '/publishing.html';
    link.setAttribute('aria-label', `Open ${ser.title || ser.id} series hub`);

    const kicker = document.createElement('span');
    kicker.className = 'series-card__kicker';
    kicker.textContent = 'Series';

    const title = document.createElement('span');
    title.className = 'series-card__title';
    title.textContent = ser.title || ser.id;

    const meta = document.createElement('span');
    meta.className = 'series-card__meta';
    meta.textContent = `${volCount} volume${volCount === 1 ? '' : 's'}`;

    link.appendChild(kicker);
    link.appendChild(title);
    link.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'series-card__actions';

    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'btn btn--ghost btn--sm';
    view.textContent = 'View in Library';
    view.dataset.libraryFilterSeries = ser.id;
    view.setAttribute('aria-label', `View ${ser.title || ser.id} in the Publishing Library`);

    actions.appendChild(view);

    card.appendChild(link);
    card.appendChild(actions);
    frag.appendChild(card);
  }

  rail.appendChild(frag);
};

const renderChips = () => {
  if (!UI.chips) return;
  clearNode(UI.chips);
  // If there is no publishing data yet, keep the toolbar stable and avoid layout churn.
  if (!Array.isArray(books) || books.length === 0) {
    UI.chips.hidden = true;
    return;
  }


  const group = (label) => {
    const wrap = document.createElement('div');
    wrap.className = 'chip-group';

    const p = document.createElement('p');
    p.className = 'chip-group__label eyebrow';
    p.textContent = label;

    const row = document.createElement('div');
    row.className = 'chip-row';

    wrap.appendChild(p);
    wrap.appendChild(row);
    UI.chips.appendChild(wrap);
    return row;
  };

  const makeChip = (groupKey, value, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.group = groupKey;
    btn.dataset.value = value;
    btn.textContent = label;
    btn.setAttribute('aria-pressed', isChipActive(groupKey, value) ? 'true' : 'false');
    return btn;
  };

  const sagaRow = group('Sagas');
  sagas.forEach((saga) => sagaRow.appendChild(makeChip('saga', saga.id, saga.shortTitle || saga.title)));

  const seriesRow = group('Series');
  series.forEach((ser) => seriesRow.appendChild(makeChip('series', ser.id, ser.shortTitle || ser.title)));

  const genreRow = group('Genres');
  DISTINCT_GENRES.sort((a, b) => a.localeCompare(b)).forEach((g) => genreRow.appendChild(makeChip('genre', g, titleize(g))));

  const statusRow = group('Status');
  DISTINCT_STATUSES.sort((a, b) => a.localeCompare(b)).forEach((s) => statusRow.appendChild(makeChip('status', s, titleize(s))));

  const formatRow = group('Formats');
  FORMAT_DEFS.forEach((f) => formatRow.appendChild(makeChip('format', f.key, f.label)));
};

let rafId = 0;

const bindEmptyActions = () => {
  if (!UI.empty) return;
  const reset = UI.empty.querySelector('[data-library-clear]');
  if (reset) {
    reset.addEventListener('click', () => {
      clearAllFilters();
      updateUi();
    }, { once: true });
  }
};

const updateEmptyState = ({ hasData, hasResults }) => {
  if (!UI.empty) return;

  if (!hasData) {
    UI.empty.hidden = false;
    UI.empty.innerHTML = `
      <p class="results-empty__title">No titles match the current filters</p>
      <p class="results-empty__text">Nothing matches the current filters. Reset them to return to the full live catalog.</p>
      <p class="results-empty__hint">Reserved title pages may exist but will be clearly labeled as <b>Reserved</b> until officially published.</p>
      <div class="results-empty__actions" aria-label="Publishing empty-state actions">
        <a class="cta-button cta-button--ghost" href="#howto">How publishing works</a>
        <a class="cta-button cta-button--ghost" href="/contact.html">Contact</a>
      </div>
    `;
    return;
  }

  if (!hasResults) {
    UI.empty.hidden = false;
    UI.empty.innerHTML = `
      <p class="results-empty__title">No matching books</p>
      <p class="results-empty__text"><strong>No results.</strong> Try adjusting the search, filters, or sort.</p>
      <div class="results-empty__actions" aria-label="Publishing no-results actions">
        <button class="cta-button cta-button--ghost" data-library-clear type="button">Reset filters</button>
        <a class="cta-button cta-button--ghost" href="#library-search-input">Back to filters</a>
      </div>
    `;
    bindEmptyActions();
    return;
  }

  UI.empty.hidden = true;
};

const updateUi = () => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const recs = filterAndRank();

    const hasData = Array.isArray(books) && books.length > 0;
    const hasResults = recs.length > 0;

    setGridState(hasResults ? 'results' : 'empty');
    updateEmptyState({ hasData, hasResults });

    renderGrid(recs);
    renderMeta(recs.length);
    injectJsonLd(recs);

    // Sync aria-pressed states without rebuilding
    if (UI.chips) {
      UI.chips.querySelectorAll('.chip').forEach((btn) => {
        const groupKey = btn.dataset.group;
        const value = btn.dataset.value;
        btn.setAttribute('aria-pressed', isChipActive(groupKey, value) ? 'true' : 'false');
      });
    }
  });
};

const init = () => {
  wireAmazonRegionActions();
  updateCatalogMeta();
  if (!UI.toolbar || !UI.grid) return;


  // Deep-link support (must run before chip rendering so aria-pressed states are correct)
  applyDeepLinkFromUrl();

  // Series rail actions (View in Library)
  document.addEventListener('click', (e) => {
    const t = e.target;
    const btn = (t && t instanceof Element) ? t.closest('button[data-library-filter-series]') : null;
    if (!btn) return;
    const seriesId = String(btn.getAttribute('data-library-filter-series') || '').trim();
    if (!seriesId || !getSeriesById(seriesId)) return;

    e.preventDefault();

    clearAllFilters();
    state.filters.series.add(seriesId);
    updateUi();
    syncUrlToState();

    // Move to the library section for immediate scanning.
    const target = UI.libraryBlock || document.getElementById('library');
    if (target) {
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      try { target.scrollIntoView({ behavior, block: 'start' }); } catch {}
    }

    // Focus search for fast iteration.
    try { UI.search?.focus({ preventScroll: true }); } catch {}
  }, { passive: false });


  // =========================
  // Wave AG — Publishing Filters: Delegated events + keyboard nav
  // - Avoid per-chip listeners (perf)
  // - Arrow keys move focus within the current chip row (a11y)
  // =========================
  if (UI.chips) {
    UI.chips.addEventListener('click', (e) => {
      const t = e.target;
      const btn = (t && t instanceof Element) ? t.closest('button.chip') : null;
      if (!btn || !UI.chips.contains(btn)) return;
      const groupKey = btn.dataset.group;
      const value = btn.dataset.value;
      if (!groupKey || !value) return;
      toggleChip(groupKey, value);
      updateUi();
      syncUrlToState();
    });

    UI.chips.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
      const t = e.target;
      const btn = (t && t instanceof HTMLElement) ? t.closest('button.chip') : null;
      if (!btn || !UI.chips.contains(btn)) return;

      const row = btn.closest('.chip-row');
      if (!row) return;
      const chips = Array.from(row.querySelectorAll('button.chip'))
        .filter((x) => !x.disabled && x.offsetParent !== null);
      if (!chips.length) return;

      const i = chips.indexOf(btn);
      if (i < 0) return;
      let next = i;
      if (key === 'ArrowRight') next = Math.min(chips.length - 1, i + 1);
      if (key === 'ArrowLeft') next = Math.max(0, i - 1);
      if (key === 'Home') next = 0;
      if (key === 'End') next = chips.length - 1;

      if (next !== i) {
        e.preventDefault();
        chips[next].focus();
      }
    });
  }

  if (UI.reset) {
    UI.reset.addEventListener('click', () => {
      state.q = '';
      if (UI.search) UI.search.value = '';
      state.sort = 'featured';
      if (UI.sort) UI.sort.value = 'featured';
      clearAllFilters();
      updateUi();
      syncUrlToState();
      syncResetButton();
      try { if (window.__toaToast) window.__toaToast('Publishing filters reset.', { duration: 2400 }); } catch {}
      try { UI.search?.focus(); } catch {}
    });
  }

  // No-placeholder truth rule: when there are no books yet, show a stable empty state and
  // avoid DOM-heavy filter/shelf rendering that can cause CLS.
  if (!Array.isArray(books) || books.length === 0) {
    if (UI.search) {
      UI.search.disabled = true;
      UI.search.setAttribute('aria-disabled', 'true');
    }
    if (UI.sort) {
      UI.sort.disabled = true;
      UI.sort.setAttribute('aria-disabled', 'true');
    }
    if (UI.chips) {
      UI.chips.hidden = true;

    try { if (UI.shelvesBlock) UI.shelvesBlock.hidden = true; } catch {}
    try {
      if (UI.countBadge) { UI.countBadge.hidden = true; UI.countBadge.textContent = ''; }
      if (UI.shelvesCount) { UI.shelvesCount.hidden = true; UI.shelvesCount.textContent = ''; }
      if (UI.shelvesStat) UI.shelvesStat.textContent = 'Shelves update here as the live catalog expands';
      if (UI.seriesStat) UI.seriesStat.textContent = 'Series update here as the catalog expands';
      if (UI.libraryStat) UI.libraryStat.textContent = 'Library updates here as more titles go live';
    } catch {}
      clearNode(UI.chips);
    }
    const recs = [];
    setGridState('empty');
    updateEmptyState({ hasData: false, hasResults: false });
    renderGrid(recs);
    renderMeta(0);
    injectJsonLd(recs);
    return;
  }

  renderChips();
  renderSeriesRail();
  renderShelves();

  if (UI.search) {
    let t = 0;
    UI.search.addEventListener('input', () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        state.q = UI.search.value || '';
        updateUi();
        syncUrlToState();
      }, 90);
    });
  }

  if (UI.sort) {
    UI.sort.addEventListener('change', () => {
      state.sort = UI.sort.value || 'featured';
      updateUi();
      syncUrlToState();
    });
  }

  state.q = UI.search?.value || "";
  state.sort = UI.sort?.value || "featured";
  syncResetButton();
  updateUi();
  syncUrlToState();
};

init();
