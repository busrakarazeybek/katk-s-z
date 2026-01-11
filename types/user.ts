import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'expert' | 'admin';

export interface ExpertProfile {
  verified: boolean;
  articleUrl: string;
  specialization: string;
  institution: string;
  verifiedAt?: Timestamp;
  verifiedBy?: string; // Admin uid
}

export interface UserPreferences {
  notifications: boolean;
  location: boolean;
  darkMode?: boolean;
  language?: 'tr' | 'en';
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  preferences: UserPreferences;
  expertProfile?: ExpertProfile;
}

export interface UserStats {
  totalScans: number;
  greenProducts: number;
  yellowProducts: number;
  redProducts: number;
  placesAdded: number;
  commentsCount: number;
}
