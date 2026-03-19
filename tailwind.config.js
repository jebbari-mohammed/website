/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#F97316",
                secondary: "#FB923C",
                cta: "#22C55E",
                bgPrimary: "#1F2937",
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
