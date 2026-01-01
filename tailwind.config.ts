import type { Config } from "tailwindcss";

const config = {
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
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(142, 76%, 36%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        warning: {
          DEFAULT: "hsl(38, 92%, 50%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        info: {
          DEFAULT: "hsl(199, 89%, 48%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        clinical: {
          DEFAULT: "hsl(210, 79%, 46%)",
          foreground: "hsl(0, 0%, 100%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 200ms cubic-bezier(0, 0, 0.2, 1)",
        "fade-out": "fade-out 200ms cubic-bezier(0.4, 0, 1, 1)",
        "slide-in-from-top": "slide-in-from-top 300ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-in-from-bottom": "slide-in-from-bottom 300ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-in-from-left": "slide-in-from-left 300ms cubic-bezier(0, 0, 0.2, 1)",
        "slide-in-from-right": "slide-in-from-right 300ms cubic-bezier(0, 0, 0.2, 1)",
        "scale-in": "scale-in 200ms cubic-bezier(0, 0, 0.2, 1)",
        "scale-out": "scale-out 200ms cubic-bezier(0.4, 0, 1, 1)",
        "spin": "spin 1s linear infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce": "bounce 1s infinite",
        "shake": "shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)",
        "shimmer": "shimmer 2s linear infinite",
        "progress-indeterminate": "progress-indeterminate 1.5s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
