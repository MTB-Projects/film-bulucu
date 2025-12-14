import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import '../styles/SearchResultsPage.css'
import { FilmSearchResult } from '../services/aiService'
import { searchFilmsByScene } from '../services/sceneSearchPipeline'

interface LocationState {
  query?: string
}

const SearchResultsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState
  const initialQuery = state?.query || ''
  
  // Son işlenen initialQuery'yi takip et (infinite loop'u önlemek için)
  const lastProcessedQueryRef = useRef<string>('')
  
  const [currentQuery, setCurrentQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<FilmSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const handleSearch = useCallback(async (query: string) => {
    // Query state'ini güncelle
    setCurrentQuery(query)
    setIsSearching(true)
    setError(null)
    setResults([])
    
    // URL'i güncelle (geri butonu için)
    navigate('/search-results', { state: { query }, replace: true })
    
    try {
      // Use new scene-based pipeline
      const searchResults = await searchFilmsByScene(query)
      
      // Convert to old format for compatibility
      const convertedResults: FilmSearchResult[] = searchResults.map(result => ({
        id: result.id,
        title: result.title,
        year: result.year,
        description: result.description,
        matchScore: result.matchScore,
        scenes: result.explanation ? [result.explanation] : [],
        posterUrl: result.posterUrl,
        backdropUrl: result.backdropUrl,
        voteAverage: result.voteAverage,
      }))
      
      if (convertedResults.length === 0) {
        setError("Aramanızla eşleşen film bulunamadı. Lütfen farklı kelimeler veya daha detaylı bir açıklama deneyin.")
      } else {
        setResults(convertedResults)
      }
    } catch (err) {
      console.error("Film arama hatası:", err)
      const errorMessage = err instanceof Error ? err.message : "Film arama sırasında bir hata oluştu."
      
      if (errorMessage.includes('API key')) {
        setError("API yapılandırması eksik. Lütfen .env dosyasında VITE_TMDB_API_KEY değişkenini ayarlayın.")
      } else if (errorMessage.includes('CORS') || errorMessage.includes('cors')) {
        setError("CORS hatası: Embedding servisi kullanılamıyor. Basit eşleştirme modu kullanılıyor. Daha iyi sonuçlar için serverless function'ı deploy edin.")
      } else {
        setError("Film arama sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      }
    } finally {
      setIsSearching(false)
    }
  }, [navigate])
  
  const handleMovieDetails = (movieId: number) => {
    // Film detayları için TMDB sayfasına yönlendir
    window.open(`https://www.themoviedb.org/movie/${movieId}`, '_blank')
  }
  
  const handleWatchTrailer = (_movieId: number, title: string) => {
    // TMDB'den video bilgileri çekilebilir, şimdilik YouTube'da arama yapıyoruz
    const searchQuery = encodeURIComponent(`${title} trailer`)
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank')
  }
  
  // İlk yükleme sırasında arama sorgusu varsa sonuçları getir
  // Sadece initialQuery değiştiğinde ve henüz işlenmediğinde çalışır
  useEffect(() => {
    // Eğer initialQuery var ve henüz işlenmemişse
    if (initialQuery && initialQuery !== lastProcessedQueryRef.current) {
      lastProcessedQueryRef.current = initialQuery
      setCurrentQuery(initialQuery)
      handleSearch(initialQuery)
    }
  }, [initialQuery, handleSearch])
  
  return (
    <div className="search-results-page">
      <div className="container">
        <h1 className="results-title">Arama Sonuçları</h1>
        <div className="search-box">
          <SearchForm onSearch={handleSearch} isSearching={isSearching} />
        </div>
        
        {currentQuery && (
          <div className="search-query">
            <p>Aranan: <span className="query-text">"{currentQuery}"</span></p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {isSearching && (
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <p className="loading-text">Filmler aranıyor, lütfen bekleyin...</p>
          </div>
        )}
        
        <div className="results-container">
          {!isSearching && results.length > 0 ? (
            <div className="results-list">
              {results.map(result => (
                <div key={result.id} className="result-card">
                  <div className="result-poster">
                    <img src={result.posterUrl} alt={result.title} onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/200x300?text=${encodeURIComponent(result.title)}`;
                    }} />
                    <div className="match-score">
                      <span className="score-number">{result.matchScore}%</span>
                      <span className="score-label">Eşleşme</span>
                    </div>
                  </div>
                  <div className="result-details">
                    <h2 className="result-title">{result.title} <span className="result-year">({result.year})</span></h2>
                    <p className="result-description">{result.description}</p>
                    
                    <div className="matching-scenes">
                      <h3>Eşleşen Sahneler:</h3>
                      <ul className="scenes-list">
                        {result.scenes.map((scene, index) => (
                          <li key={index}>{scene}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="result-actions">
                      <button 
                        className="btn"
                        onClick={() => handleMovieDetails(result.id)}
                      >
                        Film Detayları
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleWatchTrailer(result.id, result.title)}
                      >
                        Fragmanı İzle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isSearching ? (
            <div className="no-results">
              <h2>Aramanızla eşleşen film bulunamadı.</h2>
              <p>Lütfen farklı bir film sahnesi veya detayı ile tekrar deneyin.</p>
              <Link to="/" className="btn">Ana Sayfaya Dön</Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SearchResultsPage 