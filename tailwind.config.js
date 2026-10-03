/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warm-white': '#FAF9F6',
        'charcoal': '#333333',
      },
      fontFamily: {
        'elegant': ['ElegantSerif', 'serif'],
        'sans': ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
