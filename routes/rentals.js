
const express = require("express");
const router = express.Router();

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

// Check rental and return dates.
function isValidRentalDates(rentalDate, returnDate) {
  if (!isValidDate(rentalDate)) {
    return false;
  }

  if (returnDate && (!isValidDate(returnDate) || returnDate < rentalDate)) {
    return false;
  }

  return true;
}

// SQL JOIN query to get rental details.
const rentalQuery = `
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
`;

router.get("/", async (request, response) => {
  const db = request.app.locals.db;

  try {
    const rentals = await db.all(
      rentalQuery + " ORDER BY rentals.id"
    );

    response.status(200).json(rentals);
  } catch (error) {
    response.status(500).json({
      error: "Unable to retrieve rentals"
    });
  }
});


router.get("/:rentalId", async (request, response) => {
  const db = request.app.locals.db;
  const { rentalId } = request.params;

  if (!isPositiveInteger(rentalId)) {
    return response.status(400).json({
      error: "Invalid rental ID"
    });
  }

  try {
    const rental = await db.get(
      rentalQuery + " WHERE rentals.id = ?",
      [Number(rentalId)]
    );

    if (!rental) {
      return response.status(404).json({
        error: "Rental not found"
      });
    }

    response.status(200).json(rental);
  } catch (error) {
    response.status(500).json({
      error: "Unable to retrieve rental"
    });
  }
});

router.post("/", async (request, response) => {
  const db = request.app.locals.db;

  const {
    photographerId,
    cameraId,
    rentalDate,
    returnDate
  } = request.body || {};

  if (
    !isPositiveInteger(photographerId) ||
    !isPositiveInteger(cameraId) ||
    !isValidRentalDates(rentalDate, returnDate)
  ) {
    return response.status(400).json({
      error: "Valid photographerId, cameraId and rentalDate are required. Dates must use YYYY-MM-DD."
    });
  }

  try {
    // Check whether the photographer exists.
    const photographer = await db.get(
      "SELECT id FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );

    if (!photographer) {
      return response.status(404).json({
        error: "Photographer not found"
      });
    }

    // Check whether the camera exists.
    const camera = await db.get(
      "SELECT id FROM cameras WHERE id = ?",
      [Number(cameraId)]
    );

    if (!camera) {
      return response.status(404).json({
        error: "Camera not found"
      });
    }

    const existingRental = await db.get(
      `SELECT id FROM rentals
       WHERE camera_id = ? AND rental_date = ?`,
      [Number(cameraId), rentalDate]
    );

    if (existingRental) {
      return response.status(409).json({
        error: "This camera is already rented for that date"
      });
    }

    const result = await db.run(
      `INSERT INTO rentals
       (photographer_id, camera_id, rental_date, return_date)
       VALUES (?, ?, ?, ?)`,
      [
        Number(photographerId),
        Number(cameraId),
        rentalDate,
        returnDate || null
      ]
    );

    const newRental = await db.get(
      rentalQuery + " WHERE rentals.id = ?",
      [result.lastID]
    );

    response.status(201).json(newRental);

  } catch (error) {
    response.status(500).json({
      error: "Unable to create rental"
    });
  }
});

// 4. PUT - Update a rental by ID.
router.put("/:rentalId", async (request, response) => {
  const db = request.app.locals.db;
  const { rentalId } = request.params;

  const {
    photographerId,
    cameraId,
    rentalDate,
    returnDate
  } = request.body || {};

  if (!isPositiveInteger(rentalId)) {
    return response.status(400).json({
      error: "Invalid rental ID"
    });
  }

  if (
    !isPositiveInteger(photographerId) ||
    !isPositiveInteger(cameraId) ||
    !isValidRentalDates(rentalDate, returnDate)
  ) {
    return response.status(400).json({
      error: "Valid photographerId, cameraId and rentalDate are required. Dates must use YYYY-MM-DD."
    });
  }

  try {
    // Check whether the rental exists.
    const rental = await db.get(
      "SELECT id FROM rentals WHERE id = ?",
      [Number(rentalId)]
    );

    if (!rental) {
      return response.status(404).json({
        error: "Rental not found"
      });
    }

    // Check whether the photographer exists.
    const photographer = await db.get(
      "SELECT id FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );

    if (!photographer) {
      return response.status(404).json({
        error: "Photographer not found"
      });
    }

    const camera = await db.get(
      "SELECT id FROM cameras WHERE id = ?",
      [Number(cameraId)]
    );

    if (!camera) {
      return response.status(404).json({
        error: "Camera not found"
      });
    }

    // Check for duplicate booking, excluding the current rental.
    const existingRental = await db.get(
      `SELECT id FROM rentals
       WHERE camera_id = ?
       AND rental_date = ?
       AND id != ?`,
      [Number(cameraId), rentalDate, Number(rentalId)]
    );

    if (existingRental) {
      return response.status(409).json({
        error: "This camera is already rented for that date"
      });
    }

    // Update the rental.
    await db.run(
      `UPDATE rentals
       SET photographer_id = ?,
           camera_id = ?,
           rental_date = ?,
           return_date = ?
       WHERE id = ?`,
      [
        Number(photographerId),
        Number(cameraId),
        rentalDate,
        returnDate || null,
        Number(rentalId)
      ]
    );

    const updatedRental = await db.get(
      rentalQuery + " WHERE rentals.id = ?",
      [Number(rentalId)]
    );

    response.status(200).json(updatedRental);

  } catch (error) {
    response.status(500).json({
      error: "Unable to update rental"
    });
  }
});

// 5. DELETE a rental by ID.
router.delete("/:rentalId", async (request, response) => {
  const db = request.app.locals.db;
  const { rentalId } = request.params;

  if (!isPositiveInteger(rentalId)) {
    return response.status(400).json({
      error: "Invalid rental ID"
    });
  }

  try {
    const rental = await db.get(
      "SELECT id FROM rentals WHERE id = ?",
      [Number(rentalId)]
    );

    if (!rental) {
      return response.status(404).json({
        error: "Rental not found"
      });
    }

    await db.run(
      "DELETE FROM rentals WHERE id = ?",
      [Number(rentalId)]
    );

    response.status(200).json({
      message: "Rental deleted successfully"
    });

  } catch (error) {
    response.status(500).json({
      error: "Unable to delete rental"
    });
  }
});

module.exports = router;
