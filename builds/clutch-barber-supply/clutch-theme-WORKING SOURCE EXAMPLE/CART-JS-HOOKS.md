# Clutch Cart — JavaScript Integration Guide

> This document maps exactly where JavaScript hooks need to go for real-time cart updates.
> Current state: Static Liquid template (works on page load)
> Enhancement path: Client-side interactivity via Shopify AJAX Cart API

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  LIQUID TEMPLATE (Server-rendered on load)            │
│  - Free shipping threshold calculation                  │
│  - Subtotal/total display                               │
│  - Savings calculations                                 │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  JAVASCRIPT LAYER (Client-side updates)                 │
│  - Listen for cart changes                              │
│  - Recalculate values                                   │
│  - Update DOM without reload                            │
└─────────────────────────────────────────────────────────┘
```

---

## Hook #1: Free Shipping Progress Bar

### Current State (Liquid)
**File:** `sections/cart-template.liquid` (lines 27-58)

```liquid
<div class="cart-shipping-bar" data-free-shipping-threshold="30000">
  {% assign threshold = 30000 %}
  {% assign remaining = threshold | minus: cart.total_price %}
  {% assign percent = cart.total_price | times: 100 | divided_by: threshold %}
  
  <div class="shipping-progress-fill" style="width: {{ percent | at_most: 100 }}%"></div>
</div>
```

### JavaScript Enhancement Needed

**Event to Listen For:**
- `cart:updated` (Shopify's built-in event)
- Custom AJAX response after quantity change

**DOM Elements to Update:**
```javascript
// 1. Progress bar width
const progressFill = document.querySelector('.shipping-progress-fill');

// 2. Progress text message
const shippingMessage = document.querySelector('.shipping-message');

// 3. Current value marker position
const thresholdMarker = document.querySelector('.threshold-marker');
```

**Calculation Logic:**
```javascript
function updateShippingBar(cartTotalCents) {
  const THRESHOLD = 30000; // $300 in cents
  const percent = Math.min((cartTotalCents / THRESHOLD) * 100, 100);
  const remaining = Math.max(THRESHOLD - cartTotalCents, 0);
  
  // Update progress bar
  progressFill.style.width = `${percent}%`;
  
  // Update marker position
  thresholdMarker.style.left = `${percent}%`;
  thresholdMarker.textContent = `$${(cartTotalCents / 100).toFixed(2)}`;
  
  // Toggle message state
  if (cartTotalCents >= THRESHOLD) {
    shippingMessage.innerHTML = `
      <svg>...</svg>
      <span>🎉 You've unlocked FREE shipping!</span>
    `;
    shippingMessage.classList.add('shipping-unlocked');
  } else {
    shippingMessage.innerHTML = `
      <svg>...</svg>
      <span>Add <strong>$${(remaining / 100).toFixed(2)}</strong> more for FREE shipping</span>
    `;
    shippingMessage.classList.remove('shipping-unlocked');
  }
}
```

---

## Hook #2: Line Item Quantity Updates

### Current State (Liquid)
**File:** `sections/cart-template.liquid` (lines 94-103)

```liquid
<div class="cart-quantity">
  <button type="button" class="cart-quantity-btn cart-quantity-minus" data-line="1">...</button>
  <input type="number" name="updates[]" value="{{ item.quantity }}" data-line="1">
  <button type="button" class="cart-quantity-btn cart-quantity-plus" data-line="1">...</button>
</div>
```

### JavaScript Enhancement Needed

**Event Listeners to Add:**
```javascript
// Plus/minus button clicks
document.querySelectorAll('.cart-quantity-btn').forEach(btn => {
  btn.addEventListener('click', handleQuantityChange);
});

// Direct input changes
document.querySelectorAll('.cart-quantity-input').forEach(input => {
  input.addEventListener('change', handleQuantityChange);
});
```

**Shopify AJAX Update Pattern:**
```javascript
async function updateCartItem(line, quantity) {
  const response = await fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ line, quantity })
  });
  
  const cart = await response.json();
  
  // Update ALL dynamic elements
  updateShippingBar(cart.total_price);
  updateCartTotals(cart);
  updateLinePrices(cart);
  
  return cart;
}
```

---

## Hook #3: Cart Totals (Subtotal, Savings, Tax, Shipping)

### Current State (Liquid)
**File:** `sections/cart-template.liquid` (lines 155-195)

```liquid
<div class="summary-row">
  <span>Subtotal</span>
  <span>{{ cart.items_subtotal_price | money }}</span>
</div>

<div class="summary-row summary-total">
  <span>Estimated Total</span>
  <span class="summary-total-amount">{{ cart.total_price | money }}</span>
