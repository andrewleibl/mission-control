---
name: client-retention-system
description: Build client retention systems and Mission Control dashboards for SMMA agencies. Use when creating client communication protocols, retention SOPs, weekly reporting systems, or interactive calendar dashboards for tracking client touchpoints. Includes proven cadences (Tue/Fri Looms, every-3-day check-ins), templates, and React/Next.js calendar components.
---

# Client Retention System

Proven retention system for SMMA agencies. Prevents churn through proactive communication, transparent reporting, and systematic relationship management.

## Core Philosophy

**Results are judged weekly. Relationships are judged daily.**

Goal: Be the most transparent, communicative partner they've ever had. When they think about canceling, their next thought should be "But Andrew was so on top of it... let me hear him out."

## Communication Cadence (Reality-Based)

| Frequency | Format | Purpose |
|-----------|--------|----------|
| **Every 3 days** | Quick text/voice note | Stay visible, show activity |
| **2x/week (Tue & Fri)** | Loom video (2 min max) | Deeper insight + visual proof |
| **Friday** | Full weekly report | Comprehensive breakdown |
| **Every 2 weeks** | Live call (15 min) | Relationship maintenance |

### The Loom Schedule
**Tuesday:** Mid-week check-in, adjustments made  
**Friday:** Week wrap-up, tees up detailed report

Spacing: Tue-Fri (3 days) + Fri Loom + Fri Report = double impact before weekend

## Communication Templates

### Template A: The Daily Pulse (Every 3 Days)
```
Good [morning/afternoon] [Name],

Quick check-in — [specific activity].

[If good]: Seeing [positive signal]. [Next action].
[If neutral]: Monitoring [metric]. Will update by [time].
[If poor]: Noticed [issue]. Already [taking action]. Full breakdown in tomorrow's Loom.

Talk soon,
[Your name]
```

### Template B: The Insight Loom (2x/week)
**Structure (always same order, 2 min max):**
1. "Here's what I'm seeing" (10 sec)
2. **Screen share Ads Manager** — spend, clicks, leads (30 sec)
3. "Here's what it means" — your insight (45 sec)
4. "Here's what I'm doing" — specific action (30 sec)
5. "Here's what to expect" — set timeline (15 sec)

### Template C: The Weekly Report (Friday)
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
```

## The Poor Results Protocol

**When CPL is above target or leads are down:**

### Step 1: Immediate Acknowledgment (within 2 hours)
```
[Name], I saw the numbers this morning. Not where we want to be, but here's what's happening and what I'm doing about it:

[Specific technical explanation — 1 sentence]
[Immediate action taken — 1 sentence]
[Timeline for improvement — 1 sentence]

I'm recording a quick Loom now. Expect it in 20 minutes.
```

### Step 2: The Diagnostic Loom (same day)
1. "I want to show you exactly what I'm seeing" (open Ads Manager)
2. Walk through data — clicks? conversions? form drop-off?
3. "Isolate the problem" — ad creative? targeting? landing page?
4. "Show the fix" — "I'm implementing [X] right now"
5. "Set the expectation" — "We should see movement by [date]"

### Step 3: Follow-up Protocol
- **Day 1:** Loom sent
- **Day 2:** SMS check-in with specific metric update
- **Day 3:** Another SMS or quick voice note
- **Day 4:** If still poor, propose call

## Psychological Safety Anchors

| Anchor | When | What It Does |
|--------|------|-------------|
| **Testing Phase Reset** | Week 2-3 | "First 2-3 weeks are testing. We're collecting data to optimize. This is normal." |
| **Control Moment** | Any issue | "Here's what I can control, here's what I can't, and how I'm handling what I can." |
| **Comparison Anchor** | Doubt expressed | "Most agencies go silent here. I'm doing the opposite — here's everything I see." |
| **Investment Reframe** | Spend feels high | "Think of this as buying data. Every dollar teaches us about your market." |

## Mission Control Calendar

Interactive React/Next.js dashboard for tracking all client touchpoints and campaign performance.

### Tech Stack
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Drag-and-drop API (native HTML5)

### Key Features
- Monthly calendar view with recurring Tue/Fri Loom events
- Drag-and-drop event repositioning
- Click-to-view modal with: campaign stats, "What This Means," "What To Say," "Changes In Play," "Next Steps"
- Campaign filter (multiple clients)
- CPL summary cards
- Dark theme (copper/amber accents)

### Component Structure
```
app/client-retention/page.tsx    # Main calendar page
components/
  - CalendarGrid                 # Monthly grid
  - EventCard                    # Draggable event cards
  - EventModal                   # Click-to-view details
  - CPLSummaryCards              # Top stats row
