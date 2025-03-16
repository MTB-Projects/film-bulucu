// @ts-nocheck

import { useState, useEffect } from 'react'
import '../styles/MovieRecommendations.css'

// Bu şimdilik bir örnek veri, normalde bir API'dan gelecek
const SAMPLE_MOVIES = [
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    poster: '/images/inception.jpg',
    description: 'Zihinlere girip bilgi çalabilen bir hırsız, son görevinde bilgi çalmak yerine bir fikir yerleştirmelidir.'
  },
  {
    id: 2,
    title: 'The Shawshank Redemption',
    year: 1994,
    poster: '/images/shawshank.jpg',
    description: 'İşlemediği bir suçtan hüküm giyen bankacının hapishane yaşamını ve dostluklarını anlatan film.'
  },
  {
    id: 3,
    title: 'The Dark Knight',
    year: 2008,
    poster: '/images/dark-knight.jpg',
    description: 'Batman, Joker\'ın Gotham şehrinde yarattığı kaosu durdurmak için mücadele eder.'
  },
  {
    id: 4,
    title: 'Pulp Fiction',
    year: 1994,
    poster: '/images/pulp-fiction.jpg',
    description: 'Suçlular, boksörler, gangsterler ve bir çanta dolusu gizemli içeriğin olduğu birbirine bağlı hikayeler.'
  }
]

const MovieRecommendations = () => {
  const [movies, setMovies] = useState(SAMPLE_MOVIES)
  
  // Gerçek uygulamada API'dan veri çekme işlemi burada olacak
  useEffect(() => {
    // Bu fonksiyon gerçek bir API çağrısı ile değiştirilecek
    const fetchMovies = async () => {
      try {
        // Şimdilik örnek veriyi kullanıyoruz
        // const response = await fetch('https://api.example.com/movies/popular')
        // const data = await response.json()
        // setMovies(data.results)
      } catch (error) {
        console.error('Film verileri alınamadı', error)
      }
    }
    
    fetchMovies()
  }, [])
  
  return (
    <div className="movie-recommendations">
      <div className="movies-grid">
        {movies.map(movie => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster">
              <img src={movie.poster} alt={movie.title} />
            </div>
            <div className="movie-details">
              <h3 className="movie-title">{movie.title} <span className="movie-year">({movie.year})</span></h3>
              <p className="movie-description">{movie.description}</p>
              <button className="movie-details-button btn">Detaylar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieRecommendations 