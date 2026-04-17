const express = require("express");
const router = express.Router();
 
const auth = require("../middleware/auth");
const { addReview, getReviews, deleteReview } = require("../controllers/ReviewController");
 
router.post("/trip/:tripId/review", auth, addReview);       // add review
router.get("/trip/:tripId/reviews", auth, getReviews);      // get all reviews for a trip
router.delete("/review/:id", auth, deleteReview);           // delete your review
 
module.exports = router;