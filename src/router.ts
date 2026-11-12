import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import TypeMatchupView from "@/views/TypeMatchupView.vue";

// Hash history keeps deep links working on GitHub Pages (no server-side fallback)
export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView, meta: { title: "Pokédex" } },
    { path: "/faiblesses", name: "matchup", component: TypeMatchupView, meta: { title: "Pokédex – Faiblesses et résistances" } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

// SPA navigation: keep the page title accurate and move focus to the new content (WCAG 2.4.2, 2.4.3)
router.afterEach((to, from) => {
  document.title = (to.meta.title as string | undefined) ?? "Pokédex";
  if (from.name) {
    requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
  }
});
