const express = require("express");
const router = express.Router();

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

// GET all cameras. ?kind=DSLR can be used to filter by camera kind.
router.get("/", async (request, response) => {
  const db = request.app.locals.db;
  const { kind } = request.query;

  try {
    let cameras;
    if (kind) {
      cameras = await db.all(
        "SELECT id, code, name, kind, created_at FROM cameras WHERE LOWER(kind) = LOWER(?) ORDER BY id",
        [kind]
      );
    } else {
      cameras = await db.all(
        "SELECT id, code, name, kind, created_at FROM cameras ORDER BY id"
      );
    }
    response.status(200).json(cameras);
  } catch (error) {
    response.status(500).json({ error: "Unable to retrieve cameras" });
  }
});

// GET one camera by its database ID.
router.get("/:cameraId", async (request, response) => {
  const db = request.app.locals.db;
  const { cameraId } = request.params;

  if (!isPositiveInteger(cameraId)) {
    return response.status(400).json({ error: "cameraId must be a positive integer" });
  }

  try {
    const camera = await db.get(
      "SELECT id, code, name, kind, created_at FROM cameras WHERE id = ?",
      [cameraId]
    );
    if (!camera) {
      return response.status(404).json({ error: "Camera not found" });
    }
    response.status(200).json(camera);
  } catch (error) {
    response.status(500).json({ error: "Unable to retrieve camera" });
  }
});

// POST a camera. The client is not allowed to choose its code.
router.post("/", async (request, response) => {
  const db = request.app.locals.db;
  const { name, kind } = request.body;

  if (typeof name !== "string" || !name.trim() ||
      typeof kind !== "string" || !kind.trim()) {
    return response.status(400).json({
      error: "Both name and kind are required and must be non-empty strings"
    });
  }

  try {
    const result = await db.run(
      "INSERT INTO cameras (name, kind) VALUES (?, ?)",
      [name.trim(), kind.trim()]
    );

    const cameraCode = `CAM-${String(result.lastID).padStart(4, "0")}`;
    await db.run(
      "UPDATE cameras SET code = ? WHERE id = ?",
      [cameraCode, result.lastID]
    );

    const newCamera = await db.get(
      "SELECT id, code, name, kind, created_at FROM cameras WHERE id = ?",
      [result.lastID]
    );

    response.status(201).json(newCamera);
  } catch (error) {
    response.status(500).json({ error: "Unable to add camera" });
  }
});

// PUT updates camera details. Any code in the request body is ignored.
router.put("/:cameraId", async (request, response) => {
  const db = request.app.locals.db;
  const { cameraId } = request.params;
  const { name, kind } = request.body;

  if (!isPositiveInteger(cameraId)) {
    return response.status(400).json({ error: "cameraId must be a positive integer" });
  }
  if (typeof name !== "string" || !name.trim() ||
      typeof kind !== "string" || !kind.trim()) {
    return response.status(400).json({
      error: "Both name and kind are required and must be non-empty strings"
    });
  }

  try {
    const existingCamera = await db.get(
      "SELECT id FROM cameras WHERE id = ?",
      [cameraId]
    );
    if (!existingCamera) {
      return response.status(404).json({ error: "Camera not found" });
    }

    // Notice that code is not included in this UPDATE statement.
    await db.run(
      "UPDATE cameras SET name = ?, kind = ? WHERE id = ?",
      [name.trim(), kind.trim(), cameraId]
    );

    const updatedCamera = await db.get(
      "SELECT id, code, name, kind, created_at FROM cameras WHERE id = ?",
      [cameraId]
    );
    response.status(200).json(updatedCamera);
  } catch (error) {
    response.status(500).json({ error: "Unable to update camera" });
  }
});

// DELETE a camera. A camera used in a rental cannot be deleted.
router.delete("/:cameraId", async (request, response) => {
  const db = request.app.locals.db;
  const { cameraId } = request.params;

  if (!isPositiveInteger(cameraId)) {
    return response.status(400).json({ error: "cameraId must be a positive integer" });
  }

  try {
    const existingCamera = await db.get(
      "SELECT id FROM cameras WHERE id = ?",
      [cameraId]
    );
    if (!existingCamera) {
      return response.status(404).json({ error: "Camera not found" });
    }

    await db.run("DELETE FROM cameras WHERE id = ?", [cameraId]);
    response.status(200).json({ message: "Camera deleted successfully" });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return response.status(409).json({
        error: "This camera is linked to a rental and cannot be deleted"
      });
    }
    response.status(500).json({ error: "Unable to delete camera" });
  }
});

module.exports = router;
