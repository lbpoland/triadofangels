// js/music.js — Music library page controller (ESM)
// Renders the album catalog from generated runtime artifacts with fast filtering + stable layout.
// No unsafe HTML injection; everything is created via DOM APIs.

import { albums } from './generated/music-library.data.js';
import { buildAlbumTrackList, inferAlbumBuckets, toAbsoluteSiteUrl, parseApproxDate } from './music-page-helpers.js';
import { albumCanonicalPath, trackCanonicalPath } from './routes.js';
import { applyAlbumCoverVariants, loadAlbumVariantManifest } from './variants.js';

const SITE_ORIGIN = 'https://www.triadofangels.com';

// Optional responsive cover variants; safe fallback if manifest missing.
const variantsPromise = loadAlbumVariantManifest();

const $ = (sel) => document.querySelector(sel);

const KNOWN_STREAM_ORDER = [
  'spotify',
  'appleMusic',
  'youTubeMusic',
  'youtube'
];

const STREAM_LABELS = {
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  youTubeMusic: 'YouTube Music',
  youtube: 'YouTube'
};

const safeText = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);

const normalize = (s) => safeText(s).toLowerCase();

const state = {
  query: '',
  bucket: 'all',
  sort: 'featured'
};

let renderRaf = 0;
const scheduleRender = () => {
  if (renderRaf) cancelAnimationFrame(renderRaf);
  renderRaf = requestAnimationFrame(() => {
    renderRaf = 0;
    render();
  });
};

const bucketLabels = new Map();

const ensureChipInView = (wrap, el) => {
  try {
    if (!(wrap instanceof HTMLElement) || !(el instanceof HTMLElement)) return;
    if (wrap.scrollWidth <= wrap.clientWidth + 2) return;

    const pad = 14;
    const c = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const leftDelta = (r.left - c.left) - pad;
    const rightDelta = (r.right - c.right) + pad;

    const behavior = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (leftDelta < 0) wrap.scrollBy({ left: leftDelta, behavior });
    else if (rightDelta > 0) wrap.scrollBy({ left: rightDelta, behavior });
  } catch {}
};

const syncFilterSelectValue = () => {
  const sel = document.getElementById('music-filter-select');
  if (!sel) return;
  try { sel.value = state.bucket || 'all'; } catch {}
};

const hydrateMusicFacts = () => {
  const albumCount = document.getElementById('music-meta-albums');
  const trackCount = document.getElementById('music-meta-tracks');
  const lyricCount = document.getElementById('music-meta-lyrics');
  const sectionAlbums = document.getElementById('music-section-albums');
  const sectionLyrics = document.getElementById('music-section-lyrics');
  const sectionVideo = document.getElementById('music-section-video');
  const signalLibrary = document.getElementById('music-signal-library');
  const signalLyrics = document.getElementById('music-signal-lyrics');
  const signalDetail = document.getElementById('music-signal-detail');
  if (!albumCount && !trackCount && !lyricCount && !sectionAlbums && !sectionLyrics && !sectionVideo && !signalLibrary && !signalLyrics && !signalDetail) return;

  const albumTotal = Array.isArray(albums) ? albums.length : 0;
  const tracks = (Array.isArray(albums) ? albums : []).flatMap((album) => buildAlbumTrackList(album));
  const lyricTotal = tracks.filter((t) => safeText(t?.file) || safeText(t?.text)).length;
  const videoTotal = tracks.filter((t) => safeText(t?.video)).length;

  if (albumCount) albumCount.textContent = String(albumTotal);
  if (trackCount) trackCount.textContent = String(tracks.length);
  if (lyricCount) lyricCount.textContent = String(lyricTotal);
  if (sectionAlbums) sectionAlbums.textContent = String(albumTotal);
  if (sectionLyrics) sectionLyrics.textContent = String(lyricTotal);
  if (sectionVideo) sectionVideo.textContent = String(videoTotal);
  if (signalLibrary) signalLibrary.textContent = `${albumTotal} albums • ${tracks.length} tracks`;
  if (signalLyrics) signalLyrics.textContent = `${lyricTotal} lyric-ready • ${videoTotal} video-ready`;
  if (signalDetail) signalDetail.textContent = 'Albums → tracks → listening links';
};


