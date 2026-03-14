// js/album.js — Album detail page controller (ESM)
// - Supports canonical folder routes and legacy query templates.
// - Renders album meta + tracklist from js/data.js.
// - Updates head/meta and injects JSON-LD (runtime) for correctness.

import * as MusicData from './data.js';
import { sanitizeTrackId } from './utils.js';
import { SITE_ORIGIN, getAlbumId, albumCanonicalAbs, albumCanonicalPath, trackCanonicalPath, trackCanonicalAbs } from './routes.js';
import { applyAlbumCoverVariants } from './variants.js';

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

const DEFAULT_ART = '/assets/images/placeholder-album.webp';

const norm = (s) => asString(s).toLowerCase();

function pickAlbums(mod) {
  if (Array.isArray(mod?.albums)) return mod.albums;
  if (Array.isArray(mod?.default?.albums)) return mod.default.albums;
  if (Array.isArray(mod?.ALBUMS)) return mod.ALBUMS;
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


function ensureSitePath(pathOrUrl) {
  const s = asString(pathOrUrl);
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return s;
  return `/${s.replace(/^\/+/, '')}`;
}

function normalizeGenre(genre) {
  if (Array.isArray(genre)) return genre.map((g) => asString(g)).filter(Boolean).join(', ');
  return asString(genre);
}

function normalizeTracks(album) {
  const raw = album?.tracks;
  if (Array.isArray(raw)) {
    return raw
      .map((t) => {
        if (typeof t === 'string') {
          const title = t.trim();
          const id = sanitizeTrackId(title);
          return { id, title };
        }
        if (t && typeof t === 'object') {
          const title = asString(t.title || t.name);
          const id = asString(t.id || t.slug) || (title ? sanitizeTrackId(title) : '');
          return { id, title, ...t };
        }
        return null;
      })
      .filter(Boolean);
  }
  return [];
}

function getLyricsEntry(album, trackId) {
  const lyrics = album?.lyrics && typeof album.lyrics === 'object' ? album.lyrics : null;
  if (!lyrics) return null;
  const direct = lyrics[trackId];
  if (direct) return direct;
  // Sometimes keys may be un-sanitized; attempt a light scan.
  const key = Object.keys(lyrics).find((k) => sanitizeTrackId(k) === trackId);
  return key ? lyrics[key] : null;
}

function orderedStreamLinks(links) {
  const src = links && typeof links === 'object' ? links : {};
  const ORDER = [
    ['spotify', 'Spotify'],
    ['appleMusic', 'Apple Music'],
    ['youTubeMusic', 'YouTube Music'],
    ['youtube', 'YouTube'],
  ];

  const out = [];
  const seen = new Set();

  for (const [k, label] of ORDER) {
    const u = asString(src[k]);
    if (u) {
      out.push({ key: k, label, url: u });
      seen.add(k);
    }
  }

  for (const [k, v] of Object.entries(src)) {
    if (seen.has(k)) continue;
    const u = asString(v);
    if (!u) continue;
    out.push({ key: k, label: k, url: u });
  }

  return out;
}

function setBusy(isBusy) {
  const list = $('album-tracklist');
  if (!list) return;
  list.setAttribute('aria-busy', isBusy ? 'true' : 'false');
  list.dataset.loading = isBusy ? 'true' : 'false';
}


function wireAlbumSectionTools() {
  const input = document.getElementById('album-track-search');
  const buttons = Array.from(document.querySelectorAll('[data-albumtool]'));
  if (!buttons.length) return;

  const clickFilter = (value) => {
    const btn = document.querySelector(`[data-track-filter="${value}"]`);
    if (btn instanceof HTMLButtonElement) btn.click();
  };

  buttons.forEach((btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    btn.addEventListener('click', () => {
      const action = btn.dataset.albumtool || '';
      if (action === 'focus-search') {
        if (input instanceof HTMLInputElement) input.focus();
        return;
      }
      if (action === 'lyrics') {
        clickFilter('lyrics');
        return;
      }
      if (action === 'video') {
        clickFilter('video');
      }
    });
  });
}

function renderNotFound(message) {
  setBusy(false);
  safeText($('album-title'), 'Album not found');
  safeText($('album-artist'), '');
  safeText($('album-year'), '');
  safeText($('album-genre'), '');
  safeText($('album-description'), message || 'This album could not be located.');
  const list = $('album-tracklist');
  if (list) {
    clear(list);
    list.appendChild(el('div', { class: 'notice' }, [el('p', { text: message || 'Album not found.' })]));
  }
}

function updateHeadForAlbum(album, canonAbs, coverAbs) {
  const title = `${asString(album?.title) || 'Album'} — Album | Triad of Angels & ToA Studios`;
  const desc = clampDescription(
    asString(album?.artistInfo) || asString(album?.description) || `Official album page for ${asString(album?.title) || 'this release'}.`
  );

  setTitle(title);
  setCanonical(canonAbs);

  setMetaName('description', desc);
  setMetaProperty('og:type', 'music.album');
  setMetaProperty('og:title', title);
  setMetaProperty('og:description', desc);
  setMetaProperty('og:url', canonAbs);
  if (coverAbs) setMetaProperty('og:image', coverAbs);

  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', title);
  setMetaName('twitter:description', desc);
  setMetaName('twitter:url', canonAbs);
  if (coverAbs) setMetaName('twitter:image', coverAbs);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: asString(album?.title) || '',
    url: canonAbs,
    image: coverAbs || undefined,
    byArtist: {
      '@type': 'MusicGroup',
      name: asString(album?.artist) || 'Triad of Angels & ToA Studios',
    },
  };

  const year = asString(album?.year);
  if (year) ld.datePublished = year;

  const tlist = normalizeTracks(album);
  if (tlist.length) {
    ld.numTracks = tlist.length;
    ld.track = tlist.map((t, idx) => ({
      '@type': 'MusicRecording',
      name: t.title,
      position: idx + 1,
      url: trackCanonicalAbs(asString(album?.id) || '', t.id),
    }));
  }

  injectJsonLd(ld);
}

