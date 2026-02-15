// ثابت‌های پروژه

export const API_BASE_URL = 'https://api.example.com';

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F1F8F4', // مطابق Figma
  surface: '#FFFFFF',
  text: '#333333', // مطابق Figma
  textSecondary: '#757575', // مطابق Figma
  inputBorder: 'rgba(231, 0, 43, 0.5)', // مطابق Figma
  buttonDisabled: '#D3D3D3', // مطابق Figma
} as const;

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONTS = {
  regular: 'System',
  medium: 'System-Medium',
  bold: 'System-Bold',
} as const;
