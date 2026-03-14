/* FEATURE GATES — Staged hub visibility controller
   Purpose:
   - Toggle [data-feature-gate] sections based on window.TOA_PLATFORM_CONFIG.FEATURES
   - Default behavior: 'off' section visible, 'on' section hidden (safe for public)
   Markup pattern:
     <section data-feature-gate="games" data-gate="off">Coming Soon…</section>
     <div data-feature-gate="games" data-gate="on" hidden>Full system…</div>

   Accessibility:
   - Uses hidden attribute for reliable removal from a11y tree
   - Applies aria-hidden defensively when toggling
*/

(function(){
  'use strict';

  function getConfig(){
    const cfg = window.TOA_PLATFORM_CONFIG;
    if (!cfg || !cfg.FEATURES) return null;
    return cfg;
  }

  function setHidden(el, shouldHide){
    if (!el) return;
    if (shouldHide){
      el.setAttribute('hidden','');
      el.setAttribute('aria-hidden','true');
    } else {
      el.removeAttribute('hidden');
      el.setAttribute('aria-hidden','false');
    }
  }

  function applyGates(){
    const cfg = getConfig();
    const features = cfg ? cfg.FEATURES : {};
    const nodes = document.querySelectorAll('[data-feature-gate][data-gate]');
    nodes.forEach((el) => {
      const key = String(el.getAttribute('data-feature-gate') || '').trim().toLowerCase();
      const gate = String(el.getAttribute('data-gate') || '').trim().toLowerCase(); // 'on' or 'off'
      const enabled = Boolean(features[key]);
      const shouldShow = enabled ? (gate === 'on') : (gate === 'off');
      setHidden(el, !shouldShow);
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', applyGates, { once: true });
  } else {
    applyGates();
  }
})();
