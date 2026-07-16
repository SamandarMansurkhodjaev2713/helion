/** @type {import('tailwindcss').Config} */

/*
 * Helion design tokens live here as the single source of truth for Tailwind.
 * The exact same values are mirrored as CSS custom properties in src/index.css
 * so that Canvas / imperative code (which cannot read Tailwind classes) stays
 * in sync. Never hardcode a brand colour in a component — reference a token.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#060910', // deepest background — open space
        deep: '#0B1120', // second layer — large panels
        panel: '#111A2B', // cards, raised surfaces
        accent: {
          DEFAULT: '#6FD3F2', // primary cold accent — CTA, highlights (ion cyan)
          bright: '#A9E7FF', // hover / glow highlight
          deep: '#3E9FC4', // pressed / shadow
        },
        steel: '#6E8BA6', // muted secondary accent — telemetry, contrast
        ice: '#9DBBD6', // soft cold highlight
        bone: '#ECE6DA', // primary text
        ash: '#8B8578', // muted meta, captions
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        telemetry: '0.28em',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.16, 1, 0.3, 1)', // fast out, long settle
      },
      transitionDuration: {
        600: '600ms',
        800: '800ms',
        1000: '1000ms',
        1200: '1200ms',
      },
      zIndex: {
        cursor: '9999',
        nav: '100',
        overlay: '80',
        content: '50',
      },
      keyframes: {
        'drift-slow': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -12px, 0)' },
        },
        'pulse-ring': {
          '0%': { opacity: '0.6', transform: 'scale(0.85)' },
          '100%': { opacity: '0', transform: 'scale(1.6)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'bounce-slow': 'bounce 2.2s infinite',
        'drift-slow': 'drift-slow 7s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
    },
  },
  plugins: [],
}
