import type { Config } from "tailwindcss";

/** storyroute_ai_full_ui_prototype.html 기준 팔레트 + 강원 보조색 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sr: {
          dark: "#07101f",
          navy: "#0f2048",
          soft: "#0d1830",
          primary: "#6d5efc",
          cyan: "#20c5ff",
          surface: "#f4f7ff",
          surface2: "#eef3ff",
          line: "#d9e3f7",
          line2: "#c7d3ee",
          text: "#0f172a",
          muted: "#5f6b85",
          green: "#12c48b",
          orange: "#f59f0b",
        },
        gw: {
          deep: "#0B3E8C",
          blue: "#125ED9",
          fresh: "#0B8C4C",
          light: "#E3F2FD",
          bg: "#F1F5F9",
        },
      },
      boxShadow: {
        sr: "0 24px 60px rgba(14,24,48,.10)",
        "sr-dark": "0 24px 60px rgba(3,10,24,.40)",
        glow: "0 14px 28px rgba(109,94,252,.24)",
      },
      borderRadius: {
        window: "30px",
      },
      maxWidth: {
        page: "1540px",
      },
    },
  },
  plugins: [],
};
export default config;
