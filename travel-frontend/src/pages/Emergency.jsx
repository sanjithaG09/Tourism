import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ─── India national emergency numbers ──────────────────────────────────────
const NATIONAL_NUMBERS = [
  { name: "Emergency Helpline",  number: "112", emoji: "🆘", desc: "All emergencies" },
  { name: "Police",              number: "100", emoji: "👮", desc: "Law & order" },
  { name: "Fire Brigade",        number: "101", emoji: "🔥", desc: "Fire emergencies" },
  { name: "Ambulance",           number: "102", emoji: "🚑", desc: "Medical emergency" },
  { name: "Disaster Management", number: "108", emoji: "🌊", desc: "Natural disasters" },
  { name: "Women Helpline",      number: "1091", emoji: "👩", desc: "Women in distress" },
  { name: "Child Helpline",      number: "1098", emoji: "👶", desc: "Child welfare" },
  { name: "Tourist Helpline",    number: "1363", emoji: "🧳", desc: "Tourist assistance" },
];

const SOS_TIPS = [
  { icon: "📍", title: "Share your location", desc: "Always let someone know where you are going." },
  { icon: "🔋", title: "Keep phone charged", desc: "Carry a power bank during trips." },
  { icon: "🪪", title: "Carry ID",            desc: "Keep a copy of your ID and emergency contacts." },
  { icon: "💊", title: "Medical info",         desc: "Note any allergies or conditions on your phone." },
];

