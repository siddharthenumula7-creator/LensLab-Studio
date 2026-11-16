const express = require("express");
const path = require("path");
const { initializeDatabase } = require("./database/db");

const cameraRoutes = require("./routes/cameras");
const photographerRoutes = require("./routes/photographers");
const rentalRoutes = require("./routes/rentals");

const app = express();
const PORT = process.env.PORT || 3000;

// Read JSON request bodies sent by Postman or another client.
app.use(express.json());

// A small health route helps us check whether the server is running.
app.get("/", (request, response) => {
  response.status(200).json({
    message: "Welcome to LensLab Studio API",
    endpoints: ["/api/photographers", "/api/cameras", "/api/rentals"]
  });
});

app.use("/api/photographers", photographerRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/rentals", rentalRoutes);

// Return a clear message when a route does not exist.
app.use((request, response) => {
  response.status(404).json({ error: "Route not found" });
});

async function startServer() {
  try {
    const db = await initializeDatabase();
    app.locals.db = db;

    app.listen(PORT, () => {
      console.log(`LensLab Studio API is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not start the server:", error.message);
    process.exit(1);
  }
}

startServer();
