const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une offre (pour les écoles seulement)
exports.createOffre = async (req, res) => {
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
    const location = await prisma.location.create({
      data: {
        city: city,
        address: address
      }
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
    
    res.status(201).json(newOffre);
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(400).json({ 
      error: "Erreur lors de la création de l'offre",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
          }
        },
        location: true
      }
    });

    res.json(offres.map(offre => ({
      ...offre,
      schoolName: offre.school ? 
        `${offre.school.firstName} ${offre.school.lastName}` : 
        'Unknown School',
      city: offre.location?.city || 'Unknown City',
      address: offre.location?.address || 'Unknown Address'
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

    // Vérifier l'offre existante
    const offre = await prisma.offre.findUnique({ 
      where: { id },
      include: { location: true }
    });
    
    if (offre.schoolId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    let locationId = offre.locationId;
    
    // Si la localisation change, créer une nouvelle entrée
    if (city || address) {
      const newLocation = await prisma.location.create({
        data: {
          city: city || offre.location.city,
          address: address || offre.location.address
        }
      });
      locationId = newLocation.id;
      
      // Supprimer l'ancienne localisation si non utilisée
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

    // Mettre à jour l'offre
    const updatedOffre = await prisma.offre.update({
      where: { id },
      data: {
        ...updates,
        locationId: locationId
      },
      include: {
        location: true
      }
    });
    
    res.json(updatedOffre);
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({ 
      error: "Erreur de modification",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Supprimer une offre
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
    
    // Supprimer la localisation si non utilisée
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

// Obtenir une offre par ID
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

    const response = {
      ...offre,
      schoolName: offre.school ? 
        `${offre.school.firstName} ${offre.school.lastName}` : 
        'Unknown School',
      contact: {
        email: offre.school?.email,
        phone: offre.school?.phone
      },
      location: offre.location || { city: 'Unknown', address: 'Unknown' }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};