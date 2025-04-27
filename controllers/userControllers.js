const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.createAdmin = async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Email and password are required' 
        });
    }
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Only admins can create admin accounts'
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newAdmin = await prisma.user.create({
            data: {
                firstName: firstName || 'Admin',
                lastName: lastName || 'User',
                email,
                password: hashedPassword,
                phone: phone || null,
                role: 'ADMIN',
            }
        });

        return res.status(201).json({
         success: true,
         message: 'Admin account created successfully',
         user: {
         id: newAdmin.id,
         email: newAdmin.email,
        role: newAdmin.role
            }
        });

    } catch (error) {
        console.error("Admin creation error:", error);
        
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
 return res.status(500).json({
     success: false,
     message: 'Admin creation failed',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
    }
const sendWelcomeEmail = async (email, firstName) => {
    try {
await transporter.sendMail({
    from: `Drivee <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bienvenue sur Drivee ! 🚗',
            html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background-color: #1a73e8; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">
                            <span style="display: inline-block; vertical-align: middle;">🚗</span>
                            <span style="display: inline-block; vertical-align: middle;">Drivee</span>
                        </h1>
                    </div>
                    
                    <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
                        <h2 style="color: #1a73e8; margin-top: 0;">Bonjour ${firstName || 'nouvel utilisateur'} !</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6;">
                            Merci de vous être inscrit sur <strong style="color: #1a73e8;">Drivee</strong>, 
                            la plateforme qui révolutionne l'apprentissage de la conduite.
                        </p>
                        
                        <div style="background-color: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e0e0e0;">
                            <p style="font-weight: bold; color: #1a73e8; margin-top: 0;">Avec Drivee, vous pouvez :</p>
                            <ul style="padding-left: 20px; font-size: 15px;">
                                <li style="margin-bottom: 8px;">Trouver les meilleures écoles de conduite près de chez vous</li>
                                <li style="margin-bottom: 8px;">Planifier vos leçons en ligne facilement</li>
                                <li style="margin-bottom: 8px;">Suivre votre progression en temps réel</li>
                                <li>Obtenir votre permis en toute sérénité</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6;">
                            Nous sommes ravis de vous compter parmi nos utilisateurs et nous nous engageons 
                            à vous offrir la meilleure expérience possible.
                        </p>
                        
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="" 
                               style="display: inline-block; background-color: #1a73e8; color: white; 
                                      padding: 12px 25px; text-decoration: none; border-radius: 4px; 
                                      font-weight: bold; font-size: 16px;">
                                Commencer maintenant
                            </a>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6;">
                            Cordialement,<br>
              <strong style="color: #1a73e8;">L'équipe Drivee</strong>
                 </p>
                </div>
                   
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #7f8c8d; text-align: center;">
                 <p>© 2023 Drivee. Tous droits réservés.</p>
                  <p>Si vous n'êtes pas à l'origine de cette inscription, veuillez ignorer cet email.</p>
            </div>
         </div>
            `,              
        });
 console.log(`Email de bienvenue envoyé à ${email}`);
    } catch (error) {
 console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
    }
};
exports.signUpSchool = async (req, res) => {
    console.log("Received data:", req.body);
    const { firstName, lastName, email, password, phone, address } = req.body;
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
         }
        });
    await sendWelcomeEmail(email, firstName);
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
 }};

exports.signUpLearner = async (req, res) => {
     console.log("Received data:", req.body);
const { firstName, lastName, email, password, phone, dateOfBirth, driverLicense } = req.body;
 if (!email || !password) {
     return res.status(400).json({ 
         success: false,
         message: 'Email and password are required' 
    });
 }
        try {
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
            }
        });
await sendWelcomeEmail(email, firstName || 'Apprenant');
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
  }};
    exports.login = async (req, res) => {
        const { email, password } = req.body
 if (!email || !password) {
    return res.status(400).json({ 
     success: false,
     message: 'Email and password are required',
     code: 'MISSING_CREDENTIALS'
     });
}
    try {
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
 const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
 return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
    });
 }
