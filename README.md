# Courses API

A RESTful API built with Node.js, Express 5 and MongoDB for managing courses and user accounts (registration & login). It uses an MVC-inspired structure with JWT-based authentication, role-based authorization, file uploads and centralized error handling with a consistent response envelope.

## Features

- Full CRUD for courses (Create, Read, Update, Delete)
- User registration with **hashed passwords** (bcryptjs) and login
- **JWT authentication** (`jsonwebtoken`) with `ADMIN`, `MANAGER` and `USER` roles, token expiry `15m` by default (configurable via `JWT_EXPIRES_IN`)
- **Role-based authorization**: only admins can create/update courses; admins and managers can delete them; only admins can list users
- **Avatar uploads** (multer) — image-only, max `2MB`, single file, stored in `uploads/` with a safe extension derived from the mime type and served statically at `/uploads`
- MongoDB persistence via Mongoose
- Request validation with **express-validator** + shared `validate` middleware (first error, `400`)
- Centralized error handling via a custom `AppError` class and `asyncWrapper` middleware
- Consistent JSON envelope: success `{status:"success", data}`, client error `{status:"fail", data:null, message}`, server error `{status:"error", data:null, message}`
- Pagination on list endpoints (`?page=` & `?limit=`, `page>=1`, `limit 1-100`)
- Security: `helmet`, restricted CORS via `ALLOWED_ORIGINS`, rate limiting on auth endpoints
- Integration tests with `jest` + `supertest` + `mongodb-memory-server`

## Technologies

- **Node.js** — JavaScript runtime
- **Express 5** — web framework for routing and middleware
- **MongoDB / Mongoose** — database and ODM
- **express-validator** — request validation
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT signing and verification
- **multer** — multipart file uploads
- **helmet** — secure HTTP headers
- **express-rate-limit** — auth throttling
- **cors** — cross-origin resource sharing (restricted via `ALLOWED_ORIGINS`)
- **jest / supertest / mongodb-memory-server** — integration tests (dev)

## Project Structure

```
CoursesProject
├── app.js                          # Express app (middleware, routers, 404 + error handlers), exports app
├── index.js                        # Entry point: checks DB_URL, connects to DB, then listens (exits 1 on DB failure)
├── routes/
│   ├── coursesRoute.js             # Course routes (public GET, admin-guarded writes, validation)
│   └── usersRoute.js               # User routes + multer upload config + validation + rate-limit via app.js
├── controllers/
│   ├── coursesController.js        # Course handlers (whitelisted {title,price}, runValidators)
│   └── usersController.js          # User handlers (getAllUsers, register, login)
├── middlewares/
│   ├── asyncWrapper.js             # Wraps async handlers and forwards errors
│   ├── courseValidation.js         # Course title/price validation (non-empty string, isFloat gt:0)
│   ├── validate.js                 # Shared validation-result middleware (400 first error via AppError)
│   ├── verifyToken.js              # Verifies JWT and attaches req.currentUser
│   └── allowedTo.js                # Role-based authorization guard
├── models/
│   ├── courseModel.js              # Course schema/model
│   └── userModel.js                # User schema/model (roles, avatar; no persisted token)
├── utils/
│   ├── appError.js                 # Custom error class (message, statusCode, statusText)
│   ├── httpStatusText.js           # Response status text constants (success/fail/error)
│   ├── JWTFunction.js              # JWT signing helper (JWT_EXPIRES_IN or 15m)
│   ├── logger.js                   # Minimal logger wrapper (info/error)
│   └── userRoles.js                # Role constants (USER / ADMIN / MANAGER)
├── tests/
│   └── api.test.js                 # Integration tests (register, login, courses, auth matrix, users)
├── uploads/                       # Uploaded avatars (served at /uploads, ignored except .gitkeep)
│   └── .gitkeep
└── .env.example                    # Example env (PORT, DB_URL, JWT_SECRET_KEY, JWT_EXPIRES_IN, ALLOWED_ORIGINS)
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `PORT` | no | `3000` | HTTP port |
| `DB_URL` | yes | — | MongoDB connection string. Startup throws if missing; server only listens after DB connect succeeds, exits `1` on failure |
| `JWT_SECRET_KEY` | yes | — | JWT signing secret. Startup throws if missing |
| `JWT_EXPIRES_IN` | no | `15m` | JWT expiry (e.g. `15m`, `1h`) |
| `ALLOWED_ORIGINS` | no | no cross-origin in production, open in dev | Comma-separated CORS origins, e.g. `http://localhost:3000,https://example.com` |

Example:

