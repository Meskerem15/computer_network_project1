const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const axios = require('axios');  // To make HTTP requests
require('dotenv').config();

const app = express();

// Secure Headers
app.use(helmet());

// Secure CORS Policy
app.use(cors({
    origin: "https://meskerem15.github.io/computer_network_project1/", 
    methods: ["POST", "GET"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Define User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// CSRF Protection Middleware
const csrfProtection = csurf({ cookie: true });

app.use(csrfProtection);

// Provide CSRF Token to Frontend via Cookie
app.get("/csrf-token", (req, res) => {
    res.cookie("XSRF-TOKEN", req.csrfToken(), {
        httpOnly: true, // Prevent JavaScript access
        secure: true, // Only allow on HTTPS
        sameSite: "Strict" // Prevent CSRF from third-party sites
    });
    res.json({ message: "CSRF token set." });
});

// Secure POST Route with Validation and reCAPTCHA
app.post('/add', [
    body("name").trim().notEmpty().escape(),
    body("email").isEmail().normalizeEmail(),
    body("message").trim().notEmpty().escape(),
    body("g-recaptcha-response").notEmpty().withMessage("Please complete the CAPTCHA")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, message, "g-recaptcha-response": recaptchaResponse } = req.body;

    // Verify reCAPTCHA response
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Secret key from your Google reCAPTCHA setup
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    try {
        // Send verification request to Google reCAPTCHA API
        const googleResponse = await axios.post(verificationUrl);
        const googleData = googleResponse.data;

        if (!googleData.success) {
            return res.status(400).json({ error: "reCAPTCHA verification failed" });
        }

        // If reCAPTCHA is successful, save the user data to MongoDB
        const newUser = new User({ name, email, message });
        await newUser.save();
        res.status(201).json({ message: "Data saved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to verify reCAPTCHA or save data" });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
