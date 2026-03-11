# İNTİZAM — Kurulum Rehberi

Aşağıdaki adımları sırayla takip et.

---

## ADIM 1: Firebase Projesi Oluştur

1. https://console.firebase.google.com adresine git
2. Google hesabınla giriş yap
3. "Add project" / "Proje Ekle" butonuna tıkla
4. Proje adı olarak `intizam` yaz → "Continue"
5. Google Analytics'i kapat (gerek yok) → "Create Project"
6. Proje oluşturulduktan sonra "Continue" de

## ADIM 2: Web Uygulaması Ekle

1. Proje ana sayfasında `</>` (Web) ikonuna tıkla
2. App nickname: `intizam-web` yaz
3. "Firebase Hosting" kutusunu İŞARETLEME
4. "Register app" de
5. Ekranda `firebaseConfig` kodu görünecek. Bu değerleri not al:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId
6. "Continue to console" de

## ADIM 3: Authentication Aç

1. Sol menüden "Build" > "Authentication" seç
2. "Get Started" de
3. "Sign-in method" sekmesine git
4. "Email/Password" seç → Enable yap → Save

## ADIM 4: Firestore Database Aç

1. Sol menüden "Build" > "Firestore Database" seç
2. "Create database" de
3. Location olarak `eur3 (europe-west)` seç (en yakın)
4. "Start in production mode" seç → "Create"
5. "Rules" sekmesine git ve kuralları şöyle değiştir:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. "Publish" de

## ADIM 5: Projeyi Bilgisayarına Kur

Bilgisayarında Node.js yüklü olmalı (https://nodejs.org → LTS indir).

Terminal / Komut satırı aç:

```bash
# Proje klasörüne git (ZIP'i çıkardığın yer)
cd intizam

# .env.local dosyası oluştur
cp .env.local.example .env.local
```

`.env.local` dosyasını aç ve Firebase'den aldığın değerleri yapıştır:

```
NEXT_PUBLIC_FB_API_KEY=senin-api-key
NEXT_PUBLIC_FB_AUTH_DOMAIN=intizam-xxxxx.firebaseapp.com
NEXT_PUBLIC_FB_PROJECT_ID=intizam-xxxxx
NEXT_PUBLIC_FB_STORAGE_BUCKET=intizam-xxxxx.appspot.com
NEXT_PUBLIC_FB_MESSAGING_ID=123456789
NEXT_PUBLIC_FB_APP_ID=1:123456789:web:abcdef
```

```bash
# Paketleri yükle
npm install

# Lokal test
npm run dev
```

Tarayıcıda http://localhost:3000 aç — çalışıyor olmalı.

## ADIM 6: Asker Görseli Ekle (Opsiyonel)

Sana verdiğim asker PNG dosyasını `public/soldier.png` olarak kaydet.
Uygulama otomatik olarak yükleyecek.

## ADIM 7: Vercel'e Deploy Et

1. https://github.com adresinde yeni bir repo oluştur (Private yapabilirsin)
2. Proje dosyalarını GitHub'a yükle:

```bash
git init
git add .
git commit -m "İNTİZAM v3"
git branch -M main
git remote add origin https://github.com/KULLANICI/intizam.git
git push -u origin main
```

3. https://vercel.com adresine git → GitHub ile giriş yap
4. "New Project" → GitHub reposunu seç → "Import"
5. "Environment Variables" bölümüne `.env.local` dosyasındaki değişkenleri tek tek ekle
6. "Deploy" de

2-3 dakika içinde `intizam-xxxxx.vercel.app` gibi bir URL alacaksın.

## ADIM 8: Telefona Uygulama Olarak Ekle

### iPhone:
1. Safari'den Vercel URL'ni aç
2. Paylaş butonuna bas (kutu + ok ikonu)
3. "Ana Ekrana Ekle" seç
4. "Ekle" de

### Android:
1. Chrome'dan Vercel URL'ni aç
2. Sağ üst menü (⋮) → "Ana ekrana ekle"
3. "Ekle" de

Artık telefon ana ekranında İNTİZAM ikonu var.
PC'de ve telefonda aynı hesapla giriş yap — veriler otomatik senkronize.

---

## Sorun Giderme

- **"Permission denied" hatası**: Firestore Rules'u doğru yapıştırdığından emin ol
- **Giriş yapamıyorum**: Authentication'da Email/Password'u etkinleştirdiğinden emin ol
- **Vercel'de çalışmıyor**: Environment variables'ları Vercel'e eklediğinden emin ol
