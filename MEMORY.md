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
- Vicelia: Shopify redesign, HIGH PRIORITY

---

## Contacts

- **Andrew — Telegram:** @andrewleibl (ID: 6005829549) — PRIMARY
- **Andrew — WhatsApp:** +1 (414) 517-1561
- **Agency email:** andrew@straightpointmarketing.com
- **GitHub:** andrewleibl (github.com/andrewleibl)
- **My Gmail:** poseidonclaudebot@gmail.com

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
