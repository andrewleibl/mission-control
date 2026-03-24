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
