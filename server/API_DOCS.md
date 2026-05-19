# Momentum API Documentation

This document reflects the current Express routes, controllers, validation middleware, analytics service, and Prisma schema in this repository.

## Base URL

Development API routes are mounted under:

```text
http://localhost:3000/api
```

The root status endpoint is available at `GET /`.

## Common Response Shapes

Most API handlers return this success shape:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Most errors return:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

Validation middleware returns:

```json
{
  "success": false,
  "error": "Validation failed: field message",
  "code": 400
}
```

Protected routes require the `token` HTTP-only cookie set by login or registration.

## Authentication Flow

1. Register with `POST /api/auth/register` or log in with `POST /api/auth/login`.
2. The server hashes passwords with `bcryptjs` during registration.
3. On successful register/login, the server signs a JWT containing `{ id, email }` with `JWT_SECRET`.
4. The JWT is stored in an HTTP-only cookie named `token`.
5. Protected route groups run `authMiddleware`, which reads `req.cookies.token`, verifies the JWT, and assigns the decoded payload to `req.user`.
6. Controllers use `req.user.id` to scope database operations to the authenticated user.
7. `POST /api/auth/logout` clears the `token` cookie. This route is not protected by `authMiddleware`.

Cookie options used by register/login:

```json
{
  "httpOnly": true,
  "secure": "true only when NODE_ENV is production",
  "sameSite": "lax",
  "maxAge": 604800000
}
```

Authentication errors from protected routes:

```json
{
  "success": false,
  "error": "Authentication required"
}
```

```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

## Rate Limiting

Rate limiting is configured globally in `src/app.js` and `src/middleware/rateLimiter.js`.

| Routes | Limit | Window | Notes |
|---|---:|---|---|
| All routes except `POST /api/auth/register` and `POST /api/auth/login` | 100 requests per IP | 15 minutes | Applies to `/`, `/api/health`, `/api/auth/logout`, all protected CRUD routes, and all analytics routes. |
| `POST /api/auth/register` and `POST /api/auth/login` | 10 requests per IP | 15 minutes | These routes use the dedicated auth limiter and are skipped by the general limiter. |

Rate-limit response:

```json
{
  "success": false,
  "error": "Too many requests",
  "code": 429
}
```

## Endpoint Index

| Method | URL | Auth |
|---|---|---|
| GET | `/` | No |
| GET | `/api/health` | No |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | No |
| GET | `/api/targets` | Yes |
| POST | `/api/targets` | Yes |
| PATCH | `/api/targets/:id` | Yes |
| DELETE | `/api/targets/:id` | Yes |
| GET | `/api/study` | Yes |
| POST | `/api/study` | Yes |
| PATCH | `/api/study/:id` | Yes |
| DELETE | `/api/study/:id` | Yes |
| GET | `/api/workout` | Yes |
| POST | `/api/workout` | Yes |
| PATCH | `/api/workout/:id` | Yes |
| DELETE | `/api/workout/:id` | Yes |
| GET | `/api/nutrition` | Yes |
| POST | `/api/nutrition` | Yes |
| PATCH | `/api/nutrition/:id` | Yes |
| DELETE | `/api/nutrition/:id` | Yes |
| GET | `/api/sleep` | Yes |
| POST | `/api/sleep` | Yes |
| PATCH | `/api/sleep/:id` | Yes |
| DELETE | `/api/sleep/:id` | Yes |
| GET | `/api/focus` | Yes |
| POST | `/api/focus` | Yes |
| PATCH | `/api/focus/:id` | Yes |
| DELETE | `/api/focus/:id` | Yes |
| GET | `/api/mood` | Yes |
| POST | `/api/mood` | Yes |
| PATCH | `/api/mood/:id` | Yes |
| DELETE | `/api/mood/:id` | Yes |
| GET | `/api/screentime` | Yes |
| POST | `/api/screentime` | Yes |
| PATCH | `/api/screentime/:id` | Yes |
| DELETE | `/api/screentime/:id` | Yes |
| GET | `/api/analytics/summary` | Yes |
| GET | `/api/analytics/trends` | Yes |
| GET | `/api/analytics/mood-trends` | Yes |
| GET | `/api/analytics/focus-trends` | Yes |
| GET | `/api/analytics/screentime-breakdown` | Yes |
| GET | `/api/analytics/productivity-score` | Yes |
| GET | `/api/ai/context` | Yes |
| POST | `/api/ai/chat` | Yes |

## Validation Rules By Endpoint

Shared validation conventions:

- Validated date-like values use ISO 8601 format: `date`, `startDate`, `endDate`, `startedAt`, `completedAt`, and `loggedAt`.
- Every validated `PATCH` and `DELETE` route with `:id` requires `id` to be a non-empty string path parameter.
- Analytics routes currently do **not** use `express-validator` middleware; their query behavior is handled inside the analytics controller/service.

### Public and Auth

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /` | None | No validation middleware. |
| `GET /api/health` | None | No validation middleware. |
| `POST /api/auth/register` | `name`: non-empty string; `email`: valid email; `password`: string with minimum length `6` | None. |
| `POST /api/auth/login` | `email`: valid email; `password`: non-empty string | None. |
| `POST /api/auth/logout` | None | No request fields are validated. |

### Daily Targets

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/targets` | None | `date`: ISO 8601 query string. |
| `POST /api/targets` | `date`: ISO 8601 string | `studyMinutesGoal`, `workoutGoal`, `caloriesGoal`: integers `>= 0`; `sleepHoursGoal`: number from `0` to `24`. |
| `PATCH /api/targets/:id` | `id`: string path parameter | `studyMinutesGoal`, `workoutGoal`, `caloriesGoal`, `studyMinutesActual`, `workoutsCompleted`, `caloriesActual`: integers `>= 0`; `sleepHoursGoal`, `sleepHoursActual`: numbers from `0` to `24`. |
| `DELETE /api/targets/:id` | `id`: string path parameter | None. |

### Study Sessions

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/study` | None | `date`, `startDate`, `endDate`: ISO 8601 query strings. |
| `POST /api/study` | `subject`: non-empty string; `durationMinutes`: integer `>= 1`; `startedAt`: ISO 8601 string | `notes`: string or `null`; `dailyTargetId`: string or `null`. |
| `PATCH /api/study/:id` | `id`: string path parameter | `subject`: string; `durationMinutes`: integer `>= 1`; `startedAt`: ISO 8601 string; `notes`: string or `null`. |
| `DELETE /api/study/:id` | `id`: string path parameter | None. |

