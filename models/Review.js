const mongoose = require("mongoose");
 
const ReviewSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        trim: true
    }
}, { timestamps: true });
 
// One review per user per trip
ReviewSchema.index({ tripId: 1, userId: 1 }, { unique: true });
 
module.exports = mongoose.model("Review", ReviewSchema);