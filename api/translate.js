// File: /api/translate.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests allowed' });
    }

    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
        return res.status(400).json({ error: 'Missing "text" or "targetLang" in request body' });
    }

    // Map target language codes to Hugging Face MarianMT models
    const langModelMap = {
        hi: 'Helsinki-NLP/opus-mt-en-hi',
        mr: 'Helsinki-NLP/opus-mt-en-mr',
        bn: 'Helsinki-NLP/opus-mt-en-bn',
        gu: 'Helsinki-NLP/opus-mt-en-gu',
    };

    const model = langModelMap[targetLang];
    if (!model) {
        return res.status(400).json({ error: `Unsupported target language: ${targetLang}` });
    }

    try {
        const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: text }),
        });

        const data = await hfResponse.json();

        if (!hfResponse.ok) {
            // HuggingFace model is loading or another error
            return res.status(hfResponse.status).json(data);
        }

        return res.status(200).json(data);

    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Server error while contacting translation service' });
    }
}
