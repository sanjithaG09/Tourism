const axios = require("axios");

const API_KEY = process.env.GOOGLE_API_KEY;

// Type label map — used to generate human-readable descriptions
const TYPE_LABELS = {
    temple: "Temple", beach: "Beach", museum: "Museum", park: "Park",
    zoo: "Zoo", amusement_park: "Amusement Park", art_gallery: "Art Gallery",
    natural_feature: "Natural Feature", church: "Church", mosque: "Mosque",
    hindu_temple: "Hindu Temple", stadium: "Stadium", shopping_mall: "Shopping Mall",
    aquarium: "Aquarium", botanical_garden: "Botanical Garden", campground: "Campground",
    casino: "Casino", cemetery: "Cemetery", city_hall: "City Hall",
    hindu_temple: "Hindu Temple", library: "Library", monument: "Monument",
    movie_theater: "Cinema", night_club: "Night Club", palace: "Palace",
    place_of_worship: "Place of Worship", rv_park: "RV Park", spa: "Spa",
    tourist_attraction: "Tourist Attraction", university: "University",
    waterfall: "Waterfall", waterpark: "Water Park",
};

const GENERIC_TYPES = new Set([
    "point_of_interest", "establishment", "tourist_attraction",
    "geocode", "premise", "locality", "sublocality",
    "political", "route", "street_address",
]);

function buildDescription(types) {
    if (!Array.isArray(types)) return "Tourist Attraction";
    const labels = types
        .filter(t => !GENERIC_TYPES.has(t))
        .map(t => TYPE_LABELS[t] || null)
        .filter(Boolean);
    return labels.slice(0, 2).join(" · ") || "Tourist Attraction";
}

// ✅ Fetch top tourist places with photos and descriptions
exports.getTouristPlaces = async (city) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;

        const response = await axios.get(url, {
            params: {
                query: `top tourist places sightseeing in ${city}`,
                key: API_KEY,
            },
            proxy: false,
        });

        const results = response.data.results;
        if (!results || results.length === 0) {
            console.warn("Google Places returned no results for:", city, "| status:", response.data.status);
            return [];
        }

        // Only exclude obvious non-tourist types where that type is the ONLY or first type
        const HARD_EXCLUDED = new Set(["lodging", "restaurant", "bar", "cafe", "grocery_or_supermarket"]);

        let places = results
            .filter(place => {
                const types = place.types || [];
                // Exclude only if the very first type (most specific) is a non-tourist category
                return !HARD_EXCLUDED.has(types[0]);
            })
            .map(place => {
                // Store only the photo_reference; the backend /api/photo route will serve the image
                let photoRef = null;
                if (place.photos && place.photos.length > 0) {
                    photoRef = place.photos[0].photo_reference;
                }

                return {
                    name:        place.name,
                    rating:      place.rating || 0,
                    user_ratings_total: place.user_ratings_total || 0,
                    lat:         place.geometry.location.lat,
                    lng:         place.geometry.location.lng,
                    photoRef,
                    description: buildDescription(place.types),
                    place_id:    place.place_id || null,
                };
            });

        places.sort((a, b) => b.rating - a.rating);
        return places.slice(0, 15);

    } catch (error) {
        console.error("Error fetching places:", error.message);
        if (error.response) {
            console.error("Google API response:", error.response.status, error.response.data);
        }
        return [];
    }
};

// ✅ Point-to-point distance — single origin → single destination
// origin / destination can be an address string OR "lat,lng" string
exports.getPointDistance = async (origin, destination) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
        const response = await axios.get(url, {
            params: {
                origins:      origin,
                destinations: destination,
                key:          API_KEY,
                mode:         "driving",
                units:        "metric",
            },
            proxy: false,
        });

        const data = response.data;
        if (data.status !== "OK") {
            console.warn("Distance Matrix status:", data.status);
            return null;
        }

        const element = data.rows[0]?.elements[0];
        if (!element || element.status !== "OK") {
            console.warn("Element status:", element?.status);
            return null;
        }

        return {
            distance:           element.distance,         // { text, value (metres) }
            duration:           element.duration,         // { text, value (seconds) }
            originAddress:      data.origin_addresses[0],
            destinationAddress: data.destination_addresses[0],
        };
    } catch (error) {
        console.error("getPointDistance error:", error.message);
        return null;
    }
};

// ✅ Distance Matrix API — returns real travel times between ordered places
exports.getDistanceMatrix = async (places) => {
    try {
        const coords = places.map(p => `${p.lat},${p.lng}`);
        const origins      = coords.join("|");
        const destinations = coords.join("|");

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;

        const response = await axios.get(url, {
            params: {
                origins,
                destinations,
                key:   API_KEY,
                mode:  "driving",
                units: "metric",
            },
            proxy: false,
        });

        const rows = response.data.rows;

        const matrix = rows.map(row =>
            row.elements.map(el =>
                el.status === "OK" ? el.distance.value : Infinity
            )
        );

        const durationMatrix = rows.map(row =>
            row.elements.map(el =>
                el.status === "OK" ? el.duration.value : Infinity
            )
        );

        return { matrix, durationMatrix };

    } catch (error) {
        console.error("Distance Matrix error:", error.message);
        return null;
    }
};
