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
