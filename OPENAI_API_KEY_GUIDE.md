# OpenAI API Key Alma Rehberi

## Adım Adım OpenAI API Key Alma

### 1. OpenAI Hesabı Oluşturma

1. **https://platform.openai.com** adresine gidin
2. "Sign up" butonuna tıklayın
3. E-posta, Google veya GitHub hesabınızla kayıt olun
4. E-posta doğrulaması yapın (gerekirse)

### 2. API Key Oluşturma

1. Giriş yaptıktan sonra **https://platform.openai.com/api-keys** adresine gidin
2. Sağ üstte **"Create new secret key"** butonuna tıklayın
3. Key'e bir isim verin (örn: "Film Bulucu App")
4. **"Create secret key"** butonuna tıklayın
5. **ÖNEMLİ:** Key'i hemen kopyalayın - bir daha gösterilmeyecek!

### 3. Projeye Ekleme

#### Local Development (.env dosyası)

1. Proje kök dizininde `.env` dosyası oluşturun (yoksa)
2. Şu satırı ekleyin:

```env
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Key'i `sk-proj-` ile başlayan değerle değiştirin

#### Netlify Deployment

1. Netlify dashboard'a gidin: https://app.netlify.com
2. Projenizi seçin
3. **Site settings** → **Environment variables**
4. **Add variable** butonuna tıklayın
5. **Key:** `VITE_OPENAI_API_KEY`
6. **Value:** API key'inizi yapıştırın
7. **Save** butonuna tıklayın
8. **Deploy** → **Trigger deploy** ile yeniden deploy edin

#### Vercel Deployment

1. Vercel dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **Environment Variables**
4. **Add New** butonuna tıklayın
5. **Name:** `VITE_OPENAI_API_KEY`
6. **Value:** API key'inizi yapıştırın
7. **Environment:** Production, Preview, Development (hepsini seçin)
8. **Save** butonuna tıklayın
9. Projeyi yeniden deploy edin

### 4. API Key Güvenliği

⚠️ **ÖNEMLİ GÜVENLİK NOTLARI:**

- API key'inizi **asla** GitHub'a commit etmeyin
- `.env` dosyası `.gitignore`'da olmalı (zaten var)
- Key'inizi başkalarıyla paylaşmayın
- Key sızdırılırsa, OpenAI dashboard'dan hemen silin ve yeni bir tane oluşturun

### 5. Fiyatlandırma

OpenAI API ücretlidir, ancak **gpt-4o-mini** modeli çok uygun fiyatlıdır:

- **Input:** ~$0.15 per 1M tokens
- **Output:** ~$0.60 per 1M tokens
- **Tipik bir arama:** ~$0.01-0.02 (çok düşük maliyet)

**Ücretsiz kredi:**
- Yeni hesaplara genellikle $5 ücretsiz kredi verilir
- Bu yaklaşık 250-500 arama yapmanıza yeter

### 6. Kullanım Takibi

1. **https://platform.openai.com/usage** adresinden kullanımınızı takip edebilirsiniz
2. **https://platform.openai.com/account/billing** adresinden billing ayarlarını yapabilirsiniz
3. Bütçe limiti koyabilirsiniz (önerilir)

### 7. Sorun Giderme

**"Invalid API key" hatası alıyorsanız:**
- Key'in doğru kopyalandığından emin olun
- Başındaki/sonundaki boşlukları kontrol edin
- Environment variable'ın doğru isimde olduğundan emin olun (`VITE_OPENAI_API_KEY`)

**"Insufficient quota" hatası alıyorsanız:**
- Billing bilgilerinizi kontrol edin
- Kredi limitinizi kontrol edin
- https://platform.openai.com/account/billing adresinden ödeme yöntemi ekleyin

### 8. Alternatif: OpenAI API Key Olmadan Test

Eğer henüz API key almadıysanız, eski pipeline'ı kullanabilirsiniz:

`src/pages/SearchResultsPage.tsx` dosyasında:
```typescript
// Yeni pipeline yerine eski pipeline'ı kullan
import { searchFilmsByDescription } from '../services/aiService'
const searchResults = await searchFilmsByDescription(query)
```

Ancak yeni pipeline çok daha doğru sonuçlar verir, OpenAI API key almanızı öneririm.