### Workouts

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/workout` | None | `date`, `startDate`, `endDate`: ISO 8601 query strings. |
| `POST /api/workout` | `type`: non-empty string; `durationMinutes`: integer `>= 1`; `completedAt`: ISO 8601 string | `caloriesBurned`: integer `>= 0` or `null`; `notes`: string or `null`; `dailyTargetId`: string or `null`. |
| `PATCH /api/workout/:id` | `id`: string path parameter | `type`: string; `durationMinutes`: integer `>= 1`; `completedAt`: ISO 8601 string; `caloriesBurned`: integer `>= 0` or `null`; `notes`: string or `null`. |
| `DELETE /api/workout/:id` | `id`: string path parameter | None. |

### Nutrition

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/nutrition` | None | `date`, `startDate`, `endDate`: ISO 8601 query strings. |
| `POST /api/nutrition` | `mealType`: non-empty string; `foodName`: non-empty string; `calories`: integer `>= 0`; `loggedAt`: ISO 8601 string | `proteinGrams`, `carbsGrams`, `fatGrams`: integers `>= 0` or `null`; `dailyTargetId`: string or `null`. |
| `PATCH /api/nutrition/:id` | `id`: string path parameter | `mealType`, `foodName`: strings; `calories`, `proteinGrams`, `carbsGrams`, `fatGrams`: integers `>= 0`; nullable macro fields may also be `null`; `loggedAt`: ISO 8601 string. |
| `DELETE /api/nutrition/:id` | `id`: string path parameter | None. |

### Sleep

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/sleep` | None | `date`, `startDate`, `endDate`: ISO 8601 query strings. |
| `POST /api/sleep` | `date`: ISO 8601 string | `sleepHoursGoal`, `sleepHoursActual`: numbers from `0` to `24`. |
| `PATCH /api/sleep/:id` | `id`: string path parameter | `sleepHoursGoal`, `sleepHoursActual`: numbers from `0` to `24`. |
| `DELETE /api/sleep/:id` | `id`: string path parameter | None. |

### Focus Sessions

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/focus` | None | `date`, `startDate`, `endDate`: ISO 8601 query strings. |
| `POST /api/focus` | `taskName`: non-empty string; `durationMinutes`: integer `>= 1`; `startedAt`: ISO 8601 string | `focusScore`: integer from `1` to `10`; `distractionsCount`: integer `>= 0`; `notes`: string or `null`; `dailyTargetId`: string or `null`. |
| `PATCH /api/focus/:id` | `id`: string path parameter | `taskName`: string; `durationMinutes`: integer `>= 1`; `startedAt`: ISO 8601 string; `focusScore`: integer from `1` to `10`; `distractionsCount`: integer `>= 0`; `notes`: string or `null`. |
| `DELETE /api/focus/:id` | `id`: string path parameter | None. |

### Mood Logs

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/mood` | None | `date`, `startDate`, `endDate`: ISO 8601 query strings. |
| `POST /api/mood` | `mood`: non-empty string; `loggedAt`: ISO 8601 string | `energyLevel`, `stressLevel`: integers from `1` to `10`; `notes`: string or `null`; `dailyTargetId`: string or `null`. |
| `PATCH /api/mood/:id` | `id`: string path parameter | `mood`: string; `loggedAt`: ISO 8601 string; `energyLevel`, `stressLevel`: integers from `1` to `10`; `notes`: string or `null`. |
| `DELETE /api/mood/:id` | `id`: string path parameter | None. |

### Screen Time Logs

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/screentime` | None | `date`, `startDate`, `endDate`: ISO 8601 query strings; `category`: string. |
| `POST /api/screentime` | `appName`: non-empty string; `durationMinutes`: integer `>= 1`; `category`: non-empty string; `loggedAt`: ISO 8601 string | `dailyTargetId`: string or `null`. |
| `PATCH /api/screentime/:id` | `id`: string path parameter | `appName`, `category`: strings; `durationMinutes`: integer `>= 1`; `loggedAt`: ISO 8601 string. |
| `DELETE /api/screentime/:id` | `id`: string path parameter | None. |

### Analytics

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/analytics/summary` | None | `startDate`, `endDate`: optional query strings; no validator middleware. A range is used only when both parse as valid dates and `startDate <= endDate`. |
| `GET /api/analytics/trends` | None | `startDate`, `endDate`: optional query strings; no validator middleware. Invalid or missing ranges fall back to the last 7 days. |
| `GET /api/analytics/mood-trends` | None | `days`: optional query value. Accepted values are `7`, `14`, or `30`; invalid or missing values default to `7`. |
| `GET /api/analytics/focus-trends` | None | `days`: optional query value. Accepted values are `7`, `14`, or `30`; invalid or missing values default to `7`. |
| `GET /api/analytics/screentime-breakdown` | None | `startDate`, `endDate`: optional query strings; no validator middleware. Invalid or missing ranges fall back to the last 7 days. |
| `GET /api/analytics/productivity-score` | None | Either `days` (`7`, `14`, or `30`; invalid values default to `7`) or `startDate`/`endDate` query strings. If `days` is absent, a date range is used only when both dates parse and `startDate <= endDate`; otherwise the service falls back to the last 7 days. |

### AI Planner

| Endpoint | Required fields | Optional fields / accepted values |
|---|---|---|
| `GET /api/ai/context` | None | `date`: ISO 8601 query string; defaults to today. |
| `POST /api/ai/chat` | `message`: non-empty string | `conversationHistory`: array of `{ sender: "user" \| "ai", text: string }` (or `role`/`content`); `date`: ISO 8601 string for context day (defaults to today). Requires `GROQ_API_KEY` on the server. |

## Public Endpoints

### GET `/`

Auth required: No

Request body: None

Request example:

```http
GET /
```

Response example:

```json
{
  "message": "Momentum API is running"
}
```

Possible error codes: none in the handler.

### GET `/api/health`

Auth required: No

Request body: None

Request example:

```http
GET /api/health
```

Response example:

```json
{
  "status": "healthy",
  "timestamp": "2026-05-14T12:00:00.000Z",
  "database": "connected"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 500 | Database query failed. |

Error example:

```json
{
  "status": "unhealthy",
  "error": "database error message"
}
```

## Auth Endpoints

### POST `/api/auth/register`

Auth required: No

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | Non-empty string. |
| `email` | string | Yes | Valid email. |
| `password` | string | Yes | At least 6 characters. |

Request example:

```json
{
  "name": "Ashwin",
  "email": "ashwin@example.com",
  "password": "secret123"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmabc123",
      "name": "Ashwin",
      "email": "ashwin@example.com"
    }
  },
  "message": "Registration successful"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 400 | Validation failed, missing fields, or email already registered. |
| 500 | Unexpected registration/database error. |

### POST `/api/auth/login`

Auth required: No

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | Yes | Valid email. |
| `password` | string | Yes | Non-empty string. |

Request example:

```json
{
  "email": "ashwin@example.com",
  "password": "secret123"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmabc123",
      "name": "Ashwin",
      "email": "ashwin@example.com"
    }
  },
  "message": "Login successful"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 400 | Validation failed or missing email/password. |
