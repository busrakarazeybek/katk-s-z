import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export * from './ocr';
export * from './expert';
export * from './moderation';
export * from './notifications';
