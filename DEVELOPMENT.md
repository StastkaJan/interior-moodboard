# Shared development directions

## Default stack

| Concern | Starting choice |
| --- | --- |
| Language | TypeScript with strict checking |
| Build | Vite for React, Vue, Svelte, and Solid; Angular CLI for Angular |
| Styling | CSS variables for tokens; framework-scoped CSS or CSS Modules |
| State | Framework primitives, owned by the smallest common parent |
| Data | Small bundled catalogues with stable IDs |
| Persistence | Versioned localStorage for small JSON documents |
| Unit tests | Vitest; Angular's CLI-integrated test setup |
| Browser tests | Playwright for important user journeys |
| Quality | Framework-compatible ESLint configuration and Prettier |
| Hosting | Static production build; configure route fallback if routes are introduced |

Use npm consistently for these projects. Record the supported Node version in each implemented application. Keep dependency versions and lockfiles independent; an upgrade in one experiment should not force upgrades in the others.

[Vite provides TypeScript templates](https://vite.dev/guide/) for the four selected frameworks. Angular should retain its [CLI-generated workspace](https://angular.dev/cli/new).

## Architecture and ownership

Organize code around the main user feature. Each project brief sketches a proposed structure; create files as the feature needs them, not as empty placeholders.

- The app root composes the screen and owns only genuinely screen-wide coordination.
- Feature components own rendering, focus, selection, and event handling.
- Pure TypeScript functions own calculations and domain operations that deserve independent tests.
- A small storage module owns serialization, validation, and write failures.
- Static data stays separate from user-created records.

Data flows from state to views. User actions call a named operation that updates state. Derive filtered lists, progress, totals, and selection details instead of maintaining duplicate copies.

Distinguish durable state from transient state. Save board positions or completed sessions; do not save hovered elements, DOM nodes, animation frames, or pointer events.

Keep browser resources close to their owner. Remove event listeners, cancel animation frames, stop audio, and clear timers when the owning feature is disposed.

## Splitting components and code

Split a component when it has an independently understandable responsibility, needs its own interaction tests, or repeats with the same behavior. Useful boundaries include a catalogue, item card, editor surface, detail panel, and playback controls.

Keep small helpers, styles, and tests beside their feature. Avoid generic `utils`, `services`, or `managers` folders that mix unrelated behavior. Extract a pure function when the rule is complex enough to test independently, not simply because it can be extracted.

Begin with one screen. Add routing when a second view needs its own URL and browser history. Lazy-load a genuinely heavy optional feature, such as a later 3D renderer; do not dynamically import every small component.

## Reuse

Within an app, share a component after two real callers need the same behavior and accessibility contract. Prefer explicit props and callbacks over a configurable component with many modes. Small pieces of markup can remain duplicated when their behavior differs.

Across these five apps, reuse conventions, testing practices, and design principles. Framework components stay local. Extract framework-independent calculations, schemas, or CSS tokens into a package only after multiple implemented apps actually need the same code and release process.

Start without global store libraries, a monorepo build system, a backend, or authentication. Add them when a concrete requirement appears: cross-route state, shared packages, multi-device sync, accounts, or collaboration.

## Persistence and failures

- Use an app-specific key, such as `focus-garden:v1`, and a stored schema version.
- Validate parsed records, numeric ranges, IDs, and version before using them. TypeScript types alone do not validate stored JSON.
- Handle unavailable storage and failed writes visibly. Keep the current session usable and do not report a failed write as saved.
- Do not silently overwrite an unreadable or newer-version record. Offer an explicit reset or recovery action.
- Save committed actions, not every pointer movement or animation tick.
- Store image/audio references, not binary assets, in localStorage. Add IndexedDB only if local file uploads become a requirement.

Each MVP assumes one active editing tab and local-device storage. If simultaneous editing becomes necessary, define conflict handling before offering it.

## Smooth interaction and accessibility

Use immediate visual feedback for selection, pressing, dragging, saving, and errors. Start with roughly 120-200 ms for small feedback transitions and 200-350 ms for panels; treat these as design starting points.

Prefer transforms and opacity for movement. Use `requestAnimationFrame` for continuous visual loops and keep layout reads out of per-item frame updates. Save expensive work for committed input where possible. Profile on an ordinary laptop and a touch device before adding optimization machinery.

Honor [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): remove decorative motion and animated camera travel while retaining understandable state changes. Continuous motion also needs an explicit pause control.

Use semantic buttons, labelled inputs, visible focus, readable contrast, and keyboard access. Provide buttons or numeric controls for any task otherwise requiring dragging. Announce completed actions sparingly; do not put countdown seconds or animation frames in a live region.

Design a usable narrow-screen layout from the first slice. Use deliberate scroll regions, sufficiently large touch targets, and responsive images. Do not make hover the only way to discover an action.

## Testing strategy

Use [Vitest](https://vitest.dev/guide/) for meaningful calculations and state transitions. Use framework-compatible component tooling when an interaction needs isolated coverage; do not install a component test library solely to test static text. Angular can retain its [generated testing integration](https://angular.dev/guide/testing).

Use [Playwright](https://playwright.dev/docs/best-practices) for one complete primary journey, reload persistence, and the keyboard equivalent of the main interaction. Locate controls by role and accessible name. Keep tests deterministic with local fixtures and controlled time; avoid arbitrary sleeps and external APIs.

Each brief lists its highest-value cases. Do not add snapshots for every component or chase a coverage percentage. Add a regression test when fixing a meaningful behavioral bug.

Manually check narrow screens, keyboard focus, reduced motion, touch interaction, and the actual feel of animations. Automated DOM assertions do not prove that motion looks good.

## Implementation workflow and checks

1. Generate the selected framework app into the brief's `app/` folder.
2. Build a static screen using realistic bundled data.
3. Complete the first vertical slice and its important behavioral test.
4. Add persistence with a visible failure state.
5. Add animation, keyboard equivalents, and responsive layout.
6. Run the checks and stop when the brief's acceptance criteria pass.

During implementation, define the following script contract in each `package.json`; these scripts do not exist in this planning bundle yet:

| Script | Expected behavior |
| --- | --- |
| `dev` | Start the framework development server |
| `build` | Build production assets |
| `check` | Framework-aware type checking; include Angular template checks |
| `lint` | Run the configured linter |
| `format:check` | Check formatting without rewriting files |
| `test` | Run unit/component tests once and exit |
| `test:e2e` | Run Playwright against a locally served application |

For `check`, use TypeScript for React/Solid, `vue-tsc` for Vue, `svelte-check` for Svelte, and Angular compilation with strict template checking. Keep generator-provided compiler settings unless a real requirement warrants changing them.

At completion, run formatting, linting, type checks, relevant tests, and the production build. Validate the built app's primary journey. A later CI workflow should run the same commands with `npm ci`; there is no need for a release pipeline before an app exists.
