/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#8DFF6A",
                secondary: "#86D7FF",
                tertiary: "#FFD36E",
                cta: "#7CFF6B",
                bgPrimary: "#070A0D",
                bgSecondary: "#0E151B",
                bgTertiary: "#16222B",
                bgCard: "#111A22",
                bgElevated: "#17232D",
                bgInteractive: "#1B2934",
                textPrimary: "#F5F7FA",
                textSecondary: "#A9B4C0",
                textTertiary: "#73808C",
                textAccent: "#7CFF6B",
                glass: "rgba(17, 26, 34, 0.74)",
                glassBorder: "rgba(255, 255, 255, 0.12)",
                borderDefault: "rgba(255, 255, 255, 0.12)",
                borderSubtle: "rgba(255, 255, 255, 0.08)",
                borderActive: "#8DFF6A",
                borderCard: "rgba(255, 255, 255, 0.10)",
                statusCalm: "#6EE7B7",
                statusSupportive: "#FCD34D",
                statusDirectPush: "#F97316",
                statusHighChallenge: "#EF4444",
                statusNotification: "#D0F500"
            },
            fontFamily: {
                sans: ['"Hanken Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Anton', 'Jost', 'sans-serif'],
                condensed: ['Jost', 'Anton', 'ui-sans-serif', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            boxShadow: {
                neon: '0 0 25px rgba(141, 255, 106, 0.25)',
                neonGlow: '0 0 40px rgba(141, 255, 106, 0.4)',
                cyanGlow: '0 0 40px rgba(134, 215, 255, 0.3)',
                glass: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }
        },
    },
    plugins: [],
}