| 401 | Invalid credentials. |
| 500 | Unexpected login/database error. |

### POST `/api/auth/logout`

Auth required: No

Request body: None

Request example:

```http
POST /api/auth/logout
```

Response example:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 400 | Validation middleware failure, though no fields are currently validated. |

## Daily Targets

Daily targets are stored in the `DailyTarget` model and include both goals and actual values.

### GET `/api/targets`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `date` | ISO 8601 date string | No | Filters targets to that calendar day. |

Request body: None

Request example:

```http
GET /api/targets?date=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "target_1",
      "userId": "user_1",
      "date": "2026-05-14T00:00:00.000Z",
      "studyMinutesGoal": 180,
      "workoutGoal": 1,
      "caloriesGoal": 2200,
      "sleepHoursGoal": 8,
      "studyMinutesActual": 90,
      "workoutsCompleted": 0,
      "caloriesActual": 1200,
      "sleepHoursActual": 7.5,
      "createdAt": "2026-05-14T08:00:00.000Z",
      "updatedAt": "2026-05-14T09:00:00.000Z"
    }
  ],
  "message": "Targets retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/targets`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `date` | ISO 8601 date string | Yes | Saved as start of day. |
| `studyMinutesGoal` | integer | No | Minimum 0. Defaults to 0. |
| `workoutGoal` | integer | No | Minimum 0. Defaults to 0. |
| `caloriesGoal` | integer | No | Minimum 0. Defaults to 0. |
| `sleepHoursGoal` | number | No | 0 to 24. Defaults to 0. |

Request example:

```json
{
  "date": "2026-05-14",
  "studyMinutesGoal": 180,
  "workoutGoal": 1,
  "caloriesGoal": 2200,
  "sleepHoursGoal": 8
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "target_1",
    "userId": "user_1",
    "date": "2026-05-14T00:00:00.000Z",
    "studyMinutesGoal": 180,
    "workoutGoal": 1,
    "caloriesGoal": 2200,
    "sleepHoursGoal": 8,
    "studyMinutesActual": 0,
    "workoutsCompleted": 0,
    "caloriesActual": 0,
    "sleepHoursActual": 0,
    "createdAt": "2026-05-14T08:00:00.000Z",
    "updatedAt": "2026-05-14T08:00:00.000Z"
  },
  "message": "Target created successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 400 | Validation failed, missing date, or target already exists for that date. |
| 401 | Missing/invalid token. |
| 500 | Unexpected database error. |

### PATCH `/api/targets/:id`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `studyMinutesGoal` | integer | No | Minimum 0. |
| `workoutGoal` | integer | No | Minimum 0. |
| `caloriesGoal` | integer | No | Minimum 0. |
| `sleepHoursGoal` | number | No | 0 to 24. |
| `studyMinutesActual` | integer | No | Minimum 0. |
| `workoutsCompleted` | integer | No | Minimum 0. |
| `caloriesActual` | integer | No | Minimum 0. |
| `sleepHoursActual` | number | No | 0 to 24. |

Request example:

```json
{
  "studyMinutesActual": 120,
  "workoutsCompleted": 1,
  "sleepHoursActual": 7.5
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "target_1",
    "userId": "user_1",
    "date": "2026-05-14T00:00:00.000Z",
    "studyMinutesGoal": 180,
    "workoutGoal": 1,
    "caloriesGoal": 2200,
    "sleepHoursGoal": 8,
    "studyMinutesActual": 120,
    "workoutsCompleted": 1,
    "caloriesActual": 0,
    "sleepHoursActual": 7.5,
    "createdAt": "2026-05-14T08:00:00.000Z",
    "updatedAt": "2026-05-14T10:00:00.000Z"
  },
  "message": "Target updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/targets/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/targets/target_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Target deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Study Sessions

### GET `/api/study`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `date` | ISO 8601 date string | No | Filters to one day by `startedAt`. |
| `startDate` | ISO 8601 date string | No | Used with `endDate`. |
| `endDate` | ISO 8601 date string | No | Used with `startDate`. |

If `date` is present, it takes precedence over `startDate`/`endDate`.

Request body: None

Request example:

```http
GET /api/study?startDate=2026-05-08&endDate=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "study_1",
      "userId": "user_1",
      "dailyTargetId": "target_1",
      "subject": "Algorithms",
      "durationMinutes": 90,
      "notes": "Dynamic programming practice",
      "startedAt": "2026-05-14T09:00:00.000Z",
      "createdAt": "2026-05-14T10:30:00.000Z"
    }
  ],
  "message": "Study sessions retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/study`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `subject` | string | Yes | Non-empty string. |
| `durationMinutes` | integer | Yes | Greater than 0. |
| `startedAt` | ISO 8601 date string | Yes | Session start time. |
| `notes` | string or null | No | Optional. |
| `dailyTargetId` | string or null | No | Optional related target id. |

Request example:

