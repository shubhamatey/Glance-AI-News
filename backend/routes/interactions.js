const express = require('express');
const router = express.Router();
const Interaction = require('../models/Interaction');
const User = require('../models/User');

/**
 * @route   GET /api/interactions
 * @desc    Fetch historical interactions for the administrative user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) return res.status(404).json({ error: "Primary administrator account not found" });

        const data = await Interaction.find({ userId: admin._id }).sort({ createdAt: -1 });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve user interactions" });
    }
});

/**
 * @route   POST /api/interactions
 * @desc    Log a new interaction (save/share) or toggle saved status
 * @access  Private
 */
router.post('/', async (req, res) => {
    const { url, title, image, description, action } = req.body;
    try {
        const admin = await User.findOne({ role: 'admin' });

        // Logic for toggling 'save' action
        if (action === 'save') {
            const existing = await Interaction.findOne({ userId: admin._id, url, action: 'save' });
            if (existing) {
                await Interaction.findByIdAndDelete(existing._id);
                return res.status(200).json({ message: "Article removed from saved collection" });
            }
        }

        // Record new engagement entry
        const newEntry = new Interaction({
            userId: admin._id, 
            url, 
            title, 
            image, 
            description, 
            action
        });

        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (err) {
        res.status(400).json({ error: "Failed to process interaction request" });
    }
});

module.exports = router;