/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          950: '#070A12',
          900: '#0B1020',
          800: '#111B34',
        },
        panel: {
          900: '#0F172A',
          800: '#111C33',
          700: '#162244',
        },
        text: {
          100: '#E6EAF2',
          200: '#C9D2E3',
          400: '#93A4C7',
        },
        accent: {
          500: '#8B5CF6',
          400: '#A78BFA',
        },
        ok: { 500: '#22C55E' },
        warn: { 500: '#F59E0B' },
        bad: { 500: '#EF4444' },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}
