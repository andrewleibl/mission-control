# MEMORY.md - Poseidon's Long-Term Memory

> Trim aggressively. USER.md already covers Andrew's full profile, agency details, and offer structure. Only store what USER.md doesn't have.

---

## Active Clients — Billing Details (Mar 2026)

| Client | Business | Signed | Ads Live | Renewal | Collected | Remaining |
|---|---|---|---|---|---|---|
| Hector Huizar | Valley of the Sun Landscape | 2/11/26 | 3/10/26 | 4/10/26 | $785 | $0 |
| PJ Sparks | We Do Hardscape | 2/27/26 | 3/9/26 | 4/9/26 | $285 | $0 |
| Ricardo Madera | Madera Landscape | 2/27/26 | 3/9/26 | 4/9/26 | $285 | $0 |
| Vicelia Tinde | Clutch Barber Supply | — | — | — | $900 | $900 |

- PJ Sparks: refund window passed — no longer eligible
- Ricardo Madera: wants to compare $500 ad spend vs last month
- Vicelia: Shopify redesign, HIGH PRIORITY → **COMPLETED March 31, 2026**

---

## Completed Builds — Clutch Barber Supply (March 31, 2026)

**Status:** ✅ LIVE - Theme deployed and approved
**Location:** `/builds/clutch-barber-supply/`

### What Was Built
- **Homepage:** Hero with 4.8 rating, brand grid (9 brands), reviews section
- **Collection/Shop:** Client-side filtering (brand, category, price, availability), mobile filter panel
- **Product Page:** Image gallery, description, variant picker, add to cart
- **Cart Page:** Trust bar with icons, shipping calculator, reviews, suggestions
- **Brand Linking:** Homepage/Footer brand clicks auto-filter collection page

### Technical Challenges Solved
1. **Mobile Product Image Overflow** — `aspect-ratio: 1` created 495px square on mobile. Fixed with `aspect-ratio: auto !important`
2. **Collection Products Not Loading** — JavaScript array empty. Fixed with DOM extraction fallback
3. **Brand Filter Auto-Apply** — URL parameter matching against wrong attribute. Fixed with `data-vendor` selector

### Key Learnings Captured
- See `.learnings/LEARNINGS.md` entries:
  - `[LRN-20250330-001]` Mobile CSS aspect-ratio trap
  - `[LRN-20250330-002]` Collection page DOM fallback
  - `[LRN-20250330-003]` Brand filter URL matching

### Files Delivered
| File | Location |
|------|----------|
| Theme ZIP | `clutch-theme-WORKING.zip` (2.3MB) |
| Session Log | `memory/2026-03-30.md` |

---

## Active Clients — Billing Details (Mar 2026)

| Client | Business | Signed | Ads Live | Renewal | Collected | Remaining |
|---|---|---|---|---|---|---|
| Hector Huizar | Valley of the Sun Landscape | 2/11/26 | 3/10/26 | 4/10/26 | $785 | $0 |
| PJ Sparks | We Do Hardscape | 2/27/26 | 3/9/26 | 4/9/26 | $285 | $0 |
| Ricardo Madera | Madera Landscape | 2/27/26 | 3/9/26 | 4/9/26 | $285 | $0 |
| Vicelia Tinde | Clutch Barber Supply | — | — | — | $900 | $900 |

- PJ Sparks: refund window passed — no longer eligible
- Ricardo Madera: wants to compare $500 ad spend vs last month
- Vicelia: Shopify redesign, HIGH PRIORITY

---

## Contacts

- **Andrew — Telegram:** @andrewleibl (ID: 6005829549) — PRIMARY
- **Andrew — WhatsApp:** +1 (414) 517-1561
- **Agency email:** andrew@straightpointmarketing.com
- **GitHub:** andrewleibl (github.com/andrewleibl)
- **My Gmail:** poseidonclaudebot@gmail.com

---

## Skill Library (Self-Improving System)

Skills are reusable workflows and patterns, refined through each session:

| Skill | Location | Contains |
|-------|----------|----------|
| **client-retention-system** | `skills/client-retention-system/` | Retention SOPs, Mission Control Calendar, **Loom Recording Interface** (NEW Mar 27), templates, poor results protocol, Big 3 question framework |

