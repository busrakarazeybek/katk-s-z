import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  DocumentData,
  serverTimestamp,
  GeoPoint,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';
import { Product, Place, ExpertPost, ScanHistory } from '../../types';

/**
 * Generic CRUD operations
 */

export const createDocument = async <T>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as T;
};

export const updateDocument = async <T>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  await deleteDoc(doc(db, collectionName, docId));
};

/**
 * Product operations
 */

export const createProduct = async (product: Partial<Product>): Promise<string> => {
  const productRef = doc(collection(db, 'products'));
  await setDoc(productRef, {
    ...product,
    createdAt: serverTimestamp(),
  });
  return productRef.id;
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  return getDocument<Product>('products', productId);
};

export const getProductsByStatus = async (
  status: 'green' | 'yellow' | 'red',
  limitCount: number = 20
): Promise<Product[]> => {
  const q = query(
    collection(db, 'products'),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

/**
 * Place operations
 */

export const createPlace = async (place: Partial<Place>): Promise<string> => {
  const placeRef = doc(collection(db, 'places'));
  await setDoc(placeRef, {
    ...place,
    createdAt: serverTimestamp(),
    verificationCount: 0,
  });
  return placeRef.id;
};

export const getPlace = async (placeId: string): Promise<Place | null> => {
  return getDocument<Place>('places', placeId);
};

export const getNearbyPlaces = async (
  latitude: number,
  longitude: number,
  radiusInKm: number = 10
): Promise<Place[]> => {
  // Note: For production, use Firestore Geo queries or external service
  // This is a simplified version
  const placesSnapshot = await getDocs(collection(db, 'places'));
  const places = placesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));

  // Simple distance calculation (Haversine would be more accurate)
  return places.filter(place => {
    const distance = calculateDistance(
      latitude,
      longitude,
      place.location.latitude,
      place.location.longitude
    );
    return distance <= radiusInKm;
  });
};

export const addPlaceComment = async (
  placeId: string,
  userId: string,
  userName: string,
  text: string,
  rating?: number
): Promise<void> => {
  const comment = {
    id: Date.now().toString(),
    userId,
    userName,
    text,
    rating,
    upvotes: 0,
    downvotes: 0,
    createdAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'places', placeId), {
    comments: arrayUnion(comment),
    updatedAt: serverTimestamp(),
  });
};

export const verifyPlace = async (placeId: string, userId: string): Promise<void> => {
  await updateDoc(doc(db, 'places', placeId), {
    verifiedBy: arrayUnion(userId),
    verificationCount: increment(1),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Expert Post operations
 */

export const createExpertPost = async (post: Partial<ExpertPost>): Promise<string> => {
  const postRef = doc(collection(db, 'expertPosts'));
  await setDoc(postRef, {
    ...post,
    likes: 0,
    commentCount: 0,
    views: 0,
    published: false,
    createdAt: serverTimestamp(),
  });
  return postRef.id;
};

export const getExpertPost = async (postId: string): Promise<ExpertPost | null> => {
  return getDocument<ExpertPost>('expertPosts', postId);
};

export const getExpertPosts = async (limitCount: number = 20): Promise<ExpertPost[]> => {
  const q = query(
    collection(db, 'expertPosts'),
    where('published', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpertPost));
};

export const likeExpertPost = async (postId: string, userId: string): Promise<void> => {
  await updateDoc(doc(db, 'expertPosts', postId), {
    likes: increment(1),
    likedBy: arrayUnion(userId),
  });
};

export const addExpertPostComment = async (
  postId: string,
  userId: string,
  userName: string,
  text: string
): Promise<void> => {
  const comment = {
    id: Date.now().toString(),
    userId,
    userName,
    text,
    likes: 0,
    createdAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'expertPosts', postId), {
    comments: arrayUnion(comment),
    commentCount: increment(1),
  });
};

/**
 * Scan History operations
 */

export const addScanHistory = async (
  userId: string,
  productId: string,
  result: 'green' | 'yellow' | 'red',
  location?: { latitude: number; longitude: number }
): Promise<void> => {
  const historyRef = doc(collection(db, 'scanHistory'));
  await setDoc(historyRef, {
    userId,
    productId,
    result,
    location: location ? new GeoPoint(location.latitude, location.longitude) : null,
    scannedAt: serverTimestamp(),
  });
};

export const getScanHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<ScanHistory[]> => {
  const q = query(
    collection(db, 'scanHistory'),
    where('userId', '==', userId),
    orderBy('scannedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScanHistory));
};

/**
 * Utility functions
 */

// Calculate distance between two points (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
