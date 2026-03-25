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

// DATABASE CONNECTION
const dbURI = process.env.MONGO_URI; 

mongoose.connect(dbURI)
    .then(async () => {
        console.log('Database connection established successfully.');
        await initializeAdmin(); 
    })
    .catch((err) => {
        console.error('Database connection error:', err.message);
        console.log('Please verify the MONGO_URI in your environment settings.');
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
                email: 'admin@glance.com', 
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Default admin profile has been created.');
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
    console.log(`Server is running on port ${PORT}`);
});