import OpenAI from 'openai';
import axios from 'axios';
import {
  searchMovies,
  getPopularMovies,
  getMovieKeywords,
  getMovieDetails,
  getPosterUrl,
  getYearFromDate,
} from './tmdbService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SceneDescription {
  entities: string[];
  events: string[];
  environment: string[];
  themes: string[];
  time_hint?: string;
}

export interface MovieCandidate {
  id: number;
  title: string;
  overview: string;
  keywords: string[];
  vote_count: number;
  release_date: string;
}

export interface ScoredMovie {
  movie: MovieCandidate;
  embeddingScore: number;
  explanation?: string;
}

export interface FinalResult {
  id: number;
  title: string;
  year: number;
  description: string;
  matchScore: number;
  explanation: string;
  posterUrl: string;
  backdropUrl?: string;
  voteAverage?: number;
}

// ============================================================================
// STEP 1: SCENE UNDERSTANDING (LLM)
// ============================================================================

async function analyzeScene(query: string): Promise<SceneDescription> {
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  });

  const prompt = `Extract structured information from this movie scene description. Return ONLY valid JSON, no prose.

User query: "${query}"

Return JSON with:
{
  "entities": ["list", "of", "objects", "people", "things"],
  "events": ["list", "of", "actions", "events"],
  "environment": ["location", "setting"],
  "themes": ["genre", "mood", "topic"],
  "time_hint": "historical" | "modern" | "future" | "unspecified"
}

Rules:
- Extract only what is explicitly stated or strongly implied
- Do NOT guess movie names
- Use English terms
- Return valid JSON only`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a movie scene analyzer. Return only valid JSON, no explanations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty LLM response');
    }

    const parsed = JSON.parse(content) as SceneDescription;
    
    // Validate structure
    if (!Array.isArray(parsed.entities) || !Array.isArray(parsed.events)) {
      throw new Error('Invalid scene description structure');
    }

    return {
      entities: parsed.entities || [],
      events: parsed.events || [],
      environment: parsed.environment || [],
      themes: parsed.themes || [],
      time_hint: parsed.time_hint || 'unspecified',
    };
  } catch (error) {
    console.error('[Pipeline] Scene analysis failed:', error);
    // Fallback: extract basic terms
    const queryLower = query.toLowerCase();
    return {
      entities: extractBasicTerms(queryLower, ['ship', 'gemi', 'iceberg', 'buzdağı', 'clown', 'palyanço']),
      events: extractBasicTerms(queryLower, ['sink', 'batma', 'collision', 'çarpışma', 'hit', 'çarptı']),
      environment: extractBasicTerms(queryLower, ['ocean', 'deniz', 'water', 'su']),
      themes: [],
      time_hint: 'unspecified',
    };
  }
}

function extractBasicTerms(text: string, terms: string[]): string[] {
  return terms.filter(term => text.includes(term));
}

// ============================================================================
// STEP 2: QUERY CANONICALIZATION
// ============================================================================

function buildCanonicalQuery(scene: SceneDescription): string {
  const allTerms = [
    ...scene.entities,
    ...scene.events,
    ...scene.environment,
    ...scene.themes,
  ];
  
  return allTerms
    .filter(term => term.length > 2)
    .map(term => term.toLowerCase())
    .filter((term, index, self) => self.indexOf(term) === index)
    .join(' ');
}

// ============================================================================
// STEP 3: CANDIDATE RETRIEVAL (TMDB)
// ============================================================================

