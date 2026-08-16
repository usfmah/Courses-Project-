# Courses API

A RESTful API built with Node.js, Express and MongoDB for managing courses and user accounts (registration & login). It uses an MVC-inspired structure with centralized error handling and a consistent response format.

## Features

- Full CRUD for courses (Create, Read, Update, Delete)
- User registration with **hashed passwords** (bcryptjs) and login
- MongoDB persistence via Mongoose
- Request validation with **express-validator**
- Centralized error handling via a custom `AppError` class and `asyncWrapper` middleware
- Consistent JSON response format: `{ status, data, message }`
- Pagination on list endpoints (`?page=` & `?limit=`)

## Technologies

- **Node.js** — JavaScript runtime
- **Express** — web framework for routing and middleware
- **MongoDB / Mongoose** — database and ODM
- **express-validator** — request validation
- **bcryptjs** — password hashing
- **CORS** — cross-origin resource sharing
- **Postman** — used for testing the API endpoints

## Project Structure

```
CoursesProject
├── index.js                        # App entry point + server setup + error handlers
├── routes/
│   ├── coursesRoute.js            # Course route definitions
│   └── usersRoute.js              # User route definitions
├── controllers/
│   ├── coursesController.js       # Course request handlers
│   └── usersController.js         # User request handlers (all users, register, login)
├── middlewares/
│   ├── asyncWrapper.js            # Wraps async handlers and forwards errors
│   └── handlePostSchema.js        # Validation schema for course creation
├── models/
│   ├── coursesModels.js           # Course schema/model
│   └── userModel.js               # User schema/model
├── utils/
│   ├── appError.js                # Custom error class (message, statusCode, statusText)
│   └── httpStatusText.js          # Response status text constants (success/fail/error)
└── data/
    └── data.js                    # Seed data (in-memory, not used by the API)
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your MongoDB connection string:

```
PORT=3000
DB_URL=your_mongodb_connection_string_here
```

### 3. Run the server

```bash
node index.js
# or, with auto-restart:
npm start
```

The server runs on **http://localhost:3000**.

## Endpoints

### Courses — `/api/courses`

| Method | Route              | Description                  |
|--------|--------------------|------------------------------|
| GET    | `/api/courses`     | Get all courses (paginated)  |
| GET    | `/api/courses/:id` | Get a single course          |
| POST   | `/api/courses`     | Create a course              |
| PATCH  | `/api/courses/:id` | Update a course              |
| DELETE | `/api/courses/:id` | Delete a course              |

> Pagination: `GET /api/courses?page=2&limit=10`

### Users — `/api/users`

| Method | Route                 | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/api/users`          | Get all users (paginated)          |
| POST   | `/api/users/register` | Register a new user                |
| GET    | `/api/users/login`    | Log in with email and password     |

### Example request bodies

Create a course:

```json
{
  "title": "Node.js",
  "price": 2000
}
```

Register a user:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "secret123"
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

Error:

```json
{
  "status": "error",
  "message": "Course not found"
}
```

## Error Handling

- Errors from async handlers are wrapped by `middlewares/asyncWrapper.js` and forwarded to a central error middleware in `index.js`.
- Business errors are raised with the custom `utils/appError.js` class, which carries a `statusCode` and `statusText`.
- The global error middleware responds with `error.statusCode || 500`.

## Credits

This project is **inspired by the CodeZone channel's Node.js playlist**.