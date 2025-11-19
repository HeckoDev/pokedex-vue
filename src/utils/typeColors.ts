// Couleurs pour chaque type de Pokémon
export const typeColors: Record<string, string> = {
  Normal: "bg-gray-400",
  Plante: "bg-green-500",
  Feu: "bg-red-500",
  Eau: "bg-blue-500",
  Électrik: "bg-yellow-400",
  Glace: "bg-cyan-300",
  Combat: "bg-orange-600",
  Poison: "bg-purple-500",
  Sol: "bg-yellow-600",
  Vol: "bg-indigo-400",
  Psy: "bg-pink-500",
  Insecte: "bg-lime-500",
  Roche: "bg-yellow-700",
  Spectre: "bg-purple-700",
  Dragon: "bg-indigo-700",
  Ténèbres: "bg-gray-800",
  Acier: "bg-gray-500",
  Fée: "bg-pink-300",
};

export function getTypeColor(typeName: string): string {
  return typeColors[typeName] || "bg-gray-600";
}
