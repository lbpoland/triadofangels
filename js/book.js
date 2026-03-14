// js/book.js — Book detail page controller (ESM)
// - Supports canonical folder routes and legacy query templates.
// - Renders book meta + store actions + formats from js/publishing-data.js.
// - Updates head/meta and injects JSON-LD (runtime) for correctness.

import * as PubData from './publishing-data.js?v=5';
import { getBookId, bookCanonicalAbs, bookCanonicalPath } from './routes.js';
import {
  $,
  clear,
  el,
  safeText,
  setTitle,
  setCanonical,
  setMetaName,
  setMetaProperty,
  injectJsonLd,
  absolutizeMaybe,
  clampDescription,
} from './music-ui.js';

const DEFAULT_COVER = '/assets/images/publishing/default-book-cover.webp';

function pickBooks(mod) {
  if (Array.isArray(mod?.books)) return mod.books;
  if (Array.isArray(mod?.default?.books)) return mod.default.books;
  if (Array.isArray(mod?.BOOKS)) return mod.BOOKS;
  return [];
}

function asString(v) {
  return typeof v === 'string' ? v.trim() : '';
}


function enableCopyButton(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.removeAttribute('disabled');
  btn.removeAttribute('aria-disabled');
  btn.removeAttribute('data-copy-pending');
}

function applyShareHref(link, href) {
  if (!link || !href) return;
  link.href = href;
  link.removeAttribute('aria-disabled');
  link.removeAttribute('data-share-pending');
  link.removeAttribute('tabindex');
}



function setTextIfPresent(id, text) {
  const node = $(id);
  if (!node) return;
  node.textContent = text;
}





function wireCopyLinkButton(canonAbs) {
  const btn = $('book-share');
  if (!btn) return;
  enableCopyButton(btn);
  btn.addEventListener('click', async (e) => {
    try { e.preventDefault(); } catch {}
    const original = btn.textContent || 'Copy link';
    try {
      const ok = window.__toaCopyText ? await window.__toaCopyText(canonAbs) : false;
      if (!ok) throw new Error('copy unavailable');
      btn.textContent = 'Copied!';
      window.setTimeout(() => { btn.textContent = original; }, 1400);
    } catch {
      btn.textContent = 'Copy failed';
      window.setTimeout(() => { btn.textContent = original; }, 1600);
    }
  });
}

function hydrateBookShareRow(title, canonAbs) {
  const x = $('share-x');
  const fb = $('share-facebook');
  const li = $('share-linkedin');
  const em = $('share-email');
  const encUrl = encodeURIComponent(canonAbs);
  const encText = encodeURIComponent(`${title} — Triad of Angels & ToA Studios`);
  applyShareHref(x, `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`);
  applyShareHref(fb, `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`);
  applyShareHref(li, `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`);
  applyShareHref(em, `mailto:?subject=${encText}&body=${encUrl}`);
}

function detectAmazonRegion(availableKeys) {
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

  return Array.from(keys).sort((a, b) => a.localeCompare(b))[0];
}

function ensureSitePath(pathOrUrl) {
  const s = asString(pathOrUrl);
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return s;
  return `/${s.replace(/^\/+/, '')}`;
}

function normalizeGenres(genres) {
  if (Array.isArray(genres)) return genres.map((g) => asString(g)).filter(Boolean);
  const g = asString(genres);
  return g ? g.split(',').map((x) => x.trim()).filter(Boolean) : [];
}

function orderedStoreLinks(stores) {
  const s = stores && typeof stores === 'object' ? stores : {};
  const ORDER = [
    ['amazon', 'Amazon'],
    ['kindle', 'Kindle'],
    ['kobo', 'Kobo'],
    ['appleBooks', 'Apple Books'],
    ['googlePlayBooks', 'Google Play Books'],
    ['barnesNoble', 'Barnes & Noble'],
    ['gumroad', 'Gumroad'],
    ['itch', 'itch.io'],
    ['website', 'Website'],
  ];

  const out = [];
  const seen = new Set();

  for (const [k, label] of ORDER) {
    const u = asString(s[k]);
    if (u) {
      out.push({ key: k, label, url: u });
      seen.add(k);
    }
  }

  for (const [k, v] of Object.entries(s)) {
    if (seen.has(k)) continue;
    const u = asString(v);
    if (!u) continue;
    out.push({ key: k, label: k, url: u });
  }

  return out;
}



function hasAmazonRegional(stores) {
  const ar = stores && typeof stores === 'object' ? stores.amazonRegional : null;
  return ar && typeof ar === 'object' && !Array.isArray(ar) && Object.keys(ar).length > 0;
}

