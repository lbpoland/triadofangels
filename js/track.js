// js/track.js — Track detail page controller (ESM)
// - Supports canonical folder routes and legacy query templates.
// - Renders track meta + lyrics/story/BTS/video from js/data.js.
// - Updates head/meta and injects JSON-LD (runtime) for correctness.

import * as MusicData from './data.js';
import { sanitizeTrackId } from './utils.js';
import {
getTrackIds,
  albumCanonicalPath,
  albumCanonicalAbs,
  trackCanonicalAbs,
  trackCanonicalPath,
SITE_ORIGIN,
} from './routes.js';
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


function setTextIfPresent(id, text) {
  const node = $(id);
  if (!node) return;
  node.textContent = text;
}

function paragraphCount(text) {
  const raw = asString(text);
  if (!raw) return 0;
  return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length;
}

function setSectionVisible(sectionId, isVisible) {
  const sec = document.getElementById(sectionId);
  if (!(sec instanceof HTMLElement)) return;
  sec.hidden = !isVisible;
  sec.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
}

function setJumpLinkVisible(key, isVisible) {
  const nodes = Array.from(document.querySelectorAll(`[data-track-jump="${key}"]`));
  nodes.forEach((a) => {
    const li = a && a.closest ? a.closest('li') : null;
    const host = li || a;
    if (host instanceof HTMLElement) host.hidden = !isVisible;
  });
}

function setLyricsLoadedState(ok) {
  const wrap = $('lyrics-wrap');
  if (!wrap) return;
  wrap.setAttribute('aria-busy', 'false');
  wrap.dataset.loading = 'false';
  if (!ok) {
    wrap.dataset.error = 'true';
  } else {
    delete wrap.dataset.error;
  }
}

function getLyricsTextForCopy() {
  const wrap = $('lyrics-wrap');
  if (!wrap) return '';
  const pre = wrap.querySelector('pre');
  const t = pre ? pre.textContent : wrap.textContent;
  return (t || '').trim();
}

function wireCopyLyrics() {
  const btn = document.querySelector('[data-tracktool="copy-lyrics"]');
  if (!(btn instanceof HTMLButtonElement)) return;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const text = getLyricsTextForCopy();
    if (!text) {
      btn.textContent = 'No lyrics';
      window.setTimeout(() => { btn.textContent = 'Copy lyrics'; }, 1300);
      return;
    }

    try {
      const ok = window.__toaCopyText ? await window.__toaCopyText(text) : false;
      if (ok) {
        btn.textContent = 'Copied!';
        window.setTimeout(() => { btn.textContent = 'Copy lyrics'; }, 1400);
        return;
      }
    } catch {}

    // Fallback (local)
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied!';
      window.setTimeout(() => { btn.textContent = 'Copy lyrics'; }, 1400);
    } catch {
      btn.textContent = 'Copy failed';
      window.setTimeout(() => { btn.textContent = 'Copy lyrics'; }, 1600);
    }
  });
}

function hideIfEmpty(elm) {
  if (!elm) return;
  const t = (elm.textContent || '').trim();
  elm.hidden = !t;
}

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
  const key = Object.keys(lyrics).find((k) => sanitizeTrackId(k) === trackId);
  return key ? lyrics[key] : null;
}

function orderedLinks(links) {
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
  const list = $('more-tracks');
  if (list) {
    list.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    list.dataset.loading = isBusy ? 'true' : 'false';
  }
}

function renderNotFound(message) {
  setBusy(false);
  setSectionVisible('story', false);
  setSectionVisible('bts', false);
  setSectionVisible('video', false);
  setJumpLinkVisible('story', false);
  setJumpLinkVisible('bts', false);
  setJumpLinkVisible('video', false);
  safeText($('track-title'), 'Track not found');
  safeText($('track-artist'), '');
  safeText($('track-album'), '');
  safeText($('track-description'), message || 'This track could not be located.');

  const lyricsWrap = $('lyrics-wrap');
  if (lyricsWrap) {
    clear(lyricsWrap);
    lyricsWrap.appendChild(el('div', { class: 'notice' }, [el('p', { text: message || 'Track not found.' })]));
  }
}

function parseDurationToIso(duration) {
  // Accept "3:24" or "03:24" or "1:02:03".
  const d = asString(duration);
  if (!d) return '';
  const parts = d.split(':').map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n))) return '';
  if (parts.length === 2) {
    const [m, s] = parts;
    return `PT${m}M${s}S`;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return `PT${h}H${m}M${s}S`;
  }
  return '';
}