const hydrateMusicCompare = () => {
  const stat = document.getElementById('music-compare-stat');
  const albumCopy = document.getElementById('music-compare-album-copy');
  const albumLink = document.getElementById('music-compare-album-link');
  const trackCopy = document.getElementById('music-compare-track-copy');
  const trackLink = document.getElementById('music-compare-track-link');
  const videoCopy = document.getElementById('music-compare-video-copy');
  const videoLink = document.getElementById('music-compare-video-link');
  const searchLink = document.getElementById('music-compare-search-link');
  if (!stat && !albumCopy && !albumLink && !trackCopy && !trackLink && !videoCopy && !videoLink && !searchLink) return;

  const sorted = sortAlbums(albums, 'featured');
  const featuredAlbum = sorted[0];
  if (!featuredAlbum) return;

  const albumId = safeText(featuredAlbum.id);
  const title = safeText(featuredAlbum.title, albumId);
  const trackList = buildAlbumTrackList(featuredAlbum);
  const lyricTrack = trackList.find((t) => safeText(t?.file) || safeText(t?.text)) || null;
  const videoTrack = trackList.find((t) => safeText(t?.video)) || null;
  const detailTrack = lyricTrack || videoTrack || trackList[0] || null;
  const orderedLinks = Object.entries(featuredAlbum?.links || {}).filter(([, url]) => safeText(url));

  if (stat) stat.textContent = `${title} • ${trackList.length} tracks • ${orderedLinks.length || 0} listening links`;
  if (albumCopy) albumCopy.textContent = `${title} is the best place to start when you want the artwork, track order, and full shape of the release in one place.`;
  if (albumLink) albumLink.setAttribute('href', albumCanonicalPath(albumId));

  if (trackCopy) trackCopy.textContent = detailTrack
    ? `“${safeText(detailTrack.title, detailTrack.id)}” is the strongest next stop when you want lyrics, story notes, or a tighter song-level view.`
    : 'Open a track page when you want the most focused song-level detail.';
  if (trackLink) trackLink.setAttribute('href', detailTrack ? trackCanonicalPath(albumId, safeText(detailTrack.id)) : albumCanonicalPath(albumId));

  if (videoCopy) videoCopy.textContent = videoTrack
    ? `“${safeText(videoTrack.title, videoTrack.id)}” keeps the next move visual and on-site before you step out to a platform.`
    : 'Use videos when you want to stay on-site first; use streaming when you are ready for a platform.';
  if (videoLink) videoLink.setAttribute('href', videoTrack ? '/videos.html' : '/streaming.html');
  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
};


