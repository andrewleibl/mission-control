#!/usr/bin/env python3
import re

files = [
    "preview-product.html",
    "preview-about.html", 
    "preview-contact.html",
    "preview-faq.html",
    "preview-cart.html"
]

mobile_css = '''
    /* Mobile Navigation Drawer */
    .clutch-mobile-nav {
      position: fixed;
      top: 0;
      left: 0;
      width: 280px;
      height: 100vh;
      background: var(--clutch-bg-light);
      border-right: 1px solid var(--clutch-border);
      z-index: 200;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .clutch-mobile-nav.active { transform: translateX(0); }
    .clutch-mobile-nav__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--clutch-border);
    }
    .clutch-mobile-nav__title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--clutch-text);
    }
    .clutch-mobile-nav__close {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--clutch-border);
      border-radius: 8px;
      color: var(--clutch-text);
      cursor: pointer;
    }
    .clutch-mobile-nav__links {
      flex: 1;
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
    }
    .clutch-mobile-nav__links a {
      padding: 1rem 1.25rem;
      font-size: 1rem;
      font-weight: 500;
      color: var(--clutch-text);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.2s;
    }
    .clutch-mobile-nav__links a:hover {
      background: rgba(201,137,75,0.1);
      color: var(--clutch-accent);
    }
    .clutch-mobile-nav__footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--clutch-border);
    }
    .clutch-mobile-nav__cart {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: rgba(201,137,75,0.1);
      border: 1px solid var(--clutch-accent);
      border-radius: 8px;
      color: var(--clutch-accent);
      font-weight: 600;
    }
    .clutch-mobile-nav__overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      z-index: 150;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .clutch-mobile-nav__overlay.active {
      opacity: 1;
      visibility: visible;
    }
    /* Mobile menu button */
    .clutch-header__menu {
      display: none;
      width: 2.5rem;
      height: 2.5rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--clutch-border);
      border-radius: 8px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      margin-right: 0.75rem;
    }
    .clutch-header__menu span {
      display: block;
      width: 18px;
      height: 2px;
      background: var(--clutch-text);
      border-radius: 2px;
    }
    @media (max-width: 900px) {
      .clutch-header__menu { display: flex; }
      .clutch-header__nav { display: none; }
    }
'''

mobile_js = '''<script>
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
'''

for fname in files:
    with open(fname, 'r') as f:
        content = f.read()
    
    # Check if mobile CSS already exists
    if '.clutch-mobile-nav' not in content:
        # Add CSS before </style>
        content = content.replace('</style>', mobile_css + '</style>')
        print(f"Added CSS to {fname}")
    
    # Check if JS already exists  
    if 'mobileNav' not in content or 'getElementById("mobileNav")' not in content:
        # Add JS before </body>
        content = content.replace('</body>', mobile_js + '</body>')
        print(f"Added JS to {fname}")
    
    with open(fname, 'w') as f:
        f.write(content)

print("\nAll files complete!")
