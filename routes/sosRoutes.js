const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const { getNearbyEmergency, sendSosAlert } = require("../controllers/sosController");

router.get("/sos/nearby", auth, getNearbyEmergency);
router.post("/sos/alert", auth, sendSosAlert);

module.exports = router;
