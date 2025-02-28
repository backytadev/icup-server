<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

# ICUP-SERVER

In this project, an API-RestFul and a backend for a membership and finance app are developed, the following technologies are used:, the following technologies are used:

- NestJs
- Docker
- TypeORM
- PostgresSQL

## Installation and Run Locally

Install my-project with npm or pnpm

1. Clone the project
2. Install dependencies

```
npm i or pnpm i
```

3. Clone the `.env.template` and change it to `.env` and configure its environment variables.
4. Raise the DB development, executing the command

```
docker compose up -d
```

5. Raise the backend-server dev mode

```
npm start:dev or pnpm run start:dev
```

6. Rebuild the database in development mode with the seed

```
http://localhost:3000/api/seed
```

## Documentation

Authenticate as a super user to be able to test the endpoints.

```
http://localhost:300/api
```
