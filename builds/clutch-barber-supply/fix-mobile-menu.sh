#!/bin/bash
# Fix mobile menu on remaining pages

FILES="preview-product.html preview-about.html preview-contact.html preview-faq.html preview-cart.html"

for file in $FILES; do
  # Add mobile menu button before logo
  sed -i 's|<a href="http://localhost:8765/preview-homepage-complete.html" class="clutch-header__logo">|<button class="clutch-header__menu" aria-label="Open menu"><span></span><span></span><span></span></button><a href="http://localhost:8765/preview-homepage-complete.html" class="clutch-header__logo">|' "$file"
  
  # Add mobile nav drawer after </header>
  sed -i 's|</header>|</header>\n\n<!-- MOBILE NAVIGATION DRAWER -->\n<div class="clutch-mobile-nav" id="mobileNav">\n  <div class="clutch-mobile-nav__header">\n    <span class="clutch-mobile-nav__title">Menu</span>\n    <button class="clutch-mobile-nav__close" id="closeMobileNav" aria-label="Close menu">\n      <svg viewBox="0 0 24 24" width="24" height="24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>\n    </button>\n  </div>\n  <nav class="clutch-mobile-nav__links">\n    <a href="preview-collections.html">Shop</a>\n    <a href="preview-brands.html">Brands</a>\n    <a href="preview-about.html">About</a>\n    <a href="preview-contact.html">Contact</a>\n    <a href="preview-faq.html">FAQ</a>\n  </nav>\n  <div class="clutch-mobile-nav__footer">\n    <a href="preview-cart.html" class="clutch-mobile-nav__cart">\n      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 5h2l2.1 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L21 8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle></svg>\n      Cart (2)\n    </a>\n  </div>\n</div>\n<div class="clutch-mobile-nav__overlay" id="mobileNavOverlay"></div>|' "$file"
done

echo "Done"