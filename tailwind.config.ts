import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',
      }
    },
    extend: {
      colors: {
        psychPurple: {
          light: 'hsl(224, 70%, 89%)',
          DEFAULT: 'hsl(224, 70%, 79%)',
          dark: 'hsl(224, 70%, 69%)',
        },
        psychGreen: {
          light: 'hsl(151, 63%, 72%)',
          DEFAULT: 'hsl(151, 63%, 62%)',
          dark: 'hsl(151, 63%, 52%)',
        },
        psychBeige: {
          light: 'hsl(60, 34%, 97%)',
          DEFAULT: 'hsl(60, 34%, 94%)',
          dark: 'hsl(60, 34%, 91%)',
        },
        psychText: {
          DEFAULT: 'hsl(222, 18%, 14%)',
          muted: 'hsl(222, 18%, 45%)',
        }
      },
      borderRadius: {
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'premium': '0 4px 20px -2px hsl(224, 70%, 79%, 0.25)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-in',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;