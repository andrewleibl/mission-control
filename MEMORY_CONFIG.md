# Memory System Config — Poseidon Protocol v2

**Status:** LIVE (March 22, 2026)
**Last Updated:** 2026-03-22 10:15 AM CDT

---

## File Structure

```
memory/
├── 2026-03-22.md          # Daily log (auto-flushed, append-only)
├── bookmarks.md           # Manual bookmarks
└── [future: weekly/]      # Auto-archived weekly summaries

MEMORY.md                  # Distilled long-term (weekly updates)
SOUL.md                    # Identity (read-only)
USER.md                    # Andrew's profile (read-only)
TOOLS.md                   # Tool preferences (read-only)
AGENTS.md                  # Agent hierarchy (read-only)
```

---

## Auto-Flush Mechanism

**Trigger Threshold:** 8,000 tokens (or manual "flush memory")
**Flush Target:** `memory/YYYY-MM-DD.md`
**Behavior:** APPEND — never overwrite existing entries

### Structured Entry Format

```markdown
## Entry [HH:MM] — Tokens: {current_count}

**Session:** {session_key}
**Context:** {last_3_message_summary}

**Key Decisions:**
- {Decision made}

**Constraints/Red Lines:**
- {What NOT to do}

**Open Questions:**
- {Unresolved}

**Action Items:**
- [ ] {Owner}: {Task} by {Deadline}

**Bookmarks:**
- {name}: {reference}

**Tags:** #tag1 #tag2
---
```

---

## Cross-Session Protocol

Before EVERY response:
1. Read `memory/YYYY-MM-DD.md` (today's log)
2. Read `MEMORY.md` (long-term distilled)
3. Query `sessions_list` for active sessions
4. Pull history from BOTH:
   - `agent:main:main` (browser)
   - `agent:main:telegram:direct:6005829549` (Telegram)

---

## Manual Commands

| Command | Action |
|---------|--------|
| "Poseidon, flush memory" | Immediate write to daily file |
| "Bookmark this as [name]" | Store in bookmarks.md |
| "Mark that as P0" | Priority tag on last entry |
| "Pull up [name] bookmark" | Retrieve bookmark |
| "What's my context?" | Summarize all active sessions |

---

## Priority Tags

- `[P0]` — Urgent, blocks other work
- `[P1]` — Important, queue for today
- `[P2]` — Backlog, handle when time

---

## Weekly Distillation

Every Sunday 11 PM CDT:
- Condense daily files → key decisions in MEMORY.md
- Archive daily files to `memory/archive/`
- Reset counter for new week

---

*System active. Tokens: 8,000 threshold. Structured logging enabled.*
