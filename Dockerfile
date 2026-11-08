FROM node:26.13.0 AS builder

ARG RETRO_WEB_API_URL
ARG RETRO_WEB_SOCKET_URL
ARG DATABASE_URL
ARG APP_VERSION

WORKDIR /build
COPY . ./

RUN npm ci
RUN if [ -n "$APP_VERSION" ]; then npm pkg set "version=${APP_VERSION#v}" --workspace=web; fi
RUN npm run build

FROM node:26.13.0-alpine as retro-api

WORKDIR /app

# Prisma writes engine files under node_modules during `migrate deploy`,
# so the runtime user must own the copied files.

COPY --chown=node:node --from=builder /build/node_modules ./node_modules
COPY --chown=node:node --from=builder /build/apps/api/package*.json ./
COPY --chown=node:node --from=builder /build/apps/api/prisma.config.ts ./
COPY --chown=node:node --from=builder /build/apps/api/dist ./dist
COPY --chown=node:node --from=builder /build/apps/api/prisma ./prisma
COPY --chown=node:node --from=builder /build/packages/shared/.dist ./node_modules/shared

EXPOSE 3000

USER node

CMD [ "npm", "run", "start:migrate:prod" ]

FROM node:26.13.0-alpine as retro-web

WORKDIR /app

ENV CI=true
ENV SERVER_PORT=8080
EXPOSE 8080

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/apps/web/package*.json ./
COPY --from=builder /build/apps/web/server.js ./
COPY --from=builder /build/apps/web/dist/ ./dist

USER node

CMD [ "node", "server.js" ]
