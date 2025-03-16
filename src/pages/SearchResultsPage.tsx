// @ts-nocheck

import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import '../styles/SearchResultsPage.css'
import { searchFilmsByDescription, FilmSearchResult } from '../services/aiService'

// Örnek arama sonuçları
const SAMPLE_SEARCH_RESULTS = [
  {
    id: 1,
    title: 'E.T. the Extra-Terrestrial',
    year: 1982,
    poster: '/images/et.jpg',
    description: 'Bir uzaylının dünyada kalışı ve bir çocukla kurduğu dostluk hikayesi.',
    matchScore: 95,
    scenes: ['Çocuk ve uzaylı kırmızı bir ışık kullanarak iletişim kurar.', 'Bisikletle ay önünde uçma sahnesi.']
  },
  {
    id: 2,
    title: 'Close Encounters of the Third Kind',
    year: 1977,
    poster: '/images/close-encounters.jpg',
    description: 'UFO ile karşılaşan bir adamın yaşadığı olağanüstü deneyimler.',
    matchScore: 87,
    scenes: ['Adam evde minyatür dağ yapar.', 'Işıklı uzay gemisi insanlarla iletişim kurar.']
  },
  {
    id: 3,
    title: 'The Day the Earth Stood Still',
    year: 1951,
    poster: '/images/day-earth-stood-still.jpg',
    description: 'Dünyaya gelen uzaylı ve robotunun barış mesajı getirmesi.',
    matchScore: 72,
    scenes: ['Uzay gemisi parkta iner.', 'Robot şehirde yürür ve panik yaratır.']
  }
]

interface LocationState {
  query?: string
}

const SearchResultsPage = () => {
  const location = useLocation()
  const state = location.state as LocationState
  const searchQuery = state?.query || ''
  
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<FilmSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const handleSearch = async (query: string) => {
    setIsSearching(true)
    setError(null)
    
    try {
      const searchResults = await searchFilmsByDescription(query)
      setResults(searchResults)
    } catch (err) {
      console.error("Film arama hatası:", err)
      setError("Film arama sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    } finally {
      setIsSearching(false)
    }
  }
  
  // İlk yükleme sırasında arama sorgusu varsa sonuçları getir
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery)
    }
  }, [searchQuery])
  
  return (
    <div className="search-results-page">
      <div className="container">
        <h1 className="results-title">Arama Sonuçları</h1>
        <div className="search-box">
          <SearchForm onSearch={handleSearch} isSearching={isSearching} />
        </div>
        
        {searchQuery && (
          <div className="search-query">
            <p>Aranan: <span className="query-text">"{searchQuery}"</span></p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div className="results-container">
          {results.length > 0 ? (
            <div className="results-list">
              {results.map(result => (
                <div key={result.id} className="result-card">
                  <div className="result-poster">
                    <img src={`https://via.placeholder.com/200x300?text=${encodeURIComponent(result.title)}`} alt={result.title} />
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
                      <button className="btn">Film Detayları</button>
                      <button className="btn btn-outline">Fragmanı İzle</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <h2>Aramanızla eşleşen film bulunamadı.</h2>
              <p>Lütfen farklı bir film sahnesi veya detayı ile tekrar deneyin.</p>
              <Link to="/" className="btn">Ana Sayfaya Dön</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchResultsPage 