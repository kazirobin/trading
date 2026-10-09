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
          bg: '#080c15',
          panel: '#111726',
          panel2: '#171f31',
          hover: '#1e2740',
          line: '#26314a',
          text: '#e8eefb',
          mut: '#8a95a9',
          accent: '#0066ff',
          up: '#00b050',
          down: '#d63e3e',
          gold: '#f4b740',
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
