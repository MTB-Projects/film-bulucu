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

# Hugging Face API Key (Zorunlu)
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

#### Hugging Face Token (Zorunlu)

Embedding'ler için Hugging Face token gereklidir:

1. [Hugging Face](https://huggingface.co/) sitesine kaydolun
2. [Settings > Tokens](https://huggingface.co/settings/tokens) sayfasına gidin
3. Yeni bir token oluşturun (Read permission yeterli)
4. `.env` dosyasına `VITE_HUGGING_FACE_API_KEY` olarak ekleyin

### 3. Development Server'ı Başlatın

#### Seçenek 1: Vercel CLI ile (Önerilen)

```bash
# Terminal 1: Vercel CLI
npm install -g vercel
vercel login
vercel link
vercel dev

# Terminal 2: Vite dev server
npm run dev
```

#### Seçenek 2: Local Server ile

```bash
# Gerekli paketleri yükleyin (ilk kez)
npm install express cors dotenv

# Terminal 1: Local embedding server
npm run local-server

# Terminal 2: Vite dev server
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

### Local Development

Local development için iki seçenek var:

#### Seçenek 1: Vercel CLI ile (Önerilen)

1. Vercel CLI'yi yükleyin:
   ```bash
   npm install -g vercel
   ```

2. Vercel'e login olun:
   ```bash
   vercel login
   ```

3. Projeyi link edin:
   ```bash
   vercel link
   ```

4. Development server'ı başlatın:
   ```bash
   vercel dev
   ```

5. Başka bir terminal'de Vite dev server'ı başlatın:
   ```bash
   npm run dev
   ```

Bu şekilde `/api/embedding` endpoint'i Vercel CLI üzerinden çalışacak.

#### Seçenek 2: Basit Local Server (Alternatif)

Eğer Vercel CLI kullanmak istemiyorsanız, basit bir Express server oluşturabilirsiniz:

1. `local-server.js` dosyası oluşturun (proje kök dizininde):
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const { HfInference } = require('@huggingface/inference');
   require('dotenv').config();

   const app = express();
   app.use(cors());
   app.use(express.json());

   app.post('/api/embedding', async (req, res) => {
     try {
       const { text, model = 'intfloat/e5-base-v2' } = req.body;
       const hf = new HfInference(process.env.VITE_HUGGING_FACE_API_KEY);
       const embedding = await hf.featureExtraction({ model, inputs: text });
       res.json({ embedding });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

   app.listen(8888, () => console.log('Local embedding server running on :8888'));
   ```

2. Gerekli paketleri yükleyin:
   ```bash
   npm install express cors dotenv @huggingface/inference
   ```

3. Server'ı başlatın:
   ```bash
   node local-server.js
   ```

4. Vite dev server'ı başlatın (başka terminal'de):
   ```bash
   npm run dev
   ```


### CORS Sorunu

Browser'dan direkt Hugging Face API'ye istek atılamaz (CORS hatası). Bu sorunu çözmek için:

- **Local development:** `local-server.js` veya Vercel CLI kullanın
- **Production:** Vercel'e deploy edildiğinde `api/embedding.ts` serverless function otomatik çalışır

## Build

Production build için:

```bash
npm run build
```

Build dosyaları `dist` klasörüne oluşturulur.

## Lisans

MIT
