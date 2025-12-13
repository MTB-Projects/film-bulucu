# Film Arama Mantığı Açıklaması

## Nasıl Çalışıyor?

Uygulamanız **hem film anlatımına göre hem de isim benzerliğine göre** arama yapıyor. İşte detaylı açıklama:

## Arama Adımları

### 1. İlk Aşama: TMDB Direkt Arama

```typescript
// Kullanıcı sorgusu: "Bir adamın kırmızı pilli lambayı yere koyup uzaylıları çağırdığı film"
const searchResults = await searchMovies(query, 1);
```

- TMDB API'ye direkt arama yapılır
- Bu aşamada **isim benzerliği** ve **kelime eşleşmesi** kullanılır
- Örnek: "samuray" yazarsanız, "Samuray" kelimesini içeren filmler bulunur

### 2. İkinci Aşama: Semantic Matching (Anlamsal Eşleştirme)

Eğer direkt arama sonuç verirse:

```typescript
// Bulunan filmler semantic matching ile skorlanır
const resultsWithScores = await performSemanticMatching(query, searchResults.results);
```

**Semantic Matching Nasıl Çalışır?**

1. **Text Embedding**: 
   - Kullanıcı sorgusu → Embedding vektörüne dönüştürülür
   - Her filmin başlığı + açıklaması → Embedding vektörüne dönüştürülür
   - Hugging Face AI modeli kullanılır (`sentence-transformers/all-MiniLM-L6-v2`)

2. **Cosine Similarity**:
   - İki embedding vektörü arasındaki benzerlik hesaplanır
   - 0-1 arası skor (1 = tamamen benzer, 0 = hiç benzer değil)
   - Bu skor yüzdeye çevrilir (0-100%)

3. **Sonuç**:
   - Film anlatımına göre en uygun filmler bulunur
   - Örnek: "Bir geminin battığı aşk filmi" → Titanic yüksek skor alır

### 3. Fallback: Basit Text Matching

Eğer AI servisi çalışmazsa (CORS hatası, API hatası vb.):

```typescript
function calculateSimpleMatchScore(query: string, movie: TMDBMovie): number {
  // Başlık eşleşmesi: 50 puan
  // Başlık kelime eşleşmesi: 30 puan
  // Açıklama eşleşmesi: 20 puan
  // Açıklama kelime eşleşmesi: 10 puan
}
```

Bu durumda sadece **kelime eşleşmesi** kullanılır.

## Örnek Senaryolar

### Senaryo 1: Film İsmi ile Arama
**Kullanıcı girişi:** "Inception"

1. TMDB direkt arama → "Inception" filmi bulunur
2. Semantic matching → %95+ eşleşme skoru
3. **Sonuç:** Inception filmi yüksek skorla gösterilir

### Senaryo 2: Film Anlatımı ile Arama
**Kullanıcı girişi:** "Bir adamın kırmızı pilli lambayı yere koyup uzaylıları çağırdığı film"

1. TMDB direkt arama → Sonuç bulunamayabilir (çünkü bu kelimeler film isminde yok)
2. Popüler filmlerden semantic matching → "E.T. the Extra-Terrestrial" yüksek skor alır
3. **Sonuç:** E.T. filmi gösterilir (anlamsal benzerlik sayesinde)

### Senaryo 3: Kısmi Bilgi ile Arama
**Kullanıcı girişi:** "Bir geminin battığı aşk filmi"

1. TMDB direkt arama → "gemi" veya "battı" kelimelerini içeren filmler bulunur
2. Semantic matching → "Titanic" en yüksek skoru alır
3. **Sonuç:** Titanic filmi gösterilir

## Skorlama Sistemi

### Semantic Matching Skoru (AI Çalışıyorsa)
- **90-100%**: Mükemmel eşleşme (tam olarak aradığınız film)
- **70-89%**: İyi eşleşme (çok benzer film)
- **50-69%**: Orta eşleşme (benzer özellikler var)
- **0-49%**: Düşük eşleşme (az benzer)

### Basit Matching Skoru (AI Çalışmıyorsa)
- **Başlık tam eşleşme**: 50 puan
- **Başlık kelime eşleşmesi**: 30 puan
- **Açıklama eşleşmesi**: 20 puan
- **Açıklama kelime eşleşmesi**: 10 puan

## Özet

✅ **Film anlatımına göre arama yapıyor** (AI semantic matching ile)
✅ **İsim benzerliğine göre de arama yapıyor** (TMDB direkt arama + basit matching)

**En iyi sonuçlar için:**
- Detaylı açıklama yazın (örn: "Bir geminin battığı aşk filmi")
- Sahne detayları verin (örn: "Kırmızı pilli lamba uzaylılar")
- Karakter özellikleri belirtin (örn: "Samuray kılıç dövüşü")

**Sadece isim yazarsanız:**
- Direkt arama çalışır
- Semantic matching de çalışır ama zaten isim eşleşmesi olduğu için yüksek skor alır
