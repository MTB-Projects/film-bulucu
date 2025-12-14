import { useState, FormEvent } from 'react'
import '../styles/SearchForm.css'

interface SearchFormProps {
  onSearch: (query: string) => void
  isSearching: boolean
}

const SearchForm = ({ onSearch, isSearching }: SearchFormProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  
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
          placeholder="Filmden hatırladığın sahneyi, karakteri veya detayı yaz..."
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
            'Filmi Bul'
          )}
        </button>
      </form>
    </div>
  )
}

export default SearchForm 