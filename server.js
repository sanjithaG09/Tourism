require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { startNotificationJob, runReminderJob } = require("./jobs/notificationJob");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(morgan("dev"));

app.use(cors({
  origin: "http://localhost:5173", // 👈 FIXED (important)
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ DB connection
connectDB();

// ✅ Jobs
startNotificationJob();

// ✅ Routes
const authRoutes         = require("./routes/authRoutes");
const tripRoutes         = require("./routes/tripRoutes");
const placeRoutes        = require("./routes/placeRoutes");
const routeRoutes        = require("./routes/routeRoutes");
const analyticsRoutes    = require("./routes/analyticRoutes");
const alertRoutes        = require("./routes/alertRoutes");
const sosRoutes          = require("./routes/sosRoutes");

// ✅ Mount routes (correct)
app.use("/api", placeRoutes);
app.use("/api", authRoutes);
app.use("/api", tripRoutes);
app.use("/api", routeRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", alertRoutes);
app.use("/api", sosRoutes);

// ✅ Health check route (VERY useful)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Velora backend running 🚀" });
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Velora backend is live 🚀");
});

// ── Manual trip reminder trigger (for testing) ───────────────
app.get("/api/trigger-reminders", async (req, res) => {
  try {
    const count = await runReminderJob();
    res.json({ success: true, emailsSent: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Email test route ─────────────────────────────────────────
app.get("/api/test-email", async (req, res) => {
  const nodemailer = require("nodemailer");

  const to   = req.query.to;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  console.log("[TEST-EMAIL] Sending to:", to);

  if (!user || !pass) {
    return res.status(500).json({ error: "GMAIL_USER or GMAIL_PASS missing" });
  }

  if (!to) {
    return res.status(400).json({ error: "Use ?to=your@email.com" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // 👈 FIXED (cleaner)
      auth: { user, pass },
    });

    await transporter.verify();
    console.log("[TEST-EMAIL] SMTP verified ✅");

    const info = await transporter.sendMail({
      from: `"Velora" <${user}>`,
      to,
      subject: "Velora test email",
      text: "If you see this, Gmail SMTP is working!",
    });

    console.log("[TEST-EMAIL] Sent:", info.messageId);

    res.json({ success: true, messageId: info.messageId });

  } catch (err) {
    console.error("[TEST-EMAIL] ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ❌ Catch unknown routes (VERY IMPORTANT)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});