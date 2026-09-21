# ---- Stage 1: install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build the app ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# SESSION_SECRET only needs to exist at build time if any code path reads it
# during the build itself (e.g. static generation). A placeholder is safe
# here since the real value is injected at container runtime, not baked in.
ENV SESSION_SECRET=build-time-placeholder
RUN npm run build

# ---- Stage 3: minimal production runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4200

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Next's file tracer often fails to correctly copy native (.node) binaries
# for packages like better-sqlite3 into the standalone output — explicitly
# overwrite it with the real, fully-compiled package from the deps stage.
COPY --from=deps /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 4200

CMD ["node", "server.js"]