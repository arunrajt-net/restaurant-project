/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kerala: {
          dark: '#141E15',      // Deep forest green / rich slate
          card: '#1D2A1F',      // Card dark background
          primary: '#E05328',   // Spice Terracotta / Chili Orange
          secondary: '#EBB02D', // Turmeric Gold
          leaf: '#2A7B4C',      // Banana Leaf Green
          light: '#FDFBF7',     // Coconut Cream off-white
          cream: '#F4ECE1',     // Warm Sand Cream
          accent: '#8B0000',    // Deep Crimson Curry
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Malayalam', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
