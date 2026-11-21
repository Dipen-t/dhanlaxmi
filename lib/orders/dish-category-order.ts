import type { CategoryWithDishes } from "@/app/menus/actions";

// Follow the printed menu sequence without changing category identity or membership.
const referenceSections = [
  { name: "Welcome Drinks", matches: /welcome drinks?|soft drinks?|mocktails?/ },
  { name: "Welcome Starters", matches: /starters?/ },
  { name: "Our Spl. Chaats", matches: /chaa?ts?/ },
  { name: "South Indian and Gourmet", matches: /south indian|gourmet/ },
  { name: "Chinese Counter", matches: /chinese|soups?/ },
  { name: "Indian Counter", matches: /rice|indian counter/ },
  { name: "Paneer Ki Sabji", matches: /paneer ki sab(?:ji|zi)|paneer.*(main|sabji|sabzi)/ },
  { name: "Indian Main Course", matches: /main course|veg main/ },
  { name: "Tawa Bahar", matches: /tawa/ },
  { name: "Daal or Kadi", matches: /daal|dal|kadi|kadhi|curry/ },
  { name: "Raita Ka Chaska", matches: /raita/ },
  { name: "Mithas Ki Bahar", matches: /sweet|mithas|mitas|mithai/ },
  { name: "Roti Ki Tokri", matches: /rotis?|breads?/ },
  { name: "Green Salad, Papad, Pickle, Fryums", matches: /salad|papad|pickle|fryums/ },
  { name: "Ice Cream Parlour", matches: /ice cream|dessert/ },
  { name: "Paan or Mukhwas", matches: /paan|mukhwas/ },
  { name: "Fresh Fruits, Hot Kadai Milk, Cold Masala Milk, Malai Ice Gola", matches: /fruit|juice|milk|ice gola/ },
  { name: "Mineral Water Glasses", matches: /mineral water|water glasses/ },
  { name: "New Attraction (Seasonal)", matches: /new attraction|seasonal|strawberry station|mango station/ },
  { name: "Extras", matches: /extras?|italian/ },
];

export const orderDishSectionNames = referenceSections.map(section => section.name);

function normalizedName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function categoryRank(category: CategoryWithDishes) {
  const name = normalizedName(category.name);
  if (/\b(non\s*veg(?:etarian)?|chicken|chi|mutton|fish|prawns?|sea\s*food|meat|lamb|eggs?)\b/.test(name)) {
    return referenceSections.length + 1;
  }
  const index = referenceSections.findIndex(section => section.matches.test(name));
  return index < 0 ? referenceSections.length : index;
}

export function buildOrderDishCatalog(categories: CategoryWithDishes[]): CategoryWithDishes[] {
  // Stable sorting preserves catalog order between categories at the same rank.
  // Never invent headings or move dishes into another category.
  return [...categories].sort((a, b) => categoryRank(a) - categoryRank(b));
}
