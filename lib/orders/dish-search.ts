import type { CategoryWithDishes } from "@/app/menus/actions";

function words(value: string): string[] {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/sch(?:e|z)*wan|shezwan|szechuan/g, "schezwan")
    .replace(/\bchi\b/g, "chicken")
    .replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

// Allow one mistyped, omitted or extra letter in longer search words.
function closeWord(query: string, candidate: string): boolean {
  if (candidate.includes(query)) return true;
  if (query.length < 4 || Math.abs(query.length - candidate.length) > 1) return false;
  let left = 0;
  let right = 0;
  let differences = 0;
  while (left < query.length && right < candidate.length) {
    if (query[left] === candidate[right]) { left++; right++; continue; }
    if (++differences > 1) return false;
    if (query.length >= candidate.length) left++;
    if (candidate.length >= query.length) right++;
  }
  return differences + (query.length - left) + (candidate.length - right) <= 1;
}

export function searchDishCatalog(catalog: CategoryWithDishes[], query: string): CategoryWithDishes[] {
  const tokens = words(query);
  if (!tokens.length) return catalog;
  return catalog.map(category => ({
    ...category,
    dishes: category.dishes.filter(dish => {
      const candidates = words(`${category.name} ${dish.name}`);
      return tokens.every(token => candidates.some(candidate => closeWord(token, candidate)));
    }),
  })).filter(category => category.dishes.length > 0);
}
