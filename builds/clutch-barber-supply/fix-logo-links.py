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
        continue
        
    with open(fname, 'r') as f:
        content = f.read()
    
    # Replace localhost links with relative links
    original = content
    content = content.replace(
        'href="http://localhost:8765/preview-homepage-complete.html"',
        'href="preview-homepage-complete.html"'
    )
    content = content.replace(
        'href="http://localhost:8765/preview-collections.html"',
        'href="preview-collections.html"'
    )
    content = content.replace(
        'href="http://localhost:8765/preview-brands.html"',
        'href="preview-brands.html"'
    )
    content = content.replace(
        'href="http://localhost:8765/preview-about.html"',
        'href="preview-about.html"'
    )
    content = content.replace(
        'href="http://localhost:8765/preview-contact.html"',
        'href="preview-contact.html"'
    )
    content = content.replace(
        'href="http://localhost:8765/preview-faq.html"',
        'href="preview-faq.html"'
    )
    content = content.replace(
        'href="http://localhost:8765/preview-cart.html"',
        'href="preview-cart.html"'
    )
    content = content.replace(
        'href="http://localhost:8765/preview-product.html"',
        'href="preview-product.html"'
    )
    
    if content != original:
        with open(fname, 'w') as f:
            f.write(content)
        print(f"Fixed links in {fname}")
    else:
        print(f"No localhost links in {fname}")

print("\nAll logo links now relative — will work through ngrok tunnel!")
