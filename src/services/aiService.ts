import axios from 'axios';
import { 
  searchMovies, 
  getPopularMovies,
  getPosterUrl,
  getYearFromDate,
  getMovieKeywords,
  getMovieDetails,
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
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`,
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
 * Query'nin scene-based olup olmadığını tespit eder
 * Scene-based query'ler genellikle eylem fiilleri, olaylar ve detaylar içerir
 */
function isSceneBasedQuery(query: string): boolean {
  const sceneIndicators = [
    'vardı', 'vardi', 'var', 'oldu', 'olduğu', 'yaptı', 'yapti', 'etti', 'ettiği',
    'gitti', 'geldi', 'düştü', 'düşti', 'battı', 'batti', 'çıktı', 'çıkti',
    'sahne', 'sahnede', 'sahnede', 'an', 'anda', 'sırada', 'sırasında',
    'hit', 'hits', 'sink', 'sinks', 'sinking', 'sank', 'crash', 'crashes',
    'explode', 'explodes', 'fall', 'falls', 'fell', 'die', 'dies', 'died',
    'kill', 'kills', 'killed', 'scene', 'moment', 'when', 'where'
  ];
  
  const queryLower = query.toLowerCase();
  return sceneIndicators.some(indicator => queryLower.includes(indicator));
}

/**
 * Query'yi genişletir - ilgili anahtar kelimeler ekler
 * Deterministic ve lightweight yaklaşım
 */
function expandQuery(query: string): string {
  const queryLower = query.toLowerCase();
  const expandedTerms: string[] = [];
  
  // Deterministic keyword mapping
  const keywordMap: Record<string, string[]> = {
    'ship': ['ocean', 'water', 'sea', 'vessel', 'sinking', 'disaster'],
    'gemi': ['deniz', 'su', 'okyanus', 'batma', 'felaket'],
    'iceberg': ['ice', 'cold', 'titanic', 'collision'],
    'buzdağı': ['buz', 'soğuk', 'titanik', 'çarpışma'],
    'sink': ['water', 'ocean', 'drown', 'submerge'],
    'batma': ['su', 'deniz', 'boğulma'],
    'palyanço': ['clown', 'horror', 'scary', 'fear', 'korku'],
    'balon': ['balloon', 'red', 'kırmızı', 'float'],
    'korku': ['horror', 'scary', 'fear', 'terror'],
    'horror': ['scary', 'fear', 'terror', 'monster']
  };
  
  // Query'deki kelimeleri kontrol et ve ilgili terimleri ekle
  Object.keys(keywordMap).forEach(key => {
    if (queryLower.includes(key)) {
      expandedTerms.push(...keywordMap[key]);
    }
  });
  
  // Tekrarları kaldır ve orijinal query'ye ekle
  const uniqueTerms = Array.from(new Set(expandedTerms));
  return uniqueTerms.length > 0 
    ? `${query} ${uniqueTerms.join(' ')}`
    : query;
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
    // 1. Önce TMDB'de anahtar kelimelerle arama yap (daha iyi sonuç için)
    // Query'den önemli kelimeleri çıkar (3+ harfli kelimeler)
    const queryWords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= 3)
      .filter(word => !['bir', 'var', 'vardı', 'film', 'filmi', 'filmdir', 'olan', 'ile', 'için'].includes(word));
    
    // Anahtar kelimelerle TMDB'de arama yap
    let allMovies: TMDBMovie[] = [];
    
    // Her anahtar kelime için arama yap ve sonuçları birleştir
    for (const keyword of queryWords.slice(0, 3)) { // En fazla 3 anahtar kelime
      try {
        const searchResults = await searchMovies(keyword, 1);
        allMovies = [...allMovies, ...searchResults.results];
      } catch (err) {
        // Bir kelime için arama başarısız olursa devam et
        console.warn(`TMDB search failed for keyword "${keyword}":`, err);
      }
    }
    
    // 2. Popüler filmlerden de film ekle (daha geniş bir set için)
    // Birden fazla sayfa çek (toplam 100+ film için)
    const popularPages = await Promise.all([
      getPopularMovies(1),
      getPopularMovies(2),
      getPopularMovies(3),
      getPopularMovies(4),
      getPopularMovies(5),
    ]);
    
    const popularMovies = popularPages.flatMap(page => page.results);
    
    // Tüm filmleri birleştir ve tekrarları kaldır
    const uniqueMovies = new Map<number, TMDBMovie>();
    [...allMovies, ...popularMovies].forEach(movie => {
      if (!uniqueMovies.has(movie.id)) {
        uniqueMovies.set(movie.id, movie);
      }
    });
    
    const moviesToSearch = Array.from(uniqueMovies.values());
    
    // 3. Semantic matching ile skorları hesapla
    const resultsWithScores = await performSemanticMatching(query, moviesToSearch);
    
    // 4. Skora göre sırala ve en iyi sonuçları döndür
    // Similarity threshold (0.65 = 65%) zaten performSemanticMatching içinde uygulanıyor
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
 * Movie metadata interface for caching
 */
interface MovieMetadata {
  keywords: string[];
  tagline: string | null;
}

/**
 * Batch fetch movie metadata (keywords and tagline) in parallel
 */
async function fetchMovieMetadataBatch(movieIds: number[]): Promise<Map<number, MovieMetadata>> {
  const metadataMap = new Map<number, MovieMetadata>();
  
  // Fetch all keywords and details in parallel
  const promises = movieIds.map(async (id) => {
    try {
      const [keywords, details] = await Promise.all([
        getMovieKeywords(id).catch(() => [] as string[]),
        getMovieDetails(id).catch(() => null)
      ]);
      
      return {
        id,
        metadata: {
          keywords,
          tagline: details?.tagline || null
        }
      };
    } catch (error) {
      console.warn(`Failed to fetch metadata for movie ${id}:`, error);
      return {
        id,
        metadata: {
          keywords: [],
          tagline: null
        }
      };
    }
  });
  
  const results = await Promise.all(promises);
  results.forEach(({ id, metadata }) => {
    metadataMap.set(id, metadata);
  });
  
  return metadataMap;
}

/**
 * Batch embed multiple texts to reduce API calls
 */
async function batchEmbedTexts(texts: string[]): Promise<Map<string, number[]>> {
  const embeddingMap = new Map<string, number[]>();
  
  // Process in smaller batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const promises = batch.map(async (text) => {
      try {
        const embedding = await getTextEmbedding(text);
        return { text, embedding };
      } catch (error) {
        console.warn(`Failed to embed text:`, error);
        return { text, embedding: [] as number[] };
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ text, embedding }) => {
      if (embedding.length > 0) {
        embeddingMap.set(text, embedding);
      }
    });
    
    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddingMap;
}

/**
 * Weighted semantic similarity hesaplar
 * Optimized: uses pre-fetched metadata and batched embeddings
 */
function calculateWeightedSimilarity(
  queryEmbedding: number[],
  movie: TMDBMovie,
  metadata: MovieMetadata,
  embeddings: Map<string, number[]>,
  isSceneBased: boolean
): number {
  const weights = isSceneBased
    ? { overview: 0.5, keywords: 0.3, tagline: 0.15, title: 0.05 }
    : { overview: 0.4, keywords: 0.3, tagline: 0.2, title: 0.1 };
  
  let weightedScore = 0;
  let totalWeight = 0;
  
  // Overview/plot summary
  if (movie.overview) {
    const overviewEmbedding = embeddings.get(movie.overview);
    if (overviewEmbedding && overviewEmbedding.length > 0) {
      const similarity = cosineSimilarity(queryEmbedding, overviewEmbedding);
      weightedScore += similarity * weights.overview;
      totalWeight += weights.overview;
    }
  }
  
  // Keywords
  if (metadata.keywords.length > 0) {
    const keywordsText = metadata.keywords.join(' ');
    const keywordsEmbedding = embeddings.get(keywordsText);
    if (keywordsEmbedding && keywordsEmbedding.length > 0) {
      const similarity = cosineSimilarity(queryEmbedding, keywordsEmbedding);
      weightedScore += similarity * weights.keywords;
      totalWeight += weights.keywords;
    }
  }
  
  // Tagline
  if (metadata.tagline) {
    const taglineEmbedding = embeddings.get(metadata.tagline);
    if (taglineEmbedding && taglineEmbedding.length > 0) {
      const similarity = cosineSimilarity(queryEmbedding, taglineEmbedding);
      weightedScore += similarity * weights.tagline;
      totalWeight += weights.tagline;
    }
  }
  
  // Title
  if (movie.title) {
    const titleEmbedding = embeddings.get(movie.title);
    if (titleEmbedding && titleEmbedding.length > 0) {
      const similarity = cosineSimilarity(queryEmbedding, titleEmbedding);
      weightedScore += similarity * weights.title;
      totalWeight += weights.title;
    }
  }
  
  // Normalize by total weight used
  // If no embeddings found, return 0 (will be filtered out)
  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Semantic matching ile film skorlarını hesaplar
 * Weighted similarity ve scene intent detection kullanır
 */
async function performSemanticMatching(
  query: string, 
  movies: TMDBMovie[]
): Promise<FilmSearchResult[]> {
  try {
    // Scene intent detection
    const isSceneBased = isSceneBasedQuery(query);
    
    // Query expansion
    const expandedQuery = expandQuery(query);
    
    // Query embedding'i al (expanded query ile)
    const queryEmbedding = await getTextEmbedding(expandedQuery);
    
    // Eğer embedding alınamadıysa, basit matching kullan
    if (queryEmbedding.length === 0) {
      return movies
        .map(movie => ({
          movie,
          score: calculateSimpleMatchScore(query, movie),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => convertTMDBToResult(item.movie, item.score, query));
    }
    
    // Pre-filtering: basit matching ile ilk filtreleme
    // Reduced to 20 movies to minimize API calls
    const preFiltered = movies
      .map(movie => ({
        movie,
        simpleScore: calculateSimpleMatchScore(query, movie),
      }))
      .filter(item => item.simpleScore > 5)
      .sort((a, b) => b.simpleScore - a.simpleScore)
      .slice(0, 20);
    
    const moviesToCheck = preFiltered.length > 0 
      ? preFiltered.map(item => item.movie)
      : movies.slice(0, 20);
    
    if (moviesToCheck.length === 0) {
      return [];
    }
    
    // Batch fetch all movie metadata upfront (parallel)
    const movieIds = moviesToCheck.map(m => m.id);
    const metadataMap = await fetchMovieMetadataBatch(movieIds);
    
    // Collect all unique texts that need embedding
    const textsToEmbed = new Set<string>();
    moviesToCheck.forEach(movie => {
      if (movie.overview) textsToEmbed.add(movie.overview);
      if (movie.title) textsToEmbed.add(movie.title);
      
      const metadata = metadataMap.get(movie.id);
      if (metadata) {
        if (metadata.keywords.length > 0) {
          textsToEmbed.add(metadata.keywords.join(' '));
        }
        if (metadata.tagline) {
          textsToEmbed.add(metadata.tagline);
        }
      }
    });
    
    // Batch embed all texts
    const embeddings = await batchEmbedTexts(Array.from(textsToEmbed));
    
    // Calculate weighted similarity for each movie
    const results: Array<{ movie: TMDBMovie; score: number }> = [];
    
    console.log(`[Search] Processing ${moviesToCheck.length} movies, ${textsToEmbed.size} unique texts to embed`);
    
    for (const movie of moviesToCheck) {
      const metadata = metadataMap.get(movie.id) || { keywords: [], tagline: null };
      const weightedScore = calculateWeightedSimilarity(
        queryEmbedding,
        movie,
        metadata,
        embeddings,
        isSceneBased
      );
      
      // Debug: log scores for troubleshooting
      if (weightedScore > 0.3) {
        console.log(`[Search] ${movie.title}: score=${weightedScore.toFixed(3)} (threshold: 0.45)`);
      }
      
      // Similarity threshold: 0.45 (45%) - lowered for better recall
      // Still filters out very irrelevant results while allowing good matches
      if (weightedScore >= 0.45) {
        const score = Math.round(weightedScore * 100);
        results.push({ movie, score });
      }
    }
    
    console.log(`[Search] Found ${results.length} results above threshold`);
    
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
      .sort((a, b) => b.score - a.score)
      .map(item => convertTMDBToResult(item.movie, item.score, query));
  }
}
