const express = require("express");
const router = express.Router();

// GET all photographers.
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

// POST a photographer so that a rental can refer to a real photographer.
router.post("/", async (request, response) => {
  const db = request.app.locals.db;
  const { name, email, phone } = request.body;

  if (typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.trim()) {
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
      return response.status(409).json({ error: "A photographer with this email already exists" });
    }
    response.status(500).json({ error: "Unable to add photographer" });
  }
});

module.exports = router;
