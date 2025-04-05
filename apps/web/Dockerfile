FROM node:22-slim AS build

WORKDIR /app

# Install Bun
RUN npm install -g bun@1.2.6

# Copy the important stuff
COPY ./.env ./
COPY package.json bun.lock .npmrc ./
COPY apps/web/package.json ./apps/web/

# Copy only config.json files from packages
RUN mkdir -p /app/packages
COPY packages packages/
RUN find /app/packages -type f ! -name "config.json" -delete

# Copy the app
COPY apps/web ./apps/web
COPY scripts/package.json ./scripts/

RUN bun install

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/web
RUN bunx --bun next build

RUN mkdir -p /app/apps/web/public

FROM node:22-slim AS final

WORKDIR /app

# Install Bun
RUN npm install -g bun@1.2.6

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

COPY --from=build /app/.env ./
COPY --from=build /app/apps/web/.next/standalone/apps/web/server.js ./server.js
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DOCKER_ENV="true"

CMD ["node", "server.js"]
