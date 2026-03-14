(async function () {
  'use strict';

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const count = (selector) => document.querySelectorAll(selector).length;

  const toLeadingSlash = (value) => {
    const s = String(value || '').trim();
    if (!s) return '';
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) return s;
    return `/${s.replace(/^\.?\/?/, '')}`;
  };

  const extractYear = (album) => {
    const text = String(album?.year || '').trim();
    const match = text.match(/(19|20)\d{2}/);
    return match ? match[0] : text;
  };

  const renderHomeAlbums = async () => {
    const track = document.getElementById('toa-albums');
    if (!track) return 0;

    try {
      const { albums, parseApproxDate } = await import('/js/data.js');
      const ordered = [...albums]
        .map((album, index) => ({ album, index }))
        .sort((a, b) => {
          const dateDelta = Number(parseApproxDate(b.album) || 0) - Number(parseApproxDate(a.album) || 0);
          if (dateDelta) return dateDelta;
          return b.index - a.index;
        })
        .map(({ album }) => album);

      const frag = document.createDocumentFragment();
      for (const album of ordered) {
        const article = document.createElement('article');
        article.className = 'album-block';

        const link = document.createElement('a');
        link.className = 'album-link';
        link.href = `/music/albums/${album.id}/`;
        link.setAttribute('aria-label', `${album.title} by ${album.artist}`);

        const img = document.createElement('img');
        img.src = toLeadingSlash(album.cover);
        img.alt = `${album.title} album cover`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 1080;
        img.height = 1080;
        link.appendChild(img);

        const title = document.createElement('h3');
        title.className = 'album-block__title';
        title.textContent = album.title;

        const meta = document.createElement('p');
        meta.textContent = `${album.genre} — ${album.artist}`;

        const year = document.createElement('p');
        const y = extractYear(album);
        year.textContent = y ? `Release Year ${y}` : 'Release Year TBA';

        article.append(link, title, meta, year);
        frag.appendChild(article);
      }

      track.replaceChildren(frag);
      try { window.dispatchEvent(new Event('resize')); } catch {}
      return ordered.length;
    } catch (error) {
      console.warn('Home albums rail render skipped:', error);
      return count('.featured-albums-carousel .album-block');
    }
  };

  const live = count('#home-live-carousel .deck-card');
  const pillars = count('#pillars .pillar-card');
  const videos = count('#videos .index-video-item');
  const profiles = count('.connect-tiles__grid .connect-tile');
  const nextRoutes = count('#home-next .support-card');
  const continuityCards = count('#home-continuity .support-card');
  const flowStages = count('#home-flow-map .route-stage-card');
  const intentRoutes = count('#home-routes [aria-label="Primary intent routes"] .support-card');
  const trustExits = count('#home-trust-routes .route-stage-card');
  const decisionCards = count('#home-decision-matrix .route-stage-card');
  const routePairs = count('#home-route-pairs .route-stage-card');

  const featured = await renderHomeAlbums();

  setText('home-meta-live', String(live || 0));
  setText('home-meta-pillars', String(pillars || 0));
  setText('home-meta-routes', String(nextRoutes || 0));
  setText('home-hero-live', `${live || 0} live pages`);
  setText('home-hero-library', `${featured || 0} albums • ${videos || 0} videos`);
  setText('home-live-stat-cards', `${live || 0} live cards`);
  setText('home-pillars-stat', `${pillars || 0} core pillars`);
  setText('home-featured-stat', `${featured || 0} live albums`);
  setText('home-videos-stat', `${videos || 0} live videos`);
  setText('home-connect-stat', `${profiles || 0} profiles`);
  setText('home-route-stat', `${nextRoutes || 0} next steps`);
  setText('home-continuity-stat', `${continuityCards || 0} continuity cards • ${flowStages || 0} stage map`);
  setText('home-flow-map-stat', `${flowStages || 0} stages keep the main path clear`);
  setText('home-routes-stat', `${intentRoutes || 0} intent routes • ${trustExits || 0} outward links`);
  setText('home-trust-routes-stat', `${trustExits || 0} outward links stay visible`);
  setText('home-decision-matrix-stat', `${decisionCards || 0} compare cards`);
  setText('home-route-pairs-stat', `${routePairs || 0} pairings`);
})();
