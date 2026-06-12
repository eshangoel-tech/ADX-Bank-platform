import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        base: "var(--bg-base)",
        card: "var(--bg-card)",
        elevated: "var(--bg-elevated)",
        accent: "var(--accent)",
        gold: "var(--gold)",
      },
      animation: {
        "balance-shimmer": "balance-shimmer 8s ease-in-out infinite",
        "draw-circle": "draw-circle 0.5s ease-out forwards",
        "draw-check": "draw-check 0.35s ease-out 0.45s forwards",
        "dot-scale": "dot-scale 0.6s ease-in-out infinite",
      },
      keyframes: {
        "balance-shimmer": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "draw-circle": {
          from: { strokeDashoffset: "157" },
          to: { strokeDashoffset: "0" },
        },
        "draw-check": {
          from: { strokeDashoffset: "50" },
          to: { strokeDashoffset: "0" },
        },
        "dot-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
