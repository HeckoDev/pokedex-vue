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

        <!-- Navigation -->
        <nav class="flex items-center gap-4">
          <!-- Teams button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            @click="$emit('openTeams')"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
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
            Mes équipes
          </button>

          <!-- Favorites button (authenticated only) -->
          <button
            v-if="isAuthenticated"
            @click="$emit('openFavorites')"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Favoris
          </button>

          <!-- User menu -->
          <div v-if="isAuthenticated" class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {{ user?.username }}
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700"
            >
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
              >
                <svg
                  class="w-4 h-4"
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
                Déconnexion
              </button>
            </div>
          </div>

          <!-- Login button (not authenticated) -->
          <button
            v-else
            @click="$emit('openAuth')"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
          >
            Se connecter
          </button>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";

defineEmits<{
  openAuth: [];
  openTeams: [];
  openFavorites: [];
}>();

const { isAuthenticated, user, logout } = useAuth();
const showUserMenu = ref(false);

const handleLogout = () => {
  logout();
  showUserMenu.value = false;
};
</script>
