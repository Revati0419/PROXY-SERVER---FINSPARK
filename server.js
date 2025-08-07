// This line MUST be at the very top.
require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Make sure this line is here
const app = express();

// --- CONFIGURATION & SECURITY ---
const HUGGING_FACE_API_KEY = process.env.HF_API_KEY;
if (!HUGGING_FACE_API_KEY) {
    throw new Error("FATAL ERROR: HF_API_KEY is not set in environment variables.");
}

const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE SETUP ---
// THIS IS THE FIX. This line tells your server to add the
// 'Access-Control-Allow-Origin' header to all responses.
// It MUST come BEFORE your app.post routes.
app.use(cors());

app.use(express.json()); // Allow the server to receive JSON data

// --- API ROUTES ---

// == 1. Translation Endpoint ==
// ... (The rest of your /translate route code is the same and is correct) ...
app.post('/translate', async (req, res) => {
    const { text, targetLang } = req.body;
    const model = {
        'hi': 'Helsinki-NLP/opus-mt-en-hi',
        'mr': 'Helsinki-NLP/opus-mt-en-mr',
        'bn': 'Helsinki-NLP/opus-mt-en-bn',
        'gu': 'facebook/m2m100_418M'
    }[targetLang];

    if (!model) return res.status(400).json({ error: `Language '${targetLang}' not supported.` });

    let payload = { inputs: text };
    if (model.includes('m2m100')) {
        payload.inputs = `>>${targetLang}<< ${text}`;
    }

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
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


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});