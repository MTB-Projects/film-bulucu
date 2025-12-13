const axios = require('axios');

/**
 * Netlify Serverless Function
 * Hugging Face Inference API'ye proxy görevi görür
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

  const { text } = body;

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
    const model = 'sentence-transformers/all-MiniLM-L6-v2';
    
    const requestHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Eğer API key varsa Authorization header ekle
    if (apiKey) {
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // Hugging Face Inference API endpoint (router API için farklı format gerekebilir)
    // Önce Inference API'yi deniyoruz (daha stabil)
    const response = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`,
      { inputs: text },
      { 
        headers: requestHeaders,
        timeout: 30000, // 30 saniye timeout
      }
    );
    
    // Response formatını kontrol et
    const embedding = response.data[0] || response.data;
    
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
    
    // Check if axios is available and error is axios error
    const isAxiosError = axios.isAxiosError && typeof axios.isAxiosError === 'function' && axios.isAxiosError(error);
    
    if (isAxiosError) {
      if (error.response) {
        // API'den hata yanıtı geldi
        return {
          statusCode: error.response.status,
          headers,
          body: JSON.stringify({ 
            error: `Hugging Face API error: ${error.response.statusText}`,
            details: error.response.data 
          }),
        };
      } else if (error.request) {
        // İstek gönderildi ama yanıt alınamadı
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ 
            error: 'Hugging Face API is not responding',
            message: 'The service may be temporarily unavailable. Please try again later.'
          }),
        };
      }
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
    };
  }
};
