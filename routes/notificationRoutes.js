const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
    getNotifications,
    markRead,
    markAllRead
} = require("../controllers/NotificationController");


// ✅ EXISTING ROUTES
router.get("/notifications", auth, getNotifications);
router.put("/notification/:id/read", auth, markRead);
router.put("/notifications/read-all", auth, markAllRead);


// ✅ NEW ROUTE: SEND LOGIN ALERT EMAIL (disabled)
router.post("/send-login-alert", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  res.json({ message: "Login alert email skipped (mailer disabled)." });
});

module.exports = router;
