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
                verified: false
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

    // Validation minimale
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email et mot de passe sont obligatoires' 
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newLearner = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'STUDENT',
                verified: true,
                driverLicense: driverLicense || false,
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone && { phone }),
                ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) })
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Apprenant enregistré avec succès',
            user: {
                id: newLearner.id,
                email: newLearner.email,
                hasLicense: newLearner.driverLicense
            }
        });

    } catch (error) {
        console.error(error);
        
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
       // Fonction de connexion
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    try {
        // Recherche de l'utilisateur dans la base de données
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe invalide' });
        }

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe invalide' });
        }

        // Création du token JWT pour l'utilisateur
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // Stockage du token dans un cookie HTTP
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Sécuriser le cookie en production
            maxAge: 3600000, // Durée de validité du cookie (1 heure)
        });

        // Réponse de succès
        res.status(200).json({ message: 'Connexion réussie' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Fonction pour la réinitialisation du mot de passe (oublie)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'L\'email est requis' });
    }

    try {
        // Recherche de l'utilisateur dans la base de données
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Génération d'un token de réinitialisation unique
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // Expiration du token dans 1 heure

        // Enregistrement du token dans la base de données
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt: resetTokenExpiry,
            },
        });

        // Envoi d'un email avec le lien de réinitialisation
        const resetLink = `https://votreapp.com/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            to: email,
            subject: 'Réinitialisation du mot de passe',
            html: `<p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p><p><a href="${resetLink}">Réinitialiser le mot de passe</a></p>`,
        });

        // Réponse indiquant que l'email a été envoyé
        res.status(200).json({ message: 'Un email de réinitialisation a été envoyé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Fonction de réinitialisation du mot de passe avec le token
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Le token et le nouveau mot de passe sont requis' });
    }

    try {
        // Vérification de la validité du token
        const resetTokenEntry = await prisma.passwordResetToken.findUnique({ where: { token } });
        if (!resetTokenEntry || resetTokenEntry.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Token invalide ou expiré' });
        }

        // Hachage du nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mise à jour du mot de passe de l'utilisateur
        await prisma.user.update({
            where: { id: resetTokenEntry.userId },
            data: { password: hashedPassword },
        });

        // Suppression du token après utilisation
        await prisma.passwordResetToken.delete({
            where: { id: resetTokenEntry.id },
        });

        // Réponse de succès
        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Fonction de déconnexion
exports.logout = (req, res) => {
    res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Sécurisation du cookie en production
    });
    res.status(200).json({ message: 'Déconnexion réussie' });
};

// Fonction de mise à jour d'un utilisateur
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, address, role, driverLicense } = req.body;

    try {
        // Mise à jour des informations de l'utilisateur dans la base de données
        const updatedUser = await prisma.user.update({
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
        res.json({ message: 'Utilisateur mis à jour avec succès', user: updatedUser });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Fonction de suppression d'un utilisateur
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Suppression de l'utilisateur dans la base de données
        await prisma.user.delete({
            where: { id },
        });
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(500).json({ message: 'Erreur serveur' });
    }
};