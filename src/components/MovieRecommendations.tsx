import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/MovieRecommendations.css'
import { getPopularMovies, getPosterUrl, getYearFromDate, TMDBMovie } from '../services/tmdbService'
import { useLang } from '../i18n/LanguageProvider'

interface MovieCard {
  id: number
  title: string
  year: number
  poster: string
  description: string
  score?: number
  releaseDate?: string
}

const MovieRecommendations = () => {
  const [movies, setMovies] = useState<MovieCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { lang } = useLang()
  
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await getPopularMovies(1)
        
        const movieCards: MovieCard[] = response.results.slice(0, 10).map((movie: TMDBMovie) => ({
          id: movie.id,
          title: movie.title,
          year: getYearFromDate(movie.release_date),
          poster: getPosterUrl(movie.poster_path),
          description: movie.overview || 'Açıklama bulunamadı.',
          score: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : undefined,
          releaseDate: movie.release_date,
        }))
        
        setMovies(movieCards)
      } catch (err) {
        console.error('Film verileri alınamadı', err)
        setError('Popüler filmler yüklenirken bir hata oluştu.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMovies()
  }, [])
  
  const handleMovieClick = (movieId: number) => {
    navigate('/search-results', { state: { query: movies.find(m => m.id === movieId)?.title || '' } })
  }
  
  if (isLoading) {
    return (
      <div className="movie-recommendations">
        <div className="loading-message">Filmler yükleniyor...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="movie-recommendations">
        <div className="error-message">{error}</div>
      </div>
    )
  }
  
  return (
    <div className="movie-recommendations">
      <div className="movies-row" data-lang={lang}>
        {movies.map(movie => (
          <div key={movie.id} className="movie-card" onClick={() => handleMovieClick(movie.id)}>
            <div className="movie-poster">
              <img
                src={movie.poster}
                alt={movie.title}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://placehold.co/200x300?text=${encodeURIComponent(movie.title)}`;
                }}
              />
              {movie.score !== undefined && (
                <div className="movie-score">
                  <span>{movie.score}</span>
                </div>
              )}
            </div>
            <div className="movie-details">
              <h3 className="movie-title">
                {movie.title}
                <span className="movie-year">({movie.year})</span>
              </h3>
              {movie.releaseDate && (
                <p className="movie-meta">{movie.releaseDate}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieRecommendations 