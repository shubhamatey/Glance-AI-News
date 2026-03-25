require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(express.json()); 
app.use(cors());         

// ✅ DATABASE CONNECTION
const dbURI = process.env.MONGO_URI; 

mongoose.connect(dbURI)
    .then(async () => {
        console.log('Connected to MongoDB Atlas successfully.');
        await initializeAdmin(); 
    })
    .catch((err) => {
        console.error('Database connection error:', err.message);
        console.log('Error Detail: Check if MONGO_URI is correct in Render dashboard.');
    });

// Admin Initialization Logic 
async function initializeAdmin() {
    try {
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, default: 'user' }
        }, { timestamps: true }));

        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('adminpassword123', 10);
            await User.create({
                name: 'Shubham',
                email: 'admin@glance.com', // Is email se login karna admin dashboard ke liye
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Initial Admin profile created successfully.');
        }
    } catch (error) {
        console.error('Admin initialization failed:', error.message);
    }
}

// Routes
app.use('/api/news', require('./routes/news')); 
app.use('/api/auth', require('./routes/auth'));
app.use('/api/summarize', require('./routes/summarize'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.status(200).send('Glance API Gateway is operational.');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});