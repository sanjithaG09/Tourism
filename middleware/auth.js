require("dotenv").config();                         // ✅ #2 .env
const jwt = require("jsonwebtoken");
 
const SECRET = process.env.JWT_SECRET;              // ✅ #2 .env secret
 
module.exports = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];
 
        if (!token) {
            return res.status(401).json({ error: "No token, access denied" });
        }
 
        const decoded = jwt.verify(token, SECRET);
        req.userId = decoded.id;
        next();
 
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};
