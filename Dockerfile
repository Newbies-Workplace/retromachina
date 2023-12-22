FROM node:18.11.0 as builder

ARG RETRO_WEB_API_URL
ARG RETRO_WEB_SOCKET_URL

WORKDIR /build
COPY . ./

RUN npm ci
RUN npm run build

FROM node:18.11.0-alpine as retro-api

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/apps/api/package*.json ./
COPY --from=builder /build/apps/api/dist ./dist
COPY --from=builder /build/apps/api/prisma ./prisma

EXPOSE 3000

CMD [ "npm", "run", "start:migrate:prod" ]

FROM node:18.11.0-alpine as retro-web

WORKDIR /app

ENV CI=true
ENV SERVER_PORT=8080
EXPOSE 8080

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/apps/web/package*.json ./
COPY --from=builder /build/apps/web/server.js ./
COPY --from=builder /build/apps/web/dist/ ./dist

CMD node server.js
