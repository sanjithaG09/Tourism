const Review = require("../models/Review");
const Trip = require("../models/trip");
const Notification = require("../models/Notification");
 
// ✅ ADD REVIEW
exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const { tripId } = req.params;
 
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }
 
        const trip = await Trip.findById(tripId);
        if (!trip) return res.status(404).json({ error: "Trip not found" });
 
        const review = await Review.create({
            tripId,
            userId: req.userId,
            rating,
            comment
        });
 
        // ✅ Notify trip owner if someone else reviewed their trip
        if (trip.userId.toString() !== req.userId.toString()) {
            await Notification.create({
                userId: trip.userId,
                type: "new_review",
                message: `Someone rated your trip to ${trip.city} — ${rating}/5`
            });
        }
 
        res.status(201).json(review);
    } catch (err) {
        // Duplicate review (unique index violation)
        if (err.code === 11000) {
            return res.status(400).json({ error: "You already reviewed this trip" });
        }
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ GET REVIEWS FOR A TRIP
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ tripId: req.params.tripId })
            .populate("userId", "name")   // show reviewer name
            .sort({ createdAt: -1 });
 
        // Average rating
        const avg = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : null;
 
        res.json({ averageRating: avg, totalReviews: reviews.length, reviews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ DELETE REVIEW (only by the reviewer)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
 
        if (!review) return res.status(404).json({ error: "Review not found" });
 
        res.json({ message: "Review deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};