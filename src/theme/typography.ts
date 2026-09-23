/**
 * Design System - Typography Scale
 * Modular scale with relative rem units and fluid line-heights.
 * Optimized for both Arabic (Cairo) and Latin (Inter) fonts.
 */

export const typography = {
  fonts: {
    arabic: "'Cairo', system-ui, -apple-system, sans-serif",
    latin: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  sizes: {
    '2xs': {
      fontSize: '0.625rem', // 10px
      lineHeight: '0.875rem',
    },
    xs: {
      fontSize: '0.75rem',  // 12px
      lineHeight: '1rem',
    },
    sm: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem',
    },
    base: {
      fontSize: '1rem',     // 16px
      lineHeight: '1.5rem',
    },
    lg: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.75rem',
    },
    xl: {
      fontSize: '1.25rem',  // 20px
      lineHeight: '1.75rem',
    },
    '2xl': {
      fontSize: '1.5rem',   // 24px
      lineHeight: '2rem',
    },
    '3xl': {
      fontSize: '1.875rem', // 30px
      lineHeight: '2.25rem',
    },
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;
