import React from 'react';
import { Alert } from 'react-native';
import * as ImagePickerLib from 'expo-image-picker';

interface UseImagePickerProps {
  onImageSelected: (uri: string) => void;
}

export const useImagePicker = ({ onImageSelected }: UseImagePickerProps) => {
  const [permission, requestPermission] = ImagePickerLib.useMediaLibraryPermissions();

  const pickImage = async () => {
    // Check permission
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
