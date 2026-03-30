# Shop Page Updates — 2026-03-29 03:40 AM

## Changes Made

### Filter Updates
1. **"Backpacks | Trays"** — Changed from "Bags", filters for "backpack" OR "tray" in product titles
2. **Removed:** "Barber Clothing" and "Barber Poles" categories
3. **Accessories** — Uses product tags (products need "accessories" tag in Shopify admin)

### Bug Fixes
4. **In Stock Filter** — Fixed to check both `product.available` AND variant availability
5. **Price Filter** — Fixed conversion from dollars to cents (Shopify stores prices in cents)

### New Feature
6. **Dual-Handle Price Slider** — Drag two handles to set min/max price range ($0-$500)

## Files Modified
- `sections/collection-template.liquid` — Updated filter logic, added slider HTML and JS
- `assets/clutch-theme.css` — Added price slider styles

## How to Use Accessories Filter
In Shopify Admin:
1. Go to Products
2. Edit a product
3. Add tag: `accessories`
4. Save

The filter will find products with this tag.
