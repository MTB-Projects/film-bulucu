import { useState, FormEvent } from 'react'
import '../styles/SearchForm.css'
import { useLang } from '../i18n/LanguageProvider'

interface SearchFormProps {
  onSearch: (query: string) => void
  isSearching: boolean
  demoPrompt?: string
  onDemo?: () => void
  showDemo?: boolean
}

const SearchForm = ({ onSearch, isSearching, demoPrompt, onDemo, showDemo = true }: SearchFormProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { t } = useLang()
  
  const handleDemoClick = () => {
    if (!demoPrompt || !onDemo || isSearching) return
    setSearchQuery(demoPrompt)
    onDemo()
  }
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() && !isSearching) {
      onSearch(searchQuery)
    }
  }
  
  return (
    <div className="search-form-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="search-input"
          disabled={isSearching}
        />
        <button 
          type="submit" 
          className="search-button btn"
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? (
            <div className="loading-spinner"></div>
          ) : (
            t.searchButton
          )}
        </button>
      </form>

      {showDemo && demoPrompt && onDemo && (
        <div className="demo-helper">
          <button 
            type="button" 
            className="demo-button btn btn-outline"
            onClick={handleDemoClick}
            disabled={isSearching}
          >
            Demo: {demoPrompt}
          </button>
          <p className="demo-caption">{t.demoCaption}</p>
        </div>
      )}
    </div>
  )
}

export default SearchForm 