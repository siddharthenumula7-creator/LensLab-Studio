# LensLab Studio — Camera Rental REST API

**Backend Development Fundamentals · Group YG-AIML2B-G05**

LensLab Studio is a backend application for managing photographers, cameras and rentals. It is built using the topics in Modules 1, 2 and 3 of the supplied syllabus. Module 4 (authentication and user management) is not included.

## 1. Technologies

- Node.js
- Express.js
- SQLite
- SQL
- Postman

## 2. Requirements

- Node.js 18 or later
- npm
- Postman (optional; the provided `.http` file can also be used in VS Code)

## 3. Install and run

Open a terminal inside the `LensLab_Studio` folder:

```bash
npm install
npm start
```

The server runs at `http://localhost:3000`.

For automatic server restart during development:

```bash
npm run dev
```

The SQLite database is created automatically at `database/lenslab.db` when the server starts.

To start with an empty database, stop the server and run:

```bash
npm run reset-db
npm start
```

## 4. Database tables

The database contains three tables:

| Table | Purpose |
|---|---|
| `photographers` | Stores photographer details |
| `cameras` | Stores camera details |
| `rentals` | Stores rental details and connects photographers with cameras |

The tables use primary keys and constraints. SQL queries use parameterized values. The rental list uses basic SQL joins to retrieve related photographer and camera details.

## 5. API endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check whether the server is running |
| GET | `/api/photographers` | Get all photographers |
| POST | `/api/photographers` | Add a photographer |
| GET | `/api/cameras` | Get all cameras |
| GET | `/api/cameras?kind=DSLR` | Filter cameras by kind |
| GET | `/api/cameras/:cameraId` | Get one camera |
| POST | `/api/cameras` | Add a camera |
| PUT | `/api/cameras/:cameraId` | Update a camera |
| DELETE | `/api/cameras/:cameraId` | Delete a camera |
| GET | `/api/rentals` | Get rentals with related photographer and camera details |
| POST | `/api/rentals` | Create a rental |

## 6. Example request bodies

**Add a photographer — POST `/api/photographers`**

```json
{
  "name": "Asha Rao",
  "email": "asha@example.com",
  "phone": "9876543210"
}
```

**Add a camera — POST `/api/cameras`**

```json
{
  "name": "Canon EOS 90D",
  "kind": "DSLR"
}
```

The API generates the camera code when a camera is added.

**Create a rental — POST `/api/rentals`**

```json
{
  "photographerId": 1,
  "cameraId": 1,
  "rentalDate": "2026-11-20",
  "returnDate": "2026-11-21"
}
```

## 7. HTTP status codes

- `200 OK` — request completed successfully
- `201 Created` — a record was created
- `400 Bad Request` — request data is missing or invalid
- `404 Not Found` — requested record or route was not found
- `409 Conflict` — a constraint or rental conflict prevents the operation
- `500 Internal Server Error` — an unexpected server or database error occurred

## 8. Postman testing

1. Start the server using `npm start`.
2. Open Postman and select **Import**.
3. Import `postman/LensLab.postman_collection.json`.
4. Use `http://localhost:3000` as the `baseUrl`.
5. Run the requests to test adding, retrieving, updating and deleting records, filtering cameras, and creating rentals.

The file `postman/manual-requests.http` contains equivalent sample requests for use with a compatible VS Code extension.

## 9. Syllabus topics used

**Module 1 — Node.js and Express.js Fundamentals**
- Backend development with Node.js
- npm and package management
- HTTP server setup
- HTTP methods and status codes
- Handling HTTP requests and responses
- Express.js setup
- Routing and modular routing
- Request and response objects
- Basic error handling

**Module 2 — SQLite and Relational Database Operations**
- SQLite database creation and integration
- Database tables and schema
- Primary keys and constraints
- SQL queries
- Parameterized queries
- Basic joins
- CRUD operations
- Integrating SQLite with Node.js

**Module 3 — RESTful API Development and Validation**
- REST principles and REST API endpoints
- HTTP methods
- Request parameters and query parameters
- JSON request and response handling
- Request validation
- Response formatting and HTTP status codes
- API testing and debugging with Postman

Module 4 is not implemented because it is not required for this project.

## 10. Project structure

```text
LensLab_Studio/
|-- database/
|   `-- db.js
|-- routes/
|   |-- cameras.js
|   |-- photographers.js
|   `-- rentals.js
|-- scripts/
|   `-- reset-db.js
|-- postman/
|   |-- LensLab.postman_collection.json
|   `-- manual-requests.http
|-- server.js
|-- package.json
|-- package-lock.json
|-- .env.example
|-- .gitignore
`-- README.md
```

The `database/lenslab.db` file is created automatically when the application starts and is not required in the ZIP.

## 11. Troubleshooting

- **`Cannot find package.json`:** make sure the terminal is inside the `LensLab_Studio` folder.
- **`Cannot find module`:** run `npm install` inside the project folder.
- **Port 3000 is already in use:** stop the other server using that port or set another `PORT` value.
- **Need a fresh database:** stop the server, run `npm run reset-db`, and start the server again.
