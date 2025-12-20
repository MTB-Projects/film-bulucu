import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import '../styles/SearchResultsPage.css'
import { FilmSearchResult } from '../services/aiService'
import { searchFilmsByScene } from '../services/sceneSearchPipeline'
import { searchFilmsWithLLM } from '../services/llmSearchService'
import { useLang } from '../i18n/LanguageProvider'

interface LocationState {
  query?: string
}

const SearchResultsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState
  const initialQuery = state?.query || ''
  const { t, lang, setLang } = useLang()
  
  // Son işlenen initialQuery'yi takip et (infinite loop'u önlemek için)
  const lastProcessedQueryRef = useRef<string>('')
  
  const [currentQuery, setCurrentQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<FilmSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [useLLM, setUseLLM] = useState(true)
  
  const handleSearch = useCallback(async (query: string) => {
    // Query state'ini güncelle
    setCurrentQuery(query)
    setIsSearching(true)
    setError(null)
    setResults([])
    
    // URL'i güncelle (geri butonu için)
    navigate('/search-results', { state: { query }, replace: true })
    
    try {
      let searchResults: FilmSearchResult[] = []

      if (useLLM) {
        searchResults = await searchFilmsWithLLM(query, lang)
      } else {
        // Use new scene-based pipeline
        const pipelineResults = await searchFilmsByScene(query)
        // Convert to old format for compatibility
        searchResults = pipelineResults.map(result => ({
          id: result.id,
          title: result.title,
          year: result.year,
          description: result.description,
          matchScore: result.matchScore,
          scenes: result.explanation ? [result.explanation] : [],
          posterUrl: result.posterUrl,
          backdropUrl: result.backdropUrl,
          voteAverage: result.voteAverage,
          reason: result.reason || result.explanation || 'Sahne açıklamanıza en yakın sonuçlardan biri.',
          cast: result.cast || [],
        }))
      }
      
      if (searchResults.length === 0) {
        setError("Aramanızla eşleşen film bulunamadı. Lütfen farklı kelimeler veya daha detaylı bir açıklama deneyin.")
      } else {
        setResults(searchResults)
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
  }, [navigate, useLLM, lang])
  
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
        <h1 className="results-title">{t.resultsTitle}</h1>
        <div className="search-box">
          <SearchForm 
            onSearch={handleSearch} 
            isSearching={isSearching}
            showDemo={false}
          />
        </div>
        
        {currentQuery && (
          <div className="search-query">
            <p>{t.searchedFor}: <span className="query-text">"{currentQuery}"</span></p>
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
            <p className="loading-text">{t.loading}</p>
          </div>
        )}
        
        <div className="results-container">
          {!isSearching && results.length > 0 ? (
            <div className="results-list">
              {results.map((result, index) => (
                <div key={result.id} className="result-card">
                  <div className="result-poster">
                    <img src={result.posterUrl} alt={result.title} onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://placehold.co/200x300?text=${encodeURIComponent(result.title)}`;
                    }} />
                    <div className="match-score">
                      <span className="score-number">{result.matchScore}%</span>
                      <span className="score-label">Eşleşme</span>
                    </div>
                  </div>
                  <div className="result-details">
                    <div className="result-header">
                      <div className="rank-badge">#{index + 1}</div>
                      <h2 className="result-title">{result.title} <span className="result-year">({result.year || 'N/A'})</span></h2>
                    </div>
                    <p className="result-description">{result.description}</p>
                    
                    {result.reason && (
                      <div className="match-reason">
                        <h3>{t.matchWhy}</h3>
                        <p>{result.reason}</p>
                      </div>
                    )}

                    {result.cast && result.cast.length > 0 && (
                      <div className="cast-list">
                        <h3>{t.mainCast}</h3>
                        <ul>
                          {result.cast.map((actor) => (
                            <li key={actor}>{actor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="result-actions">
                      <button 
                        className="btn"
                        onClick={() => handleMovieDetails(result.id)}
                      >
                        {t.details}
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleWatchTrailer(result.id, result.title)}
                      >
                        {t.trailer}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isSearching ? (
            <div className="no-results">
              <h2>{t.noResultsTitle}</h2>
              <p>{t.noResultsDesc}</p>
              <Link to="/" className="btn">{t.backHome}</Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SearchResultsPage 