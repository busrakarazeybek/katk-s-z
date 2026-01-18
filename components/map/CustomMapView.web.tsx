import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

// Declare global google object for TypeScript
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

interface CustomMapViewProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChange?: (region: any) => void;
  children?: React.ReactNode;
  showsUserLocation?: boolean;
  customMapStyle?: any[];
  onLongPress?: (event: any) => void;
}

// Context for child components to access map and google objects
export const GoogleMapContext = React.createContext<{
  map: google.maps.Map | null;
  google: typeof google | null;
}>({ map: null, google: null });

export const CustomMapView: React.FC<CustomMapViewProps> = ({
  initialRegion,
  onRegionChange,
  children,
  showsUserLocation = true,
  onLongPress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [googleMaps, setGoogleMaps] = useState<typeof google | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if (window.google && window.google.maps) {
          resolve();
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || ''}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
      });
    };

    const initializeMap = async () => {
      try {
        await loadGoogleMapsScript();

        if (!mapRef.current || !window.google) return;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: {
            lat: initialRegion?.latitude || 41.0082,
            lng: initialRegion?.longitude || 28.9784,
          },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            // Soft, minimal map style
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }],
            },
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
            // Water - soft blue
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e3f2fd' }],
            },
            // Parks - soft green
            {
              featureType: 'landscape.natural',
              elementType: 'geometry',
              stylers: [{ color: '#f1f8e9' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#e8f5e9' }],
            },
            // Roads - very subtle, soft gray
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#ffffff' }, { visibility: 'simplified' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{ color: '#f0f0f0' }],
            },
            // Buildings - soft outline
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }],
            },
            // Transit - hidden
            {
              featureType: 'transit',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        setMap(mapInstance);
        setGoogleMaps(window.google);

        // User location marker
        if (showsUserLocation && initialRegion) {
          userMarkerRef.current = new window.google.maps.Marker({
            position: {
              lat: initialRegion.latitude,
              lng: initialRegion.longitude,
            },
            map: mapInstance,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });
        }

        // Long press handler (right click on web)
        if (onLongPress) {
          mapInstance.addListener('rightclick', (event: any) => {
            onLongPress({
              nativeEvent: {
                coordinate: {
                  latitude: event.latLng.lat(),
                  longitude: event.latLng.lng(),
                },
              },
            });
          });
        }

        // Region change handler
        if (onRegionChange) {
          mapInstance.addListener('idle', () => {
            const center = mapInstance.getCenter();
            if (center) {
              onRegionChange({
                latitude: center.lat(),
                longitude: center.lng(),
              });
            }
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initializeMap();

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Render children with map context */}
      {map && googleMaps && (
        <GoogleMapContext.Provider value={{ map, google: googleMaps }}>
          {children}
        </GoogleMapContext.Provider>
      )}

      {/* Organic corner decoration */}
      <View style={styles.topLeftCorner} />
      <View style={styles.topRightCorner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  topLeftCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderBottomRightRadius: 50,
    backgroundColor: Colors.background.primary,
    opacity: 0.1,
    pointerEvents: 'none',
  },
  topRightCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderBottomLeftRadius: 50,
    backgroundColor: Colors.background.primary,
    opacity: 0.1,
    pointerEvents: 'none',
  },
});
