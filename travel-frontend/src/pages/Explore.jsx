import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ── Weather condition → emoji ──────────────────────────────────────────────
const WEATHER_EMOJI = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
  Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
  Haze: "🌫️", Smoke: "🌫️", Dust: "🌪️", Tornado: "🌪️",
};

// ── Haversine distance (metres) ────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R   = 6371000;
  const rad = d => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Hero images ────────────────────────────────────────────────────────────
export const HERO_IMAGES = {
  goa:       "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&q=80",
  manali:    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=80",
  paris:     "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80",
  bali:      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80",
  tokyo:     "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80",
  jaipur:    "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1600&q=80",
  mumbai:    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1600&q=80",
  delhi:     "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&q=80",
  santorini: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1600&q=80",
  varanasi:  "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=1600&q=80",
  hyderabad: "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=1600&q=80",
};
export function getCityHero(city) {
  return HERO_IMAGES[city?.toLowerCase()] ||
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80";
}

// ── CurrentWeatherBlock ────────────────────────────────────────────────────
export const CurrentWeatherBlock = ({ weather }) => {
  if (!weather) return null;
  const emoji = WEATHER_EMOJI[weather.condition] || "🌍";
  return (
    <div className="ex-weather-block">
      <div className="ex-weather-live-badge">
        <span className="ex-weather-live-dot" /> Live Weather Now
      </div>
      <div className="ex-weather-inner">
        <div className="ex-weather-left">
          <div className="ex-weather-emoji">{emoji}</div>
          <div>
            <div className="ex-weather-city">{weather.city}, {weather.country}</div>
            <div className="ex-weather-desc">{weather.description}</div>
          </div>
        </div>
        <div className="ex-weather-temp">{Math.round(weather.temp)}°C</div>
      </div>
      <div className="ex-weather-stats">
        <div className="ex-weather-stat">
          <span className="ex-weather-stat-label">Feels like</span>
          <span className="ex-weather-stat-val">{Math.round(weather.feels_like)}°C</span>
        </div>
        <div className="ex-weather-divider" />
        <div className="ex-weather-stat">
          <span className="ex-weather-stat-label">Humidity</span>
          <span className="ex-weather-stat-val">{weather.humidity}%</span>
        </div>
        <div className="ex-weather-divider" />
        <div className="ex-weather-stat">
          <span className="ex-weather-stat-label">Wind</span>
          <span className="ex-weather-stat-val">{weather.wind_speed} m/s</span>
        </div>
        {weather.visibility != null && <>
          <div className="ex-weather-divider" />
          <div className="ex-weather-stat">
            <span className="ex-weather-stat-label">Visibility</span>
            <span className="ex-weather-stat-val">{weather.visibility} km</span>
          </div>
        </>}
        <div className="ex-weather-divider" />
        <div className="ex-weather-stat">
          <span className="ex-weather-stat-label">High / Low</span>
          <span className="ex-weather-stat-val">{Math.round(weather.temp_max)}° / {Math.round(weather.temp_min)}°</span>
        </div>
      </div>
    </div>
  );
};

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#3b82f6";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: bg, color: "#fff", padding: "13px 20px",
      borderRadius: 12, fontFamily: "'Sora', sans-serif",
      fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "fadeUp 0.3s ease",
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
      --white:#FFFFFF; --black:#0A0A0A; --bg:#0D0D0D;
      --surface:#161616; --surface2:#1e1e1e;
      --border:rgba(255,255,255,0.08); --border-hover:rgba(255,255,255,0.18);
      --text-muted:rgba(255,255,255,0.45); --text-sub:rgba(255,255,255,0.65);
      --nav-h:68px;
    }
    html,body { margin:0;padding:0;width:100%;min-height:100vh;overflow-x:hidden;background:var(--bg);font-family:'Sora',sans-serif;color:var(--white); }
    ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}

    /* Navbar */
    .ex-nav{position:fixed;top:0;left:0;right:0;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;padding:0 5%;z-index:1000;background:rgba(10,10,10,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
    .ex-nav-logo{display:flex;align-items:center;gap:9px;text-decoration:none;cursor:pointer;}
    .ex-nav-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:30px;}
    .ex-nav-link{color:var(--text-sub);text-decoration:none;font-size:14px;font-weight:500;letter-spacing:.2px;position:relative;transition:color .2s;cursor:pointer;}
    .ex-nav-link::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:1.5px;background:var(--gold);transition:width .25s ease;}
    .ex-nav-link:hover{color:#fff} .ex-nav-link:hover::after{width:100%}
    .ex-nav-link.active{color:#fff} .ex-nav-link.active::after{width:100%}
    .ex-nav-actions{display:flex;align-items:center;gap:12px;}
    .ex-btn-avatar-wrap{position:relative;}
    .ex-btn-avatar-trigger{display:flex;align-items:center;gap:9px;cursor:pointer;padding:5px 14px 5px 5px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);backdrop-filter:blur(6px);transition:background .2s;}
    .ex-btn-avatar-trigger:hover{background:rgba(255,255,255,0.11);}
    .ex-btn-avatar-img{width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--gold);}
    .ex-btn-avatar-name{color:#fff;font-size:13.5px;font-weight:600;}
    .ex-btn-avatar-chevron{width:14px;height:14px;color:var(--text-sub);transition:transform .2s;}
    .ex-btn-avatar-chevron.open{transform:rotate(180deg);}
    .ex-dropdown{position:absolute;top:calc(100% + 10px);right:0;background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:8px;min-width:170px;box-shadow:0 20px 50px rgba(0,0,0,0.55);animation:dropIn .18s ease;z-index:999;}
    @keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
    .ex-dropdown-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 14px;border:none;background:none;color:rgba(255,255,255,0.82);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:500;cursor:pointer;border-radius:8px;transition:background .18s;text-align:left;}
    .ex-dropdown-item:hover{background:rgba(255,255,255,0.08);color:#fff;}
    .ex-dropdown-item.danger{color:#ff5a5a} .ex-dropdown-item.danger:hover{background:rgba(255,90,90,0.1)}
    .ex-dropdown-divider{height:1px;background:rgba(255,255,255,0.07);margin:6px 0;}
    .ex-btn-emergency{display:flex;align-items:center;gap:8px;padding:9px 20px;border-radius:50px;border:none;background:var(--accent);color:var(--white);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;transition:background .2s,transform .15s;box-shadow:0 4px 18px rgba(232,52,26,0.35);}
    .ex-btn-emergency:hover{background:var(--accent-hover);transform:translateY(-1px);}
    .pulse-dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:pulse-ring 1.4s ease infinite;}
    @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.7)}70%{box-shadow:0 0 0 6px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}

    /* Hero */
    .ex-hero{position:relative;height:240px;display:flex;align-items:flex-end;overflow:hidden;background:#000;margin-top:var(--nav-h);}
    .ex-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0.3;animation:heroZoom 14s ease-in-out forwards;}
    @keyframes heroZoom{from{transform:scale(1)}to{transform:scale(1.08)}}
    .ex-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,13,13,1) 0%,rgba(13,13,13,0.2) 60%,transparent 100%);}
    .ex-hero-content{position:relative;z-index:2;padding:0 6% 32px;animation:fadeUp .7s cubic-bezier(0.22,1,0.36,1) both;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    .ex-hero-eyebrow{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
    .ex-hero-title{font-size:clamp(2rem,4.5vw,3rem);font-weight:900;letter-spacing:-1.5px;color:var(--white);line-height:1;}
    .ex-hero-sub{font-family:'Lora',serif;font-style:italic;font-size:14px;color:var(--text-sub);margin-top:7px;}

    /* Page */
    .ex-page{min-height:calc(100vh - var(--nav-h));background:var(--bg);}
    .ex-body{max-width:1200px;margin:0 auto;padding:36px 5% 80px;}

    /* Stepper */
    .ex-stepper{display:flex;margin-bottom:32px;background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;}
    .ex-step{flex:1;display:flex;align-items:center;gap:10px;padding:15px 22px;cursor:default;font-size:13.5px;font-weight:600;color:var(--text-muted);transition:background .2s,color .2s;border-right:1px solid var(--border);}
    .ex-step:last-child{border-right:none}
    .ex-step.active{background:rgba(245,166,35,0.06);color:var(--white);}
    .ex-step.done{color:#4ade80;cursor:pointer} .ex-step.done:hover{background:rgba(74,222,128,0.05)}
    .ex-step-num{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;background:var(--surface2);border:1.5px solid var(--border);}
    .ex-step.active .ex-step-num{background:var(--gold);border-color:var(--gold);color:#000;}
    .ex-step.done .ex-step-num{background:#16a34a;border-color:#16a34a;color:#fff;}

    /* Card */
    .ex-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:border-color .25s;margin-bottom:24px;}
    .ex-card:hover{border-color:var(--border-hover);}
    .ex-card-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 18px;border-bottom:1px solid var(--border);}
    .ex-card-title{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;color:var(--white);letter-spacing:.2px;}
    .ex-card-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;}
    .ex-card-icon.gold{background:rgba(245,166,35,0.15)} .ex-card-icon.green{background:rgba(34,197,94,0.12)} .ex-card-icon.blue{background:rgba(59,130,246,0.12)}
    .ex-card-body{padding:22px 24px 26px;}

    /* Buttons */
    .ex-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:12px;border:none;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s ease;letter-spacing:.2px;}
    .ex-btn-primary{background:var(--accent);color:#fff;box-shadow:0 4px 20px rgba(232,52,26,0.3);}
    .ex-btn-primary:hover{background:var(--accent-hover);transform:translateY(-1px);}
    .ex-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
    .ex-btn-gold{background:linear-gradient(135deg,var(--gold),#e09820);color:#000;box-shadow:0 4px 20px rgba(245,166,35,0.28);}
    .ex-btn-gold:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(245,166,35,0.4);}
    .ex-btn-gold:disabled{opacity:.5;cursor:not-allowed;transform:none;}
    .ex-btn-ghost{background:transparent;color:var(--text-sub);border:1.5px solid var(--border);}
    .ex-btn-ghost:hover{background:var(--surface2);color:#fff;border-color:var(--border-hover);}
    .ex-btn-sm{padding:8px 14px;font-size:12.5px;border-radius:9px;}
    .ex-spinner{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.2);border-top-color:#fff;animation:spin .75s linear infinite;display:inline-block;}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* Loading */
    .ex-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:380px;gap:18px;}
    .ex-loading-spinner{width:44px;height:44px;border-radius:50%;border:3.5px solid rgba(245,166,35,0.15);border-top-color:var(--gold);animation:spin .9s linear infinite;}
    .ex-loading-text{font-size:15px;color:var(--text-sub);font-weight:500;}
    .ex-loading-city{color:var(--gold);font-weight:700;}

    /* Location badge */
    .ex-loc-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:18px;}
    .ex-loc-badge.granted{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);color:#4ade80;}
    .ex-loc-badge.denied{background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-muted);}
    .ex-loc-badge.pending{background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.2);color:var(--gold);}
    .ex-loc-dot{width:7px;height:7px;border-radius:50%;background:currentColor;}

    /* Places grid */
    .ex-places-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;margin-bottom:24px;}
    .ex-place-card-wrap{position:relative;animation:fadeUp .4s cubic-bezier(0.22,1,0.36,1) both;}
    .ex-place-card{background:var(--surface2);border:2px solid var(--border);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .22s ease;}
    .ex-place-card:hover{border-color:var(--gold);transform:translateY(-3px);}
    .ex-place-card.selected{border-color:var(--gold);background:rgba(245,166,35,0.05);}
    .ex-place-img{width:100%;height:130px;object-fit:cover;background:#1e1e1e;display:block;}
    .ex-place-img-placeholder{width:100%;height:130px;background:linear-gradient(135deg,#1e1e1e,#2a2a2a);display:flex;align-items:center;justify-content:center;font-size:32px;color:rgba(255,255,255,0.2);}
    .ex-place-body{padding:11px 13px 13px;}
    .ex-place-name{font-size:12.5px;font-weight:700;color:var(--white);margin-bottom:4px;line-height:1.4;}
    .ex-place-rating{font-size:12px;color:var(--text-muted);margin-bottom:3px;}
    .ex-place-dist{font-size:11px;color:#60a5fa;font-weight:600;margin-bottom:3px;}
    .ex-place-desc{font-family:'Lora',serif;font-style:italic;font-size:11px;color:var(--text-muted);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
    .ex-place-check{margin-top:7px;padding:3px 9px;border-radius:20px;background:rgba(245,166,35,0.15);color:var(--gold);font-size:11px;font-weight:700;display:inline-block;}
    .ex-place-num{position:absolute;top:8px;left:8px;width:22px;height:22px;border-radius:50%;background:var(--gold);color:#000;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:1;}

    /* Weather block */
    .ex-weather-block{background:linear-gradient(135deg,#0f2027 0%,#1a3a4a 50%,#2c5364 100%);border:1px solid rgba(96,165,250,0.2);border-radius:20px;padding:22px 26px;margin-bottom:24px;animation:fadeUp .5s cubic-bezier(0.22,1,0.36,1) both;}
    .ex-weather-live-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#4ade80;font-size:11px;font-weight:700;letter-spacing:.5px;padding:4px 10px;border-radius:20px;margin-bottom:14px;}
    .ex-weather-live-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:pulse-ring 1.4s ease infinite;}
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

    /* Form inputs */
    .ex-label{display:block;font-size:11.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;}
    .ex-input{width:100%;padding:13px 16px;background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;outline:none;color:var(--white);font-family:'Sora',sans-serif;font-size:14px;font-weight:500;transition:border-color .2s,box-shadow .2s;appearance:none;margin-bottom:18px;}
    .ex-input:focus{border-color:rgba(245,166,35,0.5);box-shadow:0 0 0 3px rgba(245,166,35,0.1);}

    /* Anchor points (start/end) */
    .ex-anchor-section{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:16px;padding:18px 20px;margin-bottom:18px;}
    .ex-anchor-title{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:14px;display:flex;align-items:center;gap:6px;}
    .ex-anchor-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
    .ex-anchor-row:last-child{margin-bottom:0;}
    .ex-anchor-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
    .ex-anchor-dot.start{background:var(--accent);}
    .ex-anchor-dot.end{background:var(--gold);}
    .ex-anchor-input{flex:1;padding:10px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;outline:none;color:#fff;font-family:'Sora',sans-serif;font-size:13px;font-weight:500;transition:border-color .2s;}
    .ex-anchor-input:focus{border-color:rgba(255,255,255,0.25);}
    .ex-anchor-input::placeholder{color:var(--text-muted);}
    .ex-anchor-gps{display:flex;align-items:center;gap:5px;padding:8px 12px;border-radius:9px;border:1.5px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.07);color:#4ade80;font-family:'Sora',sans-serif;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s;}
    .ex-anchor-gps:hover:not(:disabled){background:rgba(34,197,94,0.14);border-color:rgba(34,197,94,0.5);}
    .ex-anchor-gps:disabled{opacity:.5;cursor:not-allowed;}
    .ex-anchor-clear{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:4px;transition:color .15s;flex-shrink:0;}
    .ex-anchor-clear:hover{color:#fff;}
    .ex-mini-spin{width:11px;height:11px;border:2px solid rgba(74,222,128,0.3);border-top-color:#4ade80;border-radius:50%;animation:ex-spin .7s linear infinite;display:inline-block;}
    @keyframes ex-spin{to{transform:rotate(360deg)}}

    /* Selected bar */
    .ex-selected-bar{background:rgba(232,52,26,0.08);border:1px solid rgba(232,52,26,0.2);border-radius:12px;padding:12px 18px;margin-bottom:18px;font-size:13.5px;color:rgba(255,255,255,0.75);}

    /* Emergency */
    .ex-emergency-panel{position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);z-index:9998;display:flex;align-items:center;justify-content:center;}
    .ex-emergency-modal{background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:32px;width:90%;max-width:480px;box-shadow:0 32px 80px rgba(0,0,0,0.7);}
    .ex-emergency-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;}
    .ex-emergency-icon-wrap{font-size:36px;}
    .ex-emergency-title{font-size:18px;font-weight:800;color:#fff;margin-bottom:4px;}
    .ex-emergency-sub{font-size:13px;color:var(--text-muted);}
    .ex-emergency-numbers{display:flex;flex-direction:column;gap:10px;}
    .ex-emergency-number{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:14px;}
    .ex-emergency-number-left{display:flex;align-items:center;gap:12px;}
    .ex-emergency-number-icon{font-size:22px;}
    .ex-emergency-number-name{font-size:13.5px;font-weight:600;color:#fff;}
    .ex-emergency-number-loc{font-size:11.5px;color:var(--text-muted);margin-top:2px;}
    .ex-emergency-call{padding:8px 16px;border-radius:10px;border:none;background:rgba(232,52,26,0.15);color:var(--accent);font-family:'Sora',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;transition:background .18s;white-space:nowrap;}
    .ex-emergency-call:hover{background:rgba(232,52,26,0.28);}

    @media(max-width:768px){
      .ex-nav-links{display:none;}
      .ex-places-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));}
      .ex-weather-inner{flex-direction:column;align-items:flex-start;gap:10px;}
      .ex-weather-stats{flex-direction:column;gap:10px;align-items:flex-start;}
      .ex-weather-divider{display:none;}
      .ex-weather-stat{padding:0;}
    }
  `}</style>
);

// ── Main Component ─────────────────────────────────────────────────────────
export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]                     = useState(null);
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [emergencyOpen, setEmergencyOpen]   = useState(false);
  const [toast, setToast]                   = useState(null);

  const [city, setCity]                     = useState("");
  const [loading, setLoading]               = useState(true);

  const [placesData, setPlacesData]         = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [tripDate, setTripDate]             = useState("");

  const [weather, setWeather]               = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [routeLoading, setRouteLoading]     = useState(false);

  // Geolocation
  const [userLocation, setUserLocation]     = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending");

  // Start / end anchors
  // value: "lat,lng" string (GPS) or plain address text
  // label: display string shown in the UI
  const [startPoint, setStartPoint] = useState(null); // { value, label }
  const [endPoint,   setEndPoint]   = useState(null); // { value, label }
  const [startText,  setStartText]  = useState("");
  const [endText,    setEndText]    = useState("");
  const [startLocLoading, setStartLocLoading] = useState(false);
  const [endLocLoading,   setEndLocLoading]   = useState(false);

  const showToast = useCallback((msg, type = "info") => setToast({ message: msg, type }), []);

  // ── Load user ──
  useEffect(() => {
    const stored = localStorage.getItem("velora_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
  }, []);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [dropdownOpen]);

  // ── Read city from navigation state and fetch places + weather ──
  useEffect(() => {
    const incoming = location.state?.query?.trim() || "";
    if (!incoming) { navigate("/"); return; }
    setCity(incoming);
    fetchAllData(incoming);
    requestGeolocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requestGeolocation = () => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationStatus("granted");
        // Auto-set start point to current location if not already set
        const val = `${coords.lat},${coords.lng}`;
        setStartPoint({ value: val, label: "Current Location" });
        setStartText("Current Location");
      },
      () => setLocationStatus("denied"),
      { timeout: 6000, enableHighAccuracy: false }
    );
  };

  const grabGPS = (forEnd = false) => {
    if (!navigator.geolocation) return;
    if (forEnd) setEndLocLoading(true); else setStartLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const val = `${lat},${lng}`;
        if (forEnd) {
          setEndPoint({ value: val, label: "Current Location" });
          setEndText("Current Location");
          setEndLocLoading(false);
        } else {
          setStartPoint({ value: val, label: "Current Location" });
          setStartText("Current Location");
          setStartLocLoading(false);
          // Also update userLocation so "X km away" labels recalculate
          setUserLocation({ lat, lng });
          setLocationStatus("granted");
        }
      },
      () => { if (forEnd) setEndLocLoading(false); else setStartLocLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const fetchAllData = async (cityName) => {
    setLoading(true);
    setWeatherLoading(true);

    const [placesRes, weatherRes] = await Promise.allSettled([
      fetch(`${BASE_URL}/places/${encodeURIComponent(cityName)}`),
      fetch(`${BASE_URL}/current-weather/${encodeURIComponent(cityName)}`),
    ]);

    // Places
    try {
      if (placesRes.status === "fulfilled" && placesRes.value.ok) {
        const data = await placesRes.value.json();
        if (Array.isArray(data) && data.length > 0) {
          setPlacesData(data);
        } else {
          setPlacesData([]);
        }
      } else {
        setPlacesData([]);
      }
    } catch {
      setPlacesData([]);
    } finally {
      setLoading(false);
    }

    // Weather — always runs now
    try {
      if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
        const wData = await weatherRes.value.json();
        if (wData?.city) setWeather(wData);
      }
    } catch {}
    finally { setWeatherLoading(false); }
  };

  // ── Re-sort when location arrives ──
  const sortedPlaces = useMemo(() => {
    if (!placesData.length) return placesData;
    if (locationStatus === "granted" && userLocation) {
      return [...placesData].sort((a, b) => {
        const dA = haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const dB = haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        const scoreA = (a.rating / 5) * 0.6 + (1 - Math.min(dA, 500000) / 500000) * 0.4;
        const scoreB = (b.rating / 5) * 0.6 + (1 - Math.min(dB, 500000) / 500000) * 0.4;
        return scoreB - scoreA;
      });
    }
    return [...placesData].sort((a, b) => b.rating - a.rating);
  }, [placesData, userLocation, locationStatus]);

  const togglePlace = (name) => {
    setSelectedPlaces(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handlePlanTrip = async () => {
    if (selectedPlaces.length < 2) return showToast("Select at least 2 places", "error");
    if (!tripDate) return showToast("Please choose a travel date", "error");

    setRouteLoading(true);
    const selectedObjs = placesData.filter(p => selectedPlaces.includes(p.name));

    const body = { locations: selectedObjs };
    if (startPoint) body.startPoint = startPoint;
    if (endPoint)   body.endPoint   = endPoint;

    const [routeRes, weatherRes] = await Promise.allSettled([
      fetch(`${BASE_URL}/route/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      fetch(`${BASE_URL}/current-weather/${encodeURIComponent(city)}`),
    ]);

    let routeData = { route: selectedPlaces, details: null, summary: null };
    let wData     = weather;

    try {
      if (routeRes.status === "fulfilled" && routeRes.value.ok) {
        routeData = await routeRes.value.json();
      }
    } catch {}

    try {
      if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
        const w = await weatherRes.value.json();
        if (w?.city) wData = w;
      }
    } catch {}

    setRouteLoading(false);

    navigate("/route", {
      state: {
        city,
        date:       tripDate,
        route:      routeData.route     || selectedPlaces,
        details:    routeData.details   || null,
        summary:    routeData.summary   || null,
        startLeg:   routeData.startLeg  || null,
        endLeg:     routeData.endLeg    || null,
        startPoint: startPoint          || null,
        endPoint:   endPoint            || null,
        placesData: selectedObjs,
        weather:    wData,
      },
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("velora_user");
    localStorage.removeItem("velora_token");
    setUser(null);
    navigate("/");
  };

  const today   = new Date().toISOString().split("T")[0];
  const heroBg  = getCityHero(city);

  return (
    <>
      <Styles />

      {/* Emergency */}
      {emergencyOpen && (
        <div className="ex-emergency-panel" onClick={() => setEmergencyOpen(false)}>
          <div className="ex-emergency-modal" onClick={e => e.stopPropagation()}>
            <div className="ex-emergency-header">
              <div className="ex-emergency-icon-wrap">🚨</div>
              <div>
                <div className="ex-emergency-title">Emergency Contacts</div>
                <div className="ex-emergency-sub">Tap any number to call immediately</div>
              </div>
            </div>
            <div className="ex-emergency-numbers">
              {[
                { icon: "🏥", name: "Ambulance / Medical", loc: "National Emergency", phone: "108" },
                { icon: "👮", name: "Police Control Room",  loc: "All India",         phone: "100" },
                { icon: "🔥", name: "Fire Brigade",         loc: "All India",         phone: "101" },
                { icon: "📞", name: "Emergency Helpline",   loc: "Unified Number",    phone: "112" },
                { icon: "🚺", name: "Women Helpline",       loc: "National",          phone: "1091" },
                { icon: "🩺", name: "Tourist Help",         loc: "India Tourism",     phone: "1800-111-363" },
              ].map(e => (
                <div key={e.phone} className="ex-emergency-number">
                  <div className="ex-emergency-number-left">
                    <span className="ex-emergency-number-icon">{e.icon}</span>
                    <div>
                      <div className="ex-emergency-number-name">{e.name}</div>
                      <div className="ex-emergency-number-loc">{e.loc}</div>
                    </div>
                  </div>
                  <a href={`tel:${e.phone}`}>
                    <button className="ex-emergency-call">{e.phone}</button>
                  </a>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="ex-btn ex-btn-ghost" style={{ width: "100%", borderRadius: 12 }}
                onClick={() => setEmergencyOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Navbar */}
      <nav className="ex-nav">
        <div className="ex-nav-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={30} textColor="#fff" />
        </div>
        <div className="ex-nav-links">
          <span className="ex-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="ex-nav-link" onClick={() => navigate("/distance")}>Distance</span>
          <span className="ex-nav-link" onClick={() => navigate("/my-trips")}>My Trips</span>
        </div>
        <div className="ex-nav-actions">
          {user ? (
            <div className="ex-btn-avatar-wrap" onClick={e => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
              <div className="ex-btn-avatar-trigger">
                <img src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=E8341A&color=fff`}
                  alt="profile" className="ex-btn-avatar-img" />
                <span className="ex-btn-avatar-name">{user.name?.split(" ")[0] || "User"}</span>
                <svg className={`ex-btn-avatar-chevron${dropdownOpen ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {dropdownOpen && (
                <div className="ex-dropdown" onClick={e => e.stopPropagation()}>
                  <button className="ex-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/profile"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    Profile
                  </button>
                  <div className="ex-dropdown-divider" />
                  <button className="ex-dropdown-item danger" onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="ex-btn ex-btn-ghost ex-btn-sm" onClick={() => navigate("/login")}>Sign In</button>
          )}
          <button className="ex-btn-emergency" onClick={() => setEmergencyOpen(true)}>
            <span className="pulse-dot" /> Emergency
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="ex-hero">
        <div className="ex-hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="ex-hero-overlay" />
        <div className="ex-hero-content">
          <p className="ex-hero-eyebrow">✦ Top Attractions</p>
          <h1 className="ex-hero-title">{city}</h1>
          <p className="ex-hero-sub">
            {loading
              ? "Loading attractions…"
              : `${sortedPlaces.length} places · ${selectedPlaces.length} selected`}
          </p>
        </div>
      </div>

      <div className="ex-page">
        <div className="ex-body">

          {/* Stepper */}
          <div className="ex-stepper">
            <div className="ex-step active">
              <span className="ex-step-num">1</span>
              Select Attractions
            </div>
            <div className="ex-step">
              <span className="ex-step-num">2</span>
              Optimized Route
            </div>
          </div>

          {/* Weather block (loads at top of step 1) */}
          {weatherLoading && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "linear-gradient(135deg,#0f2027,#1a3a4a)",
              border: "1px solid rgba(96,165,250,0.2)", borderRadius: 20,
              padding: "20px 26px", marginBottom: 24,
            }}>
              <span className="ex-spinner" />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                Fetching live weather for {city}…
              </span>
            </div>
          )}
          {!weatherLoading && weather && <CurrentWeatherBlock weather={weather} />}

          {/* Places card */}
          <div className="ex-card">
            <div className="ex-card-header">
              <div className="ex-card-title">
                <div className="ex-card-icon gold">📍</div>
                Top Attractions in {city}
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                  padding: "2px 8px", borderRadius: 50,
                  background: "rgba(59,130,246,0.15)", color: "#60a5fa", marginLeft: 4,
                }}>via Google</span>
              </div>
              <button className="ex-btn ex-btn-ghost ex-btn-sm" onClick={() => navigate(-1)}>
                ← Back
              </button>
            </div>
            <div className="ex-card-body">
              {loading ? (
                <div className="ex-loading">
                  <div className="ex-loading-spinner" />
                  <div className="ex-loading-text">
                    Loading top attractions in <span className="ex-loading-city">{city}</span>…
                  </div>
                </div>
              ) : (
                <>
                  {/* Location status badge */}
                  <div className={`ex-loc-badge ${locationStatus}`}>
                    <span className="ex-loc-dot" />
                    {locationStatus === "granted"  && "Sorted by rating + distance from you"}
                    {locationStatus === "denied"   && "Location unavailable — sorted by rating"}
                    {locationStatus === "pending"  && "Getting your location…"}
                  </div>

                  <p style={{ fontSize: 13.5, color: "var(--text-sub)", marginBottom: 20, lineHeight: 1.65 }}>
                    Select the attractions you want to visit. We'll calculate the most efficient route between them.
                  </p>

                  {sortedPlaces.length === 0 && (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>No places found</div>
                      <div style={{ fontSize: 13 }}>Try searching for a different city or check your connection.</div>
                    </div>
                  )}

                  <div className="ex-places-grid">
                    {sortedPlaces.map((place, idx) => {
                      const distM = userLocation && place.lat
                        ? haversineDistance(userLocation.lat, userLocation.lng, place.lat, place.lng)
                        : null;
                      const distText = distM != null
                        ? distM < 1000
                          ? `${Math.round(distM)} m away`
                          : `${(distM / 1000).toFixed(1)} km away`
                        : null;
                      const selIdx = selectedPlaces.indexOf(place.name);
                      const isSelected = selIdx >= 0;

                      return (
                        <div key={place.name} className="ex-place-card-wrap"
                          style={{ animationDelay: `${idx * 0.04}s` }}>
                          <div
                            className={`ex-place-card${isSelected ? " selected" : ""}`}
                            onClick={() => togglePlace(place.name)}>
                            {place.photoRef ? (
                              <img
                                src={`${BASE_URL}/photo?ref=${encodeURIComponent(place.photoRef)}`}
                                alt={place.name}
                                className="ex-place-img"
                                onError={e => {
                                  e.target.style.display = "none";
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="ex-place-img-placeholder"
                              style={{ display: place.photoRef ? "none" : "flex" }}
                            >📍</div>
                            <div className="ex-place-body">
                              <div className="ex-place-name">{place.name}</div>
                              <div className="ex-place-rating">
                                <span style={{ color: "var(--gold)" }}>★</span> {place.rating || "N/A"}
                              </div>
                              {distText && (
                                <div className="ex-place-dist">📍 {distText}</div>
                              )}
                              {place.description && (
                                <div className="ex-place-desc">{place.description}</div>
                              )}
                              {isSelected && (
                                <div className="ex-place-check">✓ Selected</div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="ex-place-num">{selIdx + 1}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedPlaces.length > 0 && (
                    <div className="ex-selected-bar">
                      <strong style={{ color: "var(--accent)" }}>
                        {selectedPlaces.length} place{selectedPlaces.length > 1 ? "s" : ""} selected:
                      </strong>{" "}
                      {selectedPlaces.join(" · ")}
                    </div>
                  )}

                  <label className="ex-label">Travel Date</label>
                  <input
                    type="date" className="ex-input" min={today}
                    value={tripDate} onChange={e => setTripDate(e.target.value)}
                  />

                  {/* ── Start / End Anchors ── */}
                  <div className="ex-anchor-section">
                    <div className="ex-anchor-title">
                      <span>📍</span> Start &amp; End Points <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>(optional)</span>
                    </div>

                    {/* Start */}
                    <div className="ex-anchor-row">
                      <div className="ex-anchor-dot start" />
                      <input
                        className="ex-anchor-input"
                        placeholder="Start from — hotel, airport, or address"
                        value={startText}
                        onChange={e => {
                          setStartText(e.target.value);
                          setStartPoint(e.target.value.trim() ? { value: e.target.value.trim(), label: e.target.value.trim() } : null);
                        }}
                      />
                      <button
                        className="ex-anchor-gps"
                        disabled={startLocLoading}
                        onClick={() => grabGPS(false)}
                        title="Use my current location as start"
                      >
                        {startLocLoading ? <span className="ex-mini-spin" /> : "📍"}
                        {startLocLoading ? "…" : "Me"}
                      </button>
                      {startText && (
                        <button className="ex-anchor-clear" onClick={() => { setStartText(""); setStartPoint(null); }}>✕</button>
                      )}
                    </div>

                    {/* End */}
                    <div className="ex-anchor-row">
                      <div className="ex-anchor-dot end" />
                      <input
                        className="ex-anchor-input"
                        placeholder="End at — hotel, airport, or address"
                        value={endText}
                        onChange={e => {
                          setEndText(e.target.value);
                          setEndPoint(e.target.value.trim() ? { value: e.target.value.trim(), label: e.target.value.trim() } : null);
                        }}
                      />
                      <button
                        className="ex-anchor-gps"
                        disabled={endLocLoading}
                        onClick={() => grabGPS(true)}
                        title="Use my current location as end"
                      >
                        {endLocLoading ? <span className="ex-mini-spin" /> : "📍"}
                        {endLocLoading ? "…" : "Me"}
                      </button>
                      {endText && (
                        <button className="ex-anchor-clear" onClick={() => { setEndText(""); setEndPoint(null); }}>✕</button>
                      )}
                    </div>
                  </div>

                  <button
                    className="ex-btn ex-btn-gold"
                    style={{ width: "100%" }}
                    onClick={handlePlanTrip}
                    disabled={routeLoading || selectedPlaces.length < 2}>
                    {routeLoading
                      ? <><span className="ex-spinner" style={{ borderTopColor: "#000" }} /> Optimizing…</>
                      : "✈️  Plan a Trip"}
                  </button>

                  {selectedPlaces.length < 2 && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
                      Select at least 2 attractions to continue
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
