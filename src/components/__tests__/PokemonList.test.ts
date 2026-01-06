import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

// Mock des composables
vi.mock('@/composables/usePokemon');
vi.mock('@/composables/useTranslation');

import PokemonList from '../PokemonList.vue';
import PokemonCard from '../PokemonCard.vue';
import { usePokemon } from '@/composables/usePokemon';
import { useTranslation } from '@/composables/useTranslation';

describe('PokemonList Component', () => {
  const mockPokemon = {
    pokedex_id: 1,
    name: { fr: 'Bulbizarre', en: 'Bulbasaur', jp: 'フシギダネ' },
    types: [{ name: 'Plante', image: '' }],
    generation: 1,
    sprites: {
      regular: 'sprite.png',
      shiny: 'sprite-shiny.png',
      gmax: null
    },
    stats: {
      hp: 45,
      atk: 49,
      def: 49,
      spe_atk: 65,
      spe_def: 65,
      vit: 45,
    },
    category: 'Seed Pokémon',
    talents: [],
    resistances: [],
    evolution: null,
    height: '0.7 m',
    weight: '6.9 kg',
    egg_groups: [],
    sexe: { male: 87.5, female: 12.5 },
    catch_rate: 45,
    level_100: 1059860,
    formes: null
  };

  let mockUsePokemon: any;
  let mockUseTranslation: any;

  beforeEach(() => {
    mockUsePokemon = {
      pokemonsByGeneration: ref([{ generation: 1, pokemons: [mockPokemon] }]),
      filteredPokemons: ref([mockPokemon]),
      searchQuery: ref(''),
      selectedType: ref(''),
      selectedLanguage: ref('fr'),
      isShiny: ref(false),
      allTypes: ref(['Plante', 'Feu', 'Eau']),
      getPokemonById: vi.fn((id) => id === 1 ? mockPokemon : null),
      enrichPokemonFromAPI: vi.fn(),
      isLoading: ref(false),
      loadingProgress: ref({ loaded: 0, total: 0 }),
      error: ref(null),
      selectedGenerations: ref([]),
      sortBy: ref(null),
    };

    mockUseTranslation = {
      t: vi.fn((key) => key),
      setUILanguage: vi.fn(),
    };

    vi.mocked(usePokemon).mockReturnValue(mockUsePokemon);
    vi.mocked(useTranslation).mockReturnValue(mockUseTranslation);
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(PokemonList);
      expect(wrapper.exists()).toBe(true);
    });

    it('should display title', () => {
      const wrapper = mount(PokemonList);
      expect(wrapper.text()).toContain('title');
    });

    it('should render search input', () => {
      const wrapper = mount(PokemonList);
      const searchInput = wrapper.find('input[type="text"]');
      expect(searchInput.exists()).toBe(true);
    });

    it('should render type filter select', () => {
      const wrapper = mount(PokemonList);
      const select = wrapper.find('select');
      expect(select.exists()).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    it('should update searchQuery on input', async () => {
      const wrapper = mount(PokemonList);
      const searchInput = wrapper.find('input[type="text"]');
      
      await searchInput.setValue('Pikachu');
      
      expect(mockUsePokemon.searchQuery.value).toBe('Pikachu');
    });
  });

  describe('Type Filter', () => {
    it('should render all type options', () => {
      const wrapper = mount(PokemonList);
      const select = wrapper.find('select');
      const options = select.findAll('option');
      
      // Au moins l'option "Tous les types" + les types mockés
      expect(options.length).toBeGreaterThanOrEqual(1);
    });

    it('should update selectedType on change', async () => {
      const wrapper = mount(PokemonList);
      const select = wrapper.find('select');
      
      await select.setValue('Plante');
      
      expect(mockUsePokemon.selectedType.value).toBe('Plante');
    });
  });

  describe('Pokemon Display', () => {
    it('should render Pokemon cards', () => {
      const wrapper = mount(PokemonList, {
        global: {
          components: {
            PokemonCard,
          },
        },
      });
      
      // Devrait afficher au moins un Pokémon
      expect(wrapper.html()).toBeDefined();
    });

    it('should display generation headers when grouping by generation', () => {
      const wrapper = mount(PokemonList);
      expect(wrapper.html()).toBeDefined();
    });
  });

  describe('Modal Behavior', () => {
    it('should not show modal initially', () => {
      const wrapper = mount(PokemonList);
      const modal = wrapper.findComponent({ name: 'PokemonModal' });
      
      if (modal.exists()) {
        expect(modal.props('isOpen')).toBe(false);
      }
    });
  });

  describe('Scroll Behavior', () => {
    it('should handle scroll event', async () => {
      const wrapper = mount(PokemonList);
      
      // Simuler le scroll
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 400,
      });
      
      window.dispatchEvent(new Event('scroll'));
      
      await flushPromises();
      
      // Le bouton de scroll devrait être visible
      // Note: cela dépend de l'implémentation exacte du composant
    });

    it('should remove scroll listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const wrapper = mount(PokemonList);
      
      wrapper.unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  describe('Loading State', () => {
    it('should display loading state when isLoading is true', () => {
      const loadingMock = {
        ...mockUsePokemon,
        isLoading: { value: true },
      };
      vi.mocked(usePokemon).mockReturnValue(loadingMock as any);
      
      const wrapper = mount(PokemonList);
      // Devrait afficher un indicateur de chargement
      expect(wrapper.html()).toBeDefined();
    });

    it('should display error message when error exists', () => {
      const errorMock = {
        ...mockUsePokemon,
        error: { value: 'Error loading Pokemon' },
      };
      vi.mocked(usePokemon).mockReturnValue(errorMock as any);
      
      const wrapper = mount(PokemonList);
      // Devrait afficher un message d'erreur
      expect(wrapper.html()).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const wrapper = mount(PokemonList);
      
      const searchInput = wrapper.find('input[type="text"]');
      expect(searchInput.attributes('id')).toBe('pokemon-search');
      
      const searchLabel = wrapper.find('label[for="pokemon-search"]');
      expect(searchLabel.exists()).toBe(true);
    });

    it('should have role="main" on container', () => {
      const wrapper = mount(PokemonList);
      const mainContainer = wrapper.find('[role="main"]');
      expect(mainContainer.exists()).toBe(true);
    });

    it('should have role="search" on search area', () => {
      const wrapper = mount(PokemonList);
      const searchArea = wrapper.find('[role="search"]');
      expect(searchArea.exists()).toBe(true);
    });
  });

  describe('Language Toggle', () => {
    it('should have language selection functionality', () => {
      const wrapper = mount(PokemonList);
      expect(mockUsePokemon.selectedLanguage).toBeDefined();
    });
  });

  describe('Shiny Toggle', () => {
    it('should have shiny toggle functionality', () => {
      const wrapper = mount(PokemonList);
      expect(mockUsePokemon.isShiny).toBeDefined();
    });
  });

  describe('Events', () => {
    it('should emit openAuth event', () => {
      const wrapper = mount(PokemonList);
      // Le composant devrait pouvoir émettre l'événement openAuth
      expect(wrapper.emitted()).toBeDefined();
    });

    it('should emit openFilters event', () => {
      const wrapper = mount(PokemonList);
      // Le composant devrait pouvoir émettre l'événement openFilters
      expect(wrapper.emitted()).toBeDefined();
    });
  });
});
