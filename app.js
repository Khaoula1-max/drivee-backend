// Load environment variables
require('dotenv').config();
// Import necessary modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const verificationRoutes = require('./routes/verificationRoutes'); // Assurez-vous que le nom correspond
const reservationRoutes = require('./routes/reservationRoutes'); 

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
app.use('/users', userRoutes); // Prefix routes with /api/users
app.use('/verification', verificationRoutes); // Change verificationRoutes to verificationRouter
app.use('/reservations', reservationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error message:', err.message); // Log the error message
    console.error('Error stack:', err.stack); // Log the error stack
    res.status(500).json({ message: 'Something went wrong!', error: err.message }); // Optionally include the error message in the response
});

// Define the port
const PORT = process.env.PORT || 5000; // Change to 5001 or any other available port

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});