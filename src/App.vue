<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import PokemonList from "./components/PokemonList.vue";
import AppHeader from "./components/AppHeader.vue";
import AuthModal from "./components/AuthModal.vue";
import AccountModal from "./components/AccountModal.vue";
import FavoritesModal from "./components/FavoritesModal.vue";
import TeamsModal from "./components/TeamsModal.vue";
import FiltersModal from "./components/FiltersModal.vue";
import { usePokemon } from "./composables/usePokemon";
import { useAuth } from "./composables/useAuth";
import { useFavorites } from "./composables/useFavorites";
import { useTeams } from "./composables/useTeams";

// Modal states for authentication, teams and favorites
const showAuthModal = ref(false);
const showAccountModal = ref(false);
const showTeamsModal = ref(false);
const showFavoritesModal = ref(false);
const showFiltersModal = ref(false);

const { applyAdvancedFilters } = usePokemon();
const { isAuthenticated, logout } = useAuth();
const { fetchFavorites, clearFavorites } = useFavorites();
const { fetchTeams, clearTeams } = useTeams();

// Load the user's data from the API whenever they become authenticated,
// and clear it when they log out.
const loadUserData = () => {
  fetchFavorites();
  fetchTeams();
};

watch(isAuthenticated, (authed) => {
  if (authed) {
    loadUserData();
  } else {
    clearFavorites();
    clearTeams();
  }
});

onMounted(() => {
  if (isAuthenticated.value) {
    loadUserData();
  }
});

const handleAuthSuccess = () => {
  loadUserData();
};

const handleAccountDeleted = () => {
  logout();
  showAccountModal.value = false;
};

const handleApplyFilters = (filters: {
  generations: number[];
  sortBy: { field: string; order: "asc" | "desc" } | null;
}) => {
  applyAdvancedFilters(filters);
};
</script>

<template>
  <div
    id="app"
    class="min-h-screen bg-gradient-to-br from-surface-base via-surface-raised to-surface-base text-content"
  >
    <!-- Skip to main content link for keyboard navigation -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
    </a>

    <AppHeader
      @open-auth="showAuthModal = true"
      @open-teams="showTeamsModal = true"
      @open-favorites="showFavoritesModal = true"
      @open-account="showAccountModal = true"
    />

    <div id="main-content">
      <PokemonList 
        @open-auth="showAuthModal = true"
        @open-filters="showFiltersModal = true"
      />
    </div>

    <AuthModal
      :is-open="showAuthModal"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />

    <AccountModal
      :is-open="showAccountModal"
      @close="showAccountModal = false"
      @deleted="handleAccountDeleted"
    />

    <FavoritesModal
      :is-open="showFavoritesModal"
      @close="showFavoritesModal = false"
    />

    <TeamsModal :is-open="showTeamsModal" @close="showTeamsModal = false" />

    <FiltersModal
      :is-open="showFiltersModal"
      @close="showFiltersModal = false"
      @apply-filters="handleApplyFilters"
    />
  </div>
</template>
