import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Custom EXP Solution theme colors from expsolution.io
        exp: {
          primary: "#0B2A4A",
          accent: "#1E88E5", 
          bg: "#0F1522",
          surface: "#0F1B2D",
          muted: "#8AA0B5",
          border: "#203045",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#EF4444",
          // Brand colors from expsolution.io
          brand: "hsl(224.3, 76.3%, 48%)",
          "brand-2": "hsl(268, 83%, 65%)",
          "brand-3": "hsl(190, 95%, 39%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        elevate: "0 10px 30px rgba(2,8,23,0.35)",
        insetlite: "inset 0 1px 0 rgba(255,255,255,0.03)",
      },
      backgroundImage: {
        "gradient-exp": "linear-gradient(135deg, #0B2A4A 0%, #1E88E5 100%)",
        "gradient-accent": "linear-gradient(135deg, hsl(var(--brand)), hsl(var(--brand-2)) 60%, hsl(var(--brand-3)) 100%)",
        // Custom radial gradient for background
        "gradient-radial": "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
