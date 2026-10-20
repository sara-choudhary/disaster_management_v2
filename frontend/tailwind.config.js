/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coastal: {
          powder: "#DCEAF3",
          lavender: "#E8E2EF",
          peach: "#F5E2D6",
          cream: "#FBF8F2",
          rose: "#C98F9B",
          mauve: "#AA96B5",
          cerulean: "#6D9EBA",
          sand: "#C9B69B",
          mountain: "#8C7565",
          text: "#393640",
          secondary: "#746E79",
          border: "#E2D9D5",
          healthy: "#B8D6BE",
          warning: "#E6CD8C",
          suspicious: "#DCA77C",
          critical: "#CC858D",
          neutral: "#A9BAC7",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}
