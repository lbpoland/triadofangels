// js/components/footer.js
import { el, $ } from '../utils.js';

export function mountFooter() {
  const host = $('#site-footer');
  if (!host) return;

  const footer = el('footer', { className:'site-footer', attrs:{ role:'contentinfo' }});
  footer.innerHTML = `
    <div class="container">
      <div class="social" aria-label="Platform links">
        <!-- Add/replace href values as you get the official URLs -->
        <a aria-label="YouTube"      href="https://www.youtube.com/@triadofangels" target="_blank" rel="me noopener">🟥</a>
        <a aria-label="Spotify"      href="https://open.spotify.com/artist/..."     target="_blank" rel="me noopener">🟢</a>
        <a aria-label="Apple Music"  href="https://music.apple.com/artist/..."      target="_blank" rel="me noopener">⚪</a>
        <a aria-label="Instagram"    href="https://instagram.com/triadofangels"     target="_blank" rel="me noopener">📸</a>
        <a aria-label="TikTok"       href="https://tiktok.com/@triadofangels"       target="_blank" rel="me noopener">🎵</a>
        <a aria-label="Facebook"     href="https://facebook.com/triadofangels"      target="_blank" rel="me noopener">📘</a>
        <!-- DistroKid network: placeholders for all endpoints -->
        <!-- Add more icons/links as needed; CSS will render proper icons later -->
      </div>

      <p class="legal">© <span id="year"></span> Triad of Angels & ToA Studios. All rights reserved.
        · <a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/contact.html">Contact</a>
      </p>
    </div>
  `;
  host.replaceChildren(footer);
  footer.querySelector('#year').textContent = new Date().getFullYear();
}
