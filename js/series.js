// js/series.js — Series hub renderer (ESM)
// Truth-locked: renders only what exists in js/publishing-data.js.

import {
  series,
  sagas,
  getSeriesById,
  getSagaById,
  getBooksForSeries,
  toAbsoluteSiteUrl,
} from './publishing-data.js?v=5';

const $ = (id) => document.getElementById(id);

const asString = (v) => (typeof v === 'string' ? v.trim() : '');


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

  return Array.from(keys).sort((a, b) => a.localeCompare(b))[0];
};

const amazonRegionalEntries = (stores) => {
  const ar = stores && typeof stores === 'object' ? stores.amazonRegional : null;
  if (!ar || typeof ar !== 'object' || Array.isArray(ar)) return [];
  return Object.entries(ar)
    .map(([k, v]) => [String(k).trim(), (typeof v === 'string' ? v.trim() : '')])
    .filter(([k, v]) => k && v);
};

const buildRegionStore = (labelText, titleText, stores) => {
  const wrap = document.createElement('div');
  wrap.className = 'region-store';
  wrap.setAttribute('data-store', 'amazon');

  const label = document.createElement('span');
  label.className = 'region-store__label';
  label.textContent = labelText;
  wrap.appendChild(label);

  const select = document.createElement('select');
  select.className = 'region-store__select';
  select.setAttribute('data-amazon-region', '1');
  select.setAttribute('aria-label', 'Select Amazon region');

  const entries = amazonRegionalEntries(stores);
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
  btn.setAttribute('aria-label', `Buy ${titleText} on Amazon (opens in a new tab)`);

  const fallback = entries[0]?.[1] || '';
  if (fallback) btn.href = fallback;

  wrap.appendChild(select);
  wrap.appendChild(btn);

  return wrap;
};

const wireRegionStores = () => {
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

const buildVolumeCard = (b) => {
  const article = document.createElement('article');
  article.className = 'book-card';

  const coverLink = document.createElement('a');
  coverLink.className = 'book-card__cover';
  coverLink.href = b.canonicalPath || '/publishing.html';
  coverLink.setAttribute('aria-label', `Open ${b.title} details`);

  const img = document.createElement('img');
  img.className = 'book-card__cover-img';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = `${b.title} cover`;
  img.src = (b?.covers?.portrait || '/assets/images/publishing/default-book-cover.webp');

  coverLink.appendChild(img);
  article.appendChild(coverLink);

  const body = document.createElement('div');
  body.className = 'book-card__body';

  const h = document.createElement('h3');
  h.className = 'book-card__title';
  const a = document.createElement('a');
  a.href = b.canonicalPath || '/publishing.html';
  a.textContent = b.title || b.id;
  h.appendChild(a);

  const sub = document.createElement('p');
  sub.className = 'book-card__subtitle';
  sub.textContent = b.subtitle || '';

  const meta = document.createElement('div');
  meta.className = 'book-card__meta';

  const pill = (text, cls='') => {
    if (!text) return;
    const s = document.createElement('span');
    s.className = cls ? `pill ${cls}` : 'pill';
    s.textContent = text;
    meta.appendChild(s);
  };

  if (Number.isFinite(b.seriesNumber)) pill(`Volume ${b.seriesNumber}`);
  if (b.status) pill(String(b.status).trim(), String(b.status).toLowerCase() === 'live' ? 'pill--live' : '');

  const actions = document.createElement('div');
  actions.className = 'book-card__actions';

  const details = document.createElement('a');
  details.className = 'btn btn--ghost';
  details.href = b.canonicalPath || '/publishing.html';
  details.textContent = 'Details';
  actions.appendChild(details);

  const entries = amazonRegionalEntries(b?.stores);
  if (entries.length) actions.appendChild(buildRegionStore('Amazon region', b.title || b.id, b.stores));

  body.appendChild(h);
  if (sub.textContent) body.appendChild(sub);
  body.appendChild(meta);
  body.appendChild(actions);

  article.appendChild(body);
  return article;
};

const injectJsonLd = (seriesObj, sagaObj, volumes) => {
  const el = $('dynamic-jsonld');
  if (!el) return;

  const itemList = volumes.map((b, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    url: toAbsoluteSiteUrl(b.canonicalPath || '/publishing.html'),
    name: asString(b.title) || asString(b.id),
  }));

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: seriesObj?.title || 'Series',
    url: toAbsoluteSiteUrl(seriesObj?.canonicalPath || '/publishing.html'),
    isPartOf: sagaObj ? {
      '@type': 'CreativeWorkSeries',
      name: sagaObj.title,
      url: toAbsoluteSiteUrl(sagaObj.canonicalPath || '/publishing.html'),
    } : undefined,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: volumes.length,
      itemListElement: itemList,
    },
  };

  el.textContent = JSON.stringify(payload);
};

const render = () => {
  const body = document.body;
  const id = asString(body?.dataset?.seriesId);
  if (!id) return;

  const s = getSeriesById(id);
  if (!s) return;

  const sagaObj = getSagaById(s.sagaId) || null;
  const vols = getBooksForSeries(s.id);

  const title = $('series-title');
  if (title) title.textContent = s.title || s.id;

  const eyebrow = $('series-eyebrow');
  if (eyebrow) eyebrow.textContent = sagaObj ? sagaObj.title : 'Series';

  const desc = $('series-desc');
  if (desc) desc.textContent = s.description || '';

  const metaSaga = $('series-meta-saga');
  if (metaSaga) metaSaga.textContent = sagaObj?.title || 'Standalone';

  const metaVolumes = $('series-meta-volumes');
  if (metaVolumes) metaVolumes.textContent = `${vols.length}`;

  const volumeStat = $('series-volumes-stat');
  if (volumeStat) volumeStat.textContent = vols.length ? `${vols.length} canonical volume${vols.length === 1 ? '' : 's'} in reading order` : 'Volumes arrive when catalog data goes live';

  const ctaSaga = $('cta-saga-hub');
  if (ctaSaga && sagaObj?.canonicalPath) ctaSaga.setAttribute('href', sagaObj.canonicalPath);

  const list = $('series-volumes');
  if (list) {
    list.innerHTML = '';
    for (const b of vols) list.appendChild(buildVolumeCard(b));
  }

  injectJsonLd(s, sagaObj, vols);
  wireRegionStores();
};

document.addEventListener('DOMContentLoaded', render, { once: true });
