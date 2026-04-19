// src/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auto-attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("velora_token"); // BUG FIX: was "token", mismatched with Login.jsx
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
