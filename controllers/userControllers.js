const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

    
    exports.signUp = async (req, res) => {
        const { firstName, lastName, email, password, phone, dateOfBirth, address, role } = req.body;
      
        // Validation
        if (!email || !password) {
          return res.status(400).json({ 
            success: false,
            message: 'Email and password are required' 
          });
        }
      
        try {
          // Check for existing user
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser) {
            return res.status(400).json({ 
              success: false,
              message: 'Email already in use' 
            });
          }
      
          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);
          
          // Prepare data - only include provided fields
          const userData = {
            email,
            password: hashedPassword,
            role: role || 'STUDENT',
            driverLicense: false, // Default value
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
            ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
            ...(address && { address })
          };
      
          // Create user
          const newUser = await prisma.user.create({ data: userData });
      
          // Format response
          const responseData = {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            ...(newUser.firstName && { firstName: newUser.firstName }),
            ...(newUser.lastName && { lastName: newUser.lastName }),
            ...(newUser.phone && { phone: newUser.phone }),
            createdAt: newUser.createdAt
          };
      
          res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: responseData
          });
      
        } catch (error) {
          console.error('Signup error:', error);
          res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
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
