// Colors for each Pokémon type
// Updated for WCAG AA contrast compliance (4.5:1 ratio for normal text)
export const typeColors: Record<string, string> = {
  Normal: "bg-gray-500",
  Plante: "bg-green-600",
  Feu: "bg-red-600",
  Eau: "bg-blue-600",
  Électrik: "bg-yellow-600",
  Glace: "bg-cyan-600",
  Combat: "bg-orange-700",
  Poison: "bg-purple-600",
  Sol: "bg-yellow-700",
  Vol: "bg-indigo-600",
  Psy: "bg-pink-600",
  Insecte: "bg-lime-600",
  Roche: "bg-yellow-800",
  Spectre: "bg-purple-800",
  Dragon: "bg-indigo-700",
  Ténèbres: "bg-gray-900",
  Acier: "bg-gray-600",
  Fée: "bg-pink-600",
};

// Gradient colors for modal header
export const typeGradientColors: Record<string, { from: string; to: string }> = {
  Normal: { from: "from-gray-400", to: "to-gray-500" },
  Plante: { from: "from-green-500", to: "to-green-600" },
  Feu: { from: "from-red-500", to: "to-orange-600" },
  Eau: { from: "from-blue-500", to: "to-cyan-600" },
  Électrik: { from: "from-yellow-400", to: "to-yellow-500" },
  Glace: { from: "from-cyan-300", to: "to-blue-400" },
  Combat: { from: "from-orange-600", to: "to-red-600" },
  Poison: { from: "from-purple-500", to: "to-purple-700" },
  Sol: { from: "from-yellow-600", to: "to-yellow-700" },
  Vol: { from: "from-indigo-400", to: "to-sky-500" },
  Psy: { from: "from-pink-500", to: "to-purple-500" },
  Insecte: { from: "from-lime-500", to: "to-green-600" },
  Roche: { from: "from-yellow-700", to: "to-stone-700" },
  Spectre: { from: "from-purple-700", to: "to-indigo-900" },
  Dragon: { from: "from-indigo-700", to: "to-purple-700" },
  Ténèbres: { from: "from-gray-800", to: "to-gray-900" },
  Acier: { from: "from-gray-500", to: "to-slate-600" },
  Fée: { from: "from-pink-300", to: "to-pink-400" },
};

export function getTypeColor(typeName: string): string {
  return typeColors[typeName] || "bg-gray-600";
}

export function getTypeGradient(type1: string, type2?: string): string {
  const gradient1 = typeGradientColors[type1] || { from: "from-purple-600", to: "to-pink-600" };
  
  if (!type2) {
    return `${gradient1.from} ${gradient1.to}`;
  }
  
  const gradient2 = typeGradientColors[type2] || { from: "from-purple-600", to: "to-pink-600" };
  return `${gradient1.from} ${gradient2.to}`;
}
