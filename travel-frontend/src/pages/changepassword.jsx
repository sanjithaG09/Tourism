import { useState } from "react";
import { auth } from "../firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function ChangePassword({ onClose }) {
  const [mode, setMode] = useState("change"); // "change" | "forgot"
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const user = auth.currentUser;
  const isSocialUser = user?.providerData?.every(p => p.providerId !== "password");

  const validate = () => {
    const e = {};
    if (!form.current) e.current = "Current password is required";
    if (!form.newPass) e.newPass = "New password is required";
    else if (form.newPass.length < 6) e.newPass = "Min 6 characters";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.newPass !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleChangePassword = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    setSuccessMsg("");
    try {
      // Re-authenticate first (required by Firebase before sensitive operations)
      const credential = EmailAuthProvider.credential(user.email, form.current);
      await reauthenticateWithCredential(user, credential);
      // Now update the password
      await updatePassword(user, form.newPass);
      setSuccessMsg("✅ Password updated successfully!");
      setForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrors({ current: "Current password is incorrect." });
      } else if (err.code === "auth/requires-recent-login") {
        setErrors({ current: "Session expired. Please log out and log in again." });
      } else if (err.code === "auth/weak-password") {
        setErrors({ newPass: "Password is too weak. Use at least 6 characters." });
      } else {
        setErrors({ current: "Failed to update password. Please try again." });
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      setErrors({ forgot: "No email associated with this account." });
      return;
    }
    setLoading(true);
    setErrors({});
    setSuccessMsg("");
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccessMsg(`✅ Reset link sent to ${user.email}! Check your inbox.`);
    } catch (err) {
      console.error(err);
      setErrors({ forgot: "Failed to send reset email. Please try again." });
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .cp-wrap { font-family: 'DM Sans', sans-serif; color: white; }
        .cp-mode-row { display: flex; gap: 8px; margin-bottom: 20px; }
        .cp-mode-btn { flex: 1; padding: 10px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .cp-mode-btn.active { background: #e8622a; border-color: #e8622a; color: white; box-shadow: 0 4px 16px rgba(232,98,42,0.35); }
        .cp-mode-btn:hover:not(.active) { background: rgba(255,255,255,0.08); }
        .cp-info-box { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: rgba(200,220,255,0.85); line-height: 1.5; }
        .cp-info-box strong { color: #93c5fd; }
        .cp-form { display: flex; flex-direction: column; gap: 16px; }
        .cp-group { display: flex; flex-direction: column; gap: 6px; }
        .cp-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 1px; text-transform: uppercase; }
        .cp-input { padding: 13px 16px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); font-size: 15px; color: white; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s, background 0.2s; width: 100%; }
        .cp-input::placeholder { color: rgba(255,255,255,0.2); }
        .cp-input:focus { border-color: #e8622a; background: rgba(232,98,42,0.06); }
        .cp-input.err { border-color: #ef4444; }
        .cp-error { font-size: 12px; color: #f87171; }
        .cp-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 10px; padding: 12px 16px; color: #4ade80; font-size: 14px; }
        .cp-btn { padding: 14px; background: #e8622a; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s, transform 0.1s; box-shadow: 0 4px 20px rgba(232,98,42,0.4); width: 100%; }
        .cp-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .cp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cp-btn-outline { padding: 13px; background: transparent; color: #e8622a; border: 1.5px solid #e8622a; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; width: 100%; margin-top: 4px; }
        .cp-btn-outline:hover { background: rgba(232,98,42,0.08); }
        .cp-forgot-box { text-align: center; padding: 16px; }
        .cp-forgot-icon { font-size: 40px; margin-bottom: 12px; }
        .cp-forgot-title { font-family: 'Playfair Display', serif; font-size: 20px; color: white; margin-bottom: 8px; }
        .cp-forgot-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; margin-bottom: 20px; }
        .cp-email-badge { display: inline-block; background: rgba(232,98,42,0.15); border: 1px solid rgba(232,98,42,0.3); border-radius: 8px; padding: 6px 14px; font-size: 14px; color: #e8622a; font-weight: 600; margin-bottom: 20px; }
      `}</style>

      <div className="cp-wrap">
        {/* Mode Toggle */}
        <div className="cp-mode-row">
          <button className={`cp-mode-btn ${mode === "change" ? "active" : ""}`} onClick={() => { setMode("change"); setErrors({}); setSuccessMsg(""); }}>
            🔒 Change Password
          </button>
          <button className={`cp-mode-btn ${mode === "forgot" ? "active" : ""}`} onClick={() => { setMode("forgot"); setErrors({}); setSuccessMsg(""); }}>
            📧 Forgot Password
          </button>
        </div>

        {/* Social user info banner */}
        {isSocialUser && mode === "change" && (
          <div className="cp-info-box">
            ℹ️ If you signed in with Google or GitHub, you may not have a password set. Use <strong>Forgot Password</strong> instead to set one via email.
          </div>
        )}

        {successMsg && <div className="cp-success" style={{ marginBottom: 16 }}>{successMsg}</div>}

        {mode === "change" ? (
          <div className="cp-form">
            <div className="cp-group">
              <label className="cp-label">Current Password</label>
              <input name="current" type="password" placeholder="••••••••" value={form.current} onChange={handleChange} className={`cp-input ${errors.current ? "err" : ""}`} />
              {errors.current && <span className="cp-error">{errors.current}</span>}
            </div>

            <div className="cp-group">
              <label className="cp-label">New Password</label>
              <input name="newPass" type="password" placeholder="••••••••" value={form.newPass} onChange={handleChange} className={`cp-input ${errors.newPass ? "err" : ""}`} />
              {errors.newPass && <span className="cp-error">{errors.newPass}</span>}
            </div>

            <div className="cp-group">
              <label className="cp-label">Confirm Password</label>
              <input name="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={handleChange} className={`cp-input ${errors.confirm ? "err" : ""}`} />
              {errors.confirm && <span className="cp-error">{errors.confirm}</span>}
            </div>

            <button className="cp-btn" onClick={handleChangePassword} disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>

            <button className="cp-btn-outline" onClick={() => { setMode("forgot"); setErrors({}); setSuccessMsg(""); }}>
              Forgot your current password? Send reset email →
            </button>
          </div>
        ) : (
          <div className="cp-forgot-box">
            <div className="cp-forgot-icon">📬</div>
            <h3 className="cp-forgot-title">Reset via Email</h3>
            <p className="cp-forgot-desc">
              We'll send a secure password reset link to your registered email address. Click the link to set a new password.
            </p>
            {user?.email && <div className="cp-email-badge">{user.email}</div>}
            {errors.forgot && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>{errors.forgot}</div>}
            <button className="cp-btn" onClick={handleForgotPassword} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}