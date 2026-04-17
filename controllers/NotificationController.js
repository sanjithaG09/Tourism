const Notification = require("../models/Notification");
 
// ✅ GET ALL NOTIFICATIONS for logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(20);
 
        const unreadCount = await Notification.countDocuments({
            userId: req.userId,
            read: false
        });
 
        res.json({ unreadCount, notifications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ MARK ONE AS READ
exports.markRead = async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true }
        );
        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
// ✅ MARK ALL AS READ
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, read: false },
            { read: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};