const nodemailer = require("nodemailer");

// ── Gmail SMTP transporter ────────────────────────────────────────────────────
function createTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;
    if (!user || !pass) return null;
    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
}

// ── Shared HTML wrapper ───────────────────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#111117;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0800,#0d0d0d);padding:32px 36px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
      <div style="display:inline-block;background:#e8341a;border-radius:12px;padding:10px 16px;font-size:24px;margin-bottom:12px;">✈️</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Velora</h1>
      <p style="color:rgba(255,255,255,0.4);margin:4px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Your Travel Companion</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px;">
      ${body}
    </div>

    <!-- Footer -->
    <div style="padding:20px 36px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">
        © 2025 Velora. All rights reserved.<br/>
        You're receiving this because you have an account on Velora.
      </p>
    </div>

  </div>
</body>
</html>
`;

// ── Helper: format date nicely ────────────────────────────────────────────────
function fmtDate(d) {
    return new Date(d).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
}

// ── Send helper ───────────────────────────────────────────────────────────────
async function send(to, subject, html) {
    const transporter = createTransporter();
    if (!transporter) {
        console.log(`[EMAIL SKIPPED] GMAIL_USER or GMAIL_PASS not set. To: ${to} | Subject: ${subject}`);
        return;
    }
    console.log(`[EMAIL] Attempting to send to: ${to} | Subject: ${subject}`);
    await transporter.sendMail({
        from: `"Velora" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });
    console.log(`[EMAIL SENT] To: ${to}`);
}

// ── 0. OTP email (signup / login verification) ────────────────────────────────
exports.sendOtpEmail = (name, email, otp, context) => {
    const isSignup = context === "signup";
    const isForgot = context === "forgot";
    const title    = isSignup ? "Verify your email" : isForgot ? "Access your account" : "Your sign-in OTP";
    const desc     = isSignup
        ? `Welcome to Velora, <strong style="color:#fff;">${name}</strong>! Use the code below to verify your email address.`
        : isForgot
        ? `Hi <strong style="color:#fff;">${name}</strong>, use this code to access your account. No password needed — it expires in 10 minutes.`
        : `Hi <strong style="color:#fff;">${name}</strong>, use this code to complete your sign-in. It expires in 10 minutes.`;

    return send(
        email,
        `${isSignup ? "✉️ Verify your Velora account" : "🔐 Your Velora sign-in code"} — ${otp}`,
        wrap(`
          <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">${title}</h2>
          <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 28px;">
            ${desc}
          </p>

          <!-- OTP box -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:rgba(232,52,26,0.1);border:2px solid rgba(232,52,26,0.35);border-radius:16px;padding:22px 40px;">
              <p style="color:rgba(255,255,255,0.45);font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 10px;">One-Time Password</p>
              <p style="color:#fff;font-size:38px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace;">${otp}</p>
            </div>
          </div>

          <p style="color:rgba(255,255,255,0.45);font-size:13px;line-height:1.7;margin:0 0 20px;text-align:center;">
            ⏱ This code is valid for <strong style="color:rgba(255,255,255,0.7);">10 minutes</strong>.<br/>
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color:rgba(255,255,255,0.3);font-size:13px;margin:0;text-align:center;">
            The Velora Team
          </p>
        `)
    );
};

// ── 1. Welcome email (sign up) ────────────────────────────────────────────────
exports.sendWelcomeEmail = (name, email) => send(
    email,
    "Welcome to Velora! 🌍",
    wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Welcome aboard, ${name}! 🎉</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 24px;">
        Your Velora account is ready. Start exploring destinations, planning optimized routes, and saving your trips — all in one place.
      </p>
      <div style="background:rgba(232,52,26,0.08);border:1px solid rgba(232,52,26,0.2);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;line-height:1.6;">
          🗺️ <strong style="color:#fff;">Explore cities</strong> — Discover top attractions<br/>
          📍 <strong style="color:#fff;">Optimize routes</strong> — Travel smarter, not harder<br/>
          💾 <strong style="color:#fff;">Save trips</strong> — Access your plans anytime
        </p>
      </div>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">
        Happy travels,<br/><strong style="color:rgba(255,255,255,0.7);">The Velora Team</strong>
      </p>
    `)
);

// ── 2. Login notification ─────────────────────────────────────────────────────
exports.sendLoginEmail = (name, email) => send(
    email,
    "New sign-in to your Velora account",
    wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">New sign-in detected 🔐</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hi <strong style="color:#fff;">${name}</strong>, we noticed a new sign-in to your Velora account just now.
      </p>
      <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.65);font-size:14px;margin:0;line-height:1.6;">
          🕐 <strong style="color:#fff;">Time:</strong> ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}<br/>
          📧 <strong style="color:#fff;">Account:</strong> ${email}
        </p>
      </div>
      <p style="color:rgba(255,255,255,0.55);font-size:13px;line-height:1.6;margin:0 0 20px;">
        If this was you, no action is needed. If you didn't sign in, please change your password immediately.
      </p>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">
        Stay safe,<br/><strong style="color:rgba(255,255,255,0.7);">The Velora Team</strong>
      </p>
    `)
);

