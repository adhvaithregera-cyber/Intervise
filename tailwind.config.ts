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
          50:  '#EFE3CA',   // light lavender — backgrounds
          100: '#8ACBD0',   // soft blue-gray — borders, dividers
          200: '#8ACBD0',   // muted blue-gray — secondary text
          300: '#56B6C6',   // periwinkle — accents, links
          400: '#56B6C6',   // periwinkle (same for Tailwind compat)
          500: '#56B6C6',   // periwinkle — hover accents
          600: '#170C79',   // deep navy — primary
          700: '#170C79',   // deep navy
          800: '#0f0955',   // darker navy
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
