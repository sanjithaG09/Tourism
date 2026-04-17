const User = require("../models/User");

// Use AFTER auth middleware — req.userId is already set
module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);

        if (!user || user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