*Each skill captures proven patterns. Update after every major build.*

**Learnings Log:** `.learnings/LEARNINGS.md` — Captured patterns from errors, user feedback, and workflow improvements.

### Recent Skill Updates (Mar 28, 2026)

**[LRN-20250328-002] Weekly Breakdown Format** — Section 1 "How Is The Campaign Going?" must always include BOTH: ✓ **Good — What's Working** (green) and ▲ **Needs Improving** (yellow). Balanced perspective with wins first, then action items.

**[LRN-20250328-001] localStorage vs Initial State** — React `useState` initialization can be overwritten by `useEffect` hydration from localStorage. When adding hardcoded data to initial state, either clear old storage keys or merge carefully. See learnings log for full pattern.

### Recent Skill Updates (Mar 27, 2026)

**Loom Recording Interface** — Added complete `/loom-recording` page with:
- Campaign metrics dashboard (spend, leads, CPL, CTR)
- Big 3 Questions layout with unified edit mode
- Red glow aesthetic matching retention calendar
- Arrow bullet styling (→)
- JSON download functionality

**Pattern Validated:** Unified edit controls > granular field editing
**User Quote:** *"This layout is AWESOME. Save it, make sure to save the layout, the build, the workflow between us in the session, and get it all to the self improving skill. This is a big win getting this layout together."*

---

## Meta Ad Account Information — UPDATED March 27, 2026

**Live Ad Account IDs and Business Portfolio IDs:**

| Client | Ad Account ID | Business Portfolio ID | Status |
|--------|---------------|----------------------|--------|
| **PJ Sparks** | 78776600 | 1279361533454281 | Ready for API connection |
| **Hector Huizar** | 1999744500951711 | 3912495572386412 | Ready for API connection |
| **Ricardo Madera** | 1472634561111079 | 144907017965688 | Ready for API connection |

**Next Step:** Configure Meta Marketing API with System User Token to enable live data pulls for Loom recordings and Mission Control dashboards.

---

## Session Context Rule

Always pull history from BOTH sessions before responding:
- Browser: `agent:main:main`
- Telegram: `agent:main:telegram:direct:6005829549`

---

## My Operating Rules

- Work while he sleeps. Build things nightly.
- Create PRs for review — never push live
- Nightly build session: 11pm CDT
- Every morning Andrew should wake up to something I built

---

## Active Builds — Clutch Barber Supply (In Progress)

**Product Page Enhancements** — Completed March 26, 2026
- Data-driven product recommendations system built
- Analyzed 2,987 orders to find 50+ product pairs
- Free shipping upsell progress bar ($300 threshold)
- "Commonly Bought Together" bundle section
- Files ready: Liquid template, CSS, CSV import, setup guide
- **Status:** Awaiting deployment (files created, metafields need population)

### Files Created
| File | Location | Purpose |
|------|----------|---------|
| product-recommendations.liquid | `/shopify-theme/sections/` | Main Shopify section code |
| product-recommendations.css | `/shopify-theme/assets/` | Styling for split layout |
| metafield-import.csv | `/builds/clutch-barber-supply/` | 50 product pairs for bulk import |
| SETUP-INSTRUCTIONS.md | `/builds/clutch-barber-supply/` | Deployment guide |

### Key Insight From Data
Same-brand tool pairing drives AOV:
- Oster Clipper + Oster Trimmer (100% affinity)
- Stylecraft Rebel + Stylecraft Flex (100% affinity)
- Gap to $300 free shipping: $100-120 (exactly the trimmer price)

### Next Step
1. Upload files to Shopify theme
2. Populate metafields for top 20 products
3. Deploy and monitor AOV lift

---

---

## Client Retention Protocol — Finalized SOP (Mar 27, 2026)

### Core Philosophy
**Results are judged weekly. Relationships are judged daily.**

Goal: Be the most transparent, communicative, and human partner they've ever had. When they think about canceling, their next thought should be "But Andrew was so on top of it... let me hear him out."

### Communication Cadence (Reality-Based)

