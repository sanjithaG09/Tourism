// ─────────────────────────────────────────────────────────────────────────────
// routes/placeRoutes.js
// Wire up the endpoints consumed by Trips.jsx
// ─────────────────────────────────────────────────────────────────────────────
console.log("🔥 placeRoutes file loaded");
const express = require("express");
const router  = express.Router();

const {
    getPlaces,
    getWeatherForecast,
    getCurrentWeatherData,
    getMapsEmbedUrl,
    getPlacePhoto,
    getDistanceInfo,
} = require("../controllers/placeController");

// ── Google Places ──────────────────────────────────────────────────────────
// GET /api/places/:city
router.get("/places/:city", getPlaces);

// ── OpenWeatherMap forecast ────────────────────────────────────────────────
// GET /api/weather/:city
router.get("/weather/:city", getWeatherForecast);

// ── OpenWeatherMap current ─────────────────────────────────────────────────
// GET /api/current-weather/:city
router.get("/current-weather/:city", getCurrentWeatherData);

// ── Google Maps Embed URL ──────────────────────────────────────────────────
// GET /api/maps/embed?places=Place+A|Place+B&city=Goa
router.get("/maps/embed", getMapsEmbedUrl);

// ── Google Place Photo proxy (keeps API key server-side) ───────────────────
// GET /api/photo?ref=<photo_reference>
router.get("/photo", getPlacePhoto);

// ── Point-to-point distance & duration ────────────────────────────────────
// POST /api/distance
router.post("/distance", getDistanceInfo);

module.exports = router;