# Contributing to Momentum

Momentum is a full-stack productivity app with a React/Vite frontend in `client/` and an Express/Prisma backend in `server/`. When docs disagree, treat the current source code, `server/API_DOCS.md`, and `server/prisma/schema.prisma` as authoritative.

## 1. Project setup

```bash
git clone <repo-url>
cd momentum

cd server
npm install

cd ../client
npm install
```

Create `server/.env` with the variables listed below, then initialize the database:

```bash
cd ../server
npx prisma migrate dev
```

Start the dev servers in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Backend defaults to `http://localhost:3000`; the Vite frontend usually runs at `http://localhost:5173`.

## 2. Folder structure

```text
client/                 React app
  src/api/              Axios wrappers for backend calls
  src/components/       Shared UI, layout, and route helpers
  src/context/          App-level state such as auth
  src/pages/            Route-level screens

server/                 Express API
  prisma/               Schema and migrations
  src/routes/           URL definitions and middleware wiring
  src/controllers/      HTTP handlers
  src/services/         Reusable business logic and analytics
  src/middleware/       Auth, rate limits, errors, validation
  src/__tests__/        Jest/Supertest coverage
```

Routes stay thin, controllers shape request/response flow, and services hold logic that should not live in HTTP handlers.

## 3. Coding standards

- Use ES6+, `const` by default, `let` only when reassignment is needed, and `async/await` with `try/catch`.
- Use `camelCase` for variables/functions, `PascalCase` for React components, `SCREAMING_SNAKE_CASE` for constants, `PascalCase.jsx` for React files, and `camelCase.js` for utility files.
- Keep one React component per file and destructure props at the function signature.
- Frontend linting uses ESLint (`cd client && npm run lint`).
- API responses must follow the shared format:

```json
{ "success": true, "data": {}, "message": "..." }
```

```json
{ "success": false, "error": "...", "code": 400 }
```

## 4. Adding a new feature

1. Add or update the Prisma model if persistence changes are needed, then run a named migration.
2. Add request validation in `server/src/middleware/validation/`.
3. Add backend logic in a service when behavior is reusable or non-trivial.
4. Add a controller, then wire the route in `server/src/routes/` and mount it from `server/src/app.js`.
5. Add or update backend tests in `server/src/__tests__/`.
6. Add a frontend API wrapper in `client/src/api/`.
7. Add the page/component in `client/src/pages/` or `client/src/components/`, then wire routing/navigation as needed.
8. Update API docs when the public contract changes.

## 5. Running tests

```bash
cd server
npm test
```

Useful frontend checks:

```bash
cd client
npm run lint
npm run build
```

## 6. Git workflow

No repository Git history was available in this workspace, so use this project convention unless maintainers specify otherwise:

- Branches: `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>`
- Commits: Conventional Commits, e.g. `feat: add focus trend endpoint`, `fix: align nutrition payload`, `docs: update API guide`
- Keep branches focused; include tests/docs with behavior changes.

## 7. Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| `JWT_SECRET` | Secret used to sign and verify auth cookies. |
| `PORT` | Backend port; defaults to `3000` if omitted. |
| `CLIENT_URL` | Allowed frontend origin for CORS; defaults to the local Vite URL. |
| `NODE_ENV` | Controls environment-sensitive behavior such as secure cookies in production. |
| `ANTHROPIC_API_KEY` | Reserved for planned AI integration; not currently consumed by backend code. |

The client currently has no required environment variables; its API base URL is defined in source.
