# CHANGES — Hardening (branch `hardening`)

All work done on branch `hardening`, never pushed, never touched `main`. One commit per numbered task.

## Task 1 — Config and fail-fast
**What changed:**
- Added `JWT_SECRET_KEY=your_secret_key_here` and `JWT_EXPIRES_IN=15m` to `.env.example`.
- `index.js` (later `app.js`/`index.js` after Task 6 split) throws clear `Error` if `JWT_SECRET_KEY` or `DB_URL` is missing.
- `utils/JWTFunction.js`: `expiresIn` changed from hardcoded `'1m'` to `process.env.JWT_EXPIRES_IN || '15m'`.
- `index.js`: `app.listen` moved inside `mongoose.connect().then()`, `catch` logs and `process.exit(1)`. Server only listens after DB success.

**Files touched:** `.env.example`, `utils/JWTFunction.js`, `index.js`

**How verified:**
- `node -e` decode JWT: `exp-iat === 900` → `15m` OK.
- `JWT_SECRET_KEY="" DB_URL=... node index.js` throws `JWT_SECRET_KEY is missing`, exit 1. Same for missing `DB_URL`.
- Code inspection confirms `listen` inside `then`, `exit(1)` in `catch`.

**NOT verified / skipped:**
- Live DB boot against remote Atlas (`DB_URL` in local `.env`) could NOT be verified: `timeout 20 node index.js` produced no `mongodb server started`/`listen` log and timed out (exit 124). Mongoose server-selection to Atlas hangs in this sandbox. Gated-listen logic verified by inspection only. No new dependency added.

## Task 2 — Centralized error handling and response envelope
**What changed:**
- Rewrote global error middleware in `index.js` (now `app.js`): `CastError` → `400 "Invalid id format"`; `ValidationError` → `400`; `code 11000` → `409 "Duplicate field value entered"`; `AppError` → its own `statusCode`/`statusText` (500+ mapped to generic); anything else → `500 {status:"error", data:null, message:"Internal server error"}` (never leaks internals).
- Envelope: success `{status:"success", data}` (controllers unchanged); client error `{status:"fail", data:null, message}`; server error `{status:"error", data:null, message}`.
- Fixed 404 typo to `"This resource is not available"` with `{status:"fail", data:null, message}`.
- Fixed `"passowrd"` → `"password"` in `controllers/usersController.js` (later superseded by Task 3 generic login message, but typo removed).
- Changed `verifyToken` (`401`) and `allowedTo` (`403`) from `ERROR` to `FAIL` to match client-error envelope.

**Files touched:** `index.js` (`app.js` after Task 6), `controllers/usersController.js`, `middlewares/verifyToken.js`, `middlewares/allowedTo.js`

**How verified:**
- `node --check` on all four files OK.
- Content checks: `CastError`, `ValidationError`, `11000`, `Internal server error`, fixed 404 string, `data: null`, no `passowrd` remain — all PASS.
- Full HTTP error-code verification deferred to Task 6 integration tests (which later passed for 400/401/403/404).

**NOT verified / skipped:**
- Live 500-leak check without DB at this stage; covered later by tests (tests assert 401/403/404 shapes, and error middleware returns generic 500 by inspection). No new dependency.

## Task 3 — Validation
**What changed:**
- New shared `middlewares/validate.js`: returns `400` with first `express-validator` message via `AppError`.
- Fixed `middlewares/handlePostSchema.js` (later renamed): `title` non-empty string (`notEmpty` + `isString` + `trim`), `price` `isFloat({gt:0})` + `.toFloat()` (was wrong `isLength`).
- Routes: `coursesRoute.js` adds `paginationRules` (`page` optional int ≥1, `limit` optional int 1–100, `.toInt()`), `courseIdRule` (`isMongoId` → `"Invalid id format"`) on get/update/delete, and reuses course validation on BOTH create AND update. `usersRoute.js` adds `registerValidation` (firstName/lastName required, email `isEmail`, password min 8), `loginValidation` (email `isEmail`, password required), and pagination on list.
- Controllers: replaced `parseInt(...) || default` with `req.query.limit ?? 10` / `req.query.page ?? 1` (validated + `toInt` values); `updateCourses` whitelists `{title,price}` with `{new:true, runValidators:true}`; `createCourses` whitelists `{title,price}` and drops manual `validationResult` (handled by `validate` middleware).
- `login`: generic `401 "Invalid email or password"` for unknown-email and wrong-password; `typeof email/password !== 'string'` guard before query (NoSQL operator-injection prevention).
- `register` duplicate → `409` (was `400`); race duplicate still `409` via Task 2 `11000` handler.
- Deliberately did NOT use `express-mongo-sanitize` (incompatible with Express 5 `req.query` read-only); used `express-validator` + whitelisting + string checks instead, per task ground rules.

