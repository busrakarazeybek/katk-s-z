import { Timestamp } from 'firebase/firestore';

export type ProductStatus = 'green' | 'yellow' | 'red';
export type AdditiveCategory = 'safe' | 'caution' | 'avoid';
export type AnalyzedBy = 'ai' | 'expert' | 'manual';

export interface Additive {
  code: string; // E330, E621, vb.
  name: string;
  category: AdditiveCategory;
  description?: string;
  healthImpact?: string;
  sources?: string[];
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl: string;
  ingredients: string[];
  additives: Additive[];
  status: ProductStatus;
  analyzedBy: AnalyzedBy;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
  verified: boolean;
  verifiedBy?: string; // Expert uid
}

export interface ScanHistory {
  id: string;
  userId: string;
  productId: string;
  product?: Product; // Populated
  result: ProductStatus;
  scannedAt: Timestamp;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ProductAlternative {
  productId: string;
  product: Product;
  distance?: number; // meters
  availableAt?: string[]; // place ids
}