// ── 3. Trip confirmation (when a trip is saved) ───────────────────────────────
exports.sendTripConfirmationEmail = (name, email, city, date, places) => {
    const dateStr   = date ? fmtDate(date) : "Date not set";
    const placeList = Array.isArray(places) && places.length
        ? places.map(p => `<li style="color:rgba(255,255,255,0.7);font-size:14px;margin:4px 0;">${p}</li>`).join("")
        : `<li style="color:rgba(255,255,255,0.5);font-size:14px;">No places listed</li>`;

    return send(
        email,
        `Your trip to ${city} is saved! 🗺️`,
        wrap(`
          <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Trip to <span style="color:#F5A623;">${city}</span> saved! ✅</h2>
          <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 22px;">
            Hi <strong style="color:#fff;">${name}</strong>, your trip has been saved to My Trips. Here's a summary:
          </p>
          <div style="background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.2);border-radius:14px;padding:20px 24px;margin-bottom:22px;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Trip Details</p>
            <p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 4px;">📍 ${city}</p>
            <p style="color:rgba(255,255,255,0.55);font-size:14px;margin:0 0 16px;">📅 ${dateStr}</p>
            <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">Places to visit</p>
            <ul style="margin:0;padding-left:18px;">${placeList}</ul>
          </div>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">
            Have an amazing trip!<br/><strong style="color:rgba(255,255,255,0.7);">The Velora Team</strong>
          </p>
        `)
    );
};

// ── 4. Trip reminder (5 / 3 / 1 day before) ──────────────────────────────────
exports.sendTripReminderEmail = (name, email, city, date, daysLeft) => {
    const dateStr = fmtDate(date);
    const urgency =
        daysLeft === 1 ? { label: "Tomorrow!", color: "#e8341a", emoji: "🚨" } :
        daysLeft === 3 ? { label: "3 Days Away", color: "#F5A623", emoji: "⏳" } :
                         { label: "5 Days Away", color: "#22c55e", emoji: "📅" };

    return send(
        email,
        `${urgency.emoji} Your trip to ${city} is ${urgency.label.toLowerCase()}`,
        wrap(`
          <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">${urgency.emoji} ${city} is <span style="color:${urgency.color};">${urgency.label.toLowerCase()}</span></h2>
          <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 22px;">
            Hi <strong style="color:#fff;">${name}</strong>, your trip to <strong style="color:#F5A623;">${city}</strong> is coming up!
          </p>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:20px 24px;margin-bottom:22px;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Your Trip</p>
            <p style="color:#fff;font-size:18px;font-weight:800;margin:0 0 6px;">📍 ${city}</p>
            <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 14px;">📅 ${dateStr}</p>
            <div style="display:inline-block;background:${urgency.color}22;border:1px solid ${urgency.color}44;border-radius:20px;padding:6px 16px;">
              <span style="color:${urgency.color};font-size:13px;font-weight:700;">${daysLeft === 1 ? "Leaving tomorrow!" : `${daysLeft} days to go`}</span>
            </div>
          </div>
          <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0 0 22px;">
            Make sure you've checked your itinerary, packed your bags, and are ready for an amazing adventure!
          </p>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">
            Safe travels,<br/><strong style="color:rgba(255,255,255,0.7);">The Velora Team</strong>
          </p>
        `)
    );
};


exports.sendResetPasswordEmail = (name, email, resetToken) => {
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${email}`;

  return send(
    email,
    "🔑 Reset your Velora password",
    wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Reset your password 🔑</h2>

      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;margin:0 0 24px;">
        Hi <strong style="color:#fff;">${name}</strong>,<br/>
        We received a request to reset your password.
      </p>

      <!-- Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${resetLink}"
           style="display:inline-block;background:#e8341a;color:#fff;padding:14px 28px;border-radius:10px;
                  text-decoration:none;font-weight:700;font-size:15px;">
          Reset Password
        </a>
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;margin:0 0 16px;text-align:center;">
        ⏱ This link will expire in <strong style="color:#fff;">1 hour</strong>.
      </p>

      <p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
        If you didn’t request this, you can safely ignore this email.
      </p>
    `)
  );
};