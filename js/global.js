// Enable smooth scrolling for anchor links sitewide
document.documentElement.style.scrollBehavior = 'smooth';

document.addEventListener('DOMContentLoaded', function() {

  // =========================
  // UNIVERSAL ALBUM CATEGORY FILTER
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
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      categoryOptions.forEach(opt => opt.classList.remove('active'));
      const clicked = e && (e.target.closest('.category-button') || e.target.closest('.category-option'));
      if (clicked) clicked.classList.add('active');
      albumBlocks.forEach(album => {
        const albumCategories = (album.getAttribute('data-category') || '').split(' ');
        if (category === 'all' || albumCategories.includes(category)) {
          album.classList.remove('hidden');
        } else {
          album.classList.add('hidden');
        }
      });
      // Dropdown menu closes after select
      if (e && e.target.closest('.streaming-dropdown-menu')) {
        const menu = e.target.closest('.streaming-dropdown-menu');
        menu.classList.remove('open');
        const dropdownButton = menu.previousElementSibling;
        if (dropdownButton) dropdownButton.setAttribute('aria-expanded', 'false');
      }
    }

    // Desktop & touch support for category buttons
    categoryButtons.forEach(button => {
      button.addEventListener('click', e => handleFilter(e, button.getAttribute('data-category')));
      button.addEventListener('touchstart', e => {
        e.preventDefault();
        handleFilter(e, button.getAttribute('data-category'));
      }, { passive: false });
    });
    // Same for dropdown options
    categoryOptions.forEach(option => {
      option.addEventListener('click', e => handleFilter(e, option.getAttribute('data-category')));
      option.addEventListener('touchstart', e => {
        e.preventDefault();
        handleFilter(e, option.getAttribute('data-category'));
      }, { passive: false });
    });

    // Default state: show all, highlight first button
    if (categoryButtons.length > 0) {
      categoryButtons[0].classList.add('active');
      handleFilter(null, 'all');
    }
  }
  // Initialize album category filters (add more as needed)
  setupAlbumCategoryFilter('toa-studios-albums');
  setupAlbumCategoryFilter('triad-albums');
  // setupAlbumCategoryFilter('your-other-album-section');

  // =========================
  // MOBILE MENU (Nav Drawer)
  // =========================
  (function(){
    const toggleButton = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('main-nav');
    if (!toggleButton || !navMenu) return;

    // Toggle menu open/close
    toggleButton.addEventListener('click', () => {
      const isExpanded = navMenu.classList.toggle('show');
      toggleButton.setAttribute('aria-expanded', isExpanded);
    });

    // Click outside to close menu
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('show') &&
        !navMenu.contains(e.target) &&
        e.target !== toggleButton &&
        !toggleButton.contains(e.target)
      ) {
        navMenu.classList.remove('show');
        toggleButton.setAttribute('aria-expanded', false);
      }
    });

    // ESC key closes menu for accessibility
    document.addEventListener('keyup', function(e) {
      if (e.key === "Escape" && navMenu.classList.contains('show')) {
        navMenu.classList.remove('show');
        toggleButton.setAttribute('aria-expanded', false);
        toggleButton.focus();
      }
    });
  })();

  // =========================
  // STREAMING DROPDOWN (Touch & Mouse)
  // =========================
  (function(){
    let isDropdownScrolling = false;
    let dropdownTouchedMenu = null;
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

    // Dropdown open/close toggle
    document.querySelectorAll('.streaming-dropdown-button').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.streaming-dropdown-menu.open').forEach(menu => {
          if (menu !== button.nextElementSibling) {
            menu.classList.remove('open');
            if (menu.previousElementSibling) menu.previousElementSibling.setAttribute('aria-expanded', 'false');
          }
        });
        const menu = button.nextElementSibling;
        if (menu && menu.classList.contains('streaming-dropdown-menu')) {
          const isOpen = menu.classList.toggle('open');
          button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      });
      button.addEventListener('touchstart', function(e) {
        e.preventDefault();
        button.click();
      }, { passive: false });
    });

    // Close dropdown if not scrolling and not clicking/touching inside
    function closeAllDropdowns(e) {
      if (isDropdownScrolling) return;
      if (
        !e.target.closest('.streaming-dropdown-menu') &&
        !e.target.closest('.streaming-dropdown-button')
      ) {
        document.querySelectorAll('.streaming-dropdown-menu.open').forEach(menu => {
          menu.classList.remove('open');
          if (menu.previousElementSibling) menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        });
      }
    }
    document.addEventListener('mousedown', closeAllDropdowns);
    document.addEventListener('touchstart', closeAllDropdowns, { passive: false });
  })();

  // =========================
  // UNIVERSAL CAROUSEL/SLIDER NAVIGATION (Albums, Music Videos, Home Videos)
  // =========================
  function setupCarouselNav(config) {
    // config: { buttonSelector, itemSelector, leftClass, rightClass }
    document.querySelectorAll(config.buttonSelector).forEach(button => {
      function scrollCarousel() {
        const carouselId = button.getAttribute('data-carousel');
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;
        const items = carousel.querySelectorAll(config.itemSelector);
        if (!items.length) return;
        const scrollAmount = items[0].offsetWidth + 20; // 20px gap, adjust if needed
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
  // Album carousels (horizontal scroll)
  setupCarouselNav({
    buttonSelector: '.album-nav-button',
    itemSelector: '.album-block',
    leftClass: 'album-nav-left',
    rightClass: 'album-nav-right'
  });
  // Music video carousels
  setupCarouselNav({
    buttonSelector: '.music-video-nav-button',
    itemSelector: '.music-video-item',
    leftClass: 'music-video-nav-left',
    rightClass: 'music-video-nav-right'
  });
  // Home page/index video carousels
  setupCarouselNav({
    buttonSelector: '.index-video-nav-button',
    itemSelector: '.index-video-item',
    leftClass: 'index-video-nav-left',
    rightClass: 'index-video-nav-right'
  });

});
