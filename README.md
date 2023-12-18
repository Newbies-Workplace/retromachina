# Retromachina

Fajna aplikacja

### Develop

To develop retromachina, run the following commands:

Copy the .env.template file to .env and fill in the values:
```
cp .env.template .env
```

To start the database:
```
docker compose -f .docker/docker-compose.local.yaml up retro-db -d
```

To install all dependencies:
```
npm install
```

And finally, to start the development server:
```
npm run dev
```

App will be available at http://localhost:8080
