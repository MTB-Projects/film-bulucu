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
// STEP 1: SCENE UNDERSTANDING (RULE-BASED, HELPER ONLY)
// ============================================================================

function analyzeScene(query: string): SceneDescription {
  const q = query.toLowerCase();

  const entities: string[] = [];
  const events: string[] = [];
  const environment: string[] = [];
  const themes: string[] = [];

  // Titanic tipi sinyaller
  if (q.includes('gemi') || q.includes('ship')) entities.push('ship');
  if (q.includes('buzdağı') || q.includes('iceberg')) entities.push('iceberg');
  if (q.includes('battı') || q.includes('batma') || q.includes('batıyor') || q.includes('sink')) events.push('sinking');
  if (q.includes('çarptı') || q.includes('çarpışma') || q.includes('çarpıyor') || q.includes('collision') || q.includes('hit'))
    events.push('collision');
  if (q.includes('deniz') || q.includes('okyanus') || q.includes('ocean') || q.includes('sea') || q.includes('water') || q.includes('su'))
    environment.push('ocean');
  if (q.includes('buz') || q.includes('ice') || q.includes('soğuk') || q.includes('cold')) environment.push('cold');
  if (q.includes('aşk') || q.includes('romantik') || q.includes('romance') || q.includes('love')) themes.push('romance');

  // It / palyaço
  if (q.includes('palyanço') || q.includes('palyaço') || q.includes('clown')) entities.push('clown');
  if (q.includes('balon') || q.includes('balloon')) entities.push('balloon');
  if (q.includes('korku') || q.includes('korkunç') || q.includes('horror') || q.includes('scary')) themes.push('horror');

  // Matrix
  if (q.includes('matrix')) {
    entities.push('matrix');
    themes.push('sci-fi');
  }
  if (q.includes('mavi hap') || q.includes('blue pill')) {
    entities.push('blue pill');
    themes.push('choice');
  }
  if (q.includes('kırmızı hap') || q.includes('red pill')) {
    entities.push('red pill');
    themes.push('choice');
  }
  if (
    q.includes('simülasyon') ||
    q.includes('simulasyon') ||
    q.includes('simulation') ||
    q.includes('gerçek değil') ||
    q.includes('real değil')
  ) {
    entities.push('simulation');
    themes.push('sci-fi');
  }

  // Inception / rüya
  if (
    q.includes('rüya içinde rüya') ||
    q.includes('dream within a dream') ||
    q.includes('rüya içinde') ||
    q.includes('dream inside') ||
    q.includes('rüyaların içine girip') ||
    q.includes('rüyalara girip') ||
    q.includes('enter dreams') ||
    q.includes('entering dreams')
  ) {
    entities.push('dream');
    themes.push('mind-bending');
  }
  if (q.includes('rüya') || q.includes('rüyaların') || q.includes('dream')) {
    if (!entities.includes('dream')) entities.push('dream');
    if (!themes.includes('mind-bending')) themes.push('mind-bending');
  }
  if (q.includes('topaç') || q.includes('totem')) entities.push('spinning top');

  // Shawshank / hapishane
  if (q.includes('hapishane') || q.includes('cezaevi') || q.includes('prison') || q.includes('jail')) {
    environment.push('prison');
    themes.push('drama');
  }
  if (q.includes('tünel') || (q.includes('duvar') && q.includes('posteri')) || q.includes('kazıyor'))
    events.push('escape plan');

  // Interstellar / uzay
  if (q.includes('uzay') || q.includes('space') || q.includes('gezegen') || q.includes('planet')) {
    environment.push('space');
    themes.push('sci-fi');
  }
  if (q.includes('kara delik') || q.includes('black hole')) entities.push('black hole');
  if (q.includes('solucan deli') || q.includes('wormhole')) {
    entities.push('wormhole');
    environment.push('space');
    themes.push('sci-fi');
  }

  if (q.includes('aksiyon') || q.includes('action')) themes.push('action');

  return { entities, events, environment, themes, time_hint: 'unspecified' };
}

