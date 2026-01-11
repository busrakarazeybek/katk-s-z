// Export all types from a central location
export * from './user';
export * from './product';
export * from './place';
export * from './expert';

// Common types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  limit: number;
  offset?: number;
  lastDoc?: any; // Firestore DocumentSnapshot
}

export interface SearchFilters {
  status?: 'green' | 'yellow' | 'red';
  type?: string;
  verified?: boolean;
  startDate?: Date;
  endDate?: Date;
}
