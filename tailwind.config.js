/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#faf8f5",
        ink: "#222222",
        muted: "#5f5a55",
        line: "#e6dfd8",
        blush: "#f4e6e0",
        maroon: { DEFAULT: "#7b1e2e", dark: "#5e1522" },
        gold: "#b08a3e",
        save: "#1c7a4c",
      },
      fontFamily: {
        serif: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
