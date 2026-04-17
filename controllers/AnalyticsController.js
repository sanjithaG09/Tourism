const Trip = require("../models/trip");
const mongoose = require("mongoose");

// ✅ PER-USER analytics (any logged-in user)
exports.getUserAnalytics = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId); // ✅ cast to ObjectId

        const [totals, topCities, monthly] = await Promise.all([

            Trip.aggregate([
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: null,
                        totalTrips: { $sum: 1 },
                        totalDistanceKm: { $sum: "$totalDistanceKm" }
                    }
                }
            ]),

            Trip.aggregate([
                { $match: { userId: userId } },
                { $group: { _id: "$city", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $project: { city: "$_id", count: 1, _id: 0 } }
            ]),

            Trip.aggregate([
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        trips: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } },
                { $limit: 12 }
            ])
        ]);

        res.json({
            summary: totals[0] || { totalTrips: 0, totalDistanceKm: 0 },
            topCities,
            monthly
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ GLOBAL analytics (admin only)
exports.getGlobalAnalytics = async (req, res) => {
    try {
        const [totals, topCities, monthly, topUsers] = await Promise.all([

            Trip.aggregate([
                {
                    $group: {
                        _id: null,
                        totalTrips: { $sum: 1 },
                        totalDistanceKm: { $sum: "$totalDistanceKm" },
                        uniqueUsers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        totalTrips: 1,
                        totalDistanceKm: { $round: ["$totalDistanceKm", 1] },
                        totalUsers: { $size: "$uniqueUsers" }
                    }
                }
            ]),

            Trip.aggregate([
                { $group: { _id: "$city", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                { $project: { city: "$_id", count: 1, _id: 0 } }
            ]),

            Trip.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        trips: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } },
                { $limit: 12 }
            ]),

            Trip.aggregate([
                { $group: { _id: "$userId", tripCount: { $sum: 1 } } },
                { $sort: { tripCount: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $project: {
                        tripCount: 1,
                        name: { $arrayElemAt: ["$user.name", 0] },
                        email: { $arrayElemAt: ["$user.email", 0] }
                    }
                }
            ])
        ]);

        res.json({
            summary: totals[0] || {},
            topCities,
            monthly,
            topUsers
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};