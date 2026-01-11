// App color palette - Modern, organic, and calming
export const Colors = {
  // Primary - Green theme for healthy/clean
  primary: {
    green: '#4CAF50',      // Green traffic light
    greenLight: '#81C784',
    greenDark: '#388E3C',
    yellow: '#FFC107',     // Yellow traffic light
    yellowLight: '#FFD54F',
    yellowDark: '#FFA000',
    red: '#F44336',        // Red traffic light
    redLight: '#E57373',
    redDark: '#D32F2F',
  },

  // Background colors - Soft pastels
  background: {
    primary: '#FAFAFA',
    secondary: '#F5F5F5',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
    link: '#2196F3',
  },

  // Map-specific colors
  map: {
    road: '#E8E8E8',
    park: '#C8E6C9',
    water: '#BBDEFB',
    building: '#EEEEEE',
    border: '#9E9E9E',
  },

  // Status colors
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },

  // UI elements
  ui: {
    border: '#E0E0E0',
    divider: '#EEEEEE',
    shadow: 'rgba(0, 0, 0, 0.1)',
    ripple: 'rgba(0, 0, 0, 0.12)',
  },

  // Gradients
  gradients: {
    greenToYellow: ['#4CAF50', '#8BC34A', '#CDDC39'],
    yellowToRed: ['#FFEB3B', '#FFC107', '#FF5722'],
    primary: ['#4CAF50', '#66BB6A'],
  },
} as const;

// Dark mode colors
export const DarkColors = {
  ...Colors,
  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    card: '#2C2C2C',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    disabled: '#666666',
    inverse: '#212121',
    link: '#64B5F6',
  },
  ui: {
    border: '#383838',
    divider: '#2C2C2C',
    shadow: 'rgba(0, 0, 0, 0.3)',
    ripple: 'rgba(255, 255, 255, 0.12)',
  },
} as const;
