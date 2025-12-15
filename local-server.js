/**
 * Local Development Server for Embedding API
 * 
 * Bu server local development için embedding API'yi sağlar.
 * Vercel CLI kullanmak istemiyorsanız bu server'ı kullanabilirsiniz.
 * 
 * Kullanım:
 * 1. npm install express cors dotenv @huggingface/inference
 * 2. node local-server.js
 * 3. Başka terminal'de: npm run dev
 */

const express = require('express');
const cors = require('cors');
const { HfInference } = require('@huggingface/inference');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ===========================
// /api/embedding (Hugging Face)
// ===========================
app.post('/api/embedding', async (req, res) => {
  try {
    const { text, model = 'intfloat/e5-base-v2' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res
        .status(400)
        .json({ error: 'Text parameter is required and must be a non-empty string' });
    }

    const apiKey =
      process.env.VITE_HUGGING_FACE_API_KEY || process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Hugging Face API key not found in environment variables' });
    }

    const hf = new HfInference(apiKey);
    const embedding = await hf.featureExtraction({
      model: model,
      inputs: text,
    });

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res
        .status(500)
        .json({ error: 'Invalid embedding response from Hugging Face API' });
    }

    res.json({ embedding });
  } catch (error) {
    console.error('Embedding API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// ===========================
// /api/rerank (OpenAI LLM)
// ===========================

app.post('/api/rerank', async (req, res) => {
  try {
    const { query, candidates } = req.body || {};

    if (!query || !Array.isArray(candidates) || candidates.length === 0) {
      return res
        .status(400)
        .json({ error: 'Invalid payload. Expected { query, candidates[] }' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'OPENAI_API_KEY not found in environment variables' });
    }

    const client = new OpenAI({ apiKey });

    const prompt = `
User scene (in Turkish, may contain noise): "${query}"

Candidates:
${candidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.title} (${c.year || 'N/A'}): ${(c.overview || '').slice(0, 220)}`
  )
  .join('\n')}

Return ONLY valid JSON with this exact shape:
{
  "order": [1, 3, 2],
  "confidences": [95, 80, 60]
}
- order is an array of 1-based indices into the candidates list (no duplicates)
- confidences is same length, each between 0 and 100 (higher = more confident)
- Do NOT add any extra keys or text.
`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a movie-matching assistant. You must respond with strict JSON only, no explanations.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Empty response from OpenAI' });
    }

    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      return res.status(500).json({ error: 'Invalid JSON from OpenAI' });
    }

    const rawOrder = Array.isArray(data.order) ? data.order : [];
    const rawConf = Array.isArray(data.confidences) ? data.confidences : [];

    const order = rawOrder
      .map((idx) => Number(idx))
      .filter(
        (idx) => Number.isFinite(idx) && idx >= 1 && idx <= candidates.length,
      );

    const confidences =
      rawConf.length === order.length
        ? rawConf.map((c) => {
            const v = Number(c);
            if (!Number.isFinite(v)) return 50;
            return Math.max(0, Math.min(100, v));
          })
        : order.map(() => 50);

    return res.json({ order, confidences });
  } catch (error) {
    console.error('OpenAI rerank error:', error);
    return res.status(500).json({
      error: 'Failed to call OpenAI for reranking',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`🚀 Local embedding server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure VITE_HUGGING_FACE_API_KEY is set in .env file`);
  console.log(`🤖 LLM rerank endpoint available at http://localhost:${PORT}/api/rerank`);
});
