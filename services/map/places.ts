import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  getDoc,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { calculateDistance } from './location';
import { NearbyPlace, PlaceComment } from '../../types';

/**
 * Create a new place
 */
export const createPlace = async (
  userId: string,
  data: {
    name: string;
    type: 'market' | 'bakkal' | 'manav' | 'restoran' | 'other';
    latitude: number;
    longitude: number;
    address?: string;
    description?: string;
    rating?: {
      green: number;
      yellow: number;
      red: number;
    };
  }
): Promise<string> => {
  try {
    // Calculate status based on rating
    const rating = data.rating || { green: 0, yellow: 0, red: 0 };
    const total = rating.green + rating.yellow + rating.red;
    let status: 'green' | 'yellow' | 'red' = 'green';

    if (total > 0) {
      const greenPercentage = (rating.green / total) * 100;
      const redPercentage = (rating.red / total) * 100;

      if (redPercentage > 30) {
        status = 'red';
      } else if (greenPercentage < 50) {
        status = 'yellow';
      }
    }

    const placeData = {
      name: data.name,
      type: data.type,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address || '',
      },
      description: data.description || '',
      rating,
      status,
      addedBy: userId,
      verifiedBy: [],
      comments: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'places'), placeData);
    console.log('Place created:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating place:', error);
    throw new Error(error.message || 'Mekan eklenemedi');
  }
};

/**
 * Get nearby places
 */
export const getNearbyPlaces = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<NearbyPlace[]> => {
  try {
    // Simple bounding box query (not perfect but works for small areas)
    const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111km
    const lonDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));

    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;

    const placesRef = collection(db, 'places');
    const q = query(
      placesRef,
      where('location.latitude', '>=', minLat),
      where('location.latitude', '<=', maxLat),
      orderBy('location.latitude')
    );

    const querySnapshot = await getDocs(q);
    const places: NearbyPlace[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const distance = calculateDistance(
        latitude,
        longitude,
        data.location.latitude,
        data.location.longitude
      );

      // Filter by actual distance
      if (distance <= radiusKm) {
        places.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          location: data.location,
          description: data.description,
          rating: data.rating,
          status: data.status,
          distance,
          addedBy: data.addedBy,
          verifiedBy: data.verifiedBy || [],
          comments: data.comments || [],
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      }
    });

    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);

    return places;
  } catch (error: any) {
    console.error('Error getting nearby places:', error);
    throw new Error(error.message || 'Mekanlar yüklenemedi');
  }
};

/**
 * Get place by ID
 */
export const getPlaceById = async (placeId: string): Promise<NearbyPlace | null> => {
  try {
    const placeRef = doc(db, 'places', placeId);
    const placeSnap = await getDoc(placeRef);

    if (!placeSnap.exists()) {
      return null;
    }

    const data = placeSnap.data();

    return {
      id: placeSnap.id,
      name: data.name,
      type: data.type,
      location: data.location,
      description: data.description,
      rating: data.rating,
      status: data.status,
      distance: 0, // Distance not available without user location
      addedBy: data.addedBy,
      verifiedBy: data.verifiedBy || [],
      comments: data.comments || [],
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error: any) {
    console.error('Error getting place:', error);
    throw new Error(error.message || 'Mekan bilgisi alınamadı');
  }
};

/**
 * Update place
 */
export const updatePlace = async (
  placeId: string,
  updates: {
    name?: string;
    type?: 'market' | 'bakkal' | 'manav' | 'restoran' | 'other';
    description?: string;
    rating?: {
      green: number;
      yellow: number;
      red: number;
    };
  }
): Promise<void> => {
  try {
    const placeRef = doc(db, 'places', placeId);

    // Recalculate status if rating is updated
    let status: 'green' | 'yellow' | 'red' | undefined;
    if (updates.rating) {
      const total = updates.rating.green + updates.rating.yellow + updates.rating.red;
      if (total > 0) {
        const greenPercentage = (updates.rating.green / total) * 100;
        const redPercentage = (updates.rating.red / total) * 100;

        if (redPercentage > 30) {
          status = 'red';
        } else if (greenPercentage < 50) {
          status = 'yellow';
        } else {
          status = 'green';
        }
      }
    }

    await updateDoc(placeRef, {
      ...updates,
      ...(status && { status }),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error updating place:', error);
    throw new Error(error.message || 'Mekan güncellenemedi');
  }
};

/**
 * Add comment to place
 */
export const addPlaceComment = async (
  placeId: string,
  userId: string,
  userName: string,
  text: string,
  rating?: number
): Promise<void> => {
  try {
    const placeRef = doc(db, 'places', placeId);

    const comment = {
      userId,
      userName,
      text,
      rating: rating || 0,
      createdAt: Timestamp.now(),
    };

    await updateDoc(placeRef, {
      comments: arrayUnion(comment),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    throw new Error(error.message || 'Yorum eklenemedi');
  }
};

/**
 * Verify place (add to verifiedBy list)
 */
export const verifyPlace = async (placeId: string, userId: string): Promise<void> => {
  try {
    const placeRef = doc(db, 'places', placeId);

    await updateDoc(placeRef, {
      verifiedBy: arrayUnion(userId),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error verifying place:', error);
    throw new Error(error.message || 'Mekan doğrulanamadı');
  }
};

/**
 * Update place rating
 */
export const updatePlaceRating = async (
  placeId: string,
  productStatus: 'green' | 'yellow' | 'red'
): Promise<void> => {
  try {
    const placeRef = doc(db, 'places', placeId);
    const placeSnap = await getDoc(placeRef);

    if (!placeSnap.exists()) {
      throw new Error('Mekan bulunamadı');
    }

    const data = placeSnap.data();
    const currentRating = data.rating || { green: 0, yellow: 0, red: 0 };

    // Increment the appropriate counter
    const newRating = { ...currentRating };
    newRating[productStatus] = (newRating[productStatus] || 0) + 1;

    // Recalculate status
    const total = newRating.green + newRating.yellow + newRating.red;
    let status: 'green' | 'yellow' | 'red' = 'green';

    if (total > 0) {
      const greenPercentage = (newRating.green / total) * 100;
      const redPercentage = (newRating.red / total) * 100;

      if (redPercentage > 30) {
        status = 'red';
      } else if (greenPercentage < 50) {
        status = 'yellow';
      }
    }

    await updateDoc(placeRef, {
      rating: newRating,
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error updating place rating:', error);
    throw new Error(error.message || 'Mekan puanı güncellenemedi');
  }
};

/**
 * Get places by user
 */
export const getUserPlaces = async (userId: string): Promise<NearbyPlace[]> => {
  try {
    const placesRef = collection(db, 'places');
    const q = query(
      placesRef,
      where('addedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const places: NearbyPlace[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      places.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        location: data.location,
        description: data.description,
        rating: data.rating,
        status: data.status,
        distance: 0,
        addedBy: data.addedBy,
        verifiedBy: data.verifiedBy || [],
        comments: data.comments || [],
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return places;
  } catch (error: any) {
    console.error('Error getting user places:', error);
    throw new Error(error.message || 'Kullanıcı mekanları yüklenemedi');
  }
};
