/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          pear: '#F3EEB6',
          avocado: '#D4DB74',
          jujube: '#9ABF17',
          delltone: '#84BF93',
          peppermint: '#AED9C5',
          frost: '#DDECF1',
        },
        background: '#DDECF1', // Sparkling Frost
        surface: '#ffffff',
        border: '#AED9C5',
        primary: '#9ABF17', // Green Jujube
        text: {
          main: '#2c3e50',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
          '50%': { transform: 'scale(1.05)', opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
