import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Place } from '../../types';
import { Colors } from '../../constants/colors';

interface LocationPinProps {
  place: Place;
  onPress?: (place: Place) => void;
  size?: 'small' | 'medium' | 'large';
}

export const LocationPin: React.FC<LocationPinProps> = ({
  place,
  onPress,
  size = 'medium',
}) => {
  const getColor = () => {
    switch (place.status) {
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

  const getSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 70;
      default:
        return 55;
    }
  };

  const getIcon = () => {
    switch (place.type) {
      case 'market':
        return '🏪';
      case 'bakkal':
        return '🏬';
      case 'manav':
        return '🥬';
      case 'restoran':
        return '🍽️';
      case 'sarkuteri':
        return '🥖';
      case 'organik':
        return '🌿';
      default:
        return '📍';
    }
  };

  const pinSize = getSize();
  const color = getColor();

  return (
    <Marker
      coordinate={{
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      }}
      onPress={() => onPress?.(place)}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        {/* Main pin circle */}
        <View
          style={[
            styles.pinCircle,
            {
              width: pinSize,
              height: pinSize,
              borderRadius: pinSize / 2,
              backgroundColor: color,
            },
          ]}
        >
          {/* Icon */}
          <Text style={[styles.icon, { fontSize: pinSize * 0.4 }]}>
            {getIcon()}
          </Text>

          {/* Green percentage badge */}
          {place.rating.green > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{place.rating.green}%</Text>
            </View>
          )}
        </View>

        {/* Pin stem */}
        <View style={[styles.stem, { backgroundColor: color }]} />

        {/* Pin shadow */}
        <View style={styles.shadow} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pinCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  icon: {
    marginTop: -4,
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: Colors.primary.green,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary.green,
  },
  stem: {
    width: 3,
    height: 12,
    marginTop: -1,
  },
  shadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#000',
    opacity: 0.2,
    marginTop: 2,
  },
});
