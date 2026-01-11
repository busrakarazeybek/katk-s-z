import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase/config';
import * as AuthService from '../services/firebase/auth';
import { User } from '../types';
import { StorageKeys } from '../constants/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await AuthService.getCurrentUser(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(userData));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem(StorageKeys.USER);
      }
      setLoading(false);
    });

    // Load cached user on mount
    loadCachedUser();

    return unsubscribe;
  }, []);

  const loadCachedUser = async () => {
    try {
      const cachedUser = await AsyncStorage.getItem(StorageKeys.USER);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
    } catch (error) {
      console.error('Error loading cached user:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userData = await AuthService.signIn(email, password);
      setUser(userData);
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userData = await AuthService.signUp(email, password, displayName);
      setUser(userData);
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      await AsyncStorage.removeItem(StorageKeys.USER);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      await AuthService.updateUserProfile(user.uid, updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(updatedUser));
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
