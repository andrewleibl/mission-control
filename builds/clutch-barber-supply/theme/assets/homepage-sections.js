(function () {
  function on(el, event, handler, options) {
    if (el) {
      el.addEventListener(event, handler, options || false);
    }
  }

  function initTopNote() {
    var topNote = document.querySelector('[data-top-note]');
    var closeBtn = document.querySelector('[data-top-note-close]');
    var header = document.querySelector('[data-clutch-header]');

    if (!topNote || !closeBtn) {
      if (header) header.classList.add('has-no-top-note');
      return;
    }

    on(closeBtn, 'click', function () {
      topNote.classList.add('is-hidden');
      if (header) header.classList.add('has-no-top-note');
    });
  }

  function initStickyState() {
    var header = document.querySelector('[data-clutch-header]');
    if (!header) return;

    function syncHeader() {
      if (window.scrollY > 16) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    syncHeader();
    on(window, 'scroll', syncHeader, { passive: true });
  }

  function initSearchToggle() {
    var searchWrap = document.querySelector('[data-clutch-search]');
    var searchToggle = document.querySelector('[data-clutch-search-toggle]');
    var searchInput = searchWrap ? searchWrap.querySelector('input') : null;
    var desktopQuery = window.matchMedia('(min-width: 768px)');

    if (!searchWrap || !searchToggle || !searchInput) return;

    function closeSearch() {
      if (desktopQuery.matches) return;
      searchWrap.classList.remove('is-open');
      searchToggle.setAttribute('aria-expanded', 'false');
    }

    on(searchToggle, 'click', function () {
      if (desktopQuery.matches) {
        searchInput.focus();
        return;
      }
      var isOpen = searchWrap.classList.toggle('is-open');
      searchToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        window.setTimeout(function () {
          searchInput.focus();
        }, 30);
      }
    });

    on(document, 'click', function (event) {
      if (!searchWrap.contains(event.target)) {
        closeSearch();
      }
    });

    on(document, 'keydown', function (event) {
      if (event.key === 'Escape') {
        closeSearch();
      }
    });

    on(desktopQuery, 'change', function (event) {
      if (event.matches) {
        searchWrap.classList.remove('is-open');
        searchToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initMobileDrawer() {
    var drawer = document.getElementById('clutch-mobile-nav');
    var openBtn = document.querySelector('[data-clutch-nav-toggle]');
    var closeBtn = document.querySelector('[data-clutch-nav-close]');
    var overlay = document.querySelector('[data-clutch-nav-overlay]');

    if (!drawer || !openBtn || !closeBtn || !overlay) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.hidden = true;
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }

    on(openBtn, 'click', openDrawer);
    on(closeBtn, 'click', closeDrawer);
    on(overlay, 'click', closeDrawer);
    on(document, 'keydown', function (event) {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    });
  }

  initTopNote();
  initStickyState();
  initSearchToggle();
  initMobileDrawer();

  // Collection Filters Auto-submit
  function initCollectionFilters() {
    const filterForm = document.getElementById('collection-filters-form');
    const filterDrawer = document.getElementById('filter-drawer');
    const filterOverlay = document.getElementById('filter-drawer-overlay');
    const filterToggle = document.getElementById('filter-toggle-btn');
    const filterClose = document.getElementById('filter-drawer-close');
    const filterApply = document.getElementById('filter-apply-btn');

    // Mobile drawer controls
    if (filterToggle && filterDrawer) {
      filterToggle.addEventListener('click', function() {
        filterDrawer.classList.add('is-open');
        filterDrawer.setAttribute('aria-hidden', 'false');
        if (filterOverlay) {
          filterOverlay.classList.add('is-visible');
          filterOverlay.setAttribute('aria-hidden', 'false');
        }
        filterToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('filter-open');
      });
    }

    function closeFilterDrawer() {
      if (!filterDrawer) return;
      filterDrawer.classList.remove('is-open');
      filterDrawer.setAttribute('aria-hidden', 'true');
      if (filterOverlay) {
        filterOverlay.classList.remove('is-visible');
        filterOverlay.setAttribute('aria-hidden', 'true');
      }
      if (filterToggle) filterToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('filter-open');
    }

    if (filterClose) filterClose.addEventListener('click', closeFilterDrawer);
    if (filterOverlay) filterOverlay.addEventListener('click', closeFilterDrawer);
    if (filterApply) filterApply.addEventListener('click', function(e) {
      e.preventDefault();
      if (filterForm) filterForm.submit();
    });

    // Auto-submit on checkbox/radio change for desktop
    if (filterForm) {
      const filterInputs = filterForm.querySelectorAll('.filter-input');
      filterInputs.forEach(function(input) {
        input.addEventListener('change', function() {
          // Only auto-submit on desktop
          if (window.innerWidth >= 768) {
            filterForm.submit();
          }
        });
      });
    }
  }

  initCollectionFilters();
})();
