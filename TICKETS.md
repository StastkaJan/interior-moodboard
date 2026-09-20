# Implementation tickets

Status: all 16 implementation tickets have delivered code/documentation and automated verification. Physical-device and human-operated keyboard/motion acceptance remains outstanding, including the manual checks referenced by IM-07, IM-14, IM-15, and IM-16. The ticket commits and evidence are recorded in [RELEASE_VALIDATION.md](RELEASE_VALIDATION.md). These are repository delivery records, not issues created in an external tracker. Delivery order follows [ROADMAP.md](ROADMAP.md); integration gates live in [INTEGRATION.md](INTEGRATION.md).

Every ticket must preserve the first-release scope and meet applicable checks from [DEVELOPMENT.md](DEVELOPMENT.md). Dependencies refer to completed behavior, not just files being present. UI work includes semantic controls, visible focus, and a usable narrow layout as it lands.

## S0: Foundation

### IM-01 — Scaffold the app and establish quality commands

**Depends on:** none.

**Work:** inspect Compose and any existing `app/package.json`; scaffold only if absent, using the README's Compose commands. Configure strict TypeScript, CSS Modules, ESLint, Prettier, and Vitest. Commit npm package files and lockfile; record the resolved Node runtime.

**Acceptance:**

- Compose starts the app at the default http://localhost:5175 URL, with source updates visible.
- `dev`, `build`, `check`, `lint`, `format:check`, and one-shot `test` scripts exist and execute successfully. If no meaningful tests exist yet, document that state explicitly; do not add a placeholder assertion.
- README/development status reflects the generated application. `test:e2e` remains pending IM-13.

**Validation:** Compose configuration, startup, and each available script; report the absence of feature tests honestly.

### IM-02 — Build the responsive application shell

**Depends on:** IM-01.

**Work:** add warm-neutral design tokens and a single screen with catalogue, proportional board surface, and item-control area. Use CSS Modules and realistic local sample content.

**Acceptance:**

- Desktop shows an asset rail, central board, and compact controls; narrow screens put catalogue/controls below the board.
- The board displays at a 10:7 ratio without forcing page-wide horizontal scrolling.
- Visible focus, readable contrast, and reduced-motion styling are established.

**Validation:** inspect desktop and narrow layouts and keyboard focus; run applicable quality checks.

## S1: First editable board

### IM-03 — Bundle the asset catalogue

**Depends on:** IM-02.

**Work:** add around 20 furniture/material images and typed metadata with stable IDs, local paths, labels, categories, and aspect ratios. Record provenance and required attribution.

**Acceptance:**

- All catalogue images resolve locally and have correct aspect-ratio metadata.
- Every asset has an accessible labelled add control; no upload or external API is required.
- Catalogue records remain separate from placed item instances.

**Validation:** inspect asset paths, labels, image proportions, and keyboard navigation. Actual add behavior lands in IM-05.

### IM-04 — Define board state and shared geometry

**Depends on:** IM-02.

**Work:** define the versioned board/item types and initial reducer operations for add, move, proportional resize, and remove. Add pure geometry rules for logical bounds and minimum dimensions; document initial size and placement choices.

**Acceptance:**

- The board is 1000 by 700 logical units; items have unique instance IDs and catalogue references.
- Actions preserve finite, in-bounds geometry and asset aspect ratio, including after oversized resize requests.
- Minimum dimensions are compatible with the bundled aspect ratios and board bounds.
- Selection and gesture previews are absent from durable state; array order is the stacking source.

**Validation:** unit tests for add/remove, repeated-asset independence, move bounds, minimum/maximum proportional size, and unchanged unrelated items.

### IM-05 — Connect catalogue, board rendering, and selection

**Depends on:** IM-03, IM-04.

**Work:** wire add controls to the reducer and render positioned DOM items. Add selection and a labelled remove action.

**Acceptance:**

