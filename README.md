## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Initial setup

install dependencies

```bash
$ pnpm install
```

create .env file

```bash
$ cp .env.example .env.local
```

Start DB

```bash
$ docker-compose up -d
```

Run migrations

```bash
npx prisma migrate dev
```
