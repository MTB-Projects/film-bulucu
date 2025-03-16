// @ts-nocheck

import { Link } from 'react-router-dom'
import '../styles/Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-text">© 2024 Film Bulucu</p>
          <p className="footer-text">Tüm hakları saklıdır.</p>
        </div>
        <div className="footer-links">
          <Link to="/about" className="footer-link">
            Hakkında
          </Link>
          <Link to="/privacy" className="footer-link">
            Gizlilik
          </Link>
          <Link to="/terms" className="footer-link">
            Kullanım Şartları
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer 