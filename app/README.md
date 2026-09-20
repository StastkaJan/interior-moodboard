# Interior Moodboard app

React, strict TypeScript, Vite, and CSS Modules implement one locally saved collage board. Run the app and quality commands through Docker Compose from the repository root; see [DEVELOPMENT.md](../DEVELOPMENT.md).

The scaffold used the Compose Node 24 image, resolving to Node v24.21.0. ESLint, Prettier, TypeScript, and Vitest supply the quality scripts; `npm test` runs the feature unit tests once. The dedicated Compose Playwright service runs [browser journeys](e2e/README.md) against development and production assets. See [release evidence](../RELEASE_VALIDATION.md) for executed results and outstanding physical-device checks.
