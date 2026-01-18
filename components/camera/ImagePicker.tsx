import React from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePickerLib from 'expo-image-picker';

interface UseImagePickerProps {
  onImageSelected: (uri: string) => void;
}

export const useImagePicker = ({ onImageSelected }: UseImagePickerProps) => {
  const [permission, requestPermission] = Platform.OS !== 'web'
    ? ImagePickerLib.useMediaLibraryPermissions()
    : [{ granted: true }, () => Promise.resolve({ granted: true })];

  const pickImage = async () => {
    // For web, use native file input
    if (Platform.OS === 'web') {
      console.log('[ImagePicker] Web: Creating file input');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        console.log('[ImagePicker] Web: File selected:', file?.name);
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const uri = event.target?.result as string;
            console.log('[ImagePicker] Web: File read complete, URI length:', uri?.length);
            onImageSelected(uri);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // Check permission for mobile
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'İzin Gerekli',
          'Galeriden fotoğraf seçmek için izin vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
        return;
      }
    }

    try {
      const result = await ImagePickerLib.launchImageLibraryAsync({
        mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  return { pickImage, hasPermission: permission?.granted };
};
