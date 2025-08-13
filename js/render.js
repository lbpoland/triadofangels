// js/render.js
// All rendering for: home (featured), music grid, album page, track page.
// Requires data to be present at window.TOA_CATALOG (via data.js + data-bridge.js)
// ---------------------------------------------------------------------

import { $, $$, el, get, slugify, getQuery, fetchFirstText, buildLyricsURL, spotifyAlbumId } from './utils.js';

const CATALOG = () => (window.TOA_CATALOG || []);

/* ---------- Shared card/DOM builders ---------- */

function platformLinks(links = {}) {
  const order = [
    ['spotify','Spotify'],
    ['appleMusic','Apple Music'],
    ['youTubeMusic','YouTube Music'],
    ['amazonMusic','Amazon Music'],
    ['tidal','Tidal'],
    ['deezer','Deezer'],
    ['iHeartRadio','iHeartRadio']
  ];
  const items = order
    .filter(([k]) => links[k])
    .map(([k,label]) => `<a href="${links[k]}" target="_blank" rel="noopener">${label}</a>`)
    .join('');
  return items || '<span class="muted">No links yet</span>';
}

function albumCard(album) {
  const a = el('article', { className:'album-card', attrs:{ 'data-album-id': album.id }});
  a.innerHTML = `
    <a class="cover" href="/album.html?id=${album.id}" aria-label="Open album ${album.title}">
      <img loading="lazy" src="/${album.cover}" alt="${album.title} album cover">
    </a>
    <div class="meta">
      <h3 class="title"><a href="/album.html?id=${album.id}">${album.title}</a></h3>
      <div class="by">${album.artist || 'ToA Studios'} • ${album.year || ''}</div>
      <div class="links">${platformLinks(album.links)}</div>
    </div>
  `;
  return a;
}

function trackRow(n, title, albumId) {
  const trackSlug = slugify(title);
  const url = `/track.html?album=${albumId}&track=${trackSlug}`;
  const tr = el('tr');
  tr.innerHTML = `
    <td class="num">${n}</td>
    <td class="track"><a href="${url}">${title}</a></td>
    <td class="feat"></td>
    <td class="dur"></td>
  `;
  return tr;
}

/* ---------- Page: Music (grid) ---------- */
export function renderMusicPage() {
  const grid = $('#music-grid');
  const selArtist = $('#filter-artist');
  const selGenre  = $('#filter-genre');
  if (!grid || !selArtist || !selGenre) return;

  const data = CATALOG();

  // Build filter options
  const artists = Array.from(new Set(data.map(a => a.artist || 'ToA Studios'))).sort();
  const genres  = Array.from(new Set(data.flatMap(a => (a.genre||'').split(',').map(s=>s.trim())))).sort();

  selArtist.innerHTML = `<option value="">All Artists</option>` + artists.map(v=>`<option>${v}</option>`).join('');
  selGenre.innerHTML  = `<option value="">All Genres</option>`  + genres.map(v=>`<option>${v}</option>`).join('');

  function apply() {
    const fArtist = selArtist.value;
    const fGenre  = selGenre.value;
    const filtered = data.filter(a => {
      const okA = !fArtist || (a.artist||'ToA Studios') === fArtist;
      const okG = !fGenre  || String(a.genre||'').includes(fGenre);
      return okA && okG;
    });

    grid.replaceChildren();
    if (!filtered.length) {
      grid.append(el('div', { className:'empty-callout', html:`<h3>No results</h3><p>Try changing filters.</p>` }));
      return;
    }
    filtered.forEach(alb => grid.append(albumCard(alb)));
  }

  selArtist.addEventListener('change', apply);
  selGenre .addEventListener('change', apply);
  apply();
}

/* ---------- Page: Home (featured) ---------- */
export function renderHomePage() {
  const wrap = $('#featured-grid');
  if (!wrap) return;
  wrap.replaceChildren();
  CATALOG().slice(0, 8).forEach(a => wrap.append(albumCard(a)));
}

/* ---------- Page: Album ---------- */
export function renderAlbumPage() {
  const { id } = getQuery();
  if (!id) return;

  const album = CATALOG().find(a => a.id === id);
  const host  = $('#album-host');
  if (!album || !host) {
    if (host) host.innerHTML = `<div class="empty-callout"><h2>Album not found</h2></div>`;
    return;
  }

  const spotifyId = spotifyAlbumId(get(album, 'links.spotify'));
  const tracks = Array.isArray(album.tracks) ? album.tracks : [];

  host.innerHTML = `
    <div class="album-hero">
      <img class="hero-art" src="/${album.cover}" alt="${album.title} album cover">
      <div class="hero-meta">
        <h1>${album.title}</h1>
        <div class="by">${album.artist || 'ToA Studios'} • ${album.year || ''}</div>
        <div class="genres">${album.genre || ''}</div>
        <div class="platforms">${platformLinks(album.links)}</div>
      </div>
    </div>

    ${spotifyId ? `
    <section class="player section" aria-label="Spotify album player">
      <iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/${spotifyId}" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
    </section>` : ''}

    <section class="section">
      <h2>Tracks</h2>
      <div class="table-wrap">
        <table class="tracklist" role="table" aria-label="Track list for ${album.title}">
          <thead>
            <tr><th>#</th><th>Title</th><th>Feat.</th><th>Duration</th></tr>
          </thead>
          <tbody id="track-rows"></tbody>
        </table>
      </div>
    </section>

    ${album.artistInfo ? `
    <section class="section">
      <h2>About this album</h2>
      <p>${album.artistInfo}</p>
    </section>` : ''}
  `;

  const tbody = $('#track-rows');
  tracks.forEach((t, i) => tbody.append(trackRow(i+1, t, album.id)));
}

/* ---------- Page: Track ---------- */
export async function renderTrackPage() {
  const { album: albumId, track: trackSlug } = getQuery();
  const host = $('#track-host');
  if (!host || !albumId || !trackSlug) return;

  const album = CATALOG().find(a => a.id === albumId);
  if (!album) { host.innerHTML = `<div class="empty-callout"><h2>Track not found</h2></div>`; return; }

  // find original title by slug
  const title = (album.tracks || []).find(t => slugify(t) === trackSlug);
  if (!title) { host.innerHTML = `<div class="empty-callout"><h2>Track not found</h2></div>`; return; }

  // AUTO lyrics path build + fetch with fallback
  const { tried } = buildLyricsURL(album.id, title);
  const res = await fetchFirstText(tried);

  host.innerHTML = `
    <div class="track-hero">
      <img class="hero-art" src="/${album.cover}" alt="${album.title} album cover">
      <div class="hero-meta">
        <h1>${title}</h1>
        <div class="by"><a href="/album.html?id=${album.id}">${album.title}</a> • ${album.artist || 'ToA Studios'}</div>
        <div class="platforms">${platformLinks(album.links)}</div>
      </div>
    </div>

    <section class="section">
      <h2>Lyrics</h2>
      <div id="lyrics" class="lyrics"></div>
    </section>
  `;

  const lyrEl = $('#lyrics');
  if (res.ok) {
    lyrEl.textContent = res.text;
  } else {
    lyrEl.innerHTML = `<p class="muted">Lyrics not available yet. If you have the file, save it as 
      <code>${tried[0].replace('/lyrics/','lyrics/')}</code> or <code>${tried[1].replace('/lyrics/','lyrics/')}</code>.</p>`;
  }
}
