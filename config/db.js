const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("DB Error (continuing without DB):", error.message);
    // Don't crash the server during local dev when Mongo isn't reachable.
  }
};

module.exports = connectDB;
