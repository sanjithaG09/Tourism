const Trip = require("../models/trip");
const User = require("../models/User");
const { getCurrentWeather } = require("../services/weatherApi");
const { sendTripConfirmationEmail } = require("../services/emailService");

// ✅ SAVE TRIP
exports.saveTrip = async (req, res) => {
    try {
        const {
            city, places,
            date, route, routeDetails, placesData,
            totalDistanceKm,
        } = req.body;

        if (!city || !places || places.length === 0) {
            return res.status(400).json({ error: "Invalid trip data" });
        }

        const trip = new Trip({
            city,
            places,
            date:            date ? new Date(date) : undefined,
            route:           route           || [],
            routeDetails:    routeDetails    || [],
            placesData:      placesData      || [],
            totalDistanceKm: totalDistanceKm || 0,
            userId:          req.userId,
        });

        await trip.save();

        // Send trip confirmation email (non-blocking)
        const user = await User.findById(req.userId).select("name email");
        if (user?.email) {
            sendTripConfirmationEmail(user.name, user.email, city, trip.date, places);
        }

        res.json(trip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ GET TRIPS with search + filter
exports.getTrips = async (req, res) => {
    try {
        const { city, from, to } = req.query;

        const query = { userId: req.userId };

        if (city) {
            query.city = { $regex: city, $options: "i" };
        }

        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to)   query.createdAt.$lte = new Date(to);
        }

        const trips = await Trip.find(query).sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ GET SINGLE TRIP with current weather
exports.getTrip = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            _id:    req.params.id,
            userId: req.userId,
        });

        if (!trip) return res.status(404).json({ error: "Trip not found" });

        // Use current weather (not forecast) for route page reload
        const weather = await getCurrentWeather(trip.city);

        res.json({ trip, weather });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ DELETE TRIP
exports.deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findOneAndDelete({
            _id:    req.params.id,
            userId: req.userId,
        });

        if (!trip) return res.status(404).json({ error: "Trip not found" });

        res.json({ message: "Trip deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ UPDATE TRIP
exports.updateTrip = async (req, res) => {
    try {
        const { city, places } = req.body;

        if (!city || !places || places.length === 0) {
            return res.status(400).json({ error: "Invalid trip data" });
        }

        const trip = await Trip.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { city, places },
            { new: true }
        );

        if (!trip) return res.status(404).json({ error: "Trip not found" });

        res.json(trip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ DUPLICATE TRIP
exports.duplicateTrip = async (req, res) => {
    try {
        const original = await Trip.findOne({
            _id:    req.params.id,
            userId: req.userId,
        });

        if (!original) return res.status(404).json({ error: "Trip not found" });

        const duplicate = new Trip({
            city:            original.city,
            places:          original.places,
            date:            original.date,
            route:           original.route,
            routeDetails:    original.routeDetails,
            placesData:      original.placesData,
            totalDistanceKm: original.totalDistanceKm,
            userId:          req.userId,
        });

        await duplicate.save();
        res.json(duplicate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
