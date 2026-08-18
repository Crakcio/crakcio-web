/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <-- Esto es lo crucial para el cambio de temas
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};