// ============================================================================
// STEP 2: CANONICAL QUERY (SCENE + RAW QUERY)
// ============================================================================

function buildCanonicalQuery(scene: SceneDescription, originalQuery: string): string {
  const coreTerms: string[] = [];
  coreTerms.push(...scene.entities, ...scene.events, ...scene.environment, ...scene.themes);

  const turkishToEnglish: Record<string, string> = {
    'gemi': 'ship',
    'buzdağı': 'iceberg',
    'battı': 'sinking',
    'batma': 'sinking',
    'solucan deli': 'wormhole',
    'dünya': 'earth',
    'kız': 'daughter',
    'baba': 'father',
    'uzay': 'space',
    'gezegen': 'planet',
    'korku': 'horror',
    'aşk': 'romance',
    'romantik': 'romance',
  };

  const qLower = originalQuery.toLowerCase();
  const translated: string[] = [];
  for (const [tr, en] of Object.entries(turkishToEnglish)) {
    if (qLower.includes(tr)) translated.push(en);
  }

  const englishPart = [...coreTerms, ...translated]
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 2)
    .filter((t, i, self) => self.indexOf(t) === i)
    .join(' ');

  return englishPart.length > 0 ? `${englishPart}
${originalQuery}` : originalQuery;
}

// ============================================================================
// STEP 3: CANDIDATE RETRIEVAL (HIGH RECALL)
// ============================================================================

