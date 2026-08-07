# Courses API

A simple RESTful API built with Node.js and Express for managing a list of courses. It implements full CRUD (Create, Read, Update, Delete) operations using an MVC-inspired structure.

## Technologies

- **Node.js** — JavaScript runtime
- **Express** — web framework for routing and middleware
- **express-validator** — request body validation (`title`, `price`)
- **Postman** — used for testing the API endpoints

## Project Structure

```
CoursesProject
├── index.js                 # App entry point + server setup
├── routes/
│   └── routes.js           # Route definitions
├── controllers/
│   └── coursesController.js  # Request handlers / business logic
├── middlewares/
│   └── handlePostSchema.js   # Validation schema for POST
└── data/
    └── data.js              # In-memory course data store
```

## Endpoints

| Method | Route                | Description            |
|--------|----------------------|------------------------|
| GET    | `/api/courses`       | Get all courses        |
| GET    | `/api/courses/:id`   | Get a single course    |
| POST   | `/api/courses`       | Create a course        |
| PATCH  | `/api/courses/:id`   | Update a course        |
| DELETE | `/api/courses/:id`   | Delete a course        |

### Example POST body

```json
{
  "title": "Node.js",
  "price": 2000
}
```

## Getting Started

```bash
npm install
node index.js
```

The server runs on **http://localhost:3000** and serves course requests under `/api/courses`.

> Data is stored **in-memory** and resets whenever the server restarts.

## Credits

This project is **inspired by the CodeZone channel's Node.js playlist**.