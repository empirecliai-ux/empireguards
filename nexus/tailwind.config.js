/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        slate: {
          950: '#020617',
        }
      },
      boxShadow: {
        'neon-emerald': '0 0 20px rgba(52, 211, 153, 0.5)',
      }
    },
  },
  plugins: [],
}
