# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY contracts/package.json ./contracts/
COPY mcp/package.json ./mcp/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @template/mcp... --frozen-lockfile || \
    pnpm install --filter @template/mcp...

FROM deps AS dev
ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY contracts ./contracts
COPY mcp ./mcp
RUN pnpm --filter @template/contracts build
EXPOSE 4000
CMD ["pnpm", "--filter", "@template/mcp", "dev"]

FROM deps AS build
COPY contracts ./contracts
COPY mcp ./mcp
RUN pnpm --filter @template/contracts build
RUN pnpm --filter @template/mcp build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV MCP_PORT=4000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/contracts ./contracts
COPY --from=build /app/mcp/dist ./mcp/dist
COPY --from=build /app/mcp/package.json ./mcp/package.json
COPY --from=build /app/package.json ./package.json

EXPOSE 4000
CMD ["node", "mcp/dist/main.js"]
