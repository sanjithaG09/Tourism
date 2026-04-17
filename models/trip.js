const mongoose = require("mongoose");

const PlaceDataSchema = new mongoose.Schema({
    name:        { type: String },
    rating:      { type: Number },
    lat:         { type: Number },
    lng:         { type: Number },
    photoUrl:    { type: String },
    description: { type: String },
    place_id:    { type: String },
}, { _id: false });

const RouteDetailSchema = new mongoose.Schema({
    name:        { type: String },
    distToNext:  { type: Number, default: 0 },
    timeToNext:  { type: Number, default: 0 },
}, { _id: false });

const TripSchema = new mongoose.Schema({
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city:            { type: String },
    places:          { type: Array },          // ordered place names (backward compat)
    date:            { type: Date },
    route:           { type: [String] },       // TSP-optimized ordered names
    routeDetails:    { type: [RouteDetailSchema] },
    placesData:      { type: [PlaceDataSchema] },
    totalDistanceKm: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model("Trip", TripSchema);
