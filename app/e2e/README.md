# Browser checks

Run from the repository root, with Docker Desktop running:

```powershell
docker compose run --rm e2e
```

The dedicated service installs the lockfile into its own dependency volume.
Playwright starts Vite inside that container and waits for HTTP readiness at
`http://127.0.0.1:5173`. It does not need a running `web` service, host Node, or
host browsers. Each test starts with a fresh browser context and localStorage.
The pinned `@playwright/test` version must match the Compose Playwright image.

To check production assets, build first, then select Vite preview:

```powershell
docker compose exec web npm run build
docker compose run --rm -e E2E_PRODUCTION=1 e2e
```

If `web` is stopped, build with
`docker compose run --rm web sh -c "npm ci && npm run build"` before the second
command. The preview server uses the existing `app/dist`; it never rebuilds it.

Failure screenshots and traces are written to ignored `app/test-results/`.
For a focused run, use
`docker compose run --rm e2e sh -c "npm ci && npm run test:e2e -- board.spec.ts"`.
Temporary inspection tests may use the ignored `e2e/*.local.spec.ts` pattern;
remove them after inspection so they do not affect later runs.
