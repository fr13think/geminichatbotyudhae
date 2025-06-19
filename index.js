// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Initialize Express App ---
const app = express();
// Tingkatkan batas payload untuk menerima gambar base64
app.use(express.json({ limit: '10mb' })); 
app.use(cors());
app.use(express.static('public'));

const port = process.env.PORT || 3000;

// --- Initialize Google Generative AI ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// **DIPERBAIKI**: Menggunakan satu model multimodal yang lebih baru
// Model 'gemini-1.5-flash' dapat menangani input teks dan gambar.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- API Route for Chat (Updated for Multimodal Input) ---
app.post('/api/chat', async (req, res) => {
    try {
        const { history, message, file } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required." });
        }
        
        // Siapkan prompt
        const userPrompt = [{ text: message }];
        if (file && file.data && file.mimeType) {
            // Hapus header base64 jika ada (contoh: "data:image/jpeg;base64,")
            const base64Data = file.data.split(',')[1] || file.data;
            userPrompt.unshift({ // Letakkan gambar di awal untuk konteks yang lebih baik
                inlineData: {
                    mimeType: file.mimeType,
                    data: base64Data,
                },
            });
        }
        
        // Mengatur header untuk streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Memulai sesi chat dengan riwayat yang ada
        const chat = model.startChat({
            history: history || [],
        });

        // Mengirim pesan terakhir sebagai stream
        const result = await chat.sendMessageStream(userPrompt);

        // Mengirim setiap potongan (chunk) respons ke klien
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
        res.end();

    } catch (error) {
        console.error("Error in chat processing:", error);
        res.write(`data: ${JSON.stringify({ error: "Terjadi kesalahan pada server." })}\n\n`);
        res.end();
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Gemini AI Chatbot is running on http://localhost:${port}`);
});
