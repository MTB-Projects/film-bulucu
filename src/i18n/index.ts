export type Lang = 'tr' | 'en';

const tr = {
  searchPlaceholder: 'Filmden hatırladığın sahneyi, karakteri veya detayı yaz...',
  searchButton: 'Filmi Bul',
  demoCaption: 'Tek tıkla sahne örneğini dene',
  resultsTitle: 'Arama Sonuçları',
  searchedFor: 'Aranan',
  loading: 'Filmler aranıyor, lütfen bekleyin...',
  noResultsTitle: 'Aramanızla eşleşen film bulunamadı.',
  noResultsDesc: 'Lütfen farklı bir film sahnesi veya detayı ile tekrar deneyin.',
  backHome: 'Ana Sayfaya Dön',
  details: 'Film Detayları',
  trailer: 'Fragmanı İzle',
  matchWhy: 'Neden önerildi:',
  mainCast: 'Ana karakterler:',
  matchScore: 'Eşleşme',
  llmModeLabel: 'LLM arama modu (TMDB/embedding olmadan)',
  language: 'Dil',
  navHome: 'Ana Sayfa',
  navAbout: 'Hakkında',
  appName: 'Film Bulucu',
  popularMovies: 'Popüler Filmler',
  heroTitle: 'Hatırladığın Sahneden',
  heroHighlight: 'Filmi Bul',
  heroSubtitle:
    'O filmin adı neydi? Sadece bir sahnesini ya da detayını hatırlıyorsun ama ismini bulamıyor musun? Film Bulucu yapay zeka ile o filmi senin için bulsun!',
};

const en = {
  searchPlaceholder: 'Type the scene, character, or detail you remember...',
  searchButton: 'Find the Movie',
  demoCaption: 'Try the sample scene with one click',
  resultsTitle: 'Search Results',
  searchedFor: 'Searched',
  loading: 'Searching movies, please wait...',
  noResultsTitle: 'No movies matched your search.',
  noResultsDesc: 'Try another scene or more details.',
  backHome: 'Back to Home',
  details: 'Movie Details',
  trailer: 'Watch Trailer',
  matchWhy: 'Why recommended:',
  mainCast: 'Main characters:',
  matchScore: 'Match',
  llmModeLabel: 'LLM search mode (no TMDB/embedding)',
  language: 'Language',
  navHome: 'Home',
  navAbout: 'About',
  appName: 'Film Finder',
  popularMovies: 'Popular Movies',
  heroTitle: 'Find the Movie from',
  heroHighlight: 'the Scene You Recall',
  heroSubtitle:
    "Can't remember the movie title? Describe a scene or detail, and AI will find it for you!",
};

export const messages: Record<Lang, typeof tr> = { tr, en };
