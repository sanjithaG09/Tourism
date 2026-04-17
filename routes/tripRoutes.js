const express = require("express");
const router = express.Router();
 
const auth = require("../middleware/auth");
const {
    saveTrip,
    getTrips,
    getTrip,
    deleteTrip,
    updateTrip,
    duplicateTrip
} = require("../controllers/tripController");
 
router.post("/save-trip", auth, saveTrip);
router.get("/trips", auth, getTrips);               // supports ?city= &from= &to=
router.get("/trip/:id", auth, getTrip);             // single trip + weather
router.delete("/trip/:id", auth, deleteTrip);
router.put("/trip/:id", auth, updateTrip);
router.post("/trip/:id/duplicate", auth, duplicateTrip);
 
module.exports = router;