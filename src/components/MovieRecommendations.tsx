import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/MovieRecommendations.css'
import { getPopularMovies, getPosterUrl, getYearFromDate, TMDBMovie } from '../services/tmdbService'

interface MovieCard {
  id: number
  title: string
  year: number
  poster: string
  description: string
}

const MovieRecommendations = () => {
  const [movies, setMovies] = useState<MovieCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await getPopularMovies(1)
        
        const movieCards: MovieCard[] = response.results.slice(0, 4).map((movie: TMDBMovie) => ({
          id: movie.id,
          title: movie.title,
          year: getYearFromDate(movie.release_date),
          poster: getPosterUrl(movie.poster_path),
          description: movie.overview || 'Açıklama bulunamadı.'
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
      <div className="movies-grid">
        {movies.map(movie => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster">
              <img 
                src={movie.poster} 
                alt={movie.title}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/300x450?text=${encodeURIComponent(movie.title)}`;
                }}
              />
            </div>
            <div className="movie-details">
              <h3 className="movie-title">{movie.title} <span className="movie-year">({movie.year})</span></h3>
              <p className="movie-description">
                {movie.description.length > 150 
                  ? movie.description.substring(0, 150) + '...' 
                  : movie.description}
              </p>
              <button 
                className="movie-details-button btn"
                onClick={() => handleMovieClick(movie.id)}
              >
                Detaylar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieRecommendations 