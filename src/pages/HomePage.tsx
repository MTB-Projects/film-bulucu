import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import MovieRecommendations from '../components/MovieRecommendations'
import '../styles/HomePage.css'
import { useLang } from '../i18n/LanguageProvider'
import fallbackHeroPosters from '../data/heroPosters'
import { getTopRatedMovies, TMDBMovie } from '../services/tmdbService'

const HomePage = () => {
  const navigate = useNavigate()
  const [isSearching, setIsSearching] = useState(false)
  const { t, lang } = useLang()
  const [heroPosters, setHeroPosters] = useState<string[]>(fallbackHeroPosters)
  
  const handleSearch = async (query: string) => {
    setIsSearching(true)
    
    // Simüle edilmiş yükleme gecikmesi
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setIsSearching(false)
    navigate('/search-results', { state: { query } })
  }

  useEffect(() => {
    const loadTopRated = async () => {
      try {
        const resp = await getTopRatedMovies(1, lang === 'tr' ? 'tr-TR' : 'en-US')
        const posters = resp.results
          .filter((m: TMDBMovie) => m.poster_path)
          .slice(0, 20)
          .map((m: TMDBMovie) => `https://image.tmdb.org/t/p/w500${m.poster_path}`)
        if (posters.length) {
          setHeroPosters(posters)
        } else {
          setHeroPosters(fallbackHeroPosters)
        }
      } catch (e) {
        setHeroPosters(fallbackHeroPosters)
      }
    }
    loadTopRated()
  }, [lang])
  
  return (
    <div className="home-page">
      <section className="hero-section page-section">
        <div className="hero-marquee-bg">
          <div className="hero-marquee-track">
            {heroPosters.map((src, idx) => (
              <div className="hero-marquee-item" key={`${src}-a-${idx}`}>
                <img
                  src={src}
                  alt="Movie poster"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src =
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+8NEPoQAAAABJRU5ErkJggg=='
                  }}
                />
              </div>
            ))}
          </div>
          <div className="hero-marquee-track hero-marquee-track--clone">
            {heroPosters.map((src, idx) => (
              <div className="hero-marquee-item" key={`${src}-b-${idx}`}>
                <img
                  src={src}
                  alt="Movie poster"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src =
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+8NEPoQAAAABJRU5ErkJggg=='
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              {t.heroTitle} <span className="gradient-text">{t.heroHighlight}</span>
            </h1>
            <p className="hero-subtitle">
              {t.heroSubtitle}
            </p>
            <SearchForm 
              onSearch={handleSearch} 
              isSearching={isSearching} 
              showDemo={false}
            />
          </div>
        </div>
      </section>

      <section className="how-it-works-section page-section">
        <div className="container">
          <h2 className="section-title">{lang === 'tr' ? 'Nasıl Çalışır?' : 'How It Works?'}</h2>
          <div className="steps-container">
            <div className="step card">
              <div className="step-number">1</div>
              <h3>{lang === 'tr' ? 'Hatırladığını Yaz' : 'Describe what you recall'}</h3>
              <p>{lang === 'tr' ? 'Sahneyi, karakteri veya detayı yaz.' : 'Type the scene, character, or detail you remember.'}</p>
            </div>
            <div className="step card">
              <div className="step-number">2</div>
              <h3>{lang === 'tr' ? 'Yapay Zeka Çalışsın' : 'Let AI work'}</h3>
              <p>{lang === 'tr' ? 'Model en uygun filmleri bulur.' : 'The model finds the most likely movies.'}</p>
            </div>
            <div className="step card">
              <div className="step-number">3</div>
              <h3>{lang === 'tr' ? 'Filmi Bul' : 'Get the movie'}</h3>
              <p>{lang === 'tr' ? 'Sonuçlardan filmi seç ve incele.' : 'Pick from the results and explore.'}</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="recommendations-section page-section">
        <div className="container">
          <h2 className="section-title">{t.popularMovies}</h2>
          <MovieRecommendations />
        </div>
      </section>
    </div>
  )
}

export default HomePage 