const hydrateMusicPairings = () => {
  const stat = document.getElementById('music-pairings-stat');
  const albumCopy = document.getElementById('music-pairings-album-copy');
  const albumLink = document.getElementById('music-pairings-album-link');
  const trackLink = document.getElementById('music-pairings-track-link');
  const mediaCopy = document.getElementById('music-pairings-media-copy');
  const videoLink = document.getElementById('music-pairings-video-link');
  const streamLink = document.getElementById('music-pairings-stream-link');
  const searchCopy = document.getElementById('music-pairings-search-copy');
  const searchLink = document.getElementById('music-pairings-search-link');
  if (!stat && !albumCopy && !albumLink && !trackLink && !mediaCopy && !videoLink && !streamLink && !searchCopy && !searchLink) return;

  const sorted = sortAlbums(albums, 'featured');
  const featuredAlbum = sorted[0];
  if (!featuredAlbum) return;

  const albumId = safeText(featuredAlbum.id);
  const title = safeText(featuredAlbum.title, albumId);
  const trackList = buildAlbumTrackList(featuredAlbum);
  const primaryTrack = trackList.find((t) => safeText(t?.file) || safeText(t?.text)) || trackList.find((t) => safeText(t?.video)) || trackList[0] || null;
  const orderedLinks = Object.entries(featuredAlbum?.links || {}).filter(([, url]) => safeText(url));

  if (stat) stat.textContent = `${title} • ${trackList.length} tracks • ${orderedLinks.length || 0} listening links`;
  if (albumCopy) albumCopy.textContent = primaryTrack
    ? `${title} works best with “${safeText(primaryTrack.title, primaryTrack.id)}” when you want the full release context and the clearest song-level follow-up together.`
    : `${title} still works best when you want both release identity and tighter song-level context.`;
  if (albumLink) albumLink.setAttribute('href', albumCanonicalPath(albumId));
  if (trackLink) trackLink.setAttribute('href', primaryTrack ? trackCanonicalPath(albumId, safeText(primaryTrack.id)) : albumCanonicalPath(albumId));
  if (mediaCopy) mediaCopy.textContent = primaryTrack && safeText(primaryTrack.video)
    ? `“${safeText(primaryTrack.title, primaryTrack.id)}” has a media-ready route, so videos stay the strongest on-site companion before you leave the page.`
    : 'Use videos when you want to stay on-site and visual first; use streaming when you are ready for a platform.';
  if (videoLink) videoLink.setAttribute('href', '/videos.html');
  if (streamLink) streamLink.setAttribute('href', '/streaming.html');
  if (searchCopy) searchCopy.textContent = `Search is the quickest recovery path for ${title} when you know the title but not the exact page.`;
  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
};

