import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function formatDistance(metres) {
  if (!metres && metres !== 0) return "—";
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${metres} m`;
}

// ── Styles ─────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent:#E8341A; --accent-hover:#c9270e; --gold:#F5A623;
      --white:#FFFFFF; --bg:#0D0D0D; --surface:#161616; --surface2:#1e1e1e;
      --border:rgba(255,255,255,0.08); --border-hover:rgba(255,255,255,0.18);
      --text-muted:rgba(255,255,255,0.45); --text-sub:rgba(255,255,255,0.65);
      --nav-h:68px; --green:#22c55e;
    }
    html,body{margin:0;padding:0;width:100%;min-height:100vh;overflow-x:hidden;background:var(--bg);font-family:'Sora',sans-serif;color:var(--white);}
    ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}

    @keyframes di-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes di-spin{to{transform:rotate(360deg)}}
    @keyframes di-dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes di-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.7)}70%{box-shadow:0 0 0 6px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
    @keyframes di-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}

    /* Navbar */
    .di-nav{position:fixed;top:0;left:0;right:0;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;padding:0 5%;z-index:1000;background:rgba(10,10,10,0.94);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
    .di-nav-logo{display:flex;align-items:center;gap:9px;cursor:pointer;}
    .di-nav-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:30px;}
    .di-nav-link{color:var(--text-sub);text-decoration:none;font-size:14px;font-weight:500;position:relative;transition:color .2s;cursor:pointer;}
    .di-nav-link::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:1.5px;background:var(--gold);transition:width .25s ease;}
    .di-nav-link:hover{color:#fff} .di-nav-link:hover::after{width:100%}
    .di-nav-link.active{color:#fff} .di-nav-link.active::after{width:100%;background:var(--accent);}
    .di-nav-actions{display:flex;align-items:center;gap:12px;}
    .di-avatar-wrap{position:relative;}
    .di-avatar-trigger{display:flex;align-items:center;gap:9px;cursor:pointer;padding:5px 14px 5px 5px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);backdrop-filter:blur(6px);transition:background .2s;}
    .di-avatar-trigger:hover{background:rgba(255,255,255,0.11);}
    .di-avatar-img{width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--gold);}
    .di-avatar-name{color:#fff;font-size:13.5px;font-weight:600;}
    .di-avatar-chevron{width:14px;height:14px;color:var(--text-sub);transition:transform .2s;}
    .di-avatar-chevron.open{transform:rotate(180deg);}
    .di-dropdown{position:absolute;top:calc(100% + 10px);right:0;background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:8px;min-width:170px;box-shadow:0 20px 50px rgba(0,0,0,0.55);animation:di-dropIn .18s ease;z-index:999;}
    .di-dropdown-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 14px;border:none;background:none;color:rgba(255,255,255,0.82);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:500;cursor:pointer;border-radius:8px;transition:background .18s;text-align:left;}
    .di-dropdown-item:hover{background:rgba(255,255,255,0.08);color:#fff;}
    .di-dropdown-item.danger{color:#ff5a5a} .di-dropdown-item.danger:hover{background:rgba(255,90,90,0.1)}
    .di-dropdown-divider{height:1px;background:rgba(255,255,255,0.07);margin:6px 0;}
    .di-btn-sm{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.18);background:transparent;color:#fff;font-family:'Sora',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
    .di-btn-sm:hover{background:rgba(255,255,255,0.07);}

    /* Page */
    .di-page{min-height:100vh;background:var(--bg);padding-top:var(--nav-h);}
    .di-hero{background:linear-gradient(135deg,#1a0a00 0%,#0a0a0a 50%,#0a0a1a 100%);padding:48px 5% 40px;border-bottom:1px solid var(--border);}
    .di-hero-label{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:10px;}
    .di-hero-title{font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:900;letter-spacing:-1px;line-height:1.1;margin-bottom:8px;}
    .di-hero-sub{font-size:14px;color:var(--text-sub);font-weight:400;}

    .di-body{max-width:860px;margin:0 auto;padding:28px 5% 80px;}

    /* Suggestion box */
    .di-suggest-box{background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:22px 24px 18px;margin-bottom:24px;animation:di-fadeUp .35s ease both;}
    .di-suggest-box:hover{border-color:var(--border-hover);}
    .di-suggest-header{display:flex;align-items:center;gap:9px;margin-bottom:14px;}
    .di-suggest-icon{width:32px;height:32px;border-radius:9px;background:rgba(245,166,35,0.12);border:1px solid rgba(245,166,35,0.2);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
    .di-suggest-title{font-size:13px;font-weight:700;color:#fff;}
    .di-suggest-sub{font-size:11px;color:var(--text-muted);margin-top:1px;}
    .di-suggest-scroll{display:flex;align-items:center;gap:10px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;}
    .di-suggest-scroll::-webkit-scrollbar{height:3px} .di-suggest-scroll::-webkit-scrollbar-track{background:transparent} .di-suggest-scroll::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
    .di-suggest-chip{display:flex;align-items:center;gap:7px;flex-shrink:0;padding:8px 16px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:var(--text-sub);font-family:'Sora',sans-serif;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .2s;}
    .di-suggest-chip:hover{border-color:rgba(245,166,35,0.45);background:rgba(245,166,35,0.08);color:#fff;}
    .di-suggest-chip.selected{border-color:var(--gold);background:rgba(245,166,35,0.12);color:var(--gold);}
    .di-suggest-chip-icon{font-size:14px;}

    /* Search card */
    .di-search-card{background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:28px 28px 24px;margin-bottom:28px;animation:di-fadeUp .4s ease both;}
    .di-search-card:hover{border-color:var(--border-hover);}
    .di-input-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
    .di-input-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;}
    .di-input-dot.origin{background:var(--accent);}
    .di-input-dot.dest{background:var(--gold);}
    .di-input-wrap{flex:1;position:relative;}
    .di-input{width:100%;background:#242424;border:1.5px solid rgba(255,255,255,0.1);border-radius:12px;padding:13px 46px 13px 16px;color:#fff;font-family:'Sora',sans-serif;font-size:14px;font-weight:500;outline:none;transition:border-color .2s;}
    .di-input:focus{border-color:rgba(255,255,255,0.3);}
    .di-input::placeholder{color:var(--text-muted);}
    .di-input-clear{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:16px;line-height:1;padding:2px 4px;transition:color .15s;}
    .di-input-clear:hover{color:#fff;}
    .di-loc-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1.5px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.08);color:var(--green);font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s;}
    .di-loc-btn:hover:not(:disabled){background:rgba(34,197,94,0.15);border-color:rgba(34,197,94,0.5);}
    .di-loc-btn:disabled{opacity:.5;cursor:not-allowed;}
    .di-divider-row{display:flex;align-items:center;gap:12px;margin-bottom:4px;}
    .di-divider-line{flex:1;height:1px;background:var(--border);}
    .di-swap-btn{width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.15);background:var(--surface2);color:var(--text-sub);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .2s;flex-shrink:0;}
    .di-swap-btn:hover{border-color:rgba(255,255,255,0.35);color:#fff;transform:rotate(180deg);}
    .di-go-btn{width:100%;margin-top:20px;padding:14px;border-radius:14px;border:none;background:var(--accent);color:#fff;font-family:'Sora',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.3px;display:flex;align-items:center;justify-content:center;gap:10px;}
    .di-go-btn:hover:not(:disabled){background:var(--accent-hover);transform:translateY(-1px);}
    .di-go-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
    .di-spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:di-spin .7s linear infinite;}

    /* Results card */
    .di-result-card{background:var(--surface);border:1px solid var(--border);border-radius:22px;overflow:hidden;animation:di-fadeUp .45s ease both;margin-bottom:24px;}
    .di-result-header{padding:20px 24px 18px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:12px;}
    .di-result-icon{width:38px;height:38px;border-radius:11px;background:rgba(232,52,26,0.12);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
    .di-result-title{font-size:13px;font-weight:700;color:#fff;margin-bottom:4px;}
    .di-result-sub{font-size:12px;color:var(--text-muted);line-height:1.5;}
    .di-stats-row{display:flex;padding:26px 28px;gap:0;}
    .di-stat{flex:1;text-align:center;padding:0 16px;}
    .di-stat + .di-stat{border-left:1px solid var(--border);}
    .di-stat-value{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:900;letter-spacing:-1px;margin-bottom:4px;}
    .di-stat-value.dist{color:var(--gold);}
    .di-stat-value.time{color:var(--green);}
    .di-stat-label{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);}
    .di-mode-badge{display:inline-flex;align-items:center;gap:6px;margin:0 28px 22px;padding:6px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;font-size:12px;font-weight:600;color:var(--text-sub);}
    .di-addr-row{display:flex;flex-direction:column;gap:10px;padding:0 28px 26px;}
    .di-addr-item{display:flex;align-items:flex-start;gap:10px;}
    .di-addr-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:3px;}
    .di-addr-dot.origin{background:var(--accent);}
    .di-addr-dot.dest{background:var(--gold);}
    .di-addr-text{font-size:13px;color:var(--text-sub);line-height:1.5;}
    .di-addr-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px;}

    /* Map card */
    .di-map-card{background:var(--surface);border:1px solid var(--border);border-radius:22px;overflow:hidden;animation:di-fadeUp .5s ease .05s both;}
    .di-map-header{padding:18px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}
    .di-map-title{font-size:14px;font-weight:700;}
    .di-map-icon{width:32px;height:32px;border-radius:9px;background:rgba(59,130,246,0.12);display:flex;align-items:center;justify-content:center;font-size:15px;}
    .di-map-frame{width:100%;height:420px;border:none;display:block;}

    /* Error / empty */
    .di-error{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:14px;padding:16px 20px;font-size:14px;color:#ff7070;font-weight:500;display:flex;align-items:center;gap:10px;margin-bottom:20px;animation:di-fadeUp .3s ease both;}

    @media(max-width:700px){
      .di-nav-links{display:none;}
      .di-stats-row{flex-direction:column;gap:20px;}
      .di-stat + .di-stat{border-left:none;border-top:1px solid var(--border);padding-top:20px;}
      .di-input-row{flex-wrap:wrap;}
      .di-loc-btn{width:100%;}
    }
  `}</style>
);

