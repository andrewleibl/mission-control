#!/usr/bin/env python3

# Read the file
with open('preview-supplies.html', 'r') as f:
    content = f.read()

# Check if already fixed
if 'clutch-header__menu' in content:
    print("Supplies page already has mobile menu")
    exit()

# Add mobile menu CSS before </style>
mobile_css = '''
    /* Mobile menu button */
    .clutch-header__menu { display: none; width: 2.5rem; height: 2.5rem; background: rgba(255,255,255,0.05); border: 1px solid var(--clutch-border); border-radius: 8px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
    .clutch-header__menu span { display: block; width: 18px; height: 2px; background: var(--clutch-text); border-radius: 2px; }
    /* Mobile Navigation Drawer */
    .clutch-mobile-nav { position: fixed; top: 0; left: 0; width: 280px; height: 100vh; background: var(--clutch-bg-light); border-right: 1px solid var(--clutch-border); z-index: 200; transform: translateX(-100%); transition: transform 0.3s ease; display: flex; flex-direction: column; }
    .clutch-mobile-nav.active { transform: translateX(0); }
    .clutch-mobile-nav__header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--clutch-border); }
    .clutch-mobile-nav__title { font-size: 1rem; font-weight: 600; color: var(--clutch-text); }
    .clutch-mobile-nav__close { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid var(--clutch-border); border-radius: 8px; color: var(--clutch-text); cursor: pointer; }
    .clutch-mobile-nav__links { flex: 1; padding: 1rem 0; display: flex; flex-direction: column; }
    .clutch-mobile-nav__links a { padding: 1rem 1.25rem; font-size: 1rem; font-weight: 500; color: var(--clutch-text); border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; }
    .clutch-mobile-nav__links a:hover { background: rgba(201,137,75,0.1); color: var(--clutch-accent); }
    .clutch-mobile-nav__footer { padding: 1rem 1.25rem; border-top: 1px solid var(--clutch-border); }
    .clutch-mobile-nav__cart { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: rgba(201,137,75,0.1); border: 1px solid var(--clutch-accent); border-radius: 8px; color: var(--clutch-accent); font-weight: 600; }
    .clutch-mobile-nav__overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 150; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
    .clutch-mobile-nav__overlay.active { opacity: 1; visibility: visible; }
    @media (max-width: 900px) { .clutch-header__menu { display: flex; } .clutch-header__nav { display: none; } }
'''

content = content.replace('</style>', mobile_css + '</style>')

# Add mobile menu button before logo
content = content.replace(
    '<a href="http://localhost:8765/preview-homepage-complete.html" class="clutch-header__logo">',
    '<button class="clutch-header__menu" aria-label="Open menu"><span></span><span></span><span></span></button><a href="preview-homepage-complete.html" class="clutch-header__logo">'
)

# Fix all localhost links
content = content.replace('href="http://localhost:8765/', 'href="')

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
    <a href="preview-supplies.html">Supplies</a>
    <a href="preview-classes.html">Classes</a>
    <a href="preview-contact.html">Contact</a>
    <a href="preview-faq.html">FAQ</a>
    <a href="preview-reviews.html">Reviews</a>
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
with open('preview-supplies.html', 'w') as f:
    f.write(content)

print("Fixed supplies page!")
