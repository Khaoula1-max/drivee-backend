require('dotenv').config(); // Charge les variables d'environnement
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Vérifie que les variables requises sont définies
function validateEnv() {
    const requiredVars = ['FIRST_ADMIN_EMAIL', 'FIRST_ADMIN_PASSWORD'];
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            throw new Error(`La variable ${varName} est manquante dans .env`);
        }
    }
}

async function createFirstAdmin() {
    validateEnv();

    const adminData = {
        firstName: process.env.FIRST_ADMIN_FIRSTNAME || 'Admin',
        lastName: process.env.FIRST_ADMIN_LASTNAME || 'Drivee',
        email: process.env.FIRST_ADMIN_EMAIL,
        password: process.env.FIRST_ADMIN_PASSWORD,
        phone: process.env.FIRST_ADMIN_PHONE || '+212666666666',
        role: 'ADMIN'
    };

    try {
        // Vérification de la force du mot de passe
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{12,})/;
        if (!strongPasswordRegex.test(adminData.password)) {
            throw new Error('Le mot de passe doit contenir 12+ caractères, dont majuscules, chiffres et symboles');
        }

        // Vérifier si un admin existe déjà
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (existingAdmin) {
            console.log('⚠️ Un admin existe déjà dans la base de données');
            return;
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Créer l'admin
        const admin = await prisma.user.create({
            data: {
                firstName: adminData.firstName,
                lastName: adminData.lastName,
                email: adminData.email,
                password: hashedPassword,
                phone: adminData.phone,
                role: adminData.role
            },
            select: { // Ne retourne pas le mot de passe
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
            }
        });

        console.log('✅ Admin créé avec succès :', admin);
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin :', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createFirstAdmin();