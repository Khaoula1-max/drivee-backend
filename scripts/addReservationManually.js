const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addManualReservation() {
  try {
    
    const reservationData = {
      studentId: "68053262415a1ae7d19f22a8", 
      schoolId: "6802cfafe48df8525e22740a",  
      offreId: "67ffe2ee36b5d85cb8fc52d7",   
      startDate: new Date("2024-12-25T10:00:00Z"), 
      status: "confirmed", 
      paymentStatus: "paid", 
    };

    // Vérification des IDs 
    const [student, school, offre] = await Promise.all([
      prisma.user.findUnique({ where: { id: reservationData.studentId } }),
      prisma.user.findUnique({ where: { id: reservationData.schoolId } }),
      prisma.offre.findUnique({ where: { id: reservationData.offreId } }),
    ]);

    if (!student) throw new Error("Étudiant non trouvé");
    if (!school) throw new Error("École non trouvée");
    if (!offre) throw new Error("Offre non trouvée");

    // Création de la réservation
    const reservation = await prisma.reservation.create({
      data: reservationData,
    });

    console.log("✅ Réservation créée avec succès :", reservation);
  } catch (error) {
    console.error("❌ Erreur :", error.message);
  } finally {
    await prisma.$disconnect(); 
  }
}

addManualReservation();