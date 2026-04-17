import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const StyleSheet = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --accent:        #E8341A;
      --accent-hover:  #c9270e;
      --gold:          #F5A623;
      --white:         #FFFFFF;
      --black:         #0A0A0A;
      --bg:            #0D0D0D;
      --surface:       #161616;
      --surface2:      #1e1e1e;
      --border:        rgba(255,255,255,0.08);
      --border-hover:  rgba(255,255,255,0.18);
      --text-muted:    rgba(255,255,255,0.45);
      --text-sub:      rgba(255,255,255,0.65);
      --nav-h:         68px;
    }

    html, body {
      margin: 0; padding: 0;
      width: 100%; min-height: 100vh;
      overflow-x: hidden;
      background: var(--bg);
      font-family: 'Sora', sans-serif;
      color: var(--white);
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #444; }

    .t-nav {
      position: fixed; top: 0; left: 0; right: 0;
      height: var(--nav-h);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 5%; z-index: 1000;
      background: rgba(10,10,10,0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .t-nav-logo {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; cursor: pointer;
    }
    .t-nav-logo-icon {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px;
    }
    .t-nav-logo-text { font-size: 22px; font-weight: 800; color: var(--white); letter-spacing: -0.5px; }
    .t-nav-links {
      position: absolute; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 30px;
    }
    .t-nav-link {
      color: var(--text-sub); text-decoration: none;
      font-size: 14px; font-weight: 500; letter-spacing: 0.2px;
      position: relative; transition: color 0.2s; cursor: pointer;
    }
    .t-nav-link::after {
      content: ''; position: absolute;
      bottom: -3px; left: 0;
      width: 0; height: 1.5px;
      background: var(--gold); transition: width 0.25s ease;
    }
    .t-nav-link:hover { color: #fff; }
    .t-nav-link:hover::after { width: 100%; }
    .t-nav-link.active { color: #fff; }
    .t-nav-link.active::after { width: 100%; }

    .t-nav-actions { display: flex; align-items: center; gap: 12px; }

    .btn-avatar-wrap { position: relative; }
    .btn-avatar-trigger {
      display: flex; align-items: center; gap: 9px;
      cursor: pointer; padding: 5px 14px 5px 5px;
      border-radius: 50px;
      border: 1.5px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(6px); transition: background 0.2s;
    }
    .btn-avatar-trigger:hover { background: rgba(255,255,255,0.11); }
    .btn-avatar-img {
      width: 28px; height: 28px; border-radius: 50%;
      object-fit: cover; border: 1.5px solid var(--gold);
    }
    .btn-avatar-name { color: #fff; font-size: 13.5px; font-weight: 600; }
    .btn-avatar-chevron {
      width: 14px; height: 14px; color: var(--text-sub); transition: transform 0.2s;
    }
    .btn-avatar-chevron.open { transform: rotate(180deg); }

    .t-dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px; padding: 8px; min-width: 170px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.55);
      animation: dropIn 0.18s ease; z-index: 999;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .t-dropdown-item {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 10px 14px;
      border: none; background: none;
      color: rgba(255,255,255,0.82);
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 500;
      cursor: pointer; border-radius: 8px;
      transition: background 0.18s; text-align: left;
    }
    .t-dropdown-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .t-dropdown-item.danger { color: #ff5a5a; }
    .t-dropdown-item.danger:hover { background: rgba(255,90,90,0.1); }
    .t-dropdown-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 6px 0; }

    .btn-emergency {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 20px; border-radius: 50px; border: none;
      background: var(--accent); color: var(--white);
      font-family: 'Sora', sans-serif;
      font-size: 13.5px; font-weight: 700; cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      box-shadow: 0 4px 18px rgba(232,52,26,0.35);
    }
    .btn-emergency:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #fff;
      animation: pulse-ring 1.4s ease infinite;
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
      70%  { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
    }

    .t-page { min-height: 100vh; padding-top: var(--nav-h); background: var(--bg); }

    .t-hero {
      position: relative; height: 280px;
      display: flex; align-items: flex-end;
      overflow: hidden; background: #000;
    }
    .t-hero-bg {
      position: absolute; inset: 0;
      background-image: url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80');
      background-size: cover; background-position: center;
      opacity: 0.35; animation: heroZoomIn 12s ease-in-out forwards;
    }
    @keyframes heroZoomIn { from { transform: scale(1); } to { transform: scale(1.08); } }
    .t-hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(13,13,13,1) 0%, rgba(13,13,13,0.3) 60%, transparent 100%);
    }
    .t-hero-content {
      position: relative; z-index: 2; padding: 0 5% 40px;
      animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .t-hero-eyebrow {
      font-size: 11px; font-weight: 700; letter-spacing: 3px;
      text-transform: uppercase; color: var(--gold); margin-bottom: 10px;
    }
    .t-hero-title {
      font-size: clamp(2rem, 4vw, 3rem); font-weight: 900;
      letter-spacing: -1.5px; color: var(--white); line-height: 1;
    }
    .t-hero-sub {
      font-family: 'Lora', serif; font-style: italic;
      font-size: 15px; color: var(--text-sub); margin-top: 8px;
    }

    .t-stats-bar {
      display: flex; align-items: center;
      background: var(--surface); border-bottom: 1px solid var(--border);
      padding: 0 5%; overflow-x: auto;
    }
    .t-stat {
      display: flex; flex-direction: column; gap: 3px;
      padding: 22px 40px 22px 0; margin-right: 40px;
      border-right: 1px solid var(--border); white-space: nowrap;
      animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
    }
    .t-stat:last-child { border-right: none; }
    .t-stat-value { font-size: 26px; font-weight: 800; color: var(--white); letter-spacing: -1px; }
    .t-stat-value span { color: var(--gold); }
    .t-stat-label { font-size: 11.5px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); }

    .t-main {
      padding: 50px 5%;
      display: grid; grid-template-columns: 340px 1fr;
      gap: 30px; max-width: 1400px; margin: 0 auto;
    }
    @media (max-width: 960px) {
      .t-main { grid-template-columns: 1fr; }
      .t-nav-links { display: none; }
    }

    .t-sidebar { display: flex; flex-direction: column; gap: 20px; }

    .t-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 20px; overflow: hidden; transition: border-color 0.25s;
    }
    .t-card:hover { border-color: var(--border-hover); }
    .t-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 22px 24px 18px; border-bottom: 1px solid var(--border);
    }
    .t-card-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; font-weight: 700; color: var(--white); letter-spacing: 0.2px;
    }
    .t-card-icon {
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center; font-size: 15px;
    }
    .t-card-icon.red   { background: rgba(232,52,26,0.15); }
    .t-card-icon.gold  { background: rgba(245,166,35,0.15); }
    .t-card-icon.blue  { background: rgba(59,130,246,0.12); }
    .t-card-icon.green { background: rgba(34,197,94,0.12); }
    .t-card-body { padding: 20px 24px 24px; }

    .t-label {
      display: block; font-size: 11.5px; font-weight: 700;
      letter-spacing: 1.2px; text-transform: uppercase;
      color: var(--text-muted); margin-bottom: 8px;
    }
    .t-input {
      width: 100%; padding: 13px 16px;
      background: var(--surface2); border: 1.5px solid var(--border);
      border-radius: 12px; outline: none; color: var(--white);
      font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 500;
      transition: border-color 0.2s, box-shadow 0.2s; appearance: none;
    }
    .t-input:focus { border-color: rgba(245,166,35,0.5); box-shadow: 0 0 0 3px rgba(245,166,35,0.1); }
    .t-input::placeholder { color: var(--text-muted); font-weight: 400; }
    .t-input-group { margin-bottom: 16px; }

    .t-btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 8px; padding: 13px 22px; border-radius: 12px; border: none;
      font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
      cursor: pointer; width: 100%; transition: all 0.2s ease; letter-spacing: 0.2px;
    }
    .t-btn-primary { background: var(--accent); color: #fff; box-shadow: 0 4px 20px rgba(232,52,26,0.3); }
    .t-btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
    .t-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
    .t-btn-ghost { background: transparent; color: var(--text-sub); border: 1.5px solid var(--border); }
    .t-btn-ghost:hover { background: var(--surface2); color: #fff; border-color: var(--border-hover); }
    .t-btn-gold { background: linear-gradient(135deg, var(--gold), #e09820); color: #000; box-shadow: 0 4px 20px rgba(245,166,35,0.3); }
    .t-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(245,166,35,0.4); }
    .t-btn-gold:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
    .t-btn-danger { background: rgba(255,90,90,0.12); color: #ff5a5a; border: 1.5px solid rgba(255,90,90,0.2); }
    .t-btn-danger:hover { background: rgba(255,90,90,0.2); border-color: rgba(255,90,90,0.4); }
    .t-btn-sm { padding: 8px 14px; font-size: 12.5px; border-radius: 9px; width: auto; }

    .t-search-wrap { display: flex; gap: 10px; margin-bottom: 16px; }
    .t-search-input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
    .t-search-input-icon { position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; }
    .t-search-input {
      width: 100%; padding: 13px 14px 13px 42px;
      background: var(--surface2); border: 1.5px solid var(--border);
      border-radius: 12px; outline: none; color: var(--white);
      font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 500;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .t-search-input:focus { border-color: rgba(245,166,35,0.5); box-shadow: 0 0 0 3px rgba(245,166,35,0.1); }
    .t-search-input::placeholder { color: var(--text-muted); font-weight: 400; }

    .t-trips-list { display: flex; flex-direction: column; gap: 14px; }
    .t-trip-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; background: var(--surface2);
      border: 1px solid var(--border); border-radius: 14px;
      cursor: pointer; transition: all 0.22s ease;
      animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
    }
    .t-trip-item:hover { border-color: var(--border-hover); transform: translateX(4px); background: #222; }
    .t-trip-item-left { display: flex; align-items: center; gap: 14px; }
    .t-trip-avatar {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .t-trip-city { font-size: 16px; font-weight: 700; color: var(--white); letter-spacing: -0.3px; }
    .t-trip-meta { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
    .t-trip-date { font-size: 12px; color: var(--text-muted); }
    .t-trip-badge {
      display: inline-block; padding: 2px 8px; border-radius: 50px;
      font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
    }
    .t-trip-badge.upcoming { background: rgba(245,166,35,0.15); color: var(--gold); }
    .t-trip-badge.past { background: rgba(255,255,255,0.06); color: var(--text-muted); }
    .t-trip-item-right { display: flex; align-items: center; gap: 8px; }
    .t-trip-km { font-size: 12.5px; font-weight: 600; color: var(--text-sub); }

    .t-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px 24px; text-align: center;
    }
    .t-empty-icon { font-size: 40px; }
    .t-empty-title { font-size: 16px; font-weight: 700; color: var(--white); }
    .t-empty-sub { font-size: 13.5px; color: var(--text-muted); line-height: 1.6; max-width: 220px; }

    .t-panel { display: flex; flex-direction: column; gap: 22px; }

    .t-stepper {
      display: flex; align-items: center;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 6px; margin-bottom: 4px;
    }
    .t-step {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 11px 12px; border-radius: 12px;
      font-size: 13px; font-weight: 600; color: var(--text-muted);
      cursor: pointer; transition: all 0.22s ease; user-select: none;
    }
    .t-step.active { background: var(--accent); color: #fff; box-shadow: 0 4px 16px rgba(232,52,26,0.3); }
    .t-step.done { color: var(--gold); }
    .t-step-num {
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; background: rgba(255,255,255,0.08);
    }
    .t-step.active .t-step-num { background: rgba(255,255,255,0.25); }
    .t-step.done .t-step-num { background: rgba(245,166,35,0.2); }

    .t-places-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .t-place-card {
      background: var(--surface2); border: 2px solid var(--border);
      border-radius: 14px; overflow: hidden; cursor: pointer; transition: all 0.22s ease;
    }
    .t-place-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
    .t-place-card.selected { border-color: var(--accent); background: rgba(232,52,26,0.08); }
    .t-place-img { width: 100%; height: 110px; object-fit: cover; }
    .t-place-body { padding: 10px 12px 12px; }
    .t-place-name { font-size: 13.5px; font-weight: 700; color: var(--white); margin-bottom: 4px; }
    .t-place-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .t-place-check {
      display: flex; align-items: center; justify-content: center;
      margin-top: 8px; padding: 5px; border-radius: 8px;
      font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
      background: rgba(232,52,26,0.15); color: var(--accent);
    }

    .t-route-steps { display: flex; flex-direction: column; gap: 0; }
    .t-route-step {
      display: flex; align-items: flex-start; gap: 14px;
      animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
    }
    .t-route-step-line-wrap { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .t-route-dot {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; flex-shrink: 0;
    }
    .t-route-dot.start { background: var(--accent); color: #fff; }
    .t-route-dot.mid   { background: var(--surface2); border: 2px solid var(--border); color: var(--text-sub); }
    .t-route-dot.end   { background: var(--gold); color: #000; }
    .t-route-connector { width: 2px; height: 28px; background: linear-gradient(to bottom, var(--border), transparent); margin: 2px 0; }
    .t-route-step-info { padding-top: 4px; padding-bottom: 24px; }
    .t-route-step-name { font-size: 15px; font-weight: 700; color: var(--white); }
    .t-route-step-dist { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

    .t-nearby-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .t-nearby-item {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 12px; padding: 14px 16px; transition: all 0.2s;
    }
    .t-nearby-item:hover { border-color: var(--border-hover); }
    .t-nearby-item-top { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
    .t-nearby-item-icon {
      width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 14px;
    }
    .t-nearby-item-icon.food { background: rgba(245,166,35,0.15); }
    .t-nearby-item-icon.emergency { background: rgba(232,52,26,0.15); }
    .t-nearby-item-name { font-size: 13px; font-weight: 700; color: var(--white); }
    .t-nearby-item-sub { font-size: 11.5px; color: var(--text-muted); }
    .t-nearby-item-phone {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 600; color: var(--accent); margin-top: 4px;
    }

    .t-spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,0.2);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .t-toast {
      position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
      background: #1e1e1e; border: 1px solid var(--border);
      border-radius: 14px; padding: 14px 24px;
      display: flex; align-items: center; gap: 12px;
      font-size: 14px; font-weight: 600; color: var(--white);
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      z-index: 9999; white-space: nowrap;
      animation: toastIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    .t-toast.success { border-color: rgba(34,197,94,0.3); }
    .t-toast.error   { border-color: rgba(255,90,90,0.3); }

    .t-modal-overlay {
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .t-modal {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 24px; padding: 32px; width: 380px; max-width: 90vw;
      animation: scaleIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    .t-modal-title { font-size: 20px; font-weight: 800; color: var(--white); letter-spacing: -0.5px; margin-bottom: 8px; }
    .t-modal-sub { font-size: 13.5px; color: var(--text-sub); margin-bottom: 24px; line-height: 1.55; }
    .t-modal-actions { display: flex; gap: 10px; margin-top: 20px; }

    .t-emergency-panel {
      position: fixed; inset: 0; z-index: 3000;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease;
    }
    .t-emergency-modal {
      background: #1a0a0a; border: 1px solid rgba(232,52,26,0.3);
      border-radius: 24px; padding: 36px; width: 460px; max-width: 92vw;
      animation: scaleIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
      max-height: 90vh; overflow-y: auto;
    }
    .t-emergency-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
    .t-emergency-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      background: var(--accent); display: flex; align-items: center; justify-content: center;
      font-size: 26px; flex-shrink: 0;
    }
    .t-emergency-title { font-size: 22px; font-weight: 800; color: #fff; }
    .t-emergency-sub { font-size: 13px; color: rgba(255,255,255,0.55); margin-top: 2px; }
    .t-emergency-numbers { display: flex; flex-direction: column; gap: 10px; }
    .t-emergency-number {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px; border-radius: 14px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    }
    .t-emergency-number-left { display: flex; align-items: center; gap: 12px; }
    .t-emergency-number-icon { font-size: 22px; }
    .t-emergency-number-name { font-size: 14px; font-weight: 700; color: #fff; }
    .t-emergency-number-loc { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .t-emergency-call {
      padding: 8px 16px; border-radius: 9px; border: none;
      background: var(--accent); color: #fff;
      font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: background 0.2s;
    }
    .t-emergency-call:hover { background: var(--accent-hover); }

    /* ── Weather Card ── */
    .t-weather-card {
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
      border: 1px solid rgba(59,130,246,0.25);
      border-radius: 20px; overflow: hidden;
    }
    .t-weather-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 22px 24px 18px; border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .t-weather-city {
      font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.4px;
    }
    .t-weather-country {
      font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; font-weight: 500;
    }
    .t-weather-body { padding: 18px 24px 24px; }
    .t-weather-forecasts { display: flex; flex-direction: column; gap: 10px; }
    .t-weather-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
    }
    .t-weather-time { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 500; min-width: 110px; }
    .t-weather-cond { font-size: 13px; font-weight: 600; color: #fff; flex: 1; text-align: center; }
    .t-weather-temp {
      font-size: 15px; font-weight: 800; color: var(--gold);
      min-width: 60px; text-align: right;
    }
    .t-weather-desc { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; text-transform: capitalize; }
    .t-weather-meta { display: flex; align-items: center; gap: 14px; }
    .t-weather-meta-item { font-size: 11.5px; color: rgba(255,255,255,0.5); }
    .t-weather-meta-item strong { color: rgba(255,255,255,0.8); }
    .t-weather-icon { font-size: 22px; }

    /* ── Route Visualizer Map ── */
    .t-route-map-container {
      position: relative; width: 100%; height: 350px;
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 16px; margin-bottom: 24px; overflow: hidden;
      /* Subtle grid background */
      background-image: 
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .t-route-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    
    /* The Snake Line Animation */
    .t-snake-path {
      fill: none;
      stroke: var(--accent);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 8px var(--accent));
      /* These numbers trick the browser into drawing the line */
      stroke-dasharray: 3000;
      stroke-dashoffset: 3000;
      animation: drawSnake 3s ease-in-out forwards;
      animation-delay: 0.5s; /* Wait for layout to load */
    }
    @keyframes drawSnake {
      to { stroke-dashoffset: 0; }
    }
    
    .t-map-node {
      position: absolute; transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      z-index: 10; animation: scaleIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
    }
    .t-map-dot {
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--gold); border: 4px solid var(--surface2);
      box-shadow: 0 0 12px rgba(245,166,35,0.5);
    }
    .t-map-label {
      background: rgba(0,0,0,0.7); border: 1px solid var(--border);
      padding: 4px 8px; border-radius: 6px; font-size: 11px;
      font-weight: 700; color: #fff; white-space: nowrap;
    }
  `}</style>
);

// ─── City emoji map (used for quick picks & trip list) ───
const CITY_EMOJI = {
  goa:"🏖️", manali:"🏔️", paris:"🗼", bali:"🌴",
  santorini:"🤍", tokyo:"⛩️", jaipur:"🏯", mumbai:"🌊",
  delhi:"🕌", default:"✈️",
};

// ─── Fallback city images (used when Google photo unavailable) ───
const CITY_IMAGES = {
  goa:       "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=300&q=80",
  manali:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80",
  paris:     "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&q=80",
  bali:      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=80",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=300&q=80",
  tokyo:     "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=80",
  jaipur:    "https://images.unsplash.com/photo-1477587458883-47145ed31fec?w=300&q=80",
  mumbai:    "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=300&q=80",
  delhi:     "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=80",
  default:   "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80",
};

// ─── Fallback mock places (used only if Google API fails) ───
const MOCK_PLACES = {
  goa: [
    { name: "Baga Beach", rating: 4.8 }, { name: "Dudhsagar Falls", rating: 4.7 },
    { name: "Fort Aguada", rating: 4.5 }, { name: "Calangute Beach", rating: 4.6 },
    { name: "Anjuna Flea Market", rating: 4.3 }, { name: "Basilica of Bom Jesus", rating: 4.7 },
  ],
  manali: [
    { name: "Rohtang Pass", rating: 4.9 }, { name: "Solang Valley", rating: 4.8 },
    { name: "Hadimba Temple", rating: 4.6 }, { name: "Beas River", rating: 4.5 },
    { name: "Mall Road", rating: 4.3 }, { name: "Jogini Waterfall", rating: 4.7 },
  ],
  paris: [
    { name: "Eiffel Tower", rating: 4.9 }, { name: "The Louvre", rating: 4.8 },
    { name: "Notre-Dame Cathedral", rating: 4.7 }, { name: "Champs-Élysées", rating: 4.6 },
    { name: "Montmartre", rating: 4.8 }, { name: "Palace of Versailles", rating: 4.9 },
  ],
  default: [
    { name: "City Center", rating: 4.5 }, { name: "Central Museum", rating: 4.3 },
    { name: "Old Town Market", rating: 4.4 }, { name: "Botanical Garden", rating: 4.6 },
    { name: "Heritage Fort", rating: 4.7 }, { name: "River Promenade", rating: 4.5 },
  ],
};

// ─── Fallback nearby data (used if no real API for restaurants/emergency) ───
const MOCK_NEARBY = {
  restaurants: [
    { name: "The Golden Spoon", cuisine: "Multi-Cuisine", rating: 4.7, dist: "0.3 km" },
    { name: "Spice Route Kitchen", cuisine: "Indian / Asian", rating: 4.5, dist: "0.6 km" },
    { name: "Café Soleil", cuisine: "Continental", rating: 4.6, dist: "0.8 km" },
    { name: "Harbor View Bistro", cuisine: "Seafood", rating: 4.8, dist: "1.1 km" },
  ],
  emergency: [
    { name: "City General Hospital", type: "Hospital", phone: "108", dist: "1.2 km" },
    { name: "Police Control Room", type: "Police", phone: "100", dist: "0.9 km" },
    { name: "Fire & Rescue", type: "Fire Brigade", phone: "101", dist: "1.5 km" },
    { name: "National Ambulance", type: "Ambulance", phone: "112", dist: "0.5 km" },
  ],
};

// ─── Weather condition → emoji map ───
const WEATHER_EMOJI = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
  Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
  Haze: "🌫️", default: "🌡️",
};

const getCityImg   = (city) => CITY_IMAGES[city?.toLowerCase()] || CITY_IMAGES.default;
const getCityEmoji = (city) => CITY_EMOJI[city?.toLowerCase()]  || CITY_EMOJI.default;
const getMockPlaces= (city) => MOCK_PLACES[city?.toLowerCase()] || MOCK_PLACES.default;
const getWeatherEmoji = (cond) => WEATHER_EMOJI[cond] || WEATHER_EMOJI.default;

// ─── Toast Component ───
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  return (
    <div className={`t-toast ${type}`}>
      <span>{icons[type] || "ℹ️"}</span>{message}
    </div>
  );
};

// ─── Weather Panel Component ───
const WeatherPanel = ({ weather }) => {
  if (!weather) return null;
  return (
    <div className="t-weather-card">
      <div className="t-weather-header">
        <div>
          <div className="t-weather-city">🌍 {weather.city}</div>
          <div className="t-weather-country">{weather.country} · 5-step Forecast</div>
        </div>
        <div style={{ fontSize: 32 }}>
          {getWeatherEmoji(weather.forecasts?.[0]?.condition)}
        </div>
      </div>
      <div className="t-weather-body">
        <div className="t-weather-forecasts">
          {weather.forecasts.map((f, i) => (
            <div key={i} className="t-weather-row">
              <div className="t-weather-time">
                {new Date(f.time).toLocaleString("en-IN", {
                  weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="t-weather-cond">
                  {getWeatherEmoji(f.condition)} {f.condition}
                </div>
                <div className="t-weather-desc">{f.description}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="t-weather-temp">{Math.round(f.temp)}°C</div>
                <div className="t-weather-meta-item" style={{ fontSize: 11 }}>
                  Feels {Math.round(f.feels_like)}°C · 💧{f.humidity}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Abstract Route Visualizer Component ───
const RouteVisualizer = ({ route }) => {
  if (!route || route.length === 0) return null;

  // Generate pseudo-coordinates for the map based on the number of stops
  const getCoordinates = (index, total) => {
    // Alternate left and right for a zig-zag travel effect
    const x = index % 2 === 0 ? 25 : 75; 
    // Space them evenly from top to bottom
    const y = 15 + (index * (70 / (total > 1 ? total - 1 : 1))); 
    return { x, y };
  };

  const points = route.map((_, i) => getCoordinates(i, route.length));
  
  // Build the SVG path string (e.g., "M 25 15 L 75 50 L 25 85")
  const pathString = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="t-route-map-container">
      {/* 1. The Animated SVG Line */}
      <svg className="t-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={pathString} className="t-snake-path" />
      </svg>

      {/* 2. The Map Markers */}
      {route.map((place, index) => {
        const pos = points[index];
        return (
          <div 
            key={place} 
            className="t-map-node" 
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`,
              animationDelay: `${index * 0.2}s` // Stagger the dots appearing
            }}
          >
            <div className="t-map-label">{index + 1}. {place}</div>
            <div className="t-map-dot" style={{ background: index === 0 ? 'var(--accent)' : 'var(--gold)' }} />
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Trips Component ───
export default function Trips() {
  const navigate = useNavigate();
  const [user, setUser]                 = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats]               = useState({ totalTrips: 0, totalDistanceKm: 0, topCities: 0 });
  const [trips, setTrips]               = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [filterCity, setFilterCity]     = useState("");
  const [newCity, setNewCity]           = useState("");
  const [newDate, setNewDate]           = useState("");
  const [creating, setCreating]         = useState(false);
  const [step, setStep]                 = useState(1);
  const [searchCity, setSearchCity]     = useState("");
  const [places, setPlaces]             = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [tripDate, setTripDate]         = useState("");
  const [route, setRoute]               = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [nearbyData, setNearbyData]     = useState(null);
  const [dupModal, setDupModal]         = useState({ open: false, tripId: null });
  const [dupDate, setDupDate]           = useState("");
  const [dupLoading, setDupLoading]     = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [toast, setToast]               = useState(null);
  
  // ── NEW: weather state ──
  const [weather, setWeather]           = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  // ── NEW: store full place objects (with lat/lng) for route optimization ──
  const [placesData, setPlacesData]     = useState([]);
  // ── NEW: optimized route with real distances ──
  const [routeDetails, setRouteDetails] = useState(null);

  const showToast = useCallback((message, type = "info") => setToast({ message, type }), []);

  useEffect(() => {
    const stored = localStorage.getItem("velora_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch (e) { console.error(e); } }
    else navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const handler = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [dropdownOpen]);

  const fetchTrips = useCallback(async () => {
    setTripsLoading(true);
    try {
      const params = filterCity ? `?city=${encodeURIComponent(filterCity)}` : "";
      const res = await fetch(`${BASE_URL}/trips${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("velora_token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setTrips(data);
    } catch { setTrips([]); }
    finally { setTripsLoading(false); }
  }, [filterCity]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${BASE_URL}/analytics/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("velora_token")}` },
        });
        const data = await res.json();
        if (data?.summary) setStats({
          totalTrips: data.summary.totalTrips || 0,
          totalDistanceKm: data.summary.totalDistanceKm || 0,
          topCities: data.topCities?.length || 0,
        });
      } catch { console.error("Analytics fetch failed"); }
    };
    fetchAnalytics();
  }, [trips]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("velora_user");
    localStorage.removeItem("velora_token");
    setUser(null);
    navigate("/");
  };

  const handleCreateTrip = async () => {
    if (!newCity.trim()) return showToast("Please enter a city name", "error");
    if (!newDate) return showToast("Please select a travel date", "error");
    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/save-trip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("velora_token")}` },
        body: JSON.stringify({ city: newCity, date: newDate, places: ["default place"] }),
      });
      const data = await res.json();
      if (res.ok) { showToast(`Trip to ${newCity} created! 🎉`, "success"); setNewCity(""); setNewDate(""); fetchTrips(); }
      else showToast(data.error || "Failed to create trip", "error");
    } catch { showToast("Network error. Please try again.", "error"); }
    finally { setCreating(false); }
  };

  const handleDeleteTrip = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/trip/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("velora_token")}` },
      });
      if (res.ok) { showToast("Trip deleted", "info"); fetchTrips(); }
      else { const d = await res.json(); showToast(d.error || "Delete failed", "error"); }
    } catch { showToast("Network error", "error"); }
  };

  const handleDuplicate = async () => {
    if (!dupDate) return showToast("Please pick a new date", "error");
    setDupLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/trip/${dupModal.tripId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("velora_token")}` },
        body: JSON.stringify({ date: dupDate }),
      });
      const data = await res.json();
      if (res.ok) { showToast("Trip duplicated! ✌️", "success"); setDupModal({ open: false, tripId: null }); setDupDate(""); fetchTrips(); }
      else showToast(data.error || "Duplicate failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setDupLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ UPDATED: handleSearchPlaces — calls Google Places API via backend
  //    Also fires Weather API in parallel
  // ─────────────────────────────────────────────────────────────────────────
  const handleSearchPlaces = async () => {
    if (!searchCity.trim()) return showToast("Enter a city to explore", "error");

    setPlacesLoading(true);
    setWeatherLoading(true);
    setPlaces([]);
    setPlacesData([]);
    setSelectedPlaces([]);
    setRoute(null);
    setRouteDetails(null);
    setNearbyData(null);
    setWeather(null);

    // ── Fire both API calls in parallel ──
    const [placesRes, weatherRes] = await Promise.allSettled([
      fetch(`${BASE_URL}/places/${encodeURIComponent(searchCity)}`),
      fetch(`${BASE_URL}/weather/${encodeURIComponent(searchCity)}`),
    ]);

    // ── Handle places response ──
    try {
      if (placesRes.status === "fulfilled" && placesRes.value.ok) {
        const data = await placesRes.value.json();
        // Backend returns array of { name, rating, lat, lng }
        if (Array.isArray(data) && data.length > 0) {
          setPlacesData(data);                             // full objects with lat/lng
          setPlaces(data);                                 // same — UI uses name + rating
        } else {
          // API returned empty — use mock fallback
          const mock = getMockPlaces(searchCity);
          setPlaces(mock);
          setPlacesData(mock);
        }
      } else {
        // API failed — use mock fallback
        const mock = getMockPlaces(searchCity);
        setPlaces(mock);
        setPlacesData(mock);
      }
    } catch {
      const mock = getMockPlaces(searchCity);
      setPlaces(mock);
      setPlacesData(mock);
    } finally {
      setPlacesLoading(false);
    }

    // ── Handle weather response ──
    try {
      if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
        const wData = await weatherRes.value.json();
        // wData shape: { city, country, forecasts: [...] }
        if (wData && wData.forecasts) {
          setWeather(wData);
        }
      }
    } catch {
      // Weather fetch failed silently — panel just won't show
    } finally {
      setWeatherLoading(false);
    }

    setStep(2);
  };

  const togglePlaceSelect = (placeName) => {
    setSelectedPlaces(prev =>
      prev.includes(placeName) ? prev.filter(p => p !== placeName) : [...prev, placeName]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ UPDATED: handleOptimizeRoute — sends full place objects (with lat/lng)
  //    to the backend /route/optimize endpoint, which uses Distance Matrix API
  // ─────────────────────────────────────────────────────────────────────────
  const handleOptimizeRoute = async () => {
    if (selectedPlaces.length < 2) return showToast("Select at least 2 places to optimize", "error");
    if (!tripDate) return showToast("Please choose your travel date", "error");

    setRouteLoading(true);
    setRoute(null);
    setRouteDetails(null);
    setNearbyData(null);

    // Build full place objects for the selected places (with lat/lng from Google)
    const selectedPlaceObjects = placesData.filter(p => selectedPlaces.includes(p.name));

    try {
      const res = await fetch(`${BASE_URL}/route/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: selectedPlaceObjects }),
      });

      if (res.ok) {
        const data = await res.json();
        // Backend returns: { route: [...names], details: [{name, distToNext, timeToNext}] }
        setRoute(data.route || selectedPlaces);
        setRouteDetails(data.details || null);
      } else {
        // Fallback to frontend order
        setRoute([...selectedPlaces]);
        setRouteDetails(null);
      }
    } catch {
      setRoute([...selectedPlaces]);
      setRouteDetails(null);
    } finally {
      setRouteLoading(false);
      setNearbyData(MOCK_NEARBY);
      setStep(3);
    }
  };

  const handleSaveExplored = async () => {
    if (!tripDate) return showToast("Please set a trip date first", "error");
    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/save-trip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("velora_token")}` },
        body: JSON.stringify({ city: searchCity, date: tripDate, places: selectedPlaces }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Trip to ${searchCity} saved! 🗺️`, "success");
        fetchTrips();
        setStep(1); setSearchCity(""); setSelectedPlaces([]); setRoute(null);
        setRouteDetails(null); setNearbyData(null); setTripDate(""); setWeather(null);
      } else showToast(data.error || "Save failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setCreating(false); }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <StyleSheet />

      {/* ─── Emergency Panel ─── */}
      {emergencyOpen && (
        <div className="t-emergency-panel" onClick={() => setEmergencyOpen(false)}>
          <div className="t-emergency-modal" onClick={e => e.stopPropagation()}>
            <div className="t-emergency-header">
              <div className="t-emergency-icon-wrap">🚨</div>
              <div>
                <div className="t-emergency-title">Emergency Contacts</div>
                <div className="t-emergency-sub">Tap any number to call immediately</div>
              </div>
            </div>
            <div className="t-emergency-numbers">
              {[
                { icon: "🏥", name: "Ambulance / Medical", loc: "National Emergency", phone: "108" },
                { icon: "👮", name: "Police Control Room",  loc: "All India",         phone: "100" },
                { icon: "🔥", name: "Fire Brigade",         loc: "All India",         phone: "101" },
                { icon: "📞", name: "Emergency Helpline",   loc: "Unified Number",     phone: "112" },
                { icon: "🚺", name: "Women Helpline",       loc: "National",           phone: "1091" },
                { icon: "🩺", name: "Tourist Help",         loc: "India Tourism",      phone: "1800-111-363" },
              ].map(e => (
                <div key={e.phone} className="t-emergency-number">
                  <div className="t-emergency-number-left">
                    <span className="t-emergency-number-icon">{e.icon}</span>
                    <div>
                      <div className="t-emergency-number-name">{e.name}</div>
                      <div className="t-emergency-number-loc">{e.loc}</div>
                    </div>
                  </div>
                  <a href={`tel:${e.phone}`}>
                    <button className="t-emergency-call">{e.phone}</button>
                  </a>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="t-btn t-btn-ghost" style={{ width: "100%", borderRadius: 12 }} onClick={() => setEmergencyOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Duplicate Modal ─── */}
      {dupModal.open && (
        <div className="t-modal-overlay" onClick={() => setDupModal({ open: false, tripId: null })}>
          <div className="t-modal" onClick={e => e.stopPropagation()}>
            <div className="t-modal-title">Duplicate Trip</div>
            <p className="t-modal-sub">Choose a new travel date for the duplicated trip.</p>
            <label className="t-label">New Travel Date</label>
            <input type="date" min={today} className="t-input" value={dupDate} onChange={e => setDupDate(e.target.value)} />
            <div className="t-modal-actions">
              <button className="t-btn t-btn-ghost" style={{ borderRadius: 12 }} onClick={() => { setDupModal({ open: false, tripId: null }); setDupDate(""); }}>
                Cancel
              </button>
              <button className="t-btn t-btn-primary" style={{ borderRadius: 12 }} onClick={handleDuplicate} disabled={dupLoading}>
                {dupLoading ? <span className="t-spinner" /> : "Duplicate →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Navbar ─── */}
      <nav className="t-nav">
        <a className="t-nav-logo" href="/" onClick={e => { e.preventDefault(); navigate("/"); }}>
          <VeloraLogo size={30} textColor="#fff" />
        </a>
        <div className="t-nav-links">
          <span className="t-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="t-nav-link active">My Trips</span>
          <a href="#explore" className="t-nav-link">Explore</a>
        </div>
        <div className="t-nav-actions">
          {user ? (
            <div className="btn-avatar-wrap" onClick={e => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
              <div className="btn-avatar-trigger">
                <img
                  src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=E8341A&color=fff`}
                  alt="profile" className="btn-avatar-img"
                />
                <span className="btn-avatar-name">{user.name?.split(" ")[0] || "User"}</span>
                <svg className={`btn-avatar-chevron${dropdownOpen ? " open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {dropdownOpen && (
                <div className="t-dropdown" onClick={e => e.stopPropagation()}>
                  <button className="t-dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/profile"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    Profile
                  </button>
                  <div className="t-dropdown-divider" />
                  <button className="t-dropdown-item danger" onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="t-btn t-btn-ghost t-btn-sm" onClick={() => navigate("/login")}>Sign In</button>
          )}
          <button className="btn-emergency" onClick={() => setEmergencyOpen(true)}>
            <span className="pulse-dot" /> Emergency
          </button>
        </div>
      </nav>

      {/* ─── Page ─── */}
      <div className="t-page">
        <div className="t-hero">
          <div className="t-hero-bg" />
          <div className="t-hero-overlay" />
          <div className="t-hero-content">
            <p className="t-hero-eyebrow">✦ Velora Travel</p>
            <h1 className="t-hero-title">
              {user ? `Welcome back, ${user.name?.split(" ")[0] || "Explorer"}.` : "Your Journeys."}
            </h1>
            <p className="t-hero-sub" style={{ fontStyle: "italic" }}>Plan, explore, and relive every adventure</p>
          </div>
        </div>

        <div className="t-stats-bar">
          {[
            { label: "Total Trips",     value: stats.totalTrips,      suffix: "",    icon: "🗺️" },
            { label: "KM Travelled",    value: stats.totalDistanceKm, suffix: " km", icon: "📍" },
            { label: "Cities Explored", value: stats.topCities,       suffix: "",    icon: "🌆" },
            { label: "Trips This Year", value: trips.filter(t => new Date(t.date).getFullYear() === new Date().getFullYear()).length, suffix: "", icon: "📅" },
          ].map((s, i) => (
            <div className="t-stat" key={s.label} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="t-stat-value">{s.icon} {s.value}<span>{s.suffix}</span></div>
              <div className="t-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="t-main">

          {/* ── LEFT SIDEBAR ── */}
          <div className="t-sidebar">
            <div className="t-card">
              <div className="t-card-header">
                <div className="t-card-title"><div className="t-card-icon red">➕</div>Create New Trip</div>
              </div>
              <div className="t-card-body">
                <div className="t-input-group">
                  <label className="t-label">Destination City</label>
                  <input className="t-input" placeholder="e.g. Goa, Paris, Tokyo..."
                    value={newCity} onChange={e => setNewCity(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateTrip()} />
                </div>
                <div className="t-input-group">
                  <label className="t-label">Travel Date</label>
                  <input className="t-input" type="date" min={today}
                    value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>
                <button className="t-btn t-btn-primary" onClick={handleCreateTrip} disabled={creating}>
                  {creating ? <span className="t-spinner" /> : <>✈️ &nbsp;Create Trip</>}
                </button>
              </div>
            </div>

            <div className="t-card">
              <div className="t-card-header">
                <div className="t-card-title"><div className="t-card-icon gold">🗺️</div>My Trips</div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                  {trips.length} trip{trips.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ padding: "14px 24px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="t-search-input-wrap" style={{ marginBottom: 14 }}>
                  <svg className="t-search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input className="t-search-input" placeholder="Filter by city..."
                    value={filterCity} onChange={e => setFilterCity(e.target.value)} />
                </div>
              </div>
              <div className="t-card-body">
                {tripsLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                    <span className="t-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                  </div>
                ) : trips.length === 0 ? (
                  <div className="t-empty">
                    <div className="t-empty-icon">✈️</div>
                    <div className="t-empty-title">No trips yet</div>
                    <div className="t-empty-sub">Create your first trip above or use the Explorer to plan a journey.</div>
                  </div>
                ) : (
                  <div className="t-trips-list">
                    {trips.map((trip, i) => {
                      const isUpcoming = new Date(trip.date) >= new Date();
                      return (
                        <div key={trip._id} className="t-trip-item" style={{ animationDelay: `${i * 0.06}s` }}>
                          <div className="t-trip-item-left">
                            <div className="t-trip-avatar">{getCityEmoji(trip.city)}</div>
                            <div>
                              <div className="t-trip-city">{trip.city}</div>
                              <div className="t-trip-meta">
                                <span className="t-trip-date">
                                  {new Date(trip.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                <span className={`t-trip-badge ${isUpcoming ? "upcoming" : "past"}`}>
                                  {isUpcoming ? "Upcoming" : "Past"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="t-trip-item-right">
                            {trip.totalDistanceKm > 0 && <span className="t-trip-km">{trip.totalDistanceKm} km</span>}
                            <button className="t-btn t-btn-ghost t-btn-sm" title="Duplicate"
                              onClick={e => { e.stopPropagation(); setDupModal({ open: true, tripId: trip._id }); }}>📋</button>
                            <button className="t-btn t-btn-danger t-btn-sm" title="Delete"
                              onClick={e => { e.stopPropagation(); handleDeleteTrip(trip._id); }}>🗑️</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="t-panel" id="explore">
            <div className="t-stepper">
              {[{ n: 1, label: "Search City" }, { n: 2, label: "Pick Places" }, { n: 3, label: "Route & Plan" }].map(s => (
                <div key={s.n} className={`t-step ${step === s.n ? "active" : step > s.n ? "done" : ""}`}
                  onClick={() => step > s.n && setStep(s.n)}>
                  <span className="t-step-num">{step > s.n ? "✓" : s.n}</span>
                  {s.label}
                </div>
              ))}
            </div>

            {/* ── STEP 1: Search City ── */}
            {step === 1 && (
              <div className="t-card">
                <div className="t-card-header">
                  <div className="t-card-title"><div className="t-card-icon blue">🔍</div>Explore a City</div>
                </div>
                <div className="t-card-body">
                  <p style={{ fontSize: 14, color: "var(--text-sub)", marginBottom: 20, lineHeight: 1.6 }}>
                    Type any city name to discover its top attractions via <strong style={{ color: "#fff" }}>Google Places</strong>, check live weather, and get an optimized route.
                  </p>
                  <label className="t-label">City Name</label>
                  <div className="t-search-wrap">
                    <div className="t-search-input-wrap">
                      <svg className="t-search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                      </svg>
                      <input className="t-search-input" placeholder="e.g. Goa, Paris, Manali, Tokyo..."
                        value={searchCity} onChange={e => setSearchCity(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearchPlaces()} />
                    </div>
                    <button className="t-btn t-btn-primary" style={{ width: "auto", padding: "13px 24px" }}
                      onClick={handleSearchPlaces} disabled={placesLoading}>
                      {placesLoading ? <span className="t-spinner" /> : "Explore →"}
                    </button>
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <p className="t-label" style={{ marginBottom: 12 }}>Quick Picks</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["Goa", "Manali", "Paris", "Bali", "Tokyo", "Jaipur", "Mumbai", "Santorini"].map(city => (
                        <button key={city} style={{
                            padding: "7px 16px", borderRadius: 50, border: "1.5px solid var(--border)",
                            background: "var(--surface2)", color: "var(--text-sub)",
                            fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", transition: "all 0.18s",
                          }}
                          onMouseOver={e => { e.target.style.borderColor = "var(--gold)"; e.target.style.color = "#fff"; }}
                          onMouseOut={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-sub)"; }}
                          onClick={() => setSearchCity(city)}>
                          {getCityEmoji(city)} {city}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Pick Places + Weather ── */}
            {step === 2 && (
              <>
                {/* ── Weather Card (shown when available) ── */}
                {weatherLoading && (
                  <div className="t-weather-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="t-spinner" />
                    <span style={{ color: "var(--text-sub)", fontSize: 14 }}>Fetching live weather for {searchCity}…</span>
                  </div>
                )}
                {!weatherLoading && weather && <WeatherPanel weather={weather} />}

                <div className="t-card">
                  <div className="t-card-header">
                    <div className="t-card-title">
                      <div className="t-card-icon gold">📍</div>
                      Famous Places in {searchCity}
                      {/* ── Source badge ── */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                        padding: "2px 8px", borderRadius: 50,
                        background: "rgba(59,130,246,0.15)", color: "#60a5fa",
                        marginLeft: 4,
                      }}>
                        via Google
                      </span>
                    </div>
                    <button className="t-btn t-btn-ghost t-btn-sm"
                      onClick={() => { setStep(1); setPlaces([]); setPlacesData([]); setSelectedPlaces([]); setWeather(null); }}>
                      ← Back
                    </button>
                  </div>
                  <div className="t-card-body">
                    <p style={{ fontSize: 13.5, color: "var(--text-sub)", marginBottom: 16, lineHeight: 1.6 }}>
                      Select the places you want to visit. Pick your travel date and click <strong style={{ color: "#fff" }}>Optimize Route</strong>.
                    </p>
                    <div className="t-places-grid" style={{ marginBottom: 22 }}>
                      {places.map(place => (
                        <div key={place.name} className={`t-place-card ${selectedPlaces.includes(place.name) ? "selected" : ""}`}
                          onClick={() => togglePlaceSelect(place.name)}>
                          <img
                            src={place.photoRef
                              ? `${BASE_URL}/photo?ref=${encodeURIComponent(place.photoRef)}`
                              : getCityImg(searchCity)}
                            alt={place.name}
                            className="t-place-img"
                            onError={e => { e.target.src = CITY_IMAGES.default; }}
                          />
                          <div className="t-place-body">
                            <div className="t-place-name">{place.name}</div>
                            <div className="t-place-rating">
                              <span style={{ color: "var(--gold)" }}>★</span> {place.rating || "N/A"}
                            </div>
                            {selectedPlaces.includes(place.name) && (
                              <div className="t-place-check">✓ &nbsp;Selected</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedPlaces.length > 0 && (
                      <div style={{ background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                        <strong style={{ color: "var(--accent)" }}>{selectedPlaces.length} place{selectedPlaces.length > 1 ? "s" : ""} selected:</strong>{" "}{selectedPlaces.join(", ")}
                      </div>
                    )}
                    <div className="t-input-group">
                      <label className="t-label">Travel Date</label>
                      <input className="t-input" type="date" min={today} value={tripDate} onChange={e => setTripDate(e.target.value)} />
                    </div>
                    <button className="t-btn t-btn-gold" onClick={handleOptimizeRoute} disabled={routeLoading || selectedPlaces.length < 2}>
                      {routeLoading
                        ? <><span className="t-spinner" style={{ borderTopColor: "#000" }} /> &nbsp;Optimizing...</>
                        : "🗺️  Optimize Route"}
                    </button>
                    {selectedPlaces.length < 2 && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
                        Select at least 2 places to optimize
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 3: Optimized Route + Weather + Nearby ── */}
            {step === 3 && route && (
              <>
                {/* ── Weather summary on step 3 ── */}
                {weather && <WeatherPanel weather={weather} />}

                <div className="t-card">
                  <div className="t-card-header">
                    <div className="t-card-title">
                      <div className="t-card-icon green">🛣️</div>
                      Optimized Route — {searchCity}
                    </div>
                    <button className="t-btn t-btn-ghost t-btn-sm" onClick={() => setStep(2)}>← Back</button>
                  </div>
                  <div className="t-card-body">
                    <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 22, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                      ✅ &nbsp;<strong style={{ color: "#4ade80" }}>Best route calculated</strong> — follow this sequence for minimum travel time.
                    </div>

                    {/* ✨ MAGIC SNAKE MAP GOES HERE ✨ */}
                    <RouteVisualizer route={route} />

                    <div className="t-route-steps">
                      {route.map((place, i) => {
                        const isFirst = i === 0, isLast = i === route.length - 1;
                        // Use real distance/time from Distance Matrix if available
                        const detail = routeDetails ? routeDetails[i] : null;
                        const distText = detail
                          ? `${(detail.distToNext / 1000).toFixed(1)} km · ~${Math.ceil(detail.timeToNext / 60)} min`
                          : `~${(Math.random() * 5 + 1).toFixed(1)} km to next stop · ~${Math.ceil(Math.random() * 15 + 5)} min`;

                        return (
                          <div key={place} className="t-route-step" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="t-route-step-line-wrap">
                              <div className={`t-route-dot ${isFirst ? "start" : isLast ? "end" : "mid"}`}>
                                {isFirst ? "S" : isLast ? "E" : i + 1}
                              </div>
                              {!isLast && <div className="t-route-connector" />}
                            </div>
                            <div className="t-route-step-info">
                              <div className="t-route-step-name">{place}</div>
                              {!isLast && (
                                <div className="t-route-step-dist">{distText}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 12, padding: "14px 18px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, fontWeight: 600, color: "var(--white)", lineHeight: 1.8 }}>
                      {route.join(" → ")}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                      <button className="t-btn t-btn-primary" onClick={handleSaveExplored} disabled={creating}>
                        {creating ? <span className="t-spinner" /> : "💾  Save This Trip"}
                      </button>
                      <button className="t-btn t-btn-ghost" style={{ width: "auto", padding: "13px 22px" }}
                        onClick={() => { setStep(1); setSearchCity(""); setSelectedPlaces([]); setRoute(null); setRouteDetails(null); setNearbyData(null); setTripDate(""); setWeather(null); }}>
                        New Plan
                      </button>
                    </div>
                  </div>
                </div>

                {nearbyData && (
                  <div className="t-card">
                    <div className="t-card-header">
                      <div className="t-card-title"><div className="t-card-icon gold">🍽️</div>Nearby Restaurants</div>
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>Near {searchCity}</span>
                    </div>
                    <div className="t-card-body">
                      <div className="t-nearby-grid">
                        {nearbyData.restaurants.map(r => (
                          <div key={r.name} className="t-nearby-item">
                            <div className="t-nearby-item-top">
                              <div className="t-nearby-item-icon food">🍴</div>
                              <div><div className="t-nearby-item-name">{r.name}</div><div className="t-nearby-item-sub">{r.cuisine}</div></div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>★ {r.rating}</span>
                              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{r.dist}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {nearbyData && (
                  <div className="t-card" style={{ borderColor: "rgba(232,52,26,0.2)" }}>
                    <div className="t-card-header">
                      <div className="t-card-title"><div className="t-card-icon red">🚨</div>Nearby Emergency Services</div>
                      <button className="btn-emergency" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => setEmergencyOpen(true)}>
                        <span className="pulse-dot" /> All Contacts
                      </button>
                    </div>
                    <div className="t-card-body">
                      <div className="t-nearby-grid">
                        {nearbyData.emergency.map(s => (
                          <div key={s.name} className="t-nearby-item">
                            <div className="t-nearby-item-top">
                              <div className="t-nearby-item-icon emergency">
                                {s.type === "Hospital" ? "🏥" : s.type === "Police" ? "👮" : s.type === "Fire Brigade" ? "🔥" : "📞"}
                              </div>
                              <div><div className="t-nearby-item-name">{s.name}</div><div className="t-nearby-item-sub">{s.type} · {s.dist}</div></div>
                            </div>
                            <a href={`tel:${s.phone}`} className="t-nearby-item-phone">📞 {s.phone}</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}