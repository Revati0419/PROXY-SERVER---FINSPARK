// This line MUST be at the very top. It loads our .env file for local development.
require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// --- CONFIGURATION & SECURITY ---
const HUGGING_FACE_API_KEY = process.env.HF_API_KEY;
if (!HUGGING_FACE_API_KEY) {
    throw new Error("FATAL ERROR: HF_API_KEY is not set in environment variables.");
}

const API_URL_BASE = "https://api-inference.huggingface.co/models/";
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(cors());        // Allow requests from your Chrome extension
app.use(express.json()); // Allow the server to receive JSON data

// --- API ROUTES ---

// == 1. Translation Endpoint ==
const TRANSLATE_MODELS = {
    'hi': 'Helsinki-NLP/opus-mt-en-hi',
    'mr': 'Helsinki-NLP/opus-mt-en-mr',
    'bn': 'Helsinki-NLP/opus-mt-en-bn',
    'gu': 'facebook/m2m100_418M'
};

app.post('/translate', async (req, res) => {
    const { text, targetLang } = req.body;
    const model = TRANSLATE_MODELS[targetLang];

    if (!model) return res.status(400).json({ error: `Language '${targetLang}' not supported.` });

    let payload = { inputs: text };
    if (model.includes('m2m100')) {
        payload.inputs = `>>${targetLang}<< ${text}`;
    }

    try {
        const response = await fetch(API_URL_BASE + model, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Server-side fetch error.' });
    }
});


// == 2. Text-to-Speech Endpoint (Future Use) ==
app.post('/text-to-speech', async (req, res) => {
    const { text } = req.body;
    // TODO: Choose a Text-to-Speech model from Hugging Face
    const model = "espnet/kan-bayashi_ljspeech_vits"; // Example model
    
    console.log(`Received text-to-speech request for: "${text}"`);

    // For now, send back a success message.
    // In the future, you would call the model and return an audio file.
    res.json({ message: "Text-to-speech endpoint is under construction.", receivedText: text });
});


// == 3. Speech-to-Text Endpoint (Future Use) ==
app.post('/speech-to-text', async (req, res) => {
    // Note: This is more complex as you need to handle audio blob uploads
    console.log("Received a speech-to-text request.");
    res.json({ message: "Speech-to-text endpoint is under construction." });
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});