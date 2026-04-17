import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { CurrentWeatherBlock, getCityHero } from "./Explore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3400); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#3b82f6";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: bg, color: "#fff", padding: "13px 20px",
      borderRadius: 12, fontFamily: "'Sora',sans-serif",
      fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "orFadeUp .3s ease",
    }}>{message}</div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent:#E8341A; --accent-hover:#c9270e; --gold:#F5A623;
      --white:#FFFFFF; --bg:#0D0D0D; --surface:#161616; --surface2:#1e1e1e;
      --border:rgba(255,255,255,0.08); --border-hover:rgba(255,255,255,0.18);
      --text-muted:rgba(255,255,255,0.45); --text-sub:rgba(255,255,255,0.65);
      --nav-h:68px;
    }
    html,body{margin:0;padding:0;width:100%;min-height:100vh;overflow-x:hidden;background:var(--bg);font-family:'Sora',sans-serif;color:var(--white);}
    ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}

    @keyframes orFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes orSpin{to{transform:rotate(360deg)}}
    @keyframes orDropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

    /* Navbar */
    .or-nav{position:fixed;top:0;left:0;right:0;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;padding:0 5%;z-index:1000;background:rgba(10,10,10,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
    .or-nav-logo{display:flex;align-items:center;gap:9px;cursor:pointer;}
    .or-nav-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:30px;}
    .or-nav-link{color:var(--text-sub);text-decoration:none;font-size:14px;font-weight:500;position:relative;transition:color .2s;cursor:pointer;}
    .or-nav-link::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:1.5px;background:var(--gold);transition:width .25s ease;}
    .or-nav-link:hover{color:#fff} .or-nav-link:hover::after{width:100%}
    .or-nav-link.active{color:#fff} .or-nav-link.active::after{width:100%}
    .or-nav-actions{display:flex;align-items:center;gap:12px;}
    .or-avatar-wrap{position:relative;}
    .or-avatar-trigger{display:flex;align-items:center;gap:9px;cursor:pointer;padding:5px 14px 5px 5px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);backdrop-filter:blur(6px);transition:background .2s;}
    .or-avatar-trigger:hover{background:rgba(255,255,255,0.11);}
    .or-avatar-img{width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--gold);}
    .or-avatar-name{color:#fff;font-size:13.5px;font-weight:600;}
    .or-avatar-chevron{width:14px;height:14px;color:var(--text-sub);transition:transform .2s;}
    .or-avatar-chevron.open{transform:rotate(180deg);}
    .or-dropdown{position:absolute;top:calc(100% + 10px);right:0;background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:8px;min-width:170px;box-shadow:0 20px 50px rgba(0,0,0,0.55);animation:orDropIn .18s ease;z-index:999;}
    .or-dropdown-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 14px;border:none;background:none;color:rgba(255,255,255,0.82);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:500;cursor:pointer;border-radius:8px;transition:background .18s;text-align:left;}
    .or-dropdown-item:hover{background:rgba(255,255,255,0.08);color:#fff;}
    .or-dropdown-item.danger{color:#ff5a5a} .or-dropdown-item.danger:hover{background:rgba(255,90,90,0.1)}
    .or-dropdown-divider{height:1px;background:rgba(255,255,255,0.07);margin:6px 0;}
    .or-btn-emergency{display:flex;align-items:center;gap:8px;padding:9px 20px;border-radius:50px;border:none;background:var(--accent);color:#fff;font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;transition:background .2s,transform .15s;box-shadow:0 4px 18px rgba(232,52,26,0.35);}
    .or-btn-emergency:hover{background:var(--accent-hover);transform:translateY(-1px);}
    .pulse-dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:or-pulse 1.4s ease infinite;}
    @keyframes or-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.7)}70%{box-shadow:0 0 0 6px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}

    /* Hero */
    .or-hero{position:relative;height:220px;display:flex;align-items:flex-end;overflow:hidden;background:#000;margin-top:var(--nav-h);}
    .or-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0.28;animation:orHeroZoom 14s ease-in-out forwards;}
    @keyframes orHeroZoom{from{transform:scale(1)}to{transform:scale(1.07)}}
    .or-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,13,13,1) 0%,rgba(13,13,13,0.15) 60%,transparent 100%);}
    .or-hero-content{position:relative;z-index:2;padding:0 6% 28px;animation:orFadeUp .7s cubic-bezier(0.22,1,0.36,1) both;}
    .or-hero-eyebrow{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
    .or-hero-title{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;letter-spacing:-1.5px;color:#fff;line-height:1;}
    .or-date-badge{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:5px 12px;background:rgba(245,166,35,0.12);border:1px solid rgba(245,166,35,0.25);border-radius:20px;font-size:12px;font-weight:600;color:var(--gold);}

    /* Page & layout */
    .or-page{min-height:calc(100vh - var(--nav-h));background:var(--bg);}
    .or-body{max-width:1280px;margin:0 auto;padding:36px 5% 80px;}
    .or-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start;}
    @media(max-width:900px){.or-grid{grid-template-columns:1fr;}.or-nav-links{display:none;}}

    /* Card */
    .or-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:border-color .25s;margin-bottom:24px;}
    .or-card:hover{border-color:var(--border-hover);}
    .or-card-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 18px;border-bottom:1px solid var(--border);}
    .or-card-title{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;color:#fff;}
    .or-card-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;}
    .or-card-icon.green{background:rgba(34,197,94,0.12)} .or-card-icon.blue{background:rgba(59,130,246,0.12)} .or-card-icon.gold{background:rgba(245,166,35,0.15)}
    .or-card-body{padding:22px 24px 26px;}

    /* Buttons */
    .or-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:12px;border:none;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.2px;}
    .or-btn-primary{background:var(--accent);color:#fff;box-shadow:0 4px 20px rgba(232,52,26,0.3);}
    .or-btn-primary:hover{background:var(--accent-hover);transform:translateY(-1px);}
    .or-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
    .or-btn-ghost{background:transparent;color:var(--text-sub);border:1.5px solid var(--border);}
    .or-btn-ghost:hover{background:var(--surface2);color:#fff;border-color:var(--border-hover);}
    .or-btn-sm{padding:8px 14px;font-size:12.5px;border-radius:9px;}
    .or-spinner{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.2);border-top-color:#fff;animation:orSpin .75s linear infinite;display:inline-block;}

    /* Route steps */
    .or-route-steps{display:flex;flex-direction:column;gap:0;margin-bottom:20px;}
    .or-route-step{display:flex;align-items:flex-start;gap:14px;animation:orFadeUp .4s cubic-bezier(0.22,1,0.36,1) both;}
    .or-step-line{display:flex;flex-direction:column;align-items:center;flex-shrink:0;}
    .or-step-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;background:var(--surface2);border:2px solid var(--border);color:var(--text-sub);}
    .or-step-dot.start{background:rgba(232,52,26,0.15);border-color:var(--accent);color:var(--accent);}
    .or-step-dot.end{background:rgba(34,197,94,0.12);border-color:#22c55e;color:#22c55e;}
    .or-step-dot.mid{background:rgba(245,166,35,0.1);border-color:var(--gold);color:var(--gold);}
    .or-step-dot.anchor-start{background:rgba(232,52,26,0.2);border-color:var(--accent);color:var(--accent);}
    .or-step-dot.anchor-end{background:rgba(34,197,94,0.18);border-color:#22c55e;color:#22c55e;}
    .or-step-connector{width:2px;flex:1;min-height:22px;background:linear-gradient(to bottom,var(--gold),transparent);margin:3px 0;opacity:.4;}
    .or-step-connector.accent{background:linear-gradient(to bottom,var(--accent),rgba(232,52,26,0.1));opacity:.6;}
    .or-step-connector.green{background:linear-gradient(to bottom,#22c55e,rgba(34,197,94,0.1));opacity:.6;}
    .or-step-info{padding:4px 0 22px;}
    .or-anchor-name{font-size:13.5px;font-weight:700;color:rgba(255,255,255,0.9);}
    .or-anchor-sub{font-size:11.5px;color:var(--text-muted);margin-top:2px;}
    .or-anchor-dist{font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;display:flex;align-items:center;gap:5px;}
    .or-anchor-dist strong{color:rgba(255,255,255,0.8);}
    .or-step-name{font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;}
    .or-step-dist{font-size:12px;color:var(--text-muted);}

    /* Route summary */
    .or-route-summary{padding:14px 18px;background:var(--surface2);border-radius:12px;border:1px solid var(--border);font-size:13px;font-weight:600;color:#fff;line-height:2;margin-bottom:20px;word-break:break-word;}

    /* Action row */
    .or-action-row{display:flex;gap:12px;flex-wrap:wrap;}

    /* Google Maps iframe */
    .or-map-container{background:var(--surface2);border:1px solid var(--border);border-radius:20px;overflow:hidden;min-height:400px;display:flex;flex-direction:column;}
    .or-map-header{padding:18px 22px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .or-map-title{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;color:#fff;}
    .or-map-iframe{width:100%;height:460px;border:none;display:block;}
    .or-map-placeholder{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:14px;min-height:380px;}
    .or-map-placeholder-icon{font-size:48px;opacity:.4;}
    .or-map-placeholder-text{font-size:14px;color:var(--text-muted);text-align:center;}
    .or-map-loading{display:flex;align-items:center;gap:12px;padding:20px 22px;font-size:13.5px;color:var(--text-sub);}
    .or-map-spinner{width:20px;height:20px;border-radius:50%;border:2.5px solid rgba(245,166,35,0.2);border-top-color:var(--gold);animation:orSpin .9s linear infinite;}
    .or-map-open-link{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#60a5fa;font-weight:600;text-decoration:none;padding:8px 14px;border-radius:9px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);transition:background .18s;}
    .or-map-open-link:hover{background:rgba(59,130,246,0.15);}

    /* Saved badge */
    .or-saved-badge{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:12px;font-size:13.5px;font-weight:700;color:#4ade80;width:100%;justify-content:center;}

    /* Loading full page */
    .or-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:18px;}
    .or-loading-spinner{width:44px;height:44px;border-radius:50%;border:3.5px solid rgba(245,166,35,0.15);border-top-color:var(--gold);animation:orSpin .9s linear infinite;}
    .or-loading-text{font-size:15px;color:var(--text-sub);font-weight:500;}

    /* Weather block (reused classes from Explore.jsx) */
    .ex-weather-block{background:linear-gradient(135deg,#0f2027 0%,#1a3a4a 50%,#2c5364 100%);border:1px solid rgba(96,165,250,0.2);border-radius:20px;padding:22px 26px;margin-bottom:24px;animation:orFadeUp .5s cubic-bezier(0.22,1,0.36,1) both;}
    .ex-weather-live-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#4ade80;font-size:11px;font-weight:700;letter-spacing:.5px;padding:4px 10px;border-radius:20px;margin-bottom:14px;}
    .ex-weather-live-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:or-pulse 1.4s ease infinite;}
    .ex-weather-inner{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
    .ex-weather-left{display:flex;align-items:center;gap:16px;}
    .ex-weather-emoji{font-size:44px;line-height:1;}
    .ex-weather-city{font-size:17px;font-weight:800;color:#fff;letter-spacing:-.5px;}
    .ex-weather-desc{font-size:12.5px;color:rgba(255,255,255,0.6);text-transform:capitalize;margin-top:3px;}
    .ex-weather-temp{font-size:48px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1;}
    .ex-weather-stats{display:flex;align-items:center;background:rgba(0,0,0,0.2);border-radius:12px;padding:12px 18px;flex-wrap:wrap;gap:0;}
    .ex-weather-stat{display:flex;flex-direction:column;gap:3px;padding:0 16px;}
    .ex-weather-stat:first-child{padding-left:0} .ex-weather-stat:last-child{padding-right:0}
    .ex-weather-stat-label{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45);}
    .ex-weather-stat-val{font-size:14px;font-weight:700;color:#fff;}
    .ex-weather-divider{width:1px;height:30px;background:rgba(255,255,255,0.12);flex-shrink:0;}

    /* Emergency */
    .or-emergency-panel{position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);z-index:9998;display:flex;align-items:center;justify-content:center;}
    .or-emergency-modal{background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:32px;width:90%;max-width:480px;box-shadow:0 32px 80px rgba(0,0,0,0.7);}
    .or-emergency-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;}
    .or-emergency-icon{font-size:36px;}
    .or-emergency-title{font-size:18px;font-weight:800;color:#fff;margin-bottom:4px;}
    .or-emergency-sub{font-size:13px;color:var(--text-muted);}
    .or-emergency-numbers{display:flex;flex-direction:column;gap:10px;}
    .or-emergency-number{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:14px;}
    .or-emergency-number-left{display:flex;align-items:center;gap:12px;}
    .or-emergency-num-icon{font-size:22px;}
    .or-emergency-num-name{font-size:13.5px;font-weight:600;color:#fff;}
    .or-emergency-num-loc{font-size:11.5px;color:var(--text-muted);margin-top:2px;}
    .or-emergency-call{padding:8px 16px;border-radius:10px;border:none;background:rgba(232,52,26,0.15);color:var(--accent);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;transition:background .18s;white-space:nowrap;}
    .or-emergency-call:hover{background:rgba(232,52,26,0.28);}

    @media(max-width:768px){
      .or-nav-links{display:none;}
      .ex-weather-inner{flex-direction:column;align-items:flex-start;gap:10px;}
      .ex-weather-stats{flex-direction:column;gap:10px;align-items:flex-start;}
      .ex-weather-divider{display:none;}
      .ex-weather-stat{padding:0;}
    }
  `}</style>
);

// ── Main Component ─────────────────────────────────────────────────────────
export default function OptimizedRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const token    = localStorage.getItem("velora_token");

  const [user, setUser]               = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [toast, setToast]             = useState(null);

  // Trip data (may come from state or be loaded from DB)
  const [city, setCity]               = useState("");
  const [date, setDate]               = useState("");
  const [route, setRoute]             = useState([]);
  const [details, setDetails]         = useState(null);
  const [placesData, setPlacesData]   = useState([]);
  const [weather, setWeather]         = useState(null);
  const [summary, setSummary]         = useState(null);
  const [startPoint, setStartPoint]   = useState(null); // { value, label }
  const [endPoint,   setEndPoint]     = useState(null); // { value, label }
  const [startLeg,   setStartLeg]     = useState(null); // { distToNext, timeToNext, resolvedAddress }
  const [endLeg,     setEndLeg]       = useState(null);

  const [mapUrl, setMapUrl]           = useState(null);
  const [mapLoading, setMapLoading]   = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);

  const showToast = useCallback((msg, type = "info") => setToast({ message: msg, type }), []);

  // ── Load user ──
  useEffect(() => {
    const stored = localStorage.getItem("velora_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
  }, []);

  // ── Close dropdown ──
  useEffect(() => {
    const h = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [dropdownOpen]);

  // ── Initialize from navigation state ──
  useEffect(() => {
    const st = location.state;
    if (!st) { navigate("/"); return; }

    if (st.tripId) {
      // Load from saved trip
      loadSavedTrip(st.tripId);
    } else {
      // Direct navigation from Explore
      setCity(st.city           || "");
      setDate(st.date           || "");
      setRoute(st.route         || []);
      setDetails(st.details     || null);
      setPlacesData(st.placesData || []);
      setWeather(st.weather     || null);
      setSummary(st.summary     || null);
      setStartPoint(st.startPoint || null);
      setEndPoint(st.endPoint   || null);
      setStartLeg(st.startLeg   || null);
      setEndLeg(st.endLeg       || null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch map embed URL when route is ready (includes start/end points) ──
  useEffect(() => {
    if (!route || route.length < 1 || !city) return;
    setMapLoading(true);
    const params = new URLSearchParams();
    params.set("places", route.join("|"));
    params.set("city", city);
    if (startPoint?.value) params.set("start", startPoint.value);
    if (endPoint?.value)   params.set("end",   endPoint.value);
    fetch(`${BASE_URL}/maps/embed?${params}`)
      .then(r => r.json())
      .then(d => { if (d.url) setMapUrl(d.url); })
      .catch(() => {})
      .finally(() => setMapLoading(false));
  }, [route, city, startPoint, endPoint]);

  const loadSavedTrip = async (id) => {
    if (!token) { navigate("/login"); return; }
    setPageLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/trip/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Trip not found", "error"); navigate("/my-trips"); return; }
      const { trip, weather: w } = data;
      setCity(trip.city || "");
      setDate(trip.date ? new Date(trip.date).toISOString().split("T")[0] : "");
      setRoute(trip.route?.length ? trip.route : trip.places || []);
      setDetails(trip.routeDetails?.length ? trip.routeDetails : null);
      setPlacesData(trip.placesData || []);
      setWeather(w || null);
      setSaved(true); // already saved — don't allow re-saving
    } catch { showToast("Failed to load trip", "error"); }
    finally { setPageLoading(false); }
  };

  const handleSave = async () => {
    if (!token) { navigate("/login"); return; }
    setSaving(true);
    try {
      const totalDistanceKm = summary?.totalDistanceKm
        || (details
          ? details.reduce((s, d) => s + (d.distToNext || 0), 0) / 1000
          : 0);

      const res  = await fetch(`${BASE_URL}/save-trip`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          city, date, places: route, route,
          routeDetails: details || [],
          placesData:   placesData || [],
          totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
        }),
      });
      const data = await res.json();
      if (res.ok) { showToast(`Trip to ${city} saved!`, "success"); setSaved(true); }
      else showToast(data.error || "Save failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("velora_user");
    localStorage.removeItem("velora_token");
    setUser(null);
    navigate("/");
  };

  const heroBg = getCityHero(city);

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  // Google Maps directions link — includes start/end if set
  const gmapsLink = route.length >= 1
    ? `https://www.google.com/maps/dir/${[
        startPoint?.value || null,
        ...route.map(p => `${p}, ${city}`),
        endPoint?.value   || null,
      ].filter(Boolean).map(encodeURIComponent).join("/")}`
    : null;

  // Total distance: startLeg + all intermediate legs + endLeg
  const totalDistanceKm = (() => {
    let metres = 0;
    if (startLeg?.distToNext > 0) metres += startLeg.distToNext;
    if (details?.length) {
      for (let i = 0; i < details.length - 1; i++) metres += details[i].distToNext || 0;
      // last detail's distToNext covers the leg to endPoint (if any)
      if (endLeg?.distToNext > 0) metres += endLeg.distToNext;
    }
    if (metres > 0) return (metres / 1000).toFixed(1);
    if (summary?.totalDistanceKm > 0) return Number(summary.totalDistanceKm).toFixed(1);
    return null;
  })();

  if (pageLoading) {
    return (
      <>
        <Styles />
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div className="or-loading-spinner" />
            <div className="or-loading-text">Loading your trip…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Styles />

      {/* Emergency */}
      {emergencyOpen && (
        <div className="or-emergency-panel" onClick={() => setEmergencyOpen(false)}>
          <div className="or-emergency-modal" onClick={e => e.stopPropagation()}>
            <div className="or-emergency-header">
              <div className="or-emergency-icon">🚨</div>
              <div>
                <div className="or-emergency-title">Emergency Contacts</div>
                <div className="or-emergency-sub">Tap any number to call immediately</div>
              </div>
            </div>
            <div className="or-emergency-numbers">
              {[
                { icon: "🏥", name: "Ambulance / Medical", loc: "National Emergency", phone: "108" },
                { icon: "👮", name: "Police Control Room",  loc: "All India",         phone: "100" },
                { icon: "🔥", name: "Fire Brigade",         loc: "All India",         phone: "101" },
                { icon: "📞", name: "Emergency Helpline",   loc: "Unified Number",    phone: "112" },
                { icon: "🚺", name: "Women Helpline",       loc: "National",          phone: "1091" },
                { icon: "🩺", name: "Tourist Help",         loc: "India Tourism",     phone: "1800-111-363" },
              ].map(e => (
                <div key={e.phone} className="or-emergency-number">
                  <div className="or-emergency-number-left">
                    <span className="or-emergency-num-icon">{e.icon}</span>
                    <div>
                      <div className="or-emergency-num-name">{e.name}</div>
                      <div className="or-emergency-num-loc">{e.loc}</div>
                    </div>
                  </div>
                  <a href={`tel:${e.phone}`}><button className="or-emergency-call">{e.phone}</button></a>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="or-btn or-btn-ghost" style={{ width: "100%", borderRadius: 12 }}
                onClick={() => setEmergencyOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Navbar */}
      <nav className="or-nav">
        <div className="or-nav-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={30} textColor="#fff" />
        </div>
        <div className="or-nav-links">
          <span className="or-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="or-nav-link" onClick={() => navigate("/distance")}>Distance</span>
          <span className="or-nav-link" onClick={() => navigate("/my-trips")}>My Trips</span>
        </div>
        <div className="or-nav-actions">
          {user ? (
            <div className="or-avatar-wrap" onClick={e => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
              <div className="or-avatar-trigger">
                <img src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=E8341A&color=fff`}
                  alt="profile" className="or-avatar-img" />
                <span className="or-avatar-name">{user.name?.split(" ")[0] || "User"}</span>
                <svg className={`or-avatar-chevron${dropdownOpen ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {dropdownOpen && (
                <div className="or-dropdown" onClick={e => e.stopPropagation()}>
                  <button className="or-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/profile"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    Profile
                  </button>
                  <div className="or-dropdown-divider" />
                  <button className="or-dropdown-item danger" onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="or-btn or-btn-ghost or-btn-sm" onClick={() => navigate("/login")}>Sign In</button>
          )}
          <button className="or-btn-emergency" onClick={() => setEmergencyOpen(true)}>
            <span className="pulse-dot" /> Emergency
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="or-hero">
        <div className="or-hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="or-hero-overlay" />
        <div className="or-hero-content">
          <p className="or-hero-eyebrow">✦ Optimized Route</p>
          <h1 className="or-hero-title">{city}</h1>
          {formattedDate && (
            <div className="or-date-badge">📅 {formattedDate}</div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="or-page">
        <div className="or-body">
          <div className="or-grid">

            {/* ── LEFT: weather + route list + actions ── */}
            <div>
              {/* Weather block */}
              {weather && <CurrentWeatherBlock weather={weather} />}

              {/* Route card */}
              <div className="or-card">
                <div className="or-card-header">
                  <div className="or-card-title">
                    <div className="or-card-icon green">🛣️</div>
                    Optimized Route
                    {totalDistanceKm && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#4ade80", marginLeft: 6 }}>
                        {totalDistanceKm} km total
                      </span>
                    )}
                  </div>
                </div>
                <div className="or-card-body">
                  <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "11px 16px", marginBottom: 22, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                    ✅ <strong style={{ color: "#4ade80" }}>Best route calculated</strong> — follow this sequence for minimum travel time.
                  </div>

                  <div className="or-route-steps">

                    {/* ── Start anchor (above Stop 1) ── */}
                    {startPoint && (
                      <div className="or-route-step" style={{ animationDelay: "0s" }}>
                        <div className="or-step-line">
                          <div className="or-step-dot anchor-start">🏁</div>
                          <div className="or-step-connector accent" />
                        </div>
                        <div className="or-step-info">
                          <div className="or-anchor-name">{startLeg?.resolvedAddress || startPoint.label}</div>
                          <div className="or-anchor-sub">Starting point</div>
                          {startLeg && startLeg.distToNext > 0 && (
                            <div className="or-anchor-dist">
                              <span>↓</span>
                              <strong>{(startLeg.distToNext / 1000).toFixed(1)} km</strong>
                              · ~{Math.ceil(startLeg.timeToNext / 60)} min to first stop
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {route.map((place, i) => {
                      const isFirst = i === 0, isLast = i === route.length - 1;
                      const detail  = details?.[i];
                      // distToNext = distance from this stop to the NEXT stop
                      const distText = detail && detail.distToNext > 0
                        ? `${(detail.distToNext / 1000).toFixed(1)} km · ~${Math.ceil(detail.timeToNext / 60)} min to next stop`
                        : null;

                      return (
                        <div key={`${place}-${i}`} className="or-route-step" style={{ animationDelay: `${(i + (startPoint ? 1 : 0)) * 0.08}s` }}>
                          <div className="or-step-line">
                            <div className={`or-step-dot ${isFirst && !startPoint ? "start" : isLast && !endPoint ? "end" : "mid"}`}>
                              {isFirst && !startPoint ? "S" : isLast && !endPoint ? "E" : i + 1}
                            </div>
                            {(!isLast || endPoint) && <div className="or-step-connector" />}
                          </div>
                          <div className="or-step-info">
                            <div className="or-step-name">{place}</div>
                            {!isLast && distText && (
                              <div className="or-step-dist">{distText}</div>
                            )}
                            {isLast && endPoint && endLeg && endLeg.distToNext > 0 && (
                              <div className="or-step-dist">
                                {(endLeg.distToNext / 1000).toFixed(1)} km · ~{Math.ceil(endLeg.timeToNext / 60)} min to end point
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* ── End anchor (below last stop) ── */}
                    {endPoint && (
                      <div className="or-route-step" style={{ animationDelay: `${(route.length + (startPoint ? 1 : 0)) * 0.08}s` }}>
                        <div className="or-step-line">
                          <div className="or-step-dot anchor-end">🏠</div>
                        </div>
                        <div className="or-step-info">
                          <div className="or-anchor-name">{endLeg?.resolvedAddress || endPoint.label}</div>
                          <div className="or-anchor-sub">End point</div>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="or-route-summary">
                    {route.join(" → ")}
                  </div>

                  {totalDistanceKm && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: 12, padding: "12px 18px", marginBottom: 16,
                    }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                        Total trip distance
                        {startPoint ? " (from your location)" : ""}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#4ade80", letterSpacing: "-0.5px" }}>
                        {totalDistanceKm} km
                      </span>
                    </div>
                  )}

                  <div className="or-action-row">
                    {saved ? (
                      <div className="or-saved-badge">✅ Trip saved to My Trips</div>
                    ) : user ? (
                      <button className="or-btn or-btn-primary" style={{ flex: 1 }}
                        onClick={handleSave} disabled={saving}>
                        {saving ? <span className="or-spinner" /> : "💾  Save This Trip"}
                      </button>
                    ) : (
                      <button className="or-btn or-btn-primary" style={{ flex: 1 }}
                        onClick={() => navigate("/login")}>
                        Sign In to Save
                      </button>
                    )}
                    <button className="or-btn or-btn-ghost" style={{ flex: 1 }}
                      onClick={() => navigate(-1)}>
                      ← Change Places
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Google Maps ── */}
            <div>
              <div className="or-map-container">
                <div className="or-map-header">
                  <div className="or-map-title">
                    <div className="or-card-icon blue">🗺️</div>
                    Route Map
                  </div>
                  {gmapsLink && (
                    <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="or-map-open-link">
                      Open in Google Maps ↗
                    </a>
                  )}
                </div>

                {mapLoading && (
                  <div className="or-map-loading">
                    <div className="or-map-spinner" />
                    Loading map…
                  </div>
                )}

                {!mapLoading && mapUrl && (
                  <iframe
                    src={mapUrl}
                    className="or-map-iframe"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Route map for ${city}`}
                  />
                )}

                {!mapLoading && !mapUrl && (
                  <div className="or-map-placeholder">
                    <div className="or-map-placeholder-icon">🗺️</div>
                    <div className="or-map-placeholder-text">
                      Map unavailable.<br />
                      {gmapsLink && (
                        <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="or-map-open-link" style={{ marginTop: 12 }}>
                          Open directions in Google Maps ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
