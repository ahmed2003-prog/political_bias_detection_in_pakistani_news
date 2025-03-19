/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0D",
        foreground: "#1A1A1A",
        accent: "#EAEAEA",
      },
    },
  },
  plugins: [],
};
