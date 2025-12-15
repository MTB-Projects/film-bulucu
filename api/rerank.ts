import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

/**
 * Vercel Serverless Function
 * LLM destekli yeniden sıralama (re-ranking) için backend endpoint
 *
 * POST /api/rerank
 * Body: {
 *   query: string;
 *   candidates: { id: number; title: string; year: number; overview: string }[];
 * }
 * 
 * Response: {
 *   order: number[];        // 1-based index sıralaması (en iyi ilk)
 *   confidences: number[];  // Her aday için 0-100 arası güven skoru
 * }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, candidates } = req.body as {
    query?: string;
    candidates?: { id: number; title: string; year: number; overview?: string }[];
  };

  if (!query || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({
      error: 'Invalid payload. Expected { query: string, candidates: [...] }',
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not set on the server',
    });
  }

  const client = new OpenAI({ apiKey });

  const prompt = `You are an expert at guessing movies from vague scene descriptions.

User scene (in Turkish, may contain noise): "${query}"

Below is a list of candidate movies. Rank them from best match to worst match.

Candidates:
${candidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.title} (${c.year || 'N/A'}): ${
        (c.overview || '').slice(0, 220)
      }`
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

  try {
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

    let data: { order?: number[]; confidences?: number[] };
    try {
      data = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      return res.status(500).json({ error: 'Invalid JSON from OpenAI' });
    }

    if (!Array.isArray(data.order) || data.order.length === 0) {
      return res.status(200).json({ order: [], confidences: [] });
    }

    // Güvenlik: index ve confidence değerlerini normalize et
    const order = data.order
      .map((idx) => Number(idx))
      .filter((idx) => Number.isFinite(idx) && idx >= 1 && idx <= candidates.length);

    const confidences = Array.isArray(data.confidences)
      ? data.confidences.map((c) => {
          const v = Number(c);
          if (!Number.isFinite(v)) return 50;
          return Math.max(0, Math.min(100, v));
        })
      : order.map(() => 50);

    return res.status(200).json({ order, confidences });
  } catch (error) {
    console.error('OpenAI rerank error:', error);
    return res.status(500).json({
      error: 'Failed to call OpenAI for reranking',
      message: (error as any).message,
    });
  }
}