function wireShare(albumTitle, canonAbs) {
  const btn = $('album-share');
  if (!btn) return;

  // If a page chooses to delegate sharing to the global Link Tools system,
  // do not double-bind.
  try {
    if (btn.hasAttribute && btn.hasAttribute('data-linktool')) return;
  } catch {}

  enableCopyButton(btn);

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const text = canonAbs;
    const original = btn.textContent || 'Copy link';
    try {
      const ok = window.__toaCopyText ? await window.__toaCopyText(text) : false;
      if (!ok) throw new Error('copy unavailable');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1400);
    } catch {
      btn.textContent = 'Copy failed';
      setTimeout(() => { btn.textContent = original; }, 1600);
    }
  });

  // Also wire social share row if present (future-proof)
  const shareX = $('share-x');
  const shareFb = $('share-facebook');
  const shareLi = $('share-linkedin');
  const shareEmail = $('share-email');
  const encUrl = encodeURIComponent(canonAbs);
  const encText = encodeURIComponent(`${albumTitle} — Triad of Angels & ToA Studios`);
  applyShareHref(shareX, `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`);
  applyShareHref(shareFb, `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`);
  applyShareHref(shareLi, `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`);
  applyShareHref(shareEmail, `mailto:?subject=${encText}&body=${encUrl}`);
}

