# Collections Structure — Clutch Barber Supply

*Recommended Shopify collection architecture. Includes manual and smart collection setup instructions.*

---

## NAVIGATION COLLECTIONS (Primary Nav)

These are the collections that appear in the main navigation and drive the most traffic.

---

### 1. Best Sellers
**Handle:** `best-sellers`
**Type:** Manual (curate top products)
**Description (for SEO/collection page):**
The clippers, trimmers, and tools that stay in demand. Curated from our top-selling products — these are what barbers across Texas are putting on their stations.
**Products to include:**
- BaByliss Pro FXOne Lo Pro Clipper
- JRL FF2020C Clipper
- StyleCraft Rebel 2.0 Clipper
- Caliber Pro Combo
- Supreme Recharge Combo
- Andis Master Cordless
- Wahl Senior Clipper
- Tomb45 Power Plug
- NoClogg 2.0
- Morono Razor Handle

---

### 2. Clippers
**Handle:** `clippers-trimmers-1` *(existing — keep handle for SEO)*
**Type:** Smart — tag = `type-clipper`
**Description:**
Professional-grade cordless and corded clippers from BaByliss Pro, JRL, Andis, Wahl, Gamma | StyleCraft, and more. Every clipper we carry is sourced from authorized distributors — valid warranties, authentic product, shop-ready performance.
**Products (current inventory + future adds):**
- BaByliss Pro FXOne Lo Pro
- JRL FF2020C
- StyleCraft Rebel 2.0
- Caliber Pro Clipper (from combo)
- Supreme Recharge Clipper (from combo)
- Andis Master Cordless
- Wahl Senior
- Any future clipper SKUs

---

### 3. Trimmers
**Handle:** `trimmers` *(existing)*
**Type:** Smart — tag = `type-trimmer`
**Description:**
Precision trimmers built for lining, edging, fades, and detail work. Whether you're cleaning up a neckline or cutting a competition-sharp edge, these are the professional tools for the job.
**Products:**
- Caliber Pro Trimmer (from combo, also list as standalone if SKU exists)
- Supreme Recharge Trimmer
- Any JRL, BaByliss, or Andis trimmer SKUs
- TPOB Play Trimmer Blue

---

### 4. Combos & Kits
**Handle:** `combos-kits`
**Type:** Smart — tag = `type-combo`
**Description:**
Complete clipper and trimmer pairs in a single package. The efficient way to upgrade your full kit — matched tools, unified performance, one order.
**Products:**
- Caliber Pro Clipper and Trimmer Combo
- Supreme Recharge Combo
- BaByliss Pro combo sets (if stocked)
- Any future bundle SKUs

---

### 5. Accessories
**Handle:** `accessories` *(existing)*
**Type:** Smart — tag = `type-accessory`
**Description:**
Everything that keeps your station running — blade oil, cleaning spray, neck strips, capes, barber bags, and more. The essentials barbers restock on every order.
**Products:**
- NoClogg 2.0
- Tomb45 Power Plug
- Morono Razor Handle
- Blade oil
- Neck strips
- Any other accessories

---

### 6. Barber Bags & Cases
**Handle:** `bags-cases` *(existing)*
**Type:** Smart — tag = `type-bag`
**Description:**
Professional-grade barber bags and tool cases to keep your kit organized, protected, and ready to travel. Whether you're working your home shop or doing on-location cuts, carry your tools right.

---

### 7. Shavers
**Handle:** `shavers` *(existing)*
**Type:** Smart — tag = `type-shaver`
**Description:**
Professional foil and rotary shavers for skin-close shaves and head shaving services. Smooth, safe, and built for the shop floor.

---

### 8. Capes
**Handle:** `capes` *(existing)*
**Type:** Smart — tag = `type-cape`
**Description:**
Professional barber capes in multiple styles — client protection that looks as clean as it performs.

---

