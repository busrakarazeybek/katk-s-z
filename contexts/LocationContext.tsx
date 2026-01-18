import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location as LocationType, Place, NearbyPlace } from '../types';
import { getNearbyPlaces } from '../services/map/places';
import { StorageKeys } from '../constants/config';
import { Platform } from 'react-native';

interface LocationContextType {
  location: LocationType | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  nearbyPlaces: NearbyPlace[];
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationType | null>;
  fetchNearbyPlaces: (radiusKm?: number) => Promise<NearbyPlace[]>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  useEffect(() => {
    loadCachedLocation();
    checkPermission();
  }, []);

  const loadCachedLocation = async () => {
    try {
      const cachedLocation = await AsyncStorage.getItem(StorageKeys.LAST_LOCATION);
      if (cachedLocation) {
        setLocation(JSON.parse(cachedLocation));
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
    }
  };

  const checkPermission = async () => {
    try {
      // On web, auto-grant permission with default location
      if (Platform.OS === 'web') {
        console.log('[LocationContext] Web: Setting default location and fetching places');
        setHasPermission(true);
        // Set default Istanbul location for web demo
        const defaultLocation: LocationType = {
          latitude: 41.0082,
          longitude: 28.9784,
        };
        setLocation(defaultLocation);

        // Fetch nearby places for web demo
        setTimeout(async () => {
          try {
            const places = await getNearbyPlaces(defaultLocation, 10);
            console.log('[LocationContext] Web: Fetched', places.length, 'places');
            setNearbyPlaces(places);
          } catch (error) {
            console.error('[LocationContext] Error fetching places:', error);
          }
        }, 100);

        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        await getCurrentLocation();
      }

      return granted;
    } catch (error: any) {
      setError(error.message || 'Konum izni alınamadı');
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationType | null> => {
    try {
      setLoading(true);
      setError(null);

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLocation: LocationType = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      };

      setLocation(currentLocation);
      await AsyncStorage.setItem(
        StorageKeys.LAST_LOCATION,
        JSON.stringify(currentLocation)
      );

      return currentLocation;
    } catch (error: any) {
      const errorMessage = error.message || 'Konum alınamadı';
      setError(errorMessage);
      console.error('Error getting location:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyPlaces = async (radiusKm: number = 10): Promise<NearbyPlace[]> => {
    if (!location) {
      throw new Error('Konum bilgisi mevcut değil');
    }

    try {
      setLoading(true);

      const places = await getNearbyPlaces(
        location.latitude,
        location.longitude,
        radiusKm
      );

      // Calculate distance for each place
      const placesWithDistance: NearbyPlace[] = places.map((place) => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          place.location.latitude,
          place.location.longitude
        );

        return {
          ...place,
          distance,
        };
      });

      // Sort by distance
      placesWithDistance.sort((a, b) => a.distance - b.distance);

      setNearbyPlaces(placesWithDistance);
      return placesWithDistance;
    } catch (error: any) {
      const errorMessage = error.message || 'Yakındaki yerler alınamadı';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    location,
    loading,
    error,
    hasPermission,
    nearbyPlaces,
    requestLocationPermission,
    getCurrentLocation,
    fetchNearbyPlaces,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

// Utility: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
