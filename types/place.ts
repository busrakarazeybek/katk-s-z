import { Timestamp } from 'firebase/firestore';

export type PlaceType = 'market' | 'bakkal' | 'manav' | 'restoran' | 'sarkuteri' | 'organik';
export type PlaceStatus = 'green' | 'yellow' | 'red';

export interface PlaceLocation {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  district?: string;
}

export interface PlaceRating {
  green: number; // Percentage or count
  yellow: number;
  red: number;
  totalProducts?: number;
}

export interface PlaceComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  rating?: number; // 1-5 stars
  upvotes: number;
  downvotes: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Place {
  id: string;
  name: string;
  location: PlaceLocation;
  type: PlaceType;
  rating: PlaceRating;
  status: PlaceStatus; // Auto-calculated from rating
  description?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  imageUrls?: string[];
  addedBy: string;
  verifiedBy?: string[]; // Array of user uids who verified
  verificationCount: number;
  comments: PlaceComment[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface NearbyPlace extends Place {
  distance: number; // in meters
}
