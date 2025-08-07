// This line MUST be at the very top.
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
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE SETUP ---
// This is the CRITICAL fix for the CORS error.
app.use(cors());
app.use(express.json());


// --- API ROUTES ---

// == Translation Endpoint with NEW mBART Model ==
app.post('/translate', async (req, res) => {
    const { text, targetLang } = req.body;

    // --- CHANGE #1: Define the single model we will use ---
    const model = "facebook/mbart-large-50-many-to-many-mrt";

    // --- CHANGE #2: Map our simple codes to the full language names mBART expects ---
    const langCodeMap = {
        'hi': 'hi_IN', // Hindi
        'mr': 'mr_IN', // Marathi
        'bn': 'bn_IN', // Bengali
        'gu': 'gu_IN'  // Gujarati
    };
    const targetLangCode = langCodeMap[targetLang];

    if (!targetLangCode) {
        return res.status(400).json({ error: `Language '${targetLang}' not supported.` });
    }

    // --- CHANGE #3: The payload for this model is slightly different ---
    // It requires parameters to tell it the source and target language codes.
    const payload = {
        inputs: text,
        parameters: {
            src_lang: "en_XX",       // English
            tgt_lang: targetLangCode // The language code we looked up
        }
    };

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        // --- CHANGE #4: The response from this model has a different name ---
        // It's 'translation_text' instead of 'generated_text'. We'll adjust our response.
        if (data && data[0] && data[0].translation_text) {
             // We re-format the response to match what the original Helsinki model sent,
             // so our Chrome extension doesn't need to change at all.
            const formattedResponse = [{
                translation_text: data[0].translation_text
            }];
            res.status(200).json(formattedResponse);
        } else {
            // Forward the raw response if it's an error or unexpected format
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error("Server-side fetch error:", error);
        res.status(500).json({ error: 'Server-side fetch error.' });
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Server (mBART model) is running on http://localhost:${PORT}`);
});