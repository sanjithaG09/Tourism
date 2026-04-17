import VeloraLogo from "../components/VeloraLogo";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "otp" | "reset"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!isForgot) {
      if (isSignup && !form.name.trim()) newErrors.name = "Name is required";
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
      if (!form.password) newErrors.password = "Password is required";
      else if (form.password.length < 6) newErrors.password = "Min 6 characters";
    } else {
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    }
    return newErrors;
  };

  // ── Handle form submit (login / signup / forgot) ────────────────────────────
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    setSuccessMsg("");

    try {
      if (isForgot) {
        const res  = await fetch(`${BASE_URL}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrors({ email: data.error || "No account found with this email." });
          setLoading(false);
          return;
        }
        // Move to OTP step — verifying it logs the user in
        setOtpDigits(["", "", "", "", "", ""]);
        setStep("otp");
        setSuccessMsg(`OTP sent to ${form.email}`);
        startResendCooldown();
        setLoading(false);
        return;
      }

      const endpoint = isSignup ? "/register" : "/login";
      const payload  = isSignup
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res  = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "User not found") {
          setErrors({ email: "No account found with this email." });
        } else if (data.error === "Invalid password") {
          setErrors({ password: "Incorrect password. Please try again." });
        } else {
          setErrors({ email: data.error || "Something went wrong." });
        }
        setLoading(false);
        return;
      }

      // Signup: server sent OTP — move to OTP step
      if (data.requiresOtp) {
        setOtpDigits(["", "", "", "", "", ""]);
        setStep("otp");
        setSuccessMsg(`OTP sent to ${form.email}`);
        startResendCooldown();
        setLoading(false);
        return;
      }

      // Login: server issued token directly — store and navigate
      if (data.token) {
        localStorage.setItem("velora_token", data.token);
        const name = data.name || form.email.split("@")[0];
        localStorage.setItem("velora_user", JSON.stringify({ name, email: form.email }));
        setLoading(false);
        navigate("/");
        return;
      }

      setLoading(false);
    } catch {
      setLoading(false);
      setErrors({ email: "Network error. Is your backend running?" });
    }
  };

  // ── Handle OTP verification ─────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) {
      setErrors({ otp: "Please enter the complete 6-digit OTP." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const endpoint = isForgot
        ? "/verify-forgot-otp"
        : isSignup
        ? "/verify-signup-otp"
        : "/verify-login-otp";
      const res  = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ otp: data.error || "OTP verification failed." });
        setLoading(false);
        return;
      }

      if (isForgot) {
        // OTP verified — show the reset password form
        setResetToken(data.resetToken);
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
        setSuccessMsg("OTP verified! Please set your new password.");
        setStep("reset");
        setLoading(false);
        return;
      }

      localStorage.setItem("velora_token", data.token);
      const name = data.name || form.email.split("@")[0];
      localStorage.setItem("velora_user", JSON.stringify({ name, email: form.email }));
      setLoading(false);
      navigate("/");
    } catch {
      setLoading(false);
      setErrors({ otp: "Network error. Please try again." });
    }
  };

  // ── Handle reset password after OTP ────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setErrors({ reset: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ reset: "Passwords do not match." });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch(`${BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ reset: data.error || "Failed to reset password." });
        setLoading(false);
        return;
      }
      setSuccessMsg("Password reset successfully! You can now log in.");
      setStep("form");
      setIsForgot(false);
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setLoading(false);
    } catch {
      setLoading(false);
      setErrors({ reset: "Network error. Please try again." });
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrors({});
    setSuccessMsg("");

    try {
      const context = isForgot ? "forgot" : isSignup ? "signup" : "login";
      const res  = await fetch(`${BASE_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, context }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ otp: data.error || "Failed to resend OTP." });
        return;
      }
      setOtpDigits(["", "", "", "", "", ""]);
      setSuccessMsg("New OTP sent! Check your inbox.");
      startResendCooldown();
      otpRefs.current[0]?.focus();
    } catch {
      setErrors({ otp: "Network error. Please try again." });
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // ── OTP digit input handler ─────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);
    setErrors({ ...errors, otp: "" });
    if (cleaned && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerifyOtp();
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => text[i] || "");
    setOtpDigits(next);
    const focusIdx = Math.min(text.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  // ── Misc helpers ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const switchTab = (signup) => {
    setIsSignup(signup);
    setStep("form");
    setErrors({});
    setSuccessMsg("");
    setForm({ name: "", email: "", password: "" });
    setOtpDigits(["", "", "", "", "", ""]);
  };

  const backToForm = () => {
    setStep("form");
    setOtpDigits(["", "", "", "", "", ""]);
    setErrors({});
    setSuccessMsg("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.vl-page {
  min-height: 100vh;
  width: 100%;
  font-family: 'DM Sans', sans-serif;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}

.vl-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.vl-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vl-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(8, 8, 12, 0.30) 0%,
    rgba(8, 8, 12, 0.15) 45%,
    rgba(8, 8, 12, 0.55) 100%
  );
}

.vl-tagline {
  position: fixed;
  bottom: 52px;
  left: 52px;
  z-index: 2;
  max-width: 480px;
}

.vl-tagline-logo { margin-bottom: 20px; color: #ffffff; }

.vl-tagline h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 42px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.15;
  margin-bottom: 12px;
  letter-spacing: -0.4px;
  white-space: nowrap;
}

.vl-tagline h2 span { color: #f0794a; }

.vl-tagline p {
  font-size: 15px;
  color: rgba(255,255,255,0.60);
  line-height: 1.6;
  font-weight: 300;
  white-space: nowrap;
}

@media (max-width: 700px) { .vl-tagline { display: none; } }

.vl-right {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 460px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-left: 1px solid rgba(255,255,255,0.08);
}

@media (max-width: 700px) {
  .vl-right { max-width: 100%; background: rgba(0,0,0,0.96); }
}

.vl-card {
  width: 100%;
  animation: fadeUp 0.45s ease both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.vl-logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.vl-heading {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
  margin-bottom: 5px;
}

.vl-subheading {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 400;
  margin-bottom: 24px;
  line-height: 1.5;
}

.vl-tabs {
  display: flex;
  background: rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 5px;
  margin-bottom: 26px;
}

.vl-tab {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #9ca3af;
  transition: all 0.2s ease;
}

.vl-tab.active {
  background: rgba(255,255,255,0.15);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.vl-form { display: flex; flex-direction: column; gap: 14px; }

.vl-field { display: flex; flex-direction: column; gap: 5px; }

.vl-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.vl-input {
  padding: 12px 15px;
  border-radius: 12px;
  border: 1.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.07);
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  width: 100%;
}

.vl-input::placeholder { color: rgba(255,255,255,0.3); }

.vl-input:focus {
  border-color: #e8622a;
  background: rgba(255,255,255,0.11);
  box-shadow: 0 0 0 4px rgba(232,98,42,0.15);
}

.vl-input.err {
  border-color: #f87171;
  background: rgba(248,113,113,0.08);
}

.vl-error {
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
}

.vl-success {
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.3);
  color: #4ade80;
  padding: 11px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.vl-forgot-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
}

.vl-forgot {
  font-size: 13px;
  color: #e8622a;
  cursor: pointer;
  background: none;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  padding: 0;
  transition: opacity 0.15s;
}

.vl-forgot:hover { opacity: 0.7; }

.vl-submit {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #e8622a 0%, #f0794a 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.2px;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(232,98,42,0.22), inset 0 1px 0 rgba(255,255,255,0.15);
  position: relative;
  overflow: hidden;
}

.vl-submit::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
  pointer-events: none;
}

.vl-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(232,98,42,0.32), inset 0 1px 0 rgba(255,255,255,0.15);
}

.vl-submit:active:not(:disabled) { transform: translateY(0); }
.vl-submit:disabled { opacity: 0.65; cursor: not-allowed; }

.vl-back-login {
  background: none;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  cursor: pointer;
  text-align: center;
  padding: 4px 0;
  width: 100%;
  transition: color 0.15s;
}

.vl-back-login:hover { color: #e8622a; }

.vl-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.vl-back-home {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  background: none;
  border: none;
  font-family: 'DM Sans', sans-serif;
  transition: color 0.15s;
}

.vl-back-home:hover { color: #e8622a; }

.vl-forgot-header { margin-bottom: 22px; }

.vl-forgot-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 5px;
}

.vl-forgot-desc { font-size: 14px; color: #9ca3af; }

/* ── OTP step styles ── */
.vl-otp-header { margin-bottom: 24px; text-align: center; }

.vl-otp-icon {
  font-size: 36px;
  margin-bottom: 12px;
  display: block;
}

.vl-otp-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.vl-otp-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  line-height: 1.5;
}

.vl-otp-desc strong { color: #ffffff; }

.vl-otp-inputs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 8px 0 4px;
}

.vl-otp-digit {
  width: 52px;
  height: 60px;
  border: 2px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  background: rgba(255,255,255,0.07);
  font-family: 'DM Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  caret-color: transparent;
}

.vl-otp-digit:focus {
  border-color: #e8622a;
  background: rgba(255,255,255,0.11);
  box-shadow: 0 0 0 4px rgba(232,98,42,0.15);
}

.vl-otp-digit.filled {
  border-color: #e8622a;
  background: rgba(232,98,42,0.1);
}

.vl-otp-digit.err { border-color: #f87171; background: rgba(248,113,113,0.08); }

.vl-resend-row {
  text-align: center;
  margin-top: 4px;
}

.vl-resend-btn {
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  background: none;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
}

.vl-resend-btn:not(:disabled) { color: #e8622a; }
.vl-resend-btn:disabled { color: #9ca3af; cursor: default; }
      `}</style>

      <div className="vl-page">

        {/* ── BACKGROUND ── */}
        <div className="vl-bg">
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=85"
            alt="Travel background"
          />
        </div>

        {/* ── BOTTOM-LEFT TAGLINE ── */}
        <div className="vl-tagline">
          <div className="vl-tagline-logo">
            <VeloraLogo size={28} textColor="#ffffff" />
          </div>
          <h2>Redefining the way you <span>roam</span></h2>
          <p>Discover hidden gems, plan seamless trips, and travel smarter with your intelligent companion.</p>
        </div>

        {/* ── RIGHT FROSTED PANEL ── */}
        <div className="vl-right">
          <div className="vl-card">

            {/* Logo */}
            <div className="vl-logo-wrap" style={{ color: "#ffffff" }}>
              <VeloraLogo size={26} textColor="#ffffff" />
            </div>

            {/* ══ RESET PASSWORD STEP ══════════════════════════════════════ */}
            {step === "reset" ? (
              <>
                <div className="vl-otp-header">
                  <span className="vl-otp-icon">🔒</span>
                  <h1 className="vl-otp-title">Set New Password</h1>
                  <p className="vl-otp-desc">
                    Choose a new password for<br/><strong>{form.email}</strong>
                  </p>
                </div>

                {successMsg && <div className="vl-success">{successMsg}</div>}

                <div className="vl-form">
                  <div className="vl-field">
                    <label className="vl-label">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
                      className={`vl-input ${errors.reset ? "err" : ""}`}
                      autoFocus
                    />
                  </div>

                  <div className="vl-field">
                    <label className="vl-label">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
                      className={`vl-input ${errors.reset ? "err" : ""}`}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    />
                    {errors.reset && <span className="vl-error">{errors.reset}</span>}
                  </div>

                  <button
                    className="vl-submit"
                    onClick={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password →"}
                  </button>

                  <button className="vl-back-login" onClick={backToForm}>
                    ← Back to Login
                  </button>
                </div>
              </>
            ) : step === "otp" ? (
              /* ══ OTP STEP ══════════════════════════════════════════════════ */
              <>
                <div className="vl-otp-header">
                  <span className="vl-otp-icon">{isForgot ? "🔑" : "📬"}</span>
                  <h1 className="vl-otp-title">
                    {isForgot ? "Verify your identity" : "Check your email"}
                  </h1>
                  <p className="vl-otp-desc">
                    {isForgot
                      ? "Enter the 6-digit code we sent to"
                      : "We sent a 6-digit code to"}<br/>
                    <strong>{form.email}</strong>
                  </p>
                  {isForgot && (
                    <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                      After verifying, you can set a new password.
                    </p>
                  )}
                </div>

                {successMsg && <div className="vl-success">{successMsg}</div>}

                <div className="vl-form">
                  <div className="vl-field">
                    <label className="vl-label" style={{ textAlign: "center" }}>Enter OTP</label>
                    <div className="vl-otp-inputs" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          className={`vl-otp-digit ${digit ? "filled" : ""} ${errors.otp ? "err" : ""}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <span className="vl-error" style={{ textAlign: "center" }}>{errors.otp}</span>
                    )}
                  </div>

                  <div className="vl-resend-row">
                    <button
                      className="vl-resend-btn"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Didn't receive it? Resend"}
                    </button>
                  </div>

                  <button
                    className="vl-submit"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify & Continue →"}
                  </button>

                  <button className="vl-back-login" onClick={backToForm}>
                    ← Change email / password
                  </button>
                </div>
              </>
            ) : (
              /* ══ FORM STEP ══════════════════════════════════════════════════ */
              <>
                {/* Header */}
                {!isForgot ? (
                  <>
                    <h1 className="vl-heading">
                      {isSignup ? "Create account" : "Welcome back"}
                    </h1>
                    <p className="vl-subheading">
                      {isSignup
                        ? "Start your journey with Velora today"
                        : "Sign in to continue your adventure"}
                    </p>
                    <div className="vl-tabs">
                      <button
                        className={`vl-tab ${!isSignup ? "active" : ""}`}
                        onClick={() => switchTab(false)}
                      >
                        Login
                      </button>
                      <button
                        className={`vl-tab ${isSignup ? "active" : ""}`}
                        onClick={() => switchTab(true)}
                      >
                        Sign Up
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="vl-forgot-header">
                    <h1 className="vl-forgot-title">Forgot Password?</h1>
                    <p className="vl-forgot-desc">Enter your email and we'll send you a reset link</p>
                  </div>
                )}

                {successMsg && <div className="vl-success">{successMsg}</div>}

                <div className="vl-form">

                  {/* Name — only on signup */}
                  <div className="vl-field" style={{
                    overflow: 'hidden',
                    maxHeight: isSignup && !isForgot ? '80px' : '0px',
                    opacity: isSignup && !isForgot ? 1 : 0,
                    transition: 'max-height 0.3s ease, opacity 0.25s ease',
                    marginBottom: isSignup && !isForgot ? 0 : '-14px',
                  }}>
                    <label className="vl-label">Full Name</label>
                    <input
                      name="name"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      className={`vl-input ${errors.name ? "err" : ""}`}
                    />
                    {errors.name && <span className="vl-error">{errors.name}</span>}
                  </div>

                  <div className="vl-field">
                    <label className="vl-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className={`vl-input ${errors.email ? "err" : ""}`}
                    />
                    {errors.email && <span className="vl-error">{errors.email}</span>}
                  </div>

                  {!isForgot && (
                    <div className="vl-field">
                      <label className="vl-label">Password</label>
                      <input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        className={`vl-input ${errors.password ? "err" : ""}`}
                      />
                      {errors.password && <span className="vl-error">{errors.password}</span>}
                    </div>
                  )}

                  {!isSignup && !isForgot && (
                    <div className="vl-forgot-row">
                      <button
                        className="vl-forgot"
                        onClick={() => { setIsForgot(true); setErrors({}); setSuccessMsg(""); }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    className="vl-submit"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading
                      ? isForgot ? "Sending..." : isSignup ? "Creating Account..." : "Signing in..."
                      : isForgot ? "Send Reset Email" : isSignup ? "Create Account →" : "Sign In →"
                    }
                  </button>

                  {isForgot && (
                    <button
                      className="vl-back-login"
                      onClick={() => { setIsForgot(false); setErrors({}); setSuccessMsg(""); }}
                    >
                      ← Back to Login
                    </button>
                  )}

                </div>
              </>
            )}

            {/* Footer */}
            <div className="vl-footer">
              <button className="vl-back-home" onClick={() => navigate("/")}>
                ← Back to Home
              </button>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
