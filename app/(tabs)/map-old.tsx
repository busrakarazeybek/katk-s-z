import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocation } from '../../contexts/LocationContext';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { NearbyPlace } from '../../types';

export default function MapScreen() {
  const {
    location,
    loading,
    hasPermission,
    nearbyPlaces,
    requestLocationPermission,
    getCurrentLocation,
    fetchNearbyPlaces,
  } = useLocation();

  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  useEffect(() => {
    if (hasPermission && location) {
      loadNearbyPlaces();
    }
  }, [location, hasPermission]);

  const loadNearbyPlaces = async () => {
    try {
      await fetchNearbyPlaces(10); // 10km radius
    } catch (error: any) {
      console.error('Error loading nearby places:', error);
    }
  };

  const handleRequestLocation = async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      await getCurrentLocation();
    }
  };

  const getMarkerColor = (status: string) => {
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

  // No permission yet
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionEmoji}>📍</Text>
          <Text style={styles.permissionTitle}>Konum İzni Gerekli</Text>
          <Text style={styles.permissionText}>
            Yakınınızdaki katkısız ürün satan yerleri göstermek için konum izni gerekiyor.
          </Text>
          <Button
            title="İzin Ver"
            onPress={handleRequestLocation}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Loading location
  if (loading || !location) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading message="Konum alınıyor..." fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Yakındaki Yerler</Text>
        <Text style={styles.subtitle}>
          {nearbyPlaces.length} yer bulundu
        </Text>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {nearbyPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.location.latitude,
              longitude: place.location.longitude,
            }}
            pinColor={getMarkerColor(place.status)}
            onPress={() => setSelectedPlace(place)}
          >
            <View
              style={[
                styles.customMarker,
                { backgroundColor: getMarkerColor(place.status) },
              ]}
            >
              <Text style={styles.markerText}>
                {place.rating.green}%
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Place Info Card */}
      {selectedPlace && (
        <View style={styles.placeCard}>
          <View style={styles.placeHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName}>{selectedPlace.name}</Text>
              <Text style={styles.placeType}>{selectedPlace.type}</Text>
              <Text style={styles.placeDistance}>
                {(selectedPlace.distance / 1000).toFixed(1)} km uzakta
              </Text>
            </View>
            <View
              style={[
                styles.placeStatusBadge,
                { backgroundColor: getMarkerColor(selectedPlace.status) },
              ]}
            >
              <Text style={styles.placeStatusText}>
                {selectedPlace.rating.green}%
              </Text>
            </View>
          </View>
          <Button
            title="Yol Tarifi Al"
            variant="outline"
            size="small"
            onPress={() => {
              Alert.alert('Yol Tarifi', 'Harita uygulaması açılacak...');
            }}
            style={{ marginTop: 12 }}
          />
          <TouchableOpacity
            onPress={() => setSelectedPlace(null)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  placeCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  placeName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  placeType: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  placeDistance: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  placeStatusBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeStatusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  legend: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
