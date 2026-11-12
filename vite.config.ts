import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Pokédex",
        short_name: "Pokédex",
        start_url: "/pokedex-vue/",
        scope: "/pokedex-vue/",
        display: "standalone",
        background_color: "#111827",
        theme_color: "#dc2626",
        icons: [{ src: "pokeball.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,json}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(pokeapi\.co\/api|raw\.githubusercontent\.com\/PokeAPI)\/.*/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "pokeapi", expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 3600 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  base: process.env.NODE_ENV === "production" ? "/pokedex-vue/" : "/",
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue"],
        },
      },
    },
  },
});
