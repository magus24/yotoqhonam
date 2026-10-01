/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tailwind's default opacity scale skips most integers, so `border-graphite/12`
      // silently fails to compile. This app uses fine-grained alpha steps all
      // over the design system, so the full 0–100 range is declared up front.
      opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, String(i / 100)])),
      colors: {
        /* ---- surfaces: soft gray canvas, white cards ---- */
        ink: {
          950: '#F1F5F9',
          900: '#FFFFFF',
          850: '#F8FAFC',
          800: '#EEF2F7',
          700: '#E2E8F0',
          600: '#CBD5E1',
          500: '#94A3B8',
        },
        /* ---- graphite: all text and hairline structure ---- */
        graphite: {
          950: '#0F172A',
          900: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
        },
        /* ---- restrained blue: the institution, links, "next room" ---- */
        mint: {
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#3B82F6',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        /* ---- indigo: the one accent, used sparingly ---- */
        indigo: {
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
        },
        /* ---- amber: today's duty ---- */
        brass: {
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
        },
        /* ---- forest: ready, completed, occupied ---- */
        forest: {
          100: '#DCFCE7',
          200: '#BBF7D0',
          400: '#22C55E',
          500: '#16A34A',
          600: '#15803D',
          700: '#166534',
        },
        paper: '#F1F5F9',
        alert: '#DC2626',
        text: {
          DEFAULT: '#0F172A',
          mist: '#475569',
          dim: '#5A6478',
        },
        line: {
          DEFAULT: 'rgb(15 23 42 / 0.10)',
          strong: 'rgb(15 23 42 / 0.18)',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['clamp(2.25rem, 1.4rem + 3.2vw, 3.5rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(2.75rem, 1.5rem + 5vw, 5rem)', { lineHeight: '0.94', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(3.25rem, 1.2rem + 7.4vw, 7rem)', { lineHeight: '0.9', letterSpacing: '-0.045em' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        /* light surfaces need a whisper of depth, not a drop shadow */
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        lift: '0 12px 32px -12px rgb(15 23 42 / 0.18)',
        lamp: '0 6px 18px -8px rgb(29 78 216 / 0.45)',
        signal: '0 0 0 1px rgb(37 99 235 / 0.35), 0 6px 20px -10px rgb(37 99 235 / 0.45)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        sweep: {
          '0%': { transform: 'translateX(-130%)' },
          '100%': { transform: 'translateX(240%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.55' },
          '70%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-10px,0)' },
        },
        'draw-line': {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.6s ease both',
        sweep: 'sweep 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.8s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        drift: 'drift 7s ease-in-out infinite',
        'draw-line': 'draw-line 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};