const { HfInference } = require('@huggingface/inference');

/**
 * Netlify Serverless Function
 * Hugging Face Inference Providers API'ye proxy görevi görür
 * CORS sorununu çözer
 * 
 * POST /.netlify/functions/embedding
 * Body: { text: string }
 * Returns: { embedding: number[] } veya { error: string }
 */
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS request için CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Sadece POST isteklerine izin ver
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  const { text, model } = body;

  // Text validation
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Text parameter is required and must be a non-empty string' }),
    };
  }

  try {
    const apiKey = process.env.VITE_HUGGING_FACE_API_KEY || process.env.HUGGING_FACE_API_KEY;
    // Support model parameter for better embeddings (default to e5-base-v2)
    const requestedModel = body.model || 'intfloat/e5-base-v2';
    const model = requestedModel; // Use requested model or fallback to e5
    
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Invalid embedding response from Hugging Face API' }),
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ embedding }),
    };
    
  } catch (error) {
    console.error('Hugging Face API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error.response?.data || error.message
      }),
    };
  }
};
