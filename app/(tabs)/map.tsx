import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { NearbyPlace } from '../../types';
import { CustomMapView } from '../../components/map/CustomMapView';
import { LocationPin } from '../../components/map/LocationPin';
import { PlaceCard } from '../../components/map/PlaceCard';
import { CommentSheet } from '../../components/map/CommentSheet';
import { AddPlaceSheet, AddPlaceData } from '../../components/map/AddPlaceSheet';
import { createPlace, addPlaceComment as addComment } from '../../services/map/places';
import { openDirections, getAddressFromCoordinates } from '../../services/map/location';

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

  const { user } = useAuth();

  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [addPlaceLocation, setAddPlaceLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

  const handleGetDirections = async (place: NearbyPlace) => {
    try {
      await openDirections(
        place.location.latitude,
        place.location.longitude,
        place.name
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleAddComment = (place: NearbyPlace) => {
    setSelectedPlace(place);
    setShowComments(true);
  };

  const handleSubmitComment = async (
    placeId: string,
    text: string,
    rating?: number
  ) => {
    if (!user) throw new Error('Giriş gerekli');

    await addComment(placeId, user.uid, user.displayName, text, rating);
    await loadNearbyPlaces(); // Refresh
  };

  const handleViewDetails = (place: NearbyPlace) => {
    // TODO: Navigate to place detail screen
    Alert.alert(place.name, 'Detay ekranı yakında eklenecek...');
  };

  const handleMapLongPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    Alert.alert(
      'Mekan Ekle',
      'Bu konuma mekan eklemek ister misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ekle',
          onPress: async () => {
            setAddPlaceLocation({ latitude, longitude });
            setShowAddPlace(true);
          },
        },
      ]
    );
  };

  const handleSubmitPlace = async (data: AddPlaceData) => {
    if (!user) throw new Error('Giriş gerekli');

    await createPlace(user.uid, data);
    await loadNearbyPlaces(); // Refresh
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Yakındaki Yerler</Text>
          <Text style={styles.subtitle}>
            {nearbyPlaces.length} yer bulundu
          </Text>
        </View>
        <Button
          title="+ Mekan Ekle"
          onPress={() => {
            if (location) {
              setAddPlaceLocation(location);
              setShowAddPlace(true);
            }
          }}
          variant="primary"
          size="small"
        />
      </View>

      {/* Map */}
      <CustomMapView
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        // @ts-ignore
        onLongPress={handleMapLongPress}
      >
        {nearbyPlaces.map((place) => (
          <LocationPin
            key={place.id}
            place={place}
            onPress={(p) => setSelectedPlace(p)}
          />
        ))}
      </CustomMapView>

      {/* Place info card */}
      {selectedPlace && !showComments && (
        <View style={styles.placeCardContainer}>
          <PlaceCard
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
            onGetDirections={handleGetDirections}
            onAddComment={handleAddComment}
            onViewDetails={handleViewDetails}
          />
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

      {/* Comment sheet */}
      <CommentSheet
        visible={showComments}
        place={selectedPlace}
        onClose={() => {
          setShowComments(false);
          setSelectedPlace(null);
        }}
        onSubmitComment={handleSubmitComment}
      />

      {/* Add place sheet */}
      <AddPlaceSheet
        visible={showAddPlace}
        onClose={() => setShowAddPlace(false)}
        onSubmit={handleSubmitPlace}
        initialLocation={addPlaceLocation || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  placeCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  legend: {
    position: 'absolute',
    top: 100,
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
