# Vue/Vite admin → static files + nginx (proxies /api/ to Fiber backend)
FROM node:20-alpine AS builder
WORKDIR /app

# Workspaces: copy lockfile + workspace package.json before npm ci
COPY package.json package-lock.json* ./
COPY packages ./packages

RUN corepack enable pnpm 2>/dev/null || true && \
    if [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci 2>/dev/null || npm install; fi

COPY . .

ARG VITE_API_BASE_URL=https://api.kkooapp.co.tz/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG SASS_SILENCE_DEPRECATIONS=nested-rules
ENV SASS_SILENCE_DEPRECATIONS=$SASS_SILENCE_DEPRECATIONS

RUN npm run build-only

FROM nginx:1.27-alpine
RUN apk add --no-cache wget gettext

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV API_UPSTREAM=https://api.kkooapp.co.tz

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
