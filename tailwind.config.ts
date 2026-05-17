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
          50:  '#EDE8F5',   // light lavender — backgrounds
          100: '#ADBBDA',   // soft blue-gray — borders, dividers
          200: '#8697C4',   // muted blue-gray — secondary text
          300: '#7091E6',   // periwinkle — accents, links
          400: '#7091E6',   // periwinkle (same for Tailwind compat)
          500: '#7091E6',   // periwinkle — hover accents
          600: '#3D52A0',   // deep navy — primary
          700: '#3D52A0',   // deep navy
          800: '#2d3d78',   // darker navy
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
