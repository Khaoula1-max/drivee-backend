const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Config
const UPLOAD_DIR = path.join(__dirname, '../../uploads/verifications');
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
exports.checkVerificationStatus = async (req, res) => {
  try {
    // Vérifie si l'utilisateur est une école (optionnel, selon vos besoins)
    if (req.user.role !== 'SCHOOL') {
      return res.status(403).json({ error: "Réservé aux écoles." });
    }

    const verification = await prisma.verification.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
        schoolName: true,
        createdAt: true,
        // reviewedAt: true
      }
    });

    if (!verification) {
      return res.json({ 
        verified: false,
        message: "Aucune demande de vérification trouvée"
      });
    }

    res.json({
      verified: verification.status === 'APPROVED',
      status: verification.status,
      schoolName: verification.schoolName,
      lastUpdated: verification.reviewedAt || verification.createdAt
    });

  } catch (error) {
    console.error("Verification check error:", error);
    res.status(500).json({ 
      error: "Une erreur est survenue lors de la vérification du statut" 
    });
  }
};

exports.submitVerification = async (req, res) => {
  try {
    // Verify user is a school
    if (req.user.role !== 'SCHOOL') {
      return res.status(403).json({ error: "Réservé aux écoles." });
    }

    // Validate file
    if (!req.file) {
      return res.status(400).json({ error: "Please select a verification document" });
    }

    // Validate school name
    const { schoolName } = req.body;
    if (!schoolName || schoolName.trim().length < 3) {
      return res.status(400).json({ error: "School name must be at least 3 characters" });
    }

    // Check for existing pending verification
    const existingVerification = await prisma.verification.findFirst({
      where: { userId: req.user.id, status: 'PENDING' }
    });

    if (existingVerification) {
      return res.status(400).json({ 
        error: "You already have a pending verification request" 
      });
    }

    // Process file
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Move file from temp to permanent location
    fs.renameSync(req.file.path, filePath);

    // Create verification record
    const verification = await prisma.verification.create({
      data: {
        userId: req.user.id,
        schoolName: schoolName.trim(),
        proof: fileName, 
        status: 'PENDING'
      },
      select: {
        id: true,
        schoolName: true,
        createdAt: true,
        status: true
      }
    });

    res.status(201).json({
      message: "Verification submitted successfully!",
      verification
    });

  } catch (error) {
    console.error("Verification submission error:", error);
    res.status(500).json({ 
      error: "An error occurred while submitting your verification" 
    });
  }
};

exports.getAllVerifications = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const verifications = await prisma.verification.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(verifications);
  } catch (error) {
    console.error("Get verifications error:", error);
    res.status(500).json({ error: "Failed to fetch verifications" });
  }
};

exports.serveVerificationFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    // Verify access rights
    if (req.user.role !== 'ADMIN') {
      const verification = await prisma.verification.findFirst({
        where: { proof: filename, userId: req.user.id }
      });
      if (!verification) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};
// À ajouter dans votre controller
exports.approveVerification = async (req, res) => {
  try {
    const { verificationId } = req.params;
    
    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: { 
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: req.user.id 
      }
    });

    res.json({ message: "Verification approved", verification });
  } catch (error) {
    res.status(500).json({ error: "Approval failed" });
  }
};
// À ajouter dans votre controller
exports.rejectVerification = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { reason } = req.body;
    
    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: { 
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy: req.user.id 
      }
    });

    res.json({ message: "Verification rejected", verification });
  } catch (error) {
    res.status(500).json({ error: "Rejection failed" });
  }
};
