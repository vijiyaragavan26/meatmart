/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        meat: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          500: '#e11d48',
          600: '#C62828', // Primary Deep Red
          700: '#b71c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        fresh: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#2E7D32', // Secondary Fresh Green
          700: '#1b5e20',
        },
        cream: {
          50: '#FFFDF9',
          100: '#FFF8F0', // Accent Light Cream
          200: '#FDEED9',
        },
        charcoal: {
          800: '#333333',
          900: '#222222', // Text Dark Charcoal
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
