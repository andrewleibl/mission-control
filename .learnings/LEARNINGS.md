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