function setupTrackTools(tracksMeta) {
  const input = document.getElementById('album-track-search');
  const meta = document.getElementById('album-track-meta');
  const list = $('album-tracklist');
  if (!list) return;

  const chips = Array.from(document.querySelectorAll('[data-track-filter]'))
    .filter((b) => b && (b instanceof HTMLElement));

  const state = {
    q: '',
    filter: 'all'
  };

  const getRows = () => Array.from(list.querySelectorAll('a.track-row'));

  const setChipState = () => {
    chips.forEach((b) => {
      const f = String(b.getAttribute('data-track-filter') || 'all');
      b.setAttribute('aria-pressed', f === state.filter ? 'true' : 'false');
    });
  };

  const updateMeta = (shown, total) => {
    if (!meta) return;
    const f = state.filter === 'all' ? 'All' : (state.filter === 'lyrics' ? 'Lyrics' : 'Video');
    const q = state.q ? ` • search: “${state.q}”` : '';
    meta.textContent = `${shown} of ${total} tracks shown • filter: ${f}${q}`;
  };

  const apply = () => {
    const rows = getRows();
    const total = rows.length;

    const q = norm(state.q);
    let shown = 0;

    rows.forEach((row) => {
      const title = norm(row.getAttribute('data-track-title') || row.textContent || '');
      const hasLyrics = row.getAttribute('data-has-lyrics') === '1';
      const hasVideo = row.getAttribute('data-has-video') === '1';

      const matchQ = !q || title.includes(q);
      const matchF = state.filter === 'all'
        || (state.filter === 'lyrics' && hasLyrics)
        || (state.filter === 'video' && hasVideo);

      const visible = matchQ && matchF;
      row.hidden = !visible;
      row.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible) shown += 1;
    });

    updateMeta(shown, total);
    setChipState();
  };

  // Initial meta
  try {
    if (meta && !meta.textContent) {
      const total = tracksMeta && Array.isArray(tracksMeta) ? tracksMeta.length : getRows().length;
      meta.textContent = `${total} track${total === 1 ? '' : 's'}.`;
    }
  } catch {}

  // Search input
  if (input && !input.__toaBound) {
    input.__toaBound = true;
    input.addEventListener('input', () => {
      state.q = input.value || '';
      apply();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!input.value) return;
      e.preventDefault();
      input.value = '';
      state.q = '';
      apply();
    });
  }

  // Filter chips (click + arrow navigation)
  if (chips.length) {
    chips.forEach((b) => {
      b.addEventListener('click', () => {
        const next = String(b.getAttribute('data-track-filter') || 'all');
        if (state.filter === next) return;
        state.filter = next;
        apply();
      });

      b.addEventListener('keydown', (e) => {
        const key = e.key;
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(key)) return;
        e.preventDefault();
        const i = chips.indexOf(b);
        if (i < 0) return;
        let next = i;
        if (key === 'ArrowLeft') next = i - 1;
        if (key === 'ArrowRight') next = i + 1;
        if (key === 'Home') next = 0;
        if (key === 'End') next = chips.length - 1;
        const n = ((next % chips.length) + chips.length) % chips.length;
        const target = chips[n];
        if (!target) return;
        try { target.focus({ preventScroll: true }); } catch {}
        const f = String(target.getAttribute('data-track-filter') || 'all');
        if (f && state.filter !== f) {
          state.filter = f;
          apply();
        }
      });
    });
  }

  // Run once after render
  apply();
}