const hydrateMusicSpotlight = () => {
  const cover = document.getElementById('music-spotlight-cover');
  const release = document.getElementById('music-spotlight-release');
  const summary = document.getElementById('music-spotlight-summary');
  const tracksPill = document.getElementById('music-spotlight-tracks');
  const lyricsPill = document.getElementById('music-spotlight-lyrics');
  const linksPill = document.getElementById('music-spotlight-links');
  const openLink = document.getElementById('music-spotlight-open');
  const streamingLink = document.getElementById('music-spotlight-streaming');
  const searchLink = document.getElementById('music-spotlight-search');
  const kicker = document.getElementById('music-spotlight-kicker');
  if (!release && !summary && !openLink) return;

  const sorted = sortAlbums(albums, 'featured');
  const featuredAlbum = sorted[0];
  if (!featuredAlbum) return;

  const albumId = safeText(featuredAlbum.id);
  const title = safeText(featuredAlbum.title, albumId);
  const artist = safeText(featuredAlbum.artist, 'Triad of Angels & ToA Studios');
  const year = safeText(featuredAlbum.year);
  const genre = safeText(featuredAlbum.genre);
  const trackList = buildAlbumTrackList(featuredAlbum);
  const lyricTotal = trackList.filter((t) => safeText(t?.file) || safeText(t?.text)).length;
  const orderedLinks = Object.entries(featuredAlbum?.links || {}).filter(([, url]) => safeText(url));
  const albumUrl = albumCanonicalPath(albumId);
  const coverRel = safeText(featuredAlbum.cover);
  const coverUrl = coverRel ? (coverRel.startsWith('http') ? coverRel : '/' + coverRel.replace(/^\//, '')) : '/assets/images/placeholder-album.webp';

  if (cover) {
    cover.setAttribute('src', coverUrl);
    cover.setAttribute('alt', `${title} album cover`);
    try { applyAlbumCoverVariants(cover, coverUrl, { sizes: '(max-width: 768px) 92vw, 340px' }); } catch {}
  }
  if (kicker) kicker.textContent = year ? `Spotlight release • ${year}` : 'Spotlight release';
  if (release) release.textContent = [title, artist, genre].filter(Boolean).join(' • ');
  if (summary) {
    summary.textContent = `${title} is leading the library right now. Open the album page for the full track run, then move into lyrics, notes, or listening links when you want more depth.`;
  }
  if (tracksPill) tracksPill.textContent = `${trackList.length} track${trackList.length === 1 ? '' : 's'}`;
  if (lyricsPill) lyricsPill.textContent = lyricTotal ? `${lyricTotal} lyric-ready` : 'Lyrics coming';
  if (linksPill) linksPill.textContent = orderedLinks.length ? `${orderedLinks.length} official link${orderedLinks.length === 1 ? '' : 's'}` : 'Links update here';
  if (openLink) openLink.setAttribute('href', albumUrl);
  if (streamingLink) {
    const priority = safeText(featuredAlbum?.links?.spotify) || safeText(featuredAlbum?.links?.appleMusic) || safeText(featuredAlbum?.links?.youTubeMusic) || '';
    streamingLink.setAttribute('href', priority || '/streaming.html');
    if (priority) {
      streamingLink.setAttribute('target', '_blank');
      streamingLink.setAttribute('rel', 'noopener noreferrer');
      streamingLink.textContent = 'Open platform';
    }
  }
  const lyricTrack = trackList.find((t) => safeText(t?.file) || safeText(t?.text)) || trackList[0] || null;
  const trackUrl = lyricTrack && safeText(lyricTrack?.id) ? `/music/tracks/${encodeURIComponent(albumId)}/${encodeURIComponent(lyricTrack.id)}/` : albumUrl;
  const routeStat = document.getElementById('music-route-release-stat');
  const routeAlbum = document.getElementById('music-route-album');
  const routeTrack = document.getElementById('music-route-track');
  const routeTrackCopy = document.getElementById('music-route-track-copy');
  const routeStream = document.getElementById('music-route-stream');
  const routeStreamCopy = document.getElementById('music-route-stream-copy');
  const routeSearch = document.getElementById('music-route-search');
  const routeSearchCopy = document.getElementById('music-route-search-copy');

  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
  if (routeStat) routeStat.textContent = `${title} • ${trackList.length} tracks • ${lyricTotal} lyric-ready`;
  if (routeAlbum) routeAlbum.textContent = `Open ${title}`;
  if (routeTrack) routeTrack.setAttribute('href', albumUrl);
  if (routeTrackCopy) routeTrackCopy.textContent = `${title} is the cleanest place to start when you want the full release in one place.`;
  if (routeStream) routeStream.setAttribute('href', trackUrl);
  if (routeStreamCopy) routeStreamCopy.textContent = lyricTrack ? `“${safeText(lyricTrack.title, lyricTrack.id)}” is the strongest next stop if you want lyrics, notes, or media first.` : 'This featured release still works best as a full album destination before narrowing into a single track.';
  if (routeSearch) routeSearch.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
  if (routeSearchCopy) routeSearchCopy.textContent = orderedLinks.length ? 'Search is the quickest way to move across the site, while platform links open listening pages.' : 'Search is the quickest way to move into related lyrics, tracks, albums, and pages.';
};


const buildStreamingMenu = (links) => {
  const ul = document.createElement('ul');
  ul.className = 'menu';
  ul.setAttribute('role', 'menu');

  const entries = Object.entries(links || {})
    .filter(([, v]) => typeof v === 'string' && v.trim());

  const ordered = [
    ...KNOWN_STREAM_ORDER
      .filter((k) => entries.some(([ek]) => ek === k))
      .map((k) => [k, links[k]]),
    ...entries.filter(([k]) => !KNOWN_STREAM_ORDER.includes(k))
  ];

  if (!ordered.length) {
    const li = document.createElement('li');
    li.className = 'menu__empty';
    li.textContent = 'No streaming links yet.';
    ul.appendChild(li);
    return ul;
  }

  ordered.forEach(([key, url]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = STREAM_LABELS[key] || key;
    a.setAttribute('aria-label', `Open ${STREAM_LABELS[key] || key} in a new tab`);
    a.setAttribute('role', 'menuitem');
    li.appendChild(a);
    ul.appendChild(li);
  });

  return ul;
};

const buildAlbumCard = (album, idx = 0) => {
  const albumId = safeText(album.id);
  const title = safeText(album.title, albumId);
  const artist = safeText(album.artist, 'Triad of Angels & ToA Studios');
  const genre = safeText(album.genre);
  const year = safeText(album.year);
  const coverRel = safeText(album.cover);
  const cover = coverRel ? (coverRel.startsWith('http') ? coverRel : '/' + coverRel.replace(/^\//, '')) : '/assets/images/default-cover.webp';
  const albumUrl = albumCanonicalPath(albumId);

  const card = document.createElement('article');
  card.className = 'album-card';
  card.dataset.albumId = albumId;
  card.setAttribute('role', 'listitem');

  const coverLink = document.createElement('a');
  coverLink.className = 'album-card__cover';
  coverLink.href = albumUrl;
  coverLink.setAttribute('aria-label', `Open album: ${title}`);

  if (cover) {
    const img = document.createElement('img');
    img.src = cover;
    img.alt = `${title} album cover`;
    // Apply responsive srcset if a variants manifest exists (no broken refs if missing)
    applyAlbumCoverVariants(img, cover, { sizes: '(max-width: 520px) 50vw, (max-width: 980px) 33vw, 260px' });
    img.loading = idx < 6 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.width = 800;
    img.height = 800;
    if (idx === 0) {
      img.setAttribute('fetchpriority', 'high');
    }
    coverLink.appendChild(img);
  } else {
    const fb = document.createElement('div');
    fb.className = 'album-card__coverFallback';
    fb.setAttribute('aria-hidden', 'true');
    fb.textContent = (title || albumId).slice(0, 2).toUpperCase();
    coverLink.appendChild(fb);
  }

  const body = document.createElement('div');
  body.className = 'album-card__body';

  const h = document.createElement('h3');
  h.className = 'album-card__title';
  const titleLink = document.createElement('a');
  titleLink.href = albumUrl;
  titleLink.textContent = title;
  const titleId = `album-title-${albumId}`;
  h.id = titleId;
  h.appendChild(titleLink);

  // Accessible card labeling: allow SRs to treat each card as a list item with a stable label.
  card.setAttribute('aria-labelledby', titleId);

  const meta = document.createElement('p');
  meta.className = 'album-card__meta';
  meta.textContent = year ? `${artist} • ${year}` : artist;

  const g = document.createElement('p');
  g.className = 'album-card__genre';
  g.textContent = genre;

  const tracks = buildAlbumTrackList(album);
  const stats = document.createElement('div');
  stats.className = 'album-card__stats';

  const pillTracks = document.createElement('span');
  pillTracks.className = 'pill';
  pillTracks.textContent = `${tracks.length} track${tracks.length === 1 ? '' : 's'}`;
  stats.appendChild(pillTracks);

  const hasLyrics = tracks.some((t) => (t.file && typeof t.file === 'string' && t.file.trim()) || (t.text && typeof t.text === 'string' && t.text.trim()));
  if (hasLyrics) {
    const pillLyrics = document.createElement('span');
    pillLyrics.className = 'pill pill--accent';
    pillLyrics.textContent = 'Lyrics';
    stats.appendChild(pillLyrics);
  }

  const actions = document.createElement('div');
  actions.className = 'album-card__actions';

  const openBtn = document.createElement('a');
  openBtn.href = albumUrl;
  openBtn.className = 'btn';
  openBtn.textContent = 'Open album';
  actions.appendChild(openBtn);

  const details = document.createElement('details');
  details.className = 'streaming';

  const summary = document.createElement('summary');
  summary.className = 'btn btn--ghost';
  summary.textContent = 'Listen';
  summary.setAttribute('aria-label', 'Open streaming links');
  summary.setAttribute('aria-haspopup', 'menu');
  details.appendChild(summary);

  const menu = buildStreamingMenu(album.links || {});
  const menuId = `stream-menu-${albumId}`;
  menu.id = menuId;
  summary.setAttribute('aria-controls', menuId);
  summary.setAttribute('aria-expanded', 'false');
  details.appendChild(menu);
  actions.appendChild(details);

  body.appendChild(h);
  body.appendChild(meta);
  if (genre) body.appendChild(g);
  body.appendChild(stats);
  body.appendChild(actions);

  card.appendChild(coverLink);
  card.appendChild(body);

  return card;
};

const matchesBucket = (album, bucket) => {
  if (bucket === 'all') return true;
  const artist = normalize(album.artist);
  if (bucket === 'triad') return artist.includes('triad');
  if (bucket === 'toa') return artist.includes('toa') || artist.includes('studios');

  const inferred = inferAlbumBuckets(album);
  return inferred.includes(bucket);
};

const matchesQuery = (album, q) => {
  if (!q) return true;
  const hay = [
    album.title,
    album.artist,
    album.genre,
    album.year,
    ...(Array.isArray(album.tracks) ? album.tracks : [])
  ].map(normalize).join(' ');
  return hay.includes(q);
};

const sortAlbums = (list, mode) => {
  const arr = [...list];

  if (mode === 'az' || mode === 'za') {
    arr.sort((a, b) => safeText(a.title).localeCompare(safeText(b.title), undefined, { sensitivity: 'base' }));
    if (mode === 'za') arr.reverse();
    return arr;
  }

  if (mode === 'newest' || mode === 'oldest') {
    arr.sort((a, b) => parseApproxDate(a) - parseApproxDate(b));
    if (mode === 'newest') arr.reverse();
    return arr;
  }

  // featured: Triad of Angels first, then by approx date desc
  arr.sort((a, b) => {
    const aTriad = normalize(a.artist).includes('triad') ? 0 : 1;
    const bTriad = normalize(b.artist).includes('triad') ? 0 : 1;
    if (aTriad !== bTriad) return aTriad - bTriad;
    return parseApproxDate(b) - parseApproxDate(a);
  });
  return arr;
};

const renderChips = () => {
  const wrap = $('#music-filter-chips');
  if (!wrap) return;

  wrap.setAttribute('aria-busy', 'true');
  wrap.dataset.loading = 'true';

  const base = [
    { id: 'all', label: 'All' },
    { id: 'triad', label: 'Triad' },
    { id: 'toa', label: 'ToA Studios' },
    { id: 'worship', label: 'Worship / Christian' },
    { id: 'pop', label: 'Pop' },
    { id: 'edm', label: 'EDM / Dance' },
    { id: 'hip-hop', label: 'Hip Hop / Rap' },
    { id: 'rock', label: 'Rock' },
    { id: 'metal', label: 'Metal' },
    { id: 'country', label: 'Country' },
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'other', label: 'Other' },
  ];

  const present = new Set();
  for (const a of albums) {
    for (const b of inferAlbumBuckets(a)) present.add(b);
  }

  const chips = base.filter((c) => c.id === 'all' || c.id === 'triad' || c.id === 'toa' || present.has(c.id));

  bucketLabels.clear();
  for (const c of chips) bucketLabels.set(c.id, c.label);

  renderFilterSelect(chips);

  const frag = document.createDocumentFragment();
  for (const c of chips) {
    const li = document.createElement('li');
    li.className = 'chip-row__item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.bucket = c.id;
    btn.setAttribute('aria-pressed', state.bucket === c.id ? 'true' : 'false');
    btn.textContent = c.label;

    btn.addEventListener('click', () => {
      if (state.bucket === c.id) return;
      state.bucket = c.id;
      updateChipStates();
      scheduleRender();
    });

    btn.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;
      e.preventDefault();

      const wrapNow = $('#music-filter-chips');
      if (!wrapNow) return;

      const btns = Array.from(wrapNow.querySelectorAll('button.chip'));
      if (!btns.length) return;

      const i = btns.indexOf(btn);
      let next = i;
      if (key === 'ArrowLeft') next = i - 1;
      if (key === 'ArrowRight') next = i + 1;
      if (key === 'Home') next = 0;
      if (key === 'End') next = btns.length - 1;

      const n = ((next % btns.length) + btns.length) % btns.length;
      const target = btns[n];
      if (!(target instanceof HTMLButtonElement)) return;

      const bucket = target.dataset.bucket || 'all';
      if (bucket && state.bucket !== bucket) {
        state.bucket = bucket;
        updateChipStates();
        syncFilterSelectValue();
        scheduleRender();
      }

      try { target.focus({ preventScroll: true }); } catch {}
      ensureChipInView(wrapNow, target);
    });

    li.appendChild(btn);
    frag.appendChild(li);
  }

  wrap.replaceChildren(frag);

  wrap.setAttribute('aria-busy', 'false');
  delete wrap.dataset.loading;
};


const renderFilterSelect = (chips) => {
  const sel = document.getElementById('music-filter-select');
  if (!sel) return;

  const existing = sel.value || '';
  sel.replaceChildren();

  for (const c of chips) {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.label;
    sel.appendChild(opt);
  }

  sel.value = state.bucket && chips.some((c) => c.id === state.bucket) ? state.bucket : 'all';

  if (!sel.__toaBound) {
    sel.__toaBound = true;
    sel.addEventListener('change', () => {
      const next = sel.value || 'all';
      if (state.bucket === next) return;
      state.bucket = next;
      updateChipStates();
      scheduleRender();
    });
  }
};

const updateChipStates = () => {
  const wrap = $('#music-filter-chips');
  if (!wrap) return;
  [...wrap.querySelectorAll('.chip')].forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.bucket === state.bucket));
  });
  syncFilterSelectValue();
};

