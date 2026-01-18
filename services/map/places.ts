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
import { Platform } from 'react-native';

// Mock places for web demo (Istanbul locations - more spread out)
const MOCK_PLACES: NearbyPlace[] = [
  {
    id: '1',
    name: 'Organik Market Kadıköy',
    type: 'market',
    location: {
      latitude: 40.9880,
      longitude: 29.0280,
      address: 'Kadıköy, İstanbul',
    },
    description: 'Tamamen organik ve katkısız ürünler',
    rating: {
      green: 95,
      yellow: 3,
      red: 2,
    },
    status: 'green',
    distance: 0.5,
    addedBy: 'user1',
    verifiedBy: ['user1', 'user2'],
    comments: [],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Doğal Bakkal',
    type: 'bakkal',
    location: {
      latitude: 41.0450,
      longitude: 29.0420,
      address: 'Üsküdar, İstanbul',
    },
    description: 'Yerel ürünler ve temel gıda',
    rating: {
      green: 85,
      yellow: 10,
      red: 5,
    },
    status: 'green',
    distance: 1.2,
    addedBy: 'user2',
    verifiedBy: ['user2'],
    comments: [],
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '3',
    name: 'Taze Manav',
    type: 'manav',
    location: {
      latitude: 41.0180,
      longitude: 29.0620,
      address: 'Kadıköy, İstanbul',
    },
    description: 'Taze meyve ve sebzeler',
    rating: {
      green: 70,
      yellow: 25,
      red: 5,
    },
    status: 'yellow',
    distance: 2.1,
    addedBy: 'user3',
    verifiedBy: [],
    comments: [],
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '4',
    name: 'Köy Fırını',
    type: 'other',
    location: {
      latitude: 40.9780,
      longitude: 29.0520,
      address: 'Maltepe, İstanbul',
    },
    description: 'Köy ekmeği ve katkısız fırın ürünleri',
    rating: {
      green: 50,
      yellow: 30,
      red: 20,
    },
    status: 'red',
    distance: 1.8,
    addedBy: 'user4',
    verifiedBy: ['user4'],
    comments: [],
    createdAt: new Date('2024-01-12'),
  },
  {
    id: '5',
    name: 'Çiftlik Pazarı',
    type: 'other',
    location: {
      latitude: 41.0650,
      longitude: 29.0850,
      address: 'Ümraniye, İstanbul',
    },
    description: 'Doğrudan çiftlikten taze ürünler',
    rating: {
      green: 98,
      yellow: 2,
      red: 0,
    },
    status: 'green',
    distance: 2.5,
    addedBy: 'user5',
    verifiedBy: ['user5', 'user1'],
    comments: [],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '6',
    name: 'BioMarket',
    type: 'organik',
    location: {
      latitude: 41.0380,
      longitude: 29.0180,
      address: 'Üsküdar, İstanbul',
    },
    description: 'Premium organik ve doğal ürünler',
    rating: {
      green: 92,
      yellow: 6,
      red: 2,
    },
    status: 'green',
    distance: 3.2,
    addedBy: 'user6',
    verifiedBy: ['user6'],
    comments: [],
    createdAt: new Date('2024-01-16'),
  },
  {
    id: '7',
    name: 'Köy Ürünleri Satış',
    type: 'other',
    location: {
      latitude: 40.9650,
      longitude: 29.0380,
      address: 'Kartal, İstanbul',
    },
    description: 'Köyden gelen doğal ürünler',
    rating: {
      green: 88,
      yellow: 10,
      red: 2,
    },
    status: 'green',
    distance: 2.8,
    addedBy: 'user7',
    verifiedBy: [],
    comments: [],
    createdAt: new Date('2024-01-17'),
  },
  {
    id: '8',
    name: 'Mahalle Bakkalı Moda',
    type: 'bakkal',
    location: {
      latitude: 40.9830,
      longitude: 29.0220,
      address: 'Moda, İstanbul',
    },
    description: 'Semtin sevilen bakkalı',
    rating: {
      green: 65,
      yellow: 25,
      red: 10,
    },
    status: 'yellow',
    distance: 1.1,
    addedBy: 'user8',
    verifiedBy: ['user8'],
    comments: [],
    createdAt: new Date('2024-01-18'),
  },
  {
    id: '9',
    name: 'Organik Pazar',
    type: 'organik',
    location: {
      latitude: 41.0920,
      longitude: 29.0720,
      address: 'Beykoz, İstanbul',
    },
    description: 'Hafta sonu organik pazar',
    rating: {
      green: 96,
      yellow: 3,
      red: 1,
    },
    status: 'green',
    distance: 4.5,
    addedBy: 'user9',
    verifiedBy: ['user9', 'user1'],
    comments: [],
    createdAt: new Date('2024-01-19'),
  },
  {
    id: '10',
    name: 'Taze Balık Market',
    type: 'market',
    location: {
      latitude: 41.0080,
      longitude: 29.0480,
      address: 'Fenerbahçe, İstanbul',
    },
    description: 'Taze deniz ürünleri',
    rating: {
      green: 78,
      yellow: 18,
      red: 4,
    },
    status: 'yellow',
    distance: 2.3,
    addedBy: 'user10',
    verifiedBy: [],
    comments: [],
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '11',
    name: 'Sebze Hali',
    type: 'manav',
    location: {
      latitude: 40.9480,
      longitude: 29.0680,
      address: 'Maltepe, İstanbul',
    },
    description: 'Toptan ve perakende sebze meyve',
    rating: {
      green: 82,
      yellow: 15,
      red: 3,
    },
    status: 'green',
    distance: 3.1,
    addedBy: 'user11',
    verifiedBy: ['user11'],
    comments: [],
    createdAt: new Date('2024-01-21'),
  },
  {
    id: '12',
    name: 'Doğal Ekmek Fırını',
    type: 'other',
    location: {
      latitude: 41.0280,
      longitude: 29.0320,
      address: 'Kuzguncuk, İstanbul',
    },
    description: 'Ekşi mayalı doğal ekmekler',
    rating: {
      green: 90,
      yellow: 8,
      red: 2,
    },
    status: 'green',
    distance: 1.9,
    addedBy: 'user12',
    verifiedBy: ['user12', 'user2'],
    comments: [],
    createdAt: new Date('2024-01-22'),
  },
  {
    id: '13',
    name: 'Market Plus',
    type: 'market',
    location: {
      latitude: 41.0520,
      longitude: 29.0580,
      address: 'Çengelköy, İstanbul',
    },
    description: 'Geniş ürün yelpazesi',
    rating: {
      green: 45,
      yellow: 35,
      red: 20,
    },
    status: 'red',
    distance: 2.7,
    addedBy: 'user13',
    verifiedBy: [],
    comments: [],
    createdAt: new Date('2024-01-23'),
  },
  {
    id: '14',
    name: 'Çiftçiden Al',
    type: 'other',
    location: {
      latitude: 40.9950,
      longitude: 29.0480,
      address: 'Acıbadem, İstanbul',
    },
    description: 'Direkt çiftçiden alışveriş',
    rating: {
      green: 99,
      yellow: 1,
      red: 0,
    },
    status: 'green',
    distance: 1.5,
    addedBy: 'user14',
    verifiedBy: ['user14', 'user1', 'user2'],
    comments: [],
    createdAt: new Date('2024-01-24'),
  },
  {
    id: '15',
    name: 'Bio Store',
    type: 'organik',
    location: {
      latitude: 40.9620,
      longitude: 29.0820,
      address: 'Pendik, İstanbul',
    },
    description: 'İthal ve yerli organik ürünler',
    rating: {
      green: 91,
      yellow: 7,
      red: 2,
    },
    status: 'green',
    distance: 2.2,
    addedBy: 'user15',
    verifiedBy: ['user15'],
    comments: [],
    createdAt: new Date('2024-01-25'),
  },
];

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
    // Use mock data on web
    if (Platform.OS === 'web') {
      return MOCK_PLACES.map(place => ({
        ...place,
        distance: calculateDistance(
          latitude,
          longitude,
          place.location.latitude,
          place.location.longitude
        ),
      })).sort((a, b) => a.distance - b.distance);
    }

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
    // Fallback to mock data on error
    return MOCK_PLACES;
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
