/* PLATFORM CONFIG — SINGLE SOURCE OF TRUTH (Static feature staging)
   Purpose:
   - Gate public visibility of in-progress hubs (Games/Apps/Digital Store) without shipping hidden HTML blobs
   - Enable production-safe rollout: core pages can ship live while staged systems remain implemented but not exposed
   Constraints:
   - GitHub Pages static hosting (no server-side flags)
   - Strict CSP (no inline handlers/styles; external JS only)
   How to use:
   - Pages declare sections with [data-feature-gate="<key>"][data-gate="off|on"]
   - /js/feature-gates.js toggles visibility based on this config
*/

(function(){
  'use strict';

  const CONFIG = {
    FEATURES: {
      // When false, users see the premium Coming Soon surface.
      // When true, users see the full, real implementation for that hub.
      games: false,
      apps: false,
      store: false
    },
    BUILD: {
      STAGE: "production", // production | staging | local
      LABEL: "LIVE_PHASE_CORE_PAGES"
    }
  };

  // Expose as read-only global (CSP-safe, non-module).
  Object.defineProperty(window, "TOA_PLATFORM_CONFIG", {
    value: Object.freeze(CONFIG),
    writable: false,
    configurable: false,
    enumerable: true
  });
})();
