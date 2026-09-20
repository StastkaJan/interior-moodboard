# Integration stages

Status: S0–S3 are implemented and their connected automated journeys pass. S4 implementation and automated coverage are present, with physical laptop/touch-device validation outstanding. [RELEASE_VALIDATION.md](RELEASE_VALIDATION.md) records actual checks and limitations. Here, integration means connecting the frontend features and local persistence; no external service integration is required.

Read the milestone overview in [ROADMAP.md](ROADMAP.md), implement from [TICKETS.md](TICKETS.md), and use [DEVELOPMENT.md](DEVELOPMENT.md) for execution commands.

## Shared contracts

| Boundary | Contract |
| --- | --- |
| Catalogue to board | Stable asset IDs reference bundled images, labels, categories, and aspect ratios. Each placement receives its own instance ID. User records contain references, not image binaries. |
| State to UI | `useReducer` owns committed board changes. Selection, focus, and pointer previews remain transient. Derive the selected item from its ID and clear stale selection after removal. |
| Geometry to controls | Use 1000 by 700 logical units. One set of geometry rules clamps positions, enforces minimum size, and preserves source aspect ratio. Pointer and inspector paths use these rules. |
| Pointer to reducer | Convert using the displayed board rectangle. Preview during the gesture; commit once on release. Discard the preview on cancellation or interrupted capture. |
| State to rendering | Render positioned DOM items in array stacking order. Viewport changes alter display scale, not saved geometry. |
| State to storage | Validate schema version, catalogue references, instance IDs, and numeric bounds. Use `interior-moodboard:v1`; persist committed changes only. Hydration must resolve before any automatic write. |
| Storage to UI | Distinguish successful saves, failed/unavailable storage, and protected unreadable/newer records. Keep editing usable and require explicit reset/recovery before replacing protected data. |

Choose exact reducer action names and numeric minimums during the relevant tickets. Do not build generic interfaces or empty feature files ahead of their consumers.

## S0: Integrate the runtime and shell

**Entry:** planning documents and the existing Compose configuration; no `app/` yet.

**Order:** IM-01, then IM-02. Inspect Compose before running the one-time README scaffold commands. Record the resolved Node version and preserve the `dev` script expected by `web`.

**Connection:** Vite/React app → Compose `web` → responsive page shell.

**Gate:** startup at http://localhost:5175, strict TypeScript and the required unit/quality scripts work, and the shell is usable at desktop and narrow widths. Do not claim browser tests exist yet.

## S1: Integrate the first editable board

**Entry:** S0 passes.

**Order:** IM-03 and IM-04 can be prepared independently after S0; integrate both before IM-05, followed by IM-06.

**Connection:** bundled catalogue → add action → reducer → DOM board → selection → inspector → shared geometry → reducer.

**Gate:** add two instances of one asset, select either, edit position and proportional size through labelled controls, and remove one. Verify independent IDs, bounds, minimum size, and selection cleanup. Compose the slice using only a keyboard. No persistence is promised at this stage.

## S2: Integrate direct manipulation

**Entry:** S1 passes; controls establish a working alternative to gestures.

**Order:** IM-07, then IM-08.

**Connection:** pointer capture → logical coordinate conversion → transient preview → release action → existing reducer and inspector.

**Gate:** pointer and numeric edits agree at multiple display sizes. Check board edges, minimum size, aspect ratio, release outside the item, cancellation, and unexpected capture loss. Cancellation leaves committed state unchanged. Touch scrolling works outside the manipulation surface.

## S3: Integrate the complete board and storage

**Entry:** S2 passes.

**Order:** IM-09 and IM-10 complete durable board fields. IM-11 can be developed once IM-04 defines the schema, but its validation must cover the final fields. IM-12 integrates all three. IM-13 can be prepared after S0 and is required for the automated stage demonstration.

**Connection:** reorder/title/palette actions → reducer → storage validation and serialization → reload hydration → board render.

**Gate:** the browser journey adds two items, edits geometry, changes stacking/title/palette, reloads, and compares the restored result. Exercise malformed JSON, newer versions, missing catalogue IDs, duplicate instance IDs, invalid numeric values, unavailable storage, and failed writes. Protected records must remain byte-for-byte unchanged until explicit recovery/reset, including while the user edits the temporary session.

## S4: Integrate and validate the release experience

**Entry:** S3 passes.

**Order:** IM-14 and IM-15, then IM-16 against the completed feature set.

**Connection:** keyboard/focus/touch behavior → the same board operations → the same persistence flow → release checks.

**Gate:** pass all [release criteria](ROADMAP.md#release-acceptance). Browser tests cover the primary journey, reload, keyboard equivalent, and meaningful gesture regressions. Validate the production build, then record manual responsive, reduced-motion, touch, and 30-item interaction results. Resolve release-blocking failures before calling the stage complete.

## Checks and handoff

For each integrated feature, run relevant focused tests and the required formatting, lint, type, unit, and build checks through the running `web` service as documented in [DEVELOPMENT.md](DEVELOPMENT.md#implementation-workflow-and-checks). Run browser checks with `docker compose run --rm e2e`; after building, run `docker compose run --rm -e E2E_PRODUCTION=1 e2e` to verify the same journeys against production assets.

Each completed ticket records changed behavior, checks actually run, and remaining limitations. A stage is complete only when its connected user journey passes; finishing isolated components is insufficient. Update the README and development guide when implementation changes their assumptions.