```json
{
  "subject": "Algorithms",
  "durationMinutes": 90,
  "startedAt": "2026-05-14T09:00:00.000Z",
  "notes": "Dynamic programming practice",
  "dailyTargetId": "target_1"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "study_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "subject": "Algorithms",
    "durationMinutes": 90,
    "notes": "Dynamic programming practice",
    "startedAt": "2026-05-14T09:00:00.000Z",
    "createdAt": "2026-05-14T10:30:00.000Z"
  },
  "message": "Study session created successfully"
}
```

Possible error codes: 400, 401, 500.

### PATCH `/api/study/:id`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `subject` | string | No | Optional. |
| `durationMinutes` | integer | No | Greater than 0. |
| `startedAt` | ISO 8601 date string | No | Optional. |
| `notes` | string or null | No | Optional. |

Request example:

```json
{
  "durationMinutes": 120,
  "notes": "Added graph problems"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "study_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "subject": "Algorithms",
    "durationMinutes": 120,
    "notes": "Added graph problems",
    "startedAt": "2026-05-14T09:00:00.000Z",
    "createdAt": "2026-05-14T10:30:00.000Z"
  },
  "message": "Study session updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/study/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/study/study_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Study session deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Workouts

### GET `/api/workout`

Auth required: Yes

Query parameters: `date`, `startDate`, and `endDate` as ISO 8601 date strings. `date` filters by one `completedAt` day and takes precedence over date range.

Request body: None

Request example:

```http
GET /api/workout?date=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "workout_1",
      "userId": "user_1",
      "dailyTargetId": "target_1",
      "type": "strength",
      "durationMinutes": 60,
      "caloriesBurned": 350,
      "notes": "Chest and triceps",
      "completedAt": "2026-05-14T18:00:00.000Z",
      "createdAt": "2026-05-14T19:00:00.000Z"
    }
  ],
  "message": "Workouts retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/workout`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `type` | string | Yes | Non-empty string. |
| `durationMinutes` | integer | Yes | Greater than 0. |
| `completedAt` | ISO 8601 date string | Yes | Completion time. |
| `caloriesBurned` | integer or null | No | Minimum 0. |
| `notes` | string or null | No | Optional. |
| `dailyTargetId` | string or null | No | Optional related target id. |

Request example:

```json
{
  "type": "strength",
  "durationMinutes": 60,
  "caloriesBurned": 350,
  "completedAt": "2026-05-14T18:00:00.000Z",
  "notes": "Chest and triceps",
  "dailyTargetId": "target_1"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "workout_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "type": "strength",
    "durationMinutes": 60,
    "caloriesBurned": 350,
    "notes": "Chest and triceps",
    "completedAt": "2026-05-14T18:00:00.000Z",
    "createdAt": "2026-05-14T19:00:00.000Z"
  },
  "message": "Workout logged successfully"
}
```

Possible error codes: 400, 401, 500.

### PATCH `/api/workout/:id`

Auth required: Yes

Request body fields: optional `type` string, `durationMinutes` integer greater than 0, `completedAt` ISO date string, `caloriesBurned` non-negative integer or null, `notes` string or null.

Request example:

```json
{
  "durationMinutes": 75,
  "caloriesBurned": 420
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "workout_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "type": "strength",
    "durationMinutes": 75,
    "caloriesBurned": 420,
    "notes": "Chest and triceps",
    "completedAt": "2026-05-14T18:00:00.000Z",
    "createdAt": "2026-05-14T19:00:00.000Z"
  },
  "message": "Workout updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/workout/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/workout/workout_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Workout deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Nutrition

### GET `/api/nutrition`

Auth required: Yes

Query parameters: `date`, `startDate`, and `endDate` as ISO 8601 date strings. `date` filters by one `loggedAt` day and takes precedence over date range.

Request body: None

Request example:

```http
GET /api/nutrition?startDate=2026-05-08&endDate=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "nutrition_1",
      "userId": "user_1",
      "dailyTargetId": "target_1",
      "mealType": "lunch",
      "foodName": "Rice bowl",
      "calories": 650,
      "proteinGrams": 32,
      "carbsGrams": 78,
      "fatGrams": 18,
      "loggedAt": "2026-05-14T13:00:00.000Z",
      "createdAt": "2026-05-14T13:05:00.000Z"
    }
  ],
  "message": "Nutrition logs retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/nutrition`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `mealType` | string | Yes | Non-empty string. |
| `foodName` | string | Yes | Non-empty string. |
| `calories` | integer | Yes | Minimum 0. |
| `loggedAt` | ISO 8601 date string | Yes | Log time. |
| `proteinGrams` | integer or null | No | Minimum 0. |
| `carbsGrams` | integer or null | No | Minimum 0. |
| `fatGrams` | integer or null | No | Minimum 0. |
| `dailyTargetId` | string or null | No | Optional related target id. |

Request example:

```json
{
  "mealType": "lunch",
  "foodName": "Rice bowl",
  "calories": 650,
  "proteinGrams": 32,
  "carbsGrams": 78,
  "fatGrams": 18,
  "loggedAt": "2026-05-14T13:00:00.000Z",
  "dailyTargetId": "target_1"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "nutrition_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "mealType": "lunch",
    "foodName": "Rice bowl",
    "calories": 650,
    "proteinGrams": 32,
    "carbsGrams": 78,
    "fatGrams": 18,
    "loggedAt": "2026-05-14T13:00:00.000Z",
    "createdAt": "2026-05-14T13:05:00.000Z"
  },
  "message": "Nutrition log created successfully"
}
```

Possible error codes: 400, 401, 500.

### PATCH `/api/nutrition/:id`

Auth required: Yes

Request body fields: optional `mealType` string, `foodName` string, `calories` non-negative integer, `proteinGrams` non-negative integer or null, `carbsGrams` non-negative integer or null, `fatGrams` non-negative integer or null, `loggedAt` ISO date string.

Request example:

