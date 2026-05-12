import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          subtle: "var(--bg-subtle)"
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)"
        },
        brand: {
          DEFAULT: "var(--brand)",
          dark: "var(--brand-dark)",
          soft: "var(--brand-soft)"
        },
        proof: "var(--proof)"
      },
      borderColor: {
        base: "var(--border)",
        strong: "var(--border-strong)",
        brand: "var(--border-brand)"
      },
      boxShadow: {
        brand: "0 0 0 1px var(--border-brand), 0 22px 90px var(--brand-shadow)"
      }
    }
  },
  plugins: []
};

export default config;
