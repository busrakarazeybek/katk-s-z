import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product } from '../types';
import { analyzeProductImage, AnalysisResult as CloudAnalysisResult } from '../services/firebase/functions';
import { createProduct } from '../services/firebase/firestore';
import { uploadProductImage } from '../services/firebase/storage';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';
import { ADDITIVES_DATABASE } from '../constants/additives';

// Local type for AnalysisResult (matching Cloud Function response)
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

interface AnalysisContextType {
  analyzing: boolean;
  currentResult: AnalysisResult | null;
  currentProduct: Product | null;
  analyzeImage: (imageUri: string) => Promise<AnalysisResult>;
  saveProduct: (name: string, brand?: string) => Promise<string>;
  clearResult: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

interface AnalysisProviderProps {
  children: ReactNode;
}

export const AnalysisProvider: React.FC<AnalysisProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');

  // Mock analysis for web demo
  const mockAnalyzeImage = async (): Promise<AnalysisResult> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock ingredients with some additives
    const mockIngredients = [
      'Su',
      'Şeker',
      'Karbondioksit',
      'Karamel renklendirici (E150d)',
      'Asitlik düzenleyici (E338)',
      'Aroma verici',
      'Kafein',
    ];

    // Find additives in the mock data
    const foundAdditives = ADDITIVES_DATABASE.filter(additive =>
      mockIngredients.some(ing =>
        ing.toLowerCase().includes(additive.code.toLowerCase())
      )
    ).map(additive => ({
      ...additive,
      found: true,
    }));

    const dangerousCount = foundAdditives.filter(a => a.category === 'avoid').length;
    const cautionCount = foundAdditives.filter(a => a.category === 'caution').length;

    let status: 'green' | 'yellow' | 'red' = 'green';
    let recommendations: string[] = [];

    if (dangerousCount > 0) {
      status = 'red';
      recommendations = [
        'Bu üründe tehlikeli katkı maddeleri bulunmaktadır',
        'Alternatif ürünlere göz atmanızı öneririz',
        'Yakındaki katkısız ürün satan yerleri kontrol edin',
      ];
    } else if (cautionCount > 0 || foundAdditives.length > 3) {
      status = 'yellow';
      recommendations = [
        'Dikkatli tüketilmesi önerilir',
        'Günlük tüketim limitine dikkat edin',
      ];
    } else {
      recommendations = [
        'Bu ürün güvenli katkı maddeleri içeriyor',
        'Ölçülü tüketim her zaman önerilir',
      ];
    }

    return {
      success: true,
      fullText: mockIngredients.join(', '),
      ingredients: mockIngredients,
      additives: foundAdditives,
      status,
      analysis: {
        totalAdditives: foundAdditives.length,
        dangerousCount,
        cautionCount,
      },
      recommendations,
    };
  };

  const analyzeImage = async (imageUri: string): Promise<AnalysisResult> => {
    try {
      setAnalyzing(true);
      setCurrentImageUri(imageUri);

      console.log('[AnalysisContext] Starting analysis, Platform:', Platform.OS);
      console.log('[AnalysisContext] Image URI:', imageUri);

      // Use mock analysis on web
      if (Platform.OS === 'web') {
        console.log('[AnalysisContext] Using mock analysis for web');
        const result = await mockAnalyzeImage();
        console.log('[AnalysisContext] Mock analysis result:', result);
        setCurrentResult(result);
        setAnalyzing(false);
        return result;
      }

      // Create temporary product ID for image upload
      const tempId = `temp_${Date.now()}`;
      const userId = user?.uid || 'anonymous';

      // Step 1: Upload image to Firebase Storage
      const imageUrl = await uploadProductImage(imageUri, userId, tempId);

      // Step 2: Call Cloud Function for analysis
      const result = await analyzeProductImage(imageUrl);

      if (!result.success) {
        throw new Error('Analiz başarısız oldu. Lütfen tekrar deneyin.');
      }

      if (result.ingredients.length === 0) {
        throw new Error('İçindekiler listesi tespit edilemedi. Lütfen daha net bir fotoğraf çekin.');
      }

      setCurrentResult(result);
      return result;
    } catch (error: any) {
      console.error('Analysis error:', error);
      throw new Error(error.message || 'Görsel analiz edilemedi');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveProduct = async (name: string, brand?: string): Promise<string> => {
    if (!currentResult || !currentImageUri) {
      throw new Error('No analysis result to save');
    }

    if (!user) {
      throw new Error('User must be authenticated to save products');
    }

    try {
      // Create temporary product ID
      const tempProductId = `product_${Date.now()}`;

      // Upload image to Firebase Storage
      const imageUrl = await uploadProductImage(
        currentImageUri,
        user.uid,
        tempProductId
      );

      // Create product in Firestore
      const productData: Partial<Product> = {
        name,
        brand,
        imageUrl,
        ingredients: currentResult.ingredients,
        additives: currentResult.additives,
        status: currentResult.status,
        analyzedBy: 'ai',
        userId: user.uid,
        verified: false,
      };

      const productId = await createProduct(productData);

      const product: Product = {
        id: productId,
        ...productData,
        createdAt: new Date() as any,
      } as Product;

      setCurrentProduct(product);
      return productId;
    } catch (error: any) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  const clearResult = () => {
    setCurrentResult(null);
    setCurrentProduct(null);
    setCurrentImageUri('');
  };

  const value = {
    analyzing,
    currentResult,
    currentProduct,
    analyzeImage,
    saveProduct,
    clearResult,
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
};

export const useAnalysis = (): AnalysisContextType => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
