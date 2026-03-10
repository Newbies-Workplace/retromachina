# Retromachine

Cool app for retrospectives

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. Husky will validate all commit messages to ensure they follow this format.

Valid commit message examples:
- `feat: add new feature`
- `fix: resolve bug in component`
- `docs: update README`
- `refactor: improve code structure`
- `test: add unit tests`
- `chore: update dependencies`

The format is: `<type>(<optional scope>): <description>`

## Develop

To develop retromachine, run the following commands:

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
npm i
```

And finally, to start the development server:
```
npm run dev
```

App will be available at http://localhost:8080

## Production

### Backups
https://offen.github.io/docker-volume-backup/how-tos/
