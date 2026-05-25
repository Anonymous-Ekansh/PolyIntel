const express = require("express");
const router = express.Router();
const anomalyService = require("../services/anomaly");
const correlationService = require("../services/correlation");

// GET /api/intelligence/anomalies
router.get("/anomalies", (req, res) => {
  try {
    const list = anomalyService.getAnomalies();
    res.json(list);
  } catch (error) {
    console.error(`[Routes Intelligence] Anomalies failed: ${error.message}`);
    res.status(500).json({ error: "Failed to retrieve anomaly signals" });
  }
});

// GET /api/intelligence/correlations
router.get("/correlations", (req, res) => {
  try {
    const list = correlationService.getCorrelations();
    res.json(list);
  } catch (error) {
    console.error(`[Routes Intelligence] Correlations failed: ${error.message}`);
    res.status(500).json({ error: "Failed to retrieve cross-market correlations" });
  }
});

// GET /api/intelligence/divergences
router.get("/divergences", (req, res) => {
  try {
    const list = correlationService.getDivergences();
    res.json(list);
  } catch (error) {
    console.error(`[Routes Intelligence] Divergences failed: ${error.message}`);
    res.status(500).json({ error: "Failed to retrieve active divergence signals" });
  }
});

// GET /api/intelligence/related/:conditionId
router.get("/related/:conditionId", (req, res) => {
  const { conditionId } = req.params;
  try {
    const list = correlationService.findRelatedMarkets(conditionId);
    res.json(list);
  } catch (error) {
    console.error(`[Routes Intelligence] Related failed for ${conditionId}: ${error.message}`);
    res.status(500).json({ error: "Failed to retrieve related correlated markets" });
  }
});

module.exports = router;
