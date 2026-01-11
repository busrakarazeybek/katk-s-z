import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  UploadResult,
} from 'firebase/storage';
import { storage } from './config';
import * as ImageManipulator from 'expo-image-manipulator';
import { AppConfig } from '../../constants/config';

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (
  uri: string,
  path: string,
  compress: boolean = true
): Promise<string> => {
  try {
    let imageUri = uri;

    // Compress image if needed
    if (compress) {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: AppConfig.image.maxWidth,
              height: AppConfig.image.maxHeight,
            },
          },
        ],
        {
          compress: AppConfig.image.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      imageUri = manipResult.uri;
    }

    // Convert to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    throw new Error(error.message || 'Görsel yüklenemedi');
  }
};

/**
 * Upload product scan image
 */
export const uploadProductImage = async (
  uri: string,
  userId: string,
  productId: string
): Promise<string> => {
  const path = `products/${userId}/${productId}_${Date.now()}.jpg`;
  return uploadImage(uri, path);
};

/**
 * Upload place image
 */
export const uploadPlaceImage = async (
  uri: string,
  userId: string,
  placeId: string
): Promise<string> => {
  const path = `places/${placeId}/${Date.now()}.jpg`;
  return uploadImage(uri, path);
};

/**
 * Upload expert post image
 */
export const uploadExpertPostImage = async (
  uri: string,
  userId: string,
  postId: string
): Promise<string> => {
  const path = `expertPosts/${userId}/${postId}_${Date.now()}.jpg`;
  return uploadImage(uri, path);
};

/**
 * Upload user profile photo
 */
export const uploadProfilePhoto = async (
  uri: string,
  userId: string
): Promise<string> => {
  const path = `profiles/${userId}/photo.jpg`;
  return uploadImage(uri, path);
};

/**
 * Delete file from storage
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error: any) {
    throw new Error(error.message || 'Dosya silinemedi');
  }
};

/**
 * Get download URL for a file
 */
export const getFileURL = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    throw new Error(error.message || 'Dosya URL\'si alınamadı');
  }
};
