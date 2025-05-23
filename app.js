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
const reviewRoutes = require('./routes/reviewRoutes');
const locationRoutes = require('./routes/locationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');


// Create an Express application
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies


app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(helmet()); 
app.use(cookieParser()); 

// Rate limiting middleware



// Use user routes
app.use('/users', userRoutes); 
app.use('/offres', offreRoutes);
app.use('/reservations', authMiddleware, reservationRoutes); 
app.use('/verifications', authMiddleware, verificationRoutes);
app.use('/reviews', authMiddleware, reviewRoutes);
app.use('/locations', locationRoutes);
app.use('/payments', paymentRoutes); // Payment routes


// Static files (for uploaded documents)
app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
      // Security headers for uploaded files
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Content-Disposition', 'inline');
    }
  }));

app.use((err, req, res, next) => {
    console.error('Error message:', err.message); // Log the error message
    console.error('Error stack:', err.stack); // Log the error stack
    res.status(500).json({ message: 'Something went wrong!', error: err.message }); // Optionally include the error message in the response
});

const PORT = process.env.PORT || 5000; 


app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});