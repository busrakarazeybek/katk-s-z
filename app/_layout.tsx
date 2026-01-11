import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { AnalysisProvider } from '../contexts/AnalysisContext';
import { LocationProvider } from '../contexts/LocationContext';
import { PaperProvider } from 'react-native-paper';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AnalysisProvider>
          <LocationProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background.primary },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
          </LocationProvider>
        </AnalysisProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
