/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        civic: {
          navy: "#0f2942",
          "navy-dark": "#0a1b2b",
          blue: "#1e3a8a",
          "blue-hover": "#1e40af",
          cyan: "#0284c7",
          "cyan-light": "#e0f2fe",
          orange: "#ea580c",
          "orange-light": "#ffedd5",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
