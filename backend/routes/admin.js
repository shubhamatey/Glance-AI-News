const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Interaction = require('../models/Interaction');

/**
 * @route   GET /api/admin/stats
 * @desc    Fetch analytical data and counts for the admin dashboard
 * @access  Private/Admin
 */
router.get('/stats', async (req, res) => {
    try {
        // Parallel execution of count documents for performance
        const [totalUsers, totalSaves, totalShares] = await Promise.all([
            User.countDocuments(),
            Interaction.countDocuments({ action: 'save' }),
            Interaction.countDocuments({ action: 'share' })
        ]);

        res.status(200).json({ 
            users: totalUsers, 
            saves: totalSaves, 
            shares: totalShares 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve dashboard statistics" });
    }
});

module.exports = router;