function renderLinkTabs(album) {
  const wrap = $('link-tabs');
  if (!wrap) return;
  clear(wrap);

  const links = orderedStreamLinks(album?.links);
  if (!links.length) {
    wrap.appendChild(el('span', { class: 'pill' }, ['No streaming links yet.']));
    return;
  }

  links.slice(0, 10).forEach((l) => {
    wrap.appendChild(
      el('a', {
        class: 'link-tab',
        href: l.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${l.label} (opens in a new tab)`,
      }, [
        el('span', { text: l.label }),
      ])
    );
  });
}



function hydrateAlbumSignalsAndTrackMap(album, albumId) {
  const tracks = normalizeTracks(album);
  const lyricsTracks = tracks.filter((t) => {
    const entry = getLyricsEntry(album, t.id);
    return !!asString(entry?.file) || !!asString(entry?.text);
  });
  const videoTrack = tracks.find((t) => !!asString(getLyricsEntry(album, t.id)?.video)) || null;
  const primaryTrack = lyricsTracks[0] || tracks[0] || null;
  const links = orderedStreamLinks(album?.links);
  const title = asString(album?.title) || albumId;
  const year = asString(album?.year);
  const genre = asString(album?.genre);

  safeText($('album-signal-release-stat'), `${title} • ${tracks.length} tracks`);
  safeText($('album-signal-theme-stat'), 'ToA • Dark • Light carry the same release hierarchy');
  safeText($('album-signal-release-meta'), [year, genre, `${tracks.length} track${tracks.length === 1 ? '' : 's'}`].filter(Boolean).join(' • ') || 'Release summary stays visible before the tracklist.');
  safeText($('album-signal-lyrics-meta'), lyricsTracks.length ? `${lyricsTracks.length} lyric-ready track${lyricsTracks.length === 1 ? '' : 's'} are available directly from this release.` : 'No lyric page is published for this release yet, so the album page stays the best place to start.');
  safeText($('album-signal-video-meta'), videoTrack ? `“${asString(videoTrack.title) || videoTrack.id}” is the strongest video-ready continuation from this release.` : 'No video is published for this release yet, so streaming or search is the best next stop.');
  safeText($('album-signal-search-meta'), `Search, streaming, and canonical track routes remain available without losing release context.`);

  safeText($('album-track list-stat'), `${primaryTrack ? 'Lead track available' : 'Tracklist ready'} • ${lyricsTracks.length} lyric page${lyricsTracks.length === 1 ? '' : 's'} • ${links.length} verified link${links.length === 1 ? '' : 's'}`);
  safeText($('album-map-primary'), primaryTrack ? `Open “${asString(primaryTrack.title) || primaryTrack.id}” to move straight into the strongest next track from this release` : 'Use the tracklist to choose the next song from this release');
  safeText($('album-map-primary-copy'), primaryTrack ? `This map now prefers the clearest meaningful next move from the release, rather than assuming every visitor should start at the top of the tracklist.` : 'Use the tracklist below when you want to choose the first meaningful route manually.');
  const primaryHref = primaryTrack ? trackCanonicalPath(albumId, primaryTrack.id) : albumCanonicalPath(albumId);
  const primaryLink = $('album-map-primary-link');
  if (primaryLink) primaryLink.setAttribute('href', primaryHref);

  const lyricTrack = lyricsTracks[0] || null;
  safeText($('album-map-lyrics'), lyricTrack ? `Open “${asString(lyricTrack.title) || lyricTrack.id}” as the clearest lyric-ready route` : 'Use the lyrics hub when this release has no lyric-ready track exposed');
  safeText($('album-map-lyrics-copy'), lyricTrack ? 'The lyric-first route is now separated from the primary route so visitors can choose between release depth and immediate text-first detail.' : 'This release currently falls back to the lyrics hub instead of pretending a lyric-ready song exists.');
  const lyricLink = $('album-map-lyrics-link');
  if (lyricLink) lyricLink.setAttribute('href', lyricTrack ? trackCanonicalPath(albumId, lyricTrack.id) : '/lyrics/');

  const videoHref = videoTrack ? trackCanonicalPath(albumId, videoTrack.id) : (links[0]?.url || '/streaming.html');
  safeText($('album-map-video'), videoTrack ? `Use “${asString(videoTrack.title) || videoTrack.id}” when the strongest continuation is media-led` : 'Use platform routing when the strongest continuation is outward, not track-led');
  safeText($('album-map-video-copy'), videoTrack ? 'The track map now isolates the video-ready route so media-capable tracks do not get lost inside the generic route cluster.' : 'When no video-ready track exists, the best outward continuation is a platform link or the streaming hub.');
  const videoLink = $('album-map-video-link');
  if (videoLink) {
    videoLink.setAttribute('href', videoHref);
    if (/^https?:/i.test(videoHref)) {
      videoLink.setAttribute('target', '_blank');
      videoLink.setAttribute('rel', 'noopener noreferrer');
      videoLink.textContent = 'Open platform';
    }
  }
  const searchLink = $('album-map-search');
  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);

  safeText($('album-proof-stat'), `${title} • ${tracks.length} tracks • ${links.length} verified link${links.length === 1 ? '' : 's'}`);
  safeText($('album-proof-context-title'), `${title} keeps the release view clear from cover to tracklist`);
  safeText($('album-proof-context-copy'), lyricsTracks.length ? `${lyricsTracks.length} lyric-ready track${lyricsTracks.length === 1 ? '' : 's'} keep this release rich even before you open an individual song.` : 'The release page stays useful even when the deepest song-level detail is lighter.');
  safeText($('album-proof-sibling-title'), lyricTrack ? `Open “${asString(lyricTrack.title) || lyricTrack.id}” as the strongest next song from ${title}` : 'Use the tracklist when the album itself should lead the next move');
  safeText($('album-proof-sibling-copy'), lyricTrack ? 'Keep moving inside the release without losing context.' : 'When no stronger sibling exists, the release page remains the right middle layer.');
  const proofSiblingLink = $('album-proof-sibling-link');
  if (proofSiblingLink) proofSiblingLink.setAttribute('href', lyricTrack ? trackCanonicalPath(albumId, lyricTrack.id) : '#tracks');
  safeText($('album-proof-outward-copy'), links.length ? 'Verified listening links stay visible once you have the release context.' : 'Search and the streaming hub stay available when direct listening links are not shown on this release.');
  const proofOutwardLink = $('album-proof-outward-link');
  if (proofOutwardLink) {
    const href = links[0]?.url || '/streaming.html';
    proofOutwardLink.setAttribute('href', href);
    if (/^https?:/i.test(href)) {
      proofOutwardLink.setAttribute('target', '_blank');
      proofOutwardLink.setAttribute('rel', 'noopener noreferrer');
      proofOutwardLink.textContent = 'Open platform';
    }
  }
}


function hydrateAlbumCompanion(album, albumId, tracks, lyricsTracks, videoTrack, links) {
  const title = asString(album?.title) || albumId;
  const primaryTrack = lyricsTracks[0] || videoTrack || tracks[0] || null;
  const altTrack = tracks.find((t) => t && primaryTrack && asString(t.id) !== asString(primaryTrack.id) && (t === videoTrack || lyricsTracks.some((lt) => asString(lt.id) === asString(t.id)))) || tracks.find((t) => primaryTrack && asString(t.id) !== asString(primaryTrack.id)) || null;

  safeText($('album-companion-stat'), `${title} • ${tracks.length} tracks • ${lyricsTracks.length} lyric-ready tracks • ${links.length} listening link${links.length === 1 ? '' : 's'}`);

  safeText($('album-companion-primary-title'), primaryTrack ? `Open “${asString(primaryTrack.title) || asString(primaryTrack.id)}” as the clearest companion route from this release` : 'Use the tracklist when the album itself should remain the main companion layer');
  safeText($('album-companion-primary-copy'), primaryTrack ? 'Keep the strongest next track in reach without losing the release context.' : 'When no stronger companion route exists, the album itself remains the right middle layer.');
  const primaryLink = $('album-companion-primary-link');
  if (primaryLink) primaryLink.setAttribute('href', primaryTrack ? trackCanonicalPath(albumId, asString(primaryTrack.id)) : '#tracks');

  safeText($('album-companion-alt-title'), altTrack ? `Use “${asString(altTrack.title) || asString(altTrack.id)}” as the alternate companion route` : 'Keep a wider route visible when only one meaningful song continuation exists');
  safeText($('album-companion-alt-copy'), altTrack ? 'A second companion route gives the page another clear continuation once the primary track has been explored.' : 'When a second song route is not meaningful yet, the wider library and search surfaces stay available instead of forcing a weaker detail page.');
  const altLink = $('album-companion-alt-link');
  if (altLink) altLink.setAttribute('href', altTrack ? trackCanonicalPath(albumId, asString(altTrack.id)) : '/music.html');

  safeText($('album-companion-outward-copy'), links.length
    ? 'Music, search, and listening links exits remain clear once you have the release context.'
    : 'Music and search remain the wider next steps when this release snapshot does not expose direct platform exits.');
  const musicLink = $('album-companion-music-link');
  if (musicLink) musicLink.setAttribute('href', '/music.html');
  const searchLink = $('album-companion-search-link');
  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
}



function hydrateAlbumLadder(album, albumId, tracks, lyricsTracks, videoTrack, links) {
  const title = asString(album?.title) || albumId;
  const primaryTrack = lyricsTracks[0] || tracks[0] || null;
  const secondaryTrack = lyricsTracks[1] || tracks.find((t) => t && primaryTrack && asString(t.id) !== asString(primaryTrack.id)) || null;
  const streamHref = links[0]?.url || '/streaming.html';

  safeText($('album-ladder-stat'), `${title} • ${tracks.length} tracks • ${primaryTrack ? 'lead track available' : 'tracklist-led'} • ${links.length} listening link${links.length === 1 ? '' : 's'}`);

  safeText($('album-ladder-start-title'), primaryTrack ? `Start with “${asString(primaryTrack.title) || asString(primaryTrack.id)}” as the clearest continuation from ${title}` : 'Start with the tracklist when no single song should lead ahead of the album');
  safeText($('album-ladder-start-copy'), primaryTrack ? 'The ladder keeps the strongest continuation in view lower on the page, so the release never loses its clearest next step.' : 'When no one song should take over, the album remains the right middle layer and the tracklist stays the best next move.');
  const startLink = $('album-ladder-start-link');
  if (startLink) startLink.setAttribute('href', primaryTrack ? trackCanonicalPath(albumId, asString(primaryTrack.id)) : '#tracks');

  safeText($('album-ladder-middle-title'), secondaryTrack ? `Keep moving with “${asString(secondaryTrack.title) || asString(secondaryTrack.id)}” as the alternate continuation` : 'Keep a wider route visible when a second same-release continuation would be weaker than the broader release context');
  safeText($('album-ladder-middle-copy'), secondaryTrack ? 'A second rung keeps the release from feeling one-note once the primary continuation is understood.' : 'When the second rung would be weaker, the album stays broader instead of forcing another same-level detail route.');
  const middleLink = $('album-ladder-middle-link');
  if (middleLink) middleLink.setAttribute('href', secondaryTrack ? trackCanonicalPath(albumId, asString(secondaryTrack.id)) : albumCanonicalPath(albumId));

  safeText($('album-ladder-outward-copy'), videoTrack
    ? `“${asString(videoTrack.title) || asString(videoTrack.id)}” keeps a media-ready on-site move visible, while Music, Search, and listening links remain the deliberate outward ladder only after the release context is complete.`
    : 'Music, Search, and listening links remain visible as wider rungs of the ladder, but they stay secondary to the on-site release logic instead of replacing it too early.');
  const musicLink = $('album-ladder-music-link');
  if (musicLink) musicLink.setAttribute('href', '/music.html');
  const searchLink = $('album-ladder-search-link');
  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
  const streamLink = $('album-ladder-stream-link');
  if (streamLink) {
    streamLink.setAttribute('href', streamHref);
    if (/^https?:/i.test(streamHref)) {
      streamLink.setAttribute('target', '_blank');
      streamLink.setAttribute('rel', 'noopener noreferrer');
      streamLink.textContent = 'Platform';
    }
  }
}

function hydrateAlbumSnapshot(album, trackSummary, lyricsCount, videoCount, albumId) {
  const release = $('album-snapshot-release');
  const content = $('album-snapshot-content');
  const listen = $('album-snapshot-listen');
  const next = $('album-snapshot-next');
  const nextNote = $('album-snapshot-next-note');
  const primary = $('album-snapshot-primary');
  const search = $('album-snapshot-search');
  const routePrimaryTitle = $('album-route-primary-title');
  const routePrimaryCopy = $('album-route-primary-copy');
  const routePrimary = $('album-route-primary');
  const routeLyricsCopy = $('album-route-lyrics-copy');
  const routeLyrics = $('album-route-lyrics');
  const routeVideoCopy = $('album-route-video-copy');
  const routeVideo = $('album-route-video');
  const routeSearch = $('album-route-search');
  if (!release && !content && !listen && !next && !primary) return;

  const total = Array.isArray(trackSummary) ? trackSummary.length : 0;
  const firstTrack = trackSummary.find((t) => t?.id) || null;
  const lyricTrack = trackSummary.find((t) => t?.hasLyrics) || null;
  const videoTrack = trackSummary.find((t) => t?.hasVideo) || null;
  const title = asString(album?.title) || albumId;
  const artist = asString(album?.artist) || 'Triad of Angels & ToA Studios';
  const year = asString(album?.year);
  const genre = asString(album?.genre);
  const links = orderedStreamLinks(album?.links);
  const linkCount = links.length;

  if (release) release.textContent = [year || 'Release', genre || 'Genre', artist].filter(Boolean).join(' • ');
  if (content) {
    const bits = [`${total} track${total === 1 ? '' : 's'}`];
    if (lyricsCount) bits.push(`${lyricsCount} lyric-ready`);
    if (videoCount) bits.push(`${videoCount} video-ready`);
    content.textContent = bits.join(' • ');
  }
  if (listen) listen.textContent = linkCount ? `${linkCount} listening link${linkCount === 1 ? '' : 's'}` : 'Streaming and Search stay nearby';
  if (search) search.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);

  let bestHref = albumCanonicalPath(albumId);
  let bestText = 'Use the tracklist below to continue from this release.';
  let bestNote = 'Album pages should frame the release before pushing you into a flat list of tracks.';
  if (lyricTrack) {
    bestHref = trackCanonicalPath(albumId, lyricTrack.id);
    bestText = `Open “${lyricTrack.title || lyricTrack.id}” when you want the most direct lyric-ready route from this album.`;
    bestNote = 'The primary route now prefers a lyric-ready track when one exists, because that usually gives the richest detail surface fastest.';
  } else if (firstTrack) {
    bestHref = trackCanonicalPath(albumId, firstTrack.id);
    bestText = `Open “${firstTrack.title || firstTrack.id}” to continue from this album into a canonical track page.`;
    bestNote = 'When lyric-ready content is not present, the page falls back to the first listed track so the next move still stays clear.';
  }

  if (next) next.textContent = bestText;
  if (nextNote) nextNote.textContent = bestNote;
  if (primary) primary.setAttribute('href', bestHref);

  if (routePrimaryTitle) routePrimaryTitle.textContent = lyricTrack ? 'Open the lyric-ready track' : 'Open the cleanest next track';
  if (routePrimaryCopy) routePrimaryCopy.textContent = bestText;
  if (routePrimary) routePrimary.setAttribute('href', bestHref);

  if (routeLyrics) {
    if (lyricTrack) {
      routeLyrics.setAttribute('href', trackCanonicalPath(albumId, lyricTrack.id));
      routeLyrics.textContent = 'Open lyric-ready track';
      if (routeLyricsCopy) routeLyricsCopy.textContent = `“${lyricTrack.title || lyricTrack.id}” is the clearest direct lyric route currently available from this release.`;
    } else {
      routeLyrics.setAttribute('href', '/lyrics/');
      routeLyrics.textContent = 'Open lyrics hub';
      if (routeLyricsCopy) routeLyricsCopy.textContent = 'This release does not have a published lyric page yet, so the lyrics hub remains the best next stop.';
    }
  }

  if (routeVideo) {
    if (videoTrack) {
      routeVideo.setAttribute('href', trackCanonicalPath(albumId, videoTrack.id));
      routeVideo.textContent = 'Open video-ready track';
      if (routeVideoCopy) routeVideoCopy.textContent = `“${videoTrack.title || videoTrack.id}” is the strongest continuation when you want media-ready track detail next.`;
    } else {
      routeVideo.setAttribute('href', links[0]?.url || '/streaming.html');
      if (links[0]?.url) {
        routeVideo.setAttribute('target', '_blank');
        routeVideo.setAttribute('rel', 'noopener noreferrer');
        routeVideo.textContent = 'Open platform';
      } else {
        routeVideo.textContent = 'Open streaming hub';
      }
      if (routeVideoCopy) routeVideoCopy.textContent = 'When no video-ready track exists, the strongest continuation is a platform link or the streaming hub.';
    }
  }

  if (routeSearch) routeSearch.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
}


function renderTracklist(album, albumId) {
  const list = $('album-tracklist');
  if (!list) return;

  clear(list);
  const tracks = normalizeTracks(album);

  if (!tracks.length) {
    list.appendChild(el('div', { class: 'notice' }, [el('p', { text: 'No tracks listed for this album yet.' })]));
    setBusy(false);
    return;
  }

  const frag = document.createDocumentFragment();
  let lyricsCount = 0;
  let videoCount = 0;

  tracks.forEach((t, idx) => {
    const entry = getLyricsEntry(album, t.id);
    const duration = asString(entry?.duration) || asString(t?.duration);
    const hasLyrics = !!asString(entry?.file) || !!asString(entry?.text);
    const hasVideo = !!asString(entry?.video);

    if (hasLyrics) lyricsCount += 1;
    if (hasVideo) videoCount += 1;

    const subParts = [];
    if (duration) subParts.push(duration);
    if (hasLyrics) subParts.push('Lyrics');
    if (!subParts.length) subParts.push('');

    const badgeWrap = el('div', { class: 'track-row__badges', 'aria-label': 'Track info' });
    if (hasLyrics) badgeWrap.appendChild(el('span', { class: 'pill pill--accent', text: 'Lyrics' }));
    if (hasVideo) badgeWrap.appendChild(el('span', { class: 'pill', text: 'Video' }));

    const href = trackCanonicalPath(albumId, t.id);

    const row =
      el('a', {
        class: 'track-row',
        href,
        'aria-label': `${t.title} (open track)`,
        'data-track-title': t.title || `Track ${idx + 1}`,
        'data-has-lyrics': hasLyrics ? '1' : '0',
        'data-has-video': hasVideo ? '1' : '0',
      }, [
        el('div', { class: 'track-row__num', text: String(idx + 1).padStart(2, '0') }),
        el('div', { class: 'track-row__title' }, [
          el('strong', { text: t.title || `Track ${idx + 1}` }),
          el('div', { class: 'track-row__sub', text: subParts.filter(Boolean).join(' • ') }),
        ]),
        badgeWrap,
      ])
    ;

    frag.appendChild(row);
  });

  list.appendChild(frag);

  setBusy(false);

  // Track tools (search + filter) for this album page.
  setupTrackTools(tracks);

  // ------------------------------------------------------------
  // Wave V10-25 — Album quick-facts hydration
  // - Boundaries: purely truth-first numbers derived from the album data.
  // - If the quick-facts surface is missing on a page, do nothing.
  // ------------------------------------------------------------
  const metaTracks = $('album-meta-tracks');
  const metaLyrics = $('album-meta-lyrics');
  const metaVideo = $('album-meta-video');
  if (metaTracks) metaTracks.textContent = String(tracks.length);
  if (metaLyrics) metaLyrics.textContent = String(lyricsCount);
  if (metaVideo) metaVideo.textContent = String(videoCount);

  const statCount = $('album-track-stat-count');
  const statLyrics = $('album-track-stat-lyrics');
  const statVideo = $('album-track-stat-video');
  if (statCount) statCount.textContent = `${tracks.length} tracks`;
  if (statLyrics) statLyrics.textContent = `${lyricsCount} lyric-ready`;
  if (statVideo) statVideo.textContent = `${videoCount} video-ready`;

  wireAlbumSectionTools();
}

function main() {
  setBusy(true);

  const albums = pickAlbums(MusicData);
  const albumId = getAlbumId();
  if (!albumId) {
    renderNotFound('Missing album id.');
    return;
  }

  const album = albums.find((a) => asString(a?.id) === albumId) || albums.find((a) => asString(a?.slug) === albumId) || null;
  if (!album) {
    renderNotFound(`Album not found: ${albumId}`);
    return;
  }

  const title = asString(album.title) || albumId;
  const artist = asString(album.artist) || 'Triad of Angels & ToA Studios';
  const year = asString(album.year);
  const genre = normalizeGenre(album.genre);
  const desc = asString(album.artistInfo) || asString(album.description);

  const coverPath = ensureSitePath(album.cover) || DEFAULT_ART;
  const coverAbs = absolutizeMaybe(coverPath) || '';

  // Ambient background
  const bgImg = $('album-bg-img') || (function(){ const box = $('album-background-image'); return box ? box.querySelector('.album-bg__img') : null; })();
  if (bgImg && coverPath) { bgImg.setAttribute('src', coverPath); bgImg.setAttribute('alt', ''); bgImg.setAttribute('aria-hidden', 'true'); }

  // Hero
  safeText($('album-breadcrumb'), title);
  safeText($('album-artist'), artist);
  safeText($('album-title'), title);
  safeText($('album-year'), year);
  safeText($('album-genre'), genre);
  safeText($('album-description'), desc);

  const coverEl = $('album-cover');
  if (coverEl && coverPath) {
    coverEl.setAttribute('src', coverPath);
    coverEl.setAttribute('alt', `${title} album cover`);
    // Optional responsive variants (manifest-driven; no broken refs if manifest missing)
    applyAlbumCoverVariants(coverEl, coverPath, { sizes: '(max-width: 520px) 70vw, (max-width: 980px) 360px, 420px' });
  }

  const isLegacyTemplate = /\/album\.html$/i.test(window.location.pathname);
  const canonAbs = isLegacyTemplate
    ? `${SITE_ORIGIN}/album.html?album=${encodeURIComponent(albumId)}`
    : albumCanonicalAbs(albumId);

  // Buttons
  const back = $('album-back');
  if (back) back.setAttribute('href', '/music.html');

  wireShare(title, canonAbs);
  renderLinkTabs(album);
  renderTracklist(album, albumId);
  hydrateAlbumSignalsAndTrackMap(album, albumId);
  {
    const tracks = normalizeTracks(album);
    const lyricsTracks = tracks.filter((t) => { const entry = getLyricsEntry(album, t.id); return !!asString(entry?.file) || !!asString(entry?.text); });
    const videoTrack = tracks.find((t) => !!asString(getLyricsEntry(album, t.id)?.video)) || null;
    const links = orderedStreamLinks(album?.links);
    hydrateAlbumCompanion(album, albumId, tracks, lyricsTracks, videoTrack, links);
    hydrateAlbumLadder(album, albumId, tracks, lyricsTracks, videoTrack, links);
  }

  updateHeadForAlbum(album, canonAbs, coverAbs);

  // Make legacy template canonicalized
  const dynCanon = document.getElementById('dynamic-canonical');
  if (dynCanon) dynCanon.setAttribute('href', canonAbs);

  const dynOg = document.getElementById('dynamic-og-url');
  if (dynOg) dynOg.setAttribute('content', canonAbs);

  const dynTw = document.getElementById('dynamic-twitter-url');
  if (dynTw) dynTw.setAttribute('content', canonAbs);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true });
} else {
  main();
}
