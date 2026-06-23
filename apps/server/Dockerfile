FROM node:22-alpine

RUN corepack enable pnpm

WORKDIR /app

# Copy workspace manifests for dependency resolution
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/simulation/package.json packages/simulation/
COPY packages/protocol/package.json packages/protocol/
COPY apps/server/package.json apps/server/

# Install only the server and its workspace dependencies
RUN pnpm install --frozen-lockfile --filter @proximity/server...

# Copy source for workspace packages the server depends on
COPY packages/simulation/src packages/simulation/src
COPY packages/protocol/src packages/protocol/src
COPY apps/server/src apps/server/src

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "--experimental-strip-types", "apps/server/src/index.ts"]
