import { Link } from 'react-router-dom'
import '../styles/Header.css'
import { useLang } from '../i18n/LanguageProvider'

const Header = () => {
  const { t, lang, setLang } = useLang()
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          {t.appName}
        </Link>
        <div className="nav-group">
          <nav className="nav-links">
            <Link to="/" className="nav-link">
              {t.navHome}
            </Link>
            <Link to="/about" className="nav-link">
              {t.navAbout}
            </Link>
          </nav>
          <div className="lang-switch">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'tr' | 'en')}
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 