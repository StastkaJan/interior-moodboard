# Interior Moodboard development guide

The runnable application, quality scripts, unit tests, and browser journeys live in `app/`. Read [README.md](README.md) for behavior, [AGENTS.md](AGENTS.md) for coding-agent instructions, and [RELEASE_VALIDATION.md](RELEASE_VALIDATION.md) for executed checks and outstanding physical-device validation.

## Default stack

| Concern | Starting choice |
| --- | --- |
| Language | TypeScript with strict checking |
| Local runtime | Docker Compose with Node 24 Linux containers |
| UI and build | React and Vite |
| Styling | CSS variables for tokens and CSS Modules |
| State | React primitives; board actions in `useReducer` |
| Data | Small bundled catalogues with stable IDs |
| Persistence | Versioned localStorage for small JSON documents |
| Unit tests | Vitest |
| Browser tests | Playwright for important user journeys |
| Quality | Framework-compatible ESLint configuration and Prettier |
| Hosting | Static production build; configure route fallback if routes are introduced |

Use npm and commit `app/package-lock.json` with dependency changes. The Compose Node 24 image resolved to Node v24.21.0 during scaffolding.

The app was generated with Vite's React TypeScript template. Do not regenerate it.

## Docker Compose workflow

Docker Compose is required for local setup, development, and checks. Install Docker Desktop with Linux containers (or Docker Engine with Compose on Linux). Host Node.js and npm are not needed.

The [compose.yaml](compose.yaml) defines a `setup` service for one-off tools in the repository root and a `web` service for the app. Both use `node:24-bookworm-slim`. Check the runtime with `docker compose run --rm setup node --version`. The dedicated `e2e` service uses `mcr.microsoft.com/playwright:v1.63.0-noble`, matching `@playwright/test` 1.63.0.

The committed app and lockfile are ready for startup. The app bind mount deliberately requires `app/` to exist.

Run from the repository root:

```powershell
docker compose config --quiet
docker compose up -d
docker compose logs -f web
docker compose down
```

Source edits are bind-mounted for live updates. Dependencies live in a project-specific named volume, separate from host dependencies. Startup runs `npm ci` before the dev server, so the lockfile must exist and match `package.json`. Open http://localhost:5175; set `APP_PORT` in a local `.env` to override the host port.

The dev server listens on all container interfaces while the published port binds to host localhost. Compose enables polling for Docker Desktop file changes. These are development services. Production remains a static build; do not deploy the dev server.

With `web` running, execute checks inside it:

```powershell
docker compose exec web npm run build
docker compose exec web npm run check
docker compose exec web npm run lint
docker compose exec web npm run format:check
docker compose exec web npm test
```

The scripts below exist in `app/package.json`. For a one-off build without a running dev server, use `docker compose run --rm web sh -c "npm ci && npm run build"`.

When changing dependencies, stop `web`, run `docker compose run --rm web npm install <package>`, commit both package files, then start it again. Do not run an install concurrently with the dev server or tests.

Run browser checks through the dedicated service; the slim Node `web` image has no browsers:

```powershell
docker compose run --rm e2e
docker compose exec web npm run build
docker compose run --rm -e E2E_PRODUCTION=1 e2e
```

Each browser run installs the lockfile into a separate `e2e_node_modules` volume. Do not run concurrent `e2e` invocations. Playwright starts its own Vite dev server (or Vite preview when `E2E_PRODUCTION=1`) and waits up to 60 seconds for HTTP readiness at `http://127.0.0.1:5173`. No running `web` service is needed for browser tests; production mode needs a current `app/dist` build. Tests use one worker, fresh browser contexts, and local bundled assets. Failed-run traces and screenshots are in ignored `app/test-results/`. See [app/e2e/README.md](app/e2e/README.md) for focused commands.

