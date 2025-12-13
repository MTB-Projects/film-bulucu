import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchForm from '../components/SearchForm'
import MovieRecommendations from '../components/MovieRecommendations'
import '../styles/HomePage.css'

const HomePage = () => {
  const navigate = useNavigate()
  const [isSearching, setIsSearching] = useState(false)
  
  const handleSearch = async (query: string) => {
    setIsSearching(true)
    
    // Simüle edilmiş yükleme gecikmesi
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setIsSearching(false)
    navigate('/search-results', { state: { query } })
  }
  
  return (
    <div className="home-page">
      <section className="hero-section page-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Hatırladığın Sahneden <span className="gradient-text">Filmi Bul</span>
            </h1>
            <p className="hero-subtitle">
              O filmin adı neydi? Sadece bir sahnesini ya da detayını hatırlıyorsun ama ismini 
              bulamıyor musun? Film Bulucu yapay zeka ile o filmi senin için bulsun!
            </p>
            <SearchForm onSearch={handleSearch} isSearching={isSearching} />
          </div>
        </div>
      </section>
      
      <section className="how-it-works-section page-section">
        <div className="container">
          <h2 className="section-title">Nasıl Çalışır?</h2>
          <div className="steps-container">
            <div className="step card">
              <div className="step-number">1</div>
              <h3>Hatırladığını Yaz</h3>
              <p>Filmden hatırladığın sahneyi, karakterleri veya detayları arama kutusuna yaz.</p>
            </div>
            <div className="step card">
              <div className="step-number">2</div>
              <h3>Yapay Zeka Çalışsın</h3>
              <p>Yapay zeka algoritması yazılarını analiz ederek en uygun filmleri belirler.</p>
            </div>
            <div className="step card">
              <div className="step-number">3</div>
              <h3>Filmi Bul</h3>
              <p>Sonuçlar listesinden aradığın filme ulaş ve detaylı bilgileri incele.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="recommendations-section page-section">
        <div className="container">
          <h2 className="section-title">Popüler Filmler</h2>
          <MovieRecommendations />
        </div>
      </section>
    </div>
  )
}

export default HomePage 