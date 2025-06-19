// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Initialize Express App ---
const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Initialize Google Generative AI ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- API Route for Chat (Updated for Context & Streaming) ---
app.post('/api/chat', async (req, res) => {
    try {
        const { history } = req.body; // Menerima riwayat percakapan

        if (!history || history.length === 0) {
            return res.status(400).json({ error: "Chat history is required." });
        }

        // Mengatur header untuk streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // Kirim header segera

        // Memulai sesi chat dengan riwayat yang ada
        const chat = model.startChat({
            history: history.slice(0, -1), // Kirim semua riwayat kecuali pesan terakhir dari pengguna
        });

        // Mengirim pesan terakhir sebagai stream
        const lastMessage = history[history.length - 1].parts[0].text;
        const result = await chat.sendMessageStream(lastMessage);

        // Mengirim setiap potongan (chunk) respons ke klien
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        res.end(); // Menutup koneksi setelah stream selesai

    } catch (error) {
        console.error("Error in chat streaming:", error);
        res.write(`data: ${JSON.stringify({ error: "Terjadi kesalahan pada server." })}\n\n`);
        res.end();
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Gemini AI Chatbot is running on http://localhost:${port}`);
});
