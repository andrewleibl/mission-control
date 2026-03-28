# Mission Control — Setup Instructions

Built by Poseidon on 2026-03-15/16 nightly build session.
GitHub: https://github.com/andrewleibl/mission-control

---

## What It Is

A full-stack command center dashboard for Straight Point Marketing. Red/black theme. Built in Next.js 16 with Tailwind v4 and Recharts.

**Sections:**
- **Task Board** — Kanban (Backlog / In Progress / Done) with Andrew + Poseidon lanes
- **Calendar** — All cron jobs, next run times, last run status
- **Docs** — Searchable file catalogue of all /builds/ files
- **Clients CRM** — 4 client profiles with full tabs, at-risk flags, Monday scripts
- **Chat** — Direct interface to talk to Poseidon (requires Gateway running)
- **Usage & Cost** — Daily spend, session breakdown, model breakdown with graphs

---

## Requirements

- Node.js 18+ (20+ recommended)
- npm
- OpenClaw Gateway running on port 18789 (for Chat section)

---

## Installation

```bash
# Clone the repo
git clone https://github.com/andrewleibl/mission-control.git
cd mission-control

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Production Build

```bash
npm run build
npm start
```

---

## Environment Variables

No env vars required to run. The Chat section will auto-detect if OpenClaw is running at `http://localhost:18789` and show Connected/Disconnected.

If you want to run OpenClaw on a different port, update `src/app/chat/page.tsx` — search for `18789` and replace with your port.

---

## Data Files

All data lives in `/src/data/*.json`. Edit these to update:

| File | What it controls |
|------|-----------------|
| `clients.json` | Client profiles, stats, logs, tasks, Monday scripts |
| `tasks.json` | Kanban board tasks (backlog/inProgress/done) |
| `crons.json` | Calendar — all scheduled jobs |
| `docs.json` | Docs section file catalogue |
| `usage.json` | Usage & Cost charts and numbers |

**No database, no API (except Chat proxy).** Everything is static JSON — fast and simple.

---

## File Structure

```
src/
  app/
    layout.tsx          # Root layout + sidebar
    page.tsx            # Redirects to /tasks
    tasks/page.tsx      # Kanban board
    calendar/page.tsx   # Cron job calendar
    docs/page.tsx       # File catalogue
    clients/page.tsx    # CRM grid
    chat/page.tsx       # Poseidon chat
    usage/page.tsx      # Usage & cost graphs
    globals.css         # Design system (red/black theme)
  components/
    Sidebar.tsx         # Left nav
    ClientModal.tsx     # Client detail modal (6 tabs)
  data/
    *.json              # All app data
```

---

## Chat Setup

The Chat section proxies messages to OpenClaw:

```
POST http://localhost:18789/api/message
Body: { "sessionKey": "agent:main:main", "message": "..." }
```

Make sure the OpenClaw Gateway is running before using Chat. The section shows a green/red indicator at the top right.

---

## Known Issues / TODOs

- Task drag-and-drop is visual only — no persistence yet (would need a backend or localStorage)
- Usage data is static — could be wired to `openclaw usage` CLI or OpenClaw API
- Client data is static — future: sync from Google Sheets via gog CLI
- No auth — this is a local dev tool, don't expose publicly without adding auth

---

## Notes for Andrew

Built entirely by Poseidon overnight (2026-03-15/16 nightly session).

To update client data after a performance review or call log entry, just edit `src/data/clients.json` — you don't need to touch any code. Same for tasks and cron jobs.

The Monday Morning Script tab in each client profile has a pre-written script ready to use or adapt before your Monday calls.
