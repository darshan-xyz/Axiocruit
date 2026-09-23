export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          secondary: '#3B82F6',
          accent: '#84CC16',
          dark: '#0A0E1A',
          sidebar: '#0F172A',
          light: '#60A5FA',
          surface: '#F8F9FC',
          lightSidebar: '#F1F5F9',
        },
        cobalt: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        canvas: {
          light: '#F8F9FC',
          dark: '#0A0E1A',
          card: '#FFFFFF',
          cardDark: '#111726',
        },
        sage: {
          50: '#F4FBF7',
          100: '#E6F7EE',
          200: '#C3EEDB',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        limeAccent: {
          50: '#F7FEE7',
          100: '#ECFCCB',
          200: '#D9F99D',
          300: '#BEF264',
          400: '#A3E635',
          500: '#84CC16',
          600: '#65A30D',
        },
        slateDark: {
          800: '#1E293B',
          850: '#151D2F',
          900: '#0F172A',
          950: '#080C14',
        },
        purple: {
          925: '#160029',
          950: '#0D0117',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'purple-radial': 'radial-gradient(ellipse at top, #1a0030 0%, #07000F 70%)',
        'sidebar-grad': 'linear-gradient(180deg, #0D0117 0%, #160029 50%, #0D0117 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(123,44,191,0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(123,44,191,0.7), 0 0 48px rgba(123,44,191,0.2)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        }
      },
      boxShadow: {
        'purple-sm': '0 0 12px rgba(123,44,191,0.3)',
        'purple-md': '0 0 24px rgba(123,44,191,0.5)',
        'purple-lg': '0 0 40px rgba(123,44,191,0.4), 0 0 80px rgba(123,44,191,0.15)',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}

