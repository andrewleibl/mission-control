# Product Recommendations Setup - Simple Steps

## What You're Building
Two sections on every product page:
1. **"Add for Free Shipping"** - Shows progress bar + suggests product to hit $300 free shipping
2. **"Commonly Bought Together"** - Shows current product + its most common pair

## What I Already Did (Complete)
✅ Wrote the Shopify Liquid code  
✅ Wrote the CSS styling  
✅ Created CSV with 50 product relationships from your actual order data  

## What You Do (15 Minutes)

---

### Step 1: Upload Files to Shopify (5 min)

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **"..."** on your active theme → **Edit code**
3. In the left sidebar, click **"Sections"** → **"Add a new section"**
4. Name it: `product-recommendations`
5. Copy ALL the code from `product-recommendations.liquid` (I gave you this file)
6. Paste it in → Click **Save**

7. In left sidebar, click **"Assets"** → **"Add a new asset"**
8. Upload the file: `product-recommendations.css` (I gave you this file)

---

### Step 2: Add Section to Product Page (2 min)

1. In theme editor left sidebar, click **"Templates"**
2. Find **"product.json"** (or product.liquid if using old themes)
3. Find where product info ends, add this line:
   ```
   {% section 'product-recommendations' %}
   ```
4. Click **Save**

---

### Step 3: Import Product Relationships (8 min)

**Option A: Manual (Recommended for first 20 products)**

1. Go to **Shopify Admin → Products**
2. Search for first product: "Andis Master Clipper"
3. Click into product → Scroll to bottom → **"Metafields"** section
4. Add:
   - **Common Pair**: Select "Andis T-Outliner Trimmer" from dropdown
   - **Upsell Gap**: Enter `110` (this is $300 - $189.99)
5. Click **Save**
6. Repeat for top 20 products from the CSV I gave you

**Option B: Bulk CSV Import (If you have Shopify Plus)**

1. Use the `metafield-import.csv` I created
2. Go to **Settings → Import** → Upload CSV
3. Map fields: product_title → Product, common_pair_title → Common Pair, upsell_gap → Upsell Gap

---

## Verify It Works

1. Go to any product page on your live site
2. Scroll below "Add to Cart" button
3. You should see:
   - Progress bar showing "You're $X away from free shipping"
   - A product card suggesting the common pair
   - "Commonly Bought Together" section with both products

## Troubleshooting

**Nothing shows up?**
- Check that product has a "Common Pair" metafield set
- If no metafield, section won't appear (this is expected)

**Progress bar at 0%?**
- Product price might not be set correctly
- Check that product has a price in Shopify

**Images not loading?**
- Make sure products have featured images uploaded

## Need Help?

Send me:
1. Screenshot of product page where it should appear
2. Screenshot of metafields section for that product

I'll tell you exactly what's wrong.

---

## Files Included

| File | Purpose | Where It Goes |
|------|---------|---------------|
| `product-recommendations.liquid` | Main code | Theme → Sections |
| `product-recommendations.css` | Styling | Theme → Assets |
| `metafield-import.csv` | Product pairs data | Shopify Import (or manual reference) |

## Top Products to Set Up First (Biggest Impact)

From your order data, these drive the most revenue:

1. Andis Master Clipper → Andis T-Outliner ($110 gap)
2. Wahl Senior → Wahl Magic Clip ($110 gap)
3. Stylecraft Rebel → Stylecraft Flex ($100 gap)
4. JRL ONYX Clipper → JRL Onyx Trimmer ($110 gap)
5. Gamma Boosted → Gamma X-Ergo ($120 gap)

Set these 5 up first, see results, then do the rest.

---

**Total time commitment: 15 minutes**
**Technical skill required: Minimal (copy/paste, dropdown selects)**

Questions? Send me screenshots.