function amazonRegionalEntries(stores) {
  const ar = stores && typeof stores === 'object' ? stores.amazonRegional : null;
  if (!ar || typeof ar !== 'object' || Array.isArray(ar)) return [];
  return Object.entries(ar)
    .map(([k, v]) => [String(k).trim(), (typeof v === 'string' ? v.trim() : '')])
    .filter(([k, v]) => k && v);
}

function buildAmazonRegionAction(title, stores) {
  const wrap = el('div', { class: 'region-store', 'data-store': 'amazon' });

  wrap.appendChild(el('span', { class: 'region-store__label', text: 'Amazon region' }));

  const select = el('select', { class: 'region-store__select', 'aria-label': 'Select Amazon region', 'data-amazon-region': '1' });
  const entries = amazonRegionalEntries(stores);
  const preferred = detectAmazonRegion(entries.map(([k]) => k));

  entries.forEach(([k, url]) => {
    const opt = document.createElement('option');
    opt.value = url;
    opt.textContent = k;
    if (k === preferred) opt.selected = true;
    select.appendChild(opt);
  });

  const btn = el('a', {
    class: 'btn',
    href: (typeof stores?.amazon === 'string' && stores.amazon.trim()) ? stores.amazon.trim() : (entries[0]?.[1] || ''),
    target: '_blank',
    rel: 'noopener noreferrer',
    referrerpolicy: 'no-referrer',
    'aria-label': `Buy ${title} on Amazon (opens in a new tab)`,
  }, ['Buy (Amazon)']);

  wrap.appendChild(select);
  wrap.appendChild(btn);
  return wrap;
}

function wireAmazonRegionActions() {
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
}



function formatCards(formats) {
  const list = [];
  if (!formats || typeof formats !== 'object') return list;

  for (const [k, v] of Object.entries(formats)) {
    if (!v) continue;

    if (typeof v === 'string') {
      list.push({ key: k, label: k, note: v, url: '' });
      continue;
    }

    if (typeof v === 'object') {
      list.push({
        key: k,
        label: asString(v.label) || k,
        note: asString(v.note) || asString(v.description) || '',
        url: asString(v.url),
      });
      continue;
    }
  }

  return list;
}


function updateHead(book, canonAbs, coverAbs) {
  const titleText = asString(book?.title) || 'Book';
  const title = `${titleText} — Publishing | Triad of Angels & ToA Studios`;

  const desc = clampDescription(
    asString(book?.description) || asString(book?.blurb) || asString(book?.logline) || `Official publishing page for ${titleText}.`
  );

  setTitle(title);
  setCanonical(canonAbs);

  setMetaName('description', desc);
  setMetaProperty('og:type', 'book');
  setMetaProperty('og:title', title);
  setMetaProperty('og:description', desc);
  setMetaProperty('og:url', canonAbs);
  if (coverAbs) {
    setMetaProperty('og:image', coverAbs);
    setMetaProperty('og:image:alt', `${titleText} cover art`);
  }

  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', title);
  setMetaName('twitter:description', desc);
  setMetaName('twitter:url', canonAbs);
  if (coverAbs) {
    setMetaName('twitter:image', coverAbs);
    setMetaName('twitter:image:alt', `${titleText} cover art`);
  }

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: titleText,
    url: canonAbs,
    image: coverAbs || undefined,
    author: {
      '@type': 'Organization',
      name: 'Triad of Angels & ToA Studios',
    },
  };

  const year = asString(book?.year);
  if (year) ld.datePublished = year;

  const genre = normalizeGenres(book?.genres);
  if (genre.length) ld.genre = genre;

  const sagaObj = PubData.getSagaById(asString(book?.sagaId));
  const seriesObj = PubData.getSeriesById(asString(book?.seriesId));
  const series = asString(seriesObj?.title);
  const sagaTitle = asString(sagaObj?.title);
  const number = typeof book?.numberInSeries === 'number' ? book.numberInSeries : null;
  if (series) {
    ld.isPartOf = {
      '@type': 'BookSeries',
      name: series,
    };
    if (number) ld.position = number;
  }

  injectJsonLd(ld);
}

