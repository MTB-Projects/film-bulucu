import axios from 'axios';
import { FilmSearchResult } from './aiService';
import { searchMovies, getPosterUrl, getBackdropUrl } from './tmdbService';

interface LLMSearchApiResult {
  title: string;
  year?: number;
  description: string;
  main_characters: string[];
  reason: string;
  match_score?: number;
}

interface LLMSearchResponse {
  results: LLMSearchApiResult[];
}

const placeholderPoster = (title: string) =>
  `https://placehold.co/200x300?text=${encodeURIComponent(title || 'Movie')}`;

async function enrichPosterAndBackdrop(
  title: string,
  year?: number
): Promise<{ posterUrl?: string; backdropUrl?: string }> {
  const queries = [];
  if (year && Number.isFinite(year)) {
    queries.push({ q: `${title} ${year}`, lang: 'tr-TR' });
  }
  queries.push({ q: title, lang: 'tr-TR' });
  if (year && Number.isFinite(year)) {
    queries.push({ q: `${title} ${year}`, lang: 'en-US' });
  }
  queries.push({ q: title, lang: 'en-US' });

  for (const { q, lang } of queries) {
    try {
      const search = await searchMovies(q, 1, lang);
      const first = search.results?.[0];
      if (!first) continue;
      const posterUrl = first.poster_path ? getPosterUrl(first.poster_path) : undefined;
      const backdropUrl = first.backdrop_path ? getBackdropUrl(first.backdrop_path) : undefined;
      if (posterUrl || backdropUrl) {
        return { posterUrl, backdropUrl };
      }
    } catch (e) {
      console.warn('[LLM Search] TMDB enrichment failed for', q, e);
    }
  }

  return {};
}

export async function searchFilmsWithLLM(query: string, lang: 'tr' | 'en'): Promise<FilmSearchResult[]> {
  const resp = await axios.post<LLMSearchResponse>('/api/llm-search', { query, lang });
  const results = resp.data?.results || [];

  if (!results.length) return [];

  const normalized = await Promise.all(
    results.slice(0, 5).map(async (item, idx) => {
    const score =
      typeof item.match_score === 'number'
        ? Math.round(item.match_score * 100)
        : Math.max(50, 95 - idx * 5);

    const year = typeof item.year === 'number' && Number.isFinite(item.year) ? item.year : 0;

      const art = await enrichPosterAndBackdrop(item.title, year || undefined);
      const posterUrl = art.posterUrl || placeholderPoster(item.title);

      return {
        id: idx + 1, // TMDB id yoksa sıra numarası kullan
        title: item.title || 'Bilinmeyen Film',
        year,
        description: item.description || 'Açıklama sağlanmadı.',
        matchScore: score,
        scenes: [item.reason || 'Sahne benzerliği'],
        posterUrl,
        voteAverage: undefined,
        backdropUrl: art.backdropUrl,
        reason: item.reason || 'Sahne benzerliği',
        cast: item.main_characters || [],
      };
    })
  );

  return normalized;
}
