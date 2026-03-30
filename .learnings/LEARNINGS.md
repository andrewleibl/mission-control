# Learnings Log

## [LRN-20250327-001] Integration Pattern

**Logged**: 2026-03-27T22:37:00Z
**Priority**: high
**Status**: pending
**Area**: frontend

### Summary
User prefers integrated solutions over standalone pages when features are naturally related.

### Details
Built Client Retention calendar as a standalone route (`/client-retention`) with full React page. User feedback: integrate it into the existing `/tasks` page instead. The calendar and task board serve the same workflow (managing client work), so keeping them together reduces context switching.

### Suggested Action
When building new features that relate to existing pages:
1. Default to integration first (tabs, sections, toggles)
2. Only create standalone routes for truly separate workflows
3. Ask "would the user switch between these frequently?" — if yes, integrate

### Metadata
- Source: user_feedback
- Related Files: /builds/mission-control/src/app/tasks/page.tsx, /builds/mission-control/src/app/client-retention/page.tsx
- Tags: ux, navigation, integration
- Pattern-Key: ux.integration-over-standalone

---

## [LRN-20250327-002] Variable Naming Collisions

**Logged**: 2026-03-27T22:37:00Z
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
When merging two React components into one file, watch for duplicate variable names in the merged scope.

### Details
Merged Task Board and Client Retention calendar into `/tasks/page.tsx`. Both had `weekStart` and `weekEnd` variables — Task Board used them for stats calculation, Client Retention used them for calendar navigation. Build failed with "name defined multiple times" error.

Fix: Renamed Task Board variables to `taskWeekStart` and `taskWeekEnd` to disambiguate.

### Suggested Action
When merging components:
1. Check for overlapping variable names (dates, constants, helpers)
2. Prefix with component name (`taskXxx`, `calendarXxx`)
3. Run build immediately after merge to catch collisions

### Metadata
- Source: error
- Related Files: /builds/mission-control/src/app/tasks/page.tsx
- Tags: react, variables, merge, build
- Pattern-Key: code.merge-variable-prefixing

### Resolution
- **Resolved**: 2026-03-27T22:40:00Z
- **Commit**: Fixed in place during session
- **Notes**: Renamed `weekStart`/`weekEnd` to `taskWeekStart`/`taskWeekEnd` in Task Board section

---

## [LRN-20250328-001] localStorage Overwrites Initial React State

**Logged**: 2026-03-28T11:51:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
When React state is initialized with hardcoded data but also has a `useEffect` that loads from `localStorage`, the localStorage value will overwrite the initial state on mount — even if localStorage is empty or has stale data.

### Details
**Scenario:** Adding new events to a retention calendar's initial state:
```javascript
const [events, setEvents] = useState<RetentionEvent[]>([
  { id: "pj-weekly-001", ... },  // existing
  { id: "hector-weekly-001", ... },  // NEW
  { id: "ricardo-weekly-001", ... },  // NEW
]);
```

**Problem:** A `useEffect` was loading from localStorage on mount:
```javascript
useEffect(() => {
  const stored = localStorage.getItem('mc_retention_events_v2');
  if (stored) setEvents(JSON.parse(stored));
}, []);
```

The user had previously visited the page, so localStorage had an old events array (without the new events). This effect ran after mount and overwrote the hardcoded initial state, making the new events disappear.

**The Fix:** Clear localStorage on mount to force use of the fresh initial state:
```javascript
useEffect(() => {
  localStorage.removeItem('mc_retention_events_v2');
  localStorage.removeItem('mc_retention_events_client_page');
}, []);
```

**Better Long-Term Fix:** Merge strategy — check if events exist in storage that aren't in defaults, don't blindly replace.

### Suggested Action
When using localStorage persistence with React state:
1. **Option A**: Clear old keys when you want fresh data to appear
2. **Option B**: Merge instead of replace — add new defaults to existing storage
3. **Option C**: Version your storage keys (`events_v1`, `events_v2`) when schema changes
4. **Option D**: Use a "last updated" timestamp to decide which wins

Never assume `useState(initial)` will be visible if `useEffect` modifies state on mount.

### Metadata
- Source: error
- Related Files: /builds/mission-control/src/app/client-retention/page.tsx
- Tags: react, localstorage, state, useeffect, hydration
- Pattern-Key: state.localstorage-hydration-conflict

### Resolution
- **Resolved**: 2026-03-28T11:51:00Z
- **Commit**: Fixed in place during session
- **Notes**: Added localStorage.clear() on mount to force fresh initial state

---

---

## [LRN-20250328-002] Weekly Breakdown Structure — Section 1 Format

**Logged**: 2026-03-28T12:28:00Z
**Priority**: high
**Status**: active
**Area**: content, reporting

### Summary
Weekly breakdown Section 1 "How Is The Campaign Going?" must include BOTH:
1. **GOOD — What's Working** (green, ✓)
2. **NEEDS IMPROVING** (yellow, ▲)

