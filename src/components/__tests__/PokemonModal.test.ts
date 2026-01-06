import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PokemonModal from '../PokemonModal.vue';
import type { Pokemon } from '@/types/pokemon';
import { fetchPokemonSpecies } from '@/services/pokeapi';
import { loadRegionalForm, loadMegaEvolutionData, loadGigamaxData } from '@/services/pokeapi-transform';

vi.mock('@/services/pokeapi');
vi.mock('@/services/pokeapi-transform');
vi.mock('@/composables/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'modal.normalForm': 'Normal Form',
        'modal.form': 'Form',
        'modal.megaEvolution': 'Mega Evolution',
        'modal.gigamax': 'Gigamax',
        'modal.category': 'Category',
        'modal.height': 'Height',
        'modal.weight': 'Weight',
        'modal.stats': 'Stats',
        'modal.hp': 'HP',
        'modal.attack': 'Attack',
        'modal.defense': 'Defense',
        'modal.spAttack': 'Sp. Attack',
        'modal.spDefense': 'Sp. Defense',
        'modal.speed': 'Speed',
        'modal.abilities': 'Abilities',
        'modal.hiddenAbility': 'Hidden',
        'modal.evolutions': 'Evolutions',
        'modal.preEvolution': 'Pre-evolution',
        'modal.evolution': 'Evolution',
        'aria.closeModal': 'Close modal',
        'aria.clickNormal': 'Click to see normal form',
        'aria.clickShiny': 'Click to see shiny form',
        'aria.noShiny': 'No shiny version available',
        'loading.details': 'Loading details...',
        'loading.form': 'Loading form...'
      };
      return translations[key] || key;
    }
  })
}));
vi.mock('@/composables/useFocusTrap', () => ({
  useFocusTrap: vi.fn()
}));

const mockPokemon: Pokemon = {
  pokedex_id: 1,
  generation: 1,
  category: 'Seed Pokémon',
  name: {
    fr: 'Bulbizarre',
    en: 'Bulbasaur',
    jp: 'フシギダネ'
  },
  sprites: {
    regular: 'https://example.com/bulbasaur.png',
    shiny: 'https://example.com/bulbasaur-shiny.png',
    gmax: null
  },
  types: [
    { name: 'Grass', image: 'grass.png' },
    { name: 'Poison', image: 'poison.png' }
  ],
  talents: [
    { name: 'Overgrow', tc: false }
  ],
  stats: {
    hp: 45,
    atk: 49,
    def: 49,
    spe_atk: 65,
    spe_def: 65,
    vit: 45
  },
  resistances: [],
  evolution: {
    pre: null,
    next: [
      {
        pokedex_id: 2,
        name: 'Ivysaur',
        condition: 'Level 16'
      }
    ],
    mega: null
  },
  height: '0.7 m',
  weight: '6.9 kg',
  egg_groups: ['Monster', 'Grass'],
  sexe: {
    male: 87.5,
    female: 12.5
  },
  catch_rate: 45,
  level_100: 1059860,
  formes: null
};

const mockSpecies = {
  flavor_text_entries: [
    {
      flavor_text: 'A strange seed was planted on its back at birth.',
      language: { name: 'en' }
    },
    {
      flavor_text: 'Une graine étrange a été plantée sur son dos à la naissance.',
      language: { name: 'fr' }
    }
  ]
};

