import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from '../../types';

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update profile
    await updateProfile(firebaseUser, { displayName });

    // Create user document in Firestore
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      role: 'user',
      createdAt: serverTimestamp() as any,
      preferences: {
        notifications: true,
        location: true,
      },
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

    return newUser;
  } catch (error: any) {
    throw new Error(error.message || 'Kayıt başarısız');
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }

    return userDoc.data() as User;
  } catch (error: any) {
    throw new Error(error.message || 'Giriş başarısız');
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Çıkış başarısız');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Şifre sıfırlama başarısız');
  }
};

/**
 * Get current user from Firestore
 */
export const getCurrentUser = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: any) {
    throw new Error(error.message || 'Profil güncellenemedi');
  }
};

/**
 * Apply for expert role
 */
export const applyForExpert = async (
  uid: string,
  articleUrl: string,
  specialization: string,
  institution: string,
  additionalInfo?: string
): Promise<void> => {
  try {
    const application = {
      userId: uid,
      email: auth.currentUser?.email,
      fullName: auth.currentUser?.displayName,
      articleUrl,
      specialization,
      institution,
      additionalInfo,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'expertApplications', uid), application);
  } catch (error: any) {
    throw new Error(error.message || 'Başvuru gönderilemedi');
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

/**
 * Get current Firebase user
 */
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
