
const express = require("express");
const router = express.Router();

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

router.get("/", async (request, response) => {
  const db = request.app.locals.db;

  try {
    const photographers = await db.all(
      "SELECT id, name, email, phone, created_at FROM photographers ORDER BY id"
    );

    response.status(200).json(photographers);
  } catch (error) {
    response.status(500).json({ error: "Unable to retrieve photographers" });
  }
});

router.get("/:photographerId", async (request, response) => {
  const db = request.app.locals.db;
  const { photographerId } = request.params;

  if (!isPositiveInteger(photographerId)) {
    return response.status(400).json({ error: "Invalid photographer ID" });
  }

  try {
    const photographer = await db.get(
      "SELECT id, name, email, phone, created_at FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );

    if (!photographer) {
      return response.status(404).json({ error: "Photographer not found" });
    }

    response.status(200).json(photographer);
  } catch (error) {
    response.status(500).json({ error: "Unable to retrieve photographer" });
  }
});

router.post("/", async (request, response) => {
  const db = request.app.locals.db;
  const { name, email, phone } = request.body || {};

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim()
  ) {
    return response.status(400).json({
      error: "Both name and email are required"
    });
  }

  try {
    const result = await db.run(
      "INSERT INTO photographers (name, email, phone) VALUES (?, ?, ?)",
      [name.trim(), email.trim(), phone ? String(phone).trim() : null]
    );

    const photographer = await db.get(
      "SELECT id, name, email, phone, created_at FROM photographers WHERE id = ?",
      [result.lastID]
    );

    response.status(201).json(photographer);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return response.status(409).json({
        error: "A photographer with this email already exists"
      });
    }

    response.status(500).json({ error: "Unable to add photographer" });
  }
});

// PUT - Update a photographer.
router.put("/:photographerId", async (request, response) => {
  const db = request.app.locals.db;
  const { photographerId } = request.params;
  const { name, email, phone } = request.body || {};

  if (!isPositiveInteger(photographerId)) {
    return response.status(400).json({ error: "Invalid photographer ID" });
  }

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim()
  ) {
    return response.status(400).json({
      error: "Both name and email are required"
    });
  }

  try {
    const existing = await db.get(
      "SELECT id FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );

    if (!existing) {
      return response.status(404).json({ error: "Photographer not found" });
    }

    await db.run(
      "UPDATE photographers SET name = ?, email = ?, phone = ? WHERE id = ?",
      [name.trim(), email.trim(), phone ? String(phone).trim() : null,
        Number(photographerId)]
    );

    const updated = await db.get(
      "SELECT id, name, email, phone, created_at FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );

    response.status(200).json(updated);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return response.status(409).json({
        error: "A photographer with this email already exists"
      });
    }

    response.status(500).json({ error: "Unable to update photographer" });
  }
});

// DELETE a photographer.
router.delete("/:photographerId", async (request, response) => {
  const db = request.app.locals.db;
  const { photographerId } = request.params;

  if (!isPositiveInteger(photographerId)) {
    return response.status(400).json({ error: "Invalid photographer ID" });
  }

  try {
    const existing = await db.get(
      "SELECT id FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );

    if (!existing) {
      return response.status(404).json({ error: "Photographer not found" });
    }

    await db.run(
      "DELETE FROM photographers WHERE id = ?",
      [Number(photographerId)]
    );

    response.status(200).json({
      message: "Photographer deleted successfully"
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return response.status(409).json({
        error: "This photographer is linked to a rental and cannot be deleted"
      });
    }

    response.status(500).json({ error: "Unable to delete photographer" });
  }
});

module.exports = router;
