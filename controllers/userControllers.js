    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');

    const prisma = new PrismaClient();
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

    // Inscription d'un utilisateur
    exports.signUp = async (req, res) => {
        const { firstName, lastName, email, password, phone, dateOfBirth, address, role, driverLicense } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const existingUser  = await prisma.user.findUnique({ where: { email } });
        if (existingUser ) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser  = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phone,
                dateOfBirth,
                address,
                role: role || 'USER',
                driverLicense, 
            },
        });

        res.status(201).json({ message: 'User  created successfully', user: newUser  });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
    
};
       // Connexion d'un utilisateur
    exports.login = async (req, res) => {
        const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000,
        });

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
   // Déconnexion d'un utilisateur
    exports.logout = (req, res) => {
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(200).json({ message: 'Logout successful' });
    };

    // Mettre à jour un utilisateur
    exports.updateUser  = async (req, res) => {
        const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, address, role,  driverLicense } = req.body;

    try {
        const updatedUser  = await prisma.user.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                dateOfBirth,
                address,
                role,
                driverLicense, 
            },
        });
        res.json({ message: 'User  updated successfully', user: updatedUser  });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User  not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};
    // Supprimer un utilisateur
    exports.deleteUser  = async (req, res) => {
        const { id } = req.params;
        
        try {
            await prisma.user.delete({
                where: { id },
        });
        res.json({ message: 'User  deleted successfully' });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User  not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
 };
