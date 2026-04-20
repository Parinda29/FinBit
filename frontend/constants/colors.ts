const Colors = {
  // Brand palette
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#EDE9FE',
  accentPurple: '#A78BFA',

  // Surfaces
  background: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  white: '#FFFFFF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textPlaceholder: '#94A3B8',

  // Utility
  lightGray: '#F8FAFC',
  mediumGray: '#E5E7EB',
  darkGray: '#475569',
  charcoal: '#0F172A',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',

  // Shadows
  shadowLight: 'rgba(15, 23, 42, 0.06)',
  shadowMedium: 'rgba(15, 23, 42, 0.1)',
  shadowDark: 'rgba(15, 23, 42, 0.16)',
};

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 22,
  full: 999,
};

export const Space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
};

export default Colors;
