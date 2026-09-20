# Repository instructions

## Current state and sources of truth

The React application is implemented in `app/`, with unit tests and a dedicated Compose browser-test service. Read [RELEASE_VALIDATION.md](RELEASE_VALIDATION.md) for executed checks and outstanding physical-device validation; do not describe unexecuted checks as passed.

- Read `README.md` for product scope, board behavior, architecture, and acceptance criteria.
- Read `DEVELOPMENT.md` for setup, coding conventions, persistence, and validation.
- Inspect `compose.yaml` and `app/package.json` before running commands.
- Update these documents when implementation changes their assumptions.

## Scope

Implement only the requested slice. Documentation-only tasks do not require scaffolding the application.

The first release is one locally saved collage board with a bundled asset catalogue, palette presets, and add/move/resize/remove/reorder controls. Local uploads, export, rotation, zoom/pan, multiple boards, collaboration, authentication, and a backend are outside that scope unless explicitly requested.

## Implementation conventions

- Use React, strict TypeScript, Vite, CSS Modules, and npm inside `app/`.
- Use Docker Compose for setup, development, and checks. Preserve the `dev` script used by Compose; commit the npm lockfile with dependency changes.
- Create feature files when needed. Reuse existing code and dependencies before adding abstractions or packages.
- Render board items as positioned DOM elements. Use logical board coordinates (initially 1000 by 700), independent item instance IDs, and array order for stacking.
- Keep committed board actions in `useReducer`; keep selection and drag previews transient. Commit movement on release and discard previews on `pointercancel`.
- Clamp items to the board, enforce a minimum size, and preserve asset aspect ratio when resizing.
- Provide labelled controls and keyboard access for every drag operation. Preserve form-field shortcuts, visible focus, reduced-motion preferences, and page scrolling outside the manipulation surface.
- Validate stored JSON, schema versions, IDs, and numeric bounds. Save committed changes using `interior-moodboard:v1`; handle write failures visibly and preserve unreadable or newer-version data until explicit recovery/reset.
- Keep assets bundled and user records separate from the catalogue. Do not store binary images in localStorage.

## Commands and validation

Check the Compose configuration with:

```powershell
docker compose config --quiet
```

Do not regenerate the existing app. Start it with `docker compose up -d`; its default URL is http://localhost:5175. Stop it with `docker compose down`.

Run checks in the running `web` service:

```powershell
docker compose exec web npm run format:check
docker compose exec web npm run lint
docker compose exec web npm run check
docker compose exec web npm test
docker compose exec web npm run build
```

Add focused tests for meaningful state/geometry changes and behavioral fixes. Validate the primary browser journey, reload persistence, and keyboard equivalent when UI work warrants it. Run `docker compose run --rm e2e` for the dedicated Playwright service; the `web` image has no browsers. After building, run `docker compose run --rm -e E2E_PRODUCTION=1 e2e` against production assets. Do not run simultaneous `e2e` invocations because they share a dependency volume.

For documentation-only changes, check local links, command consistency, and `git diff --check`; application tests are unnecessary. Report checks actually run and any unavailable tools or missing scripts. Never claim unexecuted checks passed.

Stop when the requested scope and relevant acceptance criteria are satisfied. Summarize the changes, validation, and remaining limitations.
