import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// TMDB API Response Types
export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  tagline: string;
  production_companies: Array<{ id: number; name: string }>;
}

export interface TMDBKeywordsResponse {
  keywords: Array<{ id: number; name: string }>;
}

/**
 * TMDB API key'ini environment variable'dan alır
 */
function getApiKey(): string {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB API key bulunamadı. Lütfen .env dosyasında VITE_TMDB_API_KEY değişkenini ayarlayın.');
  }
  return apiKey;
}

/**
 * Poster URL'ini oluşturur
 */
export function getPosterUrl(posterPath: string | null): string {
  if (!posterPath) {
    return 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

/**
 * Backdrop URL'ini oluşturur
 */
export function getBackdropUrl(backdropPath: string | null): string {
  if (!backdropPath) {
    return 'https://via.placeholder.com/1280x720?text=No+Image';
  }
  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
}

/**
 * TMDB'de film arama yapar
 */
export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get<TMDBSearchResponse>(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: apiKey,
        query: query,
        page: page,
        language: 'tr-TR', // Türkçe sonuçlar için
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`TMDB API hatası: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Belirli bir filmin detaylarını getirir
 */
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get<TMDBMovieDetails>(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: apiKey,
        language: 'tr-TR',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`TMDB API hatası: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Popüler filmleri getirir
 */
export async function getPopularMovies(page: number = 1): Promise<TMDBSearchResponse> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get<TMDBSearchResponse>(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: apiKey,
        page: page,
        language: 'tr-TR',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`TMDB API hatası: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Film yılını release_date'den çıkarır
 */
export function getYearFromDate(dateString: string): number {
  if (!dateString) return new Date().getFullYear();
  return new Date(dateString).getFullYear();
}

/**
 * Belirli bir filmin keywords'lerini getirir
 */
export async function getMovieKeywords(movieId: number): Promise<string[]> {
  try {
    const apiKey = getApiKey();
    const response = await axios.get<TMDBKeywordsResponse>(`${TMDB_BASE_URL}/movie/${movieId}/keywords`, {
      params: {
        api_key: apiKey,
      },
    });
    return response.data.keywords.map(kw => kw.name);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.warn(`TMDB keywords API hatası for movie ${movieId}:`, error.message);
    }
    return [];
  }
}

