import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
} from "firebase/auth";

/* ─── Styles ─── */
const ProfileStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --nav-h: 68px;
      --accent: #E8341A;
      --accent-hover: #c9270e;
      --gold: #F5A623;
      --white: #FFFFFF;
      --black: #000000;
      --page-bg: #000000;
      --surface: #111111;
      --surface2: #1a1a1a;
      --surface3: #222222;
      --border: rgba(255,255,255,0.08);
      --border-hover: rgba(255,255,255,0.15);
      --text-primary: #FFFFFF;
      --text-secondary: rgba(255,255,255,0.65);
      --text-muted: rgba(255,255,255,0.4);
    }

    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      font-family: 'Sora', sans-serif;
      background: var(--page-bg);
      color: var(--text-primary);
    }

    #root { width: 100%; margin: 0; padding: 0; }

    /* ── NAVBAR ── */
    .velora-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--nav-h);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 5%;
      z-index: 1000;
      background: rgba(8,8,8,0.92);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 1px 0 rgba(255,255,255,0.06);
    }
    .nav-logo {
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; text-decoration: none;
    }
    .nav-logo-icon {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .nav-logo-text {
      font-size: 22px; font-weight: 800;
      color: #fff; letter-spacing: -0.5px;
    }
    .nav-back {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 20px;
      border-radius: 50px;
      border: 1.5px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.08);
      color: #fff;
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(6px);
    }
    .nav-back:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.45);
    }

    /* ── PAGE ── */
    .profile-page {
      min-height: 100vh;
      padding-top: var(--nav-h);
      background: var(--page-bg);
    }

    /* ── HERO BANNER ── */
    .profile-banner {
      position: relative;
      height: 220px;
      overflow: hidden;
    }
    .profile-banner-img {
      position: absolute;
      inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center 40%;
    }
    .profile-banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.18) 0%,
        rgba(0,0,0,0.55) 78%,
        rgba(0,0,0,1) 100%
      );
    }
    .banner-eyebrow {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      z-index: 2;
      text-align: center;
      padding-bottom: 14px;
    }
    .banner-eyebrow-text {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--accent);
    }

    /* ── CONTAINER ── */
    .profile-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 0 24px 100px;
      position: relative;
    }

    /* ── AVATAR SECTION ── */
    .avatar-section {
      display: flex;
      align-items: flex-end;
      gap: 22px;
      margin-top: -56px;
      margin-bottom: 36px;
      position: relative;
      z-index: 2;
    }
    .avatar-outer { position: relative; flex-shrink: 0; }
    .profile-avatar {
      width: 108px; height: 108px;
      border-radius: 50%;
      object-fit: cover;
      border: 5px solid var(--page-bg);
      box-shadow: 0 0 0 2.5px var(--gold), 0 8px 30px rgba(0,0,0,0.18);
      display: block;
    }
    .avatar-edit-btn {
      position: absolute;
      bottom: 3px; right: 3px;
      width: 30px; height: 30px;
      border-radius: 50%;
      background: var(--accent);
      border: 3px solid var(--page-bg);
      color: #fff;
      font-size: 12px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      box-shadow: 0 2px 8px rgba(232,52,26,0.35);
    }
    .avatar-edit-btn:hover { background: var(--accent-hover); transform: scale(1.1); }

    .avatar-info { padding-bottom: 8px; }
    .avatar-name {
      font-size: 24px; font-weight: 800;
      color: var(--text-primary); letter-spacing: -0.6px;
      margin-bottom: 3px;
    }
    .avatar-email { font-size: 13.5px; color: var(--text-secondary); font-weight: 500; }
    .avatar-badge {
      display: inline-flex; align-items: center; gap: 5px;
      margin-top: 9px;
      background: rgba(245,166,35,0.12);
      border: 1px solid rgba(245,166,35,0.35);
      border-radius: 50px;
      padding: 5px 13px;
      font-size: 11px; font-weight: 700;
      color: #F5A623;
      letter-spacing: 0.4px;
    }

    /* ── TABS ── */
    .profile-tabs {
      display: flex;
      gap: 4px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 5px;
      margin-bottom: 28px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }
    .tab-btn {
      flex: 1;
      padding: 10px 12px;
      border-radius: 11px;
      border: none;
      background: none;
      color: var(--text-secondary);
      font-family: 'Sora', sans-serif;
      font-size: 13px; font-weight: 600;
      cursor: pointer;
      transition: all 0.22s ease;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .tab-btn:hover { color: var(--text-primary); background: var(--surface2); }
    .tab-btn.active {
      background: var(--black);
      color: #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }
    .tab-btn.active .tab-dot { background: var(--gold); }
    .tab-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: rgba(0,0,0,0.18);
      flex-shrink: 0;
    }

    /* ── CARDS ── */
    .profile-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      margin-bottom: 20px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
      transition: box-shadow 0.25s, border-color 0.2s;
    }
    .profile-card:hover {
      box-shadow: 0 6px 28px rgba(0,0,0,0.09);
      border-color: var(--border-hover);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .card-title-wrap { display: flex; align-items: center; gap: 12px; }
    .card-icon {
      width: 38px; height: 38px;
      border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .card-icon.orange { background: rgba(232,52,26,0.09); border: 1px solid rgba(232,52,26,0.18); }
    .card-icon.gold   { background: rgba(245,166,35,0.1);  border: 1px solid rgba(245,166,35,0.22); }
    .card-icon.blue   { background: rgba(59,130,246,0.09); border: 1px solid rgba(59,130,246,0.18); }
    .card-icon.green  { background: rgba(34,197,94,0.09);  border: 1px solid rgba(34,197,94,0.18); }
    .card-icon.purple { background: rgba(168,85,247,0.09); border: 1px solid rgba(168,85,247,0.18); }

    .card-title { font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; }
    .card-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; font-weight: 500; }

    .edit-toggle-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 18px;
      border-radius: 50px;
      border: 1.5px solid var(--border-hover);
      background: var(--surface2);
      color: var(--text-secondary);
      font-family: 'Sora', sans-serif;
      font-size: 12.5px; font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .edit-toggle-btn:hover {
      background: var(--black);
      border-color: var(--black);
      color: #fff;
    }

    /* ── FORM FIELDS ── */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-grid.single { grid-template-columns: 1fr; }
    .form-group { display: flex; flex-direction: column; gap: 7px; }
    .form-group.full { grid-column: 1 / -1; }

    .form-label {
      font-size: 11px; font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .form-input {
      padding: 12px 15px;
      background: var(--surface2);
      border: 1.5px solid var(--border);
      border-radius: 11px;
      color: var(--text-primary);
      font-family: 'Sora', sans-serif;
      font-size: 14px; font-weight: 500;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      width: 100%;
    }
    .form-input:focus {
      border-color: var(--accent);
      background: rgba(255,255,255,0.07);
      box-shadow: 0 0 0 3px rgba(232,52,26,0.15);
    }
    .form-input:disabled { opacity: 0.5; cursor: not-allowed; }
    .form-input::placeholder { color: var(--text-muted); }

    .form-select {
      padding: 12px 38px 12px 15px;
      background: var(--surface2);
      border: 1.5px solid var(--border);
      border-radius: 11px;
      color: var(--text-primary);
      font-family: 'Sora', sans-serif;
      font-size: 14px; font-weight: 500;
      outline: none;
      cursor: pointer;
      width: 100%;
      transition: border-color 0.2s, background 0.2s;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
    }
    .form-select:focus {
      border-color: var(--accent);
      background-color: rgba(255,255,255,0.07);
      box-shadow: 0 0 0 3px rgba(232,52,26,0.15);
    }
    .form-select option { background: #111111; color: #ffffff; }

    .field-value {
      padding: 12px 15px;
      background: var(--surface2);
      border: 1.5px solid var(--border);
      border-radius: 11px;
      color: var(--text-secondary);
      font-size: 14px; font-weight: 500;
      min-height: 46px;
      display: flex; align-items: center;
    }

    /* ── BUTTONS ── */
    .save-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 28px;
      border-radius: 50px;
      border: none;
      background: var(--accent);
      color: #fff;
      font-family: 'Sora', sans-serif;
      font-size: 14px; font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.2px;
      transition: background 0.2s, transform 0.15s;
      box-shadow: 0 4px 18px rgba(232,52,26,0.28);
      margin-top: 22px;
    }
    .save-btn:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .cancel-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 24px;
      border-radius: 50px;
      border: 1.5px solid var(--border-hover);
      background: var(--surface2);
      color: var(--text-secondary);
      font-family: 'Sora', sans-serif;
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 22px;
    }
    .cancel-btn:hover { background: var(--surface3); color: var(--text-primary); }

    .btn-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

    /* ── STATUS MESSAGES ── */
    .status-msg {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      border-radius: 11px;
      font-size: 13px; font-weight: 600;
      margin-top: 16px;
      font-family: 'Sora', sans-serif;
    }
    .status-msg.success {
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.22);
      color: #16a34a;
    }
    .status-msg.error {
      background: rgba(239,68,68,0.07);
      border: 1px solid rgba(239,68,68,0.2);
      color: #dc2626;
    }

    /* ── PASSWORD STRENGTH ── */
    .pw-strength-bar {
      height: 4px;
      border-radius: 4px;
      background: var(--surface3);
      margin-top: 8px;
      overflow: hidden;
    }
    .pw-strength-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease, background 0.3s ease;
    }
    .pw-strength-label {
      font-size: 11.5px; font-weight: 700;
      margin-top: 5px;
      font-family: 'Sora', sans-serif;
    }

    /* ── EYE BUTTON ── */
    .pw-eye-btn {
      position: absolute; right: 14px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      color: var(--text-muted);
      cursor: pointer; font-size: 16px;
      padding: 0; line-height: 1;
      transition: color 0.2s;
    }
    .pw-eye-btn:hover { color: var(--text-secondary); }

    /* ── TRIPS ── */
    .trips-empty {
      text-align: center;
      padding: 50px 20px;
      color: var(--text-muted);
    }
    .trips-empty-icon { font-size: 44px; margin-bottom: 14px; opacity: 0.5; }
    .trips-empty-title { font-size: 16px; font-weight: 800; color: var(--text-secondary); margin-bottom: 7px; }
    .trips-empty-desc { font-size: 13.5px; line-height: 1.65; }

    .trip-card {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 18px;
      background: var(--surface2);
      border: 1.5px solid var(--border);
      border-radius: 14px;
      margin-bottom: 12px;
      transition: border-color 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .trip-card:hover {
      border-color: var(--border-hover);
      box-shadow: 0 4px 18px rgba(0,0,0,0.08);
    }
    .trip-thumb {
      width: 62px; height: 62px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.12);
    }
    .trip-info { flex: 1; min-width: 0; }
    .trip-name { font-size: 15px; font-weight: 800; color: var(--text-primary); margin-bottom: 3px; letter-spacing: -0.2px; }
    .trip-date { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    .trip-status {
      font-size: 11px; font-weight: 700;
      padding: 5px 12px; border-radius: 50px;
      flex-shrink: 0; letter-spacing: 0.3px;
    }
    .trip-status.upcoming  { background: rgba(59,130,246,0.1);  color: #2563eb; border: 1px solid rgba(59,130,246,0.2); }
    .trip-status.completed { background: rgba(34,197,94,0.09);  color: #16a34a; border: 1px solid rgba(34,197,94,0.18); }

    /* ── PREF ROWS ── */
    .pref-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 0;
      border-bottom: 1px solid var(--border);
    }
    .pref-row:last-child  { border-bottom: none; padding-bottom: 0; }
    .pref-row:first-child { padding-top: 0; }
    .pref-label { font-size: 14px; font-weight: 700; color: var(--text-primary); }
    .pref-desc  { font-size: 12px; color: var(--text-muted); margin-top: 2px; font-weight: 500; }

    /* ── TOGGLE ── */
    .toggle {
      position: relative;
      width: 46px; height: 26px;
      border-radius: 50px;
      background: var(--surface3);
      border: 1.5px solid var(--border-hover);
      cursor: pointer;
      transition: background 0.25s, border-color 0.25s;
      flex-shrink: 0;
    }
    .toggle.on { background: var(--accent); border-color: var(--accent); }
    .toggle-thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 5px rgba(0,0,0,0.2);
      transition: left 0.25s cubic-bezier(0.22,1,0.36,1);
    }
    .toggle.on .toggle-thumb { left: 23px; }

    /* ── VERIFIED BADGE ── */
    .verified-badge {
      font-size: 12.5px; font-weight: 700; color: #16a34a;
      display: flex; align-items: center; gap: 5px;
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.2);
      padding: 5px 12px; border-radius: 50px;
      white-space: nowrap;
    }

    /* ── DANGER ZONE ── */
    .danger-zone {
      background: rgba(239,68,68,0.04);
      border: 1.5px solid rgba(239,68,68,0.16);
      border-radius: 20px;
      padding: 26px 28px;
      margin-top: 8px;
    }
    .danger-title {
      font-size: 11px; font-weight: 800;
      color: #dc2626;
      letter-spacing: 1.5px; text-transform: uppercase;
      margin-bottom: 10px;
    }
    .danger-desc {
      font-size: 13.5px; color: var(--text-secondary);
      line-height: 1.65; margin-bottom: 18px; font-weight: 500;
    }
    .danger-btn {
      padding: 10px 24px;
      border-radius: 50px;
      border: 1.5px solid rgba(239,68,68,0.35);
      background: rgba(239,68,68,0.07);
      color: #dc2626;
      font-family: 'Sora', sans-serif;
      font-size: 13px; font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .danger-btn:hover { background: rgba(239,68,68,0.13); border-color: rgba(239,68,68,0.5); }

    /* ── PHOTO UPLOAD ── */
    .photo-upload-area {
      border: 2px dashed var(--border-hover);
      border-radius: 14px;
      padding: 32px 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      margin-top: 6px;
    }
    .photo-upload-area:hover {
      border-color: var(--accent);
      background: rgba(232,52,26,0.03);
    }
    .photo-upload-icon  { font-size: 30px; margin-bottom: 10px; opacity: 0.6; }
    .photo-upload-label { font-size: 14px; color: var(--text-secondary); font-weight: 600; }
    .photo-upload-sub   { font-size: 12px; color: var(--text-muted); margin-top: 5px; }

    /* ── SIGN OUT CARD ── */
    .signout-card {
      display: flex; align-items: center;
      justify-content: space-between;
      flex-wrap: wrap; gap: 16px;
    }
    .signout-title { font-size: 15px; font-weight: 800; color: var(--text-primary); margin-bottom: 3px; }
    .signout-sub   { font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .signout-btn {
      padding: 11px 26px;
      border-radius: 50px;
      border: 1.5px solid rgba(239,68,68,0.3);
      background: rgba(239,68,68,0.06);
      color: #dc2626;
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .signout-btn:hover { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.5); }

    /* ── RESPONSIVE ── */
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .profile-tabs { flex-wrap: wrap; }
      .tab-btn { font-size: 12px; padding: 9px 8px; }
      .avatar-section { flex-direction: column; align-items: flex-start; }
      .card-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .profile-container { padding: 0 16px 80px; }
    }
  `}</style>
);

/* ─── Sample trips ─── */
const sampleTrips = [
  { name: "Goa Beach Getaway",    date: "Apr 12 – Apr 18, 2025", status: "upcoming",  img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200" },
  { name: "Manali Mountain Trek", date: "Dec 20 – Dec 27, 2024", status: "completed", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200" },
  { name: "Bali Retreat",         date: "Sep 5 – Sep 14, 2024",  status: "completed", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200" },
];

/* ─── Password strength ─── */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent", width: "0%" };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too weak", color: "#ef4444", width: "25%" },
    { label: "Weak",     color: "#f97316", width: "50%" },
    { label: "Good",     color: "#eab308", width: "75%" },
    { label: "Strong",   color: "#16a34a", width: "100%" },
  ];
  return { score, ...map[score - 1] || map[0] };
}

/* ─── Toggle ─── */
function Toggle({ value, onChange }) {
  return (
    <div className={`toggle${value ? " on" : ""}`} onClick={() => onChange(!value)}>
      <div className="toggle-thumb" />
    </div>
  );
}

/* ─── Profile Page ─── */
export default function Profile() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState("account");

  /* Account */
  const [editingAccount, setEditingAccount] = useState(false);
  const [displayName, setDisplayName]       = useState("");
  const [phone, setPhone]                   = useState("");
  const [gender, setGender]                 = useState("");
  const [dob, setDob]                       = useState("");
  const [country, setCountry]               = useState("");
  const [accountStatus, setAccountStatus]   = useState(null);
  const [savingAccount, setSavingAccount]   = useState(false);

  /* Password */
  const [currentPw, setCurrentPw]         = useState("");
  const [newPw, setNewPw]                 = useState("");
  const [confirmPw, setConfirmPw]         = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwStatus, setPwStatus]           = useState(null);
  const [savingPw, setSavingPw]           = useState(false);

  /* Prefs */
  const [prefs, setPrefs] = useState({
    emailNotifs: true, tripReminders: true,
    offers: false, newsletter: false,
    twoFactor: false, publicProfile: false,
    loginAlerts: true, shareData: false,
  });

  /* ── Load user ── */
  useEffect(() => {
    const stored = localStorage.getItem("velora_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setDisplayName(parsed.name   || "");
        setPhone(parsed.phone        || "");
        setGender(parsed.gender      || "");
        setDob(parsed.dob            || "");
        setCountry(parsed.country    || "");
      } catch (e) { console.error(e); }
    } else {
      navigate("/login");
    }
    const savedPrefs = localStorage.getItem("velora_prefs");
    if (savedPrefs) { try { setPrefs(JSON.parse(savedPrefs)); } catch {} }
  }, []);

  /* ── Save account ── */
  const handleSaveAccount = async () => {
    setSavingAccount(true); setAccountStatus(null);
    try {
      const cu = auth.currentUser;
      if (cu && displayName !== cu.displayName) await updateProfile(cu, { displayName });
      const updated = { ...user, name: displayName, phone, gender, dob, country };
      localStorage.setItem("velora_user", JSON.stringify(updated));
      setUser(updated);
      setAccountStatus({ type: "success", msg: "Profile updated successfully!" });
      setEditingAccount(false);
    } catch (err) {
      setAccountStatus({ type: "error", msg: err.message || "Failed to update profile." });
    } finally { setSavingAccount(false); }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    setPwStatus(null);
    if (!currentPw || !newPw || !confirmPw) { setPwStatus({ type: "error", msg: "Please fill in all password fields." }); return; }
    if (newPw !== confirmPw)                { setPwStatus({ type: "error", msg: "New passwords do not match." }); return; }
    if (newPw.length < 8)                   { setPwStatus({ type: "error", msg: "Password must be at least 8 characters." }); return; }
    setSavingPw(true);

    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const jwtToken = localStorage.getItem("velora_token");

    try {
      if (jwtToken) {
        // ── JWT user (registered via Velora email/password) ──
        const res  = await fetch(`${API}/api/change-password`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
          body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to change password.");
        setPwStatus({ type: "success", msg: "Password changed successfully! You're all secure." });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        // ── Firebase user (Google OAuth or Firebase email/password) ──
        const cu = auth.currentUser;
        if (!cu || !cu.email) throw new Error("No authenticated user found. Please log out and sign in again.");
        const cred = EmailAuthProvider.credential(cu.email, currentPw);
        await reauthenticateWithCredential(cu, cred);
        await updatePassword(cu, newPw);
        setPwStatus({ type: "success", msg: "Password changed successfully! You're all secure." });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      }
    } catch (err) {
      const msg =
        err.code === "auth/wrong-password"         ? "Current password is incorrect." :
        err.code === "auth/requires-recent-login"  ? "Please log out and log back in, then try again." :
        err.message || "Failed to change password.";
      setPwStatus({ type: "error", msg });
    } finally { setSavingPw(false); }
  };

  /* ── Prefs ── */
  const handlePrefChange = (key, val) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    localStorage.setItem("velora_prefs", JSON.stringify(updated));
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("velora_user");
    localStorage.removeItem("velora_token");
    navigate("/");
  };

  /* ── Photo upload ── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...user, photo: ev.target.result };
      setUser(updated);
      localStorage.setItem("velora_user", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const pwStrength = getPasswordStrength(newPw);

  const tabs = [
    { id: "account",  icon: "👤", label: "Account"  },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  if (!user) return null;

  return (
    <>
      <ProfileStyles />

      {/* ── Navbar ── */}
      <nav className="velora-nav">
        <a className="nav-logo" href="/" onClick={e => { e.preventDefault(); navigate("/"); }}>
          <VeloraLogo size={30} textColor="#fff" />
        </a>
        <button className="nav-back" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Home
        </button>
      </nav>

      <div className="profile-page">

        {/* ── Banner ── */}
        <div className="profile-banner">
          <img
            className="profile-banner-img"
            src="https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1400&q=70"
            alt="banner"
          />
          <div className="profile-banner-overlay" />
          <div className="banner-eyebrow">
            <span className="banner-eyebrow-text">✦ Your Velora Profile</span>
          </div>
        </div>

        <div className="profile-container">

          {/* ── Avatar ── */}
          <div className="avatar-section">
            <div className="avatar-outer">
              <img
                src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=E8341A&color=fff&size=200`}
                alt="Profile"
                className="profile-avatar"
              />
              <button
                className="avatar-edit-btn"
                title="Change photo"
                onClick={() => fileRef.current?.click()}
              >📷</button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </div>
            <div className="avatar-info">
              <div className="avatar-name">{user.name || "Traveller"}</div>
              <div className="avatar-email">{user.email || ""}</div>
              <div className="avatar-badge">⭐ Velora Explorer</div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="profile-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span>{t.icon}</span>
                {t.label}
                <span className="tab-dot" />
              </button>
            ))}
          </div>

          {/* ════ TAB: ACCOUNT ════ */}
          {activeTab === "account" && (
            <>
              <div className="profile-card">
                <div className="card-header">
                  <div className="card-title-wrap">
                    <div className="card-icon orange">👤</div>
                    <div>
                      <div className="card-title">Personal Information</div>
                      <div className="card-subtitle">Manage your name, phone & more</div>
                    </div>
                  </div>
                  <button
                    className="edit-toggle-btn"
                    onClick={() => { setEditingAccount(!editingAccount); setAccountStatus(null); }}
                  >
                    {editingAccount ? "✕ Cancel" : "✏️ Edit"}
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    {editingAccount
                      ? <input className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your full name" />
                      : <div className="field-value">{displayName || "—"}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="field-value">{user.email || "—"}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    {editingAccount
                      ? <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 00000 00000" type="tel" />
                      : <div className="field-value">{phone || "—"}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    {editingAccount
                      ? <input className="form-input" value={dob} onChange={e => setDob(e.target.value)} type="date" />
                      : <div className="field-value">{dob || "—"}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    {editingAccount
                      ? (
                        <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      )
                      : <div className="field-value">{gender || "—"}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    {editingAccount
                      ? (
                        <select className="form-select" value={country} onChange={e => setCountry(e.target.value)}>
                          <option value="">Select country</option>
                          <option>India</option>
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Australia</option>
                          <option>Canada</option>
                          <option>Germany</option>
                          <option>France</option>
                          <option>Japan</option>
                          <option>Singapore</option>
                          <option>UAE</option>
                        </select>
                      )
                      : <div className="field-value">{country || "—"}</div>}
                  </div>
                </div>

                {editingAccount && (
                  <div className="btn-row">
                    <button className="save-btn" onClick={handleSaveAccount} disabled={savingAccount}>
                      {savingAccount ? "Saving…" : "✓ Save Changes"}
                    </button>
                    <button className="cancel-btn" onClick={() => setEditingAccount(false)}>Cancel</button>
                  </div>
                )}

                {accountStatus && (
                  <div className={`status-msg ${accountStatus.type}`}>
                    {accountStatus.type === "success" ? "✓" : "✕"} {accountStatus.msg}
                  </div>
                )}
              </div>

              <div className="profile-card">
                <div className="card-header">
                  <div className="card-title-wrap">
                    <div className="card-icon gold">🖼️</div>
                    <div>
                      <div className="card-title">Profile Photo</div>
                      <div className="card-subtitle">Upload a photo to personalize your account</div>
                    </div>
                  </div>
                </div>
                <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
                  <div className="photo-upload-icon">📤</div>
                  <div className="photo-upload-label">Click to upload a new profile photo</div>
                  <div className="photo-upload-sub">JPG, PNG, WEBP — max 5 MB</div>
                </div>
              </div>
            </>
          )}

          {/* ════ TAB: SETTINGS ════ */}
          {activeTab === "settings" && (
            <>
              {/* Change Password */}
              <div className="profile-card">
                <div className="card-header">
                  <div className="card-title-wrap">
                    <div className="card-icon blue">🔑</div>
                    <div>
                      <div className="card-title">Change Password</div>
                      <div className="card-subtitle">Update your password to keep your account safe</div>
                    </div>
                  </div>
                </div>

                <div className="form-grid single">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="form-input"
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        placeholder="Enter your current password"
                        style={{ paddingRight: 44 }}
                      />
                      <button className="pw-eye-btn" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                        {showCurrentPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="form-input"
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        placeholder="Enter your new password"
                        style={{ paddingRight: 44 }}
                      />
                      <button className="pw-eye-btn" onClick={() => setShowNewPw(!showNewPw)}>
                        {showNewPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {newPw && (
                      <>
                        <div className="pw-strength-bar">
                          <div className="pw-strength-fill" style={{ width: pwStrength.width, background: pwStrength.color }} />
                        </div>
                        <div className="pw-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</div>
                      </>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="form-input"
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        placeholder="Re-enter your new password"
                        style={{ paddingRight: 44 }}
                      />
                      <button className="pw-eye-btn" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                        {showConfirmPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {confirmPw && newPw && (
                      <div style={{ fontSize: 12, marginTop: 5, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: newPw === confirmPw ? "#16a34a" : "#dc2626" }}>
                        {newPw === confirmPw ? "✓ Passwords match" : "✕ Passwords do not match"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="btn-row">
                  <button className="save-btn" onClick={handleChangePassword} disabled={savingPw}>
                    {savingPw ? "Updating…" : "🔒 Update Password"}
                  </button>
                </div>

                {pwStatus && (
                  <div className={`status-msg ${pwStatus.type}`}>
                    {pwStatus.type === "success" ? "✓" : "✕"} {pwStatus.msg}
                  </div>
                )}
              </div>

              {/* Sign Out */}
              <div className="profile-card signout-card">
                <div>
                  <div className="signout-title">Sign Out</div>
                  <div className="signout-sub">Signed in as {user.email}</div>
                </div>
                <button className="signout-btn" onClick={handleLogout}>
                  Sign Out →
                </button>
              </div>

              {/* Delete Account */}
              <div className="danger-zone">
                <div className="danger-title">⚠ Danger Zone</div>
                <div className="danger-desc">
                  Deleting your account is permanent and cannot be undone. All your trips, preferences, and data will be permanently removed from Velora.
                </div>
                <button className="danger-btn" onClick={() => {
                  if (window.confirm("Are you absolutely sure? This action cannot be undone.")) handleLogout();
                }}>
                  Delete My Account
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