function updateHead(album, trackTitle, canonAbs, coverAbs, descText, duration) {
  const albumTitle = asString(album?.title) || 'Album';
  const title = `${trackTitle || 'Track'} — ${albumTitle} | Triad of Angels & ToA Studios`;
  const desc = clampDescription(descText || `Official track page for ${trackTitle || 'this track'} from ${albumTitle}.`);

  setTitle(title);
  setCanonical(canonAbs);

  setMetaName('description', desc);
  setMetaProperty('og:type', 'music.song');
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
    '@type': 'MusicRecording',
    name: trackTitle || '',
    url: canonAbs,
    inAlbum: {
      '@type': 'MusicAlbum',
      name: albumTitle,
      url: albumCanonicalAbs(asString(album?.id) || ''),
    },
    byArtist: {
      '@type': 'MusicGroup',
      name: asString(album?.artist) || 'Triad of Angels & ToA Studios',
    },
    image: coverAbs || undefined,
  };

  const iso = parseDurationToIso(duration);
  if (iso) ld.duration = iso;

  injectJsonLd(ld);
}

function wireCopyLink(btn, url) {
  if (!btn) return;
  enableCopyButton(btn);
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const original = btn.textContent || 'Copy link';
    try {
      const ok = window.__toaCopyText ? await window.__toaCopyText(url) : false;
      if (!ok) throw new Error('copy unavailable');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1400);
    } catch {
      btn.textContent = 'Copy failed';
      setTimeout(() => { btn.textContent = original; }, 1600);
    }
  });
}

function wireShareLinks(canonAbs, trackTitle) {
  const encUrl = encodeURIComponent(canonAbs);
  const encText = encodeURIComponent(`${trackTitle} — Triad of Angels & ToA Studios`);

  const x = $('share-x');
  const fb = $('share-facebook');
  const li = $('share-linkedin');
  const em = $('share-email');

  applyShareHref(x, `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`);
  applyShareHref(fb, `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`);
  applyShareHref(li, `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`);
  applyShareHref(em, `mailto:?subject=${encText}&body=${encUrl}`);
}


function renderLinkTabs(albumLinks, trackLinks) {
  const wrap = $('track-links');
  if (!wrap) return;
  clear(wrap);

  // Prefer track-level links; if empty, fall back to album links.
  const links = orderedLinks(trackLinks).length ? orderedLinks(trackLinks) : orderedLinks(albumLinks);

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
      }, [el('span', { text: l.label })])
    );
  });

  // Mobile/tablet: tidy dropdown selector (CSS hides on desktop).
}

function renderTextBlock(hostId, content) {
  const host = $(hostId);
  if (!host) return;

  const text = asString(content);
  if (!text) {
    host.hidden = true;
    return;
  }

  host.hidden = false;
  clear(host);

  // Split into paragraphs, preserve blank lines.
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) {
    host.appendChild(el('p', { text }));
    return;
  }

  paras.forEach((p) => {
    host.appendChild(el('p', { text: p }));
  });
}

async function renderLyrics(lyricsFilePath) {
  const wrap = $('lyrics-wrap');
  if (!wrap) return;

  const file = ensureSitePath(lyricsFilePath);
  wrap.setAttribute('aria-busy', 'true');
  wrap.dataset.loading = 'true';
  clear(wrap);

  if (!file) {
    wrap.appendChild(el('p', { class: 'lyrics-box__empty', text: 'Lyrics will appear here once they are published.' }));
    setLyricsLoadedState(false);
    return;
  }

  try {
    const res = await fetch(file, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const pre = el('pre', { class: 'lyrics-pre' });
    pre.textContent = text.replace(/\r\n/g, '\n');

    // Wrap to allow scrolling and selection.
    wrap.appendChild(pre);
    setLyricsLoadedState(true);
  } catch {
    wrap.appendChild(el('p', { class: 'lyrics-box__empty', text: 'Lyrics are unavailable right now.' }));
    setLyricsLoadedState(false);
  }
}

function youtubeIdFromUrl(url) {
  const u = asString(url);
  if (!u) return '';
  try {
    const parsed = new URL(u);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '');
      return id || '';
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/embed/')[1]?.split(/[?#]/)[0] || '';
      const v = parsed.searchParams.get('v');
      if (v) return v;
    }
    return '';
  } catch {
    return '';
  }
}

