# Local Development Rehberi

## Hızlı Başlangıç

### 1. Gerekli Paketleri Yükleyin

```bash
npm install
```

### 2. Environment Variables Ayarlayın

`.env` dosyasında şu değişkenler olmalı:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_HUGGING_FACE_API_KEY=your_huggingface_token
```

### 3. Development Server'ı Başlatın

#### Seçenek 1: Local Server ile (Önerilen)

**Terminal 1 - Local Embedding Server:**
```bash
npm install express cors dotenv
npm run local-server
```

**Terminal 2 - Vite Dev Server:**
```bash
npm run dev
```

#### Seçenek 2: Vercel CLI ile

**Terminal 1 - Vercel CLI:**
```bash
npm install -g vercel
vercel login
vercel link
vercel dev
```

**Terminal 2 - Vite Dev Server:**
```bash
npm run dev
```

### 4. Uygulamayı Açın

Tarayıcıda http://localhost:3000 adresine gidin.

## Local Server Detayları

`local-server.js` dosyası:
- Port 8888'de çalışır
- `/api/embedding` endpoint'ini sağlar
- Hugging Face API'ye proxy görevi görür
- CORS sorununu çözer

## Sorun Giderme

### "Embedding API not configured" Hatası

- `local-server.js` çalışıyor mu kontrol edin (port 8888)
- Veya Vercel CLI çalışıyor mu kontrol edin (`vercel dev`)

### "Hugging Face API key not found" Hatası

- `.env` dosyasında `VITE_HUGGING_FACE_API_KEY` var mı kontrol edin
- Server'ı yeniden başlatın (environment variables değişiklikleri için)

### Port 8888 Zaten Kullanılıyor

- Başka bir uygulama port 8888'i kullanıyor olabilir
- `local-server.js` dosyasında port numarasını değiştirebilirsiniz
- Vite config'de proxy target'ı da güncelleyin

## Production Deployment

Production için Vercel kullanın:
- `api/embedding.ts` otomatik deploy edilir
- Environment variables'ı Vercel dashboard'dan ayarlayın
