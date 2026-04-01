## [LRN-20250329-001] Shopify Cart Upsell Randomization - Pattern

**Logged**: 2026-03-29T23:06:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
Attempted multiple approaches to randomize cart upsell products in Shopify. Final working solution: render 10 products in Liquid (hidden), shuffle with JavaScript, show first 3.

### Details
**Problem**: User wanted 3 random products in "Complete Your Setup" section. Attempted:

1. **Liquid `| shuffle` filter** — Doesn't exist in Shopify
2. **Complex JSON + JS shuffle** — Container IDs mismatched, DOM not found
3. **Simple Liquid loop (first 3)** — Works but not randomized
4. **✅ FINAL SOLUTION**: Render 10 products with `display: none`, JS shuffles DOM nodes, reveals 3 random

**Why other approaches failed:**
- JSON serialization in Liquid is fragile with quotes/escaping
- JavaScript looking for IDs that didn't exist in DOM
- Timing issues with DOM ready vs script execution

### Working Pattern (Final)

**Liquid:**
```liquid
{% assign cart_handles = cart.items | map: 'product' | map: 'handle' %}
{% assign upsell_count = 0 %}

{% for prod in collections.all.products limit: 50 %}
  {% if upsell_count < 10 %}
    {% unless cart_handles contains prod.handle %}
      {% if prod.available %}
        {% if upsell_count == 0 %}
<div class="cart-upsell" id="upsell-section">
  <div class="upsell-header">...</div>
  <div class="upsell-products" id="upsell-pool">
        {% endif %}
    <div class="upsell-product" style="display: none;">
      <!-- product HTML -->
    </div>
        {% assign upsell_count = upsell_count | plus: 1 %}
      {% endif %}
    {% endunless %}
  {% endif %}
{% endfor %}

{% if upsell_count > 0 %}
  </div>
</div>
{% endif %}
```

**JavaScript:**
```javascript
(function() {
  var pool = document.getElementById('upsell-pool');
  if (!pool) return;
  
  var products = Array.from(pool.querySelectorAll('.upsell-product'));
  if (products.length === 0) return;
  
  // Fisher-Yates shuffle
  for (var i = products.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = products[i];
    products[i] = products[j];
    products[j] = temp;
  }
  
  // Show first 3
  products.forEach(function(prod, index) {
    prod.style.display = index < 3 ? '' : 'none';
  });
})();
```

### Key Lessons
1. **Shopify Liquid has no `| shuffle`** — must use JS
2. **Render more than you show** — gives randomization pool
3. **Use DOM shuffling, not re-rendering** — avoids ID/sync issues
4. **Fisher-Yates is the standard shuffle algorithm** — unbiased, O(n)

### Suggested Action
Use this pattern for any Shopify randomization needs. Don't try to generate JSON in Liquid for complex objects — render HTML hidden, manipulate DOM.

### Metadata
- Source: user_feedback
- Related Files: templates/cart.liquid
- Tags: shopify, liquid, javascript, randomization, cart-upsells
- Pattern-Key: shopify.randomize-products
- Recurrence-Count: 1
- First-Seen: 2026-03-29
- Last-Seen: 2026-03-29

---

## [LRN-20250329-002] Shopify Section Template Validation Errors

**Logged**: 2026-03-29T22:37:00Z
**Priority**: critical
**Status**: resolved
**Area**: frontend

### Summary
Multiple upload failures due to `'cart-template' is not a valid section type` and `Could not find asset snippets/ecom_footer.liquid`. Final solution: bypass sections entirely, put code in direct template file.

### Details
**Errors encountered:**
1. `'cart-template' is not a valid section type` — Section name rejected
2. `'main-cart' is not a valid section type` — Even renamed section failed
3. Schema validation errors — Complex settings schemas rejected
4. Missing snippet errors — `ecom_footer.liquid` not found

