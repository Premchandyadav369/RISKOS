/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: "#F5F6F4",
          surface: "#FFFFFF",
          secondary: "#EEF0ED",
          border: "#D9DDD8",
        },
        text: {
          main: "#17201B",
          muted: "#69736C",
          light: "#8F9892",
        },
        forest: {
          DEFAULT: "#176B4D",
          dark: "#0F513A",
          light: "#E5F1EB",
        },
        status: {
          normal: "#2F7D5A",
          warning: "#B27A1A",
          critical: "#B54242",
        }
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      }
    },
  },
  plugins: [],
}
