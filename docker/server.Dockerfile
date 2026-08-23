# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY contracts/package.json ./contracts/
COPY server/package.json ./server/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @template/server... --frozen-lockfile || \
    pnpm install --filter @template/server...

# Local development — same Node 22 as production; source mounted at runtime
FROM deps AS dev
ENV NODE_ENV=development
ENV ENV_FILE=/app/env/server.env
RUN mkdir -p /app/env /app/logs /app/uploads
COPY contracts ./contracts
COPY server ./server
EXPOSE 3000
CMD ["pnpm", "--filter", "@template/server", "dev"]

FROM deps AS build
ENV NODE_ENV=production
COPY contracts ./contracts
COPY server ./server
RUN pnpm --filter @template/contracts build
RUN pnpm --filter @template/server build

# API (all modes). nest SPA is a separately built client, bind-mounted at /app/client-static.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV ENV_FILE=/app/env/server.env
RUN mkdir -p /app/logs /app/env /app/uploads /app/client-static

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/contracts ./contracts
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "server/dist/main.js"]
