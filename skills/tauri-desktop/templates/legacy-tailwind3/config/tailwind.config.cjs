/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        appLight: {
          primary: '#2563eb',
          secondary: '#14b8a6',
          accent: '#f59e0b',
          neutral: '#111827',
          'base-100': '#ffffff',
        },
      },
      {
        appDark: {
          primary: '#60a5fa',
          secondary: '#2dd4bf',
          accent: '#fbbf24',
          neutral: '#f9fafb',
          'base-100': '#111827',
        },
      },
    ],
  },
};
