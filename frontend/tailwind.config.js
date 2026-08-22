/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9ceff',
          300: '#8aaeff',
          400: '#5d8aff',
          500: '#3b6ff5',
          600: '#2550e0',
          700: '#1b3bbf',
          800: '#17309a',
          900: '#162c79',
        },
        surface: {
          DEFAULT: '#0f1117',
          card:    '#191d2b',
          border:  '#252a3a',
          muted:   '#2d3348',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulse_badge: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out both',
        'slide-in': 'slideIn 0.25s ease-out both',
        'pulse-badge': 'pulse_badge 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
