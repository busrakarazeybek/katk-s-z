import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, elevation = 2 }) => {
  const cardContent = (
    <View
      style={[
        styles.card,
        {
          shadowOpacity: elevation * 0.05,
          shadowRadius: elevation * 2,
          elevation,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
});
