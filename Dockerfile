# ---- Stage 1: install dependencies ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build the app ----
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SESSION_SECRET=build-time-placeholder
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build

# ---- Stage 3: minimal production runtime ----
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4200

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 4200

CMD ["node", "server.js"]