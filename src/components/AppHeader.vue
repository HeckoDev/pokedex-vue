<template>
  <header class="bg-surface-raised/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-40">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <svg class="w-11 h-11 text-pokedex-red transition hover:drop-shadow-[0_0_8px_rgba(220,10,45,0.6)]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="currentColor" />
            <circle cx="50" cy="50" r="40" fill="white" />
            <circle cx="50" cy="50" r="15" fill="currentColor" />
            <rect x="0" y="47" width="100" height="6" fill="black" />
          </svg>
          <h1 class="text-2xl font-bold text-content-strong">Pokédex</h1>
        </div>

        <!-- Hamburger button (mobile) -->
        <button
          class="lg:hidden p-2 text-content-strong hover:bg-surface-hover rounded-control transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          :aria-label="t('header.toggleMenu')"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center gap-4" :aria-label="t('aria.mainNav')">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            :aria-current="isCurrent(link.href) ? 'page' : undefined"
            :class="[
              'px-4 py-2.5 min-h-[44px] inline-flex items-center rounded-control transition font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
              isCurrent(link.href) ? 'bg-surface-hover text-content-strong' : 'text-content hover:bg-surface-hover',
            ]"
          >
            {{ t(link.label) }}
          </a>

          <!-- Teams button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            class="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-surface-overlay hover:bg-surface-hover border border-surface-border text-content-strong rounded-control transition font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            :aria-label="t('header.teams')"
            @click="$emit('openTeams')"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {{ t('header.teams') }}
          </button>

          <!-- Favorites button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            class="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-pokedex-red hover:bg-pokedex-red-dark text-white rounded-control transition font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            :aria-label="t('header.favorites')"
            @click="$emit('openFavorites')"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {{ t('header.favorites') }}
          </button>

          <!-- User menu -->
          <div v-if="isAuthenticated" class="relative">
            <button
              class="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-surface-overlay hover:bg-surface-hover text-content-strong rounded-control transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              aria-haspopup="true"
              :aria-expanded="showUserMenu"
              :aria-label="`Menu utilisateur ${user?.username}`"
              @click="showUserMenu = !showUserMenu"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {{ user?.username }}
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="showUserMenu"
              role="menu"
              :aria-label="t('aria.userMenu')"
              class="absolute right-0 mt-2 w-48 bg-surface-overlay rounded-card shadow-e3 py-2 border border-surface-border"
            >
              <button
                role="menuitem"
                class="w-full text-left px-4 py-2 text-content-strong hover:bg-surface-hover transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                :aria-label="t('header.account')"
                @click="handleAccount"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {{ t('header.account') }}
              </button>
              <button
                role="menuitem"
                class="w-full text-left px-4 py-2 text-content-strong hover:bg-surface-hover transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                :aria-label="t('header.logout')"
                @click="handleLogout"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {{ t('header.logout') }}
              </button>
            </div>
          </div>

          <!-- Login button (not authenticated) -->
          <button
            v-else
            class="px-4 py-2.5 min-h-[44px] bg-pokedex-red hover:bg-pokedex-red-dark text-white rounded-control transition font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            :aria-label="t('header.login')"
            @click="$emit('openAuth')"
          >
            {{ t('header.login') }}
          </button>
        </nav>
      </div>

      <!-- Mobile Navigation Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav
          v-if="mobileMenuOpen"
          class="lg:hidden mt-4 py-4 border-t border-surface-border flex flex-col gap-3"
        >
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            :aria-current="isCurrent(link.href) ? 'page' : undefined"
            class="px-4 py-3 rounded-control font-semibold text-content-strong bg-surface-overlay hover:bg-surface-hover border border-surface-border focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            @click="mobileMenuOpen = false"
          >
            {{ t(link.label) }}
          </a>

          <!-- Teams button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            class="flex items-center gap-3 px-4 py-3 bg-surface-overlay hover:bg-surface-hover border border-surface-border text-content-strong rounded-control transition font-semibold w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            @click="handleMobileMenuClick('openTeams')"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {{ t('header.teams') }}
          </button>

          <!-- Favorites button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            class="flex items-center gap-3 px-4 py-3 bg-pokedex-red hover:bg-pokedex-red-dark text-white rounded-control transition font-semibold w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            @click="handleMobileMenuClick('openFavorites')"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {{ t('header.favorites') }}
          </button>

          <!-- User info and logout (authenticated only) -->
          <div
            v-if="isAuthenticated"
            class="flex flex-col gap-2 pt-2 border-t border-surface-border"
          >
            <div class="flex items-center gap-3 px-4 py-2 text-content-strong">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span class="font-semibold">{{ user?.username }}</span>
            </div>
            <button
              class="flex items-center gap-3 px-4 py-3 bg-surface-overlay hover:bg-surface-hover text-content-strong rounded-control transition w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              @click="handleMobileAccount"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {{ t('header.account') }}
            </button>
            <button
              class="flex items-center gap-3 px-4 py-3 bg-surface-overlay hover:bg-surface-hover text-content-strong rounded-control transition w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              @click="handleMobileLogout"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {{ t('header.logout') }}
            </button>
          </div>

          <!-- Login button (not authenticated) -->
          <button
            v-else
            class="flex items-center justify-center gap-2 px-4 py-3 bg-pokedex-red hover:bg-pokedex-red-dark text-white rounded-control transition font-semibold w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            @click="handleMobileMenuClick('openAuth')"
          >
            {{ t('header.login') }}
          </button>
        </nav>
      </Transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useTranslation } from "@/composables/useTranslation";

const emit = defineEmits<{
  openAuth: [];
  openTeams: [];
  openFavorites: [];
  openAccount: [];
}>();

const { isAuthenticated, user, logout } = useAuth();
const { t } = useTranslation();
const showUserMenu = ref(false);
const mobileMenuOpen = ref(false);

// Hash-based routes: plain links keep the header independent of the router instance
const navLinks = [
  { href: "#/", label: "matchup.home" },
  { href: "#/faiblesses", label: "matchup.nav" },
] as const;
const currentHash = ref(window.location.hash || "#/");
const updateHash = () => {
  currentHash.value = window.location.hash || "#/";
};
const isCurrent = (href: string): boolean => (href === "#/" ? currentHash.value === "#/" || currentHash.value === "" : currentHash.value === href);

onMounted(() => window.addEventListener("hashchange", updateHash));
onUnmounted(() => window.removeEventListener("hashchange", updateHash));

const handleLogout = () => {
  logout();
  showUserMenu.value = false;
};

const handleAccount = () => {
  emit("openAccount");
  showUserMenu.value = false;
};

const handleMobileAccount = () => {
  emit("openAccount");
  mobileMenuOpen.value = false;
};

const handleMobileLogout = () => {
  logout();
  mobileMenuOpen.value = false;
};

const handleMobileMenuClick = (action: "openAuth" | "openTeams" | "openFavorites") => {
  switch (action) {
    case "openAuth":
      emit("openAuth");
      break;
    case "openTeams":
      emit("openTeams");
      break;
    case "openFavorites":
      emit("openFavorites");
      break;
  }
  mobileMenuOpen.value = false;
};
</script>
