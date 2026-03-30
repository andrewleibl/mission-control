/**
 * Clutch Barber Supply — theme.js
 * Straight Point Marketing
 * Production-ready JavaScript for the Shopify 2.0 theme.
 */

(function () {
  'use strict';

  // ============================================================
  // UTILITIES
  // ============================================================

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  function on(el, event, handler, options) {
    if (el) el.addEventListener(event, handler, options || false);
  }

  function off(el, event, handler) {
    if (el) el.removeEventListener(event, handler);
  }

  // ============================================================
  // STICKY HEADER ON SCROLL
  // ============================================================

  (function initStickyHeader() {
    var header = qs('#site-header');
    if (!header) return;

    var ticking = false;

    function updateHeader() {
      if (window.scrollY > 80) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      ticking = false;
    }

    on(window, 'scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  })();

  // ============================================================
  // SMOOTH SCROLL — for anchor links
  // ============================================================

  (function initSmoothScroll() {
    on(document, 'click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (hash === '#') return;

      var target = qs(hash);
      if (!target) return;

      e.preventDefault();

      var headerHeight = (qs('#site-header') || {}).offsetHeight || 0;
      var announcementHeight = (qs('.announcement-bar') || {}).offsetHeight || 0;
      var offset = headerHeight + announcementHeight + 16;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  })();

  // ============================================================
  // MOBILE HAMBURGER MENU
  // ============================================================

  (function initMobileNav() {
    var hamburgerBtn = qs('#hamburger-btn');
    var mobileNavDrawer = qs('#mobile-nav-drawer');
    var mobileNavOverlay = qs('#mobile-nav-overlay');
    var mobileNavClose = qs('#mobile-nav-close');

    if (!hamburgerBtn || !mobileNavDrawer) return;

    function openMobileNav() {
      mobileNavDrawer.classList.add('is-open');
      mobileNavDrawer.setAttribute('aria-hidden', 'false');
      if (mobileNavOverlay) {
        mobileNavOverlay.classList.add('is-visible');
        mobileNavOverlay.setAttribute('aria-hidden', 'false');
      }
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.classList.add('is-active');
      document.body.classList.add('nav-open');
      // Focus first link
      var firstLink = mobileNavDrawer.querySelector('a, button, summary');
      if (firstLink) setTimeout(function () { firstLink.focus(); }, 50);
    }

    function closeMobileNav() {
      mobileNavDrawer.classList.remove('is-open');
      mobileNavDrawer.setAttribute('aria-hidden', 'true');
      if (mobileNavOverlay) {
        mobileNavOverlay.classList.remove('is-visible');
        mobileNavOverlay.setAttribute('aria-hidden', 'true');
      }
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.classList.remove('is-active');
      document.body.classList.remove('nav-open');
    }

    on(hamburgerBtn, 'click', openMobileNav);
    on(mobileNavClose, 'click', closeMobileNav);
    on(mobileNavOverlay, 'click', closeMobileNav);

    // Close on ESC
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && mobileNavDrawer.classList.contains('is-open')) {
        closeMobileNav();
        hamburgerBtn.focus();
      }
    });
  })();

  // ============================================================
  // CART DRAWER
  // ============================================================

  (function initCartDrawer() {
    var cartToggleBtn = qs('#cart-toggle-btn');
    var cartDrawer = qs('#cart-drawer');
    var cartOverlay = qs('#cart-overlay');
    var cartCloseBtn = qs('#cart-close-btn');

    if (!cartDrawer) return;

    function openCartDrawer() {
      cartDrawer.classList.add('is-open');
      cartDrawer.setAttribute('aria-hidden', 'false');
      if (cartOverlay) {
        cartOverlay.classList.add('is-visible');
        cartOverlay.setAttribute('aria-hidden', 'false');
      }
      if (cartToggleBtn) cartToggleBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('cart-open');
      // Focus close button
      if (cartCloseBtn) setTimeout(function () { cartCloseBtn.focus(); }, 50);
    }

    function closeCartDrawer() {
      cartDrawer.classList.remove('is-open');
      cartDrawer.setAttribute('aria-hidden', 'true');
      if (cartOverlay) {
        cartOverlay.classList.remove('is-visible');
        cartOverlay.setAttribute('aria-hidden', 'true');
      }
      if (cartToggleBtn) cartToggleBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('cart-open');
    }

    on(cartToggleBtn, 'click', openCartDrawer);
    on(cartCloseBtn, 'click', closeCartDrawer);
    on(cartOverlay, 'click', closeCartDrawer);

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && cartDrawer.classList.contains('is-open')) {
        closeCartDrawer();
        if (cartToggleBtn) cartToggleBtn.focus();
      }
    });

    // Expose globally for add-to-cart flows
    window.ClutchCart = window.ClutchCart || {};
    window.ClutchCart.open = openCartDrawer;
    window.ClutchCart.close = closeCartDrawer;
  })();

  // ============================================================
  // CART BADGE COUNTER
  // ============================================================

  (function initCartBadge() {
    function updateCartCount(count) {
      var badges = qsa('.cart-count, #cart-count');
      badges.forEach(function (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.dataset.count = count;
        badge.style.display = count > 0 ? '' : 'none';
      });
    }

    // Fetch live cart count from Shopify
    function fetchCartCount() {
      fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } })
        .then(function (res) { return res.json(); })
        .then(function (cart) { updateCartCount(cart.item_count); })
        .catch(function () { /* silently fail */ });
    }

    // Run on load
    fetchCartCount();

    // Listen for cart updates from add-to-cart forms
    document.addEventListener('cart:updated', function (e) {
      if (e.detail && typeof e.detail.count === 'number') {
        updateCartCount(e.detail.count);
      } else {
        fetchCartCount();
      }
    });

    // Intercept add-to-cart form submissions (AJAX cart)
    on(document, 'submit', function (e) {
      var form = e.target;
      if (!form || !form.matches('form[action="/cart/add"]')) return;

      // Only intercept if it has a product id input
      var idInput = form.querySelector('input[name="id"]');
      if (!idInput) return;

      e.preventDefault();

      var formData = new FormData(form);
      var submitBtn = form.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';
      }

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idInput.value, quantity: parseInt(formData.get('quantity') || 1, 10) })
      })
        .then(function (res) { return res.json(); })
        .then(function () {
          fetchCartCount();
          // Open cart drawer
          if (window.ClutchCart) window.ClutchCart.open();
        })
        .catch(function () {
          // Fallback: regular form submit
          form.submit();
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });
    });
  })();

  // ============================================================
  // EMAIL POPUP
  // Show after 5 seconds. Dismiss stores flag in localStorage.
  // Does not show again for 7 days after dismiss.
  // ============================================================

  (function initEmailPopup() {
    var STORAGE_KEY = 'clutch_popup_dismissed';
    var RESHOW_DELAY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    var popup = qs('#email-popup');
    var popupOverlay = qs('#popup-overlay');
    var popupCloseBtn = qs('#popup-close-btn');
    var popupForm = qs('#popup-form');

    if (!popup) return;

    function shouldShowPopup() {
      try {
        var dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) return true;
        var dismissedAt = parseInt(dismissed, 10);
        return isNaN(dismissedAt) || (Date.now() - dismissedAt > RESHOW_DELAY_MS);
      } catch (e) {
        return true;
      }
    }

    function showPopup() {
      popup.classList.add('is-visible');
      popup.setAttribute('aria-hidden', 'false');
      document.body.classList.add('popup-open');
      // Focus close button for accessibility
      if (popupCloseBtn) setTimeout(function () { popupCloseBtn.focus(); }, 50);
    }

    function dismissPopup() {
      popup.classList.remove('is-visible');
      popup.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('popup-open');
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch (e) { /* storage unavailable */ }
    }

    if (!shouldShowPopup()) return;

    // Show after 5 seconds
    var timer = setTimeout(showPopup, 5000);

    // Exit intent (desktop) — trigger on mouse leaving viewport upward
    var exitIntentFired = false;
    function handleExitIntent(e) {
      if (e.clientY <= 5 && !exitIntentFired && shouldShowPopup()) {
        exitIntentFired = true;
        clearTimeout(timer);
        showPopup();
      }
    }
    on(document, 'mouseleave', handleExitIntent);

    // Close on button click
    on(popupCloseBtn, 'click', dismissPopup);

    // Close on overlay click
    on(popupOverlay, 'click', function (e) {
      if (e.target === popupOverlay) dismissPopup();
    });

    // Close on ESC key
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && popup.classList.contains('is-visible')) {
        dismissPopup();
      }
    });

    // Form submit
    on(popupForm, 'submit', function (e) {
      e.preventDefault();
      var emailInput = popupForm.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : '';

      if (!email) return;

      // In production: connect to Klaviyo or Shopify newsletter
      // fetch('/contact', { method: 'POST', body: ... })
      // For now: dismiss and show thank you
      var submitBtn = popupForm.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'You\'re in! Check your inbox.';
        submitBtn.disabled = true;
      }
      setTimeout(dismissPopup, 2000);
    });
  })();

  // ============================================================
  // PRODUCT PAGE — Thumbnail Gallery
  // ============================================================

  (function initProductGallery() {
    var gallery = qs('.product-gallery');
    if (!gallery) return;

    var mainImage = qs('.product-main-image img', gallery);
    var thumbnails = qsa('.product-thumb', gallery);

    thumbnails.forEach(function (thumb) {
      on(thumb, 'click', function () {
        var newSrc = thumb.dataset.src;
        var newAlt = thumb.dataset.alt;
        if (mainImage && newSrc) {
          mainImage.src = newSrc;
          if (newAlt) mainImage.alt = newAlt;
        }
        thumbnails.forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    });
  })();

  // ============================================================
  // PRODUCT PAGE — Variant Selector
  // ============================================================

  (function initVariantSelector() {
    var variantOptions = qsa('.variant-option');
    if (!variantOptions.length) return;

    variantOptions.forEach(function (option) {
      on(option, 'click', function () {
        var siblings = qsa('.variant-option', option.closest('.variant-options'));
        siblings.forEach(function (s) { s.classList.remove('is-selected'); });
        option.classList.add('is-selected');

        // Update hidden variant input
        var variantInput = qs('[name="id"]', option.closest('form'));
        if (variantInput && option.dataset.variantId) {
          variantInput.value = option.dataset.variantId;
        }
      });
    });
  })();

  // ============================================================
  // PRODUCT PAGE — Quantity Selector
  // ============================================================

  (function initQtySelector() {
    var selectors = qsa('.qty-selector');
    selectors.forEach(function (selector) {
      var minus = qs('.qty-btn[data-action="minus"]', selector);
      var plus = qs('.qty-btn[data-action="plus"]', selector);
      var input = qs('.qty-input', selector);

      if (!input) return;

      on(minus, 'click', function () {
        var val = parseInt(input.value, 10) || 1;
        if (val > 1) input.value = val - 1;
      });

      on(plus, 'click', function () {
        var val = parseInt(input.value, 10) || 1;
        input.value = val + 1;
      });

      on(input, 'change', function () {
        var val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) input.value = 1;
      });
    });
  })();

  // ============================================================
  // PRODUCT PAGE — Mobile Sticky ATC Bar
  // ============================================================

  (function initMobileStickyAtc() {
    var stickyBar = qs('.mobile-sticky-atc');
    var atcForm = qs('.product-form');
    if (!stickyBar || !atcForm) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          stickyBar.classList.add('is-visible');
        } else {
          stickyBar.classList.remove('is-visible');
        }
      });
    }, { threshold: 0 });

    observer.observe(atcForm);
  })();

  // ============================================================
  // COLLECTION PAGE — Mobile Filter Drawer
  // ============================================================

  (function initFilterDrawer() {
    var filterToggleBtn = qs('#filter-toggle-btn');
    var filterDrawer = qs('#filter-drawer');
    var filterDrawerOverlay = qs('#filter-drawer-overlay');
    var filterDrawerClose = qs('#filter-drawer-close');

    if (!filterDrawer) return;

    function openFilters() {
      filterDrawer.classList.add('is-open');
      filterDrawer.setAttribute('aria-hidden', 'false');
      if (filterDrawerOverlay) {
        filterDrawerOverlay.classList.add('is-visible');
        filterDrawerOverlay.setAttribute('aria-hidden', 'false');
      }
      if (filterToggleBtn) filterToggleBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('filter-open');
    }

    function closeFilters() {
      filterDrawer.classList.remove('is-open');
      filterDrawer.setAttribute('aria-hidden', 'true');
      if (filterDrawerOverlay) {
        filterDrawerOverlay.classList.remove('is-visible');
        filterDrawerOverlay.setAttribute('aria-hidden', 'true');
      }
      if (filterToggleBtn) filterToggleBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('filter-open');
    }

    on(filterToggleBtn, 'click', openFilters);
    on(filterDrawerClose, 'click', closeFilters);
    on(filterDrawerOverlay, 'click', closeFilters);
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && filterDrawer.classList.contains('is-open')) {
        closeFilters();
      }
    });

    // Expose globally for inline onclick handlers
    window.closeMobileFilters = closeFilters;
  })();

  // ============================================================
  // COLLECTION PAGE — Sort By Select
  // ============================================================

  (function initSortSelect() {
    var sortSelect = qs('#sort-select');
    if (!sortSelect) return;

    on(sortSelect, 'change', function () {
      var url = new URL(window.location.href);
      url.searchParams.set('sort_by', sortSelect.value);
      window.location.href = url.toString();
    });
  })();

  // ============================================================
  // FREE SHIPPING PROGRESS BAR
  // ============================================================

  (function initShippingProgressBar() {
    var progressFill = qs('.progress-bar-fill');
    var progressText = qs('.shipping-progress-text');
    if (!progressFill) return;

    var threshold = parseInt(progressFill.closest('[data-threshold]') && progressFill.closest('[data-threshold]').dataset.threshold, 10) || 30000; // $300 in cents

    function updateProgress(cartTotal) {
      var pct = Math.min(100, Math.round((cartTotal / threshold) * 100));
      progressFill.style.width = pct + '%';

      if (progressText) {
        var remaining = threshold - cartTotal;
        if (remaining <= 0) {
          progressText.innerHTML = '<strong>🎉 You\'ve unlocked free shipping!</strong>';
        } else {
          var dollars = (remaining / 100).toFixed(2);
          progressText.innerHTML = 'Add <strong>$' + dollars + '</strong> more to unlock free shipping!';
        }
      }
    }

    fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (cart) { updateProgress(cart.total_price); })
      .catch(function () { /* silently fail */ });
  })();

  // ============================================================
  // ANNOUNCEMENT BAR — Scrolling text on mobile (optional)
  // ============================================================

  (function initAnnouncementBar() {
    // Just ensures the bar is accessible and doesn't break
    var bar = qs('.announcement-bar');
    if (!bar) return;
    // Nothing more needed — bar is static and styled via CSS
  })();

  // ============================================================
  // ACCORDION (product page tabs)
  // ============================================================

  (function initAccordion() {
    // <details>/<summary> handles this natively.
    // This just adds smooth animation for unsupported browsers.
    qsa('.accordion-item details').forEach(function (details) {
      var summary = details.querySelector('summary');
      var content = details.querySelector('.accordion-content');
      if (!summary || !content) return;

      on(summary, 'click', function (e) {
        // Let native behavior handle open/close state
        // Optional: dispatch analytics event
      });
    });
  })();

  // ============================================================
  // LAZY LOADING IMAGES — native browser fallback
  // ============================================================

  (function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype) return; // natively supported

    // Polyfill: use IntersectionObserver
    var images = qsa('img[loading="lazy"]');
    if (!images.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(function (img) { observer.observe(img); });
  })();

  // ============================================================
  // CART ITEM QUANTITY UPDATE (inside cart drawer)
  // ============================================================

  (function initCartItemControls() {
    on(document, 'click', function (e) {
      var btn = e.target.closest('.cart-qty-btn');
      if (!btn) return;

      var item = btn.closest('.cart-item');
      if (!item) return;

      var lineKey = item.dataset.lineKey;
      if (!lineKey) return;

      var qtyEl = item.querySelector('.cart-qty-value');
      var currentQty = parseInt(qtyEl ? qtyEl.textContent : '1', 10);
      var action = btn.dataset.action;
      var newQty = action === 'minus' ? Math.max(0, currentQty - 1) : currentQty + 1;

      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lineKey, quantity: newQty })
      })
        .then(function (res) { return res.json(); })
        .then(function (cart) {
          if (qtyEl) qtyEl.textContent = newQty;
          document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cart.item_count } }));

          if (newQty === 0) {
            item.remove();
          }
        })
        .catch(function () { /* silently fail */ });
    });

    // Remove item
    on(document, 'click', function (e) {
      var removeBtn = e.target.closest('.cart-item-remove');
      if (!removeBtn) return;

      var item = removeBtn.closest('.cart-item');
      if (!item) return;

      var lineKey = item.dataset.lineKey;
      if (!lineKey) return;

      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lineKey, quantity: 0 })
      })
        .then(function (res) { return res.json(); })
        .then(function (cart) {
          item.remove();
          document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cart.item_count } }));
        })
        .catch(function () { /* silently fail */ });
    });
  })();

})();
