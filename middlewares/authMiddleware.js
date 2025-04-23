const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateJWT = async (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Récupérer l'utilisateur complet depuis la base de données
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                dateOfBirth: true,
                driverLicense: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = authenticateJWT;