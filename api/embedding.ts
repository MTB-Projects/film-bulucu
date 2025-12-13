import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

/**
 * Vercel Serverless Function
 * Hugging Face Inference API'ye proxy görevi görür
 * CORS sorununu çözer
 * 
 * POST /api/embedding
 * Body: { text: string }
 * Returns: { embedding: number[] } veya { error: string }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  // Text validation
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text parameter is required and must be a non-empty string' });
  }

  try {
    const apiKey = process.env.VITE_HUGGING_FACE_API_KEY || process.env.HUGGING_FACE_API_KEY;
    const model = 'sentence-transformers/all-MiniLM-L6-v2';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Eğer API key varsa Authorization header ekle
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await axios.post(
      `https://router.huggingface.co/pipeline/feature-extraction/${model}`,
      { inputs: text },
      { 
        headers,
        timeout: 30000, // 30 saniye timeout
      }
    );
    
    // Response formatını kontrol et
    const embedding = response.data[0] || response.data;
    
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res.status(500).json({ error: 'Invalid embedding response from Hugging Face API' });
    }
    
    return res.status(200).json({ embedding });
    
  } catch (error) {
    console.error('Hugging Face API error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // API'den hata yanıtı geldi
        return res.status(error.response.status).json({ 
          error: `Hugging Face API error: ${error.response.statusText}`,
          details: error.response.data 
        });
      } else if (error.request) {
        // İstek gönderildi ama yanıt alınamadı
        return res.status(503).json({ 
          error: 'Hugging Face API is not responding',
          message: 'The service may be temporarily unavailable. Please try again later.'
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
