import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary.green,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          backgroundColor: Colors.background.card,
          borderTopWidth: 1,
          borderTopColor: Colors.ui.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tara',
          tabBarIcon: ({ color, size }) => <TabBarIcon name="📸" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Harita',
          tabBarIcon: ({ color, size }) => <TabBarIcon name="🗺️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="experts"
        options={{
          title: 'Uzmanlar',
          tabBarIcon: ({ color, size }) => <TabBarIcon name="👨‍🔬" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <TabBarIcon name="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Simple emoji icon component
const TabBarIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
  return (
    <Text style={{ fontSize: 24, opacity: color === Colors.primary.green ? 1 : 0.6 }}>
      {name}
    </Text>
  );
};
