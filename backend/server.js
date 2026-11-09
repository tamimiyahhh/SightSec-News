require("dotenv").config();
const express = require("express");
const cors = require("cors");

const newsRoutes = require("./routes/news");
const favoritesRoutes = require("./routes/favorites");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    newsProviderConfigured: Boolean(process.env.GNEWS_API_KEY),
    newsProvider: "GNews",
    database: process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY ? "supabase" : "not-configured",
  });
});

app.use("/api/news", newsRoutes);
app.use("/api/favorites", favoritesRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  if (!process.env.GNEWS_API_KEY) {
    console.warn("WARNING: GNEWS_API_KEY is not set. Copy .env.example to .env");
  }
});
