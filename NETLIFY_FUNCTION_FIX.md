# Netlify Function 410 Hatası Çözümü

## Sorun
410 (Gone) hatası, Netlify function'ının deploy edilmediği veya bulunamadığı anlamına gelir.

## Çözüm Adımları

### 1. Dosyaları Kontrol Edin

Aşağıdaki dosyaların mevcut olduğundan emin olun:
- ✅ `netlify/functions/embedding.js` (JavaScript function)
- ✅ `netlify/functions/package.json` (Function dependencies)
- ✅ `netlify.toml` (Netlify konfigürasyonu)

### 2. Değişiklikleri Commit ve Push Edin

```bash
git add netlify/functions/embedding.js
git add netlify/functions/package.json
git add netlify.toml
git commit -m "Fix Netlify function deployment"
git push
```

### 3. Netlify Dashboard'da Kontrol Edin

1. **Netlify Dashboard** > Site'nizi seçin
2. **Functions** sekmesine gidin
3. `embedding` function'ının listelendiğini kontrol edin
4. Eğer yoksa, yeni deploy bekleyin veya manuel deploy yapın

### 4. Manuel Deploy (Gerekirse)

1. Netlify Dashboard > **Deploys**
2. **"Trigger deploy"** > **"Clear cache and deploy site"**
3. Deploy tamamlanmasını bekleyin

### 5. Function'ı Test Edin

Deploy tamamlandıktan sonra:

**Browser Console'dan:**
```javascript
fetch('https://film-bulucu.netlify.app/.netlify/functions/embedding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'test' })
})
.then(r => r.json())
.then(console.log)
```

**Veya Netlify Dashboard'dan:**
- Functions > embedding > Logs sekmesinden test edebilirsiniz

## Sorun Devam Ederse

### Kontrol Listesi

- [ ] `netlify/functions/embedding.js` dosyası mevcut mu?
- [ ] `netlify/functions/package.json` dosyası mevcut mu?
- [ ] `netlify.toml` dosyasında `directory = "netlify/functions"` var mı?
- [ ] Yeni deploy yaptınız mı? (Cache temizleyerek)
- [ ] Netlify Dashboard > Functions'da function görünüyor mu?
- [ ] Deploy loglarında hata var mı?

### Alternatif Çözüm: Function'ı Sil ve Yeniden Oluştur

Eğer hala çalışmıyorsa:

1. Netlify Dashboard > Functions > embedding function'ını silin
2. Yeni bir deploy yapın
3. Function otomatik olarak yeniden oluşturulacak

### Netlify CLI ile Test

Local'de test etmek için:

```bash
npm install -g netlify-cli
netlify dev
```

Bu, local'de function'ı çalıştırır ve test edebilirsiniz.

## Beklenen Sonuç

Function çalıştığında:
- ✅ 200 OK response almalısınız
- ✅ `{ embedding: [...] }` formatında response dönmeli
- ✅ CORS hatası olmamalı
