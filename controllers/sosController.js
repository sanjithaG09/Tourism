const axios = require("axios");

const API_KEY = process.env.GOOGLE_API_KEY;

// ─── Nearby emergency services via Google Places ─────────────────────────────
// GET /api/sos/nearby?lat=xx&lng=yy
exports.getNearbyEmergency = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ error: "lat and lng are required" });

    const types = [
      { type: "hospital",       label: "Hospital",     emoji: "🏥" },
      { type: "police",         label: "Police",        emoji: "👮" },
      { type: "fire_station",   label: "Fire Brigade",  emoji: "🔥" },
    ];

    const results = await Promise.all(
      types.map(async ({ type, label, emoji }) => {
        try {
          const { data } = await axios.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            {
              params: {
                location: `${lat},${lng}`,
                rankby: "distance",
                type,
                key: API_KEY,
              },
            }
          );

          return (data.results || []).slice(0, 3).map((p) => {
            const dlat = p.geometry.location.lat - parseFloat(lat);
            const dlng = p.geometry.location.lng - parseFloat(lng);
            const distKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
            return {
              name:    p.name,
              type:    label,
              emoji,
              address: p.vicinity || "",
              rating:  p.rating || null,
              dist:    distKm < 1
                ? `${Math.round(distKm * 1000)} m`
                : `${distKm.toFixed(1)} km`,
              phone:   p.formatted_phone_number || null,
              placeId: p.place_id,
            };
          });
        } catch {
          return [];
        }
      })
    );

    const flat = results.flat().sort((a, b) => {
      const toM = (s) => {
        if (!s) return 99999;
        const n = parseFloat(s);
        return s.includes("km") ? n * 1000 : n;
      };
      return toM(a.dist) - toM(b.dist);
    });

    res.json({ services: flat });
  } catch (err) {
    console.error("getNearbyEmergency error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── SOS email alert ─────────────────────────────────────────────────────────
// POST /api/sos/alert  body: { name, email, lat, lng, city }
exports.sendSosAlert = async (req, res) => {
  try {
    const { name, email, lat, lng, city } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const mapsLink = lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : null;

    const timeStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    res.json({
      success: true,
      message: "SOS alert email skipped (mailer disabled).",
      mapsLink: mapsLink || null,
      time: timeStr,
    });
  } catch (err) {
    console.error("sendSosAlert error:", err.message);
    res.status(500).json({ error: "Failed to send SOS alert" });
  }
};
