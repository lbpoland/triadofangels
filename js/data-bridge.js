// js/data-bridge.js
// Makes sure the catalog is available on window.TOA_CATALOG
// so renderers don't care if data.js used ESM or a global.
(function attachCatalog() {
  if (window.TOA_CATALOG && Array.isArray(window.TOA_CATALOG)) return;
  // If data.js was authored as ESM `export const albums = [...]`,
  // some bundlers stash it on window.albums when included as classic script.
  // Try common fallbacks before giving up.
  const guess = window.albums || window.catalog || window.data || null;
  if (guess && Array.isArray(guess)) {
    window.TOA_CATALOG = guess;
  } else {
    // final hard error to help debug
    console.error('Catalog not found. Ensure data.js sets window.TOA_CATALOG = [...];');
    window.TOA_CATALOG = [];
  }
})();
