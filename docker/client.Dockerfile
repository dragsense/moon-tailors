# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY contracts/package.json ./contracts/
COPY client/package.json ./client/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @template/client... --frozen-lockfile || \
    pnpm install --filter @template/client...

# Local development — Vite (gateway reverse-proxies here)
FROM deps AS dev
ENV NODE_ENV=development
ARG VITE_API_URL=http://localhost:8088/server/api
ENV VITE_API_URL=$VITE_API_URL
COPY contracts ./contracts
COPY client ./client
COPY env ./env
EXPOSE 5173
CMD ["pnpm", "--filter", "@template/client", "dev"]

# SPA build — nginx (gateway files) and nest (mount into server). Not a long-running service.
FROM deps AS build
COPY contracts ./contracts
COPY client ./client
COPY env ./env
ARG CLIENT_ENV_FILE=env/client.env
COPY ${CLIENT_ENV_FILE} ./env/client.env
ARG VITE_API_URL=http://localhost:8088/server/api
ENV VITE_API_URL=$VITE_API_URL
ARG CLIENT_SSR=false
ENV CLIENT_SSR=$CLIENT_SSR
RUN pnpm --filter @template/contracts build
RUN pnpm --filter @template/client build


# Production: React Router SSR (clientMode=ssr) — gateway reverse-proxies
FROM base AS ssr
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/client/build ./client/build
COPY --from=build /app/client/package.json ./client/package.json
COPY --from=build /app/package.json ./package.json
WORKDIR /app/client
EXPOSE 3000
CMD ["pnpm", "exec", "react-router-serve", "./build/server/index.js"]
