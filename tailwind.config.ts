import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:  { DEFAULT: '#0e9c8a', 600: '#0c8a79', 700: '#0a7263' },
        navy:   { DEFAULT: '#0b2540', 900: '#07182c' },
        ink:    '#16212e',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(11,37,64,.05), 0 8px 24px rgba(11,37,64,.07)' },
      borderRadius: { xl2: '1rem' },
    },
  },
  plugins: [],
};
export default config;