- Adding the same asset twice creates two independently selectable items.
- Both instances render at valid logical positions and scale with the displayed board.
- Removing the selected item clears stale selection and leaves keyboard focus in a useful location.

**Validation:** add/select/remove journey with pointer and keyboard; confirm viewport changes preserve logical positions.

### IM-06 — Add labelled position and size controls

**Depends on:** IM-05.

**Work:** implement the selected-item inspector using shared geometry. Allow numeric position and proportional size editing with clear labels and units.

**Acceptance:**

- Users can add, position, resize, and remove items without dragging.
- Invalid, empty, or out-of-range input cannot commit invalid board state; corrections or errors are clear.
- Changing the controlling size dimension updates the other dimension to preserve aspect ratio.
- Inspector values reflect the committed selected item and update when selection changes.

**Validation:** complete the S1 gate by keyboard; cover meaningful input-validation behavior and geometry boundaries.

## S2: Direct manipulation

### IM-07 — Implement pointer movement with cancellation

**Depends on:** IM-06.

**Work:** convert pointer positions through the displayed board rectangle, capture the active pointer, and render local movement previews.

**Acceptance:**

- Dragging preserves the initial grab offset and stays attached to the pointer at different display scales.
- Release commits one bounded move; `pointercancel` or interrupted capture discards the preview.
- An unrelated pointer cannot take over the active gesture, and gesture resources are cleaned up.
- The inspector reflects the released position; page scrolling remains available outside the manipulation surface.

**Validation:** coordinate-conversion unit tests at multiple scales and offsets; interaction coverage for release/cancellation; manual touch check. Browser regression coverage follows in IM-16.

### IM-08 — Implement proportional pointer resizing

**Depends on:** IM-07.

**Work:** add a discoverable resize affordance for the selected item using the same proportional size rules as the inspector.

**Acceptance:**

- Resize preserves source aspect ratio, minimum dimensions, and board bounds.
- Release commits once; cancellation restores the previous committed size and position.
- The handle remains usable on narrow/touch layouts; the labelled inspector is the keyboard equivalent.

**Validation:** focused resize tests at board edges, minimum/maximum sizes, and multiple display scales; cancellation and inspector agreement checks.

## S3: Complete local board

### IM-09 — Add stacking controls

**Depends on:** IM-06.

**Work:** add labelled forward/backward controls and reducer actions that reorder the items array.

**Acceptance:**

- Overlapping items render in array order and can change order using a keyboard.
- Reordering preserves instance IDs, geometry, and selection.
- Boundary actions are disabled or harmless when the item is already first/last.

**Validation:** reducer tests for both directions, boundaries, and preservation of other item fields; inspect overlapping items.

### IM-10 — Add board title and palette presets

**Depends on:** IM-06.

**Work:** add a labelled title input, several bundled palette presets with stable IDs, and committed reducer actions for both.

**Acceptance:**

- The board title is editable and palette selection visibly changes the board's color treatment.
- Presets are keyboard-selectable with accessible names and a clear selected state.
- Title/palette edits preserve item geometry and order; empty-title handling is defined consistently with storage validation.

**Validation:** focused state-transition checks and keyboard/manual palette checks, including readable selection controls for each preset.

### IM-11 — Implement validated storage and protected recovery

**Depends on:** IM-04; finalize catalogue/palette reference validation after IM-03 and IM-10.

**Work:** implement a small storage module for `interior-moodboard:v1` with serialization and runtime validation. Define read outcomes for absent, valid, protected, and unavailable data.

**Acceptance:**

- Validate schema version, board dimensions/title, known asset/palette IDs, unique instance IDs, finite numeric bounds, and valid proportional geometry before use.
- Malformed, incompatible, or newer records are not overwritten automatically or silently normalized into saved replacements.
- Read/write exceptions return actionable outcomes; stored records contain no binary images or transient UI state.
- Explicit reset/recovery is the only path that authorizes replacing a protected record.