```json
{
  "calories": 700,
  "proteinGrams": 36
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "nutrition_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "mealType": "lunch",
    "foodName": "Rice bowl",
    "calories": 700,
    "proteinGrams": 36,
    "carbsGrams": 78,
    "fatGrams": 18,
    "loggedAt": "2026-05-14T13:00:00.000Z",
    "createdAt": "2026-05-14T13:05:00.000Z"
  },
  "message": "Nutrition log updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/nutrition/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/nutrition/nutrition_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Nutrition log deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Sleep

Sleep is stored on `DailyTarget`, not in a separate `SleepLog` Prisma model. Deleting a sleep log resets `sleepHoursGoal` and `sleepHoursActual` to `0`; it does not delete the `DailyTarget` row.

### GET `/api/sleep`

Auth required: Yes

Query parameters: `date`, `startDate`, and `endDate` as ISO 8601 date strings. Filters use the `DailyTarget.date` field.

Request body: None

Request example:

```http
GET /api/sleep?date=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "target_1",
      "date": "2026-05-14T00:00:00.000Z",
      "sleepHoursGoal": 8,
      "sleepHoursActual": 7.5,
      "createdAt": "2026-05-14T08:00:00.000Z",
      "updatedAt": "2026-05-14T09:00:00.000Z"
    }
  ],
  "message": "Sleep logs retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/sleep`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `date` | ISO 8601 date string | Yes | Saved as start of day. |
| `sleepHoursGoal` | number | No | 0 to 24. |
| `sleepHoursActual` | number | No | 0 to 24. |

If a `DailyTarget` already exists for the date, it is updated. Otherwise a new one is created.

Request example:

```json
{
  "date": "2026-05-14",
  "sleepHoursGoal": 8,
  "sleepHoursActual": 7.5
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "target_1",
    "userId": "user_1",
    "date": "2026-05-14T00:00:00.000Z",
    "studyMinutesGoal": 0,
    "workoutGoal": 0,
    "caloriesGoal": 0,
    "sleepHoursGoal": 8,
    "studyMinutesActual": 0,
    "workoutsCompleted": 0,
    "caloriesActual": 0,
    "sleepHoursActual": 7.5,
    "createdAt": "2026-05-14T08:00:00.000Z",
    "updatedAt": "2026-05-14T09:00:00.000Z"
  },
  "message": "Sleep logged successfully"
}
```

Possible error codes: 400, 401, 500.

### PATCH `/api/sleep/:id`

Auth required: Yes

Request body fields: optional `sleepHoursGoal` number from 0 to 24, optional `sleepHoursActual` number from 0 to 24.

Request example:

```json
{
  "sleepHoursActual": 8
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "target_1",
    "userId": "user_1",
    "date": "2026-05-14T00:00:00.000Z",
    "studyMinutesGoal": 0,
    "workoutGoal": 0,
    "caloriesGoal": 0,
    "sleepHoursGoal": 8,
    "studyMinutesActual": 0,
    "workoutsCompleted": 0,
    "caloriesActual": 0,
    "sleepHoursActual": 8,
    "createdAt": "2026-05-14T08:00:00.000Z",
    "updatedAt": "2026-05-14T10:00:00.000Z"
  },
  "message": "Sleep log updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/sleep/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/sleep/target_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Sleep log deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Focus Sessions

### GET `/api/focus`

Auth required: Yes

Query parameters: `date`, `startDate`, and `endDate` as ISO 8601 date strings. Filters use `startedAt`.

Request body: None

Request example:

```http
GET /api/focus?startDate=2026-05-08&endDate=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "focus_1",
      "userId": "user_1",
      "dailyTargetId": "target_1",
      "taskName": "Write DAA notes",
      "durationMinutes": 45,
      "focusScore": 8,
      "distractionsCount": 1,
      "startedAt": "2026-05-14T11:00:00.000Z",
      "notes": "Good session",
      "createdAt": "2026-05-14T11:45:00.000Z"
    }
  ],
  "message": "Focus sessions retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/focus`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `taskName` | string | Yes | Non-empty string. |
| `durationMinutes` | integer | Yes | Greater than 0. |
| `startedAt` | ISO 8601 date string | Yes | Start time. |
| `focusScore` | integer | No | 1 to 10. Defaults to 5. |
| `distractionsCount` | integer | No | Minimum 0. Defaults to 0. |
| `notes` | string or null | No | Optional. |
| `dailyTargetId` | string or null | No | Optional related target id. |

Request example:

```json
{
  "taskName": "Write DAA notes",
  "durationMinutes": 45,
  "focusScore": 8,
  "distractionsCount": 1,
  "startedAt": "2026-05-14T11:00:00.000Z",
  "notes": "Good session",
  "dailyTargetId": "target_1"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "focus_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "taskName": "Write DAA notes",
    "durationMinutes": 45,
    "focusScore": 8,
    "distractionsCount": 1,
    "startedAt": "2026-05-14T11:00:00.000Z",
    "notes": "Good session",
    "createdAt": "2026-05-14T11:45:00.000Z"
  },
  "message": "Focus session created successfully"
}
```

Possible error codes: 400, 401, 500.

### PATCH `/api/focus/:id`

Auth required: Yes

Request body fields: optional `taskName` string, `durationMinutes` integer greater than 0, `startedAt` ISO date string, `focusScore` integer from 1 to 10, `distractionsCount` non-negative integer, `notes` string or null.

Request example:

```json
{
  "focusScore": 9,
  "distractionsCount": 0
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "focus_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "taskName": "Write DAA notes",
    "durationMinutes": 45,
    "focusScore": 9,
    "distractionsCount": 0,
    "startedAt": "2026-05-14T11:00:00.000Z",
    "notes": "Good session",
    "createdAt": "2026-05-14T11:45:00.000Z"
  },
  "message": "Focus session updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/focus/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/focus/focus_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Focus session deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Mood Logs

### GET `/api/mood`

Auth required: Yes

Query parameters: `date`, `startDate`, and `endDate` as ISO 8601 date strings. Filters use `loggedAt`.

Request body: None

Request example:

```http
GET /api/mood?date=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "mood_1",
      "userId": "user_1",
      "dailyTargetId": "target_1",
      "mood": "good",
      "energyLevel": 7,
      "stressLevel": 4,
      "notes": "Steady day",
      "loggedAt": "2026-05-14T20:00:00.000Z",
      "createdAt": "2026-05-14T20:05:00.000Z"
    }
  ],
  "message": "Mood logs retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/mood`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `mood` | string | Yes | Non-empty string. Analytics maps `great`, `good`, `neutral`, `low`, `bad` to scores. |
