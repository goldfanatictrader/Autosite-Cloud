import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      lg: "1024px",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#DBEAFE",
        },
        secondary: {
          DEFAULT: "#7C3AED",
          light: "#EDE9FE",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
        draft: "#6B7280",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
        },
        placeholder: "var(--color-placeholder)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-lg": ["36px", { lineHeight: "1.2", fontWeight: "700" }],
        "display-md": ["30px", { lineHeight: "1.2", fontWeight: "700" }],
        "display-sm": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-lg": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "heading-md": ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-md": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-sm": ["10px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      spacing: {
        0: "0px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px rgba(0,0,0,0.07)",
        lg: "0 10px 15px rgba(0,0,0,0.1)",
        xl: "0 20px 25px rgba(0,0,0,0.15)",
      },
      ringWidth: {
        3: "3px",
      },
    },
  },
  plugins: [],
};

export default config;
