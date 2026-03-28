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

## [LRN-20250328-001] localStorage Overwrites Initial React State

**Logged**: 2026-03-28T11:51:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
When React state is initialized with hardcoded data but also has a `useEffect` that loads from `localStorage`, the localStorage value will overwrite the initial state on mount — even if localStorage is empty or has stale data.

### Details
**Scenario:** Adding new events to a retention calendar's initial state:
```javascript
const [events, setEvents] = useState<RetentionEvent[]>([
  { id: "pj-weekly-001", ... },  // existing
  { id: "hector-weekly-001", ... },  // NEW
  { id: "ricardo-weekly-001", ... },  // NEW
]);
```

**Problem:** A `useEffect` was loading from localStorage on mount:
```javascript
useEffect(() => {
  const stored = localStorage.getItem('mc_retention_events_v2');
  if (stored) setEvents(JSON.parse(stored));
}, []);
```

The user had previously visited the page, so localStorage had an old events array (without the new events). This effect ran after mount and overwrote the hardcoded initial state, making the new events disappear.

**The Fix:** Clear localStorage on mount to force use of the fresh initial state:
```javascript
useEffect(() => {
  localStorage.removeItem('mc_retention_events_v2');
  localStorage.removeItem('mc_retention_events_client_page');
}, []);
```

**Better Long-Term Fix:** Merge strategy — check if events exist in storage that aren't in defaults, don't blindly replace.

### Suggested Action
When using localStorage persistence with React state:
1. **Option A**: Clear old keys when you want fresh data to appear
2. **Option B**: Merge instead of replace — add new defaults to existing storage
3. **Option C**: Version your storage keys (`events_v1`, `events_v2`) when schema changes
4. **Option D**: Use a "last updated" timestamp to decide which wins

Never assume `useState(initial)` will be visible if `useEffect` modifies state on mount.

### Metadata
- Source: error
- Related Files: /builds/mission-control/src/app/client-retention/page.tsx
- Tags: react, localstorage, state, useeffect, hydration
- Pattern-Key: state.localstorage-hydration-conflict

### Resolution
- **Resolved**: 2026-03-28T11:51:00Z
- **Commit**: Fixed in place during session
- **Notes**: Added localStorage.clear() on mount to force fresh initial state

---

---

## [LRN-20250328-002] Weekly Breakdown Structure — Section 1 Format

**Logged**: 2026-03-28T12:28:00Z
**Priority**: high
**Status**: active
**Area**: content, reporting

### Summary
Weekly breakdown Section 1 "How Is The Campaign Going?" must include BOTH:
1. **GOOD — What's Working** (green, ✓)
2. **NEEDS IMPROVING** (yellow, ▲)

### Format
```
## Section 1: How Is The Campaign Going?

**Main Summary**: [1-2 sentence overview]

**✓ GOOD — WHAT'S WORKING** (green section)
- [Positive bullet 1]
- [Positive bullet 2]
- [Positive bullet 3]
- [Positive bullet 4]

**▲ NEEDS IMPROVING** (yellow section)
- [Action item 1]
- [Action item 2]
- [Action item 3]
- [Action item 4]
```

### Why This Structure Works
- Shows balanced perspective (not just problems)
- Celebrates wins first (psychological safety)
- Clear action items after (what we're doing about it)
- Green/yellow color coding matches tone
- Arrow bullets (→) for consistency

### Data Structure
```typescript
section1: {
  mainText: string
  goods: string[]        // What's working (green)
  improvements: string[] // What needs work (yellow)
}
```

### Suggested Action
For every weekly breakdown going forward:
1. Start with 4 GOOD items (positive trends, wins)
2. Follow with 4 IMPROVEMENT items (actions, fixes, watch points)
3. Use consistent labels and colors
4. Match client tone — upbeat but honest

### Metadata
- Source: user_feedback
- Related Files: /builds/mission-control/src/app/loom-recording/page.tsx
- Tags: reporting, content-structure, client-retention
- Pattern-Key: content.weekly-breakdown-format
