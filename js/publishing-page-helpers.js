// js/publishing-page-helpers.js
// Helper-only publishing page utilities extracted from the legacy bridge module so
// non-detail runtime pages can avoid bridge-owned helper imports.

const SITE_ORIGIN = 'https://www.triadofangels.com';
const ensureString = (v) => (typeof v === 'string' ? v : '');
const safeDate = (d) => {
  const s = ensureString(d).trim();
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
};

const AMAZON_DOMAINS = {
  US: 'https://www.amazon.com/dp/', UK: 'https://www.amazon.co.uk/dp/', DE: 'https://www.amazon.de/dp/', FR: 'https://www.amazon.fr/dp/', ES: 'https://www.amazon.es/dp/', IT: 'https://www.amazon.it/dp/', AU: 'https://www.amazon.com.au/dp/', CA: 'https://www.amazon.ca/dp/', JP: 'https://www.amazon.co.jp/dp/', IN: 'https://www.amazon.in/dp/', NL: 'https://www.amazon.nl/dp/', SE: 'https://www.amazon.se/dp/', PL: 'https://www.amazon.pl/dp/', BR: 'https://www.amazon.com.br/dp/', MX: 'https://www.amazon.com.mx/dp/', SG: 'https://www.amazon.sg/dp/'
};

export const amazonUrlFor = (asin, region) => {
  const a = ensureString(asin).trim();
  if (!a) return '';
  const r = ensureString(region).trim().toUpperCase();
  const base = AMAZON_DOMAINS[r] || AMAZON_DOMAINS.US;
  return `${base}${encodeURIComponent(a)}`;
};

export const toAbsoluteSiteUrl = (path) => {
  const p = ensureString(path).trim();
  if (!p) return SITE_ORIGIN;
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.startsWith('/') ? p : `/${p}`;
  return `${SITE_ORIGIN}${clean}`;
};

export const bookHref = (bookId, book) => {
  const canonical = ensureString(book?.canonicalPath).trim();
  if (canonical) return canonical.endsWith('/') ? canonical : `${canonical}/`;
  return `/book.html?id=${encodeURIComponent(ensureString(bookId).trim())}`;
};

export const bookAbsUrl = (bookId, book) => {
  const href = bookHref(bookId, book);
  if (!href) return SITE_ORIGIN;
  if (/^https?:\/\//i.test(href)) return href.replace(/\/index\.html$/, '');
  const clean = href.startsWith('/') ? href : `/${href}`;
  return `${SITE_ORIGIN}${clean}`.replace(/\/index\.html$/, '');
};

export const parseApproxDate = (item) => {
  const year = ensureString(item?.year).trim();
  const release = ensureString(item?.releaseDate).trim();
  const date = ensureString(item?.date).trim();
  const direct = safeDate(release) ?? safeDate(date);
  if (direct !== null) return direct;
  if (/^\d{4}$/.test(year)) {
    const t = Date.parse(`${year}-06-30T00:00:00Z`);
    return Number.isFinite(t) ? t : 0;
  }
  const y = safeDate(year);
  return y !== null ? y : 0;
};

export const detectAmazonRegion = (availableKeys) => {
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
