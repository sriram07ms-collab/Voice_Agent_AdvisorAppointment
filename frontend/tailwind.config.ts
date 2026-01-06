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
        // Groww brand colors
        groww: {
          primary: '#00D09C',
          'primary-dark': '#00B887',
          'primary-light': '#E6FBF5',
          secondary: '#0C4A6E',
          dark: '#1E293B',
          light: '#F8FAFC',
          accent: '#3B82F6',
          success: '#00D09C',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      boxShadow: {
        'groww': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'groww-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'groww-xl': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config







