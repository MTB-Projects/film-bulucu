# NOT: Bu doküman artık **geçersiz** (LLM kullanılmıyor)

Bu projede OpenAI/LLM entegrasyonu tamamen kaldırıldı.

- Artık **hiçbir yerde OpenAI API çağrısı yapılmıyor**.
- Arama pipeline'ı sadece:
  - TMDB'den aday film toplama
  - Hugging Face `e5-base-v2` embedding modeli ile benzerlik hesaplama
  - Kural tabanlı sahne analizi
üzerinden çalışıyor.

Bu yüzden OpenAI quota / billing / 429 hataları ile ilgili bu rehbere ihtiyacınız yok.
