# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY website/package.json ./website/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @template/website... --frozen-lockfile || \
    pnpm install --filter @template/website...

# Local — Astro dev server (gateway reverse-proxies /)
FROM deps AS dev
ENV NODE_ENV=development
COPY website ./website
COPY env ./env
EXPOSE 4321
CMD ["pnpm", "--filter", "@template/website", "dev", "--host", "0.0.0.0", "--port", "4321"]

# Static build — gateway serves /app/website/dist (mode=docker). Not a long-running service.
FROM deps AS build
COPY website ./website
COPY env ./env
ARG WEBSITE_ENV_FILE=env/website.env
COPY ${WEBSITE_ENV_FILE} ./env/website.env
RUN pnpm --filter @template/website build

# Alias so older compose targets keep working
FROM build AS runtime
