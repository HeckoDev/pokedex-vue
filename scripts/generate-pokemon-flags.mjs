// Génère src/data/pokemonFlags.json (méga, légendaires, fabuleux, id des formes régionales) depuis PokeAPI.
// Usage : node scripts/generate-pokemon-flags.mjs
import { writeFileSync } from "node:fs";

const BASE = "https://pokeapi.co/api/v2";
const TOTAL = 1025;
const CONCURRENCY = 16;

const getJson = async (url) => {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw new Error(`Échec : ${url}`);
};

// mega / regional : id d'espèce -> id(s) des formes PokeAPI (pour les sprites)
const flags = { mega: {}, legendary: [], mythical: [], regional: {} };
let next = 1;

const worker = async () => {
  while (next <= TOTAL) {
    const id = next++;
    const s = await getJson(`${BASE}/pokemon-species/${id}`);
    if (s.is_legendary) flags.legendary.push(id);
    if (s.is_mythical) flags.mythical.push(id);
    for (const v of s.varieties) {
      if (/-mega(-[xyz])?$/.test(v.pokemon.name)) {
        (flags.mega[id] ??= []).push(Number(v.pokemon.url.split("/").at(-2)));
      }
      const m = v.pokemon.name.match(/-(alola|galar|hisui|paldea)$/);
      if (m) (flags.regional[id] ??= {})[m[1]] = Number(v.pokemon.url.split("/").at(-2));
    }
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
for (const k of ['legendary', 'mythical']) flags[k].sort((a, b) => a - b);
writeFileSync("src/data/pokemonFlags.json", JSON.stringify(flags) + "\n");
console.log(Object.fromEntries(Object.entries(flags).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length])));
