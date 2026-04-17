const express = require("express");
const router = express.Router();

router.post("/send-login-alert", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  res.status(200).json({ message: "Login alert email skipped (mailer disabled)." });
});

module.exports = router;