For configuration changes, consult the official [Compose service reference](https://docs.docker.com/reference/compose-file/services/) and [Vite server options](https://vite.dev/config/server-options).

## Architecture and ownership

Organize code around the board and asset library. The README sketches the core structure; create files as the feature needs them, not as empty placeholders.

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

Keep components, geometry, storage, and tokens local to this repository. Extract a shared package only after multiple implemented consumers actually need the same code and release process.

Start without global store libraries, a monorepo build system, a backend, or authentication. Add them when a concrete requirement appears: cross-route state, shared packages, multi-device sync, accounts, or collaboration.

## Persistence and failures

- Use the app-specific key `interior-moodboard:v1` and a stored schema version for the initial persistence implementation.
- Validate parsed records, numeric ranges, IDs, and version before using them. TypeScript types alone do not validate stored JSON.
- Handle unavailable storage and failed writes visibly. Keep the current session usable and do not report a failed write as saved.
- Do not silently overwrite an unreadable or newer-version record. Offer an explicit reset or recovery action.
- Save committed actions, not every pointer movement or animation tick.
- Store image/audio references, not binary assets, in localStorage. Add IndexedDB only if local file uploads become a requirement.

The first release assumes one active editing tab and local-device storage. If simultaneous editing becomes necessary, define conflict handling before offering it.

## Smooth interaction and accessibility

Use immediate visual feedback for selection, pressing, dragging, saving, and errors. Start with roughly 120-200 ms for small feedback transitions and 200-350 ms for panels; treat these as design starting points.

Prefer transforms and opacity for movement. Use `requestAnimationFrame` for continuous visual loops and keep layout reads out of per-item frame updates. Save expensive work for committed input where possible. Profile on an ordinary laptop and a touch device before adding optimization machinery.

Honor [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): remove decorative motion and animated camera travel while retaining understandable state changes. Continuous motion also needs an explicit pause control.

Use semantic buttons, labelled inputs, visible focus, readable contrast, and keyboard access. Provide buttons or numeric controls for any task otherwise requiring dragging. Announce completed actions sparingly; do not put countdown seconds or animation frames in a live region.

Design a usable narrow-screen layout from the first slice. Use deliberate scroll regions, sufficiently large touch targets, and responsive images. Do not make hover the only way to discover an action.

## Testing strategy

Use Vitest for meaningful calculations and state transitions. Use React-compatible component tooling when an interaction needs isolated coverage; do not install a component test library solely to test static text.

Use [Playwright](https://playwright.dev/docs/best-practices) for one complete primary journey, reload persistence, and the keyboard equivalent of the main interaction. Locate controls by role and accessible name. Keep tests deterministic with local fixtures and controlled time; avoid arbitrary sleeps and external APIs.

The README lists the highest-value cases: independent instances, coordinate conversion, bounds, resizing, cancellation, layering, and reload persistence. Do not add snapshots for every component or chase a coverage percentage. Add a regression test when fixing a meaningful behavioral bug.

Manually check narrow screens, keyboard focus, reduced motion, touch interaction, and the actual feel of animations. Automated DOM assertions do not prove that motion looks good.

## Implementation workflow and checks

1. Inspect existing code and start `web` with the README's Compose commands; do not regenerate `app/`.
2. Build a static screen using realistic bundled data.
3. Complete the first vertical slice and its important behavioral test.
4. Add persistence with a visible failure state.
5. Add animation, keyboard equivalents, and responsive layout.
6. Run the checks and stop when the brief's acceptance criteria pass.

The following scripts exist in `app/package.json`:

| Script | Expected behavior |
| --- | --- |
| `dev` | Start the framework development server |
| `build` | Build production assets |
| `check` | TypeScript checking using the application's tsconfig project references |
| `lint` | Run the configured linter |
| `format:check` | Check formatting without rewriting files |
| `test` | Run unit/component tests once and exit |
| `test:e2e` | Run Playwright against a locally served application |

Keep generator-provided compiler settings unless a real requirement warrants changing them. Keep TypeScript strict checking enabled.

At completion, run formatting, linting, type checks, relevant tests, and the production build. Validate the built app's primary journey. A later CI workflow can run the same checks through Compose using `npm ci`; deployment automation remains outside this release.
