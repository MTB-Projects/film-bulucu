import { Link } from 'react-router-dom'
import '../styles/NotFoundPage.css'

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Sayfa Bulunamadı</h2>
          <p className="not-found-text">
            Aradığınız sayfa bulunamadı veya taşınmış olabilir.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn">Ana Sayfaya Dön</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage 