# Release validation

Evidence date: 2026-09-20. All 16 implementation tickets are delivered as separate local commits; no push or deployment is included. Automated verification uses Docker Desktop Linux containers and headless Chromium, with a 390 × 844 touch-emulated viewport for touch cases. S4 is **not fully accepted**: physical-device performance and human-operated keyboard/motion checks remain outstanding.

## Executed checks

Run commands from the repository root. `web` starts with `docker compose up -d`; default browser URL: http://localhost:5175. The scaffold resolved Node v24.21.0. The browser image and `@playwright/test` both use 1.63.0.

| Command | Recorded result |
| --- | --- |
| `docker compose config --quiet` | Passed independent root verification |
| `docker compose exec web npm run format:check` | Passed independent root recheck after the formatting-only `App.tsx` fix |
| `docker compose exec web npm run lint` | Passed independent root verification |
| `docker compose exec web npm run check` | Passed independent root verification |
| `docker compose exec web npm test` | Passed: 77 tests across 6 files, independent root verification |
| `docker compose exec web npm run build` | Passed independent root verification; 38 modules, JS 240.47 kB (75.41 kB gzip), CSS 9.98 kB (2.83 kB gzip) |
| `docker compose run --rm e2e` | Passed independent root verification: all 16 development journeys, 18.1 seconds |
| `docker compose run --rm -e E2E_PRODUCTION=1 e2e` | Passed independent root verification: all 16 production journeys, 15.3 seconds |
| `docker compose run --rm e2e sh -c "npm ci && npm run test:e2e -- gestures.spec.ts persistence.spec.ts"` | Passed: 10 IM-16 regressions (8.8 seconds) |
| `git diff --check` and local Markdown links/anchors | Passed independent root verification: whitespace and all 37 local links/anchors |

The browser service installs its lockfile into a dedicated volume, starts Vite itself, and waits for HTTP readiness at `http://127.0.0.1:5173` (60-second timeout). Production mode starts Vite preview against the already-built `app/dist`; build first. It needs no host Node/browser and no running `web` server. Run browser invocations sequentially because they share the dependency volume. Further commands and failure artifacts are documented in [app/e2e/README.md](app/e2e/README.md).

The first IM-16 focused run found four stale test locators that matched both save status and the new keyboard status. The locators were scoped to their expected messages and all ten focused tests then passed. The integrated formatting check found one formatting-only issue in `App.tsx`; it was corrected. Neither required a product behavior change.

## Release-acceptance evidence

