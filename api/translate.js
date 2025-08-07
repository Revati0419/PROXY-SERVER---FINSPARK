// api/translate.js
import fetch from 'node-fetch';

const HUGGING_FACE_API_KEY = process.env.HF_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed.' });
  }

  const { text, targetLang } = req.body;

  const langCodeMap = {
    hi: 'hi_IN',
    mr: 'mr_IN',
    bn: 'bn_IN',
    gu: 'gu_IN'
  };

  const targetLangCode = langCodeMap[targetLang];
  if (!targetLangCode) {
    return res.status(400).json({ error: `Unsupported language '${targetLang}'` });
  }

  const payload = {
    inputs: text,
    parameters: {
      src_lang: "en_XX",
      tgt_lang: targetLangCode
    }
  };

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/facebook/mbart-large-50-many-to-many-mrt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data && data[0]?.translation_text) {
      return res.status(200).json([{ translation_text: data[0].translation_text }]);
    } else {
      return res.status(response.status).json(data);
    }
  } catch (error) {
    console.error("Translation proxy error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
