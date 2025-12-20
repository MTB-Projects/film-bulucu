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
  reason?: string;
  cast?: string[];
}