| `loggedAt` | ISO 8601 date string | Yes | Log time. |
| `energyLevel` | integer | No | 1 to 10. Defaults to 5. |
| `stressLevel` | integer | No | 1 to 10. Defaults to 5. |
| `notes` | string or null | No | Optional. |
| `dailyTargetId` | string or null | No | Optional related target id. |

Request example:

```json
{
  "mood": "good",
  "energyLevel": 7,
  "stressLevel": 4,
  "loggedAt": "2026-05-14T20:00:00.000Z",
  "notes": "Steady day",
  "dailyTargetId": "target_1"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "mood_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "mood": "good",
    "energyLevel": 7,
    "stressLevel": 4,
    "notes": "Steady day",
    "loggedAt": "2026-05-14T20:00:00.000Z",
    "createdAt": "2026-05-14T20:05:00.000Z"
  },
  "message": "Mood log created successfully"
}
```

Possible error codes: 400, 401, 500.

### PATCH `/api/mood/:id`

Auth required: Yes

Request body fields: optional `mood` string, `loggedAt` ISO date string, `energyLevel` integer from 1 to 10, `stressLevel` integer from 1 to 10, `notes` string or null.

Request example:

```json
{
  "mood": "great",
  "energyLevel": 9
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "mood_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "mood": "great",
    "energyLevel": 9,
    "stressLevel": 4,
    "notes": "Steady day",
    "loggedAt": "2026-05-14T20:00:00.000Z",
    "createdAt": "2026-05-14T20:05:00.000Z"
  },
  "message": "Mood log updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/mood/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/mood/mood_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Mood log deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Screen Time Logs

### GET `/api/screentime`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `date` | ISO 8601 date string | No | Filters to one `loggedAt` day. |
| `startDate` | ISO 8601 date string | No | Used with `endDate`. |
| `endDate` | ISO 8601 date string | No | Used with `startDate`. |
| `category` | string | No | Exact category filter. |

Request body: None

Request example:

```http
GET /api/screentime?category=distracting
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": [
    {
      "id": "screen_1",
      "userId": "user_1",
      "dailyTargetId": "target_1",
      "appName": "YouTube",
      "durationMinutes": 30,
      "category": "distracting",
      "loggedAt": "2026-05-14T21:00:00.000Z",
      "createdAt": "2026-05-14T21:30:00.000Z"
    }
  ],
  "message": "Screen time logs retrieved successfully"
}
```

Possible error codes: 400, 401, 500.

### POST `/api/screentime`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `appName` | string | Yes | Non-empty string. |
| `durationMinutes` | integer | Yes | Greater than 0. |
| `category` | string | Yes | Non-empty string. Analytics currently sums `productive`, `distracting`, and `neutral`. |
| `loggedAt` | ISO 8601 date string | Yes | Log time. |
| `dailyTargetId` | string or null | No | Optional related target id. |

Request example:

```json
{
  "appName": "YouTube",
  "durationMinutes": 30,
  "category": "distracting",
  "loggedAt": "2026-05-14T21:00:00.000Z",
  "dailyTargetId": "target_1"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "screen_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "appName": "YouTube",
    "durationMinutes": 30,
    "category": "distracting",
    "loggedAt": "2026-05-14T21:00:00.000Z",
    "createdAt": "2026-05-14T21:30:00.000Z"
  },
  "message": "Screen time log created successfully"
}
```

Possible error codes: 400, 401, 500.

### PATCH `/api/screentime/:id`

Auth required: Yes

Request body fields: optional `appName` string, `durationMinutes` integer greater than 0, `category` string, `loggedAt` ISO date string.

Request example:

```json
{
  "durationMinutes": 20,
  "category": "neutral"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "id": "screen_1",
    "userId": "user_1",
    "dailyTargetId": "target_1",
    "appName": "YouTube",
    "durationMinutes": 20,
    "category": "neutral",
    "loggedAt": "2026-05-14T21:00:00.000Z",
    "createdAt": "2026-05-14T21:30:00.000Z"
  },
  "message": "Screen time log updated successfully"
}
```

Possible error codes: 400, 401, 404, 500.

### DELETE `/api/screentime/:id`

Auth required: Yes

Request body: None

Request example:

```http
DELETE /api/screentime/screen_1
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "message": "Screen time log deleted successfully"
}
```

Possible error codes: 400, 401, 404, 500.

## Analytics Endpoints

Analytics routes are protected by `authMiddleware`. The analytics module currently exposes six endpoints:

- `GET /api/analytics/summary`
- `GET /api/analytics/trends`
- `GET /api/analytics/mood-trends`
- `GET /api/analytics/focus-trends`
- `GET /api/analytics/screentime-breakdown`
- `GET /api/analytics/productivity-score`

The date-range endpoints accept optional `startDate` and `endDate` query parameters, but there is no validation middleware on analytics routes. The service uses a supplied range only when both values parse as valid dates and `startDate <= endDate`.

For analytics summary metrics, most service methods query all records if no valid range is supplied. `moodTrends` falls back to the last 7 days when no valid range is supplied.

For analytics trends and the newer focused analytics endpoints, the service falls back to the last 7 days when no valid range or supported `days` value is supplied.

### GET `/api/analytics/summary`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `startDate` | date string | No | Used only with a valid `endDate`. |
| `endDate` | date string | No | Used only with a valid `startDate`. |

Request body: None

Request example:

```http
GET /api/analytics/summary?startDate=2026-05-08&endDate=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": {
    "weeklyStudySummary": {
      "totalMinutes": 300,
      "averagePerDay": 42.86,
      "mostStudiedSubject": {
        "subject": "Algorithms",
        "minutes": 180
      }
    },
    "workoutFrequency": {
      "totalWorkouts": 3,
      "totalCaloriesBurned": 950,
      "mostCommonWorkoutType": {
        "type": "strength",
        "count": 2
      }
    },
    "sleepAnalysis": {
      "averageDuration": 7.25,
      "averageQuality": 8.9,
      "consistencyScore": 86.5
    },
    "nutritionSummary": {
      "averageDailyCalories": 2100,
      "averageProtein": 95,
      "averageCarbs": 240,
      "averageFat": 65
    },
    "focusAnalysis": {
      "averageFocusScore": 8,
      "averageDistractions": 1.25,
      "totalDeepWorkMinutes": 180
    },
    "moodTrends": {
      "averageMood": 4,
      "averageEnergy": 7,
      "averageStress": 3.5
    },
    "screenTimeBreakdown": {
      "productive": 240,
      "distracting": 90,
      "neutral": 60,
      "totalMinutes": 390
    }
  },
  "message": "Analytics summary retrieved successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 401 | Missing/invalid token. |
