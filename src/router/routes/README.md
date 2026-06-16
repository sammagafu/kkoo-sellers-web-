# Route modules

- **`index.ts`** — composes `allRoutes` in order; **do not** register the catch-all before specific routes.
- **`meta.ts`** — document title helpers for panel vs marketing pages.
- **`kkoo-*.ts`** — KKOO admin / seller / rider / preview routes (extend these for new verticals).

When adding a route:

1. Edit the relevant module (or add `kkoo-hotels.ts` and import it in `index.ts`).
2. Keep route **names** stable (`admin.*`, `seller.*`) so menus and links do not break.
