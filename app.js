
require('dotenv').config();
const express = require('express');

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const offreRoutes = require('./routes/offreRoutes');
const authMiddleware = require('./middlewares/authMiddleware'); 
const reservationRoutes = require('./routes/reservationRoutes');
const verificationRoutes = require('./routes/verificationRoutes');



// Create an Express application
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS
app.use(helmet()); // Set security-related HTTP headers
app.use(cookieParser()); // Parse cookies

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
});

app.use(limiter);

// Use user routes
app.use('/users', userRoutes); 
app.use('/offres', authMiddleware, offreRoutes);
app.use('/reservations', authMiddleware, reservationRoutes); 
app.use('/verifications', authMiddleware, verificationRoutes);



// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error message:', err.message); // Log the error message
    console.error('Error stack:', err.stack); // Log the error stack
    res.status(500).json({ message: 'Something went wrong!', error: err.message }); // Optionally include the error message in the response
});
// Define the port
const PORT = process.env.PORT || 5000; 

// Start the server
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});