// Load environment variables
require('dotenv').config();

// Import necessary modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes'); // Import user routes

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
app.use('/api/users', userRoutes); // Prefix routes with /api/users

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Define the port
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not defined

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});