/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#121417',
        surface: {
          DEFAULT: '#1C1F24',
          raised: '#262A31',
        },
        'surface-raised': '#262A31',
        border: '#333842',
        'text-primary': '#F5F6F7',
        'text-secondary': '#9AA1AC',
        accent: '#3B82F6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};
