/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#00D4FF",
                secondary: "#7C5CFC",
                cta: "#34D399",
                bgPrimary: "#060B1D",
                textPrimary: "#F8FAFC",
                textSecondary: "#94A3B8",
                glass: "rgba(255, 255, 255, 0.04)",
                glassBorder: "rgba(255, 255, 255, 0.08)",
            },
            fontFamily: {
                sans: ['Barlow', 'sans-serif'],
                condensed: ['Barlow Condensed', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
