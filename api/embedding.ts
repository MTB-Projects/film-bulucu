import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HfInference } from '@huggingface/inference';

/**
 * Vercel Serverless Function
 * Hugging Face Inference Providers API'ye proxy görevi görür
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  // OPTIONS request için CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
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
    
    // Inference Providers API için Inference Client SDK kullan
    const hf = new HfInference(apiKey);
    
    // Feature extraction için Inference Providers API kullan
    // HF Inference provider'ı kullan (feature extraction destekliyor)
    const embedding = await hf.featureExtraction({
      model: model,
      inputs: text,
    });
    
    // Response formatını kontrol et
    // Inference Client SDK array döndürür
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res.status(500).json({ error: 'Invalid embedding response from Hugging Face API' });
    }
    
    return res.status(200).json({ embedding });
    
  } catch (error) {
    console.error('Hugging Face API error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: (error as any).response?.data || (error as any).message
    });
  }
}
