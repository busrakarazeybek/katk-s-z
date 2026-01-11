# Katkısız - Food Additive Scanner App

🌿 Katkı maddelerini tespit eden, harita tabanlı alternatif öneren ve uzman görüşleri içeren mobil uygulama.

## 🎯 Özellikler

### ✅ Ana Özellikler
- **📸 Akıllı OCR Analizi**: Google Cloud Vision API ile ürün etiketlerini tara
- **🚦 Trafik Işığı Sistemi**:
  - 🟢 **AL** - Hiç katkı maddesi yok
  - 🟡 **DİKKAT** - Katkı maddesi var
  - 🔴 **ALMA** - Tehlikeli katkı içeriyor
- **🗺️ İnteraktif Harita**: Yakınındaki katkısız ürün satan yerleri bul
- **👨‍🔬 Uzman Sistemi**: Alanında uzman araştırmacıların bilimsel görüşleri
- **🔍 50+ Katkı Maddesi**: Kapsamlı veritabanı (E621, E330, vb.)

### 🚀 Teknik Özellikler
- Anonim kullanım desteği
- Real-time analiz
- Offline-first mimari (yakında)
- Push notification
- Dark mode desteği

## 🛠 Teknoloji Stack

- **Frontend**: React Native + Expo
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **OCR**: Google Cloud Vision API
- **Harita**: React Native Maps
- **State Management**: React Context API
- **UI**: React Native Paper + Custom Components
- **Type Safety**: TypeScript

## 📋 Gereksinimler

- Node.js 18+ (önerilen: 20+)
- npm veya yarn
- Expo CLI
- iOS Simulator (Mac) veya Android Emulator
- Firebase projesi
- Google Cloud Vision API key

## 🚀 Kurulum

### 1. Repository'yi Klonla
```bash
git clone <repository-url>
cd saglıklı-beslenme
```

### 2. Bağımlılıkları Yükle
```bash
npm install
```

### 3. Environment Variables
`.env.example` dosyasını `.env` olarak kopyalayın ve Firebase ve Google Cloud Vision API bilgilerinizi girin:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_vision_api_key
```

### 4. Firebase Yapılandırması

#### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

#### Storage Rules
```bash
firebase deploy --only storage:rules
```

#### Cloud Functions (opsiyonel)
```bash
cd firebase/functions
npm install
firebase deploy --only functions
```

### 5. Uygulamayı Çalıştır

```bash
# Development mode
npm start

# iOS (Mac gerekli)
npm run ios

# Android
npm run android

# Clear cache
npm run clear
```

## 📁 Proje Yapısı

```
saglıklı-beslenme/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Home/Camera screen
│   │   ├── map.tsx          # Map screen
│   │   ├── experts.tsx      # Expert posts
│   │   └── profile.tsx      # User profile
│   └── _layout.tsx          # Root layout
│
├── components/              # Reusable components
│   ├── camera/             # Camera components
│   ├── analysis/           # Analysis UI
│   ├── map/                # Map components
│   ├── experts/            # Expert system
│   └── common/             # Common UI
│
├── services/               # Business logic
│   ├── firebase/          # Firebase services
│   ├── vision/            # OCR & analysis
│   └── map/               # Location services
│
├── contexts/              # React Context
│   ├── AuthContext.tsx
│   ├── AnalysisContext.tsx
│   └── LocationContext.tsx
│
├── constants/             # App constants
│   ├── colors.ts
│   ├── config.ts
│   └── additives.ts       # 50+ additives database
│
├── types/                 # TypeScript types
│   ├── user.ts
│   ├── product.ts
│   ├── place.ts
│   └── expert.ts
│
└── firebase/              # Backend
    └── functions/         # Cloud Functions
```

## 🧪 Katkı Maddesi Analizi

Uygulama 3 kategoride 50+ katkı maddesini tespit eder:

### 🔴 Tehlikeli (ALMA)
- E621 (MSG)
- E951 (Aspartam)
- E104-E129 (Sentetik renklendiriciler)
- E211-E213 (Benzoatlar)
- E249-E251 (Nitritler/Nitratlar)
- E320-E321 (BHA/BHT)

### 🟡 Dikkat (MODERATE)
- E102 (Tartrazin)
- E200-E202 (Sorbatlar)
- E330-E331 (Sitrik asit)
- E412-E415 (Zamklar)
- E450-E452 (Fosfatlar)

### 🟢 Güvenli
- E300 (C Vitamini)
- E440 (Pektin)
- E414 (Arap Zamkı)

## 📱 Ekran Görüntüleri

(Ekran görüntüleri eklenecek)

## 🔒 Güvenlik

- Firebase Security Rules aktif
- API key'ler environment variables'da
- Kullanıcı verileri şifreli
- KVKK uyumlu

## 📊 Performans

- OCR yanıt süresi: < 3 saniye
- Map render: < 1 saniye
- App startup: < 2 saniye

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 📧 İletişim

- Email: destek@katkisiz.app
- Website: https://katkisiz.app

## 🙏 Teşekkürler

- Google Cloud Vision API
- Firebase
- Expo Team
- React Native Community

---

**Not**: Bu uygulama geliştirilme aşamasındadır. Production kullanımı için Firebase ve Google Cloud API limitlerini kontrol edin.

## 💰 Maliyet Tahmini

### Google Cloud Vision API
- İlk 1000 istek/ay: Ücretsiz
- Sonrası: $1.50/1000 istek
- **Tahmini**: 10K kullanıcı → ~$150/ay

### Firebase
- Spark (Free): 1GB storage, 10GB transfer
- Blaze (Pay as you go): $0.026/GB storage
- **Tahmini**: ~$50-100/ay (10K kullanıcı)

### Apple Developer
- **$99/yıl** (iOS için zorunlu)

**Toplam**: ~$200-300/ay + $99/yıl
