import axios from 'axios';
import { 
  searchMovies, 
  getPopularMovies,
  getPosterUrl,
  getYearFromDate,
  TMDBMovie 
} from './tmdbService';

export interface FilmSearchResult {
  id: number;
  title: string;
  year: number;
  description: string;
  matchScore: number;
  scenes: string[];
  posterUrl: string;
  backdropUrl?: string;
  voteAverage?: number;
}

/**
 * Serverless function endpoint'ini belirler
 * Environment variable'dan veya otomatik tespit ile
 */
function getEmbeddingApiUrl(): string | null {
  // Manuel olarak belirtilmiş URL varsa onu kullan
  const customUrl = import.meta.env.VITE_EMBEDDING_API_URL;
  if (customUrl) {
    return customUrl;
  }
  
  // Vercel production ortamında
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
      return '/api/embedding';
    }
    // Netlify production ortamında
    if (hostname.includes('netlify.app') || hostname.includes('netlify.com')) {
      return '/.netlify/functions/embedding';
    }
  }
  
  // Development ortamında - Vite proxy kullanılabilir veya direkt serverless function
  // Local development için Vite proxy kullanılması önerilir
  if (import.meta.env.DEV) {
    // Vite proxy kullanılıyorsa
    return '/api/embedding';
  }
  
  return null;
}

/**
 * Serverless function üzerinden text embedding oluşturur
 * CORS sorununu çözer
 */
async function getTextEmbedding(text: string): Promise<number[]> {
  const apiUrl = getEmbeddingApiUrl();
  
  // Eğer serverless function URL'i yoksa, direkt Hugging Face API'yi dene (fallback)
  if (!apiUrl) {
    console.warn('Embedding API URL not configured, attempting direct Hugging Face API call (may fail due to CORS)');
    try {
      const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
      const model = 'sentence-transformers/all-MiniLM-L6-v2';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await axios.post(
        `https://router.huggingface.co/pipeline/feature-extraction/${model}`,
        { inputs: text },
        { headers, timeout: 30000 }
      );
      
      return response.data[0] || response.data;
    } catch (error) {
      console.warn('Direct Hugging Face API call failed (likely CORS), falling back to simple matching:', error);
      return [];
    }
  }
  
  // Serverless function üzerinden istek at
  try {
    const response = await axios.post(
      apiUrl,
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 saniye timeout
      }
    );
    
    if (response.data.embedding && Array.isArray(response.data.embedding)) {
      return response.data.embedding;
    }
    
    // Eski format desteği (direkt array dönüyorsa)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('Unexpected response format from embedding API:', response.data);
    return [];
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // API'den hata yanıtı geldi
        console.warn('Embedding API error:', error.response.status, error.response.data);
      } else if (error.request) {
        // İstek gönderildi ama yanıt alınamadı
        console.warn('Embedding API is not responding. Make sure serverless function is deployed.');
      } else {
        console.warn('Error setting up embedding API request:', error.message);
      }
    } else {
      console.warn('Unexpected error calling embedding API:', error);
    }
    
    // Fallback: Basit eşleştirme kullanılacak
    console.warn('Falling back to simple text matching');
    return [];
  }
}

/**
 * İki embedding arasındaki cosine similarity hesaplar
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

/**
 * Basit text matching skoru hesaplar (fallback için)
 */
function calculateSimpleMatchScore(query: string, movie: TMDBMovie): number {
  const queryLower = query.toLowerCase();
  const titleLower = movie.title.toLowerCase();
  const overviewLower = (movie.overview || '').toLowerCase();
  
  let score = 0;
  
  // Başlık eşleşmesi (yüksek ağırlık)
  if (titleLower.includes(queryLower)) {
    score += 50;
  }
  
  // Başlık kelimelerinin eşleşmesi
  const queryWords = queryLower.split(/\s+/);
  const titleWords = titleLower.split(/\s+/);
  const matchingWords = queryWords.filter(word => 
    titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
  );
  score += (matchingWords.length / queryWords.length) * 30;
  
  // Açıklama eşleşmesi
  if (overviewLower.includes(queryLower)) {
    score += 20;
  }
  
  // Açıklama kelimelerinin eşleşmesi
  const overviewWords = overviewLower.split(/\s+/);
  const overviewMatches = queryWords.filter(word => 
    overviewWords.some(overviewWord => overviewWord.includes(word) || word.includes(overviewWord))
  );
  score += (overviewMatches.length / queryWords.length) * 10;
  
  return Math.min(100, Math.round(score));
}

/**
 * TMDB film verisini FilmSearchResult formatına dönüştürür
 */
