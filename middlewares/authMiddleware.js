const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.access_token; 

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' }); // Forbidden
    } 

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' }); 
        }
        req.user = user; 
        next(); 
    });
};
module.exports = authenticateJWT;