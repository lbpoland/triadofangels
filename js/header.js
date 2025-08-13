// header.js - Pro AAA+++ Nav Dropdown/Toggle, no dependencies
document.addEventListener("DOMContentLoaded", function() {
  // Mobile menu
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mainNav = document.getElementById("main-nav");
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener("click", function() {
      mainNav.classList.toggle("open");
      mobileToggle.setAttribute("aria-expanded", mainNav.classList.contains("open"));
    });
  }

  // Handle dropdowns
  function handleDropdown(id) {
    const trigger = document.getElementById(id);
    if (!trigger) return;
    const parent = trigger.parentNode;
    trigger.addEventListener("click", function(e) {
      e.preventDefault();
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-nav').forEach(el => {
        if(el !== parent) el.classList.remove('open');
      });
      parent.classList.toggle("open");
      trigger.setAttribute("aria-expanded", parent.classList.contains("open"));
    });
    // Close dropdown if clicked outside
    document.addEventListener("click", function(e) {
      if (!parent.contains(e.target) && parent.classList.contains("open")) {
        parent.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }
  handleDropdown("youtubeMenuToggle");
  handleDropdown("spotifyMenuToggle");
  handleDropdown("appleMenuToggle");

  // Accessibility: close menus with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === "Escape") {
      document.querySelectorAll('.dropdown-nav.open').forEach(function(el) {
        el.classList.remove('open');
        const link = el.querySelector('a[aria-haspopup="true"]');
        if(link) link.setAttribute("aria-expanded", "false");
      });
      if (mainNav) mainNav.classList.remove('open');
      if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
    }
  });
});
