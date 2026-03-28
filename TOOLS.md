# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Tool Preferences (Andrew's Rules)
- **Coding projects** → Use Codex
- **Web/browser searches** → Use Gemini
- **Social searches** → Use Grok (no CLI yet — use xurl/X API as substitute)

## Communication Preferences
- **Active work sessions** → Send a progress update once per hour, not every 10 minutes
- **Cron jobs (morning brief, nightly build)** → Run on Haiku
- **Live conversations** → Stay on Sonnet

## Model Routing (Venice AI — all via VENICE_API_KEY)
- **Primary / default** → `venice/kimi-k2-5` (Kimi K2.5, private)
- **Coding tasks** → `venice/openai-gpt-53-codex` (GPT-5.3-Codex, anonymized)
- **Heartbeats / cron** → `venice/openai-gpt-oss-120b` (GPT-OSS, private)
- **Research / web search** → `venice/gemini-3-flash-preview` (Gemini 3 Flash, anonymized)
- Provider configured: Venice AI (`vapi_...` key in openclaw.json)

## Tool Gotchas

### Meta Marketing API
**Lead counting**: ONLY use `action_type === 'lead'` for actual form submissions.  
DO NOT use `.includes('lead')` — Meta returns multiple lead-related action types:
- `lead` ✅ actual form fill
- `offsite_complete_registration_add_meta_leads` ❌
- `offsite_search_add_meta_leads` ❌
- `onsite_conversion.lead_grouped` ❌

Using `.includes('lead')` overcounts by 5x+. Always exact match.

### Meta Ads Dashboard Patterns
**For Lead Gen campaigns, focus on CPL not ROAS:**
- Cards: Spend MTD + Leads + CPL (add below leads number)
- Budget: Progress bar showing % spent (color: green/yellow/red)
- Campaigns: Remove Revenue/ROAS columns, keep Spend + CPL
- Charts: "Leads Over Time" line chart (not Spend vs Revenue)
- Creatives: Estimate leads by spend proportion (Meta doesn't attribute)

**Data loading on Vercel:**
- Can't use `fs.readFileSync` with absolute paths
- Import JSON: `import data from './data/file.json'`
- Data gets bundled at build time, rebuild to update

## Agent Hierarchy (Greek Pantheon)

| Rank | Name | Role | Model | Status |
|------|------|------|-------|--------|
| 1 | **Poseidon** | Chief strategist, coordination, memory | `venice/kimi-k2-5` | **LIVE** |
| 2 | **Hephaestus** | Coding, websites, technical builds | `venice/openai-gpt-53-codex` | **LIVE** |
| 3 | **Hermes** | Speed-to-lead, messaging, alerts | `venice/kimi-k2-5` | Planned |

## How to Spawn Agents

**Hephaestus (Coding Agent):**
- Say: "Spawn Hephaestus" or "Hephaestus, build me..."
- Model: `venice/openai-gpt-53-codex` (400k context, coding-optimized)
- Use for: Websites, Next.js/React, Shopify, scripts, automation, code review
- Reports to: Poseidon

**Activation:** When Andrew gives a coding task, I spawn a dedicated session with GPT-5.3-Codex optimized for technical work. Hephaestus executes, then reports back to Poseidon with results.

## Website Build Workflow

**For Shopify/e-commerce sites:**

1. **Structure First** — Get user to define sections and layout before any code
2. **User-Provided Copy** — Don't draft headlines/CTAs; get exact text from user
3. **Section Batches** — Build 2-3 sections → preview → adjust → approve → save memory
4. **Local Preview** — `python3 -m http.server 8765` for immediate browser feedback
5. **Hephaestus Pattern** — Spawn for implementation, you handle direction and review

**Build Directory:** `/builds/<project-name>/`
- `preview-sections-X-Y.html` for preview files
- `shopify-redesign/theme/sections/` for Shopify-compatible Liquid files

**March 24, 2026 — Proven on Clutch Barber Supply build**

### Image Asset Handling (Refined Mar 25, 2026)

**Receiving Images from User:**
- User provides via `file:///Users/poseidon/Downloads/image-name.png` URLs
- Copy to project: `cp "/Users/poseidon/Downloads/image-name.png" /Users/poseidon/.openclaw/workspace/builds/<project>/assets/logos/`
- Verify: `file <path>` should show "PNG image data" or valid format
- Reference in HTML: `<img src="assets/logos/brand.png">` (relative path)

**Iterative Sizing Pattern:**
- Start: 65px max-height (default)
- "Bigger": 85px → 100px → 110px → 120px → 135px
- "Tiny bit bigger": +10-15px increments
- Some logos need custom sizes (wide logos: smaller height, tall logos: larger height)
- CSS structure: `.brand-logo { max-height: 65px; }` + `.brand-logo--large { max-height: 165px; }`

**Grid Layout Rules:**
- 6 items: `repeat(3, 1fr)` = 3x2 grid
- 8 items: `repeat(4, 1fr)` = 4x2 grid
- Maintain uniform card sizes across all items

**Debugging:**
- Image not showing? Check for **duplicate CSS rules** (last one wins)
- Changes not appearing? **Hard refresh** Cmd+Shift+R (browser caching)
- Still cached? Rename file or add `?v=2` query param

**Cross-Page Updates:**
- Shared elements (header, footer) require updating **EVERY HTML file**
- Use `grep -l "pattern" *.html` to find all files needing changes
- Risk: User navigates to another page and sees old version
- Fix: Batch update all files before declaring "done"

---

### Shopify Product Recommendations Workflow (Mar 26, 2026)

**Data-Driven Product Pair System** — Custom alternative to Rebuy/Zipify:

**Phase 1: Order Analysis (Python)**
```python
# Export orders from Shopify Admin → CSV
# Group by order ID, find product pairs
from collections import defaultdict, Counter

orders = defaultdict(list)
pair_counts = Counter()

# For each order, generate all product pairs
for order_id, products in orders.items():
    for i in range(len(products)):
        for j in range(i+1, len(products)):
            pair = tuple(sorted([products[i], products[j]]))
            pair_counts[pair] += 1

# Filter: pairs bought together >3x, affinity >20%
```

**Phase 2: Metafield Setup**
```
Settings → Metafields → Products → Add Definition:
- Name: "Common Pair"
- Key: custom.common_pair
- Type: Product (Single product reference)
```

**Phase 3: Liquid Template**
```liquid
{% assign pair_product = product.metafields.custom.common_pair.value %}
{% assign gap = 300 | minus: product.price | divided_by: 100.0 %}

<section class="recommendations-split">
  <!-- Free Shipping Upsell -->
  <!-- Commonly Bought Together -->
</section>
```

**Key Conversion Patterns:**
- Same-brand pairing: Oster Clipper → Oster Trimmer (100% affinity)
- Price point: $100-120 gap hits $300 free shipping threshold
- Split section: Left (progress bar) + Right (bundle CTA)

**Outputs:**
1. `product-recommendations.liquid` - Shopify section
2. `metafield-import.csv` - Bulk data for top 50 products
3. `SETUP-INSTRUCTIONS.md` - Deployment guide

**Reference:** Clutch Barber Supply build — 2,987 orders analyzed, 50 pairs identified, AOV lift projected 15-25%.

---

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
