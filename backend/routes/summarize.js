const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenAI } = require("@google/genai"); 

// Initialize Google Generative AI with API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', async (req, res) => {
  const { articleUrl, title, description } = req.body;
  let contentToSummarize = "";
  
  // Default values for metadata
  let scrapedTitle = "Processing Content..."; 
  let scrapedImage = "https://via.placeholder.com/600x300/e2e8f0/0f172a?text=AI+is+Analyzing+Article"; 

  try {
    // Case 1: Summarization via direct URL (Web Scraping required)
    if (articleUrl && !description) {
      try {
        const response = await axios.get(articleUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
        });
        const $ = cheerio.load(response.data);
        
        // Extract paragraph text and limit to 4000 characters for AI context window
        contentToSummarize = $('p').text().substring(0, 4000).trim(); 
        
        if (contentToSummarize.length < 50) {
             return res.status(400).json({ error: "Insufficient content extracted from the source. Please provide a different link." });
        }
        
        // Extract OpenGraph metadata for title and featured image
        scrapedTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || articleUrl;
        scrapedTitle = scrapedTitle.substring(0, 200).trim();

        scrapedImage = $('meta[property="og:image"]').attr('content') || "https://via.placeholder.com/600x300/e2e8f0/0f172a?text=Preview+Unavailable";
        
        // Handle relative image paths
        if (scrapedImage.startsWith('/')) {
            const urlObj = new URL(articleUrl);
            scrapedImage = `${urlObj.origin}${scrapedImage}`;
        }

      } catch (scrapeError) {
        console.error("Scraping error:", scrapeError.message);
        return res.status(400).json({ error: "Failed to access the URL. The website might be restricted or invalid." });
      }
    } 
    // Case 2: Summarization using provided metadata (Feed Articles)
    else {
      contentToSummarize = `Title: ${title}\nContent: ${description}`;
    }

    // Configure AI prompt for structured 3-point bulleted summary
    const promptText = `Act as an expert news editor. Summarize the following news text in exactly 3 short, crisp, and informative bullet points. 
    Start each point with a bullet symbol "•". 
    Do not use markdown formatting like bold characters or stars (*).
    Use clear and professional English.

    News Text:
    ${contentToSummarize}`;

    // Generate content using Gemini AI model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText
    });

    res.json({ 
        summary: response.text,
        scrapedTitle: scrapedTitle, 
        scrapedImage: scrapedImage 
    });

  } catch (error) {
    console.error("AI Generation Error:", error.message);
    res.status(500).json({ error: "Internal Server Error: Failed to generate AI summary." });
  }
});

module.exports = router;