//Configuring Dotenv to use environment variables from .env file
require("dotenv").config();

//Creating express server
const express = require("express");
const app = express();

// Specifying the port
const port = process.env.PORT || 5000;

//Using Express.JSON
app.use(express.json());

// CORS Handler
const cors = require("cors");
app.use(cors());

// Disabling the X-Powered-By header
app.disable("x-powered-by");

// use helmet
const helmet = require("helmet");
app.use(helmet());

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});

app.use(limiter);


const cookieParser = require('cookie-parser');
app.use(cookieParser());

// routes

app.use("/user", require('./routes/userRoutes'))


//Listening om the port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});