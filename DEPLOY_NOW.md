# Acil Deploy Gerekiyor! 🚨

## Sorun

Netlify'de deploy edilen function hala **eski Hugging Face endpoint**'ini kullanıyor:
- ❌ Eski: `https://api-inference.huggingface.co` (artık çalışmıyor - 410 hatası)
- ✅ Yeni: `https://router.huggingface.co` (güncel endpoint)

**Log'da görünen:** `url: 'https://api-inference.huggingface.co/...'`  
**Dosyada olan:** `https://router.huggingface.co/...` ✅

Bu, deploy edilen function'ın eski versiyonu olduğunu gösteriyor.

## Çözüm: Yeni Deploy Yapın (Cache Olmadan!)

### Adım 1: Değişiklikleri Commit ve Push Edin

```bash
git add .
git commit -m "Update Hugging Face API endpoint to router.huggingface.co"
git push
```

### Adım 2: Netlify'de Manuel Deploy (ÖNEMLİ: Cache Olmadan!)

1. **Netlify Dashboard** > Site'nizi seçin (film-bulucu)
2. **Deploys** sekmesine gidin
3. **"Trigger deploy"** butonuna tıklayın
4. **"Deploy project without cache"** seçin ⚠️ (BU ÇOK ÖNEMLİ!)
5. Deploy tamamlanmasını bekleyin (2-3 dakika)

**Neden "without cache"?**
- Netlify function'ları build cache'inde saklanabilir
- Cache olmadan deploy, function'ın yeniden build edilmesini garanti eder

### Adım 3: Kontrol

Deploy tamamlandıktan sonra:

1. **Functions sekmesine** gidin
2. `embedding` function'ının **güncel olduğunu** kontrol edin
3. **Logs** sekmesinden test edin
4. Site'ınızı yenileyin ve arama yapın

## Beklenen Sonuç

✅ 410 hatası düzelmeli
✅ Embedding API çalışmalı
✅ Film araması AI ile çalışmalı

## Not

Eğer hala 410 hatası alıyorsanız:
- Deploy'un tamamlandığından emin olun
- Function loglarını kontrol edin
- Cache temizleyerek tekrar deploy yapın
