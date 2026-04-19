import VeloraLogo from "../components/VeloraLogo";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ newPassword: "", confirm: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenData, setTokenData] = useState({ email: "", token: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email  = params.get("email") || "";
    const token  = params.get("token") || "";
    if (!email || !token) {
      navigate("/login");
    }
    setTokenData({ email, token });
  }, [navigate]);

  const validate = () => {
    const e = {};
    if (!form.newPassword)               e.newPassword = "Password is required";
    else if (form.newPassword.length < 6) e.newPassword = "Min 6 characters";
    if (form.confirm !== form.newPassword) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const res  = await fetch(`${API}/api/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email:       tokenData.email,
          token:       tokenData.token,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --accent: #E8341A; --accent-hover: #c9270e;
          --gold: #F5A623; --white: #FFFFFF; --black: #0A0A0A;
          --bg: #0D0D0D; --surface: #161616; --surface2: #1e1e1e;
          --border: rgba(255,255,255,0.08); --text-muted: rgba(255,255,255,0.45);
        }
        html, body { margin:0; padding:0; width:100%; min-height:100vh;
          background:var(--bg); font-family:'Sora',sans-serif; color:var(--white);
          display:flex; align-items:center; justify-content:center; }
        #root { width:100%; display:flex; align-items:center; justify-content:center; min-height:100vh; }

        .rp-wrap {
          width: 100%; max-width: 420px; margin: 0 auto; padding: 40px 24px;
        }
        .rp-logo {
          display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:36px; cursor:pointer;
        }
        .rp-logo-icon {
          width:38px; height:38px;
          background:linear-gradient(135deg, var(--accent), var(--gold));
          border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px;
        }
        .rp-logo-text { font-size:24px; font-weight:800; letter-spacing:-0.5px; }

        .rp-card {
          background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:36px;
        }
        .rp-title { font-size:22px; font-weight:800; margin-bottom:6px; }
        .rp-sub { font-size:14px; color:var(--text-muted); margin-bottom:28px; line-height:1.5; }

        .rp-label { display:block; font-size:12.5px; font-weight:600;
          color:rgba(255,255,255,0.6); margin-bottom:8px; letter-spacing:0.3px; }
        .rp-input {
          width:100%; padding:13px 16px; border-radius:10px;
          background:var(--surface2); border:1.5px solid var(--border);
          color:var(--white); font-family:'Sora',sans-serif; font-size:14px;
          outline:none; transition:border-color 0.2s; margin-bottom:4px;
        }
        .rp-input:focus { border-color:rgba(255,255,255,0.3); }
        .rp-input.error { border-color:var(--accent); }
        .rp-error { font-size:12px; color:var(--accent); margin-bottom:16px; }
        .rp-field { margin-bottom:20px; }

        .rp-strength { display:flex; gap:5px; margin-top:8px; }
        .rp-strength-bar {
          flex:1; height:4px; border-radius:2px;
          background:rgba(255,255,255,0.1); transition:background 0.3s;
        }
        .rp-strength-bar.active-weak   { background:#ff5a5a; }
        .rp-strength-bar.active-medium { background:var(--gold); }
        .rp-strength-bar.active-strong { background:#4ade80; }
        .rp-strength-label { font-size:11.5px; color:var(--text-muted); margin-top:5px; }

        .rp-btn {
          width:100%; padding:14px; border-radius:10px; border:none;
          background:var(--accent); color:#fff; font-family:'Sora',sans-serif;
          font-size:15px; font-weight:700; cursor:pointer;
          transition:background 0.2s, transform 0.15s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin-top:8px;
        }
        .rp-btn:hover:not(:disabled) { background:var(--accent-hover); transform:translateY(-1px); }
        .rp-btn:disabled { opacity:0.55; cursor:not-allowed; }

        .rp-spinner {
          width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.3);
          border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        .rp-api-error {
          background:rgba(232,52,26,0.12); border:1px solid rgba(232,52,26,0.3);
          border-radius:10px; padding:12px 16px; font-size:13.5px; color:#ff8070;
          margin-bottom:16px; line-height:1.5;
        }
        .rp-success {
          background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3);
          border-radius:10px; padding:20px; text-align:center;
        }
        .rp-success-icon { font-size:42px; margin-bottom:12px; }
        .rp-success-title { font-size:18px; font-weight:800; color:#4ade80; margin-bottom:6px; }
        .rp-success-sub { font-size:13.5px; color:var(--text-muted); }

        .rp-back {
          display:block; text-align:center; margin-top:20px;
          font-size:13.5px; color:var(--text-muted); cursor:pointer; transition:color 0.2s;
        }
        .rp-back:hover { color:var(--white); }
      `}</style>

      <div className="rp-wrap">
        <div className="rp-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={30} textColor="#fff" />
        </div>

        <div className="rp-card">
          {success ? (
            <div className="rp-success">
              <div className="rp-success-icon">✅</div>
              <div className="rp-success-title">Password Updated!</div>
              <div className="rp-success-sub">Redirecting you to login…</div>
            </div>
          ) : (
            <>
              <div className="rp-title">Set New Password</div>
              <div className="rp-sub">
                Choose a strong password for your Velora account.
              </div>

              {errors.api && <div className="rp-api-error">⚠️ {errors.api}</div>}

              <div className="rp-field">
                <label className="rp-label">New Password</label>
                <input
                  type="password"
                  className={`rp-input ${errors.newPassword ? "error" : ""}`}
                  placeholder="Min 6 characters"
                  value={form.newPassword}
                  onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                />
                {/* Strength indicator */}
                {form.newPassword.length > 0 && (() => {
                  const len  = form.newPassword.length;
                  const str  = len < 6 ? 0 : len < 10 ? 1 : 2;
                  const lbl  = ["Too short", "Medium", "Strong"][str];
                  const cls  = ["active-weak", "active-medium", "active-strong"][str];
                  return (
                    <>
                      <div className="rp-strength">
                        {[0,1,2].map(i => (
                          <div key={i} className={`rp-strength-bar ${i <= str ? cls : ""}`} />
                        ))}
                      </div>
                      <div className="rp-strength-label">{lbl}</div>
                    </>
                  );
                })()}
                {errors.newPassword && <div className="rp-error">{errors.newPassword}</div>}
              </div>

              <div className="rp-field">
                <label className="rp-label">Confirm Password</label>
                <input
                  type="password"
                  className={`rp-input ${errors.confirm ? "error" : ""}`}
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                {errors.confirm && <div className="rp-error">{errors.confirm}</div>}
              </div>

              <button className="rp-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="rp-spinner" /> : "🔐 Reset Password"}
              </button>
            </>
          )}

          <span className="rp-back" onClick={() => navigate("/login")}>
            ← Back to Login
          </span>
        </div>
      </div>
    </>
  );
}
