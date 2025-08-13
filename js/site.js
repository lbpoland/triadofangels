// js/site.js
// Bootstraps the correct renderer for each page.
// Add data-page="<name>" on <body> in each HTML page.
// ---------------------------------------------------------------------

import { mountHeader } from './components/header.js';
import { mountFooter } from './components/footer.js';
import { renderMusicPage, renderHomePage, renderAlbumPage, renderTrackPage } from './render.js';

window.addEventListener('DOMContentLoaded', () => {
  mountHeader();
  mountFooter();

  const page = document.body.dataset.page;

  switch (page) {
    case 'home':   renderHomePage(); break;
    case 'music':  renderMusicPage(); break;
    case 'album':  renderAlbumPage(); break;
    case 'track':  renderTrackPage(); break;
    default:       /* no-op */ break;
  }
});