function convertTMDBToResult(movie: TMDBMovie, matchScore: number, query: string): FilmSearchResult {
  // Eşleşen sahneleri/detayları çıkar (basit bir yaklaşım)
  const scenes: string[] = [];
  const queryLower = query.toLowerCase();
  const overview = movie.overview || '';
  
  // Açıklamadan ilgili cümleleri bul
  const sentences = overview.split(/[.!?]+/).filter(s => s.trim().length > 0);
  sentences.forEach(sentence => {
    const sentenceLower = sentence.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
    const matchingWords = queryWords.filter(word => sentenceLower.includes(word));
    if (matchingWords.length > 0) {
      scenes.push(sentence.trim());
    }
  });
  
  // Eğer sahne bulunamadıysa, açıklamanın ilk cümlesini ekle
  if (scenes.length === 0 && overview) {
    scenes.push(overview.substring(0, 150) + (overview.length > 150 ? '...' : ''));
  }
  
  return {
    id: movie.id,
    title: movie.title,
    year: getYearFromDate(movie.release_date),
    description: overview || 'Açıklama bulunamadı.',
    matchScore: matchScore,
    scenes: scenes.slice(0, 3), // En fazla 3 sahne
    posterUrl: getPosterUrl(movie.poster_path),
    backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined,
    voteAverage: movie.vote_average,
  };
}

/**
 * Film açıklamasına göre arama yapar ve eşleşen filmleri döndürür
 * @param query Kullanıcının girdiği film açıklaması
 * @returns Bulunan filmlerin listesi
 */
export async function searchFilmsByDescription(query: string): Promise<FilmSearchResult[]> {
  try {
    // 1. Önce TMDB'de direkt arama yap
    const searchResults = await searchMovies(query, 1);
    
    if (searchResults.results.length === 0) {
      // Eğer direkt arama sonuç vermezse, popüler filmlerden semantic matching yap
      const popularMovies = await getPopularMovies(1);
      return await performSemanticMatching(query, popularMovies.results);
    }
    
    // 2. Semantic matching ile skorları hesapla
    const resultsWithScores = await performSemanticMatching(query, searchResults.results);
    
    // 3. Skora göre sırala ve en iyi sonuçları döndür
    return resultsWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // En fazla 10 sonuç
      
  } catch (error) {
    console.error('Film arama hatası:', error);
    
    // Fallback: Basit text matching ile popüler filmlerden arama
    try {
      const popularMovies = await getPopularMovies(1);
      const fallbackResults = popularMovies.results
        .map(movie => ({
          movie,
          score: calculateSimpleMatchScore(query, movie),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => convertTMDBToResult(item.movie, item.score, query));
      
      return fallbackResults.length > 0 
        ? fallbackResults 
        : []; // Eğer hiç sonuç yoksa boş array döndür
    } catch (fallbackError) {
      console.error('Fallback arama hatası:', fallbackError);
      throw new Error('Film arama sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  }
}

/**
 * Semantic matching ile film skorlarını hesaplar
 */
async function performSemanticMatching(
  query: string, 
  movies: TMDBMovie[]
): Promise<FilmSearchResult[]> {
  try {
    // Query embedding'i al
    const queryEmbedding = await getTextEmbedding(query);
    
    // Eğer embedding alınamadıysa, basit matching kullan
    if (queryEmbedding.length === 0) {
      return movies
        .map(movie => ({
          movie,
          score: calculateSimpleMatchScore(query, movie),
        }))
        .filter(item => item.score > 0)
        .map(item => convertTMDBToResult(item.movie, item.score, query));
    }
    
    // Her film için embedding ve similarity hesapla
    const results: Array<{ movie: TMDBMovie; score: number }> = [];
    
    for (const movie of movies.slice(0, 20)) { // İlk 20 filmi kontrol et (rate limit için)
      const movieText = `${movie.title} ${movie.overview || ''}`;
      const movieEmbedding = await getTextEmbedding(movieText);
      
      if (movieEmbedding.length > 0) {
        const similarity = cosineSimilarity(queryEmbedding, movieEmbedding);
        const score = Math.round(similarity * 100);
        if (score > 0) {
          results.push({ movie, score });
        }
      } else {
        // Embedding alınamazsa basit matching kullan
        const simpleScore = calculateSimpleMatchScore(query, movie);
        if (simpleScore > 0) {
          results.push({ movie, score: simpleScore });
        }
      }
      
      // Rate limiting için küçük bir gecikme
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results.map(item => convertTMDBToResult(item.movie, item.score, query));
    
  } catch (error) {
    console.error('Semantic matching hatası:', error);
    // Hata durumunda basit matching'e dön
    return movies
      .map(movie => ({
        movie,
        score: calculateSimpleMatchScore(query, movie),
      }))
      .filter(item => item.score > 0)
      .map(item => convertTMDBToResult(item.movie, item.score, query));
  }
}
