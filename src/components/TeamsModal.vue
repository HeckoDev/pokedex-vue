<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      @click.self="close"
    >
      <div
        class="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative"
      >
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <svg
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

        <!-- Title -->
        <h2 class="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <svg
            class="w-8 h-8 text-blue-500"
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
          {{ t('teams.title') }}
        </h2>

        <!-- Create team button -->
        <div v-if="canCreateTeam()" class="mb-6">
          <button
            v-if="!showCreateForm"
            @click="showCreateForm = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
          >
            {{ t('teams.createButton') }}
          </button>

          <!-- Create form -->
          <div v-else class="bg-gray-800 rounded-lg p-4">
            <input
              v-model="newTeamName"
              type="text"
              :placeholder="t('teams.teamName')"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded mb-2"
              @keyup.enter="handleCreateTeam"
            />
            <div class="flex gap-2">
              <button
                @click="handleCreateTeam"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
              >
                {{ t('teams.create') }}
              </button>
              <button
                @click="
                  showCreateForm = false;
                  newTeamName = '';
                "
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                {{ t('teams.cancel') }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="mb-6">
          <p class="text-yellow-500">
            {{ t('teams.limit') }}
          </p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"
          ></div>
        </div>

        <!-- Empty state -->
        <div v-else-if="teams.length === 0" class="text-center py-12">
          <svg
            class="w-20 h-20 text-gray-600 mx-auto mb-4"
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
          <p class="text-gray-400 text-lg">{{ t('teams.empty') }}</p>
          <p class="text-gray-500 text-sm mt-2">
            {{ t('teams.emptyHint') }}
          </p>
        </div>

        <!-- Teams list -->
        <div v-else class="space-y-6">
          <div
            v-for="team in teamsWithData"
            :key="team.id"
            class="bg-gray-800 rounded-lg p-6"
          >
            <!-- Team header -->
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-bold text-white">{{ team.name }}</h3>
              <div class="flex gap-2">
                <span class="text-sm text-gray-400">
                  {{ team.pokemons?.length || 0 }}/6 {{ t('teams.pokemonCount') }}
                </span>
                <button
                  @click="handleDeleteTeam(team.id)"
                  class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                >
                  {{ t('teams.delete') }}
                </button>
              </div>
            </div>

            <!-- Pokemon slots -->
            <div class="grid grid-cols-6 gap-4">
              <div
                v-for="position in 6"
                :key="position"
                class="bg-gray-700 rounded-lg p-3 min-h-[120px] flex flex-col items-center justify-center"
              >
                <template v-if="getPokemonAtPosition(team, position)">
                  <div class="relative group">
                    <img
                      :src="getPokemonData(getPokemonAtPosition(team, position)!.pokemon_id)?.sprites.regular"
                      :alt="getPokemonData(getPokemonAtPosition(team, position)!.pokemon_id)?.name.fr"
                      class="h-16 object-contain mb-1"
                    />
                    <button
                      @click="
                        handleRemovePokemon(
                          team.id,
                          getPokemonAtPosition(team, position)!.id
                        )
                      "
                      class="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        class="w-3 h-3 text-white"
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
                  </div>
                  <p class="text-white text-xs text-center">
                    {{
                      getPokemonData(
                        getPokemonAtPosition(team, position)!.pokemon_id
                      )?.name.fr
                    }}
                  </p>
                </template>
                <template v-else>
                  <button
                    @click="openAddPokemon(team.id, position)"
                    class="text-gray-400 hover:text-white transition text-2xl"
                  >
                    +
                  </button>
                  <p class="text-gray-500 text-xs mt-1">
                    {{ t('teams.position') }} {{ position }}
                  </p>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Pokemon Modal (nested) -->
        <div
          v-if="showAddPokemon"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 p-4"
          @click.self="closeAddPokemon"
        >
          <div
            class="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
          >
            <h3 class="text-xl font-bold text-white mb-4">
              {{ t('teams.selectPokemon') }}
            </h3>

            <!-- Search -->
            <input
              v-model="pokemonSearch"
              type="text"
              :placeholder="t('teams.search')"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded mb-4"
            />

            <!-- Pokemon grid -->
            <div class="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              <button
                v-for="pokemon in filteredPokemons"
                :key="pokemon.pokedex_id"
                @click="handleAddPokemon(pokemon.pokedex_id)"
                class="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition"
              >
                <img
                  :src="pokemon.sprites.regular"
                  :alt="pokemon.name.fr"
                  class="h-16 object-contain mx-auto mb-1"
                />
                <p class="text-white text-xs text-center">
                  {{ pokemon.name.fr }}
                </p>
                <p class="text-gray-400 text-xs text-center">
                  #{{ pokemon.pokedex_id }}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useTeams } from "@/composables/useTeams";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const {
  teams,
  loading,
  fetchTeams,
  createTeam,
  deleteTeam,
  addPokemonToTeam,
  removePokemonFromTeam,
  canCreateTeam,
} = useTeams();
const { allPokemons } = usePokemon();
const { t } = useTranslation();

const showCreateForm = ref(false);
const newTeamName = ref("");
const showAddPokemon = ref(false);
const selectedTeamId = ref<number | null>(null);
const selectedPosition = ref<number | null>(null);
const pokemonSearch = ref("");

const teamsWithData = computed(() => teams.value);

const filteredPokemons = computed(() => {
  if (!pokemonSearch.value) return allPokemons.value;
  const search = pokemonSearch.value.toLowerCase();
  return allPokemons.value.filter(
    (p) =>
      p.name.fr.toLowerCase().includes(search) ||
      p.name.en.toLowerCase().includes(search) ||
      p.pokedex_id.toString().includes(search)
  );
});

const getPokemonAtPosition = (team: any, position: number) => {
  return team.pokemons?.find((p: any) => p.position === position);
};

const getPokemonData = (pokemonId: number) => {
  return allPokemons.value.find((p) => p.pokedex_id === pokemonId);
};

const handleCreateTeam = async () => {
  if (!newTeamName.value.trim()) return;
  await createTeam(newTeamName.value);
  newTeamName.value = "";
  showCreateForm.value = false;
};

const handleDeleteTeam = async (teamId: number) => {
  if (confirm("Are you sure you want to delete this team?")) {
    await deleteTeam(teamId);
  }
};

const openAddPokemon = (teamId: number, position: number) => {
  selectedTeamId.value = teamId;
  selectedPosition.value = position;
  showAddPokemon.value = true;
};

const closeAddPokemon = () => {
  showAddPokemon.value = false;
  selectedTeamId.value = null;
  selectedPosition.value = null;
  pokemonSearch.value = "";
};

const handleAddPokemon = async (pokemonId: number) => {
  if (selectedTeamId.value && selectedPosition.value) {
    await addPokemonToTeam(
      selectedTeamId.value,
      pokemonId,
      selectedPosition.value
    );
    closeAddPokemon();
    await fetchTeams();
  }
};

const handleRemovePokemon = async (teamId: number, pokemonId: number) => {
  await removePokemonFromTeam(teamId, pokemonId);
  await fetchTeams();
};

const close = () => {
  emit("close");
  showCreateForm.value = false;
  newTeamName.value = "";
};

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      fetchTeams();
    }
  }
);
</script>