```

## Automation Opportunities

| Task | System | Agent Role |
|------|--------|-----------|
| Every 3-day reminder | Tracks last contact, nudges at 72+ hours | Draft → Human sends |
| Tue/Fri Loom prep | Prepares bullet points by 9am | Prep → Human records |
| Friday report | Structures weekly report | Generate → Human reviews |
| Bi-weekly call | Schedules + preps agenda | Books → Human leads |
| Escalation alerts | Flags CPL >25% above target | Flags → Human handles |
| Win alerts | Notifies milestones | Alerts → Human celebrates |

## Key Learnings (Mar 27, 2026)

1. **Communication quality > result quality for retention** — proactive transparency builds trust faster than perfect metrics
2. **$30/day campaigns = less frequent updates needed** — every 3 days vs daily for smaller spends
3. **Tue/Fri Loom + Friday Report rhythm** creates predictable client expectations
4. **2-minute Loom max** — speed shows confidence, respects time
5. **Integrated solutions > standalone pages** — user preferred calendar embedded in /tasks vs separate route
6. **Unified edit mode > granular editing** — one edit button controlling entire section (main text + all bullets) is cleaner UX than field-by-field editing
7. **Arrow bullets (→) > standard bullets** — user's preferred formatting for action items
8. **Numbered sections with badges** — clear visual hierarchy (1, 2, 3) guides client through report flow
9. **Charts + narrative sections** — visual data (top) + contextual explanation (bottom) creates complete story
10. **Download JSON > Send email** — giving user control over final delivery method preferred over automatic sends

---

## Loom Recording Interface

**New addition (Mar 27, 2026):** Complete `/loom-recording` page for filming weekly client videos. This is the destination after clicking "Open for Loom" from the weekly report modal.

### Purpose
Screen-recording optimized layout for narrating weekly campaign performance to clients. Combines visual charts with editable "Big 3" narrative sections.

### Layout Structure

**Top: Campaign Metrics (4 cards)**
- Campaign Spend vs Budget (progress bar)
- Leads This Week (daily bar chart, Mon-Sun)
- CPL Comparison (this week vs last week + trend)
- CTR with percentage change

**Bottom: The Big 3 Questions**

**Section 1:** "How Is The Campaign Going?"
- Main summary paragraph
- "⚠ FIXES WE'RE IMPLEMENTING" subsection
- Arrow bullet list of actions

**Section 2:** "Changes Made This Week"
- Main summary paragraph
- Arrow bullet list of changes made

**Section 3:** "What To Expect Next Week"
- Main summary paragraph
- Target metrics grid (Leads, CPL, Spend)
- "FOCUS AREAS" subsection with arrow bullets

### Design System

**Red Glow Theme:**
```css
background: linear-gradient(180deg, #1A1A1A 0%, rgba(229, 62, 62, 0.02) 100%);
radial-glow: radial-gradient(ellipse at center, rgba(229, 62, 62, 0.06)...);
section-border: 1px solid rgba(229, 62, 62, 0.1);
```

**Section Cards:**
- Background: `linear-gradient(180deg, #141414 0%, rgba(229, 62, 62, 0.02) 100%)`
- Border: `1px solid rgba(229, 62, 62, 0.1)`
- Border-radius: 16px
- Padding: 20px

**Numbered Badges:**
```
width: 28px, height: 28px
background: linear-gradient(135deg, #E53E3E, #FC8181)
border-radius: 8px
color: white, font-weight: 700
```

**Edit Mode Interface:**
- Single pencil icon (top-right of section)
- Opens unified editing view:
  - Main summary textarea
  - Individual inputs for each bullet (with → prefix)
  - Add/remove item buttons
  - Section-level save/cancel

### Code Structure

**File:** `/builds/mission-control/src/app/loom-recording/page.tsx`

```typescript
// State structure
const [sectionData, setSectionData] = useState({
  section1: {
    mainText: string,
    items: string[]
  },
  section2: {
    mainText: string,
    items: string[]
  },
  section3: {
    mainText: string,
    items: string[],
    targets: {
      leads: string,
      cpl: string,
      spend: string
    }
  }
})
```

**Key Functions:**
- `startEdit(sectionId)` — enters edit mode for entire section
- `updateTempItem(index, value)` — updates individual bullet
- `addTempItem()` — adds new bullet to list
- `removeTempItem(index)` — removes bullet from list
- `saveEdit()` — commits all changes to section

### Workflow Integration

**Weekly Loom Recording Flow:**
1. Tasks → Retention view → Click Friday "Weekly Report" event
2. Modal opens → Click "Open for Loom" button
3. Navigate to `/loom-recording` page
4. Page loads with:
   - Charts populated from campaign data
   - Big 3 sections with pre-filled content
5. Edit any section by clicking pencil icon
6. Make changes → Save
7. Click download icon (top-right) → Get JSON report
8. Record Loom narrating the dashboard
9. Send JSON report to client for reference

### Implementation Notes

**Why Unified Edit Mode:**
User explicitly requested ONE edit button per section. Previous attempt had field-by-field editing which felt fragmented. Unified mode allows editing main text AND all bullets simultaneously, then saving as atomic unit.

**Why Arrow Bullets:**
User preference for "→" over "•" or "-". Creates action-oriented feel. Red color (#E53E3E) ties to brand accent.

**Why Target Metrics in Section 3:**
Creates concrete expectations. "Target Leads: 3-4", "Target CPL: $80-100", "Target Spend: $240-280" gives client measurable goals for next week.

**Download Button Placement:**
Top-right corner (icon only, no text) follows standard UX pattern. Keeps header clean while making functionality discoverable.

## Lead Pipeline Dashboard (NEW — Mar 28, 2026)

**Problem:** 70% of leads are unqualified. Andrew wastes time calling all leads. Clients only see 30% that book — don't see full funnel volume. **Retention risk + time drain.**

**Solution:** Mission Control-style dashboard where clients see ALL leads categorized by qualification status.

### The "Lead Waterfall" Model

**Core Concept:**
- **Andrew handles:** HOT leads (all 3 criteria ✓) → book estimates
- **Client handles:** WARM leads (1-2 criteria) → nurture for later
- **Archive:** COLD leads (disqualified) → context saved for future

**Client Promise:**
> "You're not buying leads. You're buying certainty. I look at every lead, ask 3 questions, and tell you exactly who to call and who to nurture. You just show up."

### Dashboard Structure

**Single-Link Access:**
- URL: `mission-control.com/pipeline/[client-slug]`
- No login required (obfuscated slug for security)
- Optional: 4-digit PIN
- Real-time updates via 60-second polling

**Three Views:**

| View | Tag | Criteria | Action |
|------|-----|----------|--------|
| **HOT** | 🔥 | Budget ✓ + Timeline ✓ + Location ✓ | Andrew calls, books estimate |
| **WARM** | 🟡 | 1-2 criteria met | Client follows up with notes |
| **COLD** | ⚪ | 0 criteria met | Archive, revisit later |

**Lead Card Design:**
```
┌────────────────────────────┐
│ 🔥 HOT LEAD                │
│ Mike Johnson               │
│ $3,500 budget | April     │
│ Grand Prairie              │
│                            │
│ 📞 (214) 555-0192          │
│ 💬 "Ready for estimate"    │
└────────────────────────────┘
```

### Data Flow

```
Lead hits GHL
    ↓
Auto-text sends 3 questions to prospect
    ↓
Prospect replies
    ↓
Auto-tag in GHL (Hot/Warm/Cold)
    ↓
Dashboard polls GHL API (60s)
    ↓
Client view updates
    ↓
Andrew calls HOT leads
    ↓
Client gets notification: "3 new warm leads in your queue"
```

### Offer: "The Pipeline Subscription"

**30-Day Trial:**
- **Price:** $1,200 upfront
- **Guarantee:** 5 booked estimates in 30 days
- **Risk Reversal:** $100 back per missed estimate
- **What they get:**
  - Andrew handles HOT leads (speed-to-lead, calls, books)
  - Dashboard access showing ALL leads
  - WARM/COLD leads delivered with context (budget, timeline, location notes)

**Month 2+:**
- Discuss ongoing relationship
- Likely: $800/month for 5+ estimates + dashboard

**Why This Works:**
- Client sees **volume** (47 leads this month, not just 5 estimates)
- Client sees **system** (not random leads, organized pipeline)
- Andrew focuses on **high-intent only** (HOT leads)
- **Retention anchor:** Hard to cancel when you're handing them a nurture list

### Technical Spec

**Stack:**
- Next.js 16 (Mission Control codebase)
- TypeScript
- GHL API integration
- 60-second polling mechanism

**File Structure:**
```
app/pipeline/
  ├── [slug]/page.tsx       # Client-facing dashboard
  ├── admin/page.tsx        # Andrew's management view
  ├── layout.tsx            # Shared layout, security check
components/
  ├── LeadCard.tsx          # Individual lead display
  ├── LeadColumn.tsx        # Hot/Warm/Cold columns
  ├── LastUpdated.tsx       # Polling indicator
lib/
  ├── ghl-api.ts            # GHL integration
  ├── slug-auth.ts          # URL slug validation
```

**Security:**
- Obfuscated URLs (random 8-char slug)
- Optional 4-digit PIN (stored in cookie)
- Rate limiting (100 requests/hour per slug)

**Key Learning:**
Client retention requires **volume visibility**, not just results. When clients see the full funnel (47 leads → 5 estimates → 12 warm for follow-up), they understand the value. Dashboard makes invisible work visible.

### Build Notes (For Hephaestus)

**When building:**
1. Start with GHL API connection (read leads, filter by tags)
2. Build client slug system (who sees what)
3. Create three-column kanban view (Hot/Warm/Cold)
4. Add polling mechanism (60s interval)
5. Style with Mission Control aesthetic (dark, copper accents)

**Reference files:**
- `/builds/mission-control/src/app/client-retention/` — calendar patterns
- `/builds/mission-control/src/app/loom-recording/` — card design patterns

## Implementation Checklist

- [ ] Define client list and campaign details
- [ ] Set up Meta Ads API connection (for real data)
- [ ] Configure recurring calendar events (Tue/Fri)
- [ ] Create message templates in CRM/texting platform
- [ ] Set up automated reminder system
- [ ] Deploy calendar dashboard
- [ ] Train team on Poor Results Protocol
- [ ] **NEW:** Build Lead Pipeline Dashboard (Hot/Warm/Cold views)
- [ ] **NEW:** Set up GHL auto-tagging for lead qualification
- [ ] **NEW:** Create client onboarding flow for dashboard access
