# Film Bulucu

Hatırladığınız sahne veya detaylarla film arayan yapay zeka destekli web uygulaması.

## Özellikler

- 🎬 Sahne bazlı film arama
- 🤖 Yapay zeka destekli eşleştirme
- 🎯 Semantic similarity ile akıllı sonuçlar
- 📱 Responsive tasarım
- 🌐 Türkçe dil desteği

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. API Key'leri Ayarlayın

Proje kök dizininde `.env` dosyası oluşturun:

```env
# TMDB API Key (Zorunlu)
# TMDB API key almak için: https://www.themoviedb.org/settings/api
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# Hugging Face API Key (Opsiyonel)
# Hugging Face token almak için: https://huggingface.co/settings/tokens
VITE_HUGGING_FACE_API_KEY=your_hugging_face_token_here
```

#### TMDB API Key Alma

1. [TMDB](https://www.themoviedb.org/) sitesine kaydolun
2. [API Settings](https://www.themoviedb.org/settings/api) sayfasına gidin
3. "Request an API Key" butonuna tıklayın
4. "Developer" seçeneğini seçin
5. Formu doldurup API key'inizi alın
6. `.env` dosyasına `VITE_TMDB_API_KEY` olarak ekleyin

#### Hugging Face Token (Opsiyonel)

Hugging Face token olmadan da çalışır, ancak daha iyi sonuçlar için:

1. [Hugging Face](https://huggingface.co/) sitesine kaydolun
2. [Settings > Tokens](https://huggingface.co/settings/tokens) sayfasına gidin
3. Yeni bir token oluşturun
4. `.env` dosyasına `VITE_HUGGING_FACE_API_KEY` olarak ekleyin

### 3. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## Kullanım

1. Ana sayfada arama kutusuna hatırladığınız film sahnesini, karakteri veya detayı yazın
2. "Filmi Bul" butonuna tıklayın
3. Yapay zeka algoritması sorgunuzu analiz ederek en uygun filmleri bulur
4. Sonuçlar listesinden aradığınız filme ulaşın

### Örnek Aramalar

- "Bir adamın kırmızı pilli lambayı yere koyup uzaylıları çağırdığı film"
- "Kadın karakterin 'bunu yapmayı bırak' dediği sahne"
- "Bir geminin battığı ve erkek karakterin öldüğü aşk filmi"

## Teknoloji Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Material-UI** - UI components
- **Axios** - HTTP client
- **TMDB API** - Film veritabanı
- **Hugging Face API** - AI eşleştirme

## Nasıl Çalışır?

1. **TMDB API**: Film veritabanından film bilgilerini çeker
2. **AI Analiz**: Hugging Face Inference API ile kullanıcı sorgusunu analiz eder (serverless function üzerinden)
3. **Semantic Matching**: Text embedding ve cosine similarity ile en uygun filmleri bulur
4. **Fallback**: AI servisi çalışmazsa basit text matching kullanır

## Deployment

### Vercel Deployment

1. Projeyi Vercel'e push edin
2. Environment variables'ı ayarlayın:
   - `VITE_TMDB_API_KEY`: TMDB API key'iniz
   - `VITE_HUGGING_FACE_API_KEY` veya `HUGGING_FACE_API_KEY`: Hugging Face API key'iniz (opsiyonel)
3. Vercel otomatik olarak `api/embedding.ts` serverless function'ını deploy edecek

### Netlify Deployment

1. Projeyi Netlify'e push edin veya GitHub'dan bağlayın
2. **Environment Variables Ayarlama (ÖNEMLİ):**
   
   Netlify Dashboard'da:
   - Site ayarlarına gidin (Site settings)
   - "Environment variables" bölümüne tıklayın
   - Aşağıdaki değişkenleri ekleyin:
   
   **Zorunlu:**
   - `VITE_TMDB_API_KEY` = `bf8044b88cb2bdd0eff616966d255569` (TMDB API key'iniz)
   
   **Opsiyonel (daha iyi sonuçlar için):**
   - `VITE_HUGGING_FACE_API_KEY` veya `HUGGING_FACE_API_KEY` = Hugging Face token'ınız
   
3. **Değişkenleri ekledikten sonra:**
   - "Deploy settings" > "Trigger deploy" > "Clear cache and deploy site" yapın
   - Veya yeni bir commit push edin
   
4. Netlify otomatik olarak `netlify/functions/embedding.ts` serverless function'ını deploy edecek

**Not:** Environment variable'ları ekledikten sonra mutlaka yeni bir deploy yapın, aksi halde değişkenler build sırasında kullanılmaz.

### Local Development

Local development için serverless function'ları test etmek isterseniz:

**Vercel CLI ile:**
```bash
npm install -g vercel
vercel dev
```

**Netlify CLI ile:**
```bash
npm install -g netlify-cli
netlify dev
```

Vite dev server'ı başlattığınızda (`npm run dev`), proxy ayarları sayesinde serverless function'lara erişebilirsiniz.

### CORS Sorunu

Browser'dan direkt Hugging Face API'ye istek atılamaz (CORS hatası). Bu sorunu çözmek için serverless function'lar kullanılmaktadır. Production'da Vercel veya Netlify'e deploy edildiğinde otomatik çalışır.

## Build

Production build için:

```bash
npm run build
```

Build dosyaları `dist` klasörüne oluşturulur.

## Lisans

MIT
