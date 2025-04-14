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
// Configure nodemailer (better setup with error handling)
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify transporter connection
transporter.verify((error) => {
    if (error) {
        console.error('Error with mail transporter:', error);
    } else {
        console.log('Mail transporter is ready');
    }
});

// Password reset request
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Don't reveal if user doesn't exist (security best practice)
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
        }

        // Delete any existing reset tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id }
        });

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiration

        // Store token in database
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt: resetTokenExpiry,
            },
        });

        // Create reset link (use environment variable for base URL)
        const resetLink = `${process.env.FRONTEND_URL || 'https://yourapp.com'}/reset-password?token=${resetToken}`;
        
        // Email options
        const mailOptions = {
            from: `"Your App Name" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <p><a href="${resetLink}">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: 'Password reset email sent if account exists' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
};

// Password reset confirmation
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    try {
        // Find the token and check expiration
        const resetTokenEntry = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!resetTokenEntry || resetTokenEntry.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password
        await prisma.user.update({
            where: { id: resetTokenEntry.userId },
            data: { password: hashedPassword },
        });

        // Delete the used token
        await prisma.passwordResetToken.delete({
            where: { id: resetTokenEntry.id },
        });

        // Optional: Send confirmation email
        await transporter.sendMail({
            to: resetTokenEntry.user.email,
            subject: 'Password Changed Successfully',
            html: `<p>Your password has been successfully changed.</p>`,
        });

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'An error occurred while resetting password' });
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