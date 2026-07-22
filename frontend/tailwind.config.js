/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        app: {
          bg:       '#05060B',
          surface:  '#0B0C14',
          raised:   '#0E0F18',
          accent:   '#5B5FEF',
          'accent-soft': '#8184F5',
          accent2:  '#8B5CF6',
          'accent2-soft': '#A78BFA',
          accent3:  '#22D3EE',
          'accent3-soft': '#5EEAFB',
          success:  '#22C55E',
          warning:  '#F59E0B',
          danger:   '#F43F5E',
          viz:            '#7C6BFF',
          'viz-soft':     '#A599FF',
          'viz-success':  '#22C55E',
          'viz-warning':  '#F59E0B',
          'viz-error':    '#EF4444',
          'viz-info':     '#38BDF8',
          text:        '#F8FAFC',
          'text-soft': '#94A3B8',
          'text-muted':'#64748B',
        },
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 12px 32px -8px rgba(0,0,0,0.35)',
        'card-hover': '0 1px 0 0 rgba(255,255,255,0.08) inset, 0 20px 44px -10px rgba(0,0,0,0.45)',
        glow: '0 8px 24px -6px var(--tw-shadow-color)',
        'inner-highlight': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(3%, -4%)' },
        },
        'drift-slow': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-4%, 3%)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'fade-slide-up': 'fade-slide-up 0.35s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'drift': 'drift 14s ease-in-out infinite',
        'drift-slow': 'drift-slow 18s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        'float': 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

