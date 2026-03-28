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

// --- YE SECTION UPDATE KIYA HAI (NEWS PROXY) ---
app.get('/api/news', async (req, res) => {
    try {
        const { category, q, page = 1 } = req.query;
        const apiKey = process.env.GNEWS_API_KEY; 
        
        let url = q 
            ? `https://gnews.io/api/v4/search?q=${q}&lang=en&country=in&max=8&page=${page}&apikey=${apiKey}`
            : `https://gnews.io/api/v4/top-headlines?category=${category || 'general'}&lang=en&country=in&max=8&page=${page}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: "Backend news fetch failed" });
    }
});

// Routes
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