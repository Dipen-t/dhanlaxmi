import type { CategoryWithDishes } from "@/app/menus/actions";

// Order-form sequence from the printed grand menu, using existing catalog names.
const categorySequence = [
  /\b(welcome drinks?|mocktails?|soft drinks?)\b/,
  /\bstarters?\b/,
  /\b(chaa?ts?)\b/,
  /\b(south indian|gourmet)\b/,
  /\bitalian\b/,
  /\bchinese\b/,
  /\bsoups?\b/,
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

export function buildOrderDishCatalog(categories: CategoryWithDishes[]): CategoryWithDishes[] {
  const drinks: CategoryWithDishes["dishes"] = [];
  let source: CategoryWithDishes | undefined;
  const grouped = categories.flatMap((category) => {
    if (!/fruit.*juice|juice.*fruit/i.test(category.name)) return [category];
    const welcomeDrinks = category.dishes.filter((dish) => /\b(juices?|mocktails?|cocktails?|shakes?|soft drinks?)\b/i.test(dish.name));
    if (welcomeDrinks.length === 0) return [category];
    source ??= category;
    drinks.push(...welcomeDrinks);
    const remaining = category.dishes.filter((dish) => !welcomeDrinks.includes(dish));
    return remaining.length > 0 ? [{ ...category, name: "Fresh Fruits", dishes: remaining }] : [];
  });
  if (source) {
    const existing = grouped.find((category) => categoryRank(category.name) === 0);
    if (existing) {
      const index = grouped.indexOf(existing);
      grouped[index] = { ...existing, dishes: [...existing.dishes, ...drinks] };
    } else {
      grouped.push({ ...source, id: -source.id, name: "Welcome Drinks", dishes: drinks });
    }
  }
  return sortOrderDishCategories(grouped);
}