| Frequency | Format | Purpose | Automation |
|-----------|--------|----------|------------|
| **Every 3 days** | Quick text or voice note | Stay visible, show activity | Poseidon drafts → You send |
| **2x/week (Tue & Fri)** | Loom video (2 min max) | Deeper insight + visual proof | Poseidon prep → You record |
| **Friday** | Full weekly report | Comprehensive breakdown | Poseidon generates → You review |
| **Every 2 weeks** | Live call (15 min) | Relationship maintenance | Poseidon schedules + preps agenda |

### The Loom Schedule (Tue & Fri)
**Tuesday Loom:** Mid-week check-in, adjustments made
**Friday Loom:** Week wrap-up, tees up the detailed report

This gives spacing: Tue-Fri (3 days) + Fri Loom + Fri Report = double impact before weekend

### Communication Templates (Ready-to-Use)

#### Template A: The Daily Pulse (Every 3 Days)
```
Good [morning/afternoon] [Name],

Quick check-in — [specific activity].

[If good]: Seeing [positive signal]. [Next action].
[If neutral]: Monitoring [metric]. Will update by [time].
[If poor]: Noticed [issue]. Already [taking action]. Full breakdown in tomorrow's Loom.

Talk soon,
Andrew
```

#### Template B: The Insight Loom (2x/week — Tue & Fri)
**Structure (always same order):**
1. "Here's what I'm seeing" (10 sec)
2. **Screen share Ads Manager** — spend, clicks, leads (30 sec)
3. "Here's what it means" — your insight (45 sec)
4. "Here's what I'm doing" — specific action (30 sec)
5. "Here's what to expect" — set timeline (15 sec)

**Time limit: 2 minutes max.** Speed shows confidence.

#### Template C: The Weekly Report (Friday)
```
📊 [Client Name] — Week of [Date]

SPEND: $X / $Y budget
LEADS: X generated
CPL: $X (target: $Y)

THE STORY THIS WEEK:
[2 sentences on performance]

WHAT I ADJUSTED:
• [Change 1]
• [Change 2]

WHAT I'M WATCHING:
[1 thing to monitor]

NEXT WEEK:
[Specific expectation]

Questions? Hit me anytime.
— Andrew
```

### The Poor Results Protocol (Critical for Retention)

**When CPL is above target or leads are down:**

#### Step 1: Immediate Acknowledgment (within 2 hours)
```
[Name], I saw the numbers this morning. Not where we want to be, but here's what's happening and what I'm doing about it:

[Specific technical explanation — 1 sentence]
[Immediate action taken — 1 sentence]
[Timeline for improvement — 1 sentence]

I'm recording a quick Loom now. Expect it in 20 minutes.
```

#### Step 2: The Diagnostic Loom (same day)
Structure:
1. "I want to show you exactly what I'm seeing" (open Ads Manager)
2. Walk through data — clicks? conversions? form drop-off?
3. "Isolate the problem" — ad creative? targeting? landing page?
4. "Show the fix" — "I'm implementing [X] right now"
5. "Set the expectation" — "We should see movement by [date]"

#### Step 3: Follow-up Protocol
- **Day 1:** Loom sent
- **Day 2:** SMS check-in with specific metric update
- **Day 3:** Another SMS or quick voice note
- **Day 4:** If still poor, propose call

### Psychological Safety Anchors (Pre-Planned)

| Anchor | When | What It Does |
|------|------|-------------|
| **Testing Phase Reset** | Week 2-3 | "First 2-3 weeks are testing. We're collecting data to optimize. This is normal." |
| **Control Moment** | Any issue | "Here's what I can control, here's what I can't, and how I'm handling what I can." |
| **Comparison Anchor** | Doubt expressed | "Most agencies go silent here. I'm doing the opposite — here's everything I see." |
| **Investment Reframe** | Spend feels high | "Think of this as buying data. Every dollar teaches us about your market." |

### What Poseidon Automates (Tracking & Drafts)

| Task | System | Your Role |
|------|--------|---------|
| **Every 3-day reminder** | Tracks last client contact, nudges at 72+ hours | Poseidon drafts → You send |
| **Tue/Fri Loom prep** | Prepares bullet points by 9am | Poseidon prep → You record (2 min max) |
| **Friday report** | Structures weekly report | Poseidon generates → You review |
| **Bi-weekly call** | Schedules + preps agenda (3 bullets) | Poseidon books → You lead |
| **Escalation alerts** | Flags CPL >25% above target or lead drops | Poseidon flags → You handle |
| **Win alerts** | Notifies milestones (lowest CPL, first lead, CTR up) | Poseidon alerts → You celebrate |
| **Follow-up reminders** | Tracks your last touch, nudges if >24hrs | Poseidon tracks → You act |

