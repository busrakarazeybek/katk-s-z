import React, { useRef, useState } from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import MapView, { Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors } from '../../constants/colors';

interface CustomMapViewProps {
  initialRegion?: Region;
  onRegionChange?: (region: Region) => void;
  children?: React.ReactNode;
  showsUserLocation?: boolean;
  customMapStyle?: any[];
}

// Minimalist, organic custom map style (not satellite)
const CUSTOM_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#C8E6C9" }] // Soft green for parks
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#4CAF50" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#E8E8E8" }] // Light gray roads
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#BBDEFB" }] // Soft blue for water
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#2196F3" }]
  }
];

export const CustomMapView: React.FC<CustomMapViewProps> = ({
  initialRegion,
  onRegionChange,
  children,
  showsUserLocation = true,
  customMapStyle = CUSTOM_MAP_STYLE,
}) => {
  const mapRef = useRef<MapView>(null);
  const [isReady, setIsReady] = useState(false);

  const handleRegionChangeComplete = (region: Region) => {
    if (onRegionChange) {
      onRegionChange(region);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        customMapStyle={customMapStyle}
        onMapReady={() => setIsReady(true)}
        mapPadding={{
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      >
        {isReady && children}
      </MapView>

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
  map: {
    flex: 1,
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
