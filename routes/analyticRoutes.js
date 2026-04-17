const express = require("express");
const router = express.Router();
 
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { getUserAnalytics, getGlobalAnalytics } = require("../controllers/AnalyticsController");
 
// Per-user stats — any logged-in user
router.get("/analytics/me", auth, getUserAnalytics);
 
// Global stats — admin only (auth runs first, then adminOnly)
router.get("/analytics/global", auth, adminOnly, getGlobalAnalytics);
 
module.exports = router;