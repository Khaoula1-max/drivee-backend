const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.access_token; // Récupérer le token du cookie

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' }); // Forbidden
    } 

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' }); // Forbidden
        }
        req.user = user; // Ajouter l'utilisateur à la requête
        next(); // Passer au prochain middleware ou route
    });
};
module.exports = authenticateJWT;
