const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  register,
  login,
  verifySignupOtp,
  verifyLoginOtp,
  resendOtp,
  sendLoginAlert,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

// ── AUTH ROUTES ─────────────────────────────────────────

// Signup
router.post("/register", register);        // primary route
// router.post("/signup", register);       // ❌ optional (remove to avoid confusion)

// Login
router.post("/login", login);

// OTP Verification
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/verify-login-otp", verifyLoginOtp);

// OTP resend
router.post("/resend-otp", resendOtp);

// Login alert
router.post("/send-login-alert", sendLoginAlert);

// Password reset
router.post("/forgot-password",      forgotPassword);
router.post("/verify-forgot-otp",    verifyForgotOtp);
router.post("/reset-password",       resetPassword);

// Change password (protected)
router.post("/change-password", auth, changePassword);

// Token check (protected)
router.get("/verify-token", auth, (req, res) => {
  res.json({ valid: true, userId: req.userId });
});

// Debug log
console.log("✅ Auth routes loaded");

module.exports = router;