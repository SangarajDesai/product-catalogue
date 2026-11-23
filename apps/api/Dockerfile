# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,target=/root/.npm npm ci --workspace @catalogue/api --include-workspace-root --no-audit --no-fund
COPY apps/api/ apps/api/
RUN npm run build --workspace @catalogue/api

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/web/package.json apps/web/
RUN --mount=type=cache,target=/root/.npm npm ci --workspace @catalogue/api --omit=dev --no-audit --no-fund
COPY --from=build /app/apps/api/dist apps/api/dist/
USER node
CMD ["node", "--enable-source-maps", "apps/api/dist/server.js"]
