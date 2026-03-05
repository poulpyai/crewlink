import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Aviation Blue theme
        primary: {
          DEFAULT: "#0066CC",
          50: "#E6F2FF",
          100: "#CCE5FF",
          200: "#99CCFF",
          300: "#66B2FF",
          400: "#3399FF",
          500: "#0066CC", // Main
          600: "#0052A3",
          700: "#003D7A",
          800: "#002952",
          900: "#001429",
        },
        accent: {
          DEFAULT: "#00D9FF",
          50: "#E6FAFF",
          100: "#CCF5FF",
          200: "#99EBFF",
          300: "#66E1FF",
          400: "#33D7FF",
          500: "#00D9FF", // Main
          600: "#00AED9",
          700: "#0082A3",
          800: "#00576D",
          900: "#002B36",
        },
        success: "#00C853",
        warning: "#FFC107",
        error: "#FF3B30",
        // Dark mode
        dark: {
          bg: "#0A0A0A",
          surface: "#1A1A1A",
          border: "#2A2A2A",
          text: "#FFFFFF",
          "text-secondary": "#A0A0A0",
        },
        // Light mode
        light: {
          bg: "#FFFFFF",
          surface: "#F5F5F5",
          border: "#E0E0E0",
          text: "#0A0A0A",
          "text-secondary": "#6B6B6B",
        },
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Text", "system-ui", "sans-serif"],
        display: ["Geist", "SF Pro Display", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "SF Mono", "monospace"],
      },
      fontSize: {
        // Responsive typography
        "display-lg": ["3rem", { lineHeight: "1.2", fontWeight: "700" }], // 48px
        "display-md": ["2.25rem", { lineHeight: "1.2", fontWeight: "700" }], // 36px
        "display-sm": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }], // 24px
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }], // 18px
        "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "400" }], // 16px
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }], // 14px
        "caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "400" }], // 12px
      },
      spacing: {
        // 8px base unit
        "18": "4.5rem", // 72px
        "22": "5.5rem", // 88px
      },
      borderRadius: {
        "card": "0.5rem", // 8px
        "button": "0.25rem", // 4px
        "modal": "1rem", // 16px
      },
      boxShadow: {
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "modal": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 300ms ease-out",
        "slide-down": "slideDown 300ms ease-out",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
