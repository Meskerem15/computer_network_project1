const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
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

// Provide CSRF Token to Frontend
app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Secure POST Route with Validation
app.post('/add', [
    body("name").trim().notEmpty().escape(),
    body("email").isEmail().normalizeEmail(),
    body("message").trim().notEmpty().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, message } = req.body;
    try {
        const newUser = new User({ name, email, message });
        await newUser.save();
        res.status(201).json({ message: "Data saved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save data." });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
