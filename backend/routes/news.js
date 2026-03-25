const express = require('express');
const router = express.Router();
const News = require('../models/News'); 
const fetchuser = require('../middleware/fetchuser'); 
const axios = require('axios'); 
const { CohereClient } = require('cohere-ai');

// Cohere AI Client Initialization
const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

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

// ROUTE 4: Fetch live news from external NewsAPI
router.get('/live', async (req, res) => {
    try {
        const url = `https://newsapi.org/v2/everything?q=technology&language=en&apiKey=${process.env.NEWS_API_KEY}`;
        const response = await axios.get(url);
        res.status(200).json({ status: "ok", articles: response.data.articles });
    } catch (error) {
        res.status(500).json({ error: "External API request failed" });
    }
});

// ROUTE 5: Generate AI summary using Cohere for a technology article
router.get('/generate', async (req, res) => {
    try {
        // Fetch a single article for summarization
        const newsUrl = `https://newsapi.org/v2/everything?q=technology&language=en&pageSize=1&apiKey=${process.env.NEWS_API_KEY}`;
        const newsResponse = await axios.get(newsUrl);
        const article = newsResponse.data.articles[0];

        if (!article) return res.status(404).json({ error: "No news found to summarize" });

        // Request summary from Cohere AI model
        const response = await cohere.chat({
            model: 'command-r-08-2024',
            message: `Summarize this news in exactly 2 catchy lines. Use Hinglish (Hindi written in English alphabet).
            Title: ${article.title}
            Description: ${article.description}`,
        });

        const summary = response.text.trim();

        res.status(200).json({
            success: true,
            aiSummary: summary,
            originalTitle: article.title,
            url: article.url,
            imageUrl: article.urlToImage
        });

    } catch (error) {
        console.error("Cohere AI Error:", error.message);
        res.status(500).json({ error: "AI processing failed" });
    }
});

module.exports = router;