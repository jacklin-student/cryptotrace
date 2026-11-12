/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ct-bg': '#FFFFFF',
        'ct-skin': '#F2CCB7',
        'ct-accent': '#D9A98E',
        'ct-tint': '#FBEFE7',
        'ct-brown': '#3B2A22',
        'ct-muted': '#7A6257',
        'ct-risk-high': '#C0392B',
        'ct-risk-med': '#E0A030',
        'ct-risk-low': '#3E9B6B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'ct-sm': '0 2px 8px -2px rgba(59, 42, 34, 0.06), 0 1px 4px -1px rgba(59, 42, 34, 0.04)',
        'ct-md': '0 6px 16px -4px rgba(59, 42, 34, 0.08), 0 2px 6px -2px rgba(59, 42, 34, 0.04)',
        'ct-lg': '0 12px 28px -6px rgba(59, 42, 34, 0.12), 0 4px 10px -3px rgba(59, 42, 34, 0.06)',
      },
      borderRadius: {
        'ct': '1rem',
        'ct-lg': '1.25rem',
      }
    },
  },
  plugins: [],
}
