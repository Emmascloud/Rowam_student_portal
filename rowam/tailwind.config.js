/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f9',
          100: '#d6e0f0',
          200: '#adc2e0',
          300: '#7d9bcb',
          400: '#4d72ad',
          500: '#2e5392',
          600: '#1e3d76',
          700: '#16305f',
          800: '#102449',
          900: '#0a1830',
          950: '#060f1f'
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f5a623',
          600: '#d68a0f',
          700: '#b06b0a',
          800: '#8a510c',
          900: '#71420f'
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(10, 24, 48, 0.08), 0 1px 2px rgba(10, 24, 48, 0.06)',
        lifted: '0 10px 30px -10px rgba(10, 24, 48, 0.25)'
      }
    },
  },
  plugins: [],
}