**Validation:** unit tests for valid round-trip, missing data, malformed JSON, unsupported versions, duplicate/unknown IDs, invalid geometry, and throwing storage reads/writes.

### IM-12 — Integrate hydration, saving, and recovery UI

**Depends on:** IM-08, IM-09, IM-10, IM-11.

**Work:** hydrate before automatic saving, persist committed board changes, and expose save/error/recovery states in the UI.

**Acceptance:**

- Reload restores title, palette, positions, sizes, and stacking order.
- Drag previews do not cause writes; hydration does not overwrite an existing board with defaults.
- Failed/unavailable storage is visible without disabling current-session editing or claiming a successful save.
- A protected record remains unchanged while the user edits a temporary board; explicit reset explains that it replaces saved data, and declining preserves it.

**Validation:** integration tests for hydration/write ordering, committed-only saving, failed writes, and protected-data reset; manual reload and error-state checks.

### IM-13 — Add the Compose browser-test service

**Depends on:** IM-01 for infrastructure; IM-12 for the initial complete journey.

**Work:** add Playwright and `test:e2e`, a dedicated Compose test service with matching browser dependencies, and deterministic app-readiness handling. Document exact commands and keep the lockfile aligned.

**Acceptance:**

- Browser tests run through the dedicated service without host Node or browsers in `web`.
- The initial role-based journey adds two items, edits geometry, reorders them, changes title/palette, reloads, and verifies restoration.
- Tests use isolated local storage and bundled assets, with no arbitrary sleeps or external APIs.

**Validation:** Compose configuration, browser-service startup, and the initial S3 journey from a clean test state.

## S4: Release validation

### IM-14 — Complete keyboard shortcuts and focus behavior

**Depends on:** IM-12.

**Work:** add selected-item arrow-key movement with a documented larger-step modifier. Review focus and accessible names across the full editing flow.

**Acceptance:**

- Arrow movement uses the same bounds and committed actions as other movement controls.
- Typing and native shortcuts in inputs, textareas, and editable content remain intact.
- Add, select, move, resize, remove, reorder, title, and palette operations are keyboard-accessible.
- Selection/focus remains understandable after removal and recovery; announcements describe completed actions without per-frame noise.

**Validation:** focused shortcut tests, including form-field exclusions and bounds; full keyboard-only manual journey.

### IM-15 — Polish responsive, touch, and motion behavior

**Depends on:** IM-08, IM-12.

**Work:** refine selected/active states, card lift and release feedback, narrow layout, and touch targets. Honor reduced-motion preferences.

**Acceptance:**

- Pointer tracking stays immediate; decorative settling occurs after release and respects reduced motion.
- Items and controls remain reachable on narrow screens; viewport changes retain logical positions.
- Touch manipulation works while scrolling outside the manipulation surface remains available.
- Roughly 30 placed items remain responsive on an ordinary laptop and a touch device; record the devices and observations before considering extra optimization.

**Validation:** manual desktop/touch, narrow-screen, reduced-motion, and 30-item checks; profile only if observed behavior warrants it.

### IM-16 — Verify release journeys and update delivery status

**Depends on:** IM-13, IM-14, IM-15.

**Work:** extend browser coverage for the keyboard equivalent, pointer release/cancellation, viewport scaling, and protected-data recovery. Verify the built application and update product/setup status with actual results.

**Acceptance:**

- Every criterion in [ROADMAP.md](ROADMAP.md#release-acceptance) has recorded automated or manual evidence.
- Formatting, lint, TypeScript, unit tests, browser tests, and the production build pass through Compose.
- The primary journey also passes against locally served production assets, using the dedicated browser service with documented startup/readiness commands.
- Documentation names commands that actually exist and records remaining limitations: one active editing tab and local-device persistence.
- Release-blocking failures are fixed and rechecked; unavailable device/tool checks are reported as outstanding, not passed.

**Validation:** full S4 gate. Stop when the agreed release criteria pass; do not introduce deferred features or a deployment pipeline.