function renderVideo(videoUrl) {
  const wrap = $('yt-player') || $('video-wrap');
  if (!wrap) return false;

  const url = asString(videoUrl);
  if (!url) {
    clear(wrap);
    return false;
  }

  clear(wrap);

  const yt = youtubeIdFromUrl(url);
  if (yt) {
    const iframe = el('iframe', {
      title: 'Video',
      width: '560',
      height: '315',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowfullscreen: 'true',
      loading: 'lazy',
      referrerpolicy: 'strict-origin-when-cross-origin',
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}`,
    });
    wrap.appendChild(iframe);
    return true;
  }

  // As a last resort, provide an outbound link
  wrap.appendChild(
    el('a', {
      class: 'btn',
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'Watch video (opens in a new tab)',
    }, ['Watch video'])
  );
  return true;
}



function hydrateTrackContextAndFollow(album, albumId, track, trackIndex, tracks) {
  const title = asString(track?.title) || asString(track?.id) || 'This track';
  const albumTitle = asString(album?.title) || albumId;
  const entry = getLyricsEntry(album, track?.id);
  const hasLyrics = !!asString(entry?.file) || !!asString(entry?.text);
  const hasStory = !!asString(entry?.story);
  const hasBts = !!asString(entry?.behindTheScenes);
  const hasVideo = !!asString(entry?.video);
  const lyricAlt = tracks.find((t) => t.id !== track?.id && (() => { const e = getLyricsEntry(album, t.id); return !!asString(e?.file) || !!asString(e?.text); })()) || null;

  setTextIfPresent('track-context-stat', `${albumTitle} • ${trackIndex >= 0 ? `Track ${String(trackIndex + 1).padStart(2, '0')}` : 'Track detail'} • ${hasLyrics ? 'Lyrics ready' : 'Context-first'}`);
  setTextIfPresent('track-context-album-title', `This song belongs to ${albumTitle}`);
  setTextIfPresent('track-context-album-copy', 'Album pages keep the full release context in view, so stepping back from a single track still feels connected.');
  setTextIfPresent('track-context-album-meta', 'Use the album page for track order, release context, and the wider view of the record.');

  const contentBits = [hasLyrics && 'Lyrics', hasStory && 'Story', hasBts && 'BTS', hasVideo && 'Video'].filter(Boolean);
  setTextIfPresent('track-context-content-title', contentBits.length ? `${contentBits.join(' • ')} are live on this track` : 'This track currently works as a lighter detail page');
  setTextIfPresent('track-context-content-copy', contentBits.length ? 'The content above shows why this track is worth opening directly instead of only as an item inside the album page.' : 'When the current song is lighter, the strongest value stays in the album context and the wider music library around it.');
  setTextIfPresent('track-context-content-meta', contentBits.length ? 'The page keeps the next strongest move clear and visible.' : 'The page stays clean and honest when deeper content is not published yet.');

  setTextIfPresent('track-context-stream-title', hasVideo ? 'Media is available, so the next surface can stay media-led' : 'Verified platform routing stays available after the detail page');
  setTextIfPresent('track-context-stream-copy', hasVideo ? 'Watch the on-page video first, then use the listening links when you are ready to leave the site.' : 'When you are done with the on-page detail, the streaming hub remains the best next stop.');
  setTextIfPresent('track-context-stream-meta', hasVideo ? 'Video keeps the next move on-site for longer.' : 'Streaming is the next listening step, not a replacement for the detail page.');

  setTextIfPresent('track-context-library-title', 'The wider music library remains part of the same chain');
  setTextIfPresent('track-context-library-copy', 'Home, About, Music, Album, and Track are meant to feel like one connected system, so leaving this song never feels abrupt.');
  setTextIfPresent('track-context-library-meta', 'Use Music when you want broader browse control, not just one-song depth.');

  setTextIfPresent('track-follow-stat', `${title} • ${lyricAlt ? 'related lyric page available' : 'album route available'}`);

  let primaryHref = '#lyrics';
  let primaryTitle = 'Start with the lyrics for the clearest first read on this track';
  let primaryCopy = 'The strongest next step stays visible lower on the page, so you never lose your place.';
  if (hasStory) {
    primaryHref = '#story';
    primaryTitle = 'Start with the story notes when you want the richest explanation first';
    primaryCopy = 'Story takes priority here because it adds the richest interpretive layer beyond the lyric sheet.';
  } else if (hasVideo) {
    primaryHref = '#video';
    primaryTitle = 'Start with the video surface when the next move is media-led';
    primaryCopy = 'Video becomes the best route when the current track exposes media but not a deeper story layer.';
  } else if (!hasLyrics) {
    primaryHref = albumCanonicalPath(albumId);
    primaryTitle = `Return to ${albumTitle} when release-level context is the stronger next move`;
    primaryCopy = 'When a track is lighter, the album page remains the best continuation because it retains the wider release structure.';
  }
  setTextIfPresent('track-follow-primary', primaryTitle);
  setTextIfPresent('track-follow-primary-copy', primaryCopy);
  const primaryLink = $('track-follow-primary-link');
  if (primaryLink) primaryLink.setAttribute('href', primaryHref);

  setTextIfPresent('track-follow-related-title', lyricAlt ? `Open “${asString(lyricAlt.title) || lyricAlt.id}” as a related lyric-ready follow-up` : 'Use the More tracks section when you want the nearest related continuation');
  setTextIfPresent('track-follow-related-copy', lyricAlt ? 'This keeps the current song connected to another detail page without forcing every move back through the top of the album.' : 'When no stronger sibling page exists, the related track list remains the best browse layer.');
  const relatedLink = $('track-follow-related');
  if (relatedLink) relatedLink.setAttribute('href', lyricAlt ? trackCanonicalPath(albumId, lyricAlt.id) : '#more');

  setTextIfPresent('track-follow-album-title', `Use ${albumTitle} when you want release context again`);
  setTextIfPresent('track-follow-album-copy', 'Album detail now acts as a stronger middle layer between broad library browsing and single-track depth.');
  const albumLink = $('track-follow-album');
  if (albumLink) albumLink.setAttribute('href', albumCanonicalPath(albumId));
  const searchLink = $('track-follow-search');
  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);

  setTextIfPresent('track-proof-stat', `${title} • ${contentBits.length ? contentBits.join(' • ') : 'track detail'} • ${lyricAlt ? 'related song available' : 'album route available'}`);
  setTextIfPresent('track-proof-context-title', `${title} holds up as a focused song page`);
  setTextIfPresent('track-proof-context-copy', contentBits.length ? `This track page keeps ${contentBits.join(', ')} in view without losing the album context.` : 'When the track page is lighter, it points visitors back toward the stronger album context.');
  setTextIfPresent('track-proof-sibling-title', lyricAlt ? `Open “${asString(lyricAlt.title) || lyricAlt.id}” as the strongest related song from this page` : 'Use the related tracks list when this page has no stronger song-to-song jump');
  setTextIfPresent('track-proof-sibling-copy', lyricAlt ? 'Keep a strong related song in reach without having to hunt through the lower list.' : 'When no stronger sibling exists, the related list remains the right next browse layer.');
  const proofSiblingLink = $('track-proof-sibling-link');
  if (proofSiblingLink) proofSiblingLink.setAttribute('href', lyricAlt ? trackCanonicalPath(albumId, lyricAlt.id) : '#more');
  const proofOutwardLink = $('track-proof-outward-link');
  if (proofOutwardLink) proofOutwardLink.setAttribute('href', hasVideo ? '#video' : '/streaming.html');
  setTextIfPresent('track-proof-outward-copy', hasVideo ? 'Because media exists on this track, the next outward move can stay on-site first through the video section before streaming.' : 'Once the on-page detail is complete, streaming remains the clean verified next step.');
}


function hydrateTrackCompanion(album, albumId, track, trackIndex, tracks) {
  const title = asString(track?.title) || asString(track?.id) || 'This track';
  const prevTrack = trackIndex > 0 ? tracks[trackIndex - 1] : null;
  const nextTrack = trackIndex >= 0 && trackIndex < tracks.length - 1 ? tracks[trackIndex + 1] : null;
  const links = album?.links && typeof album.links === 'object' ? album.links : {};
  const streamHref = asString(links.spotify) || asString(links.appleMusic) || asString(links.youTubeMusic) || '/streaming.html';
  const entry = getLyricsEntry(album, track?.id);
  const hasVideo = !!asString(entry?.video);

  setTextIfPresent('track-companion-stat', `${title} • ${tracks.length} track${tracks.length === 1 ? '' : 's'} on the release • ${prevTrack || nextTrack ? 'sibling routes available' : 'album route available'}`);

  setTextIfPresent('track-companion-prev-title', prevTrack ? `Open “${asString(prevTrack.title) || asString(prevTrack.id)}” as the clearest previous or companion route` : 'Use the album page when there is no stronger earlier sibling route');
  setTextIfPresent('track-companion-prev-copy', prevTrack ? 'Keep a previous or alternate sibling visible without scrolling back up the page.' : 'When there is no stronger previous sibling, the album page remains the clearest broader context.');
  const prevLink = $('track-companion-prev-link');
  if (prevLink) prevLink.setAttribute('href', prevTrack ? trackCanonicalPath(albumId, asString(prevTrack.id)) : albumCanonicalPath(albumId));

  setTextIfPresent('track-companion-next-title', nextTrack ? `Open “${asString(nextTrack.title) || asString(nextTrack.id)}” as the next companion route` : 'Use search or the album page when a second sibling route is not stronger');
  setTextIfPresent('track-companion-next-copy', nextTrack ? 'A second companion route gives the lower page another clear continuation instead of forcing every move back through one album or library jump.' : 'When the current song sits at the edge of the release, the alternate companion route stays broader instead of forcing a weak hand-off.');
  const nextLink = $('track-companion-next-link');
  if (nextLink) nextLink.setAttribute('href', nextTrack ? trackCanonicalPath(albumId, asString(nextTrack.id)) : '/search/?q=' + encodeURIComponent(title));

  setTextIfPresent('track-companion-outward-copy', hasVideo
    ? 'Album context and listening links stay readable together, but media can remain the stronger on-site move before the final platform step.'
    : 'Album context and listening links stay readable together, so the page can hand off outward without hiding the release context behind it.');
  const albumLink = $('track-companion-album-link');
  if (albumLink) albumLink.setAttribute('href', albumCanonicalPath(albumId));
  const streamLink = $('track-companion-stream-link');
  if (streamLink) {
    streamLink.setAttribute('href', streamHref);
    if (/^https?:/i.test(streamHref)) {
      streamLink.setAttribute('target', '_blank');
      streamLink.setAttribute('rel', 'noopener noreferrer');
      streamLink.textContent = 'Verified platform';
    }
  }
}



function hydrateTrackLadder(album, albumId, track, trackIndex, tracks) {
  const title = asString(track?.title) || asString(track?.id) || 'This track';
  const prevTrack = trackIndex > 0 ? tracks[trackIndex - 1] : null;
  const nextTrack = trackIndex >= 0 && trackIndex < tracks.length - 1 ? tracks[trackIndex + 1] : null;
  const entry = getLyricsEntry(album, track?.id);
  const hasVideo = !!asString(entry?.video);
  const links = album?.links && typeof album.links === 'object' ? album.links : {};
  const streamHref = asString(links.spotify) || asString(links.appleMusic) || asString(links.youTubeMusic) || '/streaming.html';

  setTextIfPresent('track-ladder-stat', `${title} • ${tracks.length} track${tracks.length === 1 ? '' : 's'} in release • ${prevTrack || nextTrack ? 'same-release continuation ready' : 'album return ready'}`);
  setTextIfPresent('track-ladder-start-title', prevTrack ? `Keep moving with “${asString(prevTrack.title) || asString(prevTrack.id)}” as the closest same-release continuation` : (nextTrack ? `Keep moving with “${asString(nextTrack.title) || asString(nextTrack.id)}” as the clearest next continuation` : 'Use the album page when the current track does not have a stronger same-release continuation'));
  setTextIfPresent('track-ladder-start-copy', prevTrack || nextTrack ? 'The ladder keeps the clearest continuation visible at the lower end of the page so the current song never feels like a dead end.' : 'When no stronger same-release rung exists, the album remains the better wider layer rather than forcing another sibling route.');
  const startLink = $('track-ladder-start-link');
  if (startLink) startLink.setAttribute('href', prevTrack ? trackCanonicalPath(albumId, asString(prevTrack.id)) : (nextTrack ? trackCanonicalPath(albumId, asString(nextTrack.id)) : albumCanonicalPath(albumId)));

  setTextIfPresent('track-ladder-middle-title', `Return to ${asString(album?.title) || 'the album'} when the wider release context is the better next rung`);
  setTextIfPresent('track-ladder-middle-copy', 'Album detail remains the best broader continuation when the visitor needs track order, release identity, or a stronger same-release map than the single-song surface alone can provide.');
  const middleLink = $('track-ladder-middle-link');
  if (middleLink) middleLink.setAttribute('href', albumCanonicalPath(albumId));

  setTextIfPresent('track-ladder-outward-copy', hasVideo
    ? 'Because this track has media, the outward ladder can stay on-site first through the video route before search or listening links becomes the final move.'
    : 'Search and listening links stay visible as final moves, but they do not replace the same-release and album context that belong earlier in the ladder.');
  const videoLink = $('track-ladder-video-link');
  if (videoLink) videoLink.setAttribute('href', hasVideo ? '#video' : '/videos.html');
  const searchLink = $('track-ladder-search-link');
  if (searchLink) searchLink.setAttribute('href', `/search/?q=${encodeURIComponent(title)}`);
  const streamLink = $('track-ladder-stream-link');
  if (streamLink) {
    streamLink.setAttribute('href', streamHref);
    if (/^https?:/i.test(streamHref)) {
      streamLink.setAttribute('target', '_blank');
      streamLink.setAttribute('rel', 'noopener noreferrer');
      streamLink.textContent = 'Verified platform';
    }
  }
}

function hydrateTrackSnapshot({ albumId, albumTitle, trackTitle, trackIndex, duration, hasLyrics, hasStory, hasBts, hasVideo }) {
  const position = $('track-snapshot-position');
  const content = $('track-snapshot-content');
  const album = $('track-snapshot-album');
  const next = $('track-snapshot-next');
  const nextNote = $('track-snapshot-next-note');
  const primary = $('track-snapshot-primary');
  const search = $('track-snapshot-search');
  const routeAlbumTitle = $('track-route-album-title');
  const routeAlbumCopy = $('track-route-album-copy');
  const routeAlbum = $('track-route-album');
  const routeSearchTitle = $('track-route-search-title');
  const routeSearchCopy = $('track-route-search-copy');
  const routeSearch = $('track-route-search');
  const routeStreamingTitle = $('track-route-streaming-title');
  const routeStreamingCopy = $('track-route-streaming-copy');
  const routeStreaming = $('track-route-streaming');
  const routeLibraryTitle = $('track-route-library-title');
  const routeLibraryCopy = $('track-route-library-copy');

  const bits = [];
  if (hasLyrics) bits.push('Lyrics');
  if (hasStory) bits.push('Story');
  if (hasBts) bits.push('BTS');
  if (hasVideo) bits.push('Video');

  if (position) {
    const posBits = [];
    if (trackIndex >= 0) posBits.push(`Track ${String(trackIndex + 1).padStart(2, '0')}`);
    if (asString(duration)) posBits.push(asString(duration));
    position.textContent = posBits.length ? posBits.join(' • ') : 'Position unavailable';
  }
  if (content) content.textContent = bits.length ? bits.join(' • ') : 'Album context only';
  if (album) album.textContent = albumTitle ? `Album • ${albumTitle}` : 'Album context';

  let bestHref = '#lyrics';
  let bestText = 'Start with the lyrics section for the clearest first read on this track.';
  let bestNoteText = 'The starting route adapts to the content currently available on this track page.';
  if (hasStory) {
    bestHref = '#story';
    bestText = 'Start with the story notes when you want the strongest explanation layer before moving outward.';
    bestNoteText = 'Story notes take priority when they exist because they add the richest context beyond the lyric sheet.';
  } else if (hasVideo) {
    bestHref = '#video';
    bestText = 'Start with the video section when the next move is media-led rather than text-led.';
    bestNoteText = 'Video becomes the best route when the current track exposes media but not deeper story notes.';
  } else if (!hasLyrics) {
    bestHref = albumCanonicalPath(albumId);
    bestText = 'Return to the album page when the strongest continuation is release-level context rather than a lyric surface.';
    bestNoteText = 'When a track lacks deeper content, the album page remains the best next step.';
  }

  if (next) next.textContent = bestText;
  if (nextNote) nextNote.textContent = bestNoteText;
  if (primary) primary.setAttribute('href', bestHref);
  if (search) search.setAttribute('href', `/search/?q=${encodeURIComponent(trackTitle)}`);

  if (routeAlbumTitle) routeAlbumTitle.textContent = `Return to ${albumTitle || 'the album'} for the wider release context`;
  if (routeAlbumCopy) routeAlbumCopy.textContent = 'Album pages carry the wider release context, which makes them the strongest next step after a single track.';
  if (routeAlbum) routeAlbum.setAttribute('href', albumCanonicalPath(albumId));
  if (routeSearchTitle) routeSearchTitle.textContent = `Search “${trackTitle}” across the site`;
  if (routeSearchCopy) routeSearchCopy.textContent = 'Use search when you want the fastest route into related pages, lyrics, or connected surfaces beyond this track.';
  if (routeSearch) routeSearch.setAttribute('href', `/search/?q=${encodeURIComponent(trackTitle)}`);
  if (routeStreamingTitle) routeStreamingTitle.textContent = 'Use platform links after the detail page';
  if (routeStreamingCopy) routeStreamingCopy.textContent = hasVideo ? 'After using the media surface here, the streaming hub remains the safest platform route.' : 'When you are ready to leave the detail page, the streaming hub remains the clearest listening route.';
  if (routeStreaming) routeStreaming.setAttribute('href', '/streaming.html');
  if (routeLibraryTitle) routeLibraryTitle.textContent = 'Return to the music hub for wider browse control';
  if (routeLibraryCopy) routeLibraryCopy.textContent = 'The main music page now better explains the path back into album and track detail, so the return to the broader library feels cleaner.';
}


function renderMoreTracks(album, albumId, currentTrackId) {
  const list = $('more-tracks');
  if (!list) return;

  clear(list);

  const tracks = normalizeTracks(album);
  const others = tracks.filter((t) => t.id && t.id !== currentTrackId);

  if (!others.length) {
    list.appendChild(el('p', { text: 'No other tracks listed yet.' }));
    setBusy(false);
    return 0;
  }

  const max = 10;
  others.slice(0, max).forEach((t) => {
    const entry = getLyricsEntry(album, t.id);
    const duration = asString(entry?.duration) || asString(t?.duration);
    const hasLyrics = !!asString(entry?.file) || !!asString(entry?.text);

    list.appendChild(
      el('a', { class: 'more-track', href: trackCanonicalPath(albumId, t.id) }, [
        el('div', { class: 'more-track__meta' }, [
          el('strong', { text: t.title || t.id }),
          el('div', { class: 'more-track__sub', text: [duration, hasLyrics ? 'Lyrics' : ''].filter(Boolean).join(' • ') }),
        ]),
        el('span', { class: `pill${hasLyrics ? ' pill--accent' : ''}`, text: hasLyrics ? 'Lyrics' : 'Open' }),
      ])
    );
  });

  setBusy(false);
  return Math.min(others.length, max);
}

async function main() {
  setBusy(true);

  const { albumId, trackId } = getTrackIds();
  if (!albumId || !trackId) {
    renderNotFound('Missing album or track id.');
    return;
  }

  const albums = pickAlbums(MusicData);
  const album = albums.find((a) => asString(a?.id) === albumId) || albums.find((a) => asString(a?.slug) === albumId) || null;
  if (!album) {
    renderNotFound(`Album not found: ${albumId}`);
    return;
  }

  const tracks = normalizeTracks(album);
  const current = tracks.find((t) => t.id === trackId) || null;
  const trackIndex = tracks.findIndex((t) => t.id === trackId);
  const trackNumLabel = trackIndex >= 0 ? ('Track ' + String(trackIndex + 1).padStart(2, '0')) : 'Track';
  const trackTitle = asString(current?.title) || trackId;

  const entry = getLyricsEntry(album, trackId);
  const duration = asString(entry?.duration) || asString(current?.duration);
  const story = asString(entry?.story);
  const bts = asString(entry?.behindTheScenes);
  const video = entry?.video;
  const hasLyrics = Boolean(asString(entry?.file) || asString(entry?.text));

  const coverPath = ensureSitePath(album?.cover) || DEFAULT_ART;
  const coverAbs = absolutizeMaybe(coverPath) || '';

  const isLegacyTemplate = /\/track\.html$/i.test(window.location.pathname);
  const canonAbs = isLegacyTemplate
    ? `${SITE_ORIGIN}/track.html?album=${encodeURIComponent(albumId)}&track=${encodeURIComponent(trackId)}`
    : trackCanonicalAbs(albumId, trackId);

  // Background (CSP-friendly: no inline style attributes)
  const bgImg = $('track-bg-img');
  if (bgImg && coverPath) {
    bgImg.setAttribute('src', coverPath);
    bgImg.setAttribute('alt', '');
    bgImg.setAttribute('decoding', 'async');
    bgImg.setAttribute('loading', 'eager');
  }

  // Breadcrumb + hero
  const albumTitle = asString(album?.title) || albumId;
  safeText($('track-album'), albumTitle);
  safeText($('track-title'), trackTitle);
  safeText($('track-artist'), asString(album?.artist) || 'Triad of Angels & ToA Studios');

  // Breadcrumb polishing (premium clarity)
  safeText($('track-breadcrumb'), trackTitle);
  try {
    const al = $('track-album-link');
    if (al) al.textContent = albumTitle;
  } catch {}

  const coverEl = $('track-cover');
  if (coverEl && coverPath) {
    coverEl.setAttribute('src', coverPath);
    coverEl.setAttribute('alt', `${trackTitle} cover art`);
  }

  try {
    // Optional responsive variants (no-op if manifest missing)
    void applyAlbumCoverVariants(coverEl, coverPath, { sizes: '(max-width: 520px) 82vw, (max-width: 980px) 46vw, 320px' });
  } catch {}

  // Pills (match track.html ids)
  const pillAlbum = $('track-album');
  if (pillAlbum) safeText(pillAlbum, albumTitle);

  const pillNum = $('track-number');
  if (pillNum) {
    const showNum = trackIndex >= 0;
    safeText(pillNum, showNum ? trackNumLabel : '');
    pillNum.hidden = !showNum;
  }

  const pillDur = $('track-duration');
  if (pillDur) {
    safeText(pillDur, duration);
    pillDur.hidden = !asString(duration);
  }

  // ------------------------------------------------------------
  // Wave V10-25 — Track quick-facts hydration
  // - Truth-first summary slots shown under the hero actions.
  // - If the surface is missing on a page, do nothing.
  // ------------------------------------------------------------
  const metaAlbum = $('track-meta-album');
  if (metaAlbum) metaAlbum.textContent = albumTitle;

  const metaPos = $('track-meta-position');
  if (metaPos) {
    const parts = [];
    if (trackIndex >= 0) parts.push(`#${String(trackIndex + 1).padStart(2, '0')}`);
    if (asString(duration)) parts.push(asString(duration));
    metaPos.textContent = parts.length ? parts.join(' • ') : '—';
  }

  const metaContent = $('track-meta-content');
  if (metaContent) {
    const bits = [];
    if (hasLyrics) bits.push('Lyrics');
    if (asString(story)) bits.push('Story');
    if (asString(bts)) bits.push('BTS');
    if (asString(video)) bits.push('Video');
    metaContent.textContent = bits.length ? bits.join(' • ') : '—';
  }

  setTextIfPresent('track-lyrics-stat', hasLyrics ? 'Lyrics ready' : 'Lyrics coming later');
  setTextIfPresent('track-story-stat', asString(story) ? `${paragraphCount(story)} story note${paragraphCount(story) === 1 ? '' : 's'}` : 'Story not added yet');
  setTextIfPresent('track-bts-stat', asString(bts) ? `${paragraphCount(bts)} BTS note${paragraphCount(bts) === 1 ? '' : 's'}` : 'BTS not added yet');
  setTextIfPresent('track-video-stat', asString(video) ? 'Video available' : 'Video unavailable');

  // Description
  const description = asString(entry?.description) || '';
  const descText = description || (story ? story.split(/\n\s*\n/)[0].trim() : '') || `From the album ${albumTitle}.`;
  safeText($('track-description'), descText);

  // Breadcrumb album link
  const albumLink = $('track-album-link');
  if (albumLink) albumLink.setAttribute('href', albumCanonicalPath(albumId));

  Array.from(document.querySelectorAll('[data-track-album-link]')).forEach((node) => {
    if (node instanceof HTMLAnchorElement) node.setAttribute('href', albumCanonicalPath(albumId));
  });

  const nextAlbum = $('track-next-album');
  if (nextAlbum) nextAlbum.setAttribute('href', albumCanonicalPath(albumId));

  hydrateTrackSnapshot({
    albumId,
    albumTitle,
    trackTitle,
    trackIndex,
    duration,
    hasLyrics,
    hasStory: Boolean(asString(story)),
    hasBts: Boolean(asString(bts)),
    hasVideo: Boolean(asString(video)),
  });
  hydrateTrackContextAndFollow(album, albumId, current, trackIndex, tracks);
  hydrateTrackCompanion(album, albumId, current, trackIndex, tracks);
  hydrateTrackLadder(album, albumId, current, trackIndex, tracks);

  const back = $('track-back');
  if (back) back.setAttribute('href', '/music.html');

  // Link tabs
  renderLinkTabs(album?.links, entry?.links);

  // Share
  wireShareLinks(canonAbs, trackTitle);
  wireCopyLink($('copy-link'), canonAbs);

  // Content sections
  await renderLyrics(entry?.file);

  const hasStory = Boolean(asString(story));
  const hasBts = Boolean(asString(bts));
  const hasVideo = Boolean(asString(video));

  setSectionVisible('story', hasStory);
  setSectionVisible('bts', hasBts);
  setSectionVisible('video', hasVideo);

  setJumpLinkVisible('story', hasStory);
  setJumpLinkVisible('bts', hasBts);
  setJumpLinkVisible('video', hasVideo);

  if (hasStory) renderTextBlock('story-wrap', story);
  if (hasBts) renderTextBlock('bts-wrap', bts);

  if (hasVideo) {
    const rendered = renderVideo(video);
    if (!rendered) {
      setSectionVisible('video', false);
      setJumpLinkVisible('video', false);
    }
  }

  wireCopyLyrics();

  const relatedCount = renderMoreTracks(album, albumId, trackId);
  setTextIfPresent('track-more-stat', relatedCount ? `${relatedCount} related track${relatedCount === 1 ? '' : 's'}` : 'No related tracks yet');

  // Head/meta
  updateHead(album, trackTitle, canonAbs, coverAbs, descText, duration);

  const dynCanon = document.getElementById('dynamic-canonical');
  if (dynCanon) dynCanon.setAttribute('href', canonAbs);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });
} else {
  // eslint-disable-next-line no-void
  void main();
}