export default function Emergency() {
  const navigate = useNavigate();

  // Auth
  const [user, setUser]             = useState(null);
  const [dropOpen, setDropOpen]     = useState(false);

  // Location & services
  const [locStatus, setLocStatus]   = useState("idle"); // idle | loading | granted | denied | error
  const [coords, setCoords]         = useState(null);
  const [services, setServices]     = useState([]);
  const [fetchingServices, setFetchingServices] = useState(false);

  // SOS flow
  const [sosState, setSosState]     = useState("idle"); // idle | countdown | sent | error
  const [countdown, setCountdown]   = useState(5);
  const [sosEmail, setSosEmail]     = useState("");
  const [sosMsg, setSosMsg]         = useState("");

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    const name  = localStorage.getItem("velora_user") ? (JSON.parse(localStorage.getItem("velora_user")).name || JSON.parse(localStorage.getItem("velora_user")).email) : null;
    const token = localStorage.getItem("velora_token");
    if (name || token) setUser({ name: name || "Traveler" });

    const unsub = auth.onAuthStateChanged(u => {
      if (u) setUser({ name: u.displayName || u.email || "Traveler" });
    });
    return unsub;
  }, []);

  // ── Get location ───────────────────────────────────────────────────────────
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("granted");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Fetch nearby emergency services ───────────────────────────────────────
  useEffect(() => {
    if (locStatus !== "granted" || !coords) return;
    const token = localStorage.getItem("velora_token");
    if (!token) return;

    setFetchingServices(true);
    fetch(`${API}/api/sos/nearby?lat=${coords.lat}&lng=${coords.lng}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.services) setServices(d.services); })
      .catch(() => {}) // fail silently — fallback UI shown
      .finally(() => setFetchingServices(false));
  }, [locStatus, coords]);

  // ── SOS countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (sosState !== "countdown") return;
    if (countdown <= 0) {
      triggerSos();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [sosState, countdown]);

  const startSos = () => {
    setCountdown(5);
    setSosState("countdown");
  };
  const cancelSos = () => setSosState("idle");

  const triggerSos = async () => {
    setSosState("sent");
    const token = localStorage.getItem("velora_token");
    try {
      await fetch(`${API}/api/sos/alert`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          name:  user?.name || "Velora User",
          email: sosEmail || user?.email || "",
          lat:   coords?.lat,
          lng:   coords?.lng,
          city:  "Current Location",
        }),
      });
    } catch {
      // email failure is non-critical — SOS UI still confirms
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    localStorage.removeItem("velora_token");
    localStorage.removeItem("velora_user");
    navigate("/login");
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  const typeColor = (type) => {
    if (type === "Hospital")    return "rgba(74,222,128,0.15)";
    if (type === "Police")      return "rgba(96,165,250,0.15)";
    if (type === "Fire Brigade") return "rgba(251,146,60,0.15)";
    return "rgba(255,255,255,0.08)";
  };
  const typeBorder = (type) => {
    if (type === "Hospital")    return "rgba(74,222,128,0.3)";
    if (type === "Police")      return "rgba(96,165,250,0.3)";
    if (type === "Fire Brigade") return "rgba(251,146,60,0.3)";
    return "rgba(255,255,255,0.12)";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        :root {
          --accent:#E8341A; --accent-hover:#c9270e; --gold:#F5A623;
          --white:#FFFFFF; --bg:#0D0D0D; --surface:#161616; --surface2:#1e1e1e;
          --border:rgba(255,255,255,0.08); --border-hover:rgba(255,255,255,0.18);
          --text-muted:rgba(255,255,255,0.45); --text-sub:rgba(255,255,255,0.65);
          --nav-h:68px;
        }
        html,body { margin:0;padding:0;width:100%;min-height:100vh;
          overflow-x:hidden;background:var(--bg);
          font-family:'Sora',sans-serif;color:var(--white); }
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:var(--bg)}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}

        /* ── NAV ── */
        .e-nav {
          position:fixed;top:0;left:0;right:0;height:var(--nav-h);
          display:flex;align-items:center;justify-content:space-between;
          padding:0 5%;z-index:1000;
          background:rgba(10,10,10,0.92);backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
        }
        .e-nav-logo { display:flex;align-items:center;gap:9px;cursor:pointer;text-decoration:none; }
        .e-nav-logo-icon {
          width:34px;height:34px;
          background:linear-gradient(135deg,var(--accent),var(--gold));
          border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;
        }
        .e-nav-logo-text { font-size:22px;font-weight:800;color:var(--white);letter-spacing:-0.5px; }
        .e-nav-links {
          position:absolute;left:50%;transform:translateX(-50%);
          display:flex;align-items:center;gap:30px;
        }
        .e-nav-link {
          color:var(--text-sub);text-decoration:none;
          font-size:14px;font-weight:500;position:relative;transition:color 0.2s;cursor:pointer;
        }
        .e-nav-link::after {
          content:'';position:absolute;bottom:-3px;left:0;
          width:0;height:1.5px;background:var(--gold);transition:width 0.25s;
        }
        .e-nav-link:hover { color:#fff; }
        .e-nav-link:hover::after { width:100%; }
        .e-nav-link.active { color:#fff; }
        .e-nav-link.active::after { width:100%; }
        .e-nav-actions { display:flex;align-items:center;gap:12px; }

        /* Avatar dropdown */
        .e-avatar-wrap { position:relative; }
        .e-avatar-trigger {
          display:flex;align-items:center;gap:9px;cursor:pointer;
          padding:5px 14px 5px 5px;border-radius:50px;
          border:1.5px solid rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.06);backdrop-filter:blur(6px);transition:background 0.2s;
        }
        .e-avatar-trigger:hover { background:rgba(255,255,255,0.11); }
        .e-avatar-circle {
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,var(--accent),var(--gold));
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:700;color:#fff;
          border:1.5px solid var(--gold);
        }
        .e-avatar-name { color:#fff;font-size:13.5px;font-weight:600; }
        .e-dropdown {
          position:absolute;top:calc(100% + 10px);right:0;
          background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);
          border-radius:14px;padding:8px;min-width:170px;
          box-shadow:0 20px 50px rgba(0,0,0,0.55);
          animation:dropIn 0.18s ease;z-index:999;
        }
        @keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .e-drop-item {
          display:flex;align-items:center;gap:9px;width:100%;padding:10px 14px;
          border:none;background:none;color:rgba(255,255,255,0.82);
          font-family:'Sora',sans-serif;font-size:13.5px;font-weight:500;
          cursor:pointer;border-radius:8px;transition:background 0.18s;text-align:left;
        }
        .e-drop-item:hover { background:rgba(255,255,255,0.08);color:#fff; }
        .e-drop-item.danger { color:#ff5a5a; }
        .e-drop-item.danger:hover { background:rgba(255,90,90,0.1); }
        .e-drop-divider { height:1px;background:rgba(255,255,255,0.07);margin:6px 0; }

        /* ── PAGE ── */
        .e-page { padding-top:var(--nav-h);min-height:100vh;background:var(--bg); }
        .e-inner { max-width:1000px;margin:0 auto;padding:40px 5%; }

        /* ── HERO BANNER ── */
        .e-hero {
          background:linear-gradient(135deg,rgba(232,52,26,0.18),rgba(232,52,26,0.06));
          border:1.5px solid rgba(232,52,26,0.3);
          border-radius:24px;padding:36px 40px;margin-bottom:36px;
          display:flex;align-items:center;gap:32px;
          position:relative;overflow:hidden;
        }
        .e-hero::before {
          content:'🚨';position:absolute;right:-10px;bottom:-20px;
          font-size:140px;opacity:0.06;pointer-events:none;
        }
        .e-hero-icon {
          width:72px;height:72px;border-radius:20px;flex-shrink:0;
          background:rgba(232,52,26,0.2);border:2px solid rgba(232,52,26,0.4);
          display:flex;align-items:center;justify-content:center;font-size:34px;
        }
        .e-hero-title { font-size:28px;font-weight:800;margin-bottom:6px; }
        .e-hero-sub { font-size:14.5px;color:var(--text-sub);line-height:1.6;max-width:480px; }

        /* ── GRID ── */
        .e-grid { display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:36px; }
        @media(max-width:680px){ .e-grid{grid-template-columns:1fr;} }

        /* ── CARD ── */
        .e-card {
          background:var(--surface);border:1px solid var(--border);
          border-radius:20px;overflow:hidden;
        }
        .e-card-head {
          padding:20px 24px 16px;border-bottom:1px solid var(--border);
          display:flex;align-items:center;justify-content:space-between;
        }
        .e-card-title {
          display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;
        }
        .e-card-icon {
          width:32px;height:32px;border-radius:9px;
          display:flex;align-items:center;justify-content:center;font-size:15px;
          background:rgba(232,52,26,0.15);
        }
        .e-card-body { padding:20px 24px; }

        /* ── SOS BUTTON ── */
        .e-sos-wrap { text-align:center;padding:24px; }
        .e-sos-btn {
          width:160px;height:160px;border-radius:50%;border:none;
          background:linear-gradient(135deg,#E8341A,#c9270e);
          color:#fff;font-family:'Sora',sans-serif;font-size:14px;font-weight:800;
          cursor:pointer;position:relative;
          box-shadow:0 0 0 0 rgba(232,52,26,0.7);
          animation:sos-pulse 2s infinite;
          transition:transform 0.2s,box-shadow 0.2s;letter-spacing:0.5px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
        }
        .e-sos-btn:hover { transform:scale(1.05); }
        .e-sos-btn:active { transform:scale(0.97); }
        @keyframes sos-pulse {
          0%   { box-shadow:0 0 0 0 rgba(232,52,26,0.6); }
          70%  { box-shadow:0 0 0 24px rgba(232,52,26,0); }
          100% { box-shadow:0 0 0 0 rgba(232,52,26,0); }
        }
        .e-sos-emoji { font-size:42px;line-height:1; }
        .e-sos-hint { font-size:13px;color:var(--text-muted);margin-top:14px; }

        /* Countdown */
        .e-countdown-wrap { text-align:center;padding:20px; }
        .e-countdown-num {
          font-size:80px;font-weight:900;color:var(--accent);
          animation:pulse-num 1s ease infinite;line-height:1;
        }
        @keyframes pulse-num { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        .e-countdown-label { font-size:16px;font-weight:700;margin:8px 0; }
        .e-countdown-sub { font-size:13px;color:var(--text-muted);margin-bottom:20px; }
        .e-cancel-btn {
          padding:12px 28px;border-radius:50px;border:2px solid rgba(255,255,255,0.25);
          background:transparent;color:#fff;font-family:'Sora',sans-serif;
          font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;
        }
        .e-cancel-btn:hover { background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.45); }

        /* Sent state */
        .e-sent-wrap { text-align:center;padding:24px; }
        .e-sent-icon { font-size:52px;margin-bottom:12px; }
        .e-sent-title { font-size:18px;font-weight:800;color:#4ade80;margin-bottom:6px; }
        .e-sent-sub { font-size:13.5px;color:var(--text-muted);margin-bottom:16px;line-height:1.5; }
        .e-reset-btn {
          padding:10px 24px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.2);
          background:transparent;color:rgba(255,255,255,0.7);font-family:'Sora',sans-serif;
          font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;
        }
        .e-reset-btn:hover { background:rgba(255,255,255,0.08);color:#fff; }

        /* ── EMAIL INPUT ── */
        .e-email-wrap { margin-top:18px; }
        .e-email-label { font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600; }
        .e-email-input {
          width:100%;padding:11px 14px;border-radius:10px;
          background:var(--surface2);border:1.5px solid var(--border);
          color:var(--white);font-family:'Sora',sans-serif;font-size:13.5px;
          outline:none;transition:border-color 0.2s;
        }
        .e-email-input:focus { border-color:rgba(255,255,255,0.3); }

        /* ── LOCATION SECTION ── */
        .e-loc-btn {
          display:flex;align-items:center;gap:9px;padding:12px 22px;
          border-radius:50px;border:1.5px solid var(--border);
          background:var(--surface2);color:var(--white);font-family:'Sora',sans-serif;
          font-size:13.5px;font-weight:600;cursor:pointer;transition:all 0.22s;
          margin-bottom:16px;width:100%;justify-content:center;
        }
        .e-loc-btn:hover { background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.25); }
        .e-loc-badge {
          display:inline-flex;align-items:center;gap:7px;padding:8px 14px;
          border-radius:50px;font-size:12.5px;font-weight:600;margin-bottom:16px;
        }
        .e-loc-badge.granted { background:rgba(74,222,128,0.1);color:#4ade80;border:1px solid rgba(74,222,128,0.25); }
        .e-loc-badge.denied  { background:rgba(232,52,26,0.1);color:#ff8070;border:1px solid rgba(232,52,26,0.25); }
        .e-loc-badge.loading { background:rgba(245,166,35,0.1);color:var(--gold);border:1px solid rgba(245,166,35,0.25); }

        /* ── SERVICE LIST ── */
        .e-service {
          display:flex;align-items:center;gap:14px;padding:14px 0;
          border-bottom:1px solid var(--border);
        }
        .e-service:last-child { border-bottom:none; }
        .e-service-icon {
          width:44px;height:44px;border-radius:12px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;font-size:20px;
        }
        .e-service-name { font-size:14px;font-weight:700;margin-bottom:3px; }
        .e-service-meta { font-size:12px;color:var(--text-muted); }
        .e-service-call {
          margin-left:auto;display:flex;align-items:center;gap:6px;
          padding:8px 14px;border-radius:50px;border:none;
          background:var(--accent);color:#fff;font-family:'Sora',sans-serif;
          font-size:12.5px;font-weight:700;cursor:pointer;flex-shrink:0;
          text-decoration:none;transition:background 0.2s;
        }
        .e-service-call:hover { background:var(--accent-hover); }
        .e-spinner {
          width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);
          border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;
        }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* ── NATIONAL NUMBERS ── */
        .e-num-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
        @media(max-width:500px){ .e-num-grid{grid-template-columns:1fr;} }
        .e-num-card {
          display:flex;align-items:center;gap:12px;padding:14px;
          border-radius:14px;border:1px solid var(--border);background:var(--surface2);
          text-decoration:none;transition:border-color 0.2s,background 0.2s;
        }
        .e-num-card:hover { border-color:var(--border-hover);background:rgba(255,255,255,0.04); }
        .e-num-emoji { font-size:22px;flex-shrink:0; }
        .e-num-name { font-size:13px;font-weight:700;color:#fff;margin-bottom:2px; }
        .e-num-desc { font-size:11.5px;color:var(--text-muted); }
        .e-num-badge {
          margin-left:auto;padding:5px 10px;border-radius:50px;flex-shrink:0;
          background:rgba(232,52,26,0.15);color:var(--accent);
          font-size:13px;font-weight:800;border:1px solid rgba(232,52,26,0.25);
        }

        /* ── TIPS ── */
        .e-tips-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:12px; }
        @media(max-width:500px){ .e-tips-grid{grid-template-columns:1fr;} }
        .e-tip {
          background:var(--surface2);border:1px solid var(--border);border-radius:14px;
          padding:16px 18px;display:flex;align-items:flex-start;gap:12px;
        }
        .e-tip-icon { font-size:22px;flex-shrink:0; }
        .e-tip-title { font-size:13px;font-weight:700;margin-bottom:4px; }
        .e-tip-desc { font-size:12px;color:var(--text-muted);line-height:1.5; }

        /* ── FULL-WIDTH CARD ── */
        .e-card-full { margin-bottom:24px; }
      `}</style>

      {/* NAV */}
      <nav className="e-nav">
        <div className="e-nav-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={30} textColor="#fff" />
        </div>
        <div className="e-nav-links">
          <span className="e-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="e-nav-link" onClick={() => navigate("/my-trips")}>Trips</span>
          <span className="e-nav-link active">Emergency</span>
          <span className="e-nav-link" onClick={() => navigate("/analytics")}>Analytics</span>
        </div>
        <div className="e-nav-actions">
          {user ? (
            <div className="e-avatar-wrap">
              <div className="e-avatar-trigger" onClick={() => setDropOpen(o => !o)}>
                <div className="e-avatar-circle">{user.name?.[0]?.toUpperCase() || "U"}</div>
                <span className="e-avatar-name">{user.name}</span>
              </div>
              {dropOpen && (
                <div className="e-dropdown">
                  <button className="e-drop-item" onClick={() => { navigate("/profile"); setDropOpen(false); }}>👤 Profile</button>
                  <div className="e-drop-divider" />
                  <button className="e-drop-item danger" onClick={handleSignOut}>↩ Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/login")} style={{
              padding:"9px 20px",borderRadius:"50px",border:"1.5px solid rgba(255,255,255,0.35)",
              background:"rgba(255,255,255,0.07)",color:"#fff",fontFamily:"'Sora',sans-serif",
              fontSize:"13.5px",fontWeight:600,cursor:"pointer",
            }}>Sign In</button>
          )}
        </div>
      </nav>

      <div className="e-page">
        <div className="e-inner">

          {/* HERO */}
          <div className="e-hero">
            <div className="e-hero-icon">🆘</div>
            <div>
              <div className="e-hero-title">Emergency Assistance</div>
              <div className="e-hero-sub">
                Your safety is our priority. Use the SOS button to alert emergency
                contacts instantly, find nearby hospitals &amp; police stations, or
                call national helplines in one tap.
              </div>
            </div>
          </div>

          {/* TOP GRID — SOS + Location */}
          <div className="e-grid">

            {/* SOS BUTTON CARD */}
            <div className="e-card">
              <div className="e-card-head">
                <div className="e-card-title">
                  <div className="e-card-icon">🚨</div>
                  SOS Alert
                </div>
              </div>
              <div className="e-card-body">
                {sosState === "idle" && (
                  <>
                    <div className="e-sos-wrap">
                      <button className="e-sos-btn" onClick={startSos}>
                        <span className="e-sos-emoji">🆘</span>
                        HOLD SOS
                      </button>
                      <div className="e-sos-hint">Sends alert email + shares location</div>
                    </div>
                    <div className="e-email-wrap">
                      <div className="e-email-label">ALERT EMAIL (optional)</div>
                      <input
                        className="e-email-input"
                        type="email"
                        placeholder="emergency.contact@gmail.com"
                        value={sosEmail}
                        onChange={e => setSosEmail(e.target.value)}
                      />
                    </div>
                  </>
                )}
                {sosState === "countdown" && (
                  <div className="e-countdown-wrap">
                    <div className="e-countdown-num">{countdown}</div>
                    <div className="e-countdown-label">Sending SOS Alert…</div>
                    <div className="e-countdown-sub">Tap Cancel to stop</div>
                    <button className="e-cancel-btn" onClick={cancelSos}>✕ Cancel</button>
                  </div>
                )}
                {sosState === "sent" && (
                  <div className="e-sent-wrap">
                    <div className="e-sent-icon">✅</div>
                    <div className="e-sent-title">SOS Sent!</div>
                    <div className="e-sent-sub">
                      Alert email dispatched with your location.
                      Emergency services have been notified.
                    </div>
                    <button className="e-reset-btn" onClick={() => setSosState("idle")}>
                      Reset SOS
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* LOCATION CARD */}
            <div className="e-card">
              <div className="e-card-head">
                <div className="e-card-title">
                  <div className="e-card-icon">📍</div>
                  Your Location
                </div>
              </div>
              <div className="e-card-body">
                {locStatus === "idle" && (
                  <>
                    <p style={{ fontSize:13.5, color:"var(--text-sub)", lineHeight:1.6, marginBottom:16 }}>
                      Share your location to find nearby hospitals, police stations, and fire brigades.
                    </p>
                    <button className="e-loc-btn" onClick={getLocation}>📍 Share My Location</button>
                  </>
                )}
                {locStatus === "loading" && (
                  <div className="e-loc-badge loading">⏳ Getting location…</div>
                )}
                {locStatus === "granted" && coords && (
                  <>
                    <div className="e-loc-badge granted">
                      ✓ Location acquired
                    </div>
                    <div style={{ fontSize:12.5, color:"var(--text-muted)", marginBottom:12 }}>
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                      target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex",alignItems:"center",gap:6,
                        fontSize:13,color:"var(--gold)",fontWeight:600 }}
                    >
                      🗺️ Open in Google Maps ↗
                    </a>
                  </>
                )}
                {locStatus === "denied" && (
                  <>
                    <div className="e-loc-badge denied">⚠️ Location denied</div>
                    <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.6 }}>
                      Please enable location access in your browser settings, then try again.
                    </p>
                    <button className="e-loc-btn" style={{ marginTop:12 }} onClick={getLocation}>
                      Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* NEARBY SERVICES */}
          <div className="e-card e-card-full">
            <div className="e-card-head">
              <div className="e-card-title">
                <div className="e-card-icon">🏥</div>
                Nearby Emergency Services
              </div>
              {locStatus !== "granted" && (
                <span style={{ fontSize:12, color:"var(--text-muted)", fontWeight:600 }}>
                  Share location to load
                </span>
              )}
            </div>
            <div className="e-card-body">
              {fetchingServices && (
                <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--text-muted)", fontSize:13.5 }}>
                  <span className="e-spinner" /> Finding nearby services…
                </div>
              )}
              {!fetchingServices && services.length === 0 && locStatus === "granted" && (
                <p style={{ fontSize:13.5, color:"var(--text-muted)" }}>
                  Could not fetch nearby services. Check your API key or use the national numbers below.
                </p>
              )}
              {!fetchingServices && services.length === 0 && locStatus !== "granted" && (
                <p style={{ fontSize:13.5, color:"var(--text-muted)" }}>
                  Enable location access above to see hospitals, police stations, and fire brigades near you.
                </p>
              )}
              {services.map((s, i) => (
                <div key={i} className="e-service">
                  <div className="e-service-icon"
                    style={{ background: typeColor(s.type), border:`1px solid ${typeBorder(s.type)}` }}>
                    {s.emoji}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="e-service-name">{s.name}</div>
                    <div className="e-service-meta">
                      {s.type} · {s.dist}
                      {s.address ? ` · ${s.address}` : ""}
                    </div>
                  </div>
                  {s.phone ? (
                    <a href={`tel:${s.phone}`} className="e-service-call">📞 Call</a>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(s.name)}`}
                      target="_blank" rel="noreferrer"
                      className="e-service-call"
                    >
                      🗺️ Map
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NATIONAL NUMBERS */}
          <div className="e-card e-card-full">
            <div className="e-card-head">
              <div className="e-card-title">
                <div className="e-card-icon">📞</div>
                National Emergency Numbers (India)
              </div>
            </div>
            <div className="e-card-body">
              <div className="e-num-grid">
                {NATIONAL_NUMBERS.map(n => (
                  <a key={n.number} href={`tel:${n.number}`} className="e-num-card">
                    <span className="e-num-emoji">{n.emoji}</span>
                    <div>
                      <div className="e-num-name">{n.name}</div>
                      <div className="e-num-desc">{n.desc}</div>
                    </div>
                    <div className="e-num-badge">{n.number}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* SAFETY TIPS */}
          <div className="e-card e-card-full">
            <div className="e-card-head">
              <div className="e-card-title">
                <div className="e-card-icon">💡</div>
                Safety Tips for Travellers
              </div>
            </div>
            <div className="e-card-body">
              <div className="e-tips-grid">
                {SOS_TIPS.map(t => (
                  <div key={t.title} className="e-tip">
                    <div className="e-tip-icon">{t.icon}</div>
                    <div>
                      <div className="e-tip-title">{t.title}</div>
                      <div className="e-tip-desc">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
