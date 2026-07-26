/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          border: 'var(--surface-border)',
        },
        risk: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#ef4444',
        },
        clinical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-danger': 'pulse-danger 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-warning': 'pulse-warning 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.6)' },
        },
        'pulse-danger': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .7, boxShadow: '0 0 35px rgba(239, 68, 68, 0.4)' },
        },
        'pulse-warning': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .7, boxShadow: '0 0 35px rgba(245, 158, 11, 0.4)' },
        }
      },
    },
  },
  plugins: [],
}
