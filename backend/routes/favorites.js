const express = require("express");
const store = require("../services/favoritesStore");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

// READ
router.get("/", async (req, res, next) => {
  try {
    res.json(await store.list(req.auth.userId, req.auth.accessToken));
  } catch (e) {
    next(e);
  }
});

// CREATE
router.post("/", async (req, res, next) => {
  try {
    const { title, url, source, image, published_at } = req.body || {};
    if (!title || !url) {
      return res.status(400).json({ error: "title and url are required" });
    }
    const saved = await store.add(
      { title, url, source, image, published_at },
      req.auth.userId,
      req.auth.accessToken
    );
    res.status(201).json(saved);
  } catch (e) {
    next(e);
  }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    await store.remove(req.params.id, req.auth.userId, req.auth.accessToken);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
