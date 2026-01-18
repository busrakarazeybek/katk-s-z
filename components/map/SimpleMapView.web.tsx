import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { NearbyPlace } from '../../types';

declare global {
  interface Window {
    L: any;
  }
}

interface SimpleMapViewProps {
  places: NearbyPlace[];
  onPlacePress?: (place: NearbyPlace) => void;
  userLocation: {
    latitude: number;
    longitude: number;
  };
}

export const SimpleMapView: React.FC<SimpleMapViewProps> = ({
  places,
  onPlacePress,
  userLocation,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    console.log('[SimpleMapView] Component mounted, loading Leaflet...');

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      console.log('[SimpleMapView] Leaflet loaded successfully');
      setTimeout(() => initMap(), 100); // Small delay to ensure DOM is ready
    };
    script.onerror = () => {
      console.error('[SimpleMapView] Failed to load Leaflet');
    };
    document.body.appendChild(script);

    return () => {
      if (mapRef.current) {
        console.log('[SimpleMapView] Cleaning up map');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && window.L) {
      updateMarkers();
    }
  }, [places]);

  const initMap = () => {
    console.log('[SimpleMapView] initMap called', {
      hasLeaflet: !!window.L,
      hasMap: !!mapRef.current,
      userLocation,
    });

    if (!window.L) {
      console.error('[SimpleMapView] Leaflet not loaded yet');
      return;
    }

    if (mapRef.current) {
      console.log('[SimpleMapView] Map already exists');
      return;
    }

    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement) {
      console.error('[SimpleMapView] Map container not found');
      return;
    }

    const L = window.L;

    console.log('[SimpleMapView] Creating map...');

    // Create map
    const map = L.map('leaflet-map', {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 13,
      zoomControl: true,
    });

    console.log('[SimpleMapView] Map created successfully');

    // Add gray-toned OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      className: 'grayscale-tiles',
    }).addTo(map);

    // Apply organic green tone CSS filter
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      (tilePane as HTMLElement).style.filter = 'sepia(30%) hue-rotate(60deg) saturate(0.8) brightness(1.15) contrast(0.9)';
    }

    // Add user location marker
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="
            width: 16px;
            height: 16px;
            background: #4285F4;
            border: 3px solid white;
            border-radius: 50%;
            position: absolute;
            left: 4px;
            top: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 2;
          "></div>
          <div style="
            width: 24px;
            height: 24px;
            background: #4285F4;
            opacity: 0.3;
            border-radius: 50%;
            position: absolute;
            animation: pulse 2s ease-out infinite;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
    });

    L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
      .addTo(map)
      .bindPopup('<strong>Konumunuz</strong>');

    console.log('[SimpleMapView] User marker added');

    mapRef.current = map;

    console.log('[SimpleMapView] Calling updateMarkers with', places.length, 'places');
    updateMarkers();
  };

  const updateMarkers = () => {
    console.log('[SimpleMapView] updateMarkers called', {
      hasMap: !!mapRef.current,
      hasLeaflet: !!window.L,
      placesCount: places.length,
    });

    if (!mapRef.current || !window.L) {
      console.error('[SimpleMapView] Cannot update markers - missing map or Leaflet');
      return;
    }

    const L = window.L;
    const map = mapRef.current;

    // Clear existing markers
    console.log('[SimpleMapView] Clearing', markersRef.current.length, 'existing markers');
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add place markers
    console.log('[SimpleMapView] Adding', places.length, 'place markers');
    places.forEach((place, index) => {
      console.log(`[SimpleMapView] Creating marker ${index + 1}/${places.length} for:`, place.name);
      const color = getPinColor(place.status);
      const icon = getPlaceIcon(place);

      const placeIcon = L.divIcon({
        className: 'place-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            background: white;
            border: 2px solid ${color};
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            font-size: 28px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${icon}
            ${place.rating.green > 0 ? `
              <div style="
                position: absolute;
                top: -6px;
                right: -10px;
                background: ${color};
                border: 2px solid white;
                border-radius: 12px;
                padding: 3px 7px;
                font-size: 10px;
                font-weight: 700;
                color: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                line-height: 1;
              ">
                ${place.rating.green}%
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [44, 44],
      });

      const marker = L.marker([place.location.latitude, place.location.longitude], {
        icon: placeIcon,
      }).addTo(map);

      marker.on('click', () => {
        console.log('[SimpleMapView] Marker clicked:', place.name);
        setSelectedPlace(place);
        onPlacePress?.(place);
      });

      const exampleProducts = getExampleProducts(place);

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 200px; max-width: 280px;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #333;">
            ${place.name}
          </h3>
          <p style="margin: 4px 0; font-size: 13px; color: #666;">
            ${icon} ${getTypeName(place.type)}
          </p>
          ${place.rating.green > 0 ? `
            <p style="margin: 6px 0 4px 0; font-size: 13px; color: ${color}; font-weight: 600;">
              ✓ ${place.rating.green}% Katkısız Ürün
            </p>
          ` : ''}
          <p style="margin: 4px 0 8px 0; font-size: 12px; color: #999;">
            📍 ~${place.distance.toFixed(1)} km uzaklıkta
          </p>
          ${exampleProducts.length > 0 ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #999; font-weight: 500; text-transform: uppercase;">
                Örnek Ürünler
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${exampleProducts.map(product => `
                  <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 6px 8px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    min-width: 50px;
                  ">
                    <span style="font-size: 20px; margin-bottom: 2px;">${product.icon}</span>
                    <span style="font-size: 9px; color: #666; text-align: center; line-height: 1.2;">${product.name}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `);

      markersRef.current.push(marker);
      console.log(`[SimpleMapView] Marker ${index + 1} added successfully at`, place.location.latitude, place.location.longitude);
    });

    console.log('[SimpleMapView] All markers added. Total:', markersRef.current.length);
  };

  const getPinColor = (status: string) => {
    switch (status) {
      case 'green':
        return Colors.primary.green;
      case 'yellow':
        return Colors.primary.yellow;
      case 'red':
        return Colors.primary.red;
      default:
        return Colors.ui.border;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'market':
        return 'Market';
      case 'bakkal':
        return 'Bakkal';
      case 'manav':
        return 'Manav';
      case 'organik':
        return 'Organik Ürünler';
      default:
        return 'Mekan';
    }
  };

  const getExampleProducts = (place: NearbyPlace) => {
    const name = place.name.toLowerCase();

    // Farm / Pazar
    if (name.includes('çiftlik') || name.includes('pazar')) {
      return [
        { icon: '🥕', name: 'Havuç' },
        { icon: '🥬', name: 'Marul' },
        { icon: '🥚', name: 'Yumurta' },
        { icon: '🍅', name: 'Domates' },
      ];
    }

    // Bakery / Fırın
    if (name.includes('fırın') || name.includes('ekmek')) {
      return [
        { icon: '🍞', name: 'Ekmek' },
        { icon: '🥐', name: 'Çörek' },
        { icon: '🥖', name: 'Somun' },
        { icon: '🧈', name: 'Tereyağı' },
      ];
    }

    // Based on type
    switch (place.type) {
      case 'market':
        return [
          { icon: '🥛', name: 'Süt' },
          { icon: '🥚', name: 'Yumurta' },
          { icon: '🧀', name: 'Peynir' },
          { icon: '🍞', name: 'Ekmek' },
          { icon: '🥕', name: 'Sebze' },
        ];
      case 'bakkal':
        return [
          { icon: '💧', name: 'Su' },
          { icon: '🍞', name: 'Ekmek' },
          { icon: '🥫', name: 'Konserve' },
          { icon: '🧃', name: 'İçecek' },
        ];
      case 'manav':
        return [
          { icon: '🍎', name: 'Elma' },
          { icon: '🍊', name: 'Portakal' },
          { icon: '🥕', name: 'Havuç' },
          { icon: '🥬', name: 'Yeşillik' },
          { icon: '🍅', name: 'Domates' },
        ];
      case 'organik':
        return [
          { icon: '🌱', name: 'Organik Sebze' },
          { icon: '🥚', name: 'Köy Yumurtası' },
          { icon: '🍯', name: 'Bal' },
          { icon: '🥛', name: 'Organik Süt' },
        ];
      default:
        return [
          { icon: '🥕', name: 'Taze Ürün' },
          { icon: '🌾', name: 'Doğal Gıda' },
          { icon: '🍞', name: 'Ekmek' },
        ];
    }
  };

  const getPlaceIcon = (place: NearbyPlace) => {
    const name = place.name.toLowerCase();

    // Check name first for special cases
    if (name.includes('çiftlik') || name.includes('pazar')) {
      return '🥕';
    }
    if (name.includes('fırın') || name.includes('ekmek')) {
      return '🥐';
    }
    if (name.includes('köy')) {
      return '🌾';
    }

    // Then check by type
    switch (place.type) {
      case 'market':
        return '🛒';
      case 'bakkal':
        return '🏪';
      case 'manav':
        return '🍎';
      case 'organik':
        return '🌱';
      default:
        return '📍';
    }
  };

  return (
    <View style={styles.container}>
      {/* Leaflet Map Container */}
      <div
        id="leaflet-map"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary.green }]} />
          <Text style={styles.legendText}>Katkısız</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary.yellow }]} />
          <Text style={styles.legendText}>Karışık</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary.red }]} />
          <Text style={styles.legendText}>Katkılı</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  legend: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});
