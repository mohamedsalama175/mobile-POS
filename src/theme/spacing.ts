/**
 * Design System - Relative Spacing Scale
 * Uses rem units (based on root 16px font-size) with relative increments.
 * Absolutely NO hardcoded pixel widths for layout containers.
 */

export const spacing = {
  none: '0',
  '2xs': '0.125rem', // 2px
  xs: '0.25rem',     // 4px
  sm: '0.5rem',      // 8px
  md: '0.75rem',     // 12px
  base: '1rem',      // 16px
  lg: '1.25rem',     // 20px
  xl: '1.5rem',      // 24px
  '2xl': '2rem',     // 32px
  '3xl': '2.5rem',   // 40px
  '4xl': '3rem',     // 48px
} as const;

export const radii = {
  none: '0',
  sm: '0.375rem',    // 6px
  md: '0.5rem',      // 8px
  lg: '0.75rem',     // 12px
  xl: '1rem',        // 16px
  '2xl': '1.25rem',   // 20px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;
