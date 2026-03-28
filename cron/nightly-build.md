# Nightly Build Instructions

Read MEMORY.md and today's memory file for context before starting.
Push all changes to GitHub. Write a summary to memory/YYYY-MM-DD.md when done.
Morning brief should include: what was built, GitHub link, how to run locally.

---

## TONIGHT'S PRIORITIES

### 1. TASK BOARD — Full Rebuild (TOP PRIORITY)
Location: /Users/poseidon/.openclaw/workspace/builds/mission-control/src/app/tasks/

Tear out the current static board and rebuild it completely. Requirements:

**Columns (pipeline order):**
- Recurring | Backlog | In Progress | Review | Done

**Stats bar at top:**
- Tasks this week, In Progress count, Total count, Completion %

**Drag and drop:**
- Cards must be draggable between columns
- Use @hello-pangea/dnd (install it) — do NOT use deprecated react-beautiful-dnd
- Persist state to localStorage so it survives refresh

**Task cards must include:**
- Title + short description
- Assignee badge (Andrew or Poseidon 🔱) with distinct colors
- Project tag (color-coded pill)
- Due date
- Created timestamp
- Priority indicator (low/medium/high)

**Add new task:**
- "+ Add Task" button at top of each column
- Inline modal/drawer: title, description, assignee, due date, project, priority
- No page reload — updates board instantly

**Live Activity Panel (right side):**
- Feed of recent task movements + completions
- "Poseidon is working on: [current task]" indicator
- Timestamps on each event

**Seed with real tasks:**
- Andrew: Review caller recordings, Send client check-ins, Cold SMS setup
- Poseidon: Mission Control build, Morning briefs, Nightly builds, Clutch audit

**Style:** Stay on theme — red/black, clean cards, high contrast. Productivity-first.

---

### 2. CALENDAR — Visual Weekly Grid (SECOND PRIORITY)
Location: /Users/poseidon/.openclaw/workspace/builds/mission-control/src/app/calendar/

Rebuild from flat list to proper weekly calendar grid. Requirements:

**Layout:**
- Sun–Sat column headers
- Current day highlighted (red accent)
- Cron jobs rendered as color-coded event cards inside each day cell
- Show job name + run time on each card

**Always Running section:**
- Top of page, above the grid
- Pill badges for recurring jobs (Morning Brief, Nightly Build)

**Pull live cron data:**
- Read from /api/crons route (or shell out to `openclaw cron list --json`)
- Show next run time, last run status (green=ok, red=error, yellow=running)

**Task integration:**
- Tasks with due dates should appear on their due date in the calendar
- Assignee color coding — red for Andrew, darker for Poseidon

---

### 3. CLUTCH BARBER SUPPLY — Conversion Audit (THIRD PRIORITY)
Location: /Users/poseidon/.openclaw/workspace/builds/clutch-barber-supply/

Vicelia Tinde — $900 still uncollected. This is a high-ticket Shopify redesign. Andrew needs to walk into tomorrow knowing exactly what's broken and what we're fixing.

**Do a full audit of clutchbarbersupply.com:**
- Crawl homepage, product pages, collections, cart, checkout flow
- Use web_fetch on key pages, take notes on every friction point
- Research top-performing barber/beauty supply Shopify stores for benchmarks
- Use Gemini CLI for deeper web research if available

**Deliver a complete strategy doc with:**
1. What's currently working (keep it)
2. Kill list — what's actively hurting conversions (remove it)
3. Full redesign strategy — what we're building, why, in priority order
4. Above-the-fold recommendations (first thing visitor sees)
5. Product page improvements
6. Trust signals missing
7. Mobile experience gaps
8. Checkout friction points
9. Projected conversion impact for each change

**Backed by data and real examples — not opinions.**
Save to /Users/poseidon/.openclaw/workspace/builds/clutch-barber-supply/conversion-audit.md

Also draft a short client update message Andrew can send Vicelia tomorrow — progress update, what the strategy looks like, builds confidence that the project is moving.
Save to /Users/poseidon/.openclaw/workspace/builds/clutch-barber-supply/vicelia-update-draft.md

---

## After Building
- Run `npm run build` to verify no TypeScript errors
- Push to GitHub (andrewleibl/mission-control)
- Write summary to memory file
