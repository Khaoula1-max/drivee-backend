
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    let reservations = [];

// Create a new reservation
    exports.createReservation = async (req, res) => {
        try {
            // Validate the request body (you can add more validation as needed)
        const { studentId, schoolId, offreId, startDate, status, paymentStatus } = req.body;

        // Create a new reservation object
        const newReservation = {
            id: reservations.length + 1, 
            studentId,
            schoolId,
            offreId,
            startDate,
            status,
            paymentStatus,
            reservationDate: new Date() 
        };

        // Store the reservation in the in-memory array
        reservations.push(newReservation);

        // Respond with the created reservation
        res.status(201).json({ success: true, data: newReservation });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};