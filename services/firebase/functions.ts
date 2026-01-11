import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './config';

// Initialize Cloud Functions
const functions = getFunctions(app);

/**
 * Analysis Result Interface
 */
export interface AnalysisResult {
  success: boolean;
  fullText: string;
  ingredients: string[];
  additives: {
    code: string;
    name: string;
    category: 'safe' | 'caution' | 'avoid';
    found: boolean;
  }[];
  status: 'green' | 'yellow' | 'red';
  analysis: {
    totalAdditives: number;
    dangerousCount: number;
    cautionCount: number;
  };
  recommendations: string[];
}

/**
 * Analyze product image using OCR and additive detection
 */
export const analyzeProductImage = async (imageUrl: string): Promise<AnalysisResult> => {
  try {
    const analyzeImage = httpsCallable<{ imageUrl: string }, AnalysisResult>(
      functions,
      'analyzeImageHTTP'
    );

    const result = await analyzeImage({ imageUrl });
    return result.data;
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    throw new Error(error.message || 'Görsel analiz edilemedi');
  }
};

/**
 * Expert Application Interfaces
 */
export interface ExpertApplication {
  fullName: string;
  email: string;
  specialization: string;
  institution: string;
  articleUrl: string;
}

/**
 * Submit expert application
 */
export const submitExpertApplication = async (
  application: ExpertApplication
): Promise<{ success: boolean; message: string }> => {
  try {
    const submitApp = httpsCallable<ExpertApplication, { success: boolean; message: string }>(
      functions,
      'submitExpertApplication'
    );

    const result = await submitApp(application);
    return result.data;
  } catch (error: any) {
    console.error('Error submitting expert application:', error);
    throw new Error(error.message || 'Başvuru gönderilemedi');
  }
};

/**
 * Approve expert application (admin only)
 */
export const approveExpertApplication = async (
  applicationId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const approve = httpsCallable<{ applicationId: string }, { success: boolean; message: string }>(
      functions,
      'approveExpertApplication'
    );

    const result = await approve({ applicationId });
    return result.data;
  } catch (error: any) {
    console.error('Error approving application:', error);
    throw new Error(error.message || 'Başvuru onaylanamadı');
  }
};

/**
 * Reject expert application (admin only)
 */
export const rejectExpertApplication = async (
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const reject = httpsCallable<
      { applicationId: string; reason?: string },
      { success: boolean; message: string }
    >(functions, 'rejectExpertApplication');

    const result = await reject({ applicationId, reason });
    return result.data;
  } catch (error: any) {
    console.error('Error rejecting application:', error);
    throw new Error(error.message || 'Başvuru reddedilemedi');
  }
};

/**
 * Report content
 */
export interface ReportContent {
  contentType: 'expert_post' | 'comment' | 'place';
  contentId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation';
  description?: string;
}

export const reportContent = async (
  report: ReportContent
): Promise<{ success: boolean; reportId: string }> => {
  try {
    const reportFunc = httpsCallable<ReportContent, { success: boolean; reportId: string }>(
      functions,
      'reportContent'
    );

    const result = await reportFunc(report);
    return result.data;
  } catch (error: any) {
    console.error('Error reporting content:', error);
    throw new Error(error.message || 'İçerik bildirilemedi');
  }
};

/**
 * Register FCM token for push notifications
 */
export const registerFCMToken = async (token: string): Promise<{ success: boolean }> => {
  try {
    const register = httpsCallable<{ token: string }, { success: boolean }>(
      functions,
      'registerFCMToken'
    );

    const result = await register({ token });
    return result.data;
  } catch (error: any) {
    console.error('Error registering FCM token:', error);
    throw new Error(error.message || 'Token kaydedilemedi');
  }
};

/**
 * Unregister FCM token
 */
export const unregisterFCMToken = async (token: string): Promise<{ success: boolean }> => {
  try {
    const unregister = httpsCallable<{ token: string }, { success: boolean }>(
      functions,
      'unregisterFCMToken'
    );

    const result = await unregister({ token });
    return result.data;
  } catch (error: any) {
    console.error('Error unregistering FCM token:', error);
    throw new Error(error.message || 'Token kaldırılamadı');
  }
};

/**
 * Notify nearby alternatives when red product found
 */
export const notifyNearbyAlternative = async (
  productName: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; notificationSent: boolean; placesCount?: number }> => {
  try {
    const notify = httpsCallable<
      { productName: string; latitude: number; longitude: number },
      { success: boolean; notificationSent: boolean; placesCount?: number }
    >(functions, 'notifyNearbyAlternative');

    const result = await notify({ productName, latitude, longitude });
    return result.data;
  } catch (error: any) {
    console.error('Error notifying nearby alternative:', error);
    // Don't throw error for notifications, just log it
    return { success: false, notificationSent: false };
  }
};
