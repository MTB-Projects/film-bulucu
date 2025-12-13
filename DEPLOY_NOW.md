# Acil Deploy Gerekiyor! 🚨

## Sorun

Netlify'de deploy edilen function hala **eski Hugging Face endpoint**'ini kullanıyor:
- ❌ Eski: `https://api-inference.huggingface.co` (artık çalışmıyor - 410 hatası)
- ✅ Yeni: `https://router.huggingface.co` (güncel endpoint)

## Çözüm: Yeni Deploy Yapın

### Adım 1: Değişiklikleri Commit ve Push Edin

```bash
git add netlify/functions/embedding.js
git add netlify/functions/embedding.ts
git commit -m "Update Hugging Face API endpoint to router.huggingface.co"
git push
```

### Adım 2: Netlify'de Manuel Deploy

1. **Netlify Dashboard** > Site'nizi seçin
2. **Deploys** sekmesine gidin
3. **"Trigger deploy"** butonuna tıklayın
4. **"Deploy project without cache"** seçin (ÖNEMLİ: Cache olmadan!)
5. Deploy tamamlanmasını bekleyin (2-3 dakika)

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
