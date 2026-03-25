require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(express.json()); 
app.use(cors());         

// Database Connection
// Note: In production, replace the local string with process.env.MONGO_URI
mongoose.connect('mongodb://127.0.0.1:27017/glance_db')
    .then(async () => {
        console.log('Connected to MongoDB successfully.');
        await initializeAdmin(); 
    })
    .catch((err) => console.error('Database connection error:', err));

/**
 * Seeds the initial Admin user if no admin exists in the database.
 * This ensures the system always has a primary administrator on startup.
 */
async function initializeAdmin() {
    try {
        // Internal schema definition for initial seed only
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, default: 'user' }
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Check for existing admin role
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('adminpassword123', 10);
            await User.create({
                name: 'Shubham',
                email: 'admin@glance.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Initial Admin profile created successfully.');
        } else {
            console.log('Admin profile verified and active.');
        }
    } catch (error) {
        console.error('Admin initialization failed:', error.message);
    }
}

// API Route Mounting
const newsRoutes = require('./routes/news'); 
const authRoutes = require('./routes/auth');
const summarizeRoutes = require('./routes/summarize');
const interactionRoutes = require('./routes/interactions');
const adminRoutes = require('./routes/admin');

app.use('/api/news', newsRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).send('Glance API Gateway is operational.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});