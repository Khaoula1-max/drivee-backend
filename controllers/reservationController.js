const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//nsoubo rservation
exports.createReservation = async (req, res) => {
  try {
    // Validate required fields
    const { offreId, startDate, price } = req.body;
    if (!offreId || !startDate || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get authenticated user ID (student)
    const studentId = req.user.id;

    // Get schoolId from the offer
    const offer = await prisma.offre.findUnique({
      where: { id: offreId },
      select: { schoolId: true }
    });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        student: { connect: { id: studentId } },
        school: { connect: { id: offer.schoolId } },
        offre: { connect: { id: offreId } },
        startDate: new Date(startDate),
        // price: parseFloat(price),
        status: "pending",
        paymentStatus: "unpaid",
        reservationDate: new Date()
      },
      include: {
        offre: true,
        school: true,
        student: true
      }
    });

    console.log("Saved to MongoDB:", reservation);
    return res.status(201).json(reservation); // Note the 'return' here

  } catch (error) {
    console.error("Error saving to MongoDB:", error);
    return res.status(500).json({ error: "Internal server error" }); // Note the 'return' here
  }
};

// nchufo gae les resrvation
exports.getUserReservations = async (req, res) => {
try {
  const reservations = await prisma.reservation.findMany({
  where: { studentId: req.user.id },
  include: {
  offre: true,
  school: true
  }});
  res.json(reservations);
  } catch (error) {
  res.status(500).json({ error: "Server error" });
  }};
exports.getSchoolReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
  where: { 
   schoolId: req.user.id 
  },
  include: {
  student: true,
  offre: true,
  school: true},
 orderBy: {
  reservationDate: 'desc'}
  });
  res.json(reservations);
  } catch (error) {
  console.error('Error fetching reservations:', error);
  res.status(500).json({ error: "Server error" });
  }
};
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
  include: {
  student: {
  select: {
  firstName: true,
   email: true}},
  school: {
  select: {
  firstName: true }},
  offre: {
 select: {
  title: true,
  price: true}
  }},
  orderBy: {
   reservationDate: 'desc' 
      }
  });
    res.json(reservations);
  } catch (error) {
  console.error('Error fetching reservations:', error);
    res.status(500).json({ error: "Server error" });
  }
};