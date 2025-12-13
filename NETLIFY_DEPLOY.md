# Netlify Deployment Rehberi

## Environment Variables Ayarlama

Netlify'de uygulamanızın çalışması için environment variable'ları ayarlamanız gerekiyor.

### Adım 1: Netlify Dashboard'a Giriş

1. [Netlify Dashboard](https://app.netlify.com/)'a giriş yapın
2. Deploy ettiğiniz site'ı seçin (örneğin: `aquamarine-phoenix-3f215c`)

### Adım 2: Environment Variables Ekleme

1. Site ayarlarına gidin:
   - Site adının yanındaki **"Site settings"** butonuna tıklayın
   - Veya sağ üstteki **"Site configuration"** > **"Environment variables"**

2. Yeni değişken ekleyin:
   - **"Add a variable"** butonuna tıklayın
   - Aşağıdaki değişkenleri tek tek ekleyin:

#### Zorunlu Değişken

```
Key: VITE_TMDB_API_KEY
Value: bf8044b88cb2bdd0eff616966d255569
```

#### Opsiyonel Değişken (Daha iyi AI sonuçları için)

```
Key: VITE_HUGGING_FACE_API_KEY
Value: your_hugging_face_token_here
```

veya

```
Key: HUGGING_FACE_API_KEY
Value: your_hugging_face_token_here
```

### Adım 3: Yeni Deploy Yapın

Environment variable'ları ekledikten sonra **mutlaka yeni bir deploy yapmalısınız**:

1. **Yöntem 1: Manuel Deploy**
   - Site ayarlarından **"Deploys"** sekmesine gidin
   - **"Trigger deploy"** > **"Clear cache and deploy site"** seçin

2. **Yöntem 2: Git Push**
   - Herhangi bir dosyada küçük bir değişiklik yapın (örneğin README'ye boşluk ekleyin)
   - Commit ve push yapın
   - Netlify otomatik olarak yeni deploy başlatacak

### Adım 4: Kontrol

Deploy tamamlandıktan sonra:
- Site'ınızı yenileyin
- Console'da hata olmamalı
- Film araması çalışmalı

## Sorun Giderme

### "TMDB API key bulunamadı" Hatası

- Environment variable'ları doğru eklediğinizden emin olun
- Değişken adının tam olarak `VITE_TMDB_API_KEY` olduğunu kontrol edin (büyük/küçük harf önemli)
- Yeni bir deploy yaptığınızdan emin olun
- Deploy loglarını kontrol edin (Deploys > son deploy > "Deploy log")

### Environment Variable'lar Görünmüyor

- Netlify'de environment variable'lar build zamanında kullanılır
- Değişkenleri ekledikten sonra mutlaka yeni deploy yapın
- Cache temizleyerek deploy yapın

## Netlify Function (Embedding API)

Netlify function'ı için ayrı environment variable gerekmez, aynı `VITE_HUGGING_FACE_API_KEY` veya `HUGGING_FACE_API_KEY` kullanılır.

**Önemli:** Function'ın çalışması için:
- `netlify/functions/embedding.js` dosyası mevcut olmalı (JavaScript formatında)
- Yeni deploy yapılmalı
- Netlify Dashboard > Functions sekmesinden function'ın deploy edildiğini kontrol edin

Function'ın çalıştığını kontrol etmek için:
- `https://your-site.netlify.app/.netlify/functions/embedding` endpoint'ine POST isteği atabilirsiniz
- Veya Netlify Dashboard > Functions sekmesinden logları kontrol edebilirsiniz

### 410 (Gone) Hatası

Eğer 410 hatası alıyorsanız:
1. `netlify/functions/embedding.js` dosyasının mevcut olduğundan emin olun
2. Yeni bir deploy yapın (Clear cache ile)
3. Netlify Dashboard > Functions sekmesinde function'ın listelendiğini kontrol edin
