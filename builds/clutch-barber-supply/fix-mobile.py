#!/usr/bin/env python3
import re

files = [
    "preview-product.html",
    "preview-about.html", 
    "preview-contact.html",
    "preview-faq.html",
    "preview-cart.html"
]

menu_button = '''<button class="clutch-header__menu" aria-label="Open menu"><span></span><span></span><span></span></button>'''

mobile_nav = '''
<!-- MOBILE NAVIGATION DRAWER -->
<div class="clutch-mobile-nav" id="mobileNav">
  <div class="clutch-mobile-nav__header">
    <span class="clutch-mobile-nav__title">Menu</span>
    <button class="clutch-mobile-nav__close" id="closeMobileNav" aria-label="Close menu">
      <svg viewBox="0 0 24 24" width="24" height="24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>
    </button>
  </div>
  <nav class="clutch-mobile-nav__links">
    <a href="preview-collections.html">Shop</a>
    <a href="preview-brands.html">Brands</a>
    <a href="preview-about.html">About</a>
    <a href="preview-contact.html">Contact</a>
    <a href="preview-faq.html">FAQ</a>
  </nav>
  <div class="clutch-mobile-nav__footer">
    <a href="preview-cart.html" class="clutch-mobile-nav__cart">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 5h2l2.1 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L21 8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle></svg>
      Cart (2)
    </a>
  </div>
</div>
<div class="clutch-mobile-nav__overlay" id="mobileNavOverlay"></div>
'''

for fname in files:
    with open(fname, 'r') as f:
        content = f.read()
    
    # Add menu button before logo
    content = content.replace(
        '<a href="http://localhost:8765/preview-homepage-complete.html" class="clutch-header__logo">',
        menu_button + '<a href="http://localhost:8765/preview-homepage-complete.html" class="clutch-header__logo">'
    )
    
    # Add mobile nav after </header>
    content = content.replace(
        '</header>',
        '</header>' + mobile_nav
    )
    
    with open(fname, 'w') as f:
        f.write(content)
    
    print(f"Fixed {fname}")

print("\nAll files updated!")