function renderBook(book, bookId) {
  const title = asString(book?.title) || bookId;
  const sagaObj = PubData.getSagaById(asString(book?.sagaId));
  const seriesObj = PubData.getSeriesById(asString(book?.seriesId));
  const series = asString(seriesObj?.title);
  const sagaTitle = asString(sagaObj?.title);
  const status = asString(book?.status);
  const year = asString(book?.year);
  const logline = asString(book?.logline);
  const blurb = asString(book?.description) || asString(book?.blurb);
  const volumeNo = Number.isFinite(book?.seriesNumber) ? book.seriesNumber : (Number.isFinite(book?.numberInSeries) ? book.numberInSeries : null);
  const seriesVolumes = seriesObj ? (PubData.getBooksForSeries(seriesObj.id) || []) : [];

  const coverPath = ensureSitePath(book?.covers?.portrait || book?.cover || '') || DEFAULT_COVER;
  const coverAbs = absolutizeMaybe(coverPath) || '';

  safeText($('book-breadcrumb'), title);
  safeText($('book-context'), asString(book?.context) || (series ? `${series}` : 'Publishing'));
  safeText($('book-title'), title);

  const setPill = (id, value, cls = '') => {
    const node = $(id);
    if (!node) return false;
    const text = asString(value);
    node.textContent = text;
    node.hidden = !text;
    if (cls) node.classList.add(cls);
    return Boolean(text);
  };

  const yearOn = setPill('book-year', year);
  const statusKey = asString(status).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const statusOn = setPill('book-status', status, statusKey === 'reserved' ? 'pill--reserved' : (statusKey ? `pill--${statusKey}` : ''));
  const seriesOn = setPill('book-series', series);

  // If the entire meta-line is empty, hide its container for a cleaner hero.
  try {
    const line = document.querySelector('.book-meta-line');
    if (line) line.hidden = !(yearOn || statusOn || seriesOn);
  } catch {}
  safeText($('book-logline'), logline);
  try { const n = $('book-logline'); if (n) n.hidden = !asString(logline); } catch {}
  safeText($('book-blurb'), blurb);

  const cover = $('book-cover');
  if (cover) {
    cover.setAttribute('src', coverPath);
    cover.setAttribute('alt', `${title} cover`);
  }

  const bgImg = document.getElementById('book-bg-img');
  if (bgImg) {
    if (coverPath) {
      bgImg.setAttribute('src', coverPath);
    } else {
      bgImg.removeAttribute('src');
    }
  }

  // Genre pills
  const genreRow = $('book-genre-row');
  if (genreRow) {
    clear(genreRow);
    const genres = normalizeGenres(book?.genres);
    if (!genres.length) {
      genreRow.hidden = true;
    } else {
      genreRow.hidden = false;
      genres.slice(0, 10).forEach((g) => genreRow.appendChild(el('span', { class: 'pill', text: g })));
    }
  }

  // Shared quick facts + overview stat (truthful, hydrated from live data)
  const formatCount = formatCards(book?.formats).length;
  const directStoreCount = orderedStoreLinks(book?.stores && typeof book.stores === 'object' ? book.stores : {}).length;
  setTextIfPresent('book-meta-formats', formatCount ? `${formatCount} live` : 'Coming later');
  if (volumeNo && seriesVolumes.length) {
    setTextIfPresent('book-meta-order', `Vol ${volumeNo} of ${seriesVolumes.length}`);
  } else if (series) {
    setTextIfPresent('book-meta-order', series);
  } else {
    setTextIfPresent('book-meta-order', 'Standalone');
  }
  if (hasAmazonRegional(book?.stores && typeof book.stores === 'object' ? book.stores : {})) {
    setTextIfPresent('book-meta-store', 'Region-aware');
  } else if (directStoreCount) {
    setTextIfPresent('book-meta-store', `${directStoreCount} direct`);
  } else {
    setTextIfPresent('book-meta-store', 'Coming later');
  }
  if (volumeNo && series) {
    setTextIfPresent('book-overview-stat', `Volume ${volumeNo} • ${series}`);
  } else if (series) {
    setTextIfPresent('book-overview-stat', `${series} detail`);
  } else {
    setTextIfPresent('book-overview-stat', 'Book detail');
  }

  // Store actions (truthful)
  const storeWrap = $('book-store-actions');
  if (storeWrap) {
    clear(storeWrap);

    const stores = book?.stores && typeof book.stores === 'object' ? book.stores : {};

    // If Amazon regional links exist, render a region selector + primary Amazon button.
    if (hasAmazonRegional(stores)) {
      storeWrap.appendChild(buildAmazonRegionAction(title, stores));

      // Render any additional store links (non-amazon) as secondary actions.
      const links = orderedStoreLinks(stores).filter((l) => l.key !== 'amazon');
      links.slice(0, 6).forEach((l) => {
        storeWrap.appendChild(
          el('a', {
            class: 'btn btn--ghost',
            href: l.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            referrerpolicy: 'no-referrer',
            'aria-label': `${l.label} (opens in a new tab)`,
          }, [l.label])
        );
      });
    } else {
      const links = orderedStoreLinks(stores);
      if (!links.length) {
        storeWrap.appendChild(el('span', { class: 'pill' }, ['Store links appear here when they are available.']));
      } else {
        links.slice(0, 8).forEach((l) => {
          storeWrap.appendChild(
            el('a', {
              class: 'btn btn--ghost',
              href: l.url,
              target: '_blank',
              rel: 'noopener noreferrer',
              referrerpolicy: 'no-referrer',
              'aria-label': `${l.label} (opens in a new tab)`,
            }, [l.label])
          );
        });
      }
    }
  }

  // Formats
  const formatsWrap = $('book-formats');
  if (formatsWrap) {
    clear(formatsWrap);
    const cards = formatCards(book?.formats);
    setTextIfPresent('book-formats-stat', cards.length ? `${cards.length} format${cards.length === 1 ? '' : 's'} available` : 'Formats coming later');
    if (!cards.length) {
      formatsWrap.appendChild(el('div', { class: 'format-card' }, [
        el('p', { class: 'format-card__title', text: 'Formats coming soon.' }),
      ]));
    } else {
      cards.forEach((c) => {
        const meta = el('div', { class: 'format-card__meta' });
        if (c.note) meta.appendChild(el('span', { class: 'pill', text: c.note }));

        const box = el('div', { class: 'format-card' }, [
          el('p', { class: 'format-card__title', text: c.label }),
          meta,
        ]);

        if (c.url) {
          box.appendChild(el('a', { class: 'btn btn--ghost', href: c.url, target: '_blank', rel: 'noopener noreferrer', referrerpolicy: 'no-referrer' }, ['Get format']));
        }

        formatsWrap.appendChild(box);
      });
    }
  }

  // Series rail (governed navigation across volumes)
  const seriesCard = $('book-series-card');
  if (seriesCard) {
    clear(seriesCard);

    const seriesId = asString(book?.seriesId);
    const sagaId = asString(book?.sagaId);
    const vols = seriesId ? (PubData.getBooksForSeries(seriesId) || []) : [];
    const hasVols = Array.isArray(vols) && vols.length > 0;

    const header = el('div', { class: 'series-grid__head' }, [
      el('div', { class: 'series-grid__kicker', text: sagaTitle ? sagaTitle : 'Publishing' }),
      el('h2', { class: 'series-grid__title', text: series ? series : 'Series' }),
    ]);

    const ctas = el('div', { class: 'series-grid__ctas' });
    const seriesObj2 = seriesId ? PubData.getSeriesById(seriesId) : null;
    const sagaObj2 = sagaId ? PubData.getSagaById(sagaId) : null;

    if (seriesObj2?.canonicalPath) {
      ctas.appendChild(el('a', { class: 'btn btn--ghost btn--sm', href: seriesObj2.canonicalPath }, ['Open series hub']));
    }
    if (sagaObj2?.canonicalPath) {
      ctas.appendChild(el('a', { class: 'btn btn--ghost btn--sm', href: sagaObj2.canonicalPath }, ['Open saga hub']));
    }

    Array.from(document.querySelectorAll('[data-book-series-link]')).forEach((node) => {
      if (!(node instanceof HTMLAnchorElement)) return;
      if (seriesObj2?.canonicalPath) {
        node.href = seriesObj2.canonicalPath;
        node.hidden = false;
      } else {
        node.hidden = true;
      }
    });

    Array.from(document.querySelectorAll('[data-book-saga-link]')).forEach((node) => {
      if (!(node instanceof HTMLAnchorElement)) return;
      if (sagaObj2?.canonicalPath) {
        node.href = sagaObj2.canonicalPath;
        node.hidden = false;
      } else {
        node.hidden = true;
      }
    });

    Array.from(document.querySelectorAll('[data-book-library-link]')).forEach((node) => {
      if (!(node instanceof HTMLAnchorElement)) return;
      if (seriesObj2?.id) {
        node.href = `/publishing.html?series=${encodeURIComponent(seriesObj2.id)}#library`;
      } else if (sagaObj2?.id) {
        node.href = `/publishing.html?saga=${encodeURIComponent(sagaObj2.id)}#library`;
      } else {
        node.href = '/publishing.html#library';
      }
      node.hidden = false;
    });

    Array.from(document.querySelectorAll('[data-book-search-link]')).forEach((node) => {
      if (!(node instanceof HTMLAnchorElement)) return;
      node.href = `/search/?q=${encodeURIComponent(title)}`;
      node.hidden = false;
    });

    ctas.appendChild(el('a', { class: 'btn btn--ghost btn--sm', href: '/publishing.html' }, ['Back to library']));

    const rail = el('div', { class: 'series-grid', role: 'list' });

    setTextIfPresent('book-series-stat', hasVols ? `${vols.length} volume${vols.length === 1 ? '' : 's'} in view` : 'Series details coming later');

    if (hasVols) {
      vols.forEach((b) => {
        const isCurrent = asString(b?.id) && asString(b.id) === asString(book?.id);
        const a = el('a', {
          class: isCurrent ? 'series-grid__item is-current' : 'series-grid__item',
          href: asString(b?.canonicalPath) ? b.canonicalPath : '/publishing.html',
          role: 'listitem',
          'aria-current': isCurrent ? 'page' : null,
        });

        const imgSrc = asString(b?.covers?.portrait) || DEFAULT_COVER;
        const img = el('img', {
          class: 'series-grid__img',
          src: imgSrc,
          alt: `${asString(b?.title) || 'Book'} cover`,
          loading: 'lazy',
          decoding: 'async',
          width: '320',
          height: '512',
        });

        const meta = el('div', { class: 'series-grid__meta' }, [
          el('div', { class: 'series-grid__vol', text: (Number.isFinite(b?.seriesNumber) ? `Volume ${b.seriesNumber}` : '') }),
          el('div', { class: 'series-grid__name', text: asString(b?.title) || asString(b?.id) }),
        ]);

        a.appendChild(img);
        a.appendChild(meta);
        rail.appendChild(a);
      });
    } else {
      rail.appendChild(el('div', { class: 'notice' }, [
        el('p', { text: 'Series navigation will appear here when volumes are defined in the publishing data.' }),
      ]));
    }

    seriesCard.appendChild(header);
    seriesCard.appendChild(ctas);
    seriesCard.appendChild(rail);
  }

  // Extras
  const extras = $('book-extras');
  if (extras) {
    clear(extras);
    const extrasLines = [];
    const era = asString(book?.era);
    const audience = asString(book?.audience);
    const isbn = asString(book?.isbn);
    if (era) extrasLines.push(`Era: ${era}`);
    if (audience) extrasLines.push(`Audience: ${audience}`);
    if (isbn) extrasLines.push(`ISBN: ${isbn}`);

    setTextIfPresent('book-extras-stat', extrasLines.length ? `${extrasLines.length} detail${extrasLines.length === 1 ? '' : 's'} listed` : 'Extras coming later');
    if (!extrasLines.length) {
      extras.appendChild(el('p', { text: 'Extras coming soon.' }));
    } else {
      extrasLines.forEach((line) => extras.appendChild(el('p', { text: line })));
    }
  }

  return { coverAbs };
}

