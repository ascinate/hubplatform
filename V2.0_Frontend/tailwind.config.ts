import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A87C30',
          hover: '#7C5B20',
          light: '#FAF5EB',
          50: '#FFFBF5',
          100: '#F5ECD8',
          500: '#A87C30',
          600: '#7C5B20',
          700: '#6B4E1A',
        },
        danger: {
          DEFAULT: '#E74C3C',
          light: '#FDEDEC',
          50: '#FEF5F4',
        },
        success: {
          DEFAULT: '#27AE60',
          light: '#EAFAF1',
          50: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#F39C12',
          light: '#FEF9E7',
          50: '#FFFBEB',
        },
        info: {
          DEFAULT: '#2E86C1',
          light: '#EBF5FB',
          50: '#EFF6FF',
        },
        kpi: {
          teal: '#1ABC9C',
          pink: '#E91E63',
        },
        sidebar: {
          dark: '#1A1208',
          light: '#F5F0E8',
          hover: '#2A1F10',
          active: '#3D2E18',
        },
        text: {
          primary: '#2C3E50',
          muted: '#808B96',
          light: '#ABB2B9',
        },
        border: {
          DEFAULT: '#D5D8DC',
          light: '#EAECEE',
        },
        bg: {
          main: '#F8F9FA',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        sidebar: '2px 0 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