</div>
```

### JavaScript Enhancement Needed

**DOM Elements to Update:**
```javascript
// All need data attributes for targeting
const subtotalEl = document.querySelector('[data-cart-subtotal]');
const discountEl = document.querySelector('[data-cart-discount]');
const totalEl = document.querySelector('[data-cart-total]');
const stickyTotalEl = document.querySelector('.sticky-amount');
```

**Update Function:**
```javascript
function updateCartTotals(cart) {
  // Format money helper (matches Shopify's format)
  const formatMoney = (cents) => {
    return '$' + (cents / 100).toFixed(2);
  };
  
  // Update subtotal
  if (subtotalEl) subtotalEl.textContent = formatMoney(cart.items_subtotal_price);
  
  // Update discount (if present)
  const totalDiscount = cart.items.reduce((sum, item) => {
    return sum + (item.original_line_price - item.final_line_price);
  }, 0);
  
  if (discountEl && totalDiscount > 0) {
    discountEl.textContent = `-${formatMoney(totalDiscount)}`;
    discountEl.closest('.summary-discount').style.display = 'flex';
  } else if (discountEl) {
    discountEl.closest('.summary-discount').style.display = 'none';
  }
  
  // Update total
  if (totalEl) totalEl.textContent = formatMoney(cart.total_price);
  if (stickyTotalEl) stickyTotalEl.textContent = formatMoney(cart.total_price);
  
  // Toggle savings banner
  const savingsBanner = document.querySelector('.summary-savings-banner');
  if (savingsBanner) {
    if (totalDiscount > 0) {
      savingsBanner.querySelector('span').textContent = `You're saving ${formatMoney(totalDiscount)}!`;
      savingsBanner.style.display = 'flex';
    } else {
      savingsBanner.style.display = 'none';
    }
  }
}
```

---

## Hook #4: Remove Item Without Reload

### Current State (Liquid)
**File:** `sections/cart-template.liquid` (lines 77-81)

```liquid
<a href="{{ item.url_to_remove }}" class="cart-item-remove" data-line="{{ forloop.index }}">
  <svg>...</svg>
</a>
```

### JavaScript Enhancement Needed

**Prevent Default + AJAX Remove:**
```javascript
document.querySelectorAll('.cart-item-remove').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const line = btn.dataset.line;
    
    // Shopify AJAX remove = set quantity to 0
    const cart = await updateCartItem(line, 0);
    
    // Remove item from DOM with animation
    const itemRow = btn.closest('.cart-item');
    itemRow.style.opacity = '0';
    itemRow.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      itemRow.remove();
      
      // If cart is now empty, show empty state
      if (cart.item_count === 0) {
        location.reload(); // Or inject empty cart HTML
      }
    }, 300);
  });
});
```

---

## Hook #5: Smart Product Upsells

### Current State (Liquid)
**File:** `sections/cart-template.liquid` (lines 120-145)

Currently uses static product handles:
```liquid
{% assign upsell_handles = 'blade-guard,oil,cleaning-brush' | split: ',' %}
```

### JavaScript Enhancement Needed

**Dynamic Upsell Strategy:**

1. **Store product relationships in metafields:**
```
Product: Gamma+ X-Evo Clipper
Metafield: custom.cart_upsells = "clipper-oil,fade-comb,blade-guard"
```

2. **Fetch related products based on cart contents:**
```javascript
async function fetchUpsells(cart) {
  const upsellIds = new Set();
  
  // Get upsell IDs from each cart item's metafields
  for (const item of cart.items) {
    const response = await fetch(`/products/${item.handle}.js`);
    const product = await response.json();
    
    if (product.metafields && product.metafields.custom.cart_upsells) {
      product.metafields.custom.cart_upsells.split(',').forEach(id => {
        if (!cart.items.find(i => i.handle === id)) {
          upsellIds.add(id);
        }
      });
    }
  }
  
  // Render upsell cards
  renderUpsellCards(Array.from(upsellIds).slice(0, 3));
}
```

3. **One-click add to cart:**
```javascript
document.querySelectorAll('.upsell-add').forEach(btn => {
  btn.addEventListener('click', async () => {
    const variantId = btn.dataset.variantId;
    
    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
    });
    
    // Refresh cart data and UI
    const cartResponse = await fetch('/cart.js');
    const cart = await cartResponse.json();
    updateAllCartElements(cart);
  });
});
```

---

## Hook #6: Social Proof Counter (Dynamic)

### Current State (Static)
```liquid
<div class="cart-social-proof">
  <strong>23 barbers</strong> bought from Clutch today