const renderJsonLd = (visibleAlbums) => {
  const el = document.getElementById('dynamic-jsonld');
  if (!el) return;

  const items = visibleAlbums.map((a, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "url": `${SITE_ORIGIN}${albumCanonicalPath(safeText(a.id))}`
  }));

  const json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Triad of Angels & ToA Studios — Albums",
    "itemListOrder": "http://schema.org/ItemListOrderAscending",
    "numberOfItems": items.length,
    "itemListElement": items
  };

  el.textContent = JSON.stringify(json);
};

const render = () => {
  const grid = $('#music-album-grid');
  const meta = $('#music-results-meta');
  if (!grid) return;

  grid.setAttribute('data-loading', 'true');
  grid.setAttribute('aria-busy', 'true');

  const q = normalize(state.query);
  const filtered = albums
    .filter((a) => matchesBucket(a, state.bucket))
    .filter((a) => matchesQuery(a, q));

  const sorted = sortAlbums(filtered, state.sort);

  const frag = document.createDocumentFragment();
  sorted.forEach((a, i) => frag.appendChild(buildAlbumCard(a, i)));

  grid.replaceChildren(frag);

  grid.setAttribute('data-loading', 'false');
  grid.setAttribute('aria-busy', 'false');

  updateChipStates();
  renderJsonLd(sorted);

  if (meta) {
    const total = albums.length;
    const shown = sorted.length;

    const bucketLabel = bucketLabels.get(state.bucket) || 'All';
    const qLabel = safeText(state.query).trim();
    const qPart = qLabel ? ` • search: “${qLabel}”` : '';

    const baseLine =
      shown === total
        ? `${total} album${total === 1 ? '' : 's'} in the library.`
        : `${shown} of ${total} albums shown.`;

    meta.textContent = `${baseLine} • filter: ${bucketLabel}${qPart}`;

// Active-filter chips (visible + clickable): clears one constraint without resetting everything.
const active = document.getElementById('music-active-filters');
if (active) {
  const frag = document.createDocumentFragment();

  const makeChip = (label, ariaLabel, onClick, pressed = true) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    btn.textContent = label;
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
    btn.addEventListener('click', onClick, { passive: true });
    return btn;
  };

  const sortLabel = (() => {
    switch (state.sort) {
      case 'newest': return 'Newest';
      case 'oldest': return 'Oldest';
      case 'az': return 'A → Z';
      case 'za': return 'Z → A';
      default: return 'Featured';
    }
  })();

  const hasBucket = state.bucket && state.bucket !== 'all';
  const hasQuery = Boolean(qLabel);
  const hasSort = state.sort && state.sort !== 'featured';
  const hasAny = hasBucket || hasQuery || hasSort;

  if (hasBucket) {
    frag.appendChild(
      makeChip(
        `Filter: ${bucketLabel} ×`,
        `Clear filter ${bucketLabel}`,
        () => { state.bucket = 'all'; syncFilterSelectValue(); scheduleRender(); },
        true
      )
    );
  }

  if (hasQuery) {
    frag.appendChild(
      makeChip(
        `Search: “${qLabel}” ×`,
        'Clear search query',
        () => {
          state.query = '';
          const input = document.getElementById('music-search-input');
          if (input) input.value = '';
          scheduleRender();
        },
        true
      )
    );
  }

  if (hasSort) {
    frag.appendChild(
      makeChip(
        `Sort: ${sortLabel} ×`,
        'Reset sort to Featured',
        () => {
          state.sort = 'featured';
          const sortSel = document.getElementById('music-sort-select');
          if (sortSel) sortSel.value = 'featured';
          scheduleRender();
        },
        true
      )
    );
  }

  if (hasAny) {
    frag.appendChild(
      makeChip(
        'Reset all',
        'Reset all filters',
        () => {
          state.query = '';
          state.bucket = 'all';
          state.sort = 'featured';

          const input = document.getElementById('music-search-input');
          if (input) input.value = '';

          const sortSel = document.getElementById('music-sort-select');
          if (sortSel) sortSel.value = 'featured';

          syncFilterSelectValue();
          scheduleRender();
        },
        false
      )
    );
  }

  active.replaceChildren(frag);
}


  }

  const badge = document.getElementById('music-count-badge');
  if (badge) {
    const total = albums.length;
    const shown = sorted.length;
    badge.textContent = shown === total ? `${total} albums` : `${shown}/${total} albums`;
  }
};

const init = () => {
  hydrateMusicFacts();
  hydrateMusicCompare();
  hydrateMusicPairings();
  renderChips();

  const input = $('#music-search-input');
  if (input) {
    input.addEventListener('input', () => {
      state.query = input.value || '';
      scheduleRender();
    });

    // Keyboard parity: Esc clears the field and resets only the text query (does not change bucket/sort).
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!input.value) return;
      e.preventDefault();
      input.value = '';
      state.query = '';
      scheduleRender();
    });
  }

  const sort = $('#music-sort-select');
  if (sort) {
    sort.addEventListener('change', () => {
      state.sort = sort.value;
      scheduleRender();
    });
  }

  // Reset (Wave AL): restores default view (Featured + All + empty query) in one action.
  const resetBtn = document.getElementById('music-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.query = '';
      state.bucket = 'all';
      state.sort = 'featured';

      if (input) input.value = '';
      if (sort) sort.value = 'featured';

      const filterSel = document.getElementById('music-filter-select');
      if (filterSel) filterSel.value = 'all';

      scheduleRender();

      // Nice UX: return focus to search field for fast refinement.
      try { if (input) input.focus({ preventScroll: true }); } catch {}
    });
  }

  render();
};

init();
