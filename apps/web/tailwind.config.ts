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
          bg: '#1C1F2D',
          sidebar: '#161923',
          panel: '#232838',
          panel2: '#2A3042',
          hover: '#333A4D',
          line: '#2E3547',
          text: '#F5F7FA',
          mut: '#8B92A6',
          accent: '#2B99FF',
          up: '#0FAF59',
          down: '#F6465D',
          gold: '#FFC93C',
        },
        neo: {
          bg: '#0d1117',
          panel: '#161b22',
          panel2: '#1c2334',
          line: '#26324a',
          text: '#e6edf3',
          mut: '#8395a8',
          blue: '#2b99ff',
          violet: '#8b5cf6',
          green: '#10b981',
          red: '#ff5470',
          gold: '#ffc93c',
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
