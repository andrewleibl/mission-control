# Learnings Log

## [LRN-20250325-001] best_practice

**Logged**: 2026-03-25T13:06:00Z
**Priority**: high
**Status**: promoted
**Area**: frontend

### Summary
Website build workflow refined: Image asset handling via file:// URLs, iterative CSS sizing, and grid layout management for brand/logo sections.

### Details
Clutch Barber Supply homepage build session revealed effective patterns for real-time collaboration on visual assets:

**Image Handling Pattern:**
- User provides images via `file:///Users/poseidon/Downloads/...` URLs
- Use `exec cp` to copy from Downloads to project assets folder
- Verify with `file` command to ensure valid image format
- HTML references relative path: `assets/logos/brand-logo.png`

**Iterative Sizing Workflow:**
- Start with default size (65px max-height)
- User requests "bigger" → jump to 85px
- "Still bigger" → 100px → 110px → 120px → 135px, etc.
- Final fine-tuning: 150px → 165px (tiny increments)
- Some brands need different sizes (Level 3 logo needed 165px, Andis 135px, BaByliss 50px)

**Grid Management:**
- 6 brands: 3x2 grid (`grid-template-columns: repeat(3, 1fr)`)
- 8 brands: 4x2 grid (`grid-template-columns: repeat(4, 1fr)`)
- All cards uniform sizing for consistency

**Common Bugs:**
- Duplicate CSS rules override each other (check for multiple `.classname` definitions)
- Browser caching prevents image updates (hard refresh Cmd+Shift+R)
- Cache-busting: rename file or add `?v=2` query param

### Suggested Action
Update TOOLS.md Website Build Workflow section with these patterns. Apply to future Shopify/e-commerce builds.

### Metadata
- Source: user_feedback
- Related Files: /builds/clutch-barber-supply/preview-homepage-complete.html
- Tags: css, images, workflow, shopify
- Pattern-Key: workflow.image_assets
- Recurrence-Count: 1
- First-Seen: 2026-03-25
- Last-Seen: 2026-03-25

### Resolution
- **Resolved**: 2026-03-25T13:30:00Z
- **Promoted**: TOOLS.md
- **Notes**: Added to Website Build Workflow section in TOOLS.md with image handling and iterative sizing patterns.

---

## [LRN-20250325-002] best_practice

**Logged**: 2026-03-25T13:47:00Z
**Priority**: high
**Status**: promoted
**Area**: frontend

### Summary
Cross-page header consistency requires batch updates across all HTML files. Browser caching patterns for image updates.

### Details
Clutch Barber Supply multi-page site update revealed critical workflow patterns:

**Cross-Page Consistency:**
- Shared elements (header logo) require updating EVERY HTML file individually
- 8 pages × 2 edits each = 16 edits for one change
- Missing one page causes visual inconsistency when user navigates
- Risk: User sees change on homepage but old version on Shop page

**Browser Caching Solutions:**
- Symptom: Images/code updated but browser shows old version
- Hard refresh: Cmd+Shift+R (Mac) clears cache for current page
- Cache-busting: Add `?v=2` query param to force reload: `image.png?v=2`
- Incognito/Private mode: Bypasses cache entirely
- Nuclear option: Rename file (e.g., `logo-v2.png`)

**Multi-File Update Pattern:**
```bash
# Find all files needing update
grep -l "OLD_TEXT" *.html

# Batch edit with sed or edit tool
# Must update CSS and HTML in each file
```

**Google Reviews Integration:**
- Real reviews with links add authenticity
- Each card should link to actual Google Review
- Add hint text: "Click any review to read the full story"
- Position hint below reviews, centered

### Suggested Action
Update TOOLS.md with cross-page update checklist. Create script template for batch header/footer updates.

### Metadata
- Source: user_feedback
- Related Files: /builds/clutch-barber-supply/*.html
- Tags: multi-page, caching, workflow, header
- Pattern-Key: workflow.multi_page_consistency
- Recurrence-Count: 1
- First-Seen: 2026-03-25
- Last-Seen: 2026-03-25

### Resolution
- **Resolved**: 2026-03-25T13:47:00Z
- **Promoted**: TOOLS.md
- **Notes**: Added cross-page consistency and caching patterns to TOOLS.md

---
