import { Link } from 'react-router-dom'
import '../styles/Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          Film Bulucu
        </Link>
        <nav className="nav-links">
          <Link to="/" className="nav-link">
            Ana Sayfa
          </Link>
          <Link to="/about" className="nav-link">
            Hakkında
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header 