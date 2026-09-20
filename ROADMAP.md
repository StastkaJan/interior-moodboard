# Delivery roadmap

Status: all 16 tickets have delivered implementation and automated evidence. S0–S3 connected automated gates pass; S4 remains pending human-operated keyboard/motion checks and manual ordinary-laptop/real-touch-device checks, including earlier touch acceptance. See [RELEASE_VALIDATION.md](RELEASE_VALIDATION.md) for evidence. This roadmap follows the scope in [README.md](README.md) and the conventions in [DEVELOPMENT.md](DEVELOPMENT.md).

## Release objective

Deliver one named, locally saved collage board with around 20 bundled furniture/material assets and several palette presets. Users can add, move, resize, remove, and reorder items with a pointer or labelled keyboard-accessible controls. Reload restores the committed board.

The board uses a fixed 1000 by 700 logical coordinate system and a responsive display. Target roughly 30 placed items for the first-release interaction check.

## Milestones

Milestones are ordered by dependency, without calendar commitments. Each ends with a working increment and the evidence specified in [INTEGRATION.md](INTEGRATION.md).

| Stage | Outcome | Tickets | Exit demonstration |
| --- | --- | --- | --- |
| S0: Foundation | Repeatable Compose development, quality scripts, and a responsive visual shell | IM-01–IM-02 | Start the app at the default localhost URL and inspect desktop/narrow layouts |
| S1: First editable board | Bundled catalogue, committed state, selection, and inspector editing | IM-03–IM-06 | Add the same asset twice, edit one instance, and remove it without affecting the other |
| S2: Direct manipulation | Pointer movement and proportional resizing using the same geometry as controls | IM-07–IM-08 | Move and resize at different display widths; cancel a gesture without committing it |
| S3: Complete local board | Layering, title/palette editing, safe persistence, and browser test infrastructure | IM-09–IM-13 | Compose two overlapping items, reorder them, change the palette, and restore the board after reload |
| S4: Release validation | Keyboard shortcuts, interaction polish, full browser journeys, and release evidence | IM-14–IM-16 | Complete the board using only a keyboard and verify touch, reduced motion, and a 30-item board |

Accessibility starts in S0/S1: semantic controls, focus visibility, labelled inputs, and a usable narrow layout are required as features land. S4 adds shortcuts and validates the complete experience.

## Release acceptance

- A board can be composed without dragging, including resizing and changing stacking order.
- Pointer and inspector edits produce the same valid logical geometry; every item remains reachable.
- Repeated assets are independent instances, and array order determines stacking.
- Pointer cancellation discards transient edits; resizing the viewport preserves committed coordinates.
- Reload restores title, positions, sizes, palette, and order.
- Invalid or newer stored data survives until explicit reset/recovery; storage failures are visible and editing remains usable.
- Formatting, lint, type checks, focused tests, browser journeys, and the production build pass through Compose once their scripts and services exist.
- Manual checks cover narrow screens, touch, keyboard focus, reduced motion, and smooth manipulation of roughly 30 items.

## Deferred work

Local uploads, export, rotation, zoom/pan, multiple boards, collaboration, authentication, and a backend are outside this release. There is no commitment to their order or implementation. Hosting automation, canvas rendering, and a global state library are also not prerequisites for this release.

## Delivery risks and decisions

| Risk or decision | Resolve by | Approach |
| --- | --- | --- |
| Bundled image availability and usage rights | S1 | Select locally bundled assets with recorded provenance and any required attribution |
| Minimum item size and initial placement | S1 | Choose and document shared geometry rules before implementing controls |
| Pointer behavior across display sizes and touch devices | S2 | Test logical/display conversion and cancellation; check on a touch device |
| Unreadable data or blocked storage | S3 | Validate before hydration and prevent writes over protected records |
| Browser dependencies absent from the current web image | S3 | Add a dedicated Compose test service with a matching Playwright image/version |
| Interaction cost with 30 items | S4 | Profile the implemented DOM board before introducing optimization machinery |

Stop at the release acceptance criteria. Follow-up ideas require separate scope decisions rather than expanding these tickets.