const token = jwt.sign(
    { 
    id: user.id, 
     email: user.email, 
     role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );
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
const userData = {
    id: user.id,
     email: user.email,
     firstName: user.firstName,
     lastName: user.lastName,
     role: user.role
}
 return res.status(200).json({
     success: true,
     message: 'Login successful',
     token, 
    user: userData,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600') 
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
 const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});
exports.forgotPassword = async (req, res) => {
    const { email } = req.body
    if (!email) {
        return res.status(400).json({ message: 'L\'email est requis' });
    }
    try {
     const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 10800000);
 await prisma.passwordResetToken.create({
    data: {
    userId: user.id,
    token: resetToken,
    expiresAt: resetTokenExpiry,
 },
    });
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
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
 const hashedPassword = await bcrypt.hash(newPassword, 10);

 await prisma.user.update({
    where: { id: resetTokenEntry.userId },
    data: {
    password: hashedPassword,
 },
    });
await prisma.passwordResetToken.delete({
    where: { id: resetTokenEntry.id },
 });
  res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
} catch (error) {
 console.error(error);
 res.status(500).json({ message: 'Erreur serveur' });
    }
};
exports.logout = (req, res) => {
 res.clearCookie('access_token', {
 httpOnly: true,
 secure: process.env.NODE_ENV === 'production',
        });
 res.status(200).json({ message: 'Logout successful' });
    };

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
    driverLicense,
    currentPassword, 
     newPassword     
     } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
         }
        try {  
 const user = await prisma.user.findUnique({ where: { id } });
     if (!user) {
      return res.status(404).json({ message: 'User not found' });
}
  if (newPassword) {
 if (!currentPassword) {
     return res.status(400).json({ 
         success: false,
         message: 'Current password is required to change password' 
    });
 }
const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
       return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
});
}
   const hashedPassword = await bcrypt.hash(newPassword, 10);
   const updatedUser = await prisma.user.update({
 where: { id },
  data: {
   password: hashedPassword,               
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
  return res.status(200).json({ 
  success: true,
  message: 'Password updated successfully', 
  user: updatedUser 
});
 }
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
    
return res.status(200).json({ 
     success: true,
     message: 'User updated successfully', 
     user: updatedUser 
 });
    } catch (error) {
    console.error('Update user error:', error);    
 if (error.code === 'P2002') {

  return res.status(409).json({ 
        
  success: false,
   message: 'Email or phone number already exists' 
});
}
if (error.code === 'P2025') {
 return res.status(404).json({ 
 success: false,
 message: 'User not found' 
});
}        
return res.status(500).json({ 
    success: false,
    message: 'An error occurred while updating the user',
   error: process.env.NODE_ENV === 'development' ? error.message : undefined
});
}};

exports.deleteUser  = async (req, res) => {
    const { id } = req.params;
     try {
    await prisma.user.delete({
    where: { id },
    });
    res.json({ message: 'User  deleted successfully' });
    } catch (error) {console.error(error);
    if (error.code === 'P2025') {
    return res.status(404).json({ message: 'User  not found' });
    }
    res.status(500).json({ message: 'Server error' });
    }};
 exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;
        const skip = (page - 1) * limit;
   const where = {};
    if (role) {
     where.role = role; }
    const users = await prisma.user.findMany({
    where,
    skip: parseInt(skip),
    take: parseInt(limit),
    select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    role: true,
   createdAt: true,
   updatedAt: true,
   address: true,
   address: true  },
  orderBy: { createdAt: 'desc'}
        });
    const totalUsers = await prisma.user.count({ where });
   return res.status(200).json({
   success: true,
   data: users,
   pagination: {
   total: totalUsers,
   page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(totalUsers / limit) }
        });
} catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
    success: false,
    message: 'Failed to fetch users',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }};