/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#3b5bdb',
          600: '#2f4ac4',
          700: '#2541a8',
        },
        q1: '#ef4444',
        q2: '#3b82f6',
        q3: '#f59e0b',
        q4: '#6b7280',
      },
    },
  },
  plugins: [],
};

