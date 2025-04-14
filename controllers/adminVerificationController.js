const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.approveVerification = async (req, res) => {
  try {
    // Vérification du rôle ADMIN
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { verificationId } = req.params;

    // Mise à jour du statut
    const updated = await prisma.verification.update({
      where: { id: verificationId },
      data: { 
        status: 'APPROVED',
        reviewedBy: req.user.id,
        updatedAt: new Date()
      }
    });

    // Optionnel : Marquer l'école comme vérifiée
    await prisma.user.update({
      where: { id: updated.userId },
      data: { verified: true }
    });

    res.json({ 
      success: true,
      message: "Verification approved"
    });

  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({ error: "Approval failed" });
  }
};