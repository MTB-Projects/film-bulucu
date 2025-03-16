// @ts-nocheck

export interface FilmSearchResult {
  id: number;
  title: string;
  year: number;
  description: string;
  matchScore: number;
  scenes: string[];
}

const mockResults: FilmSearchResult[] = [
  {
    id: 1,
    title: 'E.T. the Extra-Terrestrial',
    year: 1982,
    description: 'Bir uzaylının dünyada kalışı ve bir çocukla kurduğu dostluk hikayesi.',
    matchScore: 95,
    scenes: ['Çocuk ve uzaylı kırmızı bir ışık kullanarak iletişim kurar.', 'Bisikletle ay önünde uçma sahnesi.']
  },
  {
    id: 2,
    title: 'Close Encounters of the Third Kind',
    year: 1977,
    description: 'UFO ile karşılaşan bir adamın yaşadığı olağanüstü deneyimler.',
    matchScore: 87,
    scenes: ['Adam evde minyatür dağ yapar.', 'Işıklı uzay gemisi insanlarla iletişim kurar.']
  }
];

/**
 * Film açıklamasına göre arama yapar ve eşleşen filmleri döndürür
 * @param query Kullanıcının girdiği film açıklaması
 * @returns Bulunan filmlerin listesi
 */
export async function searchFilmsByDescription(query: string): Promise<FilmSearchResult[]> {
  // API çağrısını simüle etmek için küçük bir gecikme ekliyoruz
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Arama sorgusunu içeren filmleri filtreleyelim (case-insensitive)
  const lowerQuery = query.toLowerCase();
  const filtered = mockResults.filter(film => 
    film.title.toLowerCase().includes(lowerQuery) || 
    film.description.toLowerCase().includes(lowerQuery) ||
    film.scenes.some(scene => scene.toLowerCase().includes(lowerQuery))
  );
  
  return filtered.length > 0 ? filtered : mockResults;
} 