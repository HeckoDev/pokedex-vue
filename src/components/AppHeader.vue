<template>
  <header class="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <svg class="w-10 h-10 text-red-500" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="currentColor" />
            <circle cx="50" cy="50" r="40" fill="white" />
            <circle cx="50" cy="50" r="15" fill="currentColor" />
            <rect x="0" y="47" width="100" height="6" fill="black" />
          </svg>
          <h1 class="text-2xl font-bold text-white">Pokédex</h1>
        </div>

        <!-- Hamburger button (mobile) -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="lg:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition"
          :aria-label="t('header.toggleMenu')"
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
        <nav class="hidden lg:flex items-center gap-4" aria-label="Navigation principale">
          <!-- Teams button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            @click="$emit('openTeams')"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
            :aria-label="t('header.teams')"
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
            @click="$emit('openFavorites')"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
            :aria-label="t('header.favorites')"
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
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-haspopup="true"
              :aria-expanded="showUserMenu"
              :aria-label="`Menu utilisateur ${user?.username}`"
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
              aria-label="Menu utilisateur"
              class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700"
            >
              <button
                @click="handleLogout"
                role="menuitem"
                class="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2 focus:outline-none focus:bg-gray-700"
                :aria-label="t('header.logout')"
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
            @click="$emit('openAuth')"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
            :aria-label="t('header.login')"
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
          class="lg:hidden mt-4 py-4 border-t border-gray-800 flex flex-col gap-3"
        >
          <!-- Teams button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            @click="handleMobileMenuClick('openTeams')"
            class="flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold w-full"
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
            @click="handleMobileMenuClick('openFavorites')"
            class="flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold w-full"
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
            class="flex flex-col gap-2 pt-2 border-t border-gray-800"
          >
            <div class="flex items-center gap-3 px-4 py-2 text-white">
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
              @click="handleMobileLogout"
              class="flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition w-full"
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
            @click="handleMobileMenuClick('openAuth')"
            class="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold w-full"
          >
            {{ t('header.login') }}
          </button>
        </nav>
      </Transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useTranslation } from "@/composables/useTranslation";

const emit = defineEmits<{
  openAuth: [];
  openTeams: [];
  openFavorites: [];
}>();

const { isAuthenticated, user, logout } = useAuth();
const { t } = useTranslation();
const showUserMenu = ref(false);
const mobileMenuOpen = ref(false);

const handleLogout = () => {
  logout();
  showUserMenu.value = false;
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
