import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
        },
        bg: '#080B12',
        card: '#111827',
        hover: '#172033',
        line: '#263043',
        txt: '#F8FAFC',
        mut: '#94A3B8',
        up: '#22C55E',
        down: '#EF4444',
        warn: '#F59E0B',
        info: '#38BDF8',
        qt: {
          bg: '#141821',
          panel: '#1A1F2B',
          panel2: '#212734',
          hover: '#262D3B',
          line: '#2B3242',
          text: '#CFD8DC',
          mut: '#B0BEC5',
          accent: '#2196F3',
          up: '#00E676',
          down: '#EF5350',
          gold: '#FFCA28',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
