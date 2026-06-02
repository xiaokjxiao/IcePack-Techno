/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      fontSize: {
        "resp-xs": [
          "clamp(0.5625rem, 0.5rem + 0.5vw, 0.75rem)",
          { lineHeight: "1rem" },
        ],
        "resp-sm": [
          "clamp(0.6875rem, 0.625rem + 0.5vw, 0.875rem)",
          { lineHeight: "1.25rem" },
        ],
        "resp-base": [
          "clamp(0.875rem, 0.8125rem + 0.5vw, 1.125rem)",
          { lineHeight: "1.625rem" },
        ],
        "resp-lg": [
          "clamp(1rem, 0.9375rem + 0.5vw, 1.25rem)",
          { lineHeight: "1.75rem" },
        ],
        "resp-xl": [
          "clamp(1.125rem, 1rem + 0.75vw, 1.5rem)",
          { lineHeight: "1.875rem" },
        ],
        "resp-2xl": [
          "clamp(1.25rem, 1.125rem + 1vw, 1.875rem)",
          { lineHeight: "2rem" },
        ],
        "resp-3xl": [
          "clamp(1.5rem, 1.25rem + 1.5vw, 2.25rem)",
          { lineHeight: "2.5rem" },
        ],
        "resp-4xl": [
          "clamp(1.625rem, 1.25rem + 2vw, 3rem)",
          { lineHeight: "2.75rem" },
        ],
      },
      spacing: {
        "resp-sm": "clamp(0.375rem, 0.25rem + 1vw, 0.75rem)",
        "resp-md": "clamp(0.75rem, 0.5rem + 1.5vw, 1.5rem)",
        "resp-lg": "clamp(1.25rem, 1rem + 2vw, 2rem)",
        "resp-xl": "clamp(1.5rem, 1rem + 3vw, 3rem)",
        "resp-2xl": "clamp(2.25rem, 1.5rem + 4vw, 4rem)",
      },
    },
  },
  plugins: [],
}