```
PORT=3000
DB_URL=your_mongodb_connection_string_here
JWT_SECRET_KEY=your_secret_key_here
JWT_EXPIRES_IN=15m
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Run the server

```bash
npm run dev   # development with auto-restart (nodemon)
npm start     # production (node index.js)
```

The server runs on **http://localhost:3000**. It only starts listening after the DB connection succeeds.

### 4. Run tests

```bash
npm test   # jest --runInBand (uses mongodb-memory-server, no external DB needed)
```

## Roles

Users are assigned the `USER` role by default at registration (the role cannot be chosen by the client). Admins/managers must be created directly in the database.

| Role     | Can create courses | Can update courses | Can delete courses | Can list users |
|----------|:------------------:|:------------------:|:------------------:|:--------------:|
| USER     | ✗                  | ✗                  | ✗                  | ✗              |
| MANAGER  | ✗                  | ✗                  | ✓                  | ✗              |
| ADMIN    | ✓                  | ✓                  | ✓                  | ✓              |

## Authentication

1. Register (`POST /api/users/register`) or log in (`POST /api/users/login`) to receive `{user, token}`. `user` never contains `password`. Tokens are not stored in the DB.
2. Send it as a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

Token expiry is `15m` by default (`JWT_EXPIRES_IN`). Protected routes return `401` without a valid token and `403` when the role is insufficient.

## Endpoints

### Courses — `/api/courses`

| Method | Route              | Auth                | Description                  |
|--------|--------------------|---------------------|------------------------------|
| GET    | `/api/courses`     | Public              | Get all courses (paginated: `?page>=1&limit=1-100`, defaults `page=1,limit=10`) |
| GET    | `/api/courses/:courseId` | Public        | Get a single course (`:courseId` must be MongoId, else `400`; missing → `404`) |
| POST   | `/api/courses`     | Bearer + `ADMIN`    | Create a course (`title` non-empty string, `price` float `>0`) |
| PATCH  | `/api/courses/:courseId` | Bearer + `ADMIN` | Update a course (same validation, whitelisted `{title,price}`, `runValidators:true`) |
| DELETE | `/api/courses/:courseId` | Bearer + `ADMIN`/`MANAGER` | Delete a course |

> Pagination: `GET /api/courses?page=2&limit=10`. Invalid `page`/`limit` → `400`. `limit>100` → `400`.

### Users — `/api/users`

| Method | Route                 | Auth      | Description                        |
|--------|-----------------------|-----------|------------------------------------|
| GET    | `/api/users`          | Bearer + `ADMIN` | Get all users (paginated, same `page`/`limit` rules). Response excludes `password`, `token`, `__v`. `USER` → `403` |
| POST   | `/api/users/register` | Public    | Register a new user (avatar optional). Rate-limited: max `20/hour`. Duplicate email → `409` |
| POST   | `/api/users/login`    | Public    | Log in with email and password. Rate-limited: max `10/15min`. Always `401 "Invalid email or password"` for unknown email or wrong password |

### Example request bodies

Create a course:

```json
{
  "title": "Node.js",
  "price": 2000
}
```

Register a user — sends `application/json` (without avatar):

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Password must be at least `8` characters. `firstName`, `lastName` required, `email` must be valid email.

Register a user with an avatar — must be sent as `multipart/form-data`:

| Field       | Type   | Value                       |
|-------------|--------|-----------------------------|
| firstName   | text   | John                        |
| lastName    | text   | Doe                         |
| email       | text   | john@example.com            |
| password    | text   | password123 (min 8)         |
| avatar      | file   | image only, max 2MB, 1 file |

Only images are accepted; any other file is rejected with `400`. Upload limits: `fileSize 2MB`, `files 1`. The stored filename uses a safe extension derived from the mime type (not the original filename) and is served at `/uploads/<filename>`. The user's `avatar` field holds the filename (or the default `uploads/images.jpeg` when none is uploaded).

Login — sends `application/json`:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response format

Success:

```json
{
  "status": "success",
  "data": { "course": { "title": "Node.js", "price": 2000 } }
}
```

Register/login success (same shape):

```json
{
  "status": "success",
  "data": {
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "USER",
      "avatar": "avatar-1735000000000-123456789.png"
    },
    "token": "<jwt_token>"
  }
}
```

Client error (`4xx`):

```json
{
  "status": "fail",
  "data": null,
  "message": "Invalid email or password"
}
```

Server error (`5xx`, never leaks internals):

```json
{
  "status": "error",
  "data": null,
  "message": "Internal server error"
}
```

Not found (unknown route):

```json
{
  "status": "fail",
  "data": null,
  "message": "This resource is not available"
}
```

## Error Handling

- Errors from async handlers are wrapped by `middlewares/asyncWrapper.js` and forwarded to a central error middleware in `app.js`.
- Business errors are raised with the custom `utils/appError.js` class (`message`, `statusCode`, `statusText`).
- Global handler: `CastError` → `400 "Invalid id format"`; Mongoose `ValidationError` → `400`; Mongo duplicate key (`11000`) → `409`; `MulterError` → `400`; `AppError` → its own `statusCode`/`statusText`; anything else → `500 "Internal server error"` (generic, no leak).
- Common status codes: `400` validation/bad request, `401` missing/invalid token or invalid credentials, `403` insufficient role, `404` not found (course or route), `409` duplicate email, `429` rate-limited (login/register).

## Rate limits & upload limits

- `POST /api/users/login`: max `10` per `15 minutes` → `429` afterwards.
- `POST /api/users/register`: max `20` per `hour` → `429` afterwards.
- Avatar upload: `2MB` max, `1` file max, image mime only, safe extension from mime whitelist.

## Credits

This project is **inspired by the CodeZone channel's Node.js playlist**.
