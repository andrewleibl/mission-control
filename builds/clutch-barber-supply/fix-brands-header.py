#!/usr/bin/env python3

# Read the file
with open('preview-brands.html', 'r') as f:
    content = f.read()

# Add mobile menu button before logo
content = content.replace(
    '<a href="http://localhost:8765/preview-homepage-complete.html" class="clutch-header__logo">',
    '<button class="clutch-header__menu" aria-label="Open menu"><span></span><span></span><span></span></button><a href="preview-homepage-complete.html" class="clutch-header__logo">'
)

# Add mobile nav drawer after </header>
mobile_nav = '''</header>

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
    <a href="preview-classes.html">Classes</a>
    <a href="preview-contact.html">Contact</a>
    <a href="preview-faq.html">FAQ</a>
    <a href="preview-homepage-complete.html#reviews">Reviews</a>
  </nav>
  <div class="clutch-mobile-nav__footer">
    <a href="preview-cart.html" class="clutch-mobile-nav__cart">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 5h2l2.1 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L21 8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle></svg>
      Cart
    </a>
  </div>
</div>
<div class="clutch-mobile-nav__overlay" id="mobileNavOverlay"></div>
'''

content = content.replace('</header>', mobile_nav, 1)

# Add JavaScript before </body>
js = '''<script>
(function() {
  const menuBtn = document.querySelector('.clutch-header__menu');
  const mobileNav = document.getElementById('mobileNav');
  const closeBtn = document.getElementById('closeMobileNav');
  const overlay = document.getElementById('mobileNavOverlay');
  if (!menuBtn || !mobileNav) return;
  
  function openNav() {
    mobileNav.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeNav() {
    mobileNav.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  menuBtn.addEventListener('click', openNav);
  closeBtn.addEventListener('click', closeNav);
  overlay.addEventListener('click', closeNav);
})();
</script>

</body>'''

content = content.replace('</body>', js)

# Write back
with open('preview-brands.html', 'w') as f:
    f.write(content)

print("Fixed brands page!")
