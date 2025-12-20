import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

interface LLMResult {
  title: string;
  year?: number;
  description: string;
  main_characters: string[];
  reason: string;
  match_score?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, lang } = (req.body || {}) as { query?: string; lang?: string };
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Invalid payload. Expected { query: string, lang?: "tr"|"en" }' });
  }
  const language = lang === 'en' ? 'en' : 'tr';

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server' });
  }

  const client = new OpenAI({ apiKey });

  const prompt = `You are a movie expert. Given a vague scene description in ${language === 'tr' ? 'Turkish' : 'English'}, guess the top 5 most likely movies.
Return strict JSON with this shape:
{
  "results": [
    {
      "title": "Movie Title",
      "year": 1979,
      "description": "One-sentence summary (max 25 words)",
      "main_characters": ["Name1", "Name2"],
      "reason": "Why this matches the scene (max 20 words)",
      "match_score": 0.0
    }
  ]
}
- Always return exactly 5 results ordered best to worst.
- All text fields (description, main_characters, reason) must be written in ${language === 'tr' ? 'Turkish' : 'English'}.
- Keep original/official movie title; do not translate titles.
- Use plausible titles/years; if unsure about year, omit it.
- Keep text concise; avoid spoilers; no extra commentary outside JSON.
- If a field is unknown, leave it out rather than inventing details.

Scene: "${query}"`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a movie-matching assistant. Respond with strict JSON only. Do not add explanations.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Empty response from OpenAI' });
    }

    let data: { results?: LLMResult[] };
    try {
      data = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON from OpenAI', raw: content });
    }

    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return res.status(200).json({ results: [] });
    }

    const normalized = data.results.slice(0, 5).map((r) => ({
      title: r.title || 'Unknown',
      year: Number.isFinite(r.year) ? Number(r.year) : undefined,
      description: r.description || '',
      main_characters: Array.isArray(r.main_characters) ? r.main_characters.slice(0, 5) : [],
      reason: r.reason || 'Scene similarity',
      match_score: Number.isFinite(r.match_score) ? Number(r.match_score) : undefined,
    }));

    return res.status(200).json({ results: normalized });
  } catch (error) {
    console.error('OpenAI llm-search error:', error);
    return res.status(500).json({
      error: 'Failed to call OpenAI for llm-search',
      message: (error as any).message,
    });
  }
}
