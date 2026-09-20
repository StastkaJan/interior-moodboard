# Interior Moodboard

**Framework: React.** A visual workspace for arranging furniture, materials, and colors into a room concept.

Status: project brief only. Follow the [shared development directions](DEVELOPMENT.md).

## Experience and visual direction

Use warm neutrals, restrained typography, material photography, and a subtly textured board. Desktop has an asset rail, central canvas, and compact selected-item controls. Mobile puts the asset catalogue and controls below the board.

The signature interaction is picking up a card and placing it on the board. Give the active card a small lift and shadow, show clear selection, and keep dragging directly attached to the pointer. Animate settling after release, not the pointer tracking itself.

## First release

- One named board with a fixed logical size and responsive display.
- A bundled catalogue of around 20 furniture/material images and several palette presets.
- Add, move, resize, remove, and change the stacking order of items.
- Edit position and size with labelled controls as an alternative to dragging.
- Save and restore the board locally.

Local uploads, export, rotation, zoom/pan, multiple boards, and collaborative editing are later work. The first canvas is a collage, not a dimensionally accurate room planner.

## Technologies and architecture

Use React, TypeScript, Vite, and CSS Modules. Render items as absolutely positioned DOM elements so images and controls retain accessible semantics. Use Pointer Events with pointer capture for movement.

Keep board actions in `useReducer` and the active selection beside the board. Keep drag previews local to the canvas, committing a durable position on release. The ownership model follows [Thinking in React](https://react.dev/learn/thinking-in-react): shared state lives at the nearest common owner and derived values are not duplicated.

Proposed structure inside `app/src/`:

```text
App.tsx
features/board/
  BoardCanvas.tsx
  BoardItem.tsx
  ItemInspector.tsx
  boardReducer.ts
  boardReducer.test.ts
  geometry.ts
  geometry.test.ts
features/library/AssetLibrary.tsx
data/assets.ts
lib/storage.ts
styles/tokens.css
```

`BoardCanvas` translates pointer coordinates; `geometry` handles bounds and scaling; the reducer owns add, move, resize, remove, and reorder operations. `BoardItem` handles one visual item. Reuse image presentation only where catalogue and board behavior really align.

## Data and geometry

`Asset`: ID, image path, label, category, and aspect ratio. `BoardItem`: unique instance ID, asset ID, x, y, width, and height in logical board units. `Board`: schema version, title, logical dimensions, palette ID, and ordered items.

Use a 1000 by 700 logical board as a starting point. Fit it to available width while preserving aspect ratio. Convert pointer coordinates using the displayed bounding rectangle and logical dimensions; do not store viewport pixels. Keep the array order as stacking order.

Clamp items inside the board and enforce a minimum size. For the first release, preserve the source aspect ratio during resizing. Repeated use of an asset creates distinct item IDs. Handle `pointercancel` by discarding the preview and preserving the last committed position.

Arrow keys move a selected item; a modifier can increase the step. Do not intercept those shortcuts while typing in form fields. On touch, disable native panning only on the manipulation surface, allowing the rest of the page to scroll normally.

## Build order and tests

1. **First slice:** add an asset and change its position through the inspector. Unit-test add/remove and independent instances of the same asset.
2. Add pointer movement and resizing. Test coordinate conversion at different display sizes, bounds, minimum size, and pointer cancellation.
3. Add layering, palette selection, and saving. Browser-test adding two items, moving one, changing its order, and restoring the result after reload.
4. Polish selection, keyboard shortcuts, touch behavior, and responsive layout. Check that resizing the browser preserves logical positions.

Done when a board can be composed without dragging, pointer and inspector edits agree, every item stays reachable, and reload restores positions, sizes, palette, and order. Verify smooth manipulation with the intended first-release board size of roughly 30 items before considering canvas rendering or a global state library.

## Docker Compose setup

A [Compose configuration](compose.yaml) is included. The application itself has not been scaffolded. Docker Desktop with Linux containers, or Docker Engine with Compose, is required; host Node.js is unnecessary.

When implementation starts, run these commands once from this repository's root:

```powershell
docker compose run --rm setup npm create --yes vite@latest app -- --template react-ts --no-interactive
docker compose run --rm setup npm --prefix app install --package-lock-only
docker compose up -d
docker compose logs -f web
```

Open http://localhost:5175 after the server is ready. On a clone that already contains `app/package.json` and `app/package-lock.json`, skip generation and run `docker compose up -d`.

The `setup` service is only used for tooling; ordinary startup launches `web`. Source changes update the running app, and container dependencies use an isolated volume. Stop with `docker compose down`. Set `APP_PORT` in a local `.env` if the default port is occupied.

See the [development guide](DEVELOPMENT.md#docker-compose-workflow) for builds, tests, dependency updates, and the required quality scripts. Keep the generated `dev` script: Compose calls it to launch Vite.

This setup is for development; the finished application will still produce static production assets.