**Attempted fixes:**
- Rename section files (cart-template → main-cart → cart → clutch-cart)
- Simplify schema to minimal `{ "name": "...", "settings": [] }`
- Create placeholder snippets for missing files
- All failed or caused cascading errors

**✅ FINAL SOLUTION**: Move all code from `sections/cart.liquid` to `templates/cart.liquid` directly. No `{% section %}` tag. No schema. Just pure Liquid + HTML + CSS + JS in the template.

### Why This Works
Shopify's section system has strict validation:
- Section names with hyphens can fail
- Complex schemas require specific structure
- Section files must be perfectly formed or whole theme rejects

Templates have no such restrictions. Direct template = no validation layer = just works.

### Pattern
**Instead of:**
```
sections/cart.liquid (with schema)
templates/cart.liquid → {% section 'cart' %}
```

**Do:**
```
templates/cart.liquid → All code inline
```

### Trade-offs
| Approach | Pros | Cons |
|----------|------|------|
| Section | Reusable, theme editor settings | Validation strict, complex |
| Direct Template | No validation, simple, reliable | Not reusable, no theme editor |

**Verdict**: For complex custom pages (cart, product), use direct templates. For reusable components (header, footer), use sections.

### Metadata
- Source: error
- Related Files: templates/cart.liquid, sections/cart.liquid
- Tags: shopify, sections, validation, templates, deployment
- Pattern-Key: shopify.avoid-sections-for-custom-pages
- Recurrence-Count: 1
- First-Seen: 2026-03-29
- Last-Seen: 2026-03-29

---

---

## [LRN-20250330-001] Mobile CSS Specificity Wars & aspect-ratio Trap

**Logged**: 2026-03-30T01:31:00Z
**Priority**: critical
**Status**: resolved
**Area**: frontend

### Summary
Spent 6+ hours debugging mobile product images that overflowed screen. Root cause: `aspect-ratio: 1` on desktop created square box that didn't scale to mobile.

### Solution
```css
@media (max-width: 768px) {
  .product-gallery__main {
    aspect-ratio: auto !important;  /* BREAK THE SQUARE */
    max-height: none !important;
    width: 100% !important;
  }
  .product-gallery__main img {
    width: 100% !important;
    height: auto !important;
  }
}
```

### Key Lessons
1. **`aspect-ratio` is dangerous on mobile** - Creates fixed-size boxes
2. **Break the constraint, don't fight it** - `aspect-ratio: auto` removes the prison
3. **Test with edge case images** - Wide vs square exposes bugs

### Pattern-Key: css.mobile-aspect-ratio-fix

---

## [LRN-20250330-002] Collection Page JavaScript Loading Pattern

**Logged**: 2026-03-30T01:31:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
Collection page showed "0 products" even though Liquid rendered them. JavaScript `allProducts` array was empty.

### Solution
```javascript
function applyFilters() {
  if (allProducts.length === 0) {
    allProducts = extractProductsFromDom();  // Fallback to server HTML
    filteredProducts = [...allProducts];
  }
  // Filter logic...
}
```

### Key Lessons
1. **Server-rendered HTML is source of truth**
2. **AJAX is enhancement, not requirement**
3. **Always have DOM fallback**

### Pattern-Key: shopify.collection-dom-fallback

---

## [LRN-20250330-003] Brand Filter URL Parameter Matching

**Logged**: 2026-03-30T01:31:00Z
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
Brand links on homepage didn't auto-select filters on collection page.

### The Problem
- URL: `?vendor=Babyliss%20Pro` (display name)
- Checkbox: `value="babyliss-pro"` (kebab-case)

### Solution
```javascript
const vendorName = urlParams.get('vendor'); // "Babyliss Pro"
const checkbox = document.querySelector(`input[data-vendor="${vendorName}"]`);
```

### Key Lessons
1. **URL parameters use display names**
2. **Input values use kebab-case**
3. **Use data attributes for matching**

### Pattern-Key: shopify.brand-filter-matching
