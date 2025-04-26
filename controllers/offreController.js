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

    // Gestion des données imbriquées dans l'objet location
    if (location) {
      city = city || location.city;
      address = address || location.address;
    }

    // 2. Validation complète
    const requiredFields = { title, city, address };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error('Champs requis manquants:', missingFields);
      return res.status(400).json({ 
        error: "Champs obligatoires manquants",
        missingFields,
        receivedData: { title, city, address }
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

    // 5. Création de la location
    console.log('Création de la location avec:', { city, address });
    const newLocation = await prisma.location.create({
      data: { 
        city: city.trim(), 
        address: address.trim() 
      }
    });

    // 6. Préparation des dates
    const now = new Date();
    const defaultEndDate = new Date(now.getTime() + 86400000); // +1 jour

    // 7. Création de l'offre
    const offerData = {
      title: title.trim(),
      description: description?.trim() || "",
      price: price ? Number(price) : 0,
      durationHours: durationHours ? Number(durationHours) : 1,
      schoolId,
      locationId: newLocation.id,
      startDate: startDate ? new Date(startDate) : now,
      endDate: endDate ? new Date(endDate) : defaultEndDate
    };

    console.log('Création de l\'offre avec:', offerData);
    const newOffre = await prisma.offre.create({
      data: offerData,
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

    // 8. Réponse formatée
    const response = {
      ...newOffre,
      schoolName: `${newOffre.school.firstName} ${newOffre.school.lastName}`,
      contact: {
        email: newOffre.school.email,
        phone: newOffre.school.phone
      }
    };

    // Suppression des données sensibles
    delete response.school;
    
    console.log('Offre créée avec succès:', response);
    return res.status(201).json(response);

  } catch (error) {
    console.error("Erreur complète:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user
    });

    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Une offre ou localisation similaire existe déjà" });
    }

    res.status(500).json({ 
      error: "Erreur serveur",
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
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
    
    // Supprimer d'abord l'offre
    await prisma.offre.delete({ where: { id } });
    
    // Puis supprimer la location associée (si elle existe)
    if (offer.locationId) {
      await prisma.location.delete({ 
        where: { id: offer.locationId }
      }).catch(error => {
        // Gérer l'erreur si la location n'existe pas déjà
        console.error("Error deleting location:", error);
      });
    }
    
    res.json({ message: "Offer and associated location deleted successfully" });
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
// Récupère les offres de l'école actuellement connectée
exports.getMySchoolOffers = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien une école
    if (req.user.role !== 'SCHOOL') {
      return res.status(403).json({ error: "Accès réservé aux écoles" });
    }

    const offres = await prisma.offre.findMany({
      where: { 
        schoolId: req.user.id // Utilise l'ID de l'école connectée
      },
      include: {
        school: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        location: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formater la réponse comme vos autres endpoints
    const formattedOffers = offres.map(offre => ({
      ...offre,
      schoolName: `${offre.school.firstName} ${offre.school.lastName}`,
      city: offre.location.city,
      address: offre.location.address
    }));

    res.json(formattedOffers);
  } catch (error) {
    console.error("Error fetching my school offers:", error);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};