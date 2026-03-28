#!/usr/bin/env python3
import os
import re

files = [
    "preview-homepage-complete.html",
    "preview-collections.html",
    "preview-product.html",
    "preview-brands.html",
    "preview-about.html",
    "preview-contact.html",
    "preview-faq.html",
    "preview-cart.html"
]

for fname in files:
    if not os.path.exists(fname):
        print(f"Skipping {fname} - not found")
        continue
        
    with open(fname, 'r') as f:
        content = f.read()
    
    # Check if already has Reviews
    if '>Reviews</a>' in content:
        print(f"Reviews already exists in {fname}")
        continue
    
    # Pattern 1: Simple nav links (Shop, Brands, About, Contact, FAQ)
    # Add Reviews after FAQ in the main nav
    
    # Find the desktop nav section and add Reviews
    # Look for: <nav class="clutch-header__nav"> ... FAQ ... </nav>
    
    # Replace FAQ link followed by closing nav or dropdown
    if '<a href="preview-faq.html">FAQ</a>' in content:
        content = content.replace(
            '<a href="preview-faq.html">FAQ</a>\n        </nav>',
            '<a href="preview-faq.html">FAQ</a>\n          <a href="preview-homepage-complete.html#reviews">Reviews</a>\n        </nav>'
        )
        # Try different spacing
        content = content.replace(
            '<a href="preview-faq.html">FAQ</a>\n      </nav>',
            '<a href="preview-faq.html">FAQ</a>\n        <a href="preview-homepage-complete.html#reviews">Reviews</a>\n      </nav>'
        )
        # Try another pattern
        content = content.replace(
            '<a href="preview-faq.html">FAQ</a>\n        <a href="preview-cart.html"',
            '<a href="preview-faq.html">FAQ</a>\n        <a href="preview-homepage-complete.html#reviews">Reviews</a>\n        <a href="preview-cart.html"'
        )
        # And another
        content = content.replace(
            '<a href="preview-faq.html">FAQ</a>\n        <div style="display: flex',
            '<a href="preview-faq.html">FAQ</a>\n        <a href="preview-homepage-complete.html#reviews">Reviews</a>\n        <div style="display: flex'
        )
        print(f"Added Reviews to desktop nav in {fname}")
    
    with open(fname, 'w') as f:
        f.write(content)

print("\nDone!")
