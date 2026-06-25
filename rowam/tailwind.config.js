/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep charcoal — primary dark
        charcoal: {
          50:  '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#a0a0a0',
          500: '#717171',
          600: '#525252',
          700: '#3d3d3d',
          800: '#2a2a2a',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Electric indigo — accent
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Warm gold — secondary accent (kept from original)
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Warm cream — background
        cream: {
          50:  '#faf9f5',
          100: '#f4f2eb',
          200: '#ede9de',
        },
        // Keep navy for legacy components
        navy: {
          50:  '#eef2f9',
          100: '#d6e0f0',
          200: '#adc2e0',
          300: '#7d9bcb',
          400: '#4d72ad',
          500: '#2e5392',
          600: '#1e3d76',
          700: '#16305f',
          800: '#102449',
          900: '#0a1830',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        lifted: '0 8px 30px -8px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)',
        glow:   '0 0 0 4px rgba(99,102,241,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