function main() {
  const bookId = getBookId();

  // Canonical must match the current URL style:
  // - Legacy template: /book.html?id=<id>
  // - Pre-rendered: /publishing/books/<id>/
  const isLegacyTemplate = /\/book\.html$/i.test(window.location.pathname);
  const canonAbs = bookId
    ? (isLegacyTemplate
        ? `${SITE_ORIGIN}/book.html?id=${encodeURIComponent(bookId)}`
        : bookCanonicalAbs(bookId))
    : `${SITE_ORIGIN}${window.location.pathname}`;

  const books = pickBooks(PubData);
  const book = bookId
    ? (books.find((b) => asString(b?.id) === bookId) || books.find((b) => asString(b?.slug) === bookId) || null)
    : null;

  // Render page (truthful empty state if missing)
  if (!bookId) {
    safeText($('book-title'), 'Book not found');
    safeText($('book-blurb'), 'Missing book id.');
    updateHead(null, canonAbs, '');
  } else if (!book) {
    safeText($('book-title'), 'Book not found');
    safeText($('book-blurb'), `Book not found: ${bookId}`);
    // Still inject valid JSON-LD so runtime checks and crawlers get a valid document.
    updateHead({ title: bookId, description: `This publishing URL is reserved for ${bookId}.` }, canonAbs, '');
  } else {
    const { coverAbs } = renderBook(book, bookId);
    updateHead(book, canonAbs, coverAbs);
  hydrateBookShareRow(title, canonAbs);
  wireCopyLinkButton(canonAbs);

  }

  const dynCanon = document.getElementById('dynamic-canonical');
  if (dynCanon) dynCanon.setAttribute('href', canonAbs);

  const dynOg = document.getElementById('dynamic-og-url');
  if (dynOg) dynOg.setAttribute('content', canonAbs);

  const dynTw = document.getElementById('dynamic-twitter-url');
  if (dynTw) dynTw.setAttribute('content', canonAbs);

  const back = $('book-back');
  if (back) back.setAttribute('href', '/publishing.html');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true });
} else {
  main();
}
