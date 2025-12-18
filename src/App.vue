<script setup lang="ts">
import { ref } from "vue";
import PokemonList from "./components/PokemonList.vue";
import AppHeader from "./components/AppHeader.vue";
import AuthModal from "./components/AuthModal.vue";
import FavoritesModal from "./components/FavoritesModal.vue";
import TeamsModal from "./components/TeamsModal.vue";

// Modal states for authentication, teams and favorites
const showAuthModal = ref(false);
const showTeamsModal = ref(false);
const showFavoritesModal = ref(false);

const handleAuthSuccess = async () => {
  // Data is now automatically loaded from localStorage
  // No need to make API calls
};
</script>

<template>
  <div
    id="app"
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
  >
    <!-- Skip to main content link for keyboard navigation -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
    </a>

    <AppHeader
      @open-auth="showAuthModal = true"
      @open-teams="showTeamsModal = true"
      @open-favorites="showFavoritesModal = true"
    />

    <div id="main-content">
      <PokemonList @open-auth="showAuthModal = true" />
    </div>

    <AuthModal
      :is-open="showAuthModal"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />

    <FavoritesModal
      :is-open="showFavoritesModal"
      @close="showFavoritesModal = false"
    />

    <TeamsModal :is-open="showTeamsModal" @close="showTeamsModal = false" />
  </div>
</template>