### Format
```
## Section 1: How Is The Campaign Going?

**Main Summary**: [1-2 sentence overview]

**✓ GOOD — WHAT'S WORKING** (green section)
- [Positive bullet 1]
- [Positive bullet 2]
- [Positive bullet 3]
- [Positive bullet 4]

**▲ NEEDS IMPROVING** (yellow section)
- [Action item 1]
- [Action item 2]
- [Action item 3]
- [Action item 4]
```

### Why This Structure Works
- Shows balanced perspective (not just problems)
- Celebrates wins first (psychological safety)
- Clear action items after (what we're doing about it)
- Green/yellow color coding matches tone
- Arrow bullets (→) for consistency

### Data Structure
```typescript
section1: {
  mainText: string
  goods: string[]        // What's working (green)
  improvements: string[] // What needs work (yellow)
}
```

### Suggested Action
For every weekly breakdown going forward:
1. Start with 4 GOOD items (positive trends, wins)
2. Follow with 4 IMPROVEMENT items (actions, fixes, watch points)
3. Use consistent labels and colors
4. Match client tone — upbeat but honest

### Metadata
- Source: user_feedback
- Related Files: /builds/mission-control/src/app/loom-recording/page.tsx
- Tags: reporting, content-structure, client-retention
- Pattern-Key: content.weekly-breakdown-format

---

## [LRN-20250328-004] Lead Waterfall Model — Retention Through Volume Visibility

**Logged**: 2026-03-28T23:16:00Z
**Priority**: high
**Status**: concept_ready
**Area**: business_model, retention

### Summary
Client retention requires **volume visibility**, not just results. When clients only see the 30% of leads that become estimates, they undervalue the service. A "Lead Pipeline Dashboard" showing all leads (Hot/Warm/Cold) makes invisible work visible.

### Problem Identified
- 70% of leads are unqualified (fail 1-3 criteria: budget, timeline, location)
- Agency calls ALL leads → wastes time on tire-kickers
- Client only sees 5 estimates → doesn't know 20 leads were generated
- Retention risk: "Why am I paying $1,200 for 5 appointments?"

### Solution: The Lead Waterfall Model
**Three-bucket system:**
1. **HOT** (Andrew handles): All 3 criteria ✓ → Book estimates
2. **WARM** (Client handles): 1-2 criteria met → Nurture for later
3. **COLD** (Archive): 0 criteria met → Save with context

**Dashboard shows:**
- "47 leads this month"
- "5 booked as estimates (HOT)"
- "23 warm leads in your queue with notes"
- "19 cold leads archived"

### Key Insight
Clients don't cancel when they see the full funnel. They see Andrew as building their *future pipeline*, not just generating current appointments.

### Offer Structure: "The Pipeline Subscription"
- **30-day trial:** $1,200 upfront
- **Guarantee:** 5 estimates booked OR $100 back per miss
- **Bonus:** Every warm/cold lead delivered with budget/timeline/location context
- **Month 2+:** Likely $800/month ongoing

### Technical Notes
- Real-time dashboard via GHL API polling (60s)
- Single-link access (obfuscated slug, no login)
- Mission Control aesthetic (dark, copper accents)

### Metadata
- Source: strategic_session
- Related Files: /skills/client-retention-system/SKILL.md
- Tags: retention, business_model, lead_qualification, dashboard
- Pattern-Key: business.volume_visibility_retention

---

## [LRN-20250329-015] Workflow Rule — "Complete" is Client-Defined

**Logged**: 2026-03-29T12:00:00Z
**Priority**: critical
**Status**: active
**Area**: workflow, communication

### Summary
Never declare a project, page, or feature "complete," "done," or "finished" until the client explicitly confirms. Use "ready for testing," "implemented," or "awaiting review" instead.

### Violation
Called Clutch theme "complete" multiple times during session, but Andrew had additional requirements and testing to do.

### Correct Language
- ✅ "Homepage implemented — upload and test when ready"
- ✅ "Shop page filters working — let me know if any issues"
- ✅ "Brands page template created — needs activation in Shopify"
- ❌ "Homepage complete"
- ❌ "Shop page done"
- ❌ "Theme finished"

### Suggested Action
Default to "implemented" or "ready for your review." Let client declare "complete."

---

## [LRN-20250329-014] Shopify API Price Format — Dollars vs Cents

**Logged**: 2026-03-29T04:49:00Z
**Priority**: critical
**Status**: resolved
**Area**: shopify, javascript, api

### Summary
Shopify's JSON API returns prices as **dollar strings** (e.g., `"79.99"`), NOT cents. Must multiply by 100 to match Shopify's cent-based price storage.

### Problem
Price filter `$50-$200` was filtering out ALL products because:
- Shopify API: `"price": "79.99"` (dollars as string)
- Code: `parseFloat("79.99")` = 79.99
- Comparison: `79.99 < 5000` (min price in cents) → FALSE
- Result: All products filtered out

### Root Cause
**Two different price formats in Shopify:**
1. **Liquid templates**: `product.price` returns cents (5000 for $50.00)
2. **JSON API**: `product.price` returns dollars as string ("50.00")

### Solution Applied
```javascript
// WRONG - treats API dollars as cents
const price = parseFloat(product.price) || 0;

// CORRECT - convert dollars to cents
const priceDollars = parseFloat(product.price) || 0;
const price = priceDollars * 100; // Now in cents
```

### Debugging Process (This Session)
1. **Symptom**: All products disappeared when moving min price slider
2. **Hypothesis**: Price format mismatch
3. **Test**: Added `console.log()` to see actual values
4. **Discovery**: Product price "79.99", min price 5000 → 79.99 < 5000
5. **Fix**: Multiply API price by 100
6. **Verify**: Products now show correctly in range

### Pattern for Shopify API
```javascript
// When using /products.json endpoint:
const priceInCents = parseFloat(product.price) * 100;

// When using Liquid:
const priceInCents = product.price; // Already in cents
```

### Suggested Action
Always check data source:
- **Liquid** → cents (5000)
- **AJAX API** → dollars ("50.00")
- **JavaScript filter** → convert to common format (cents)

---

## [LRN-20250329-007] Shopify Theme Development — Vendor Data Trap

**Logged**: 2026-03-29T04:06:00Z
**Priority**: critical
**Status**: resolved
**Area**: shopify, liquid, javascript, frontend

### Summary
All products having the same vendor ("Clutch Barber Supply") breaks brand filtering. Extract brand from product titles instead.

### Problem
Client expected brand filters to work by `product.vendor`, but all products had vendor = "Clutch Barber Supply" (store name). No products matched "Andis", "Wahl", etc.

### Root Cause
Shopify defaults vendor to store name when products are created without explicit vendor.

### Solution Applied
Extract brand from product title using pattern matching:

```javascript
function extractBrandFromTitle(title) {
  const brands = ['Andis', 'Babyliss', 'JRL', 'Wahl', 'Gamma', 'Supreme', 'Level 3', 'Cocco', 'Oster', 'Tomb45', 'Vincent', 'OG Walker', 'Smash', 'Rolda'];
  const titleLower = title.toLowerCase();
  for (const brand of brands) {
    if (titleLower.includes(brand.toLowerCase())) return brand;
  }
  return '';
}
```

Then use extracted brand for both:
1. Filter matching (`title.includes('andis')`)
2. Display in product cards (instead of "Clutch Barber Supply")

### Suggested Action
When building Shopify filters:
1. Check actual data before assuming field values
2. Have fallback extraction (title → vendor → tags)
3. Display extracted value in UI (better UX than generic store name)

### Workflow Note
This required 4+ iterations:
- v1: Filter by vendor (failed — all same)
- v2: Filter by vendor handle (failed — handle also same)
- v3: Filter by title partial match (worked partially)
- v4: Exact brand extraction with mapping (final)

**Lesson**: Test against real store data immediately, don't assume schema.

---

## [LRN-20250329-008] Shopify Collection Filtering — AJAX Loading Required

**Logged**: 2026-03-29T04:06:00Z
**Priority**: critical
**Status**: resolved
**Area**: shopify, javascript, performance

### Summary
Client-side filtering only works on loaded products. Paginated collections (12/page) require AJAX loading of ALL products to filter across entire catalog.

### Problem
User selected "Supreme" filter → only 2-3 products showed (from page 1). Page 2, 3, 4+ products not loaded in DOM, so not filterable.

### Solution
Load all products via Shopify JSON API, then filter in-memory:

```javascript
async function loadAllProducts() {
  let page = 1;
  let hasMore = true;
  const allProducts = [];
  
  while (hasMore && page <= 10) {
    const response = await fetch(`/collections/${handle}/products.json?page=${page}&limit=250`);
    const data = await response.json();
    allProducts.push(...data.products);
    hasMore = data.products.length === 250;
    page++;
  }
  
  return allProducts; // Now filterable
}
```

### Trade-offs
- **Pro**: Can filter all products, instant filtering, custom pagination
- **Con**: Slower initial load (fetching 1000+ products), more memory
- **Mitigation**: Show loading state, cache results, lazy load images

### Suggested Action
For collection filtering:
1. Load all products via AJAX (limit ~2500 products)
2. Store in `allProducts` array
3. Filter to `filteredProducts`
4. Paginate `filteredProducts` client-side
5. Render current page only

---

## [LRN-20250329-009] Shopify Price Handling — Cents vs Dollars

**Logged**: 2026-03-29T04:06:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify, javascript

### Summary
Shopify stores prices in **cents** (e.g., $50.00 = 5000), but user inputs prices in **dollars**.

### Problem
Price filter "$50-$200" returned 0 products because:
- User input: `50` (dollars)
- Product price: `5000` (cents)
- Comparison: `5000 < 50` → false

### Solution
Convert dollar inputs to cents before filtering:

```javascript
const priceMin = (parseFloat(input.value) || 0) * 100; // Dollars → cents
const priceMax = (parseFloat(input.value) || 500) * 100;
```

### Suggested Action
When working with Shopify prices:
1. Always multiply user inputs by 100
2. Divide display values by 100
3. Comment clearly: `// Shopify prices in cents`

---

## [LRN-20250329-010] Dual-Handle Range Slider Implementation

**Logged**: 2026-03-29T04:06:00Z
**Priority**: medium
**Status**: resolved
**Area**: frontend, javascript, css

### Summary
Building a draggable dual-handle price slider requires careful mouse/touch event handling.

### Implementation Pattern

**HTML Structure:**
```html
<div class="price-slider__track" id="track">
  <div class="price-slider__range" id="range"></div>
  <div class="price-slider__handle" id="handleMin"></div>
  <div class="price-slider__handle" id="handleMax"></div>
</div>
```

**JavaScript Logic:**
1. **Mousedown/touchstart** on handle → start dragging
2. **Mousemove/touchmove** on document → update handle position
3. **Mouseup/touchend** on document → stop dragging, apply filter
4. Calculate position as percentage of track width
5. Convert percentage to price value
6. Prevent handles from crossing (min < max - buffer)

**Key Code:**
```javascript
function getPriceFromPosition(clientX) {
  const rect = track.getBoundingClientRect();
  const percent = (clientX - rect.left) / rect.width;
  return Math.round(percent * (maxPrice - minPrice) + minPrice);
}
```

### Suggested Action
Use this pattern for range sliders:
- Fixed track with absolute-positioned handles
- Update range bar between handles
- Support both mouse and touch events
- Update displayed values in real-time
- Apply filter only on drag end (performance)

---

## [LRN-20250329-011] Shopify Product Filtering by Tags

**Logged**: 2026-03-29T04:06:00Z
**Priority**: medium
**Status**: resolved
**Area**: shopify, javascript

### Summary
Categories not present in product titles (like "Accessories") require Shopify tags for filtering.

### Problem
"Accessories" returned 0 products because:
- No products have "accessories" in title
- No products have "accessories" as vendor
- No way to filter without metadata

### Solution
Use Shopify's tag system:
1. Admin → Products → [Edit] → Tags
2. Add tag: `accessories`
3. JavaScript checks `product.tags` array:

```javascript
const hasTag = product.tags.some(tag => 
  tag.toLowerCase().includes('accessories')
);
```

### Workflow
- **Brand filters**: Extract from title (Andis, Wahl)
- **Supply filters**: Extract from title (Clipper, Trimmer)
- **Special categories**: Use tags (Accessories)

### Suggested Action
When a category doesn't appear in titles:
1. Use tags (requires admin work)
2. Document required tags for client
3. Provide bulk tagging instructions

---

## [LRN-20250329-012] Iterative Development with Live Store Data

**Logged**: 2026-03-29T04:06:00Z
**Priority**: high
**Status**: active
**Area**: workflow, process

### Summary
Shopify theme development requires testing against real store data, not assumptions. Multiple iterations are normal and valuable.

### Session Timeline (2+ hours)
1. **Initial build**: Header, hero, brands, footer (1 hour)
2. **Filter attempt**: By vendor (failed — all same)
3. **Fix**: Filter by title (partial success)
4. **Pagination issue**: Only filtering page 1
5. **Fix**: AJAX load all products
6. **Price filter broken**: Cents vs dollars
7. **Fix**: Convert inputs
8. **Supplies filter broken**: Missing categories
9. **Fix**: Title extraction + tag filtering
10. **Price slider request**: Build dual-handle
11. **Final polish**: Remove categories, fix edge cases

### Key Insight
Each "failure" taught something about the data:
- Vendor sameness → title extraction
- Pagination limits → AJAX loading
- Price mismatch → cents conversion
- Missing categories → tag system

### Suggested Action
For Shopify builds:
1. Start with data inspection (what's actually in the products?)
2. Build minimally, test immediately
3. Expect 3-5 iterations
4. Document each fix (becomes pattern for next store)

---

## [LRN-20250329-013] Client Collaboration Pattern — Andrew Leibl

**Logged**: 2026-03-29T04:06:00Z
**Priority**: high
**Status**: active
**Area**: workflow, collaboration

### Summary
Working with Andrew: rapid iteration, visual feedback, real-time testing. High bandwidth, low ceremony.

### What Worked
1. **Immediate testing**: Upload → test → feedback → fix (within minutes)
2. **Visual references**: Screenshots of issues, specific products
3. **Clear direction**: "Change X to Y", not "make it better"
4. **Tolerance for iteration**: Understood that v1 wouldn't be perfect
5. **Context sharing**: Explained why things broke (vendor issue, pagination)

### Workflow Pattern
```
Build → Zip → Upload → Test → Screenshot → Fix → Repeat
```

### Key Lesson
With technical clients who understand the domain (Shopify), skip lengthy explanations. Show the fix, explain the "why" briefly, move to next issue.

### Pattern-Key: collaboration.rapid-iteration

---

---

## [LRN-20250329-001] Shopify Section Validation — Simplify Schemas

**Logged**: 2026-03-29T02:14:00Z
**Priority**: critical
**Status**: resolved
**Area**: shopify, liquid, frontend

### Summary
Shopify sections frequently throw "is not a valid section type" errors when schemas are too complex. The solution is to hardcode content and remove problematic schema properties.

### Problem Pattern
Multiple sections failed with validation errors:
- `'hero' is not a valid section type`
- `'trust-bar' is not a valid section type`
- `'clutch-home-featured-products' is not a valid section type`

### Root Causes Identified
1. **Complex schemas** with `tag`, `class`, `blocks` properties
2. **Blocks without defaults** — sections appear empty
3. **Schema syntax** that Shopify rejects but JSON validates

### Solution Applied
**Before (fails):**
```liquid
{% schema %}
{
  "name": "Hero",
  "tag": "section",
  "class": "section-hero",
  "blocks": [...],
  "presets": [...]
}
{% endschema %}
```

**After (works):**
```liquid
<!-- Hardcoded content -->
<section class="hero">
  <h1>Premium Barber Supplies</h1>
  ...
</section>

{% schema %}
{
  "name": "Hero",
  "settings": [],
  "presets": [{"name": "Hero"}]
}
{% endschema %}
```

### Key Insight
Shopify prefers **hardcoded content** over dynamic blocks for initial display. CMS flexibility is secondary to "it works immediately."

### Future Workflow
1. Build section with hardcoded HTML first
2. Test on Shopify — verify it renders
3. Only then add schema if CMS editing is needed
4. Keep schemas minimal: `name`, `settings` array, simple `presets`

### Validation Check
```bash
# Before uploading, validate JSON:
cat section.liquid | python3 -c "import json,sys; content=sys.stdin.read(); schema=content.split('{% schema %}')[1].split('{% endschema %}')[0]; json.loads(schema); print('Valid')"
```

### Metadata
- Source: error, iteration
- Related Files: /builds/clutch-barber-supply/shopify-theme/sections/*.liquid
- Tags: shopify, liquid, schema, validation
- Pattern-Key: shopify.simplify-schemas

---

## [LRN-20250329-002] CSS Consolidation for Shopify Themes

**Logged**: 2026-03-29T02:14:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify, css, frontend

### Summary
Multiple CSS files and broken references cause styling failures. Consolidate all CSS into a single file referenced in theme.liquid.

### Problem
- Marquee not animating
- Layouts broken
- Styles not applying

### Root Cause
- CSS split across files: `homepage-sections.css`, `theme.css`, `clutch-theme.css`
- Reference to non-existent `base.css`
- Some files not included in `theme.liquid`

### Solution
1. **Consolidate** all CSS into `clutch-theme.css`
2. **Remove** broken references (`base.css`)
3. **Single reference** in `theme.liquid`:
   ```liquid
   {{ 'clutch-theme.css' | asset_url | stylesheet_tag }}
   ```

### Build Checklist
```bash
# Before zipping:
grep -r "stylesheet_tag" layout/theme.liquid  # Should show only 1-2 files
grep -l "\.css" assets/  # Check what's actually there
ls -la assets/*.css  # Verify files exist
```

### Metadata
- Source: error
- Related Files: /builds/clutch-barber-supply/shopify-theme/assets/clutch-theme.css
- Tags: shopify, css, build-process
- Pattern-Key: shopify.consolidate-css

---

## [LRN-20250329-003] Header Layout — CSS Grid Over Flexbox

**Logged**: 2026-03-29T02:14:00Z
**Priority**: high
**Status**: resolved
**Area**: css, layout, shopify

### Summary
Precise header positioning (logo between search and nav) requires CSS Grid, not Flexbox with equal distribution.

### Problem
Logo centered on page instead of positioned between search bar (left) and Shop link (right).

### Attempted (Failed)
```css
/* Flexbox — logo centers on page, not between elements */
.header { display: flex; justify-content: space-between; }
.left, .right { flex: 1 1 0; }
.logo { flex-shrink: 0; }  /* Still page-centered */
```

### Solution (Worked)
```css
/* CSS Grid — precise column control */
.header {
  display: grid;
  grid-template-columns: 280px auto 1fr;
  gap: 1.5rem;
}
.left { /* search, hamburger */ }
.logo { justify-self: start; padding-left: 1rem; }
.right { justify-content: flex-end; /* nav + cart */ }
```

### Key Insight
**Flexbox** distributes space equally.
**CSS Grid** assigns explicit space to each column.

For "logo sits immediately right of search":
- Column 1: Fixed 280px (search)
- Column 2: Auto (logo, left-aligned)
- Column 3: Remaining space (nav, pushed right)

### Future Pattern
Always use **CSS Grid** for headers requiring precise positioning between specific elements.

### Metadata
- Source: user_feedback
- Related Files: /builds/clutch-barber-supply/shopify-theme/sections/header.liquid
- Tags: css, grid, flexbox, header, layout
- Pattern-Key: css.grid-for-header-positioning

---

## [LRN-20250329-004] Asset Management in Shopify Themes

**Logged**: 2026-03-29T02:14:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify, assets, build-process

### Summary
Brand logos and images must be copied to theme's `assets/` folder before zipping. Use correct Liquid filters for referencing.

### Problem
Brand logos not displaying in Shopify — empty grid with text fallbacks.

### Root Cause
- Logos in `/assets/logos/` (source folder)
- Not copied to `/shopify-theme/assets/` (theme folder)
- Zip created without logo files

### Solution
**Build script:**
```bash
# Copy all assets before zipping
cp assets/logos/*.png shopify-theme/assets/
cp assets/*.png shopify-theme/assets/ 2>/dev/null || true

# Verify in zip
unzip -l theme.zip | grep -E "\.png|\.jpg|\.svg"
```

**Liquid usage:**
```liquid
<!-- Theme assets (packaged with theme) -->
<img src="{{ 'logo.png' | asset_url }}">

<!-- Uploaded images (user adds in editor) -->
<img src="{{ section.settings.image | image_url: width: 400 }}">
```

### Key Distinction
- `| asset_url` — Files in theme's `assets/` folder
- `| image_url` — Images uploaded through Shopify admin

### Checklist
Before final zip:
- [ ] All logos copied to theme/assets/
- [ ] All brand images present
- [ ] Using `asset_url` for theme logos
- [ ] Verify assets in zip listing

### Metadata
- Source: error, user_feedback
- Related Files: /builds/clutch-barber-supply/shopify-theme/assets/
- Tags: shopify, assets, logos, build-process
- Pattern-Key: shopify.asset-copy-checklist

---

## [LRN-20250329-005] Section Double-Loading Prevention

**Logged**: 2026-03-29T02:14:00Z
**Priority**: medium
**Status**: resolved
**Area**: shopify, liquid, templates

### Summary
Sections loaded in both `theme.liquid` and template files appear twice.

### Problem
Header appearing twice on homepage — once from `theme.liquid`, once from `index.liquid`.

### Root Cause
```liquid
<!-- theme.liquid -->
<body>
  {% section 'header' %}  <!-- Global load -->
  <main>
    {{ content_for_layout }}  <!-- Includes index.liquid -->
  </main>
</body>

<!-- index.liquid -->
{% section 'header' %}  <!-- Template load -->
{% section 'hero' %}
...
```

### Solution
Choose ONE location:
- **Option A**: Load in `theme.liquid` (appears on all pages)
- **Option B**: Load in `index.liquid` (homepage only)

Never both.

### Detection
```bash
grep -r "section 'header'" layout/ templates/
# Should return only ONE location
```

### Metadata
- Source: error
- Related Files: /builds/clutch-barber-supply/shopify-theme/layout/theme.liquid
- Tags: shopify, liquid, templates, sections
- Pattern-Key: shopify.section-loading-single-source

---

## [LRN-20250329-006] Iterative Build Strategy — Keep Working Versions

**Logged**: 2026-03-29T02:14:00Z
**Priority**: medium
**Status**: active
**Area**: workflow, version-control

### Summary
Multiple iteration attempts required before success. Preserve working versions at each checkpoint.

### Versions Created
| Zip | Status | Lesson |
|-----|--------|--------|
| `clutch-theme-HOMEPAGE-FIXED.zip` | ❌ Failed | Schema too complex |
| `clutch-theme-FRESH.zip` | ❌ Failed | Same validation error |
| `clutch-theme-CLEAN-HERO.zip` | ❌ Failed | Still rejected |
| `clutch-theme-COMBINED.zip` | ⚠️ Partial | Mixed sources, some worked |
| `clutch-theme-WORKING.zip` | ✅ Success | Hardcoded content, simplified |

### Key Insight
Don't overwrite files — create new zips with descriptive names at each major change.

### Future Workflow
```
theme-v1-initial.zip
theme-v2-css-fixed.zip
theme-v3-sections-simplified.zip
theme-v4-final.zip
```

If v4 fails, can roll back to v3 instantly.

### Metadata
- Source: process, workflow
- Related Files: /builds/clutch-barber-supply/*.zip
- Tags: workflow, version-control, builds
- Pattern-Key: workflow.keep-working-versions

---

## [LRN-20250329-001] Shopify Theme Template Loading

**Logged**: 2026-03-29T21:46:00Z
**Priority**: critical
**Status**: resolved
**Area**: shopify, frontend

### Summary
Template dropdown in Shopify Admin only shows templates from the PUBLISHED theme. Uploading as draft doesn't work.

### Details
Built 10 custom page templates (brands, supplies, classes, contact, faq, reviews, shipping, returns, terms, privacy). User uploaded zip but templates not showing in dropdown.

**Root Cause:** Theme was uploaded but not published. Shopify only reads templates from the currently live theme.

**Fix:**
1. Upload theme zip
2. Click "Publish" on that theme
3. Templates now appear in dropdown
4. Create pages and select templates

### Suggested Action
Always verify theme is PUBLISHED before testing templates. Check Templates folder in code editor to confirm files exist.

### Metadata
- Source: error
- Related Files: /templates/page.*.liquid
- Tags: shopify, templates, publishing
- Pattern-Key: shopify.template-publishing

---

## [LRN-20250329-002] URL Handle Conflicts in Shopify

**Logged**: 2026-03-29T21:46:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify

### Summary
Old hidden/draft pages block new URL handles. Shopify says "taken" but page isn't visible in list.

### Details
Creating `/pages/brands` showed error "URL handle already taken" but no visible page existed. Old hidden page from 2021 was blocking it.

**Root Cause:** Hidden and draft pages still occupy URL handles. They don't show in default Pages list view.

**Fix:**
1. Go to Pages → Change filter to show "All" (not just "Visible")
2. Find old page with same handle
3. Delete old page OR use different handle
4. Save new page

### Suggested Action
When "URL handle taken" error appears:
- Check Pages filter is set to "All" not "Visible"
- Look for pages with different titles but same handle
- Delete old pages or rename them

### Metadata
- Source: error
- Tags: shopify, urls, pages
- Pattern-Key: shopify.url-handle-conflicts

---

## [LRN-20250329-003] Theme.liquid Global Sections vs Template Duplication

**Logged**: 2026-03-29T21:46:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify, liquid

### Summary
Double headers/footers appeared on pages. Template included header/footer AND theme.liquid also included them.

### Details
Page templates had `{% section 'header' %}` and `{% section 'footer' %}`. Theme.liquid layout ALSO loaded these via `{{ content_for_layout }}` wrapper.

**Root Cause:** Both template and layout were loading the same sections.

**Fix:**
```liquid
{% comment %} In page.template.liquid - DON'T DO THIS {% endcomment %}
{% section 'header' %}  <!-- REMOVE -->
{{ content }}
{% section 'footer' %}  <!-- REMOVE -->

{% comment %} theme.liquid handles it globally {% endcomment %}
{% section 'header' %}
{{ content_for_layout }}
{% section 'footer' %}
```

### Suggested Action
Remove header/footer section tags from page templates. Let theme.liquid load them once globally.

### Metadata
- Source: error
- Related Files: /layout/theme.liquid, /templates/page.*.liquid
- Tags: shopify, liquid, sections
- Pattern-Key: shopify.global-sections

---

## [LRN-20250329-004] Vendor URL Parameter Case Sensitivity

**Logged**: 2026-03-29T21:46:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify, javascript, filters

### Summary
Brand filter links in footer used wrong case. `?vendor=Andis` doesn't work, `?vendor=andis` does.

### Details
Filter JavaScript maps URL params to checkbox values:
```javascript
const vendorMap = {
  'Wahl': 'wahl',  // URL param mapped to checkbox value
  'Babyliss Pro': 'babyliss-pro'
};
```

Footer links used `?vendor=Andis` but checkbox expected `?vendor=andis`.

**Fix:** All vendor URLs changed to lowercase with hyphens:
- `?vendor=andis`
- `?vendor=babyliss-pro`
- `?vendor=gamma-style-craft`

### Suggested Action
Always use lowercase with hyphens for vendor URL parameters. Match exactly what filter system expects.

### Metadata
- Source: error
- Related Files: /sections/footer.liquid, /sections/collection-template.liquid
- Tags: shopify, filters, urls, javascript
- Pattern-Key: shopify.vendor-url-case

---

## [LRN-20250329-005] Marquee Animation Requirements

**Logged**: 2026-03-29T21:46:00Z
**Priority**: medium
**Status**: resolved
**Area**: frontend, css

### Summary
Marquee animation requires duplicate content for seamless infinite loop.

### Details
Brand marquee had 5 cards but wasn't scrolling. CSS animation moved cards off-screen but then showed empty space.

**Fix:**
```html
<div class="marquee">
  <!-- Original 5 cards -->
  <div class="card">...</div>
  <!-- Duplicate same 5 cards -->
  <div class="card">...</div>
</div>

<style>
.marquee {
  display: flex;
  animation: scroll 35s linear infinite;
  width: max-content;
}
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); } /* Moves half the content */
}
</style>
```

### Suggested Action
For seamless marquee: duplicate all items, use `translateX(-50%)`, set `width: max-content`.

### Metadata
- Source: error
- Related Files: /templates/page.brands.liquid
- Tags: css, animation, marquee
- Pattern-Key: css.marquee-animation

---

## [LRN-20250329-006] Section Schema Validation

**Logged**: 2026-03-29T21:46:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify, liquid, sections

### Summary
"Section is being rendered but does not appear in any template" error — missing required schema fields.

### Details
Classes section schema only had settings, no tag or class fields.

**Fix:** Added required fields:
```json
{% schema %}
{
  "name": "Classes Section",
  "tag": "section",
  "class": "section",
  "settings": []
}
{% endschema %}
```

### Suggested Action
Every section schema needs: `name`, `tag`, `class`. Optional: `settings`, `blocks`, `presets`.

### Metadata
- Source: error
- Related Files: /sections/classes-template.liquid
- Tags: shopify, liquid, schema
- Pattern-Key: shopify.section-schema-required

---

## [LRN-20250329-007] Zip Upload Verification

**Logged**: 2026-03-29T21:46:00Z
**Priority**: high
**Status**: resolved
**Area**: shopify, deployment

### Summary
User uploads zip but templates not appearing. Wrong zip file was uploaded.

### Details
Claimed to upload `clutch-theme-WORKING.zip` but Templates folder showed old files. User actually uploaded older `clutch-theme-COMBINED.zip`.

**Fix:**
1. Check Templates folder in code editor
2. Verify expected files exist
3. If not, rebuild zip: `zip -r theme.zip . -x "*.DS_Store"`
4. Upload correct file

### Suggested Action
Always verify uploads by checking file list in code editor before telling user to create pages.

### Metadata
- Source: error
- Related Files: deployment workflow
- Tags: shopify, deployment, zip
- Pattern-Key: shopify.zip-verification

---

## [LRN-20250329-008] Complete Shopify Theme Build Workflow (Validated)

**Logged**: 2026-03-29T21:46:00Z
**Priority**: high
**Status**: active
**Area**: shopify, workflow

### Summary
Full workflow for building custom Shopify themes from HTML prototypes.

### Workflow
```
1. Build locally in /builds/project/
2. Preview: python3 -m http.server
3. Convert HTML → Liquid templates
4. Add Shopify features (forms, sections, filters)
5. Rebuild zip: zip -r theme.zip . -x "*.DS_Store"
6. Upload to Shopify
7. Publish theme
8. Create pages → Select templates → Verify handles
9. Test all links and filters
10. Document in memory + learnings
```

### Key Patterns
- **Templates:** `templates/page.NAME.liquid` for static pages
- **Sections:** `sections/NAME-template.liquid` for editable content
- **Filters:** Client-side JavaScript reading URL params
- **URL Format:** Lowercase with hyphens, match checkbox values
- **Global Elements:** theme.liquid loads header/footer once

### Validation Checklist
- [ ] Templates exist in templates/ folder
- [ ] Theme is published
- [ ] Pages created with correct templates
- [ ] URL handles match template names
- [ ] Footer links use correct filter URLs
- [ ] All filter combinations work
- [ ] Mobile responsive
- [ ] No console errors

### Metadata
- Source: workflow
- Related Files: entire clutch-barber-supply build
- Tags: shopify, workflow, build-process
- Pattern-Key: workflow.shopify-theme-build

---

## [LRN-20250329-009] Content Migration Pattern (HTML to Liquid)

**Logged**: 2026-03-29T21:46:00Z
**Priority**: medium
**Status**: active
**Area**: shopify, content

### Summary
Converting custom HTML pages to Shopify Liquid templates.

### Process
1. **Extract:** View source HTML, identify content and structure
2. **Convert:** Wrap content in Liquid `{% comment %} Template: NAME {% endcomment %}`
3. **Style:** Move CSS to `<style>` block or theme.css
4. **Integrate:** Add Shopify features (forms, sections, dynamic content)
5. **Link:** Update all URLs to Shopify format (`/pages/name`)
6. **Test:** Preview, verify responsive, check all links

### Example
```html
<!-- Original HTML -->
<div class="faq">
  <h1>FAQ</h1>
  <div class="question">...</div>
</div>

<!-- Converted to Liquid -->
{% comment %} Template: page.faq {% endcomment %}
<div class="page-header">
  <h1>{{ page.title }}</h1>
</div>
<section class="faq-section">
  <!-- Hardcoded content -->
</section>
<style>.faq-section { ... }</style>
```

### Metadata
- Source: workflow
- Tags: shopify, content, migration
- Pattern-Key: workflow.html-to-liquid

---

## [LRN-20250329-010] Hardcoded Templates vs Editable Sections

**Logged**: 2026-03-29T21:46:00Z
**Priority**: medium
**Status**: active
**Area**: shopify, architecture

### Summary
Decision matrix for when to hardcode vs make editable.

### Hardcoded Templates (page.*.liquid)
**Use for:** Static content that rarely changes (brands, faq, reviews, policies)
**Pros:** Simple, fast, no database queries
**Cons:** Requires code changes to update

### Editable Sections
**Use for:** Content that user updates frequently (classes, featured products)
**Pros:** User can edit in theme customizer
**Cons:** More complex schema, slower initial load

### Implementation
```liquid
<!-- Hardcoded -->
{% comment %} Template: page.faq {% endcomment %}
<div class="faq-item">...</div>

<!-- Editable Section -->
{% comment %} Template: page.classes {% endcomment %}
{% section 'classes-template' %}
```

### Metadata
- Source: architectural_decision
- Tags: shopify, architecture, templates
- Pattern-Key: shopify.hardcoded-vs-editable

---
