/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  // Ini ngasih tau Tailwind untuk ngecek class CSS di semua file React kita
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors matching brand
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          DEFAULT: '#276749',
        },
      },
    },
  },
  safelist: [
    { pattern: /col-span-(1|2|3|4|5|6|7|8|9|10|11|12)/, variants: ['md', 'xl'] },
    { pattern: /bg-\[#/, variants: ['hover'] },
    { pattern: /text-\[#/, variants: ['hover'] },
  ],
  plugins: [],
}
