import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { AppConfig } from '../../constants/config';
import { Platform } from 'react-native';

// Check if running on web
const isWeb = Platform.OS === 'web';

// Mock Firebase services for web demo
const createMockAuth = (): any => ({
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase disabled in demo')),
  createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase disabled in demo')),
  signOut: () => Promise.resolve(),
});

const createMockDb = (): any => ({
  collection: () => ({
    doc: () => ({
      get: () => Promise.reject(new Error('Firebase disabled in demo')),
      set: () => Promise.reject(new Error('Firebase disabled in demo')),
    }),
  }),
});

const createMockStorage = (): any => ({
  ref: () => ({
    put: () => Promise.reject(new Error('Firebase disabled in demo')),
    getDownloadURL: () => Promise.reject(new Error('Firebase disabled in demo')),
  }),
});

let app: FirebaseApp | null = null;
let auth: Auth | any;
let db: Firestore | any;
let storage: FirebaseStorage | any;

if (isWeb) {
  // Use mock services for web demo
  console.log('Firebase disabled for web demo');
  app = null;
  auth = createMockAuth();
  db = createMockDb();
  storage = createMockStorage();
} else {
  // Initialize Firebase for mobile
  const firebaseConfig = {
    apiKey: AppConfig.firebase.apiKey,
    authDomain: AppConfig.firebase.authDomain,
    projectId: AppConfig.firebase.projectId,
    storageBucket: AppConfig.firebase.storageBucket,
    messagingSenderId: AppConfig.firebase.messagingSenderId,
    appId: AppConfig.firebase.appId,
  };

  // Initialize Firebase app (singleton pattern)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };
export default app;
