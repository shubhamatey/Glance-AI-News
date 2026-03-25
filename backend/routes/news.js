const express = require('express');
const router = express.Router();
const News = require('../models/News'); 
const fetchuser = require('../middleware/fetchuser'); 
const axios = require('axios'); 

// ROUTE 1: Add a new article to the database - Login required
router.post('/add', fetchuser, async (req, res) => {
    try {
        const newArticle = new News(req.body); 
        const savedArticle = await newArticle.save(); 
        res.status(201).json({ success: true, message: "Article saved successfully", data: savedArticle });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// ROUTE 2: Fetch all news articles from the database - Public access
router.get('/all', async (req, res) => {
    try {
        const allNews = await News.find().sort({ createdAt: -1 }); 
        res.status(200).json(allNews);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch news from database" });
    }
});

// ROUTE 3: Delete a news article by ID - Login required
router.delete('/delete/:id', fetchuser, async (req, res) => {
    try {
        let article = await News.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }
        await News.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Article deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Could not delete the article" });
    }
});

// ROUTE 4: Fetch live news from external GNews API
router.get('/live', async (req, res) => {
    try {
        // Tumhari .env file mein variable ka naam VITE_GNEWS_API_KEY tha, wahi use kiya hai
        const url = `https://gnews.io/api/v4/top-headlines?category=technology&lang=en&apikey=${process.env.VITE_GNEWS_API_KEY}`;
        const response = await axios.get(url);
        res.status(200).json({ status: "ok", articles: response.data.articles });
    } catch (error) {
        console.error("GNews API Error:", error.message);
        res.status(500).json({ error: "External API request failed" });
    }
});

module.exports = router;