# Product Tags — Clutch Barber Supply

*Structured tagging system for Shopify. Tags enable smart collections, search filtering, and future email segmentation. Apply all recommended tags to each product via Shopify Admin → Products → [Product] → Tags.*

---

## TAG TAXONOMY

### Brand Tags
`brand-babyliss` `brand-jrl` `brand-andis` `brand-wahl` `brand-stylecraft` `brand-gamma` `brand-supreme` `brand-level3` `brand-tomb45` `brand-cocco` `brand-oster` `brand-vincent` `brand-smash` `brand-rolda` `brand-morono` `brand-caliber` `brand-noclogg`

### Product Type Tags
`type-clipper` `type-trimmer` `type-shaver` `type-razor` `type-combo` `type-accessory` `type-maintenance` `type-charging` `type-cape` `type-bag` `type-chair` `type-light` `type-clothing` `type-pole` `type-class` `type-event` `type-hair-care`

### Price Range Tags
`price-under-50` `price-50-100` `price-100-200` `price-200-300` `price-over-300`

### Feature Tags
`cordless` `corded` `brushless-motor` `rotary-motor` `electromagnetic-motor` `zero-gap` `fade-blade` `combo-set` `fast-charge` `competition-grade` `authorized-dealer` `ce-class` `tdlr-approved` `masterclass` `new-arrival` `best-seller` `on-sale` `bundle`

---

## PRODUCT TAG LIST

### BaByliss Pro FXOne Lo Pro Clipper (FX829)
`brand-babyliss` `type-clipper` `cordless` `brushless-motor` `fade-blade` `zero-gap` `price-100-200` `best-seller` `authorized-dealer`

---

### JRL FF2020C Clipper
`brand-jrl` `type-clipper` `cordless` `brushless-motor` `fade-blade` `zero-gap` `competition-grade` `price-200-300` `best-seller` `authorized-dealer`

---

### StyleCraft Rebel 2.0 Clipper
`brand-stylecraft` `brand-gamma` `type-clipper` `cordless` `brushless-motor` `fade-blade` `zero-gap` `competition-grade` `price-200-300` `best-seller` `authorized-dealer`

---

### Caliber Pro Clipper and Trimmer Combo
`brand-caliber` `type-clipper` `type-trimmer` `type-combo` `combo-set` `cordless` `brushless-motor` `zero-gap` `fade-blade` `price-100-200` `best-seller` `authorized-dealer`

---

### Supreme Recharge Combo (Clipper + Trimmer)
`brand-supreme` `type-clipper` `type-trimmer` `type-combo` `combo-set` `cordless` `brushless-motor` `zero-gap` `price-200-300` `best-seller` `authorized-dealer`

---

### Andis Master Cordless Clipper (MLC)
`brand-andis` `type-clipper` `cordless` `rotary-motor` `fade-blade` `fast-charge` `price-200-300` `best-seller` `authorized-dealer`

---

### Wahl Senior Clipper
`brand-wahl` `type-clipper` `corded` `rotary-motor` `fade-blade` `price-100-200` `best-seller` `authorized-dealer`

---

### Morono Razor Handle
`brand-morono` `type-razor` `type-accessory` `price-50-100` `authorized-dealer`

---

### NoClogg 2.0
`brand-noclogg` `type-maintenance` `type-accessory` `price-under-50` `best-seller`

---

### Tomb45 Power Plug
`brand-tomb45` `type-charging` `type-accessory` `cordless` `price-under-50` `price-50-100` `best-seller`

---

### TDLR CE Shear Class
`type-class` `type-event` `ce-class` `tdlr-approved` `price-100-200` `brand-clutch`

---

### StyleCraft Master Class (includes Rebel 2.0 + Flex Trimmer)
`type-masterclass` `type-event` `type-class` `brand-stylecraft` `brand-gamma` `combo-set` `masterclass` `price-200-300` `brand-clutch`

---

## IMPLEMENTATION NOTES

1. **Apply tags in bulk via Shopify Admin** → Products → Select All → Bulk Edit → Tags
2. **Price range tags** should reflect the sale price (not compare-at) at the time of tagging. Update if price changes.
3. **`best-seller` tag** should only be applied to the 6–10 highest-selling SKUs. Use Shopify analytics to confirm.
4. **`on-sale` tag** is temporary — add when a sale is active, remove when it ends. Used to power a "Sale" smart collection.
5. **`new-arrival` tag** — add to any product within the first 30 days of listing. Remove after 30 days.
6. **Collections using tags** — Set up automatic collections in Shopify using rules like: "Product tag is equal to `brand-babyliss`" — this auto-populates brand pages without manual curation.

---

## SHOPIFY SMART COLLECTION RULES (Reference)

| Collection | Tag Rule |
|---|---|
| BaByliss Pro | tag = `brand-babyliss` |
| JRL | tag = `brand-jrl` |
| Andis | tag = `brand-andis` |
| Wahl | tag = `brand-wahl` |
| Gamma \| StyleCraft | tag = `brand-stylecraft` OR `brand-gamma` |
| All Clippers | tag = `type-clipper` |
| All Trimmers | tag = `type-trimmer` |
| Combos | tag = `type-combo` |
| Cordless Tools | tag = `cordless` |
| Best Sellers | tag = `best-seller` |
| On Sale | tag = `on-sale` |
| New Arrivals | tag = `new-arrival` |
| Under $100 | tag = `price-under-50` OR `price-50-100` |
| Competition Grade | tag = `competition-grade` |
