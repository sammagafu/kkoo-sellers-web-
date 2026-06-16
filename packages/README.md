# KKOO workspace packages

This repo uses **npm workspaces** (`packages/*`). The main Vue app stays at the repository root; `packages/` holds optional shared libraries as you grow.

| Package | Purpose |
|--------|---------|
| `@kkoo/shared` | Stub for future shared code (types, constants, small utils) consumed by the root app or future apps. |

Add new packages under `packages/<name>/` with a `package.json` and list them in the root `workspaces` field.