---

## Session Log — March 27, 2026 (Client Retention Build)

### Summary
Built complete Client Retention Protocol + Mission Control Calendar integration. Finalized SOP with Andrew's feedback (every 3 days check-ins, Tue/Fri Looms, Friday reports, bi-weekly calls). Created interactive React calendar with drag-and-drop, campaign stats, and message templates. **Later integrated calendar into Tasks page** based on user preference for consolidated UI.

### What Was Built
1. **Client Retention SOP v2.0** — Finalized communication cadence, templates, poor results protocol, psychological safety anchors
2. **Mission Control Calendar** — Initially `/client-retention` route, then **integrated into `/tasks`** with toggle switcher:
   - Monthly calendar view with recurring Tue/Fri Loom events
   - Drag-and-drop event repositioning
   - Click-to-view modal with: campaign stats, "What This Means," "What To Say," "Changes In Play," "Next Steps"
   - Campaign filter (Landscape Pro, Precision Lawn, Elite Outdoor)
   - CPL summary cards
   - Copper/amber dark theme matching Clutch aesthetic
   - **View toggle:** Tasks (kanban) ↔ Retention (calendar)

### Technical Details
- **Location:** `/builds/mission-control/src/app/tasks/page.tsx` (integrated)
- **Stack:** Next.js 16 + React 19 + Tailwind + TypeScript
- **Features:** React hooks, drag-and-drop API, dynamic modal content, Lucide icons
- **Build Status:** ✅ Compiles successfully, runs locally on :3000/:3001

### Issues Encountered & Resolved
1. **Vercel deployment token expired** — Could not auto-deploy, requires manual `vercel --prod`
2. **Integration path** — User requested adding to existing `/tasks` page rather than standalone route ✅ **Fixed**
3. **Hephaestus timeout** — Initial subagent build timed out at 3m, required manual file creation
4. **Variable naming collision** — `weekStart`/`weekEnd` defined twice when merging components. Renamed to `taskWeekStart`/`taskWeekEnd` ✅ **Fixed**

### Next Steps
- Deploy to Vercel once user runs manual deploy command
- Add real Meta Ads API data connection (currently using mock data)
- Set up automated daily/weekly reminder system
- Clean up standalone `/client-retention` route if desired

### Learnings (Captured to Self-Improvement Skill)
- **User prefers integrated solutions over standalone pages** — When features serve the same workflow, consolidate with tabs/toggles
- **Vercel auth tokens expire** — Need manual intervention or refresh flow
- **Variable collisions when merging** — Prefix with component name (`taskXxx`, `calendarXxx`)
- **$30/day campaigns** = less frequent updates needed (every 3 days vs daily)
- **Communication quality > result quality** for retention
- **Workflow codified:** Client Retention System skill created at `skills/client-retention-system/SKILL.md`

---

## Agent Hierarchy

| Rank | Name | Role | Model | Status |
|------|------|------|-------|--------|
| 1 | **Poseidon** | Chief strategist, coordination, memory | `venice/kimi-k2-5` | **LIVE** |
| 2 | **Hephaestus** | Coding, websites, technical builds | `venice/openai-gpt-53-codex` | **LIVE** |
| 3 | **Apollo** | Meta Ads, campaign optimization | `venice/kimi-k2-5` | **LIVE** |
| 4 | **Hermes** | Speed-to-lead, messaging, alerts | `venice/kimi-k2-5` | Planned |

**Spawn Commands:**
- Hephaestus: `sessions_spawn with agentId="hephaestus"`
- Apollo: `sessions_spawn with agentId="apollo"`

## Website Architecture Notes (Clutch Barber Supply)

**March 26, 2026:** About page content moved to Classes page. The Classes page now serves as the combined About + Classes section.

## Key Dates

