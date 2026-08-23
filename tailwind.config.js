/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1d1f",
        surface: "#f5f5f7",
        line: "#d2d2d7",
        accent: "#0071e3",
        critical: "#d70015",
        high: "#c2410c",
        medium: "#a16207",
        low: "#0d9488",
      },
      fontFamily: {
        sans: ["-apple-system", "Inter", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