| 500 | Analytics/database error. Response includes `code: 500`. |

### GET `/api/analytics/trends`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `startDate` | date string | No | Used only with a valid `endDate`. |
| `endDate` | date string | No | Used only with a valid `startDate`. |

Request body: None

Request example:

```http
GET /api/analytics/trends?startDate=2026-05-08&endDate=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": {
    "studyMinutesByDay": [
      {
        "date": "2026-05-14",
        "minutes": 120
      }
    ],
    "workoutsByDay": [
      {
        "date": "2026-05-14",
        "count": 1,
        "caloriesBurned": 350
      }
    ],
    "sleepByDay": [
      {
        "date": "2026-05-14",
        "duration": 7.5,
        "goal": 8
      }
    ],
    "nutritionCaloriesByDay": [
      {
        "date": "2026-05-14",
        "calories": 2100
      }
    ],
    "focusByDay": [
      {
        "date": "2026-05-14",
        "averageFocusScore": 8.5,
        "averageDistractions": 1,
        "deepWorkMinutes": 90
      }
    ],
    "moodByDay": [
      {
        "date": "2026-05-14",
        "averageMood": 4,
        "averageEnergy": 7,
        "averageStress": 3
      }
    ],
    "screenTimeByDay": [
      {
        "date": "2026-05-14",
        "productive": 120,
        "distracting": 30,
        "neutral": 20,
        "total": 170
      }
    ]
  },
  "message": "Analytics trends retrieved successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 401 | Missing/invalid token. |
| 500 | Analytics/database error. Response includes `code: 500`. |

### GET `/api/analytics/mood-trends`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `days` | integer-like string | No | Accepted values: `7`, `14`, or `30`. Any other value, or omission, defaults to `7`. |

Request body: None

Request example:

```http
GET /api/analytics/mood-trends?days=14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": {
    "averageMood": 4,
    "averageEnergy": 7,
    "averageStress": 3.5,
    "entriesCount": 4,
    "moodByDay": [
      {
        "date": "2026-05-14",
        "averageMood": 4,
        "averageEnergy": 7,
        "averageStress": 3
      }
    ],
    "days": 14
  },
  "message": "Mood trends retrieved successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 401 | Missing/invalid token. |
| 500 | Analytics/database error. Response includes `code: 500`. |

### GET `/api/analytics/focus-trends`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `days` | integer-like string | No | Accepted values: `7`, `14`, or `30`. Any other value, or omission, defaults to `7`. |

Request body: None

Request example:

```http
GET /api/analytics/focus-trends?days=30
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": {
    "averageFocusScore": 8.5,
    "averageDistractions": 1,
    "totalDeepWorkMinutes": 180,
    "focusByDay": [
      {
        "date": "2026-05-14",
        "averageFocusScore": 8.5,
        "averageDistractions": 1,
        "deepWorkMinutes": 90
      }
    ],
    "days": 30
  },
  "message": "Focus trends retrieved successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 401 | Missing/invalid token. |
| 500 | Analytics/database error. Response includes `code: 500`. |

### GET `/api/analytics/screentime-breakdown`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `startDate` | date string | No | Used only with a valid `endDate`. |
| `endDate` | date string | No | Used only with a valid `startDate`. |

Request body: None

Request example:

```http
GET /api/analytics/screentime-breakdown?startDate=2026-05-08&endDate=2026-05-14
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": {
    "productive": 240,
    "distracting": 90,
    "neutral": 60,
    "totalMinutes": 390,
    "percentages": {
      "productive": 61.54,
      "distracting": 23.08,
      "neutral": 15.38
    }
  },
  "message": "Screen time breakdown retrieved successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 401 | Missing/invalid token. |
| 500 | Analytics/database error. Response includes `code: 500`. |

### GET `/api/analytics/productivity-score`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `days` | integer-like string | No | Accepted values: `7`, `14`, or `30`. When present, unsupported values default to `7`. |
| `startDate` | date string | No | Used only when `days` is absent and a valid `endDate` is also supplied. |
| `endDate` | date string | No | Used only when `days` is absent and a valid `startDate` is also supplied. |

Request body: None

Request example:

