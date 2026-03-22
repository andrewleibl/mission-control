# Trust & Conversion Elements — Clutch Barber Supply

*All copy for trust signals, badges, email flows, and conversion UI elements.*

---

## ANNOUNCEMENT BAR COPY (4 Options — Rotate)

Set these to rotate every 4 seconds in the Shopify theme editor or via Marquee Bar app.

**Option 1:**
✅ Authorized Dealer — BaByliss Pro, JRL, Andis, Wahl, Gamma | StyleCraft & More

**Option 2:**
🚚 Free Shipping on Orders Over $300 | Free Returns on Defective Items

**Option 3:**
🏪 Grand Prairie, TX | In-Store + Online | (214) 677-1059 | Mon–Sat

**Option 4:**
🎓 TDLR CE Classes + StyleCraft Master Classes — Now Available → [Shop Events]

*Implementation note: The last option should link to /collections/clutch-events. Use the announcement bar's "link" field in Dawn theme settings.*

---

## TRUST BADGE COPY

Place trust badges:
- Below the Add to Cart button on product pages
- On the cart page (sidebar or above checkout button)
- In the homepage trust bar section

### Badge Set — Recommended Display Order

**Badge 1:** ✅ Authorized Dealer
*Subtext: Authentic tools, valid warranties*

**Badge 2:** 🔁 30-Day Returns
*Subtext: Hassle-free on unopened items*

**Badge 3:** 🚚 Free Shipping $300+
*Subtext: Contiguous US*

**Badge 4:** 🔒 Secure Checkout
*Subtext: SSL encrypted, protected payment*

**Badge 5:** 📞 Real Support
*Subtext: Call or text (214) 677-1059*

*Implementation note: Use Shopify's built-in trust badge section or an app like Trust Hero or PageFly badge block. SVG icons recommended for crisp rendering at all sizes.*

---

## STICKY ADD-TO-CART BAR COPY

*Appears as a sticky bottom bar on mobile when the main ATC button scrolls out of view.*

**Format:** [Product Name thumbnail] | $[Price] | [Add to Cart Button]

**Add to Cart Button Text Options:**
- "Add to Cart — Ships Today*"
- "Add to Cart"
- "Get Yours"

**Subtext below button (small font):**
*Free shipping on orders $300+. Authorized dealer.*

*Implementation note: Enable via Dawn theme's sticky ATC setting, or install Sticky Add To Cart by Uplinkly (free tier available).*

---

## PRODUCT PAGE URGENCY TEXT (Optional — Deploy on select high-demand SKUs)

Place below the ATC button:

**Low Stock Variant:**
⚡ Only [X] left in stock — order soon.

**Social Proof Variant:**
🔥 [X] people are viewing this right now.

**Shipping Confidence Variant:**
📦 Order before [CUTOFF_TIME] CST — ships today.

*Implementation note: Use Shopify metafields for stock copy, or apps like Urgency Bear or Hextom Announcement Bar for live countdown/social proof. Only enable on products where stock genuinely is limited — false urgency destroys trust.*

---

## REVIEW REQUEST EMAIL TEMPLATE

*Send to all past customers who haven't left a review. Use Klaviyo or Shopify Email to deploy.*

---

**Subject line options (A/B test):**
- "Quick favor from a fellow barber fan"
- "How's your [Product Name] treating you?"
- "We'd love your feedback, [First Name]"
- "Help other barbers find the right tools 🙌"

---

**Email Body:**

---

Hey [First Name],

You ordered [Product Name] from Clutch a little while back — and we hope it's been putting in work for you.

We're a small, locally-owned shop out of Grand Prairie, TX, and reviews genuinely mean everything to us. When a barber is about to drop $150–$300 on a clipper they've never held, seeing feedback from another professional is what seals the deal.

If you've got 60 seconds, we'd really appreciate a review. Just tell them what you use it for, how it performs, and whether you'd recommend it. That's it.

**[Leave a Review → {Review Link}]**

As a thank-you, we'll send you **10% off your next order** as soon as your review goes live.

Thank you for supporting Clutch.

— The Clutch Team
📍 Grand Prairie, TX | (214) 677-1059

---

*Implementation notes:*
- *Use Klaviyo or Shopify Email to send this. Set up a flow that triggers 14–21 days post-delivery.*
- *If using Judge.me, it has a built-in review request email — customize the template with this copy.*
- *The 10% coupon requires a Shopify discount code — set up a 10% unique code generation in the flow.*
- *Do NOT send to customers who already left a review — use Judge.me/Klaviyo filter: "Has not submitted a review."*

---

## POST-PURCHASE EMAIL (Thank You + Review Ask)

*Triggered immediately after order is fulfilled/shipped. This is a 2-touch flow:*
- *Email 1 (Day 0): Order shipped / thank you*
- *Email 2 (Day 14–21): Review request (see template above)*

---

### Email 1: Order Shipped — Thank You

**Subject:** Your Clutch order is on its way 📦

**Preview text:** Track your order + a note from us

---

**Email Body:**

Hey [First Name],

Your order just shipped. Here's what you need to know:

**Order:** #[Order Number]
**Tracking:** [Tracking Number / Link]
**Estimated Delivery:** [Estimated Date]

---

**Your order:**
[Order Summary — auto-populated by Shopify]

---

We're a small shop out of Grand Prairie, TX — real people, real inventory, real customer service. If anything's off with your order when it arrives, just reply to this email or call **(214) 677-1059**. We'll handle it.

If you love what you ordered, we'd love it if you told another barber. Nothing helps us more than a recommendation from a pro who's used the tools.

**[Shop More → clutchbarbersupply.com]**

Talk soon,

The Clutch Team
113 South Center | Grand Prairie, TX 75050
(214) 677-1059 | clutchbarbersupply.com

---

*Implementation notes:*
- *Customize the Shopify shipping confirmation email template with this copy, OR set up a Klaviyo "Fulfilled Order" flow.*
- *The tracking number and order details auto-populate via Shopify/Klaviyo dynamic variables.*
- *Keep this email under 300 words — it's a confirmation, not a pitch.*

---

## HOMEPAGE SOCIAL PROOF COPY (Above Testimonials Section)

**Section Headline:** Trusted by Barbers. Backed by the Brands.

**Subheadline:**
We're an authorized dealer — not a middleman. Every tool ships with a valid manufacturer warranty and the support of the brand behind it.

**Stat Bar (display 3 numbers horizontally):**
- **[X] Orders Shipped** *(replace X with real number from Shopify admin)*
- **Texas-Based Since [Year]**
- **10+ Professional Brands in Stock**

*Implementation note: Update the numbers once the site is live and orders are processing. Use real data — specificity is more credible than round numbers.*

---

## CART PAGE TRUST COPY

**Above Checkout Button:**

🔒 Secure Checkout — SSL Encrypted
✅ Authorized Dealer | Valid Warranties on All Tools
🔁 30-Day Returns on Unopened Items

**Below Checkout Button (small text):**
Questions before you buy? Call or text **(214) 677-1059** — we pick up.
