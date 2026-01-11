import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { AppConfig } from '../../constants/config';

// Initialize Firebase
const firebaseConfig = {
  apiKey: AppConfig.firebase.apiKey,
  authDomain: AppConfig.firebase.authDomain,
  projectId: AppConfig.firebase.projectId,
  storageBucket: AppConfig.firebase.storageBucket,
  messagingSenderId: AppConfig.firebase.messagingSenderId,
  appId: AppConfig.firebase.appId,
};

// Initialize Firebase app (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
