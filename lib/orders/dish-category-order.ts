// Order-form sequence from the printed grand menu, using existing catalog names.
const categorySequence = [
  /\b(welcome drinks?|mocktails?|soft drinks?)\b/,
  /\bsoups?\b/,
  /\bstarters?\b/,
  /\b(chaa?ts?)\b/,
  /\b(south indian|gourmet)\b/,
  /\bitalian\b/,
  /\bchinese\b/,
  /\b(rice|indian counter)\b/,
  /\bpaneer ki sab(?:ji|zi)\b/,
  /\b(main course|veg main)\b/,
  /\btawa\b/,
  /\b(daal|dal|kadi|kadhi|curry)\b/,
  /\braita\b/,
  /\b(sweet|mithas|mithai)\b/,
  /\b(rotis?|roti ki tokri|breads?)\b/,
  /\b(salad|papad|pickle|fryums)\b/,
  /\b(ice cream|desserts?)\b/,
  /\b(paan|mukhwas)\b/,
  /\b(fruits?|juices?|milk|ice gola)\b/,
  /\b(mineral water|water glasses)\b/,
  /\b(new attraction|seasonal|strawberry station|mango station)\b/,
  /\bextras?\b/,
];

function categoryRank(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (/\b(non\s*veg(?:etarian)?|chicken|chi|mutton|fish|prawns?|sea\s*food|meat|lamb|eggs?)\b/.test(normalized)) {
    return categorySequence.length + 1;
  }
  const rank = categorySequence.findIndex((pattern) => pattern.test(normalized));
  return rank < 0 ? categorySequence.length : rank;
}

export function sortOrderDishCategories<T extends { name: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => categoryRank(a.name) - categoryRank(b.name));
}
