/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': 'var(--color-brand-primary)',
        'brand-secondary': 'var(--color-brand-secondary)',
        'brand-accent': 'var(--color-brand-accent)',
        'bg-main': 'var(--color-bg-main)',
        'status-disponible': 'var(--color-status-disponible)',
        'status-ocupado': 'var(--color-status-ocupado)',
      },
      fontFamily: {
        headings: ['var(--font-headings)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
