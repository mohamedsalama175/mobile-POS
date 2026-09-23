/**
 * Design System - Responsive Breakpoints
 * Tailored for handheld rugged scanners (e.g. Honeywell ScanPal EDA50 at 360-400px),
 * modern smartphones (412-430px), and tablets (768px-1024px).
 */

export const breakpoints = {
  xs: '360px',  // Small rugged handhelds (Honeywell EDA50)
  sm: '480px',  // Standard smartphones
  md: '768px',  // Mini-tablets & phablets
  lg: '1024px', // Full-sized tablets & POS docking stations
  xl: '1280px', // Desktops
} as const;

export type Breakpoint = keyof typeof breakpoints;
