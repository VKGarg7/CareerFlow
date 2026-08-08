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
          bg2:      '#090B13',
          surface:  '#0E1120',
          raised:   '#101428',

          accent:   '#5B5FEF',
          'accent-soft': '#8184F5',

          purple:   '#A855F7',
          'purple-soft': '#C084FC',
          blue:     '#3B82F6',
          'blue-soft': '#60A5FA',
          cyan:     '#22D3EE',
          'cyan-soft': '#5EEAFB',
          emerald:  '#10B981',
          'emerald-soft': '#34D399',
          orange:   '#F97316',
          'orange-soft': '#FB923C',
          pink:     '#EC4899',
          'pink-soft': '#F472B6',

          accent2:  '#A855F7',
          'accent2-soft': '#C084FC',
          accent3:  '#22D3EE',
          'accent3-soft': '#5EEAFB',

          success:  '#10B981',
          warning:  '#F59E0B',
          danger:   '#F43F5E',

          viz:            '#7C6BFF',
          'viz-soft':     '#A599FF',
          'viz-success':  '#10B981',
          'viz-warning':  '#F59E0B',
          'viz-error':    '#EF4444',
          'viz-info':     '#38BDF8',

          text:        '#E5E7EB',
          'text-bright': '#FFFFFF',
          'text-soft': '#B4B8C7',
          'text-muted':'#7E8497',
          'text-faint':'#565C70',
        },
      },
      borderRadius: {
        card: '16px',
        hud: '20px',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 12px 32px -8px rgba(0,0,0,0.35)',
        'card-hover': '0 1px 0 0 rgba(255,255,255,0.08) inset, 0 20px 44px -10px rgba(0,0,0,0.45)',
        glow: '0 8px 24px -6px var(--tw-shadow-color)',
        'inner-highlight': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
        'glass-1': '0 1px 0 0 rgba(255,255,255,0.07) inset, 0 0 0 1px rgba(255,255,255,0.05) inset, 0 18px 46px -14px rgba(0,0,0,0.55)',
        'glass-2': '0 1px 0 0 rgba(255,255,255,0.09) inset, 0 0 0 1px rgba(255,255,255,0.06) inset, 0 28px 64px -16px rgba(0,0,0,0.6)',
        'glass-hover': '0 1px 0 0 rgba(255,255,255,0.12) inset, 0 0 0 1px rgba(255,255,255,0.09) inset, 0 34px 74px -14px rgba(0,0,0,0.65)',
        'float-sm': '0 6px 16px -6px rgba(0,0,0,0.5)',
        'float-md': '0 16px 40px -12px rgba(0,0,0,0.55)',
        'float-lg': '0 30px 70px -18px rgba(0,0,0,0.6)',
        'edge-glow': '0 0 0 1px var(--tw-shadow-color), 0 0 24px -4px var(--tw-shadow-color)',
        'ring-accent': '0 0 0 1px rgba(129,140,248,0.35), 0 0 32px -6px rgba(99,102,241,0.55)',
        'glow-success': '0 0 14px -2px rgba(16,185,129,0.55)',
        'glow-warning': '0 0 14px -2px rgba(245,158,11,0.55)',
        'glow-danger':  '0 0 14px -2px rgba(244,63,94,0.55)',
        'glow-accent':  '0 0 14px -2px rgba(91,95,239,0.55)',
        'glow-cyan':    '0 0 14px -2px rgba(34,211,238,0.55)',
        'glow-purple':  '0 0 14px -2px rgba(168,85,247,0.55)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '48px',
      },
      backgroundImage: {
        'grid-hud': 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        'app-depth': 'linear-gradient(180deg, #090B13 0%, #05060B 55%, #05060B 100%)',
        'ambient-hero': `
          radial-gradient(ellipse 70% 50% at 15% -10%, rgba(91,95,239,0.16), transparent 60%),
          radial-gradient(ellipse 60% 45% at 85% 0%, rgba(168,85,247,0.12), transparent 60%),
          radial-gradient(ellipse 50% 40% at 50% 100%, rgba(34,211,238,0.05), transparent 65%)
        `,
      },
      backgroundSize: {
        'grid-hud': '44px 44px',
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
        'float-tilt': {
          '0%, 100%': { transform: 'translateY(0) rotateX(0deg) rotateY(0deg)' },
          '50%': { transform: 'translateY(-6px) rotateX(0.6deg) rotateY(-0.6deg)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.3)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'grid-pan': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '44px 44px' },
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
        'float-tilt': 'float-tilt 7s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'pulse-glow': 'pulse-glow 2.8s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'grid-pan': 'grid-pan 6s linear infinite',
      },
    },
  },
  plugins: [],
}

