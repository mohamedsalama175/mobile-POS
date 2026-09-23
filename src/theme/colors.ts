/**
 * Design System - Semantic Color Tokens
 * Supports both Light and Dark modes with high-contrast accessibility
 * Designed for Honeywell ScanPal EDA50 and modern touch screens.
 */

export const colors = {
  // Brand & Accent Colors
  primary: {
    DEFAULT: '#2563EB', // blue-600
    hover: '#1D4ED8',   // blue-700
    active: '#1E40AF',  // blue-800
    subtle: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.35)',
  },
  secondary: {
    DEFAULT: '#1E293B', // slate-800
    hover: '#0F172A',   // slate-900
    active: '#020617',
    subtle: 'rgba(30, 41, 59, 0.08)',
  },

  // Semantic Status Colors
  success: {
    DEFAULT: '#059669', // emerald-600 (matches 'Fulfilled' in Photo 2)
    hover: '#047857',
    subtle: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.3)',
    dark: '#34D399',    // emerald-400
  },
  warning: {
    DEFAULT: '#D97706', // amber-600
    hover: '#B45309',
    subtle: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.3)',
    dark: '#FBBF24',    // amber-400
  },
  danger: {
    DEFAULT: '#DC2626', // red-600
    hover: '#B91C1C',
    subtle: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(220, 38, 38, 0.3)',
    dark: '#F87171',    // red-400
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Theme Specific Surfaces
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    surfaceHover: '#F8FAFC',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
  },
  dark: {
    background: '#121417',
    surface: '#16181D',
    surfaceSubtle: '#1C2028',
    surfaceHover: '#222731',
    border: '#2D333F',
    borderSubtle: '#1F232B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
  },
} as const;

export type ColorToken = typeof colors;
