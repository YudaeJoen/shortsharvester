/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0b0d10",
          card: "#14171d",
          border: "#232731",
          muted: "#8c9ba8",
          yellow: "#FFE600",
          yellowHover: "#E6CF00",
          red: "#FF3B30",
          accent: "#38bdf8"
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
