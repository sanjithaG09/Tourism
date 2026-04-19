// ─────────────────────────────────────────────────────────────────────────────
// placesController.js
// Handles:
//   GET  /api/places/:city         → top tourist places via Google Places API
//   GET  /api/weather/:city        → 5-step forecast via OpenWeatherMap API
//   POST /api/route/optimize       → optimized route via Google Distance Matrix
// ─────────────────────────────────────────────────────────────────────────────

const axios = require("axios");
const { getTouristPlaces, getDistanceMatrix, getPointDistance } = require("../services/googleApi");
const { getWeather, getCurrentWeather } = require("../services/weatherApi");

// ─────────────────────────────────────
// GET /api/places/:city
// Returns top tourist attractions from Google Places API
// Response: [{ name, rating, lat, lng }, ...]
// ─────────────────────────────────────
exports.getPlaces = async (req, res) => {
    const { city } = req.params;

    console.log("CITY:", city);
    console.log("GOOGLE KEY:", process.env.GOOGLE_API_KEY);

    try {
        const { city } = req.params;

        if (!city || !city.trim()) {
            return res.status(400).json({ error: "City name is required" });
        }

        // Calls googleApi.js → getTouristPlaces
        const places = await getTouristPlaces(city.trim());

        if (!places || places.length === 0) {
            return res.status(404).json({ error: "No places found for this city" });
        }

        // Returns array: [{ name, rating, lat, lng }, ...]
        res.json(places);

    } catch (err) {
        console.error("getPlaces error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────
// GET /api/weather/:city
// Returns 5-step weather forecast from OpenWeatherMap
// Response: { city, country, forecasts: [{ time, temp, feels_like, condition, description, humidity }] }
// ─────────────────────────────────────
exports.getWeatherForecast = async (req, res) => {
    try {
        const { city } = req.params;

        if (!city || !city.trim()) {
            return res.status(400).json({ error: "City name is required" });
        }

        // Calls weatherApi.js → getWeather
        const weather = await getWeather(city.trim());

        if (!weather) {
            return res.status(404).json({ error: "Weather data not available for this city" });
        }

        // Returns: { city, country, forecasts: [...] }
        res.json(weather);

    } catch (err) {
        console.error("getWeatherForecast error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────
// GET /api/current-weather/:city
// Returns current weather conditions from OpenWeatherMap
// Response: { city, country, temp, feels_like, humidity, condition, description, wind_speed }
// ─────────────────────────────────────
exports.getCurrentWeatherData = async (req, res) => {
    try {
        const { city } = req.params;

        if (!city || !city.trim()) {
            return res.status(400).json({ error: "City name is required" });
        }

        const weather = await getCurrentWeather(city.trim());

        if (!weather) {
            return res.status(404).json({ error: "Weather data not available for this city" });
        }

        res.json(weather);

    } catch (err) {
        console.error("getCurrentWeatherData error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────
// GET /api/maps/embed
// Query: ?places=Place+A|Place+B|Place+C&city=Goa
// Returns Google Maps Embed API URL (key kept server-side)
// Response: { url: "https://www.google.com/maps/embed/v1/directions?..." }
// ─────────────────────────────────────
exports.getMapsEmbedUrl = (req, res) => {
    try {
        // start / end are optional — "lat,lng" string or a plain address
        const { places, city, start, end } = req.query;

        if (!places || !city) {
            return res.status(400).json({ error: "places and city query params required" });
        }

        const placeList = places.split("|").map(p => p.trim()).filter(Boolean);
        if (placeList.length < 1) {
            return res.status(400).json({ error: "Need at least 1 place" });
        }

        // Helper: format a waypoint for embed URL
        const fmt = (val) => {
            // If it looks like "lat,lng" coords pass as-is, else append city
            return /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(val.trim())
                ? encodeURIComponent(val.trim())
                : encodeURIComponent(`${val.trim()}, ${city}`);
        };

        // Build origin, destination, and waypoints
        let origin, destination, waypointPlaces;

        if (start && end) {
            origin        = fmt(start);
            destination   = fmt(end);
            waypointPlaces = placeList;                       // all places are waypoints
        } else if (start) {
            origin        = fmt(start);
            destination   = encodeURIComponent(`${placeList[placeList.length - 1]}, ${city}`);
            waypointPlaces = placeList.slice(0, -1);          // all except last
        } else if (end) {
            origin        = encodeURIComponent(`${placeList[0]}, ${city}`);
            destination   = fmt(end);
            waypointPlaces = placeList.slice(1);              // all except first
        } else {
            origin        = encodeURIComponent(`${placeList[0]}, ${city}`);
            destination   = encodeURIComponent(`${placeList[placeList.length - 1]}, ${city}`);
            waypointPlaces = placeList.slice(1, -1);
        }

        const waypointStr = waypointPlaces.length > 0
            ? `&waypoints=${waypointPlaces.map(p => encodeURIComponent(`${p}, ${city}`)).join("|")}`
            : "";

        const url = `https://www.google.com/maps/embed/v1/directions?key=${process.env.GOOGLE_API_KEY}&origin=${origin}&destination=${destination}${waypointStr}&mode=driving`;

        res.json({ url });
    } catch (err) {
        console.error("getMapsEmbedUrl error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────
// GET /api/photo?ref=<photo_reference>
// Proxies a Google Place photo server-side so the API key never reaches the browser
// ─────────────────────────────────────
exports.getPlacePhoto = async (req, res) => {
    try {
        const { ref } = req.query;
        if (!ref || !ref.trim()) {
            return res.status(400).json({ error: "ref query param required" });
        }

        const googleUrl = `https://maps.googleapis.com/maps/api/place/photo`;
        const response = await axios.get(googleUrl, {
            params: { maxwidth: 600, photo_reference: ref, key: process.env.GOOGLE_API_KEY },
            responseType: "stream",
            maxRedirects: 5,
            proxy: false,
        });

        // Forward the content-type and stream the image bytes to the client
        const ct = response.headers["content-type"] || "image/jpeg";
        res.setHeader("Content-Type", ct);
        res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24 h
        response.data.pipe(res);

    } catch (err) {
        console.error("getPlacePhoto error:", err.message);
        res.status(502).json({ error: "Could not fetch photo" });
    }
};

// ─────────────────────────────────────
// POST /api/distance
// Body: { origin: string, destination: string }
//   origin / destination can be a plain address ("Goa, India")
//   or a coordinate string ("15.2993,74.1239")
// Response: {
//   distance: { text, value },
//   duration: { text, value },
//   originAddress, destinationAddress,
//   mapUrl   ← Google Maps Embed URL for the route
// }
// ─────────────────────────────────────
exports.getDistanceInfo = async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({ error: "origin and destination are required" });
        }

        const result = await getPointDistance(
            String(origin).trim(),
            String(destination).trim()
        );

        if (!result) {
            return res.status(404).json({ error: "Could not calculate distance. Check the place names and try again." });
        }

        const originEnc      = encodeURIComponent(String(origin).trim());
        const destinationEnc = encodeURIComponent(String(destination).trim());
        const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${process.env.GOOGLE_API_KEY}&origin=${originEnc}&destination=${destinationEnc}&mode=driving`;

        res.json({ ...result, mapUrl });
    } catch (err) {
        console.error("getDistanceInfo error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────
// POST /api/route/optimize
// Body: { locations: [{ name, rating, lat, lng }, ...] }
// Uses Google Distance Matrix to find optimal visiting order (nearest neighbour)
// Response: {
//   route: ["Place A", "Place B", ...],            ← ordered place names
//   details: [{ name, distToNext, timeToNext }, ...]← distance in m, time in s
// }
// ─────────────────────────────────────
exports.optimizeRoute = async (req, res) => {
    try {
        const { locations, startPoint, endPoint } = req.body;

        // ── Validate ──
        if (!locations || !Array.isArray(locations) || locations.length < 2) {
            return res.status(400).json({ error: "At least 2 locations with lat/lng are required" });
        }

        // Check all locations have coordinates (from Google Places)
        const hasCoords = locations.every(l => l.lat != null && l.lng != null);

        if (!hasCoords) {
            // Fallback: return locations in given order with no distance details
            return res.json({
                route: locations.map(l => l.name),
                details: null,
            });
        }

        // ── Call Distance Matrix API ──
        const matrixResult = await getDistanceMatrix(locations);

        if (!matrixResult) {
            // Distance Matrix failed — return input order as fallback
            return res.json({
                route: locations.map(l => l.name),
                details: null,
            });
        }

        const { matrix, durationMatrix } = matrixResult;

        // ── Nearest Neighbour TSP (greedy) ──
        // Finds a reasonably short route without solving full TSP
        const n = locations.length;
        const visited = new Array(n).fill(false);
        const order = [];
        let current = 0; // start from first place

        visited[0] = true;
        order.push(0);

        for (let step = 1; step < n; step++) {
            let nearestIdx = -1;
            let nearestDist = Infinity;

            for (let j = 0; j < n; j++) {
                if (!visited[j] && matrix[current][j] < nearestDist) {
                    nearestDist = matrix[current][j];
                    nearestIdx = j;
                }
            }

            if (nearestIdx === -1) break; // all visited
            visited[nearestIdx] = true;
            order.push(nearestIdx);
            current = nearestIdx;
        }

        // ── Build response ──
        const route = order.map(i => locations[i].name);

        // details[i] = { name, distToNext (metres), timeToNext (seconds) }
        // Last element has distToNext = 0 / timeToNext = 0
        const details = order.map((locIdx, i) => {
            const nextLocIdx = order[i + 1];
            if (nextLocIdx === undefined) {
                return { name: locations[locIdx].name, distToNext: 0, timeToNext: 0 };
            }
            return {
                name: locations[locIdx].name,
                distToNext: matrix[locIdx][nextLocIdx],
                timeToNext: durationMatrix[locIdx][nextLocIdx],
            };
        });

        // ── Start / End anchor legs ──
        // Calculate distance from startPoint → first stop and last stop → endPoint
        // These are separate from the TSP and are not reordered.
        let startLeg = null;
        let endLeg   = null;

        const firstPlace = locations[order[0]];
        const lastPlace  = locations[order[order.length - 1]];

        if (startPoint?.value && firstPlace?.lat != null) {
            const firstCoord = `${firstPlace.lat},${firstPlace.lng}`;
            const legResult  = await getPointDistance(startPoint.value, firstCoord);
            if (legResult) {
                startLeg = {
                    distToNext: legResult.distance.value,   // metres
                    timeToNext: legResult.duration.value,   // seconds
                    resolvedAddress: legResult.originAddress,
                };
            }
        }

        if (endPoint?.value && lastPlace?.lat != null) {
            const lastCoord = `${lastPlace.lat},${lastPlace.lng}`;
            const legResult = await getPointDistance(lastCoord, endPoint.value);
            if (legResult) {
                endLeg = {
                    distToNext: legResult.distance.value,
                    timeToNext: legResult.duration.value,
                    resolvedAddress: legResult.destinationAddress,
                };
            }
        }

        res.json({ route, details, startLeg, endLeg });

    } catch (err) {
        console.error("optimizeRoute error:", err.message);
        res.status(500).json({ error: err.message });
    }
};