### 9. Barber Chairs
**Handle:** `mckinley-barbara-tear` *(existing — consider renaming to `barber-chairs`)*
**Type:** Manual
**Description:**
Commercial-grade barber chairs built for daily professional use. Tear-resistant upholstery, hydraulic lift, and a look that elevates any shop floor.
*Note: Rename handle to `barber-chairs` for cleaner SEO/URL — redirect old handle.*

---

### 10. Barber Clothing
**Handle:** `barber-clothing` *(existing)*
**Type:** Smart — tag = `type-clothing`
**Description:**
Shop aprons, barber jackets, and professional wear. Look sharp on both sides of the chair.

---

### 11. LED Ring Lights
**Handle:** `led-ring-light` *(existing)*
**Type:** Manual
**Description:**
Professional LED ring lights for barber stations — even lighting for cuts, consultations, and the kind of content that actually performs on Instagram.

---

### 12. Barber Poles
**Handle:** `barber-poles` *(existing)*
**Type:** Manual
**Description:**
Classic and modern barber poles to mark your shop. The original symbol of the trade — in electric or traditional styles.

---

## BRAND COLLECTIONS

*One collection per major brand. Set as smart collections using brand tags. These power the "Shop by Brand" navigation.*

| Collection Name | Handle | Tag Rule |
|---|---|---|
| BaByliss Pro | `babyliss` | `brand-babyliss` |
| JRL | `jrl` | `brand-jrl` |
| Andis | `andis` | `brand-andis` |
| Wahl | `wahl` | `brand-wahl` |
| Gamma \| StyleCraft | `gamma` | `brand-stylecraft` OR `brand-gamma` |
| Supreme Trimmers | `supreme-trimmers` | `brand-supreme` |
| Level 3 | `l3vel-3` | `brand-level3` |
| Tomb45 | `tomb-45` | `brand-tomb45` |
| Cocco Hair Pro | `cocco-hyper-veloce-pro-trimmer-green` *(rename to `cocco`)* | `brand-cocco` |
| Oster | `oster` | `brand-oster` |
| Vincent | `vincent` | `brand-vincent` |
| OG Walker | `og-walker-products` | `brand-ogwalker` |
| Smash | `smash` | `brand-smash` |
| Rolda | `rolda` | `brand-rolda` |

---

## UTILITY COLLECTIONS

*These collections are for homepage modules, deals, and marketing — not primary nav.*

---

### New Arrivals
**Handle:** `new-arrivals`
**Type:** Smart — tag = `new-arrival`
**Description:** Just landed. New tools, new brands, new inventory — added in the last 30 days.

---

### On Sale
**Handle:** `sale`
**Type:** Smart — tag = `on-sale` (or use Shopify rule: compare_at_price > 0)
**Description:** Current deals and discounted items. Updated regularly — check back often.
*Note: Replace seasonal product titles (Christmas Deal, Feb 2026 Deal) with permanent product names. Add `on-sale` tag while the deal is active; remove when it ends.*

---

### Competition Grade
**Handle:** `competition-grade`
**Type:** Smart — tag = `competition-grade`
**Description:** The clippers and trimmers barbers bring to the floor when it counts. Competition-tested, competition-trusted.
**Products:** JRL FF2020C, StyleCraft Rebel 2.0, any competition clipper SKUs

---

### Events & Classes
**Handle:** `clutch-events` *(existing)*
**Type:** Manual
**Description:** In-person education, masterclasses, and TDLR continuing education for Texas barbers. Expand your skills at the source.
**Products:**
- TDLR CE Shear Class
- StyleCraft Master Class

---

## COLLECTION PAGE COPY NOTES

1. **Every collection page needs a title, description, and banner image.** Currently most are empty. Prioritize: Best Sellers, Clippers, Trimmers, and all Brand pages.
2. **Sort order:** Set Best Sellers and brand pages to sort by "Best Selling" by default. Sort new arrivals by "Newest First."
3. **SEO:** Each collection description is crawled by Google. Include the brand name, product type, and "authorized dealer" language in brand collection descriptions for local/search SEO.
