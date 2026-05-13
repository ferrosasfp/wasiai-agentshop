import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        paper: "#fafaf7",
        line: "#e5e5dc",
        muted: "#6b6b62",
        accent: "#1c5c45",
        warm: "#c47e3b",
      },
      fontFamily: {
        serif: ["'Spectral'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
