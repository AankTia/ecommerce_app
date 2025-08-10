module.exports = {
  content: [
    "./app/views/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/javascript/**/*.js",
    "./app/javascript/**/*.jsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#5eead4",
          DEFAULT: "#14b8a6",
          dark: "#0f766e",
        },
        secondary: {
          light: "#bae6fd",
          DEFAULT: "#0ea5e9",
          dark: "#0369a1",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};