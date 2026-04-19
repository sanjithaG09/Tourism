const express = require("express");
const router = express.Router();
 
const auth = require("../middleware/auth");
const { getUserAnalytics } = require("../controllers/AnalyticsController");

// Per-user stats — any logged-in user
router.get("/analytics/me", auth, getUserAnalytics);
 
module.exports = router;