/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/aceternity-ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Using class strategy for dark mode
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#ffffff",
        "card-background": "rgba(22, 22, 22, 0.7)",
        "dark-green": "#143d25",
        "light-green": "#4ade80",
        "accent-yellow": "#fbbf24",
        "overlay-green": "rgba(16, 44, 30, 0.4)",
        "glass-highlight": "rgba(255, 255, 255, 0.08)",
        border: "rgba(255, 255, 255, 0.1)",
      },
      animation: {
        spotlight: "spotlight 2s ease .75s 1 forwards",
        shimmer: "shimmer 2s linear infinite",
        "meteor-effect": "meteor 5s linear infinite",
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: 1 },
          "70%": { opacity: 1 },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: 0,
          },
        },
      },
      backgroundImage: {
        'gradient-radial-dark': 'radial-gradient(circle, var(--dark-green), transparent)',
      },
    },
  },
  plugins: [],
};