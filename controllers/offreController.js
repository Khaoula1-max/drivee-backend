const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOffre = async (req, res) => {
  console.log('Début de la création d\'offre');
  console.log('Données reçues:', req.body);
  console.log('Utilisateur authentifié:', req.user?.id);

  try {
    const { 
      title, 
      description, 
      price, 
      durationHours, 
      startDate, 
      endDate, 
      city, 
      address 
    } = req.body;

    console.log('Validation des champs requis...');
    if (!title || !description || !price || !durationHours || !startDate || !endDate || !city || !address) {
      console.error('Champs manquants:', {
        title: !title,
        description: !description,
        price: !price,
        durationHours: !durationHours,
        startDate: !startDate,
        endDate: !endDate,
        city: !city,
        address: !address
      });
      return res.status(400).json({ 
        error: "Tous les champs sont requis, y compris la ville et l'adresse",
        details: {
          missingFields: {
            title: !title,
            description: !description,
            price: !price,
            durationHours: !durationHours,
            startDate: !startDate,
            endDate: !endDate,
            city: !city,
            address: !address
          }
        }
      });
    }

    console.log('Création de la localisation...');
    const location = await prisma.location.create({
      data: {
        city: city,
        address: address
      }
    });
    console.log('Location créée:', location);

    console.log('Préparation des données pour l\'offre:', {
      title,
      description,
      price: parseFloat(price),
      durationHours: parseInt(durationHours),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      schoolId: req.user.id,
      locationId: location.id
    });

    const newOffre = await prisma.offre.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        durationHours: parseInt(durationHours),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolId: req.user.id, 
        locationId: location.id,
      },
      include: {
        location: true
      }
    });
    
    console.log('Offre créée avec succès:', newOffre);
    res.status(201).json(newOffre);

  } catch (error) {
    console.error("\nERREUR DÉTAILLÉE:");
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Meta:', error.meta);
    console.error('Stack:', error.stack);
    
    if (error.code === 'P2002') {
      console.error('Erreur de contrainte unique (violation de clé unique)');
      const errorDetails = {
        code: error.code,
        target: error.meta?.target
      };
      return res.status(400).json({ 
        error: "Violation de contrainte unique",
        details: errorDetails
      });
    }

    if (error.code === 'P2025') {
      console.error('Enregistrement requis introuvable');
      return res.status(400).json({ 
        error: "Enregistrement requis introuvable",
        details: error.meta
      });
    }

    console.error('Type d\'erreur:', typeof error);
    res.status(400).json({ 
      error: "Erreur lors de la création de l'offre",
      details: {
        message: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      }
    });
  } finally {
    console.log('Fin du processus de création d\'offre\n');
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
  const { city, address, ...updates } = req.body;

// nt2akdo mn offre wx kyn
    const offre = await prisma.offre.findUnique({ 
      where: { id },
      include: { location: true }
    });
    
if (offre.schoolId !== req.user.id && req.user.role !== 'ADMIN') {
   return res.status(403).json({ error: "Action non autorisée" });
    }

  const  locationId = offre.locationId;
    
    // ila bdlo locl ndiro entrre akhra
    if (city || address) {
      const newLocation = await prisma.location.create({
        data: {
          city: city || offre.location.city,
          address: address || offre.location.address
        }
      });
      locationId = newLocation.id;
      
// local 9dima ila mkhmouch biha nhydouha automatiquement
      const oldLocationInUse = await prisma.offre.findFirst({
        where: { 
          locationId: offre.locationId,
          NOT: { id: offre.id }
        }
      });
      
      if (!oldLocationInUse) {
        await prisma.location.delete({ 
          where: { id: offre.locationId }
        });
      }
    }

// upd dyl offre
   const updatedOffre = await prisma.offre.update({
    where: { id },
    data: {...updates,
     locationId: locationId
      },
      include: {location: true
      } });
    res.json(updatedOffre);
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({  error: "Erreur de modification",
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