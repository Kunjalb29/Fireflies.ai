import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // MeetMind Brand Colors
        primary: {
          DEFAULT: "#6C47FF",
          dark: "#5235D8",
          hover: "#7C5AFF",
        },
        accent: "#00C2FF",
        // Backgrounds
        bg: {
          dark: "#0F0F13",
          light: "#FAFAFA",
        },
        surface: {
          dark: "#1A1A24",
          card: "#1E1E2A",
          hover: "#242432",
          light: "#FFFFFF",
        },
        // Text
        text: {
          primary: {
            dark: "#F0F0F8",
            light: "#111118",
          },
          muted: {
            dark: "#8888A4",
            light: "#6B6B80",
          },
        },
        // Status colors
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        // Border
        border: {
          dark: "rgba(255,255,255,0.08)",
          light: "rgba(0,0,0,0.08)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        input: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-hover": "0 8px 25px rgba(108,71,255,0.15), 0 4px 12px rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(108,71,255,0.3)",
        "glow-accent": "0 0 20px rgba(0,194,255,0.3)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "pulse-slow": "pulse 3s infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(135deg, #0F0F13 0%, #1a0a2e 35%, #0a1a2e 65%, #0F0F13 100%)",
        shimmer: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