async function retrieveCandidates(
  scene: SceneDescription
): Promise<MovieCandidate[]> {
  const candidates = new Map<number, MovieCandidate>();
  const minVoteCount = 300;

  // Search by entities and events
  const searchTerms = [...scene.entities, ...scene.events].slice(0, 3);
  
  for (const term of searchTerms) {
    try {
      const results = await searchMovies(term, 1);
      for (const movie of results.results) {
        if (movie.vote_count >= minVoteCount && !candidates.has(movie.id)) {
          const keywords = await getMovieKeywords(movie.id).catch(() => []);
          
          // Hard filter: keywords must intersect with entities OR events
          const movieKeywordsLower = keywords.map(k => k.toLowerCase());
          const sceneTermsLower = [
            ...scene.entities,
            ...scene.events,
          ].map(t => t.toLowerCase());
          
          const hasIntersection = movieKeywordsLower.some(kw =>
            sceneTermsLower.some(st => kw.includes(st) || st.includes(kw))
          );

          if (hasIntersection || keywords.length === 0) {
            candidates.set(movie.id, {
              id: movie.id,
              title: movie.title,
              overview: movie.overview || '',
              keywords,
              vote_count: movie.vote_count,
              release_date: movie.release_date,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`[Pipeline] TMDB search failed for "${term}":`, error);
    }
  }

  // Fallback: popular movies if we have < 10 candidates
  if (candidates.size < 10) {
    try {
      const popular = await getPopularMovies(1);
      for (const movie of popular.results) {
        if (movie.vote_count >= minVoteCount && !candidates.has(movie.id) && candidates.size < 30) {
          const keywords = await getMovieKeywords(movie.id).catch(() => []);
          candidates.set(movie.id, {
            id: movie.id,
            title: movie.title,
            overview: movie.overview || '',
            keywords,
            vote_count: movie.vote_count,
            release_date: movie.release_date,
          });
        }
      }
    } catch (error) {
      console.warn('[Pipeline] Popular movies fallback failed:', error);
    }
  }

  return Array.from(candidates.values()).slice(0, 30);
}

// ============================================================================
// STEP 4: EMBEDDING-BASED RETRIEVAL
// ============================================================================

async function getEmbedding(text: string, model: string = 'intfloat/e5-base-v2'): Promise<number[]> {
  const apiUrl = getEmbeddingApiUrl();
  
  if (!apiUrl) {
    throw new Error('Embedding API not configured');
  }

  try {
    const response = await axios.post(
      apiUrl,
      { text, model },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    if (response.data.embedding && Array.isArray(response.data.embedding)) {
      return response.data.embedding;
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error('Invalid embedding response');
  } catch (error) {
    console.error('[Pipeline] Embedding failed:', error);
    throw error;
  }
}

function getEmbeddingApiUrl(): string | null {
  const customUrl = import.meta.env.VITE_EMBEDDING_API_URL;
  if (customUrl) return customUrl;

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app')) return '/api/embedding';
    if (hostname.includes('netlify.app')) return '/.netlify/functions/embedding';
  }

  if (import.meta.env.DEV) {
    return '/api/embedding';
  }

  return null;
}

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
  return denominator === 0 ? 0 : dotProduct / denominator;
}

async function embedAndScore(
  canonicalQuery: string,
  candidates: MovieCandidate[]
): Promise<ScoredMovie[]> {
  if (candidates.length === 0) {
    return [];
  }

  // Embed query
  const queryEmbedding = await getEmbedding(canonicalQuery);

  // Embed all movie overviews and keywords
  const scored: ScoredMovie[] = [];

  for (const candidate of candidates) {
    try {
      // Overview embedding
      const overviewEmbedding = candidate.overview
        ? await getEmbedding(candidate.overview)
        : null;

      // Keyword embeddings (individual)
      const keywordEmbeddings: number[][] = [];
      for (const keyword of candidate.keywords.slice(0, 10)) {
        try {
          const kwEmbedding = await getEmbedding(keyword);
          keywordEmbeddings.push(kwEmbedding);
        } catch (error) {
          // Skip failed keyword embeddings
        }
      }

      // Calculate scores
      let maxKeywordSimilarity = 0;
      for (const kwEmbedding of keywordEmbeddings) {
        const similarity = cosineSimilarity(queryEmbedding, kwEmbedding);
        maxKeywordSimilarity = Math.max(maxKeywordSimilarity, similarity);
      }

      const overviewSimilarity = overviewEmbedding
        ? cosineSimilarity(queryEmbedding, overviewEmbedding)
        : 0;

      // Final score: max(keyword) * 0.6 + overview * 0.4
      const embeddingScore = maxKeywordSimilarity * 0.6 + overviewSimilarity * 0.4;

      scored.push({
        movie: candidate,
        embeddingScore,
      });
    } catch (error) {
      console.warn(`[Pipeline] Failed to score movie ${candidate.id}:`, error);
    }
  }

  return scored.sort((a, b) => b.embeddingScore - a.embeddingScore);
}

// ============================================================================
// STEP 5: LLM RE-RANKING (Top 5 Only)
// ============================================================================

async function rerankWithLLM(
  originalQuery: string,
  topCandidates: ScoredMovie[]
): Promise<ScoredMovie[]> {
  if (topCandidates.length === 0) {
    return [];
  }

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  });

  const candidatesText = topCandidates
    .map(
      (c, idx) =>
        `${idx + 1}. ${c.movie.title} (${c.movie.release_date?.substring(0, 4) || 'N/A'}): ${c.movie.overview.substring(0, 200)}`
    )
    .join('\n');

  const prompt = `Given this remembered scene and movie candidates, choose the best match.

Remembered scene: "${originalQuery}"

Candidates:
${candidatesText}

Return JSON:
{
  "best_match_index": 0,
  "confidence": 85,
  "explanation": "Brief one-sentence explanation"
}

Index is 1-based (1 = first candidate). Confidence is 0-100.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a movie matching expert. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return topCandidates;
    }

    const result = JSON.parse(content) as {
      best_match_index: number;
      confidence: number;
      explanation: string;
    };

    const bestIndex = Math.max(0, Math.min(result.best_match_index - 1, topCandidates.length - 1));
    const bestCandidate = topCandidates[bestIndex];

    // Reorder: best match first
    const reranked = [...topCandidates];
    reranked[bestIndex] = { ...bestCandidate, embeddingScore: result.confidence / 100, explanation: result.explanation };
    
    // Move best to front
    const best = reranked.splice(bestIndex, 1)[0];
    reranked.unshift(best);

    return reranked.slice(0, 5);
  } catch (error) {
    console.error('[Pipeline] Re-ranking failed:', error);
    return topCandidates.slice(0, 5);
  }
}

// ============================================================================
// STEP 6: FINAL RESPONSE FORMATTING
// ============================================================================

async function formatFinalResult(scored: ScoredMovie): Promise<FinalResult> {
  const details = await getMovieDetails(scored.movie.id).catch(() => null);

  return {
    id: scored.movie.id,
    title: scored.movie.title,
    year: getYearFromDate(scored.movie.release_date),
    description: scored.movie.overview || 'No description available',
    matchScore: Math.round(scored.embeddingScore * 100),
    explanation: scored.explanation || 'Matched based on scene description',
    posterUrl: getPosterUrl(details?.poster_path || null),
    backdropUrl: details?.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
      : undefined,
    voteAverage: details?.vote_average,
  };
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

export async function searchFilmsByScene(query: string): Promise<FinalResult[]> {
  try {
    // STEP 1: Scene Understanding
    console.log('[Pipeline] Step 1: Analyzing scene...');
    const scene = await analyzeScene(query);
    console.log('[Pipeline] Scene:', scene);

    // STEP 2: Query Canonicalization
    console.log('[Pipeline] Step 2: Building canonical query...');
    const canonicalQuery = buildCanonicalQuery(scene);
    console.log('[Pipeline] Canonical query:', canonicalQuery);

    // STEP 3: Candidate Retrieval
    console.log('[Pipeline] Step 3: Retrieving candidates...');
    const candidates = await retrieveCandidates(scene);
    console.log(`[Pipeline] Found ${candidates.length} candidates`);

    if (candidates.length === 0) {
      return [];
    }

    // STEP 4: Embedding-Based Retrieval
    console.log('[Pipeline] Step 4: Embedding and scoring...');
    const scored = await embedAndScore(canonicalQuery, candidates);
    const top5 = scored.slice(0, 5);
    console.log(`[Pipeline] Top 5 scores:`, top5.map(s => `${s.movie.title}: ${s.embeddingScore.toFixed(3)}`));

    // STEP 5: LLM Re-ranking
    console.log('[Pipeline] Step 5: Re-ranking with LLM...');
    const reranked = await rerankWithLLM(query, top5);

    // STEP 6: Format Results
    console.log('[Pipeline] Step 6: Formatting results...');
    const results = await Promise.all(reranked.map(formatFinalResult));

    return results;
  } catch (error) {
    console.error('[Pipeline] Pipeline failed:', error);
    throw error;
  }
}