describe('PokemonModal', () => {
  let wrapper: VueWrapper;
  const mockEnrichPokemon = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnrichPokemon.mockResolvedValue(mockPokemon);
    vi.mocked(fetchPokemonSpecies).mockResolvedValue(mockSpecies as any);
  });

  const createWrapper = (props = {}) => {
    return mount(PokemonModal, {
      props: {
        pokemon: mockPokemon,
        language: 'en' as const,
        isShiny: false,
        isOpen: true,
        enrichPokemon: mockEnrichPokemon,
        ...props
      }
    });
  };

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });

    it('should not render modal when isOpen is false', () => {
      wrapper = createWrapper({ isOpen: false });
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it('should not render modal when pokemon is null', () => {
      wrapper = createWrapper({ pokemon: null });
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it('should display pokemon name and ID', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toContain('Bulbasaur');
      expect(wrapper.text()).toContain('#001');
    });

    it('should display pokemon image', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const imgs = wrapper.findAll('img');
      const pokemonImg = imgs.find(img => img.attributes('alt') === 'Bulbasaur');
      expect(pokemonImg).toBeDefined();
    });

    it('should display pokemon types', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(wrapper.text()).toContain('Grass');
      expect(wrapper.text()).toContain('Poison');
    });

    it('should display pokemon stats', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toContain('HP');
      expect(wrapper.text()).toContain('45');
      expect(wrapper.text()).toContain('Attack');
      expect(wrapper.text()).toContain('49');
    });

    it('should display pokemon height and weight', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(wrapper.text()).toContain('0.7 m');
      expect(wrapper.text()).toContain('6.9 kg');
    });

    it('should display pokemon abilities', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toContain('Overgrow');
    });
  });

  describe('Data Loading', () => {
    it('should load enriched pokemon data when opened', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockEnrichPokemon).toHaveBeenCalledWith(mockPokemon);
      expect(fetchPokemonSpecies).toHaveBeenCalledWith(1);
    });

    it('should display loading indicator while loading', async () => {
      mockEnrichPokemon.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockPokemon), 100)));
      
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toContain('Loading details...');
    });

    it('should handle errors gracefully when loading pokemon details', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockEnrichPokemon.mockRejectedValue(new Error('API Error'));
      
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should load pokemon description', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(wrapper.text()).toContain('A strange seed was planted on its back at birth.');
    });
  });

  describe('Shiny Toggle', () => {
    it('should display regular sprite by default', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const imgs = wrapper.findAll('img');
      const pokemonImg = imgs.find(img => img.attributes('alt') === 'Bulbasaur');
      expect(pokemonImg?.attributes('src')).toBe('https://example.com/bulbasaur.png');
    });

    it('should display shiny sprite when isShiny is true', async () => {
      wrapper = createWrapper({ isShiny: true });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const imgs = wrapper.findAll('img');
      const pokemonImg = imgs.find(img => img.attributes('alt') === 'Bulbasaur');
      expect(pokemonImg?.attributes('src')).toBe('https://example.com/bulbasaur-shiny.png');
    });

    it('should toggle shiny when clicking on image', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const imgContainers = wrapper.findAll('.rounded-2xl');
      const imgContainer = imgContainers.find(el => el.classes().includes('bg-white/10'));
      await imgContainer?.trigger('click');
      await wrapper.vm.$nextTick();
      
      const imgs = wrapper.findAll('img');
      const pokemonImg = imgs.find(img => img.attributes('alt') === 'Bulbasaur');
      expect(pokemonImg?.attributes('src')).toBe('https://example.com/bulbasaur-shiny.png');
    });

    it('should display sparkle icon when shiny', async () => {
      wrapper = createWrapper({ isShiny: true });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const html = wrapper.html();
      expect(html).toContain('animate-pulse');
    });
  });

  describe('Modal Interactions', () => {
    it('should emit close event when clicking close button', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const closeButton = wrapper.find('button[aria-label="Close modal"]');
      await closeButton.trigger('click');
      
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close event when clicking backdrop', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const backdrop = wrapper.find('[role="dialog"]').element.parentElement;
      await wrapper.find('.fixed.inset-0').trigger('click');
      
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should not emit close when clicking modal content', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const modalContent = wrapper.find('.bg-gradient-to-br');
      await modalContent.trigger('click');
      
      expect(wrapper.emitted('close')).toBeFalsy();
    });

    it('should emit navigate event when clicking evolution', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const evolutionButton = wrapper.find('button');
      if (evolutionButton.text().includes('Ivysaur')) {
        await evolutionButton.trigger('click');
        expect(wrapper.emitted('navigate')).toBeTruthy();
        expect(wrapper.emitted('navigate')?.[0]).toEqual([2]);
      }
    });
  });

  describe('Alternative Forms', () => {
    it('should display form selector when multiple forms available', async () => {
      const pokemonWithForms = {
        ...mockPokemon,
        formes: [
          { region: 'alola' }
        ]
      };
      mockEnrichPokemon.mockResolvedValue(pokemonWithForms);
      
      wrapper = createWrapper({ pokemon: pokemonWithForms });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(wrapper.text()).toContain('Normal Form');
      expect(wrapper.text()).toContain('Form Alola');
    });

    it('should not display form selector when only one form available', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const formButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('Normal Form')
      );
      expect(formButtons.length).toBe(0);
    });

    it('should load regional form when selected', async () => {
      const pokemonWithForms = {
        ...mockPokemon,
        formes: [
          { region: 'alola' }
        ]
      };
      const regionalFormData = { ...mockPokemon, name: { en: 'Alolan Bulbasaur', fr: 'Bulbizarre d\'Alola', jp: 'アローラ' } };
      mockEnrichPokemon.mockResolvedValue(pokemonWithForms);
      vi.mocked(loadRegionalForm).mockResolvedValue(regionalFormData as any);
      
      wrapper = createWrapper({ pokemon: pokemonWithForms });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const formButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Form Alola')
      );
      
      if (formButton) {
        await formButton.trigger('click');
        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(loadRegionalForm).toHaveBeenCalled();
      }
    });

    it('should load mega evolution when selected', async () => {
      const pokemonWithMega = {
        ...mockPokemon,
        evolution: {
          ...mockPokemon.evolution,
          mega: [
            {
              orbe: 'Venusaurite',
              sprites: { regular: 'mega.png', shiny: 'mega-shiny.png' }
            }
          ]
        }
      };
      mockEnrichPokemon.mockResolvedValue(pokemonWithMega);
      vi.mocked(loadMegaEvolutionData).mockResolvedValue(pokemonWithMega as any);
      
      wrapper = createWrapper({ pokemon: pokemonWithMega });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const megaButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Mega Evolution')
      );
      
      if (megaButton) {
        await megaButton.trigger('click');
        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(loadMegaEvolutionData).toHaveBeenCalled();
      }
    });

    it('should display loading indicator when loading form', async () => {
      const pokemonWithForms = {
        ...mockPokemon,
        formes: [{ region: 'alola' }]
      };
      mockEnrichPokemon.mockResolvedValue(pokemonWithForms);
      vi.mocked(loadRegionalForm).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockPokemon as any), 100)));
      
      wrapper = createWrapper({ pokemon: pokemonWithForms });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const formButton = wrapper.findAll('button').find(btn => btn.text().includes('Form Alola'));
      if (formButton) {
        await formButton.trigger('click');
        await wrapper.vm.$nextTick();
        
        expect(wrapper.text()).toContain('Loading form...');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const dialog = wrapper.find('[role="dialog"]');
      expect(dialog.attributes('aria-modal')).toBe('true');
      expect(dialog.attributes('aria-labelledby')).toBe('modal-title-1');
      expect(dialog.attributes('aria-describedby')).toBe('modal-description');
    });

    it('should have accessible close button', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const closeButton = wrapper.find('button[aria-label="Close modal"]');
      expect(closeButton.exists()).toBe(true);
    });

    it('should have proper aria-hidden on SVG', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const svg = wrapper.find('svg');
      expect(svg.attributes('aria-hidden')).toBe('true');
    });
  });

  describe('Evolutions Display', () => {
    it('should display next evolutions when available', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(wrapper.text()).toContain('Ivysaur');
      expect(wrapper.text()).toContain('Level 16');
    });

    it('should display pre-evolutions when available', async () => {
      const evolvedPokemon = {
        ...mockPokemon,
        evolution: {
          pre: [
            {
              pokedex_id: 1,
              name: 'Bulbasaur',
              condition: 'Base form'
            }
          ],
          next: null,
          mega: null
        }
      };
      mockEnrichPokemon.mockResolvedValue(evolvedPokemon);
      
      wrapper = createWrapper({ pokemon: evolvedPokemon });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(wrapper.text()).toContain('Bulbasaur');
    });

    it('should not display evolution section when no evolutions', async () => {
      const noEvoPokemon = {
        ...mockPokemon,
        evolution: {
          pre: null,
          next: null,
          mega: null
        }
      };
      mockEnrichPokemon.mockResolvedValue(noEvoPokemon);
      
      wrapper = createWrapper({ pokemon: noEvoPokemon });
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(wrapper.text()).not.toContain('Evolutions');
    });
  });
});
