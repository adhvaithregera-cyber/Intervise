import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FEFDF0',   // light lavender — backgrounds
          100: '#6BA3C8',   // soft blue-gray — borders, dividers
          200: '#6BA3C8',   // muted blue-gray — secondary text
          300: '#F9C125',   // periwinkle — accents, links
          400: '#F9C125',   // periwinkle (same for Tailwind compat)
          500: '#F9C125',   // periwinkle — hover accents
          600: '#E07A2F',   // deep navy — primary
          700: '#E07A2F',   // deep navy
          800: '#C96A1A',   // darker navy
          900: '#1e2a52',   // darkest navy
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
