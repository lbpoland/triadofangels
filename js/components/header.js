// js/components/header.js
import { el, $, $$ } from '../utils.js';

export function mountHeader() {
  const host = $('#site-header');
  if (!host) return;

  const header = el('header', { className: 'site-header', attrs:{ role:'banner' }});
  header.innerHTML = `
    <div class="container nav-wrap" role="navigation" aria-label="Primary">
      <a class="brand" href="/"><span class="logo" aria-hidden="true">🌗</span>
        <span class="brand-text">Triad of Angels | ToA Studios</span>
      </a>
      <nav class="nav">
        <a href="/about.html">About</a>
        <a href="/music.html" aria-current="${location.pathname.endsWith('/music.html')?'page':'false'}">Music</a>
        <a href="/publishing.html">Publishing</a>
        <a href="/store.html">Digital Store</a>
        <a href="/youtube.html">YouTube</a>
        <a href="/spotify.html">Spotify</a>
        <a href="/apple.html">Apple</a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Toggle theme">Theme</button>
    </div>
    <div class="supernav" role="navigation" aria-label="Network">
      <a href="/about-store.html">About Music Publishing Digital Store</a>
      <a href="https://www.youtube.com/@triadofangels" rel="me noopener" target="_blank">YouTube</a>
      <a href="https://open.spotify.com/artist/7a8d9...?" rel="me noopener" target="_blank">Spotify</a>
      <a href="https://music.apple.com/artist/triad-of-angels/1811109753" rel="me noopener" target="_blank">Apple</a>
    </div>
  `;
  host.replaceChildren(header);

  // Theme toggle (persist in localStorage)
  const btn = $('.theme-toggle', header);
  const root = document.documentElement;
  const key  = 'toa-theme';
  const set  = (t) => { root.dataset.theme = t; localStorage.setItem(key, t); };
  const cur  = localStorage.getItem(key) || 'dark';
  set(cur);
  btn.addEventListener('click', () => set(root.dataset.theme === 'dark' ? 'light' : 'dark'));
}
