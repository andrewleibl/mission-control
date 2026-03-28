#!/usr/bin/env python3
import os

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
    
    # Add Reviews link to desktop nav (after FAQ or before Contact)
    if 'href="preview-faq.html">FAQ</a>' in content and '>Reviews</a>' not in content:
        content = content.replace(
            'href="preview-faq.html">FAQ</a>',
            'href="preview-faq.html">FAQ</a><a href="preview-homepage-complete.html#reviews">Reviews</a>'
        )
        print(f"Added Reviews to desktop nav in {fname}")
    
    # Add Reviews link to mobile nav (after FAQ link)
    if 'clutch-mobile-nav__links' in content:
        if '>Reviews</a>' not in content or 'preview-homepage-complete.html#reviews' not in content:
            content = content.replace(
                '<a href="preview-faq.html">FAQ</a>\n  </nav>',
                '<a href="preview-faq.html">FAQ</a>\n    <a href="preview-homepage-complete.html#reviews">Reviews</a>\n  </nav>'
            )
            content = content.replace(
                '<a href="preview-faq.html">FAQ</a>\n    <a href="preview-cart.html"',
                '<a href="preview-faq.html">FAQ</a>\n    <a href="preview-homepage-complete.html#reviews">Reviews</a>\n    <a href="preview-cart.html"'
            )
            # Try another pattern
            content = content.replace(
                '<a href="preview-faq.html">FAQ</a>\n  </div>',
                '<a href="preview-faq.html">FAQ</a>\n    <a href="preview-homepage-complete.html#reviews">Reviews</a>\n  </div>'
            )
            print(f"Added Reviews to mobile nav in {fname}")
    
    with open(fname, 'w') as f:
        f.write(content)

print("\nAll files updated!")
