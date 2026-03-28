# Clutch Barber Supply — Home Page Structure
**Date:** March 24, 2026
**Status:** Sections 1-6 COMPLETE — Andrew Approved ✓

---

## Section 1: Sticky Header
- Logo (left)
- Search icon — expands to search input on click (center or right)
- Phone icon — click to call (right)
- Cart icon with item count badge (right)
- Hamburger menu for nav (mobile) / visible nav links (desktop)

---

## Section 2: Hero Section
- Full-width background (image or dark solid)
- Headline: "Professional Barber Supplies. Same-Day Pickup in Dallas."
- Subheadline: "Clipper parts, grooming tools, and barber essentials — in stock and ready when you are."
- Primary CTA: "Shop Now"
- Secondary CTA: "Visit Our Store"
- Trust bar below: Physical Location • TDLR-Approved Classes • Same-Day Local Pickup

---

## Section 3: Reviews Marquee
- Full-width, auto-scrolling left to right
- Google review quotes with star ratings
- Reviewer name + short quote
- "Verified on Google" badge
- Pauses on hover

---

## Section 4: Shop by Brand
- Headline: "Shop the Big Brands"
- Subheadline: "The brands barbers swear by, ready for pickup today"
- Logo grid: Gamma, JRL, Wahl, Babyliss Pro, Level 3, Andis
- "Shop All Brands" link below

---

## Section 5: Perfection Every Time
- Headline: "Perfection Every Time"
- Subheadline: "Fast shipping from Texas + 30-day returns on any damaged product. No hassle, no runaround."
- 6 Google review cards (name, star rating, quote, verified badge)

---

## Section 6: Featured Products
- 4 bestsellers in grid
- Product image, name, price
- "Quick Add" or "Add to Cart" button
- "View All Products" link

---

## Section 7: Trust Bar
- Strip above footer
- Icons + micro-copy:
  - Free Shipping Over $300
  - Ships from Texas
  - 30-Day Returns
  - Secure Checkout

---

## Section 8: Email Signup
- Headline: "Join the Shop"
- Subheadline: "New drops, restock alerts, and 10% off your first order."
- Email field only (no name required)
- Button: "Get 10% Off"
- Centered, single-column, light background

---

## Section 9: Footer
- Shop (categories)
- Support (shipping, returns, contact)
- Company (about, location)
- Newsletter signup

---

## Notes for Detail Phase
- Classes de-prioritized from main page (profitability uncertain)
- Mobile-first design essential (65%+ traffic)
- Color palette: Dark primary (black/navy), gold/copper accent, white text
- Hephaestus to handle vibe coding when Andrew signals

---

## Site Navigation Structure

### Main Navigation (Shop dropdown)
**By Category:**
- Clippers & Trimmers
- Replacement Parts & Guards
- Shears & Razors
- Grooming Products (pomades, tonics, etc.)
- Barber Tools (capes, brushes, sanitizers)
- Accessories (clips, combs, etc.)

**By Brand:**
- Gamma
- JRL
- Wahl
- Babyliss Pro
- Level 3
- Andis

### Category Page Structure
- Grid layout with filters
- **Filter sidebar (desktop) / slide-out panel (mobile):**
  - Brand (checkboxes: Andis, Wahl, Gamma, JRL, Babyliss Pro, Level 3)
  - Price ranges: Under $50 / $50-$100 / $100-$150 / $150+
  - Power Type: Corded / Cordless / Both
  - Availability: In Stock / Backorder
- Subcategory pills at top (if needed): "All | Cordless | Corded | Parts"
- Sort by: Featured, Price Low-High, Price High-Low
- Result count + "Clear All" button
- Breadcrumbs: Home > Category > Subcategory > Product

*Note: Filters appear on both Category and Brand pages*

### Breadcrumbs (Site-wide)
Present on all pages: Home > [Current Section/Category/Product]

---

## Design System (Finalized March 24, 2026)

### Colors
- **Primary Background:** #05070c (deep ink)
- **Secondary Background:** #091018 (navy)
- **Text Primary:** #f5efe3 (cream/off-white)
- **Text Muted:** #b5aa97 (warm gray)
- **Accent:** #c9894b (copper)
- **Accent Soft:** #e0b07d (light copper for hover states)

### Typography
- **Font:** DM Sans (Google Fonts)
- **Headlines:** Tight letter-spacing (-0.04em), large scale (clamp 2rem to 3.4rem)
- **Body:** 1rem base, 1.7 line-height
- **Eyebrows/Labels:** 0.76rem, 800 weight, 0.16em letter-spacing, uppercase

### Spacing
- **Section Padding:** 4rem mobile / 5rem tablet / 5.5rem desktop
- **Container Max-Width:** 1440px
- **Grid Gaps:** 0.9rem mobile / 1rem desktop

### Components
- **Cards:** 20-24px border radius, rgba(255,255,255,0.08) borders, subtle inner glow
- **Buttons (Primary):** Copper gradient, pill shape (999px radius), lift + glow on hover
- **Buttons (Ghost):** Transparent with white border, copper text on hover
- **Icons:** SVG stroke icons, 1.8 stroke-width, copper on hover

### Effects
- **Hover Lift:** translateY(-2px) on cards and buttons
- **Shadow:** 0 20px 60px rgba(0,0,0,0.55) for depth
- **Glow:** 0 0 22px rgba(201,137,75,0.18) for copper accents
- **Transitions:** 0.2s ease for all interactive elements

### Mobile-First Breakpoints
- **Mobile:** Default styles (< 768px)
- **Tablet:** min-width: 768px
- **Desktop:** min-width: 1024px

---

## Build Notes
- **Built By:** Hephaestus (GPT-5.3-Codex)
- **Directed By:** Andrew Leibl
- **Approved:** March 24, 2026, 3:27 AM CDT
- **Next Phase:** Sections 7-9 (Trust Bar, Email Signup, Footer)
