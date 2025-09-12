import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        border: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)"
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px"
      },
      boxShadow: {
        elevate: "0 10px 30px rgba(2,8,23,0.35)",
        insetlite: "inset 0 1px 0 rgba(255,255,255,0.03)"
      }
    }
  },
  plugins: []
} satisfies Config