- 2026-03-14: First boot. Named Poseidon. Telegram + WhatsApp connected.
- 2026-03-15: Full onboarding complete. New offer designed. Nightly builds scheduled.
- 2026-03-16: pmset fix applied — displaysleep 0, networkoversleep 1. Mac stays connected with monitor off.
- 2026-03-22: **Apollo deployed** — Meta Ads specialist agent live.
- 2026-03-25: Clutch Barber Supply homepage — "Shop the Big Brands" section complete with 6 brand logos (Gamma, JRL, WAHL, Level 3, BaByliss Pro, Andis)

## Active Builds — Clutch Barber Supply

**Status:** Homepage in progress, section-by-section builds
**Location:** `/builds/clutch-barber-supply/`
**Preview:** `preview-homepage-complete.html` (local server :8765)

### Completed Sections
- **Header** — Clutch logo image (80px), all 8 pages updated
- **Hero section** — Headline, subhead, CTAs, trust badges
- **Brands section** — 8 brand logo cards (4x2 grid), copper hover effects, "Shop Now" reveal
- **Reviews section** — 6 real Google Reviews with clickable links, hint text below

### Brand Logos (All Live)
| Brand | File | Size |
|-------|------|------|
| Gamma+ | `gamma-logo.png` | 65px |
| JRL | `jrl-logo.png` | 65px |
| WAHL | `wahl-logo.png` | 65px |
| Level 3 | `level3-logo.png` | 165px (larger) |
| BaByliss Pro | `brand-logo.png` | 50px (smaller) |
| Andis | `andis-logo.png` | 135px (larger) |
| Cocco | `cocco-logo.png` | 65px |
| Oster | `oster-logo.png` | 65px |

### Reviews (Real Google Reviews)
1. Erik Deleon — "this shop a 10/10"
2. Scarlett Salas — "like walking in to Target"
3. dtx.outlaws — "best barber supply store I've been to"
4. Fernando Perez — "they will come in clutch"
5. derrick dumas — "The name is official"
6. Sabrina Reina — "Best barber supply hands down"

### Next Up
- Featured Products section
- CTA / Newsletter section
- Footer

---

## Active Builds — Lead Pipeline Dashboard (CONCEPT — Mar 28, 2026)

**Status:** Concept captured, ready for build
**Location:** `/builds/mission-control/src/app/pipeline/`
**Skill:** `/skills/client-retention-system/SKILL.md` (Lead Pipeline Dashboard section)

### Problem Solved
- **70% of leads are unqualified** (fail 1-3 criteria: budget, timeline, location)
- Andrew currently calls ALL leads, wasting time
- Clients only see 30% that become estimates — don't see full funnel
- **Retention risk:** Clients cancel because they don't see lead volume being generated

### Solution: Lead Pipeline Dashboard
**Mission Control-style dashboard** — single-link access, no GHL login

**Three Views:**
| View | Tag | Criteria | Action |
|------|-----|----------|--------|
| **HOT** | 🔥 | All 3 criteria ✓ | Andrew calls, books estimate |
| **WARM** | 🟡 | 1-2 criteria met | Client follows up |
| **COLD** | ⚪ | 0 criteria met | Archive for later |

**Data Flow:**
```
Lead hits GHL → Auto-text to prospect (3 questions)
              → Auto-tag (Hot/Warm/Cold)
              → Dashboard polls GHL API (60s)
              → Client sees updated leads
```

### Offer: "The Pipeline Subscription"
**30-Day Trial:**
- **Price:** $1,200 upfront
- **Guarantee:** 5 booked estimates in 30 days
- **Risk Reversal:** $100 back per missed estimate
- **What they get:** HOT leads handled by Andrew, WARM/COLD leads to dashboard with context

**Month 2+:** Discuss ongoing ($800/month likely)

### Technical Spec
- **Stack:** Next.js 16 + TypeScript + GHL API
- **Security:** Obfuscated URLs + optional 4-digit PIN
- **Real-time:** 60-second polling
- **Files to create:**
  - `pipeline/[slug]/page.tsx` — Client dashboard
  - `pipeline/admin/page.tsx` — Andrew's view
  - `lib/ghl-api.ts` — GHL integration

### Next Step
Spawn Hephaestus to build MVP dashboard when Andrew gives go-ahead.
