# KKOO Admin Web

Vue 3 + Vite admin panel for platform operators.

| Environment | URL |
|-------------|-----|
| Staging / production | `https://admin.kkooapp.co.tz` |
| API | `https://api.kkooapp.co.tz/api/v1` |

## Local dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Build

```bash
npm run build
# output: dist/
```

## Deploy (staging)

Push to `main` → GitHub Actions SSH deploy:

- `DO_APP_DIR=/home/sammy/kkoo-admin-web`
- `DO_WEB_DIR=/var/www/admin`

Server: `git pull && npm ci && npm run build && rsync dist/ → /var/www/admin`

## Logistics — unlock cities / counties

**Path:** `/admin/logistics/zones`

- Toggle **Active** to unlock delivery/rides in a city (e.g. Arusha, Nairobi)
- **Add region** to create a new city (country code, map center, radius, pricing, currency)
- Buyers see changes via `GET /logistics/markets/` without an app release

See [kkoo-buyers-app/docs/PHASE2_AND_MARKETS.md](../kkoo-buyers-app/docs/PHASE2_AND_MARKETS.md).
