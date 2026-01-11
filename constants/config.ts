// App configuration constants

export const AppConfig = {
  name: 'Katkısız',
  version: '1.0.0',
  buildNumber: 1,

  // API endpoints
  api: {
    baseUrl: __DEV__ ? 'http://localhost:5001' : 'https://api.katkisiz.app',
    timeout: 30000, // 30 seconds
  },

  // Firebase config (will be populated from environment)
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },

  // Google Cloud Vision API
  vision: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY,
    endpoint: 'https://vision.googleapis.com/v1/images:annotate',
    features: {
      textDetection: 'TEXT_DETECTION',
      documentTextDetection: 'DOCUMENT_TEXT_DETECTION',
    },
  },

  // Map configuration
  map: {
    defaultRegion: {
      latitude: 39.9334, // Turkey center
      longitude: 32.8597,
      latitudeDelta: 5,
      longitudeDelta: 5,
    },
    maxDistance: 10000, // 10km max for nearby places
    minZoomForPlaces: 13,
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Image processing
  image: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'jpeg',
  },

  // Cache duration (in milliseconds)
  cache: {
    products: 1000 * 60 * 60, // 1 hour
    places: 1000 * 60 * 30,   // 30 minutes
    expertPosts: 1000 * 60 * 15, // 15 minutes
  },

  // Features flags
  features: {
    barcodeScanner: false, // Coming soon
    socialSharing: true,
    pushNotifications: true,
    offlineMode: false, // Coming soon
    darkMode: true,
  },

  // Support
  support: {
    email: 'destek@katkisiz.app',
    website: 'https://katkisiz.app',
    privacyPolicy: 'https://katkisiz.app/privacy',
    termsOfService: 'https://katkisiz.app/terms',
  },

  // Analytics
  analytics: {
    enabled: !__DEV__,
    trackScreenViews: true,
    trackUserActions: true,
  },
} as const;

// Storage keys for AsyncStorage
export const StorageKeys = {
  USER: '@user',
  AUTH_TOKEN: '@auth_token',
  PREFERENCES: '@preferences',
  SCAN_HISTORY: '@scan_history',
  FAVORITES: '@favorites',
  LAST_LOCATION: '@last_location',
  ONBOARDING_COMPLETED: '@onboarding_completed',
} as const;

// Error messages
export const ErrorMessages = {
  NETWORK_ERROR: 'İnternet bağlantısı yok. Lütfen tekrar deneyin.',
  CAMERA_PERMISSION: 'Kamera izni gerekli. Lütfen ayarlardan izin verin.',
  LOCATION_PERMISSION: 'Konum izni gerekli. Lütfen ayarlardan izin verin.',
  IMAGE_PROCESSING_ERROR: 'Görüntü işlenirken hata oluştu.',
  OCR_ERROR: 'Metin okunamadı. Daha net bir fotoğraf çekin.',
  ANALYSIS_ERROR: 'Analiz yapılamadı. Lütfen tekrar deneyin.',
  AUTH_ERROR: 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.',
  GENERIC_ERROR: 'Bir hata oluştu. Lütfen tekrar deneyin.',
} as const;
