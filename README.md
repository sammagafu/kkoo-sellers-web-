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