// ── Chevron SVG ────────────────────────────────────────────────────────────
const Chevron = ({ open }) => (
  <svg className={`di-avatar-chevron${open ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────────
export default function Distance() {
  const navigate  = useNavigate();

  // Auth
  const [user, setUser]           = useState(null);
  const [dropOpen, setDropOpen]   = useState(false);

  // Inputs
  const [originText, setOriginText]   = useState("");
  const [destText, setDestText]       = useState("");
  const [originCoords, setOriginCoords] = useState(null); // {lat, lng} if using GPS
  const [destCoords, setDestCoords]   = useState(null);

  // State
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null); // { distance, duration, originAddress, destinationAddress, mapUrl }
  const [error, setError]       = useState("");
  const [locLoading, setLocLoading] = useState(false); // for origin GPS
  const [destLocLoading, setDestLocLoading] = useState(false); // for dest GPS

  const dropRef = useRef(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("velora_user");
    const token  = localStorage.getItem("velora_token");
    if (stored || token) {
      const u = stored ? JSON.parse(stored) : {};
      setUser({ name: u.name || u.email || "Traveler" });
    }
    const unsub = auth.onAuthStateChanged(u => {
      if (u) setUser({ name: u.displayName || u.email || "Traveler" });
    });
    return unsub;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem("velora_token");
    localStorage.removeItem("velora_user");
    setUser(null);
    setDropOpen(false);
  };

  // ── Geolocation helper ────────────────────────────────────────────────────
  const getGPS = useCallback((forDest = false) => {
    if (!navigator.geolocation) { setError("Geolocation is not supported by your browser."); return; }
    if (forDest) setDestLocLoading(true); else setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const coordStr = `${coords.lat},${coords.lng}`;
        if (forDest) {
          setDestCoords(coords);
          setDestText("Current Location");
          setDestLocLoading(false);
        } else {
          setOriginCoords(coords);
          setOriginText("Current Location");
          setLocLoading(false);
        }
        setError("");
      },
      () => {
        setError("Could not access your location. Please allow location permission or type an address.");
        if (forDest) setDestLocLoading(false); else setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Swap ──────────────────────────────────────────────────────────────────
  const handleSwap = () => {
    const tmpText   = originText;
    const tmpCoords = originCoords;
    setOriginText(destText);
    setOriginCoords(destCoords);
    setDestText(tmpText);
    setDestCoords(tmpCoords);
    setResult(null);
    setError("");
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const o = originCoords ? `${originCoords.lat},${originCoords.lng}` : originText.trim();
    const d = destCoords   ? `${destCoords.lat},${destCoords.lng}`     : destText.trim();

    if (!o) { setError("Please enter or select a starting point."); return; }
    if (!d) { setError("Please enter or select a destination."); return; }
    if (o === d) { setError("Origin and destination are the same."); return; }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res  = await fetch(`${API}/api/distance`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ origin: o, destination: d }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch distance");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Suggestion bar data ───────────────────────────────────────────────────
  const SUGGESTIONS = [
    { icon: "🏖️", label: "Mumbai → Goa" },
    { icon: "🏔️", label: "Delhi → Manali" },
    { icon: "🕌", label: "Mumbai → Jaipur" },
    { icon: "🌊", label: "Chennai → Pondicherry" },
    { icon: "🏯", label: "Delhi → Agra" },
    { icon: "🌿", label: "Bengaluru → Coorg" },
    { icon: "❄️", label: "Delhi → Shimla" },
    { icon: "⛵", label: "Mumbai → Alibaug" },
  ];

  const handleSuggestionClick = (suggestion) => {
    const parts = suggestion.label.split("→").map(s => s.trim());
    if (parts.length === 2) {
      setOriginText(parts[0]);
      setOriginCoords(null);
      setDestText(parts[1]);
      setDestCoords(null);
      setResult(null);
      setError("");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Styles />

      {/* ── Navbar ── */}
      <nav className="di-nav">
        <div className="di-nav-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={32} />
        </div>

        <div className="di-nav-links">
          <span className="di-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="di-nav-link active">Distance</span>
          <span className="di-nav-link" onClick={() => navigate("/my-trips")}>My Trips</span>
          <span className="di-nav-link" onClick={() => navigate("/suggestions")}>Suggestions</span>
        </div>

        <div className="di-nav-actions">
          {user ? (
            <div className="di-avatar-wrap" ref={dropRef}>
              <div className="di-avatar-trigger" onClick={() => setDropOpen(o => !o)}>
                <div className="di-avatar-img" style={{ background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="di-avatar-name">{user.name?.split(" ")[0]}</span>
                <Chevron open={dropOpen} />
              </div>
              {dropOpen && (
                <div className="di-dropdown">
                  <button className="di-dropdown-item" onClick={() => { setDropOpen(false); navigate("/profile"); }}>
                    <span>👤</span> Profile
                  </button>
                  <div className="di-dropdown-divider" />
                  <button className="di-dropdown-item danger" onClick={handleSignOut}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="di-btn-sm" onClick={() => navigate("/login")}>Sign In</button>
          )}
        </div>
      </nav>

      <div className="di-page">
        <div className="di-body">

          {/* ── Suggestion Box ── */}
          <div className="di-suggest-box">
            <div className="di-suggest-header">
              <div className="di-suggest-icon">✨</div>
              <div>
                <div className="di-suggest-title">Popular Routes</div>
                <div className="di-suggest-sub">Tap any route to auto-fill</div>
              </div>
            </div>
            <div className="di-suggest-scroll">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className={`di-suggest-chip${originText === s.label.split("→")[0].trim() && destText === s.label.split("→")[1].trim() ? " selected" : ""}`}
                  onClick={() => handleSuggestionClick(s)}
                >
                  <span className="di-suggest-chip-icon">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Search Card ── */}
          <div className="di-search-card">

            {/* Origin */}
            <div className="di-input-row">
              <div className="di-input-dot origin" />
              <div className="di-input-wrap">
                <input
                  className="di-input"
                  placeholder="From — enter a city, address, or landmark"
                  value={originText}
                  onChange={e => { setOriginText(e.target.value); setOriginCoords(null); setResult(null); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                {originText && (
                  <button className="di-input-clear" onClick={() => { setOriginText(""); setOriginCoords(null); setResult(null); }}>✕</button>
                )}
              </div>
              <button
                className="di-loc-btn"
                onClick={() => getGPS(false)}
                disabled={locLoading}
                title="Use my current location as origin"
              >
                {locLoading ? <span style={{ width: 12, height: 12, border: "2px solid rgba(34,197,94,0.4)", borderTopColor: "var(--green)", borderRadius: "50%", display: "inline-block", animation: "di-spin .7s linear infinite" }} /> : "📍"}
                {locLoading ? "Locating…" : "My Location"}
              </button>
            </div>

            {/* Swap */}
            <div className="di-divider-row">
              <div className="di-divider-line" />
              <button className="di-swap-btn" onClick={handleSwap} title="Swap origin and destination">⇅</button>
              <div className="di-divider-line" />
            </div>

            {/* Destination */}
            <div className="di-input-row" style={{ marginBottom: 0 }}>
              <div className="di-input-dot dest" />
              <div className="di-input-wrap">
                <input
                  className="di-input"
                  placeholder="To — enter a city, address, or landmark"
                  value={destText}
                  onChange={e => { setDestText(e.target.value); setDestCoords(null); setResult(null); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                {destText && (
                  <button className="di-input-clear" onClick={() => { setDestText(""); setDestCoords(null); setResult(null); }}>✕</button>
                )}
              </div>
              <button
                className="di-loc-btn"
                onClick={() => getGPS(true)}
                disabled={destLocLoading}
                title="Use my current location as destination"
              >
                {destLocLoading ? <span style={{ width: 12, height: 12, border: "2px solid rgba(34,197,94,0.4)", borderTopColor: "var(--green)", borderRadius: "50%", display: "inline-block", animation: "di-spin .7s linear infinite" }} /> : "📍"}
                {destLocLoading ? "Locating…" : "My Location"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="di-error" style={{ marginTop: 16, marginBottom: 0 }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Go button */}
            <button className="di-go-btn" onClick={handleSubmit} disabled={loading || (!originText && !originCoords) || (!destText && !destCoords)}>
              {loading ? <><div className="di-spinner" /> Calculating…</> : <><span>🗺️</span> Get Directions</>}
            </button>
          </div>

          {/* ── Results ── */}
          {result && (
            <>
              <div className="di-result-card">
                {/* Header */}
                <div className="di-result-header">
                  <div className="di-result-icon">🚗</div>
                  <div>
                    <div className="di-result-title">Route Summary</div>
                    <div className="di-result-sub">Fastest route via road · Driving</div>
                  </div>
                </div>

                {/* Big stats */}
                <div className="di-stats-row">
                  <div className="di-stat">
                    <div className="di-stat-value dist">{result.distance?.text || formatDistance(result.distance?.value)}</div>
                    <div className="di-stat-label">Distance</div>
                  </div>
                  <div className="di-stat">
                    <div className="di-stat-value time">{result.duration?.text || formatDuration(result.duration?.value)}</div>
                    <div className="di-stat-label">Est. Travel Time</div>
                  </div>
                </div>

                {/* Mode badge */}
                <div className="di-mode-badge">
                  <span>🚗</span> Driving · Road distance
                </div>

                {/* Addresses */}
                <div className="di-addr-row">
                  <div className="di-addr-item">
                    <div className="di-addr-dot origin" />
                    <div>
                      <div className="di-addr-label">From</div>
                      <div className="di-addr-text">{result.originAddress}</div>
                    </div>
                  </div>
                  <div style={{ width: 1, height: 18, background: "var(--border)", marginLeft: 4 }} />
                  <div className="di-addr-item">
                    <div className="di-addr-dot dest" />
                    <div>
                      <div className="di-addr-label">To</div>
                      <div className="di-addr-text">{result.destinationAddress}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map embed */}
              <div className="di-map-card">
                <div className="di-map-header">
                  <div className="di-map-icon">🗺️</div>
                  <span className="di-map-title">Route Map</span>
                </div>
                <iframe
                  className="di-map-frame"
                  src={result.mapUrl}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Route Map"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
