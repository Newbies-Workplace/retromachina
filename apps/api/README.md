# Retromachina backend

## Key technologies:
- NestJS
- REST API
- DB (Prisma) 
- WebSockets (socket.io)
- Google OAuth 2.0
- JWT tokens

## Requirements:
- node >= 18
- docker

## Development

- run:
  ```bash
  npm install
  ```
- create `.env` file in root directory based on `.env.template`
- run `docker-compose.local.yaml` using 
  ```bash
  docker-compose -f .docker/docker-compose.local.yaml up -d
  ```
- run npm scripts:
  ```bash
  npm run prisma:init
  npm run start:dev
  ```
