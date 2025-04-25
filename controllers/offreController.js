const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CITIES = require('../utils/cityData');

exports.createOffre = async (req, res) => {
  console.log('Début de création d\'offre', { 
    body: req.body, 
    user: { id: req.user.id, role: req.user.role } 
  });

  try {
    // 1. Extraction et validation des données
    let { title, description, price, durationHours, city, address, startDate, endDate, location } = req.body;
    const schoolId = req.user.id;

    // Gestion des données imbriquées
    if (location) {
      city = city || location.city;
      address = address || location.address;
    }

    // 2. Validation des champs obligatoires
    const requiredFields = { title, city, address };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Champs obligatoires manquants",
        missingFields
      });
    }

    // 3. Validation de la ville
    if (!CITIES.some(c => c.value === city)) {
      return res.status(400).json({ 
        error: "Ville non valide",
        validCities: CITIES.map(c => c.value)
      });
    }

    // 4. Validation des types
    if (price && isNaN(Number(price))) {
      return res.status(400).json({ error: "Le prix doit être un nombre" });
    }

    if (durationHours && isNaN(Number(durationHours))) {
      return res.status(400).json({ error: "La durée doit être un nombre" });
    }

    // 5. Vérification et création de la location (sans duplication)
    const [newLocation] = await prisma.$transaction([
      prisma.location.upsert({
        where: {
          city_address: {
            city: city.trim(),
            address: address.trim()
          }
        },
        create: {
          city: city.trim(),
          address: address.trim()
        },
        update: {} // Ne rien mettre à jour si existe déjà
      })
    ]);

    // 6. Préparation des dates
    const now = new Date();
    const defaultEndDate = new Date(now.getTime() + 86400000); // +1 jour

    // 7. Vérification des doublons d'offres
    const existingOffer = await prisma.offre.findFirst({
      where: {
        title: title.trim(),
        schoolId,
        locationId: newLocation.id,
        startDate: startDate ? new Date(startDate) : now
      }
    });

    if (existingOffer) {
      return res.status(409).json({
        error: "Une offre identique existe déjà",
        existingOfferId: existingOffer.id
      });
    }

    // 8. Création de l'offre
    const newOffre = await prisma.offre.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        price: price ? Number(price) : 0,
        durationHours: durationHours ? Number(durationHours) : 1,
        schoolId,
        locationId: newLocation.id,
        startDate: startDate ? new Date(startDate) : now,
        endDate: endDate ? new Date(endDate) : defaultEndDate
      },
      include: { 
        location: true,
        school: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // 9. Formatage de la réponse
    const response = {
      ...newOffre,
      schoolName: `${newOffre.school.firstName} ${newOffre.school.lastName}`,
      contact: {
        email: newOffre.school.email,
        phone: newOffre.school.phone
      }
    };
    delete response.school;

    console.log('Offre créée avec succès:', response);
    return res.status(201).json(response);

  } catch (error) {
    console.error("Erreur complète:", error);

    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target.includes('city_address')) {
        return res.status(409).json({ error: "Cette localisation existe déjà" });
      }
      return res.status(409).json({ error: "Une offre similaire existe déjà" });
    }

    res.status(500).json({ 
      error: "Erreur serveur",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

exports.getAllOffres = async (req, res) => {
  try {
const offres = await prisma.offre.findMany({
  include: {
    school: {
   select: {
   firstName: true,
  lastName: true
     }},
   location: true
  }
  });

  res.json(offres.map(offre => ({...offre,
     schoolName: `${offre.school.firstName} ${offre.school.lastName}`,
     city: offre.location.city,
      address: offre.location.address
    })));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.updateOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, address, location, ...updates } = req.body;
    const existingOffre = await prisma.offre.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!existingOffre) {
      return res.status(404).json({ error: "Offre non trouvée" });
    }
    if (existingOffre.schoolId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Vous n'avez pas les droits pour modifier cette offre" });
    }
    const updatedOffre = await prisma.offre.update({
      where: { id },
      data: updates,
      include: { location: true }
    });

    if (city || address) {
      await prisma.location.update({
        where: { id: updatedOffre.locationId },
        data: { 
          city: city || updatedOffre.location.city,
          address: address || updatedOffre.location.address
        }
      });
      
      const finalOffre = await prisma.offre.findUnique({
        where: { id },
        include: { location: true }
      });
      
      return res.json(finalOffre);
    }

    res.json(updatedOffre);
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({ 
      error: "Échec de la mise à jour",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Supp whd offre
exports.deleteOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await prisma.offre.findUnique({ 
      where: { id },
      include: { location: true }
    });
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    if (offer.schoolId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await prisma.offre.delete({ where: { id } });
    
    // Supp locl ila ml9ahach
    const locationInUse = await prisma.offre.findFirst({
      where: { locationId: offer.locationId }
    });
    
    if (!locationInUse) {
      await prisma.location.delete({ 
        where: { id: offer.locationId }
      });
    }

    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(400).json({ 
      error: "Failed to delete offer",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.getOffreById = async (req, res) => {
  try {
    const { id } = req.params;
    const offre = await prisma.offre.findUnique({
    where: { id },
    include: {
    school: {
    select: {
    firstName: true,
   lastName: true,
   email: true,
  phone: true
}
},
 location: true
}
});
if (!offre) {
 return res.status(404).json({ error: "Offre non trouvée" });
}
const response = {...offre,schoolName: `${offre.school.firstName} ${offre.school.lastName}`,
  contact: {
   email: offre.school.email,
   phone: offre.school.phone
  },
  location: offre.location
};
res.json(response);
} catch (error) {console.error("Error fetching offer:", error);
res.status(500).json({error: "Server error",details: process.env.NODE_ENV === 'development' ? error.message : undefined
});
  }
};
exports.getOffresBySchool = async (req, res) => {
  try {
const { schoolId } = req.params;
const offres = await prisma.offre.findMany({
where: { 
schoolId: schoolId 
 },
include: {school: {select: { firstName: true, lastName: true}},location: true},
orderBy:{createdAt: 'desc'}});
const response = offres.map(offre => ({...offre,schoolName: `${offre.school.firstName} ${offre.school.lastName}`,city: offre.location.city,address: offre.location.address
    }));
res.json(response);}  
catch (error) {console.error("Error fetching school offers:", error);
res.status(500).json({ rror: "Server error",details: process.env.NODE_ENV === 'development' ? error.message : undefined
   });
  }
};