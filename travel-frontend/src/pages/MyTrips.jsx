import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { getCityHero } from "./Explore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#3b82f6";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: bg, color: "#fff", padding: "13px 20px",
      borderRadius: 12, fontFamily: "'Sora',sans-serif",
      fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
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

    @keyframes mtFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes mtSpin{to{transform:rotate(360deg)}}
    @keyframes mtDropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

    /* Navbar */
    .mt-nav{position:fixed;top:0;left:0;right:0;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;padding:0 5%;z-index:1000;background:rgba(10,10,10,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
    .mt-nav-logo{display:flex;align-items:center;gap:9px;cursor:pointer;}
    .mt-nav-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:30px;}
    .mt-nav-link{color:var(--text-sub);font-size:14px;font-weight:500;position:relative;transition:color .2s;cursor:pointer;}
    .mt-nav-link::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:1.5px;background:var(--gold);transition:width .25s ease;}
    .mt-nav-link:hover{color:#fff} .mt-nav-link:hover::after{width:100%}
    .mt-nav-link.active{color:#fff} .mt-nav-link.active::after{width:100%}
    .mt-nav-actions{display:flex;align-items:center;gap:12px;}
    .mt-avatar-wrap{position:relative;}
    .mt-avatar-trigger{display:flex;align-items:center;gap:9px;cursor:pointer;padding:5px 14px 5px 5px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);backdrop-filter:blur(6px);transition:background .2s;}
    .mt-avatar-trigger:hover{background:rgba(255,255,255,0.11);}
    .mt-avatar-img{width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--gold);}
    .mt-avatar-name{color:#fff;font-size:13.5px;font-weight:600;}
    .mt-avatar-chevron{width:14px;height:14px;color:var(--text-sub);transition:transform .2s;}
    .mt-avatar-chevron.open{transform:rotate(180deg);}
    .mt-dropdown{position:absolute;top:calc(100% + 10px);right:0;background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:8px;min-width:170px;box-shadow:0 20px 50px rgba(0,0,0,0.55);animation:mtDropIn .18s ease;z-index:999;}
    .mt-dropdown-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 14px;border:none;background:none;color:rgba(255,255,255,0.82);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:500;cursor:pointer;border-radius:8px;transition:background .18s;text-align:left;}
    .mt-dropdown-item:hover{background:rgba(255,255,255,0.08);color:#fff;}
    .mt-dropdown-item.danger{color:#ff5a5a} .mt-dropdown-item.danger:hover{background:rgba(255,90,90,0.1)}
    .mt-dropdown-divider{height:1px;background:rgba(255,255,255,0.07);margin:6px 0;}
    .mt-btn-emergency{display:flex;align-items:center;gap:8px;padding:9px 20px;border-radius:50px;border:none;background:var(--accent);color:#fff;font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;transition:background .2s,transform .15s;box-shadow:0 4px 18px rgba(232,52,26,0.35);}
    .mt-btn-emergency:hover{background:var(--accent-hover);transform:translateY(-1px);}
    .pulse-dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:mt-pulse 1.4s ease infinite;}
    @keyframes mt-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.7)}70%{box-shadow:0 0 0 6px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}

    /* Hero */
    .mt-hero{height:200px;background:linear-gradient(135deg,#0D0D0D 0%,#1a1012 50%,#0D0D0D 100%);display:flex;align-items:flex-end;padding:0 6% 32px;margin-top:var(--nav-h);position:relative;overflow:hidden;}
    .mt-hero-grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(232,52,26,0.06) 1px,transparent 1px);background-size:30px 30px;opacity:.5;}
    .mt-hero-content{position:relative;z-index:1;animation:mtFadeUp .7s cubic-bezier(0.22,1,0.36,1) both;}
    .mt-hero-eyebrow{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
    .mt-hero-title{font-size:clamp(2rem,4vw,2.8rem);font-weight:900;letter-spacing:-1.5px;color:#fff;}
    .mt-hero-sub{font-family:'Lora',serif;font-style:italic;font-size:14px;color:var(--text-sub);margin-top:6px;}

    /* Page */
    .mt-page{min-height:calc(100vh - var(--nav-h));background:var(--bg);}
    .mt-body{max-width:1200px;margin:0 auto;padding:36px 5% 80px;}

    /* Filter bar */
    .mt-filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 22px;}
    .mt-filter-group{display:flex;flex-direction:column;gap:6px;flex:1;min-width:160px;}
    .mt-filter-label{font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-muted);}
    .mt-filter-input{padding:10px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;outline:none;color:#fff;font-family:'Sora',sans-serif;font-size:13px;font-weight:500;transition:border-color .2s;appearance:none;}
    .mt-filter-input:focus{border-color:rgba(245,166,35,0.5);}
    .mt-filter-input::placeholder{color:var(--text-muted);font-weight:400;}
    .mt-filter-btn{align-self:flex-end;padding:10px 18px;border-radius:10px;border:none;background:var(--surface2);color:var(--text-sub);font-family:'Sora',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .18s;border:1.5px solid var(--border);}
    .mt-filter-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent);}

    /* Stats bar */
    .mt-stats{display:flex;gap:20px;margin-bottom:28px;flex-wrap:wrap;}
    .mt-stat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 20px;display:flex;flex-direction:column;gap:4px;min-width:120px;}
    .mt-stat-val{font-size:22px;font-weight:800;color:#fff;letter-spacing:-1px;}
    .mt-stat-label{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);}

    /* Grid */
    .mt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;}

    /* Trip card */
    .mt-trip-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:all .25s ease;animation:mtFadeUp .4s cubic-bezier(0.22,1,0.36,1) both;cursor:pointer;}
    .mt-trip-card:hover{border-color:var(--border-hover);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.4);}
    .mt-trip-img{width:100%;height:160px;object-fit:cover;background:#1e1e1e;display:block;}
    .mt-trip-body{padding:18px 20px;}
    .mt-trip-city{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.5px;margin-bottom:8px;}
    .mt-trip-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
    .mt-trip-date{font-size:12px;font-weight:600;color:var(--gold);background:rgba(245,166,35,0.1);border:1px solid rgba(245,166,35,0.2);padding:3px 10px;border-radius:20px;}
    .mt-trip-count{font-size:12px;font-weight:600;color:var(--text-muted);}
    .mt-trip-route{font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:14px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
    .mt-trip-dist{font-size:11.5px;color:#60a5fa;font-weight:600;margin-bottom:14px;}
    .mt-trip-actions{display:flex;gap:9px;}
    .mt-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;border:none;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;}
    .mt-btn-primary{background:var(--accent);color:#fff;box-shadow:0 3px 12px rgba(232,52,26,0.25);}
    .mt-btn-primary:hover{background:var(--accent-hover);}
    .mt-btn-ghost{background:transparent;color:var(--text-sub);border:1.5px solid var(--border);}
    .mt-btn-ghost:hover{background:var(--surface2);color:#fff;}
    .mt-btn-danger{background:rgba(255,90,90,0.1);color:#ff5a5a;border:1.5px solid rgba(255,90,90,0.2);}
    .mt-btn-danger:hover{background:rgba(255,90,90,0.18);}
    .mt-btn-sm{padding:8px 13px;font-size:12px;}

    /* Empty state */
    .mt-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center;}
    .mt-empty-icon{font-size:56px;opacity:.4;}
    .mt-empty-title{font-size:20px;font-weight:800;color:#fff;}
    .mt-empty-sub{font-size:14px;color:var(--text-muted);max-width:320px;line-height:1.65;}

    /* Spinner */
    .mt-spinner{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.2);border-top-color:#fff;animation:mtSpin .75s linear infinite;display:inline-block;}
    .mt-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;gap:16px;}
    .mt-loading-spinner{width:44px;height:44px;border-radius:50%;border:3.5px solid rgba(245,166,35,0.15);border-top-color:var(--gold);animation:mtSpin .9s linear infinite;}

    /* Confirm dialog */
    .mt-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:9990;display:flex;align-items:center;justify-content:center;}
    .mt-confirm-modal{background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;width:90%;max-width:380px;box-shadow:0 24px 60px rgba(0,0,0,0.7);}
    .mt-confirm-title{font-size:17px;font-weight:800;color:#fff;margin-bottom:8px;}
    .mt-confirm-sub{font-size:13.5px;color:var(--text-muted);margin-bottom:22px;line-height:1.6;}
    .mt-confirm-actions{display:flex;gap:10px;}

    @media(max-width:768px){
      .mt-nav-links{display:none;}
      .mt-grid{grid-template-columns:1fr;}
      .mt-filters{flex-direction:column;}
    }
  `}</style>
);

// ── Main Component ─────────────────────────────────────────────────────────
export default function MyTrips() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("velora_token");

  const [user, setUser]               = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [toast, setToast]             = useState(null);

  const [trips, setTrips]             = useState([]);
  const [loading, setLoading]         = useState(true);

  // Filters
  const [filterCity, setFilterCity]   = useState("");
  const [filterDate, setFilterDate]   = useState("");

  // Delete confirm
  const [confirmId, setConfirmId]     = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const showToast = useCallback((msg, type = "info") => setToast({ message: msg, type }), []);

  // ── Load user, auth guard ──
  useEffect(() => {
    const stored = localStorage.getItem("velora_user");
    if (!stored) { navigate("/login"); return; }
    try { setUser(JSON.parse(stored)); } catch {}
  }, [navigate]);

  // ── Close dropdown ──
  useEffect(() => {
    const h = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [dropdownOpen]);

  const fetchTrips = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCity) params.set("city", filterCity);
      const res  = await fetch(`${BASE_URL}/trips?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setTrips(data);
    } catch { setTrips([]); }
    finally { setLoading(false); }
  }, [token, filterCity]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/trip/${confirmId}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Trip deleted", "info"); fetchTrips(); }
      else { const d = await res.json(); showToast(d.error || "Delete failed", "error"); }
    } catch { showToast("Network error", "error"); }
    finally { setDeleting(false); setConfirmId(null); }
  };

  const handleViewRoute = (trip) => {
    navigate("/route", { state: { tripId: trip._id } });
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("velora_user");
    localStorage.removeItem("velora_token");
    navigate("/");
  };

  // Apply date filter client-side — matches day, month name, or year as substring
  const displayedTrips = filterDate.trim()
    ? trips.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        // Build a searchable string: "13 April 2026"
        const searchable = d.toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        }).toLowerCase();
        return searchable.includes(filterDate.trim().toLowerCase());
      })
    : trips;

  const totalKm = trips.reduce((s, t) => s + (t.totalDistanceKm || 0), 0).toFixed(1);
  const upcoming = trips.filter(t => t.date && new Date(t.date) >= new Date()).length;

  return (
    <>
      <Styles />

      {/* Delete confirm */}
      {confirmId && (
        <div className="mt-confirm-overlay" onClick={() => setConfirmId(null)}>
          <div className="mt-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="mt-confirm-title">Delete this trip?</div>
            <div className="mt-confirm-sub">This action cannot be undone. The trip and all its data will be permanently removed.</div>
            <div className="mt-confirm-actions">
              <button className="mt-btn mt-btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="mt-btn mt-btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className="mt-spinner" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency */}
      {emergencyOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setEmergencyOpen(false)}>
          <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 32, width: "90%", maxWidth: 480, boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <span style={{ fontSize: 36 }}>🚨</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Emergency Contacts</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Tap any number to call immediately</div>
              </div>
            </div>
            {[
              { icon: "🏥", name: "Ambulance / Medical", loc: "National Emergency", phone: "108" },
              { icon: "👮", name: "Police Control Room",  loc: "All India",         phone: "100" },
              { icon: "🔥", name: "Fire Brigade",         loc: "All India",         phone: "101" },
              { icon: "📞", name: "Emergency Helpline",   loc: "Unified Number",    phone: "112" },
              { icon: "🚺", name: "Women Helpline",       loc: "National",          phone: "1091" },
              { icon: "🩺", name: "Tourist Help",         loc: "India Tourism",     phone: "1800-111-363" },
            ].map(e => (
              <div key={e.phone} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{e.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{e.loc}</div>
                  </div>
                </div>
                <a href={`tel:${e.phone}`}>
                  <button style={{ padding: "7px 14px", borderRadius: 9, border: "none", background: "rgba(232,52,26,0.15)", color: "var(--accent)", fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{e.phone}</button>
                </a>
              </div>
            ))}
            <button className="mt-btn mt-btn-ghost" style={{ width: "100%", borderRadius: 12, marginTop: 14 }} onClick={() => setEmergencyOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Navbar */}
      <nav className="mt-nav">
        <div className="mt-nav-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={30} textColor="#fff" />
        </div>
        <div className="mt-nav-links">
          <span className="mt-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="mt-nav-link" onClick={() => navigate("/distance")}>Distance</span>
          <span className="mt-nav-link" onClick={() => navigate("/suggestions")}>Suggestions</span>
          <span className="mt-nav-link active">My Trips</span>
        </div>
        <div className="mt-nav-actions">
          {user ? (
            <div className="mt-avatar-wrap" onClick={e => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
              <div className="mt-avatar-trigger">
                <img src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=E8341A&color=fff`}
                  alt="profile" className="mt-avatar-img" />
                <span className="mt-avatar-name">{user.name?.split(" ")[0] || "User"}</span>
                <svg className={`mt-avatar-chevron${dropdownOpen ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {dropdownOpen && (
                <div className="mt-dropdown" onClick={e => e.stopPropagation()}>
                  <button className="mt-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/profile"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    Profile
                  </button>
                  <div className="mt-dropdown-divider" />
                  <button className="mt-dropdown-item danger" onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="mt-btn mt-btn-ghost mt-btn-sm" onClick={() => navigate("/login")}>Sign In</button>
          )}
          <button className="mt-btn-emergency" onClick={() => setEmergencyOpen(true)}>
            <span className="pulse-dot" /> Emergency
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="mt-hero">
        <div className="mt-hero-grid" />
        <div className="mt-hero-content">
          <p className="mt-hero-eyebrow">✦ Your Adventures</p>
          <h1 className="mt-hero-title">My Trips</h1>
          <p className="mt-hero-sub">All your saved journeys in one place</p>
        </div>
      </div>

      <div className="mt-page">
        <div className="mt-body">

          {/* Stats */}
          {!loading && trips.length > 0 && (
            <div className="mt-stats">
              {[
                { label: "Total Trips",    val: trips.length },
                { label: "KM Planned",     val: `${totalKm} km` },
                { label: "Upcoming",       val: upcoming },
                { label: "Cities",         val: [...new Set(trips.map(t => t.city))].length },
              ].map(s => (
                <div className="mt-stat" key={s.label}>
                  <div className="mt-stat-val">{s.val}</div>
                  <div className="mt-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="mt-filters">
            <div className="mt-filter-group">
              <label className="mt-filter-label">City</label>
              <input className="mt-filter-input" placeholder="e.g. Goa, Paris…"
                value={filterCity} onChange={e => setFilterCity(e.target.value)} />
            </div>
            <div className="mt-filter-group">
              <label className="mt-filter-label">Date</label>
              <input className="mt-filter-input" placeholder="e.g. April, 2026, 13 Apr…"
                value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
            <div className="mt-filter-group" style={{ justifyContent: "flex-end" }}>
              <button className="mt-filter-btn" onClick={() => { setFilterCity(""); setFilterDate(""); }}>
                Clear
              </button>
            </div>
          </div>

          {/* Explore button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
            <button className="mt-btn mt-btn-primary" onClick={() => navigate("/")}>
              + Explore New City
            </button>
          </div>

          {/* Trips grid */}
          {loading ? (
            <div className="mt-loading">
              <div className="mt-loading-spinner" />
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading your trips…</div>
            </div>
          ) : displayedTrips.length === 0 ? (
            <div className="mt-empty">
              <div className="mt-empty-icon">✈️</div>
              <div className="mt-empty-title">No trips found</div>
              <div className="mt-empty-sub">
                {filterCity || filterDate
                  ? "No trips match your filters. Try clearing them."
                  : "Start exploring a city and save your first trip!"}
              </div>
              <button className="mt-btn mt-btn-primary" style={{ marginTop: 8 }} onClick={() => navigate("/")}>
                Explore Now
              </button>
            </div>
          ) : (
            <div className="mt-grid">
              {displayedTrips.map((trip, i) => {
                const isUpcoming = trip.date && new Date(trip.date) >= new Date();
                const routePreview = (trip.route?.length ? trip.route : trip.places || [])
                  .slice(0, 3).join(" → ") +
                  ((trip.route?.length || trip.places?.length || 0) > 3 ? " …" : "");
                const placesCount = (trip.route?.length || trip.places?.length || 0);

                return (
                  <div key={trip._id} className="mt-trip-card"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => handleViewRoute(trip)}>
                    <img
                      src={getCityHero(trip.city)}
                      alt={trip.city}
                      className="mt-trip-img"
                      onError={e => { e.target.src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80"; }}
                    />
                    <div className="mt-trip-body">
                      <div className="mt-trip-city">{trip.city}</div>
                      <div className="mt-trip-meta">
                        {trip.date && (
                          <span className="mt-trip-date">
                            {new Date(trip.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        <span className="mt-trip-count">{placesCount} place{placesCount !== 1 ? "s" : ""}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          background: isUpcoming ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.06)",
                          color: isUpcoming ? "#4ade80" : "var(--text-muted)",
                        }}>
                          {isUpcoming ? "Upcoming" : "Past"}
                        </span>
                      </div>
                      {routePreview && (
                        <div className="mt-trip-route">{routePreview}</div>
                      )}
                      {trip.totalDistanceKm > 0 && (
                        <div className="mt-trip-dist">📍 {trip.totalDistanceKm} km planned</div>
                      )}
                      <div className="mt-trip-actions" onClick={e => e.stopPropagation()}>
                        <button className="mt-btn mt-btn-primary" style={{ flex: 1 }}
                          onClick={() => handleViewRoute(trip)}>
                          View Route →
                        </button>
                        <button className="mt-btn mt-btn-danger mt-btn-sm"
                          onClick={() => setConfirmId(trip._id)}>
                          🗑️
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
