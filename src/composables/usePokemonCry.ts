import { ref, onUnmounted } from "vue";
import { fetchPokemonCryUrl } from "@/services/pokeapi";

// Plays Pokémon cries. A new request always supersedes the previous one
// so a slow response can never play over the Pokémon currently displayed.
export function usePokemonCry() {
  const isPlaying = ref(false);
  const hasCry = ref(true);
  let audio: HTMLAudioElement | null = null;
  let requestId = 0;
  let currentKey: string | number | null = null;
  let currentUrl: string | null = null;

  const stop = () => {
    requestId++;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio = null;
    }
    isPlaying.value = false;
  };

  const play = async (key: string | number, fallbackKey?: string | number) => {
    const id = ++requestId;
    if (audio) {
      audio.pause();
      audio = null;
    }
    isPlaying.value = false;

    try {
      if (currentKey !== key || !currentUrl) {
        let url: string | null = null;
        try {
          url = await fetchPokemonCryUrl(key);
        } catch {
          // an unknown form falls back to the base Pokémon below
        }
        if (!url && fallbackKey !== undefined) url = await fetchPokemonCryUrl(fallbackKey);
        if (id !== requestId) return;
        currentKey = key;
        currentUrl = url;
      }
      hasCry.value = !!currentUrl;
      if (!currentUrl) return;

      const el = new Audio(currentUrl);
      audio = el;
      el.onended = () => {
        if (audio === el) isPlaying.value = false;
      };
      el.onerror = () => {
        if (audio === el) isPlaying.value = false;
      };
      isPlaying.value = true;
      await el.play();
    } catch (error) {
      // Autoplay can be refused by the browser; the replay button stays available
      if (id === requestId) isPlaying.value = false;
      if (!(error instanceof DOMException)) console.error("Error playing cry:", error);
    }
  };

  onUnmounted(stop);

  return { isPlaying, hasCry, play, stop };
}
