require("dotenv").config();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendWelcomeEmail, sendLoginEmail, sendOtpEmail } = require("../services/emailService");
const { sendResetPasswordEmail } = require("../services/emailService");

const SECRET = process.env.JWT_SECRET;

// ── OTP helper ────────────────────────────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── REGISTER — saves user, sends OTP, waits for verification ─────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: "Email already registered" });
      }
      // Unverified user — resend OTP
      const otp = generateOtp();
      existingUser.name = name;
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      existingUser.otp = otp;
      existingUser.otpExpiry = Date.now() + 10 * 60 * 1000;
      await existingUser.save();
      await sendOtpEmail(name, email, otp, "signup");
      return res.json({ message: "OTP resent to your email. Please verify.", requiresOtp: true });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
    await user.save();

    await sendOtpEmail(name, email, otp, "signup");

    res.json({ message: "OTP sent to your email. Please verify.", requiresOtp: true });
  } catch (err) {
    console.error("[REGISTER ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── VERIFY SIGNUP OTP — marks email verified and issues JWT ──────────────────
exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: "Email and OTP are required" });

    const user = await User.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
    if (!user)
      return res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastActiveAt = new Date();
    await user.save();

    // Welcome email now that the email is confirmed
    sendWelcomeEmail(user.name, user.email);

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });
    res.json({ token, name: user.name, message: "Email verified successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── LOGIN — validates credentials, issues JWT directly (no OTP) ──────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // If somehow unverified but password is correct, just mark them verified
    if (!user.isVerified) user.isVerified = true;
    user.lastActiveAt = new Date();
    await user.save();

    // Send "hello, successfully logged in" notification email
    sendLoginEmail(user.name, user.email);

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });
    res.json({ token, name: user.name });
  } catch (err) {
    console.error("[LOGIN ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── VERIFY LOGIN OTP — issues JWT ────────────────────────────────────────────
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: "Email and OTP are required" });

    const user = await User.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
    if (!user)
      return res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastActiveAt = new Date();
    await user.save();

    // Login notification email
    sendLoginEmail(user.name, user.email);

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });
    res.json({ token, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── RESEND OTP ────────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
  try {
    const { email, context } = req.body; // context: "signup" | "login" | "forgot"
    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (context === "signup" && user.isVerified)
      return res.status(400).json({ error: "Email already verified" });

    if (context === "login" && !user.isVerified)
      return res.status(403).json({ error: "Email not verified. Please complete signup first." });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOtpEmail(user.name, email, otp, context);
    res.json({ message: "OTP resent to your email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── SEND LOGIN SECURITY ALERT EMAIL ──────────────────────────────────────────
exports.sendLoginAlert = async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    res.json({ success: true, message: "Login alert email skipped (mailer disabled)." });
  } catch (err) {
    console.error("Login alert error:", err);
    res.status(500).json({ error: "Failed to send alert" });
  }
};

// ── FORGOT PASSWORD — sends OTP, user enters it to log in ────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "No account found with this email." });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendOtpEmail(user.name, user.email, otp, "forgot");

    res.json({ success: true, message: "OTP sent to your email.", requiresOtp: true });
  } catch (err) {
    console.error("[FORGOT PASSWORD ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── VERIFY FORGOT OTP — returns a short-lived reset token for password change ──
exports.verifyForgotOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const user = await User.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });

    user.otp = undefined;
    user.otpExpiry = undefined;

    // Issue a short-lived reset token so the frontend can show the new-password form
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    res.json({ verified: true, resetToken, email });
  } catch (err) {
    console.error("[VERIFY FORGOT OTP ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired reset link." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
};

// ── CHANGE PASSWORD (logged-in users) ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Current password is incorrect" });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};

