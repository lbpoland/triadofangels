// js/saga.js — Saga hub renderer (ESM)
// Truth-locked: renders only what exists in js/publishing-data.js.

import { sagas, series, books } from './publishing-data.js?v=5';

const $ = (id) => document.getElementById(id);

const asString = (v) => (typeof v === 'string' ? v.trim() : '');

const normalize = (v) => asString(v).toLowerCase();


const detectAmazonRegion = (availableKeys) => {
  const keys = new Set((availableKeys || []).map((k) => String(k || '').trim().toUpperCase()).filter(Boolean));
  if (!keys.size) return 'US';

  const lang = (() => { try { return String(navigator.language || navigator.userLanguage || '').trim(); } catch { return ''; } })();
  const upper = lang.toUpperCase();
  const tz = (() => { try { return String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').trim(); } catch { return ''; } })();

  const candidates = [];

  // Language-region hints (best effort; deterministic; no geo IP)
  const m = /-([A-Z]{2})\b/.exec(upper);
  if (m && m[1]) candidates.push(m[1]);

  // Timezone heuristics
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
  btn.textContent = 'View on Amazon';
  btn.setAttribute('aria-label', `View ${titleText} on Amazon (opens in a new tab)`);

  const fallback = (typeof stores?.amazon === 'string' && stores.amazon.trim()) ? stores.amazon.trim() : (entries[0]?.[1] || '');
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
  if (Number.isFinite(b.seriesNumber)) pill(`Book ${b.seriesNumber}`);
  if (b.status) pill(String(b.status).trim(), String(b.status).toLowerCase() === 'live' ? 'pill--live' : '');

  const actions = document.createElement('div');
  actions.className = 'book-card__actions';

  const details = document.createElement('a');
  details.className = 'btn btn--ghost';
  details.href = b.canonicalPath || '/publishing.html';
  details.textContent = 'Details';
  actions.appendChild(details);

  if (b?.stores?.amazonRegional && Object.keys(b.stores.amazonRegional || {}).length) {
    actions.appendChild((() => {
      const wrap = document.createElement('div');
      wrap.className = 'region-store';
      wrap.appendChild(Object.assign(document.createElement('span'), { className: 'region-store__label', textContent: 'Amazon region' }));

      const select = document.createElement('select');
      select.className = 'region-store__select';
      select.setAttribute('data-amazon-region', '1');
      select.setAttribute('aria-label', 'Select Amazon region');
      const entries = amazonRegionalEntries(b.stores);
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
      btn.href = (b?.stores?.amazon && typeof b.stores.amazon === 'string') ? b.stores.amazon : (entries[0]?.[1] || '');
      wrap.appendChild(select);
      wrap.appendChild(btn);
      return wrap;
    })());
  }

  body.appendChild(h);
  if (sub.textContent) body.appendChild(sub);
  if (meta.childNodes.length) body.appendChild(meta);
  body.appendChild(actions);

  article.appendChild(body);
  return article;
};

const init = () => {
  wireRegionStores();

  const sagaId = document.body?.dataset?.sagaId ? asString(document.body.dataset.sagaId) : '';
  const saga = sagas.find((s) => s.id === sagaId);
  if (!saga) return;

  const title = saga.title || saga.id;
  const heroTitle = $('saga-title');
  if (heroTitle) heroTitle.textContent = title;

  const heroDesc = $('saga-desc');
  if (heroDesc) heroDesc.textContent = asString(saga.description) || 'A living catalog of volumes and store links.';

  const heroArt = document.getElementById('saga-hero-art');
  if (heroArt && saga?.art?.wide) heroArt.style.backgroundImage = `url('${saga.art.wide}')`;

  const relatedSeries = series
    .filter((s) => s.sagaId === sagaId)
    .slice()
    .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));

  const relatedBooks = books
    .filter((b) => normalize(b.sagaId || '') === normalize(sagaId))
    .slice()
    .sort((a, b) => (Number(a.seriesNumber || 9999) - Number(b.seriesNumber || 9999)) || String(a.title || '').localeCompare(String(b.title || '')));

  const sagaStore = $('saga-store');
  if (sagaStore) {
    sagaStore.replaceChildren();
    if (saga?.stores?.amazonRegional) {
      sagaStore.appendChild(buildRegionStore('Series page', title, saga.stores));
    }
  }

  const metaSeries = $('saga-meta-series');
  if (metaSeries) metaSeries.textContent = `${relatedSeries.length}`;

  const metaVolumes = $('saga-meta-volumes');
  if (metaVolumes) metaVolumes.textContent = `${relatedBooks.length}`;

  const metaStore = $('saga-meta-store');
  if (metaStore) metaStore.textContent = saga?.stores?.amazonRegional ? 'Region-aware' : 'Catalog only';

  const seriesStat = $('saga-series-stat');
  if (seriesStat) seriesStat.textContent = relatedSeries.length ? `${relatedSeries.length} live series in this saga` : 'Series arrive when catalog data goes live';

  const volumesStat = $('saga-volumes-stat');
  if (volumesStat) volumesStat.textContent = relatedBooks.length ? `${relatedBooks.length} canonical volume${relatedBooks.length === 1 ? '' : 's'} in reading order` : 'Volumes arrive when catalog data goes live';

  // Series rail (saga → series)
  const rail = $('saga-series-rail');
  if (rail) {
    const related = relatedSeries;

    if (!related.length) {
      rail.innerHTML = '<div class="notice"><p>No series are listed for this saga yet.</p></div>';
    } else {
      const frag = document.createDocumentFragment();
      for (const s of related) {
        const card = document.createElement('a');
        card.className = 'series-card';
        card.href = (s.canonicalPath || '/publishing.html');
        card.setAttribute('role', 'listitem');

        const kicker = document.createElement('span');
        kicker.className = 'series-card__kicker';
        kicker.textContent = 'Series';

        const titleEl = document.createElement('span');
        titleEl.className = 'series-card__title';
        titleEl.textContent = s.title || s.id;

        const meta = document.createElement('span');
        meta.className = 'series-card__meta';
        const count = books.filter((b) => b.seriesId === s.id).length;
        meta.textContent = count ? `${count} volume${count === 1 ? '' : 's'}` : 'Volumes listed soon';

        card.appendChild(kicker);
        card.appendChild(titleEl);
        card.appendChild(meta);
        frag.appendChild(card);
      }
      rail.replaceChildren(frag);
    }
  }


  const vols = books
    .filter((b) => b.sagaId === sagaId)
    .slice()
    .sort((a, b) => (Number(a.seriesNumber) || 999) - (Number(b.seriesNumber) || 999));

  const grid = $('saga-volumes');
  if (grid) {
    const frag = document.createDocumentFragment();
    vols.forEach((b) => frag.appendChild(buildVolumeCard(b)));
    grid.replaceChildren(frag);
  }

  // Dynamic JSON-LD
  const json = document.getElementById('dynamic-jsonld');
  if (json) {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      url: `https://www.triadofangels.com/publishing/sagas/${sagaId}/`,
      hasPart: vols.map((b) => ({
        '@type': 'Book',
        name: b.title,
        url: `https://www.triadofangels.com${b.canonicalPath}`,
      })),
    };
    json.textContent = JSON.stringify(ld);
  }
};

init();
