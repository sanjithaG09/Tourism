const express = require("express");
const router = express.Router();
const { optimizeRoute } = require("../controllers/routeController");

// POST /api/route/optimize - Optimize travel route using TSP algorithm
router.post("/route/optimize", optimizeRoute);

module.exports = router;