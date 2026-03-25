const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret key for JWT signing (Should be stored in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'glance_secret_key';

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user and return an access token
 * @access  Public
 */
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verify if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email address is already registered" });
        }

        // Generate salt and hash the plain text password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Initialize new user instance
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        // Generate authentication token upon successful registration
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role }, 
            JWT_SECRET, 
            { expiresIn: '7d' } 
        );

        res.status(201).json({ 
            message: "User registered successfully",
            token,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        res.status(500).json({ error: "Server error during user registration" });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return access token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verify user credentials
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Compare plain text password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Issue access token
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '7d' } 
        );

        res.status(200).json({ 
            message: "Login successful", 
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ error: "Server error during authentication" });
    }
});

module.exports = router;