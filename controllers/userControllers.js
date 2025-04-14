const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

    


// Inscription pour une école de conduite
exports.signUpSchool = async (req, res) => {
    console.log("Received data:", req.body);
    const { firstName, lastName, email, password, phone, address } = req.body;

    // Validation minimale
    if (!email || !password || !firstName || !phone || !address) {
        return res.status(400).json({ 
            success: false,
            message: 'Tous les champs sont obligatoires pour les écoles' 
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newSchool = await prisma.user.create({
            data: {
                firstName,
                lastName: lastName || "School",
                email,
                password: hashedPassword,
                phone,
                address,
                role: 'SCHOOL',
                // verified: false
                // Remove verified unless it exists in schema
            }
        });

        return res.status(201).json({
            success: true,
            message: 'École enregistrée avec succès - En attente de vérification',
            user: {
                id: newSchool.id,
                email: newSchool.email,
                name: `${newSchool.firstName} ${newSchool.lastName}`
            }
        });

    } catch (error) {
        console.error("Detailed DB error:", error);
        
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Email ou numéro de téléphone déjà existant'
            });
        }

        return res.status(500).json({ 
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// Inscription pour un apprenant
exports.signUpLearner = async (req, res) => {
    console.log("Received data:", req.body);
    const { firstName, lastName, email, password, phone, dateOfBirth, driverLicense } = req.body;

    // Enhanced validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email and password are required' 
        });
    }

    try {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const licenseBool = driverLicense === true || driverLicense === "true";
        const newLearner = await prisma.user.create({
            data: {
                firstName: firstName || null,
                lastName: lastName || null,
                email,
                password: hashedPassword,
                phone: phone || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                role: 'STUDENT',
                driverLicense: licenseBool,
                // verified: true // Auto-verified for students
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            user: {
                id: newLearner.id,
                email: newLearner.email,
                firstName: newLearner.firstName,
                lastName: newLearner.lastName,
                hasLicense: newLearner.driverLicense
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Email or phone already exists'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validation des entrées
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email and password are required',
            code: 'MISSING_CREDENTIALS'
        });
    }

    try {
        // Recherche de l'utilisateur
        const user = await prisma.user.findUnique({ 
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                role: true,
                firstName: true,
                lastName: true
            }
        });

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Création du token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            }, 
            JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // Configuration du cookie
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 3600000,
            domain: process.env.COOKIE_DOMAIN || 'localhost'
        });
        console.log(' Login successful for:', email);
          console.log(' Token issued for user ID:', user.id);
          console.log(' Token expires in 1 hour');

        // Réponse avec token et infos utilisateur (sans mot de passe)
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token, // Retourne aussi le token dans la réponse
            user: userData,
            expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600') // en secondes
        });
        

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
 // Configure nodemailer
 const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your application password
    },
});
    // Oubli de mot de passe
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'L\'email est requis' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Générer un token de réinitialisation
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); 

        // Enregistrer le token dans la base de données
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt: resetTokenExpiry,
            },
        });

        // Envoyer un e-mail avec un lien de réinitialisation
        const resetLink = `https://yourapp.com/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            to: email,
            subject: 'Réinitialisation du mot de passe',
            html: `<p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p><p><a href="${resetLink}">Réinitialiser le mot de passe</a></p>`,
        });

        res.status(200).json({ message: 'Un e-mail de réinitialisation a été envoyé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
  // Réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Le token et le nouveau mot de passe sont requis' });
    }

    try {
        const resetTokenEntry = await prisma.passwordResetToken.findUnique({ where: { token } });
        if (!resetTokenEntry || resetTokenEntry.expiresAt < new Date()) {
            return res.status(404).json({ message: 'Token invalide ou expiré' });
        }

        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe de l'utilisateur
        await prisma.user.update({
            where: { id: resetTokenEntry.userId },
            data: {
                password: hashedPassword,
            },
        });

        // Supprimer le token de réinitialisation après utilisation
        await prisma.passwordResetToken.delete({
            where: { id: resetTokenEntry.id },
        });

        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
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
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { 
        firstName, 
        lastName, 
        email, 
        phone, 
        dateOfBirth, 
        address, 
        role,  
        driverLicense 
    } = req.body;

    // Validation basique
    if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Vérifier d'abord si l'utilisateur existe
        const userExists = await prisma.user.findUnique({ where: { id } });
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                address,
                role,
                driverLicense, 
            },
        });

        res.status(200).json({ 
            success: true,
            message: 'User updated successfully', 
            user: updatedUser 
        });

    } catch (error) {
        console.error('Update user error:', error);
        
        if (error.code === 'P2002') {
            return res.status(409).json({ 
                message: 'Email or phone number already exists' 
            });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(500).json({ 
            message: 'An error occurred while updating the user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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