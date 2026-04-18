import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        accent: 'var(--accent)',
        border: 'var(--border)',
        hover: 'var(--hover)',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms cubic-bezier(0.4,0,0.2,1)',
        'fade-scale-in': 'fadeScaleIn 200ms cubic-bezier(0.4,0,0.2,1)',
        'slide-up': 'slideUp 200ms cubic-bezier(0.4,0,0.2,1)',
        'message-in': 'messageSlideUp 240ms cubic-bezier(0.4,0,0.2,1)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeScaleIn: {
          from: { opacity: '0', transform: 'scale(.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        messageSlideUp: {
          from: { opacity: '0', transform: 'translateY(18px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
