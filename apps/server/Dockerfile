FROM node:22-alpine AS build

RUN corepack enable pnpm

WORKDIR /app

# Copy workspace manifests for dependency resolution
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/simulation/package.json packages/simulation/
COPY packages/protocol/package.json packages/protocol/
COPY apps/server/package.json apps/server/

# Install all deps (including devDeps for tsup)
RUN pnpm install --frozen-lockfile --filter @proximity/server...

# Copy source
COPY packages/simulation/src packages/simulation/src
COPY packages/protocol/src packages/protocol/src
COPY apps/server/src apps/server/src
COPY apps/server/tsup.config.ts apps/server/

# Compile — bundles simulation and protocol inline, leaves node built-ins external
RUN pnpm --filter @proximity/server build

# ---- runtime ----
FROM node:22-alpine

WORKDIR /app

# tsup bundles all deps (ws, simulation, protocol) into a single CJS file
COPY --from=build /app/apps/server/dist/index.js ./

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "index.js"]