**Files touched:** `middlewares/validate.js` (new), `middlewares/handlePostSchema.js`, `controllers/coursesController.js`, `controllers/usersController.js`, `routes/coursesRoute.js`, `routes/usersRoute.js`

**How verified:**
- `node --check` all files OK; validation chains load (`course validation chains: 2`).
- Full behavior (register 400s, login 401s, pagination 400s, invalid id 400, price 400s) deferred to Task 6 tests — all passed there (26/26).

**NOT verified / skipped:**
- No live-DB manual curl at this stage (no test harness yet). Relied on later automated tests. No new dependency (express-validator already present).

## Task 4 — Security hardening
**What changed:**
- Added dependencies `helmet` (secure headers) and `express-rate-limit` (auth throttling) — stated in commit message.
- `index.js` (`app.js` after Task 6): `app.use(helmet())`; CORS restricted via `ALLOWED_ORIGINS` (comma-separated, trimmed; if set → `cors({origin:list})`, else if `NODE_ENV=production` → `cors({origin:false})` (no cross-origin), else open for dev/test); `loginLimiter` (`15min/max 10`) on `/api/users/login`, `registerLimiter` (`60min/max 20`) on `/api/users/register` with `429 {fail,data:null,message}`; added `MulterError` → `400` in error middleware.
- `.env.example`: documented `ALLOWED_ORIGINS=http://localhost:3000`.
- `models/userModel.js`: removed persisted `token` field.
- `controllers/usersController.js`: `register` and `login` both return ONE shape `{status:"success", data:{user,token}}` where `user` is `toObject()` minus `password` (no DB token write).
- `routes/usersRoute.js`: `GET /` now `verifyToken, allowedTo(ADMIN)` (was any auth); `getAllusers` projection `{password:0, token:0, __v:0}`.
- Multer: `limits:{fileSize:2*1024*1024, files:1}`; filename uses `mimeExtensionMap` whitelist from `file.mimetype` (jpg/png/gif/webp/bmp/svg/tiff/ico, fallback `png`), no longer trusts `originalname`.

**Files touched:** `package.json`, `package-lock.json`, `.env.example`, `index.js`/`app.js`, `models/userModel.js`, `controllers/usersController.js`, `routes/usersRoute.js`

**How verified:**
- `node --check` all files OK.
- Content checks PASS: `helmet`, `ALLOWED_ORIGINS`, `max:10`, `max:20`, login/register paths, token removed from schema, consistent `{user,token}` shape, `delete *.password`, `ADMIN` guard, `fileSize`, `mimeExtensionMap`, no `originalname`, `ALLOWED_ORIGINS` in example.
- Auth/matrix, `GET /users` 403/200 + no password/token, and rate-limit non-interference verified later by Task 6 tests (26/26 passed; register/login HTTP counts kept under limits by creating role users directly via DB).

**NOT verified / skipped:**
- Live `429` throttling (would require 11 logins / 21 registers; not in required test matrix, and would risk flaking the suite). Limiter config verified by inspection. `helmet` headers not asserted in tests (supertest ignores CORS/headers). No CORS live-browser check.

## Task 5 — Hygiene
**What changed:**
- Removed unused `const jwt = require('jsonwebtoken')` in `controllers/usersController.js` (verified `verifyToken`/`JWTFunction` still legitimately use it, so dep kept).
- Confirmed `data/data.js` unused via `rg` (no import outside `REVIEW_REPORT.md`), then `git rm data/data.js` (removes empty `data/` dir).
- `.gitignore`: added `uploads/*` + `!uploads/.gitkeep`; created `uploads/.gitkeep` (existing avatars/`images.jpeg` stay locally but ignored).
- `package.json`: split `"start":"node index.js"`, `"dev":"nodemon index.js"` (was `start:nodemon`).
- Renames for consistency: `models/coursesModels.js` → `models/courseModel.js`, `middlewares/handlePostSchema.js` → `middlewares/courseValidation.js`, `getAllusers` → `getAllUsers`; updated every import (`coursesController`, `coursesRoute`, `usersController`, `usersRoute`). Deliberately kept `utils/JWTFunction.js` name and plural `createCourses/updateCourses/deleteCourses` to minimize churn (examples in task were `e.g.`, not exhaustive).
- New `utils/logger.js` (`info`→`console.log`, `error`→`console.error`, no heavy deps); replaced `console.log` in `index.js` with `logger.info/error`.

**Files touched:** `controllers/usersController.js`, `controllers/coursesController.js`, `.gitignore`, `uploads/.gitkeep` (new), `package.json`, `utils/logger.js` (new), `models/courseModel.js` (renamed), `middlewares/courseValidation.js` (renamed), `data/data.js` (deleted), `routes/coursesRoute.js`, `routes/usersRoute.js`, `index.js`

