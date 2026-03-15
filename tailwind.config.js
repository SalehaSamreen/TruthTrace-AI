/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        authentic: '#10b981',
        uncertain: '#f59e0b',
        manipulated: '#ef4444',
      },
    },
  },
  plugins: [],
};