```http
GET /api/analytics/productivity-score?days=7
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": {
    "averageProductivityScore": 78.5,
    "daysTracked": 2,
    "dailyScores": [
      {
        "date": "2026-05-14",
        "studyScore": 100,
        "workoutScore": 100,
        "sleepScore": 93.75,
        "focusScore": 85,
        "productivityScore": 94
      }
    ]
  },
  "message": "Productivity score retrieved successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 401 | Missing/invalid token. |
| 500 | Analytics/database error. Response includes `code: 500`. |

## AI Planner Endpoints

AI routes are protected by `authMiddleware`. The service uses Groq (default model `llama-3.1-8b-instant`) with `GROQ_API_KEY` from the server environment. Optional `GROQ_MODEL` overrides the default model.

### GET `/api/ai/context`

Auth required: Yes

Query parameters:

| Field | Type | Required | Rules |
|---|---|---|---|
| `date` | ISO 8601 date string | No | Day used for today's progress and logs. Defaults to today. |

Request body: None

Request example:

```http
GET /api/ai/context?date=2026-05-18
Cookie: token=<jwt>
```

Response example:

```json
{
  "success": true,
  "data": {
    "todayProgress": {
      "studyMinutes": 90,
      "studyGoal": 180,
      "workoutsCompleted": 1,
      "workoutGoal": 1,
      "caloriesConsumed": 1200,
      "calorieGoal": 2200,
      "sleepHoursActual": 7.5,
      "sleepHoursGoal": 8
    },
    "targets": [],
    "recentSessions": [
      { "subject": "Algorithms", "duration": 90, "startedAt": "2026-05-18T09:00:00.000Z" }
    ],
    "recentWorkouts": [
      { "type": "strength", "duration": 60, "caloriesBurned": 350 }
    ],
    "mealsToday": [
      { "type": "lunch", "food": "Rice bowl", "calories": 650 }
    ],
    "recentSleep": [
      { "date": "2026-05-18T00:00:00.000Z", "goal": 8, "actual": 7.5 }
    ]
  },
  "message": "AI planner context retrieved successfully"
}
```

Possible error codes: 401, 500.

### POST `/api/ai/chat`

Auth required: Yes

Request body:

| Field | Type | Required | Rules |
|---|---|---|---|
| `message` | string | Yes | Non-empty user message. |
| `conversationHistory` | array | No | Prior chat turns: `{ "sender": "user" \| "ai", "text": "..." }` or `{ "role": "user" \| "assistant", "content": "..." }`. |
| `date` | ISO 8601 date string | No | Day for loading user context. Defaults to today. |

Request example:

```json
{
  "message": "Help me plan the rest of my day",
  "conversationHistory": [
    { "sender": "user", "text": "How am I doing today?" },
    { "sender": "ai", "text": "You're halfway to your study goal." }
  ],
  "date": "2026-05-18"
}
```

Response example:

```json
{
  "success": true,
  "data": {
    "response": "You're making solid progress on study and workouts. Here's how to finish strong today.",
    "planSections": {
      "study": {
        "title": "Study",
        "summary": "90 of 180 minutes logged.",
        "recommendations": ["Block 45 minutes for review before dinner."]
      },
      "workout": {
        "title": "Workout",
        "summary": "Workout goal met for today.",
        "recommendations": ["Light stretching this evening."]
      },
      "nutrition": {
        "title": "Nutrition",
        "summary": "About 1000 kcal remaining toward goal.",
        "recommendations": ["Plan a protein-rich dinner around 700 kcal."]
      },
      "sleep": {
        "title": "Sleep",
        "summary": "On track for 8h goal if you wind down by 10:30 PM.",
        "recommendations": ["Avoid screens 30 minutes before bed."]
      }
    }
  },
  "message": "AI response generated successfully"
}
```

Possible error codes:

| Code | Reason |
|---|---|
| 400 | Missing or empty `message`. |
| 401 | Missing/invalid token. |
| 503 | `GROQ_API_KEY` not configured on server. |
| 500 | Groq API or unexpected server error. |

## Data Models Summary

The current Prisma schema uses PostgreSQL and Prisma Client.

### `User`

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()`. |
| `name` | String | Required. |
| `email` | String | Required, unique. |
| `password` | String | Required, hashed by auth controller. |
| `createdAt` | DateTime | Defaults to now. |
| `updatedAt` | DateTime | Auto-updated. |

Relations: has many daily targets, study sessions, workout logs, nutrition logs, focus sessions, mood logs, and screen time logs.

### `DailyTarget`

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()`. |
| `userId` | String | Required foreign key to `User`. |
| `date` | DateTime | One target per user per date. |
| `studyMinutesGoal` | Int | Defaults to 0. |
| `workoutGoal` | Int | Defaults to 0. |
| `caloriesGoal` | Int | Defaults to 0. |
| `sleepHoursGoal` | Float | Defaults to 0.0. |
| `studyMinutesActual` | Int | Defaults to 0. |
| `workoutsCompleted` | Int | Defaults to 0. |
| `caloriesActual` | Int | Defaults to 0. |
| `sleepHoursActual` | Float | Defaults to 0.0. |
| `createdAt` | DateTime | Defaults to now. |
| `updatedAt` | DateTime | Auto-updated. |

Constraints and indexes: unique on `[userId, date]`, index on `userId`.

### `StudySession`

Tracks study time by subject.

Fields: `id`, `userId`, optional `dailyTargetId`, `subject`, `durationMinutes`, optional `notes`, `startedAt`, `createdAt`.

Indexes: `[userId, startedAt]`, `userId`.

### `WorkoutLog`

Tracks completed workouts.

Fields: `id`, `userId`, optional `dailyTargetId`, `type`, `durationMinutes`, optional `caloriesBurned`, optional `notes`, `completedAt`, `createdAt`.

Indexes: `[userId, completedAt]`, `userId`.

### `NutritionLog`

Tracks meals and macros.

Fields: `id`, `userId`, optional `dailyTargetId`, `mealType`, `foodName`, `calories`, optional `proteinGrams`, optional `carbsGrams`, optional `fatGrams`, `loggedAt`, `createdAt`.

Indexes: `[userId, loggedAt]`, `userId`.

### `FocusSession`

Tracks focused work sessions.

Fields: `id`, `userId`, optional `dailyTargetId`, `taskName`, `durationMinutes`, `focusScore`, `distractionsCount`, `startedAt`, optional `notes`, `createdAt`.

Indexes: `[userId, startedAt]`, `userId`.

### `MoodLog`

Tracks mood, energy, and stress.

Fields: `id`, `userId`, optional `dailyTargetId`, `mood`, `energyLevel`, `stressLevel`, optional `notes`, `loggedAt`, `createdAt`.

Indexes: `[userId, loggedAt]`, `userId`.

### `ScreenTimeLog`

Tracks app usage time.

Fields: `id`, `userId`, optional `dailyTargetId`, `appName`, `durationMinutes`, `category`, `loggedAt`, `createdAt`.

Indexes: `[userId, loggedAt]`, `userId`.

## Notes From Current Implementation

- All protected CRUD routes are scoped to `req.user.id`.
- Validation is handled per route group with `express-validator`.
- Create endpoints that accept optional numeric fields commonly save omitted or falsy optional values as `null` or `0`, depending on controller logic.
- `PATCH` endpoints update only fields that are present in the request body.
- `GET` list endpoints order results descending by their primary date field.
- `DailyTarget`, study, workout, nutrition, focus, mood, and screen time records are deleted only after verifying that the record belongs to the authenticated user.
- `CLAUDE.md` contains older/aspirational API and schema notes; this document follows the current code and `server/prisma/schema.prisma`.