**How verified:**
- `rg` confirms no `coursesModels|handlePostSchema|getAllusers` in code (excluding `REVIEW_REPORT`/`README` pre-Task 7).
- `node --check` all renamed files OK; checks PASS for no `console.log`, logger used, gitignore, `.gitkeep` exists, start/dev scripts, data deleted, jwt import removed.
- Boot check: `node -e "require routes/controllers/models"` → `all imports OK`; `timeout 8 node index.js` → exit `124` (waiting DB, NOT `MODULE_NOT_FOUND`), confirming renames didn’t break boot.

**NOT verified / skipped:**
- Full DB boot again blocked by remote Atlas timeout (same as Task 1). Verified import resolution + waiting state only. No new dependency.

## Task 6 — Automated tests
**What changed:**
- Added dev deps `jest`, `supertest`, `mongodb-memory-server` (stated in commit message for API coverage).
- Refactored minimally: new `app.js` exports Express `app` (helmet/CORS/limiters/routers/404/error handler, JWT fail-fast); `index.js` only checks `DB_URL`, connects, then `listen` (exits 1 on failure) — so tests import `app` without starting a server.
- `package.json`: `"test":"jest --runInBand"`.
- New `tests/api.test.js` (26 tests): register success/duplicate-409/invalid-email-400/short-pass-400/missing-400; login success-token/wrong-pass-401/unknown-401-same-message; courses public GET default/valid-limit/invalid-limit-400/limit>100-400/invalid-id-400/missing-id-404; auth matrix no-token-401/USER-403/MANAGER-403-on-POST+PATCH-200-on-DELETE/ADMIN-all-success; price negative/zero/non-numeric-400 on create+update (via `test.each`); `GET /users` 403-USER/200-ADMIN/never-password-or-token + pagination-400.

**Files touched:** `package.json`, `package-lock.json`, `app.js` (new), `index.js`, `tests/api.test.js` (new)

**How verified:**
- `npm test` → `Test Suites: 1 passed, Tests: 26 passed` (also re-ran after Task 7, still 26/26).
- `mongodb-memory-server` startup verified standalone before writing tests (`uri: mongodb://127.0.0.1:.../ stopped OK`).

**NOT verified / skipped:**
- `429` rate-limit paths not tested (would exceed limits and flake suite; config verified by inspection). Avatar upload success path not tested (would write to `uploads/`; validation/fileFilter covered by code). No live Atlas test (memory server only).

## Task 7 — Documentation
**What changed:**
- Rewrote `README.md` to match real code: envelope (`success/{data}`, `fail/{data:null,message}`, `error/{data:null,message}`); endpoints table with correct `POST /login` (was `GET`), auth/roles (`GET /users` ADMIN-only), pagination rules, validation rules, status codes `400/401/403/404/409/429`; env table (`PORT,DB_URL,JWT_SECRET_KEY,JWT_EXPIRES_IN=15m,ALLOWED_ORIGINS`); `npm run dev` (nodemon) vs `npm start` (node); `npm test` (`jest --runInBand` + memory server); rate limits (`10/15min` login, `20/hour` register); upload limits (`2MB`, `1` file, image-only, safe mime-derived ext, `/uploads` static); token expiry `15m` + Bearer usage; unified `{user,token}` register/login shape (no password, no DB token); project structure (renamed files, `app.js`, `logger.js`, `tests/`, no `data/`); tech list (+helmet, rate-limit, jest/supertest/memory-server). Removed false claims (GET login, triple `{status,data,message}`, `npm start` auto-restart, open `GET /users`, `1m` expiry, unvalidated pagination).

**Files touched:** `README.md`

**How verified:**
- `npm test` re-run after docs change: still `26 passed` (docs don’t affect code).
- Manual cross-check of README statements against `app.js`, `routes/*`, `controllers/*`, `models/*`, `.env.example`, `package.json` scripts.

**NOT verified / skipped:**
- No live swagger/postman run; docs verified by code reading, not by live Atlas boot (Atlas unreachable in sandbox).

## General notes
- Branch: `hardening` (never pushed, never touched `main`).
- Express 5 respected: no `express-mongo-sanitize` (would break `req.query` read-only); used `express-validator` + `.toInt()/.toFloat()` + whitelisting + `typeof` string guards.
- Only new deps when required: Task 4 `helmet` + `express-rate-limit` (security), Task 6 `jest` + `supertest` + `mongodb-memory-server` (tests). No heavy logger (custom `utils/logger.js`).
- Remaining risk: remote Atlas `DB_URL` in local `.env` unreachable from sandbox (all boot attempts timeout). CI/prod with reachable Mongo should listen correctly (logic: `listen` inside `connect.then`, `exit 1` in `catch`).
