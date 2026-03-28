# Clutch Barber Supply - Shopify Theme

## Theme Structure

This is a complete Shopify theme ready for upload and use.

## Installation

1. Zip the `shopify-theme` folder contents (not the folder itself)
2. Go to Shopify Admin > Online Store > Themes
3. Click "Upload theme" and select the zip file
4. Publish when ready

## Setup Instructions

### 1. Create Collections

Create collections for each category:
- Clippers
- Trimmers  
- Shavers
- Barber Bags | Cases
- Lights
- Accessories
- Capes
- Barber Chairs
- Barber Clothing
- Barber Poles

### 2. Add Products

Add products and assign them to:
- **Collections** (categories above)
- **Vendor** (brands: Andis, Babyliss Pro, etc.)

### 3. Configure Navigation

Go to Online Store > Navigation:

**Main Menu (Header)**:
- Shop → /collections/all
- Brands (with submenu)
  - Andis
  - Babyliss Pro
  - JRL
  - Wahl
  - Gamma | Style Craft
  - Supreme Trimmers
  - Level 3
  - Cocco Hair Pro
  - Oster
  - Tomb45
  - Vincent
  - OG Walker
  - Smash
  - Rolda
- Supplies (with submenu)
  - Clippers
  - Trimmers
  - Shavers
  - Barber Bags | Cases
  - Lights
  - Accessories
  - Capes
  - Barber Chairs
  - Barber Clothing
  - Barber Poles
- About → /pages/about
- Contact → /pages/contact
- FAQ → /pages/faq

### 4. Customize Theme

Go to Customize theme to:
- Upload your logo
- Set brand colors
- Add hero image
- Configure announcement bar
- Add brand logos to homepage grid

### 5. Homepage Sections

The homepage includes:
1. Announcement bar
2. Header with dropdown menus
3. Hero section
4. Featured products
5. Reviews section
6. Brands grid
7. Trust bar
8. Newsletter signup
9. Footer

## File Structure

```
shopify-theme/
├── assets/
│   └── clutch-theme.css       # Main theme styles
├── config/
│   └── settings_schema.json   # Theme settings
├── layout/
│   └── theme.liquid           # Main layout
├── sections/
│   ├── announcement-bar.liquid
│   ├── cart-template.liquid
│   ├── collection-template.liquid
│   ├── footer.liquid
│   ├── header.liquid
│   ├── hero.liquid
│   ├── featured-products.liquid
│   └── product-template.liquid
├── snippets/
│   └── meta-tags.liquid
├── templates/
│   ├── cart.liquid
│   ├── collection.liquid
│   ├── index.liquid
│   ├── page.liquid
│   └── product.liquid
└── README.md
```

## Features

- Responsive design
- Dropdown navigation menus
- Working product filters
- Real cart functionality
- Dynamic product loading from Shopify
- Quick add to cart
- Price filtering
- Mobile-friendly

## Notes

- Product images should be square (1:1 ratio) for best display
- Brand logos should be transparent PNGs
- Hero image should be 1920x1080 or larger
