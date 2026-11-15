const express = require("express");
const router = express.Router();

// GET rentals with the photographer name and camera name (SQL JOIN).
router.get("/", async (request, response) => {
  const db = request.app.locals.db;
  try {
    const rentals = await db.all(`
      SELECT
        rentals.id,
        rentals.rental_date,
        rentals.return_date,
        photographers.name AS photographer_name,
        cameras.name AS camera_name,
        cameras.code AS camera_code,
        cameras.kind AS camera_kind
      FROM rentals
      INNER JOIN photographers
        ON rentals.photographer_id = photographers.id
      INNER JOIN cameras
        ON rentals.camera_id = cameras.id
      ORDER BY rentals.id
    `);
    response.status(200).json(rentals);
  } catch (error) {
    response.status(500).json({ error: "Unable to retrieve rentals" });
  }
});

// POST a rental. The same camera cannot be booked twice for the same date.
router.post("/", async (request, response) => {
  const db = request.app.locals.db;
  const { photographerId, cameraId, rentalDate, returnDate } = request.body;

  if (!Number.isInteger(Number(photographerId)) || Number(photographerId) <= 0 ||
      !Number.isInteger(Number(cameraId)) || Number(cameraId) <= 0 ||
      typeof rentalDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rentalDate)) {
    return response.status(400).json({
      error: "photographerId, cameraId and rentalDate (YYYY-MM-DD) are required"
    });
  }

  if (returnDate && (typeof returnDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(returnDate) || returnDate < rentalDate)) {
    return response.status(400).json({
      error: "returnDate must use YYYY-MM-DD and cannot be before rentalDate"
    });
  }

  try {
    const photographer = await db.get(
      "SELECT id FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );
    if (!photographer) {
      return response.status(404).json({ error: "Photographer not found" });
    }

    const camera = await db.get(
      "SELECT id FROM cameras WHERE id = ?",
      [Number(cameraId)]
    );
    if (!camera) {
      return response.status(404).json({ error: "Camera not found" });
    }

    const existingRental = await db.get(
      "SELECT id FROM rentals WHERE camera_id = ? AND rental_date = ?",
      [Number(cameraId), rentalDate]
    );
    if (existingRental) {
      return response.status(409).json({
        error: "This camera is already rented for that date"
      });
    }

    const result = await db.run(
      "INSERT INTO rentals (photographer_id, camera_id, rental_date, return_date) VALUES (?, ?, ?, ?)",
      [Number(photographerId), Number(cameraId), rentalDate, returnDate || null]
    );

    response.status(201).json({
      id: result.lastID,
      photographerId: Number(photographerId),
      cameraId: Number(cameraId),
      rentalDate,
      returnDate: returnDate || null,
      message: "Rental created successfully"
    });
  } catch (error) {
    response.status(500).json({ error: "Unable to create rental" });
  }
});

module.exports = router;
