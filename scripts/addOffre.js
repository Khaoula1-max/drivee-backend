const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Données de l'offre à créer
  const newOffre = await prisma.offre.create({
    data: {
      title: "WELCOME KHAOULA CODING",
      description: "Formation waara mehba bikom 3andna",
      price: 900,
      durationHours: 30,
      startDate: new Date("2025-04-16"),
      endDate: new Date("2025-04-26"),
      schoolId: "67f78ed2e16dbdbbd175dcc6", // Remplacez par un ID d'école existant
      locationId: "650d13b9a1b2c8a9c7d8e9f1", // Remplacez par un ID de location existant
      Verified: true
    }
  });
  console.log("Offre créée avec succès:", newOffre);
}

main()
  .catch(e => {
    console.error("Erreur:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });