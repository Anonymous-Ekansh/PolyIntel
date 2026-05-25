const express = require("express");
const cors = require("cors");
require("dotenv").config();

const marketsRouter = require("./routes/markets");
const analyzeRouter = require("./routes/analyze");
const newsRouter = require("./routes/news");
const intelligenceRouter = require("./routes/intelligence");

const anomalyService = require("./services/anomaly");
const correlationService = require("./services/correlation");
const cacheService = require("./services/cache");

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Mounts
app.use("/api/markets", marketsRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/news", newsRouter);
app.use("/api/intelligence", intelligenceRouter);

// GET /health
app.get("/health", (req, res) => {
  const stats = cacheService.cache.getStats();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    cacheStats: {
      keys: cacheService.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      kbytes: stats.kbytes,
    },
    marketsLoaded: cacheService.cache.has("markets_list:100:0"),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server & Background Services
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`   POLYINTEL BACKEND SERVER RUNNING ON PORT ${PORT}`);
  console.log(`==================================================`);

  // Start the background jobs
  anomalyService.startAnomalyDetector();
  correlationService.startCorrelationAnalyzer();
});
