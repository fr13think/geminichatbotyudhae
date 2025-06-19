// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // To load environment variables from .env file
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Initialize Express App ---
const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies
app.use(express.static('public')); // To serve static files (HTML, CSS, JS)

// --- Initialize Google Generative AI ---
// Make sure you have your GOOGLE_API_KEY in the .env file
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// FIXED: Updated the model name to a current, valid model.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- API Route for Chat ---
// This is the endpoint your frontend will call
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ reply: "Message is required." });
    }

    try {
        console.log(`Received message: ${userMessage}`);

        // Generate content using the Gemini model
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();
        
        console.log(`Sending reply: ${text}`);
        res.json({ reply: text });

    } catch (err) {
        console.error("Error calling Gemini API:", err);
        res.status(500).json({ reply: "Something went wrong on our end." });
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Gemini AI Chatbot is running on http://localhost:${port}`);
});
