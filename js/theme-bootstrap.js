/* js/theme-bootstrap.js — early theme + motion bootstrap (CSP-safe, no dependencies) */
(() => {
  const KEY = 'toa-theme';
  const VALID = new Set(['toa', 'dark', 'light']);

  const prefersHighContrast = () => {
    try {
      const forced = window.matchMedia && window.matchMedia('(forced-colors: active)').matches;
      const more = window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches;
      return !!(forced || more);
    } catch {
      return false;
    }
  };

  let savedTheme = null;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && VALID.has(saved)) savedTheme = saved;
    // legacy compatibility: previously stored 'contrast' values behave like dark
    if (saved === 'contrast') savedTheme = 'dark';
  } catch { /* ignore */ }

  // Brand-first default, but system contrast overrides for accessibility.
  let theme = savedTheme || 'toa';
  if (prefersHighContrast()) theme = 'contrast';

  document.documentElement.dataset.theme = theme;

  try {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) document.documentElement.classList.add('no-reduced-motion');
  } catch { /* ignore */ }
})();
