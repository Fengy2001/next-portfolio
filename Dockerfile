# ---- Stage 1: install dependencies ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# better-sqlite3 ships prebuilt binaries for common platforms — rather than
# relying on node-gyp to compile from source (which was failing/stale in
# this environment), copy the matching prebuild directly into the path
# better-sqlite3's loader expects at runtime.
RUN mkdir -p node_modules/better-sqlite3/build/Release \
  && cp node_modules/better-sqlite3/prebuilds/linux-x64.node \
        node_modules/better-sqlite3/build/Release/better_sqlite3.node

# ---- Stage 2: build the app ----
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SESSION_SECRET=build-time-placeholder
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build

# ---- Stage 3: minimal production runtime ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4200

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=deps /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 4200

CMD ["npm", "run", "start"]