/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ---- Brand / Pokédex identity ----
        pokedex: {
          red: "#DC0A2D", // classic Poké Ball red (primary brand)
          "red-dark": "#B00823",
          gold: "#FFCB05", // Pokémon logo yellow (accent, use on dark only)
          blue: "#3B4CCA", // Pokémon logo blue (secondary)
        },
        // ---- App surfaces (dark UI) — 60/30/10 ----
        surface: {
          base: "#0B1120", // 60% app background (deepest)
          raised: "#111827", // 30% cards / sections (gray-900)
          overlay: "#1F2937", // modal panels / dropdowns (gray-800)
          hover: "#374151", // interactive hover surface (gray-700)
          border: "#293445", // hairline borders
        },
        // ---- Text tokens (all AA on surface.raised #111827) ----
        content: {
          strong: "#F9FAFB", // headings / primary (17.4:1)
          DEFAULT: "#E5E7EB", // body (13.9:1)
          muted: "#B8BCC4", // secondary — replaces white/70 & gray-400 (9.1:1)
          subtle: "#9CA3AF", // tertiary min — 6.99:1 on base, keep OFF light bg
        },
        // ---- Semantic states ----
        success: "#15803D", // green-700 (white text 4.9:1)
        warning: "#B45309", // amber-700 (white text 5.9:1)
        danger: "#DC2626", // red-600  (white text 4.83:1)
        info: "#2563EB", // blue-600 (white text 5.17:1)
        focus: "#7DD3FC", // sky-300 — high-contrast focus ring on dark
      },
      fontFamily: {
        sans: ['OpenDyslexic', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        display: ['OpenDyslexic', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: "1rem", // 16px  → PokemonCard
        modal: "1.5rem", // 24px  → modal panels
        control: "0.625rem", // 10px → buttons/inputs
      },
      boxShadow: {
        e1: "0 1px 2px 0 rgb(0 0 0 / 0.30)",
        e2: "0 4px 12px -2px rgb(0 0 0 / 0.40)", // card resting
        e3: "0 10px 24px -4px rgb(0 0 0 / 0.50)", // card hover / dropdown
        e4: "0 20px 40px -8px rgb(0 0 0 / 0.60)", // modal
        e5: "0 0 0 1px rgb(255 255 255 / 0.05), 0 24px 60px -10px rgb(0 0 0 / 0.7)", // toast/focus
        glow: "0 0 20px -4px rgb(220 10 45 / 0.55)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fade-in .25s ease-out both",
        "fade-up": "fade-up .35s cubic-bezier(.22,1,.36,1) both",
        "scale-in": "scale-in .2s cubic-bezier(.22,1,.36,1) both",
        pop: "pop .3s ease-out",
        shimmer: "shimmer 1.4s infinite",
      },
      transitionTimingFunction: {
        emphasis: "cubic-bezier(.22,1,.36,1)", // decel — enters
        standard: "cubic-bezier(.4,0,.2,1)", // most UI
      },
    },
  },
  plugins: [],
};