Each row corresponds to a criterion in [ROADMAP.md](ROADMAP.md#release-acceptance).

| Criterion | Evidence and boundary |
| --- | --- |
| Compose a board without dragging, including resize and stacking | `e2e/keyboard.spec.ts` uses keyboard input for add/select/move/size/layer/title/palette/remove, checks focus and native form shortcuts. Human-operated keyboard inspection remains outstanding. |
| Pointer and inspector share valid logical geometry; items remain reachable | `geometry.test.ts`, `inspectorValue.test.ts`, and `boardReducer.test.ts` cover bounds, minimum dimensions, proportional maximum sizing, invalid input, and coordinate conversion. `e2e/gestures.spec.ts` verifies move/resize versus inspector values at 1440 and 390 px. `e2e/polish.spec.ts` checks no horizontal overflow through 320 px. |
| Repeated assets are independent and array order controls stacking | `boardReducer.test.ts` checks instance independence and preserved geometry/IDs when reordering. `e2e/board.spec.ts` adds the same asset twice, edits both, reorders, then verifies DOM/order and storage after reload. |
| Cancellation discards previews; viewport resizing preserves committed coordinates | `e2e/gestures.spec.ts` covers move and resize release, synthetic `pointercancel`, and actual `releasePointerCapture` at desktop/narrow widths, plus unrelated-pointer isolation. `e2e/polish.spec.ts` compares storage unchanged at 1024, 760, 390, and 320 px. |
| Reload restores title, positions, sizes, palette, and order | `e2e/board.spec.ts` compares the complete expected board and rendered geometry after reload. `e2e/persistence.spec.ts` instruments writes to verify hydration makes no writes, previews make no writes, release saves once, and reload preserves the result. |
| Invalid/newer records survive until explicit recovery; failures are visible and editing works | `storage.test.ts` covers malformed JSON, schema/reference/ID/numeric/geometry validation and throwing storage. `e2e/persistence.spec.ts` preserves invalid/newer bytes through temporary edits and declined recovery, confirms explicit replacement/focus, and checks failed writes with retry and blocked reads. |
| Compose formatting, lint, types, focused tests, browser journeys, production build | Exact executions are recorded above. Root independently repeats integrated checks after ticket verification. Production E2E runs the same full journeys against built assets. |
| Manual narrow/touch/focus/reduced-motion/30-item checks | Root visually reviewed generated desktop/narrow shell/catalogue screenshots and IM-15 desktop/touch screenshots. Automated `e2e/polish.spec.ts` manipulates 30 items at 1440 × 900 and touch-emulated 390 × 844, checks immediate tracking/release styling, reduced motion, handle size, outside-surface touch scrolling, viewport scaling, and 320 px overflow. This does **not** establish physical-device smoothness or human-operated motion/focus acceptance; those remain outstanding. |

The integrated read-only review found no actionable data-loss, gesture, or keyboard blockers. It caught a documentation overclaim about Escape in the title field; documentation now correctly limits Escape restoration to inspector fields.

## Ticket commits

| Ticket | Local commit | Delivered slice |
| --- | --- | --- |
| IM-01 | `e69ffbf` | React/TypeScript scaffold and quality scripts |
| IM-02 | `0fb2dfc` | Responsive application shell |
| IM-03 | `713db4b` | 20 bundled illustrations and provenance |
| IM-04 | `848bb3a` | Reducer, logical board geometry, bounds |
| IM-05 | `3022a74` | Add/select/remove independent items |
| IM-06 | `7b12926` | Labelled position and proportional-size inspector |
| IM-07 | `f8262db` | Cancellable pointer movement |
| IM-08 | `eab0487` | Proportional pointer resize |
| IM-09 | `e446972` | Stacking controls |
| IM-10 | `f73c764` | Board title and palettes |
| IM-11 | `98eadd1` | Validated storage and protected records |
| IM-12 | `59225ec` | Hydration, saving, recovery UI |
| IM-13 | `389ae2e` | Compose browser service and initial journeys |
| IM-14 | `b48e68e` | Keyboard movement, focus and status |
| IM-15 | `f32a21e` | Responsive/touch/reduced-motion polish |
| IM-16 | This document's commit | Release regressions, status/evidence documentation, final formatting fix |

Implementation dependencies were integrated before dependent behavior was verified; independent state/catalogue and settings/storage preparation overlapped. The original planning acceptance criteria remain in [TICKETS.md](TICKETS.md).

## Outstanding checks and limitations

- On an ordinary physical laptop, compose a board using the keyboard, inspect visible focus and reduced-motion behavior, and move/resize roughly 30 items. Record hardware, browser, responsiveness, and motion observations.
- On a real touch device, add/move/resize items, cancel gestures, scroll outside the manipulation surface, and repeat with roughly 30 items. Record device/browser and observations. Emulated Chromium touch is the available automated evidence only.
- The in-app browser plugin could not provide an available tab/session in this environment, so the dedicated Compose browser service supplied automated testing and screenshots. No physical laptop or phone was controlled.
- Persistence is local to one browser/device and assumes one active editing tab. There is no multi-tab conflict resolution, server sync, upload, export, multiple boards, authentication, or deployment pipeline.

Do not mark S4 complete until outstanding manual acceptance is recorded. No optimization package or extra feature is justified by the available evidence.
