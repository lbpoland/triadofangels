// global.js - Handles interactive behaviors (menu, dropdowns, carousel, theme switching)

// Enable smooth scrolling for anchor links sitewide
document.documentElement.style.scrollBehavior = 'smooth';

document.addEventListener('DOMContentLoaded', function() {
  // =========================
  // UNIVERSAL ALBUM CATEGORY FILTER (for Music page album grids)
  // =========================
  function setupAlbumCategoryFilter(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const albumGrid = section.querySelector('.album-grid');
    if (!albumGrid) return;
    const albumBlocks = albumGrid.querySelectorAll('.album-block');
    const categoryButtons = section.querySelectorAll('.category-button');
    const categoryOptions = section.querySelectorAll('.category-option');

    function handleFilter(e, category) {
      if (e) e.preventDefault();
      // Reset active states on all filter controls
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      categoryOptions.forEach(opt => opt.classList.remove('active'));
      const clicked = e && (e.target.closest('.category-button') || e.target.closest('.category-option'));
      if (clicked) clicked.classList.add('active');
      // Show/hide album blocks based on category
      albumBlocks.forEach(album => {
        const albumCategories = (album.getAttribute('data-category') || '').split(' ');
        if (category === 'all' || albumCategories.includes(category)) {
          album.classList.remove('hidden');
        } else {
          album.classList.add('hidden');
        }
      });
      // Close dropdown menu after selection (for mobile dropdown)
      if (e && e.target.closest('.streaming-dropdown-menu')) {
        const menu = e.target.closest('.streaming-dropdown-menu');
        menu.classList.remove('open');
        const dropdownButton = menu.previousElementSibling;
        if (dropdownButton) dropdownButton.setAttribute('aria-expanded', 'false');
      }
    }

    // Attach filter handlers to category buttons (desktop)
    categoryButtons.forEach(button => {
      button.addEventListener('click', e => handleFilter(e, button.getAttribute('data-category')));
      button.addEventListener('touchstart', e => {
        e.preventDefault();
        handleFilter(e, button.getAttribute('data-category'));
      }, { passive: false });
    });
    // Attach filter handlers to dropdown options (mobile)
    categoryOptions.forEach(option => {
      option.addEventListener('click', e => handleFilter(e, option.getAttribute('data-category')));
      option.addEventListener('touchstart', e => {
        e.preventDefault();
        handleFilter(e, option.getAttribute('data-category'));
      }, { passive: false });
    });

    // Set default filter state: show all albums and mark first button active
    if (categoryButtons.length > 0) {
      categoryButtons[0].classList.add('active');
      handleFilter(null, 'all');
    }
  }
  // Initialize album category filters for relevant sections
  setupAlbumCategoryFilter('toa-studios-albums');
  setupAlbumCategoryFilter('triad-albums');
  // (Add additional calls if more album sections exist)

  // =========================
  // MOBILE MENU (Responsive Nav Drawer)
  // =========================
  (function(){
    const toggleButton = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('main-nav');
    if (!toggleButton || !navMenu) return;

    // Toggle the mobile nav menu open/closed
    toggleButton.addEventListener('click', () => {
      const isExpanded = navMenu.classList.toggle('show');
      toggleButton.setAttribute('aria-expanded', isExpanded);
    });

    // Click outside the menu closes it (for accessibility and ease)
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('show') &&
        !navMenu.contains(e.target) &&
        e.target !== toggleButton &&
        !toggleButton.contains(e.target)
      ) {
        navMenu.classList.remove('show');
        toggleButton.setAttribute('aria-expanded', 'false');
      }
    });

    // ESC key closes menu when open
    document.addEventListener('keyup', function(e) {
      if (e.key === "Escape" && navMenu.classList.contains('show')) {
        navMenu.classList.remove('show');
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.focus();
      }
    });
  })();

  // =========================
  // STREAMING DROPDOWNS (External links dropdown menus in header & music page)
  // =========================
  (function(){
    let isDropdownScrolling = false;
    let dropdownTouchedMenu = null;
    // Track touch scrolling within dropdown to distinguish from tap
    document.querySelectorAll('.streaming-dropdown-menu').forEach(menu => {
      menu.addEventListener('touchstart', function() {
        dropdownTouchedMenu = this;
        isDropdownScrolling = false;
      }, { passive: true });
      menu.addEventListener('touchmove', function() {
        if (dropdownTouchedMenu === this) isDropdownScrolling = true;
      }, { passive: true });
      menu.addEventListener('touchend', function() {
        setTimeout(() => {
          isDropdownScrolling = false;
          dropdownTouchedMenu = null;
        }, 50);
      });
    });

    // Toggle any dropdown open/closed on button click (and close others)
    document.querySelectorAll('.streaming-dropdown-button').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        // Close any other open dropdowns
        document.querySelectorAll('.streaming-dropdown-menu.open').forEach(menu => {
          if (menu !== button.nextElementSibling) {
            menu.classList.remove('open');
            if (menu.previousElementSibling) {
              menu.previousElementSibling.setAttribute('aria-expanded', 'false');
            }
          }
        });
        const menu = button.nextElementSibling;
        if (menu && menu.classList.contains('streaming-dropdown-menu')) {
          const isOpen = menu.classList.toggle('open');
          button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      });
      // On touch devices, treat touchstart the same as click for toggling
      button.addEventListener('touchstart', function(e) {
        e.preventDefault();
        button.click();
      }, { passive: false });
    });

    // Close all dropdowns when clicking outside (if not scrolling a touch gesture)
    function closeAllDropdowns(e) {
      if (isDropdownScrolling) return;
      if (
        !e.target.closest('.streaming-dropdown-menu') &&
        !e.target.closest('.streaming-dropdown-button')
      ) {
        document.querySelectorAll('.streaming-dropdown-menu.open').forEach(menu => {
          menu.classList.remove('open');
          if (menu.previousElementSibling) {
            menu.previousElementSibling.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }
    document.addEventListener('mousedown', closeAllDropdowns);
    document.addEventListener('touchstart', closeAllDropdowns, { passive: false });
  })();

  // =========================
  // UNIVERSAL CAROUSEL NAVIGATION (Albums & Videos carousels)
  // =========================
  function setupCarouselNav(config) {
    // config expects: { buttonSelector, itemSelector, leftClass, rightClass }
    document.querySelectorAll(config.buttonSelector).forEach(button => {
      function scrollCarousel() {
        const carouselId = button.getAttribute('data-carousel');
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;
        const items = carousel.querySelectorAll(config.itemSelector);
        if (!items.length) return;
        const scrollAmount = items[0].offsetWidth + 20; // account for item width + gap
        if (button.classList.contains(config.leftClass)) {
          carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else if (button.classList.contains(config.rightClass)) {
          carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
      button.addEventListener('click', scrollCarousel);
      button.addEventListener('touchstart', function(e) {
        e.preventDefault();
        scrollCarousel();
      }, { passive: false });
    });
  }
  // Initialize carousel navigation for albums and videos
  setupCarouselNav({
    buttonSelector: '.album-nav-button',
    itemSelector: '.album-block',
    leftClass: 'album-nav-left',
    rightClass: 'album-nav-right'
  });
  setupCarouselNav({
    buttonSelector: '.music-video-nav-button',
    itemSelector: '.music-video-item',
    leftClass: 'music-video-nav-left',
    rightClass: 'music-video-nav-right'
  });
  setupCarouselNav({
    buttonSelector: '.index-video-nav-button',
    itemSelector: '.index-video-item',
    leftClass: 'index-video-nav-left',
    rightClass: 'index-video-nav-right'
  });

  // =========================
  // THEME PERSISTENCE & TOGGLING (Light/Dark/Original themes)
  // =========================
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && savedTheme !== 'theme-cosmic') {
    // Apply saved theme class from previous visit (if not cosmic/default)
    document.body.classList.add(savedTheme);
  }
  function setTheme(theme) {
    // Remove any existing theme classes
    document.body.classList.remove('theme-cosmic', 'theme-light', 'theme-dark');
    if (theme === 'cosmic') {
      // Original cosmic theme: no class (revert to default), clear saved setting
      localStorage.removeItem('theme');
    } else {
      const themeClass = 'theme-' + theme;
      document.body.classList.add(themeClass);
      localStorage.setItem('theme', themeClass);
    }
  }
  // Handle theme option selections from the dropdown
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', e => {
      e.preventDefault();
      const themeChoice = option.getAttribute('data-theme');
      setTheme(themeChoice);
      // Close the theme dropdown menu after selection
      const menu = option.closest('.streaming-dropdown-menu');
      if (menu) {
        menu.classList.remove('open');
        const dropdownBtn = menu.previousElementSibling;
        if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
});
