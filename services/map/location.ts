import * as Location from 'expo-location';
import { Platform, Linking } from 'react-native';

/**
 * Request location permission
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Check if location permission is granted
 */
export const hasLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Get current location
 */
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  try {
    const hasPermission = await hasLocationPermission();

    if (!hasPermission) {
      throw new Error('Konum izni verilmedi');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error: any) {
    console.error('Error getting current location:', error);
    throw new Error(error.message || 'Konum alınamadı');
  }
};

/**
 * Watch location changes
 */
export const watchLocation = async (
  callback: (location: { latitude: number; longitude: number }) => void
): Promise<Location.LocationSubscription> => {
  try {
    const hasPermission = await hasLocationPermission();

    if (!hasPermission) {
      throw new Error('Konum izni verilmedi');
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );

    return subscription;
  } catch (error: any) {
    console.error('Error watching location:', error);
    throw new Error(error.message || 'Konum takibi başlatılamadı');
  }
};

/**
 * Calculate distance between two coordinates (in km)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get address from coordinates
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (results && results.length > 0) {
      const address = results[0];
      const parts = [];

      if (address.street) parts.push(address.street);
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.district) parts.push(address.district);
      if (address.city) parts.push(address.city);

      return parts.join(', ') || 'Adres bulunamadı';
    }

    return 'Adres bulunamadı';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return 'Adres bulunamadı';
  }
};

/**
 * Open directions in maps app
 */
export const openDirections = async (
  latitude: number,
  longitude: number,
  placeName?: string
): Promise<void> => {
  try {
    const label = placeName ? encodeURIComponent(placeName) : 'Hedef';

    let url = '';

    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${latitude},${longitude}&q=${label}`;
    } else {
      url = `geo:0,0?q=${latitude},${longitude}(${label})`;
    }

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
    }
  } catch (error: any) {
    console.error('Error opening directions:', error);
    throw new Error('Yol tarifi açılamadı');
  }
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};