</div>
```

### JavaScript Enhancement Options

**Option A: Time-based rotation (no backend needed)**
```javascript
const socialProofMessages = [
  { count: 23, text: 'barbers bought from Clutch today' },
  { count: 156, text: 'orders shipped this week' },
  { count: 8, text: 'people viewing this right now' }
];

let currentMessage = 0;
setInterval(() => {
  const proof = socialProofMessages[currentMessage];
  document.querySelector('.cart-social-proof p').innerHTML = 
    `<strong>${proof.count} ${proof.text}</strong>`;
  currentMessage = (currentMessage + 1) % socialProofMessages.length;
}, 5000);
```

**Option B: Real order count (requires custom app/metafield)**
```javascript
// Fetch from a custom endpoint that returns daily order count
const response = await fetch('/apps/clutch/social-proof');
const data = await response.json();
document.querySelector('.cart-social-proof strong').textContent = 
  `${data.todayOrders} barbers`;
```

---

## Complete Integration Script

**Create file:** `assets/cart-interactivity.js`

```javascript
/**
 * Clutch Cart Interactivity
 * Enhances static Liquid cart with real-time updates
 */

(function() {
  'use strict';
  
  const CONFIG = {
    freeShippingThreshold: 30000, // cents
    selectors: {
      cartForm: '.cart-form',
      quantityInputs: '.cart-quantity-input',
      quantityBtns: '.cart-quantity-btn',
      removeBtns: '.cart-item-remove',
      upsellAddBtns: '.upsell-add',
      progressFill: '.shipping-progress-fill',
      shippingMessage: '.shipping-message',
      thresholdMarker: '.threshold-marker',
      subtotal: '[data-cart-subtotal]',
      discount: '[data-cart-discount]',
      total: '[data-cart-total]',
      stickyTotal: '.sticky-amount'
    }
  };
  
  // Money formatting helper
  const formatMoney = (cents) => '$' + (cents / 100).toFixed(2);
  
  // Initialize
  function init() {
    bindQuantityButtons();
    bindRemoveButtons();
    bindUpsellButtons();
    bindDirectInput();
  }
  
  // Update cart via Shopify AJAX
  async function updateCart(line, quantity) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line, quantity })
      });
      
      if (!response.ok) throw new Error('Cart update failed');
      
      const cart = await response.json();
      updateUI(cart);
      
      // Dispatch custom event for other scripts
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
      
      return cart;
    } catch (error) {
      console.error('Cart update error:', error);
      // Optionally show error toast
    }
  }
  
  // Update all dynamic UI elements
  function updateUI(cart) {
    updateShippingBar(cart.total_price);
    updateTotals(cart);
    updateLinePrices(cart);
  }
  
  // Update shipping progress bar
  function updateShippingBar(totalCents) {
    const fill = document.querySelector(CONFIG.selectors.progressFill);
    const message = document.querySelector(CONFIG.selectors.shippingMessage);
    const marker = document.querySelector(CONFIG.selectors.thresholdMarker);
    
    if (!fill || !message) return;
    
    const percent = Math.min((totalCents / CONFIG.freeShippingThreshold) * 100, 100);
    const remaining = Math.max(CONFIG.freeShippingThreshold - totalCents, 0);
    
    fill.style.width = `${percent}%`;
    
    if (marker) {
      marker.style.left = `${percent}%`;
      marker.textContent = formatMoney(totalCents);
    }
    
    if (totalCents >= CONFIG.freeShippingThreshold) {
      message.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/><path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="1.5"/></svg>
        <span>🎉 You've unlocked FREE shipping!</span>
      `;
      message.classList.add('shipping-unlocked');
    } else {
      message.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.5 5h5l-4 3.5 1.5 5L10 12l-5 3.5 1.5-5L2.5 7h5L10 2z" stroke="currentColor" stroke-width="1.5"/></svg>
        <span>Add <strong>${formatMoney(remaining)}</strong> more for FREE shipping</span>
      `;
      message.classList.remove('shipping-unlocked');
    }
  }
  
  // Update cart totals
  function updateTotals(cart) {
    const subtotal = document.querySelector(CONFIG.selectors.subtotal);
    const discount = document.querySelector(CONFIG.selectors.discount);
    const total = document.querySelector(CONFIG.selectors.total);
    const stickyTotal = document.querySelector(CONFIG.selectors.stickyTotal);
    
    if (subtotal) subtotal.textContent = formatMoney(cart.items_subtotal_price);
    if (total) total.textContent = formatMoney(cart.total_price);
    if (stickyTotal) stickyTotal.textContent = formatMoney(cart.total_price);
    
    // Calculate and display savings
    const totalDiscount = cart.items.reduce((sum, item) => {
      return sum + (item.original_line_price - item.final_line_price);
    }, 0);
    
    if (discount) {
      const discountRow = discount.closest('.summary-discount');
      if (totalDiscount > 0) {
        discount.textContent = `-${formatMoney(totalDiscount)}`;
        discountRow.style.display = 'flex';
      } else {
        discountRow.style.display = 'none';
      }
    }
  }
  
  // Update individual line prices
  function updateLinePrices(cart) {
    cart.items.forEach((item, index) => {
      const line = index + 1;
      const linePriceEl = document.querySelector(`.cart-item[data-line="${line}"] .cart-item-line-price`);
      if (linePriceEl) {
        linePriceEl.textContent = formatMoney(item.final_line_price);
      }
    });
  }
  
  // Bind quantity buttons
  function bindQuantityButtons() {
    document.querySelectorAll(CONFIG.selectors.quantityBtns).forEach(btn => {
      btn.addEventListener('click', async () => {
        const input = btn.parentElement.querySelector('input');
        const line = input.dataset.line;
        let quantity = parseInt(input.value);
        
        if (btn.classList.contains('cart-quantity-minus')) {
          quantity = Math.max(1, quantity - 1);
        } else {
          quantity += 1;
        }
        
        input.value = quantity;
        await updateCart(line, quantity);
      });
    });
  }
  
  // Bind remove buttons
  function bindRemoveButtons() {
    document.querySelectorAll(CONFIG.selectors.removeBtns).forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const line = btn.dataset.line;
        const item = btn.closest('.cart-item');
        
        // Animate out
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        
        setTimeout(async () => {
          const cart = await updateCart(line, 0);
          if (cart.item_count === 0) {
            location.reload();
          } else {
            item.remove();
          }
        }, 300);
      });
    });
  }
  
  // Bind upsell add buttons
  function bindUpsellButtons() {
    document.querySelectorAll(CONFIG.selectors.upsellAddBtns).forEach(btn => {
      btn.addEventListener('click', async () => {
        const variantId = btn.dataset.variantId;
        
        btn.disabled = true;
        btn.innerHTML = '<svg class="spin" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="30" stroke-dashoffset="10"/></svg>';
        
        try {
          await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
          });
          
          const cartResponse = await fetch('/cart.js');
          const cart = await cartResponse.json();
          updateUI(cart);
          
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2"/></svg>';
          setTimeout(() => {
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.5"/></svg>';
            btn.disabled = false;
          }, 1500);
        } catch (error) {
          console.error('Upsell add error:', error);
          btn.disabled = false;
        }
      });
    });
  }
  
  // Bind direct input changes
  function bindDirectInput() {
    document.querySelectorAll(CONFIG.selectors.quantityInputs).forEach(input => {
      input.addEventListener('change', async () => {
        const line = input.dataset.line;
        const quantity = Math.max(0, parseInt(input.value) || 0);
        await updateCart(line, quantity);
      });
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
```

---

## Implementation Checklist

### Phase 1: Static Cart (✅ Complete)
- [x] Cart template with all conversion elements
- [x] Free shipping progress bar (server-rendered)
- [x] Trust badges and social proof
- [x] Upsell section structure
- [x] Responsive layout

### Phase 2: Basic Interactivity (30 min)
- [ ] Create `assets/cart-interactivity.js`
- [ ] Include in `theme.liquid`: `{{ 'cart-interactivity.js' | asset_url | script_tag }}`
- [ ] Add `data-line` attributes to quantity inputs
- [ ] Add `data-cart-subtotal`, `data-cart-total` attributes to summary

### Phase 3: Smart Upsells (1 hour)
- [ ] Add `cart_upsells` metafield to products
- [ ] Update upsell liquid to pull from metafields
- [ ] Add one-click add functionality

### Phase 4: Advanced Features (Optional)
- [ ] Cart drawer instead of page
- [ ] Real-time social proof (custom endpoint)
- [ ] Abandoned cart recovery integration

---

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `sections/cart-template.liquid` | Main cart template | ✅ Ready |
| `assets/clutch-theme.css` | Cart styles | ✅ Ready |
| `assets/cart-interactivity.js` | Real-time updates | 📋 Documented |
| `CART-JS-HOOKS.md` | This file | ✅ Ready |

---

## Notes for Future Dev

1. **Shopify's cart API limits:** Max 250ms response time typical
2. **Cart locks:** If customer checks out while JS is updating, Shopify handles race conditions
3. **Metafields:** Need `read_products` scope to access product metafields via AJAX
4. **Testing:** Always test with real cart, not just preview — quantity logic differs

---

*Document version: 1.0*
*Created: March 29, 2026*
*Template: Static Liquid + JavaScript enhancement path*
