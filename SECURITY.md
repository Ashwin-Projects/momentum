# Security Guide

This document summarizes the security posture currently implemented in Momentum. When docs disagree, use the live backend code and Prisma schema as the source of truth.

## 1. Authentication security

- Authentication uses JWTs stored in an HTTP-only cookie named `token`.
- Tokens are signed with `JWT_SECRET` and currently expire after `7d`.
- Auth cookies use:
  - `httpOnly: true`
  - `sameSite: "lax"`
  - `secure: true` only when `NODE_ENV=production`
  - `maxAge` of 7 days
- Protected routes run `authMiddleware`, which verifies the token and attaches the decoded user payload to `req.user`.

## 2. Rate limiting

Rate limits are applied in `server/src/app.js`:

| Scope | Limit |
|---|---|
| General traffic | `100` requests per IP per `15` minutes |
| `POST /api/auth/register` and `POST /api/auth/login` | `10` requests per IP per `15` minutes |

Auth routes use the stricter limiter; they are skipped by the general limiter to avoid double-counting.

## 3. Input validation

`express-validator` middleware currently covers:

- Auth
- Targets
- Study
- Workout
- Nutrition
- Sleep
- Focus
- Mood
- Screen time

Validation checks required fields, ISO date formats, numeric bounds, and string types before controllers run. Analytics routes currently handle query behavior in controller/service logic rather than dedicated validation middleware.

## 4. Password hashing

- Passwords are hashed with `bcryptjs`.
- Registration uses `bcrypt.hash(password, 10)`.
- Login uses `bcrypt.compare()` against the stored hash.
- Plaintext passwords should never be logged, stored, or returned.

## 5. Secrets and environment variables

These values must never be exposed in client code, screenshots, logs, or commits:

| Variable | Why it is sensitive |
|---|---|
| `JWT_SECRET` | Signs and verifies authentication tokens. |
| `DATABASE_URL` | Contains database connection details and usually credentials. |
| `ANTHROPIC_API_KEY` | Planned external API credential for future AI integration. |

`server/.gitignore` already excludes `.env`; keep secrets only in environment management, never in source control.

## 6. Database security

- PostgreSQL access is configured from `DATABASE_URL` only; it is read by Prisma and the PostgreSQL pool at runtime.
- Do not hardcode connection strings or commit `.env` files.
- Use least-privilege database credentials outside local development.
- All current user-scoped queries are filtered by `req.user.id`, which is essential for record isolation.

## 7. Future security considerations

- Remove the development fallback JWT secret before production deployment; production should fail fast if `JWT_SECRET` is missing.
- Add explicit CSRF protection strategy for cookie-authenticated state-changing routes.
- Review token lifetime and consider revocation/rotation if sessions need tighter control than a 7-day JWT.
- Keep `secure` cookies enabled behind HTTPS in production and verify proxy/CORS settings before deployment.
- Extend validation coverage when new analytics, export, or AI query inputs are added.
- Treat export endpoints as sensitive data surfaces: keep them authenticated, monitor usage, and review download/audit requirements before broader rollout.
- Add a documented vulnerability-reporting process before public launch.
