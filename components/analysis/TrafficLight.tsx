import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ProductStatus } from '../../types';
import { Colors } from '../../constants/colors';

interface TrafficLightProps {
  status: ProductStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

export const TrafficLight: React.FC<TrafficLightProps> = ({
  status,
  size = 'medium',
  showLabel = true,
  animated = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [status]);

  const getCircleSize = () => {
    switch (size) {
      case 'small':
        return 60;
      case 'large':
        return 150;
      default:
        return 100;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'green':
        return Colors.primary.green;
      case 'yellow':
        return Colors.primary.yellow;
      case 'red':
        return Colors.primary.red;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'green':
        return 'AL';
      case 'yellow':
        return 'DİKKAT';
      case 'red':
        return 'ALMA';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'green':
        return 'Katkı maddesi yok';
      case 'yellow':
        return 'Katkı maddesi var';
      case 'red':
        return 'Tehlikeli katkı var';
    }
  };

  const circleSize = getCircleSize();
  const fontSize = size === 'small' ? 16 : size === 'large' ? 32 : 24;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: getColor(),
          },
        ]}
      >
        <Text style={[styles.label, { fontSize }]}>{getLabel()}</Text>
      </View>
      {showLabel && (
        <Text style={styles.description}>{getDescription()}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 1,
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