async function retrieveCandidates(
  scene: SceneDescription,
  originalQuery: string,
  canonicalQuery: string
): Promise<MovieCandidate[]> {
  const candidates = new Map<number, MovieCandidate>();
  const minVoteCount = 50;

  const knownMovieNames = detectKnownMovieNames(originalQuery, scene);
  for (const name of knownMovieNames) {
    try {
      const res = await searchMovies(name, 1);
      for (const movie of res.results.slice(0, 5)) {
        if (!candidates.has(movie.id) && movie.vote_count >= minVoteCount) {
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
    } catch (e) {
      console.warn(`[Pipeline] TMDB search failed for known name "${name}":`, e);
    }
  }

  const searchTerms = buildSearchTermsFromCanonical(canonicalQuery);

  for (const term of searchTerms) {
    if (knownMovieNames.some((name) => name.toLowerCase() === term.toLowerCase())) continue;

    try {
      const res = await searchMovies(term, 1);
      for (const movie of res.results) {
        if (candidates.size >= 50) break;
        if (movie.vote_count < minVoteCount) continue;
        if (candidates.has(movie.id)) continue;

        const keywords = await getMovieKeywords(movie.id).catch(() => []);
        const movieText = `${movie.title} ${movie.overview || ''} ${keywords.join(' ')}`.toLowerCase();

        if (movieText.includes(term.toLowerCase())) {
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
    } catch (e) {
      console.warn(`[Pipeline] TMDB search failed for term "${term}":`, e);
    }
  }

  if (candidates.size === 0) {
    try {
      const popular = await getPopularMovies(1);
      const sceneTokens = searchTerms;
      for (const movie of popular.results) {
        if (candidates.size >= 30) break;
        if (movie.vote_count < minVoteCount) continue;

        const keywords = await getMovieKeywords(movie.id).catch(() => []);
        const movieText = `${movie.title} ${movie.overview || ''} ${keywords.join(' ')}`.toLowerCase();

        const hasAnyToken = sceneTokens.some((t) => movieText.includes(t.toLowerCase()));
        if (hasAnyToken) {
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
    } catch (e) {
      console.warn('[Pipeline] Popular movies fallback failed:', e);
    }
  }

  return Array.from(candidates.values());
}

function buildSearchTermsFromCanonical(canonicalQuery: string): string[] {
  const lower = canonicalQuery.toLowerCase();
  const tokens = lower
    .replace(/\n/g, ' ')
    .split(/[^a-zçğıöşü0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  const stopwords = new Set([
    'bir',
    've',
    'ama',
    'ile',
    'icin',
    'için',
    'film',
    'movie',
    'the',
    'this',
    'that',
    'was',
    'were',
    'have',
    'has',
    'had',
  ]);

  const unique = tokens.filter((t, i, self) => self.indexOf(t) === i && !stopwords.has(t));
  return unique.slice(0, 7);
}

function detectKnownMovieNames(query: string, scene: SceneDescription): string[] {
  const q = query.toLowerCase();
  const detected: string[] = [];

  const patterns: Record<string, string[]> = {
    titanic: ['titanic', 'titanik', 'gemi', 'buzdağı'],
    matrix: ['matrix', 'mavi hap', 'blue pill', 'kırmızı hap', 'red pill', 'simülasyon'],
    inception: ['inception', 'rüya içinde rüya', 'rüyaların içine girip', 'fikir çalan', 'spinning top', 'topaç'],
    it: ['it', 'palyanço', 'palyaço', 'clown', 'kırmızı balon', 'red balloon'],
    shawshank: ['shawshank', 'esaretin bedeli', 'hapishane', 'prison', 'tünel', 'poster'],
    interstellar: ['interstellar', 'solucan deliği', 'wormhole', 'kara delik', 'black hole', 'dünya kıtlık', 'kıtlık'],
  };

  const sceneBag = [
    ...scene.entities,
    ...scene.events,
    ...scene.environment,
    ...scene.themes,
    q,
  ].join(' ').toLowerCase();

  for (const [movie, pats] of Object.entries(patterns)) {
    if (pats.some((p) => sceneBag.includes(p))) detected.push(movie);
  }

  return detected;
}

// ============================================================================
// STEP 4: EMBEDDING-BASED RETRIEVAL
// ============================================================================

async function getEmbedding(text: string, model = 'intfloat/e5-base-v2'): Promise<number[]> {
  const apiUrl = getEmbeddingApiUrl();
  if (!apiUrl) throw new Error('Embedding API not configured');

  const res = await axios.post(
    apiUrl,
    { text, model },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );

  if (res.data?.embedding && Array.isArray(res.data.embedding)) return res.data.embedding;
  if (Array.isArray(res.data)) return res.data;
  throw new Error('Invalid embedding response');
}

function getEmbeddingApiUrl(): string | null {
  const custom = import.meta.env.VITE_EMBEDDING_API_URL;
  if (custom) return custom;

  if (import.meta.env.DEV) return '/api/embedding';

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') || host.includes('vercel.com')) return '/api/embedding';
  }

  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function calculateEmbeddingScore(
  overviewSimilarity: number,
  keywordSimilarity: number,
  titleSimilarity: number
): number {
  return overviewSimilarity * 0.6 + keywordSimilarity * 0.3 + titleSimilarity * 0.1;
}

async function embedAndScore(
  canonicalQuery: string,
  candidates: MovieCandidate[]
): Promise<ScoredMovie[]> {
  if (!candidates.length) return [];

  const queryEmbedding = await getEmbedding(canonicalQuery);
  const scored: ScoredMovie[] = [];

  for (const movie of candidates) {
    try {
      const overviewEmbedding = movie.overview ? await getEmbedding(movie.overview) : null;
      const titleEmbedding = movie.title ? await getEmbedding(movie.title) : null;

      const keywordEmbeddings: number[][] = [];
      for (const kw of movie.keywords.slice(0, 5)) {
        try {
          keywordEmbeddings.push(await getEmbedding(kw));
        } catch {
          // tek tek keyword hatasını yut
        }
      }

      const overviewSim = overviewEmbedding ? cosineSimilarity(queryEmbedding, overviewEmbedding) : 0;
      const titleSim = titleEmbedding ? cosineSimilarity(queryEmbedding, titleEmbedding) : 0;

      let maxKwSim = 0;
      for (const kwEmb of keywordEmbeddings) {
        const sim = cosineSimilarity(queryEmbedding, kwEmb);
        if (sim > maxKwSim) maxKwSim = sim;
      }

      const score = calculateEmbeddingScore(overviewSim, maxKwSim, titleSim);

      if (score >= 0.1) {
        scored.push({ movie, embeddingScore: score });
      }
    } catch (e) {
      console.warn(`[Pipeline] Failed to score movie ${movie.id}:`, e);
    }
  }

  return scored.sort((a, b) => b.embeddingScore - a.embeddingScore);
}

// ============================================================================
// STEP 4b: OPTIONAL LLM RE-RANK (BACKEND ONLY)
// ============================================================================

async function rerankWithLLM(query: string, top: ScoredMovie[]): Promise<ScoredMovie[]> {
  if (!top.length) return top;

  try {
    const rerankUrl = import.meta.env.VITE_RERANK_API_URL || '/api/rerank';
    const resp = await axios.post(rerankUrl, {
      query,
      candidates: top.map((s) => ({
        id: s.movie.id,
        title: s.movie.title,
        year: getYearFromDate(s.movie.release_date),
        overview: s.movie.overview,
      })),
    });

    const data = resp.data as { order?: number[]; confidences?: number[] };
    if (!Array.isArray(data.order) || !data.order.length) return top;

    const order = data.order.map((i) => Number(i)).filter((i) => i >= 1 && i <= top.length);
    const confidences = Array.isArray(data.confidences)
      ? data.confidences.map((c) => {
          const v = Number(c);
          if (!Number.isFinite(v)) return 50;
          return Math.max(0, Math.min(100, v));
        })
      : order.map(() => 50);

    const indexed = order.map((oneBased, idx) => {
      const i = oneBased - 1;
      const base = top[i];
      if (!base) return null;
      const llmConf = confidences[idx] / 100;
      const boostedScore = base.embeddingScore * 0.7 + llmConf * 0.3;
      return { ...base, embeddingScore: boostedScore } as ScoredMovie;
    });

    const cleaned = indexed.filter((x): x is ScoredMovie => Boolean(x));
    return cleaned;
  } catch (e) {
    console.warn('[Pipeline] LLM rerank failed, using embedding only:', e);
    return top;
  }
}

// ============================================================================
// STEP 5: FINAL RESPONSE FORMATTING
// ============================================================================

async function formatFinalResult(scored: ScoredMovie): Promise<FinalResult> {
  const details = await getMovieDetails(scored.movie.id).catch(() => null);

  return {
    id: scored.movie.id,
    title: scored.movie.title,
    year: getYearFromDate(scored.movie.release_date),
    description: scored.movie.overview || 'No description available',
    matchScore: Math.round(scored.embeddingScore * 100),
    explanation: scored.explanation || 'Matched based on your scene description',
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
    console.log('[Pipeline] Step 1: Analyzing scene...');
    const scene = analyzeScene(query);
    console.log('[Pipeline] Scene:', scene);

    console.log('[Pipeline] Step 2: Building canonical query...');
    const canonicalQuery = buildCanonicalQuery(scene, query);
    console.log('[Pipeline] Canonical query:', canonicalQuery);

    console.log('[Pipeline] Step 3: Retrieving candidates...');
    const candidates = await retrieveCandidates(scene, query, canonicalQuery);
    console.log(`[Pipeline] Found ${candidates.length} candidates`);

    if (!candidates.length) return [];

    console.log('[Pipeline] Step 4: Embedding and scoring...');
    const scored = await embedAndScore(canonicalQuery, candidates);
    let top = scored.slice(0, 5);
    console.log('[Pipeline] Top results (embedding only):', top.map((s) => `${s.movie.title}: ${s.embeddingScore.toFixed(3)}`));

    console.log('[Pipeline] Step 4b: Optional LLM rerank...');
    top = await rerankWithLLM(query, top);
    console.log('[Pipeline] Top results (after LLM):', top.map((s) => `${s.movie.title}: ${s.embeddingScore.toFixed(3)}`));

    console.log('[Pipeline] Step 5: Formatting results...');
    const results = await Promise.all(top.map(formatFinalResult));
    return results;
  } catch (error) {
    console.error('[Pipeline] Pipeline failed:', error);
    throw error;
  }
}
