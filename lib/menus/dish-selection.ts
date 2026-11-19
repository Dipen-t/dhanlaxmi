type CatalogCategory = { id: number; dishes: { id: number }[] };
type SelectionRow = { categoryId: number; selectedDishIds: number[] | null };

export function selectedMenuDishes<T extends { id: number }>(dishes: T[], selectedIds: number[] | null) {
  if (selectedIds === null) return dishes;
  const selected = new Set(selectedIds);
  return dishes.filter((dish) => selected.has(dish.id));
}

export function parseMenuDishSelection(data: FormData, catalog: CatalogCategory[]): { entries: SelectionRow[]; error?: never } | { error: string; entries?: never } {
  const categoryIds = [...new Set(data.getAll("categoryIds").map(Number))];
  if (!categoryIds.length) return { error: "Select at least one category." };
  if (categoryIds.some((id) => !Number.isSafeInteger(id) || id <= 0 || !catalog.some((category) => category.id === id))) {
    return { error: "One or more selected categories no longer exist. Refresh the form." };
  }
  // Old clients keep selecting full categories until they send explicit dish choices.
  if (data.get("dishSelection") !== "custom") return { entries: categoryIds.map((categoryId) => ({ categoryId, selectedDishIds: null })) };
  const dishIds = [...new Set(data.getAll("dishIds").map(Number))];
  const allowedIds = new Set(catalog.filter((category) => categoryIds.includes(category.id)).flatMap((category) => category.dishes.map((dish) => dish.id)));
  if (dishIds.some((id) => !Number.isSafeInteger(id) || id <= 0 || !allowedIds.has(id))) {
    return { error: "A selected dish is no longer available in these categories. Refresh the form." };
  }
  const entries = categoryIds.map((categoryId) => ({ categoryId, selectedDishIds: catalog.find((category) => category.id === categoryId)!.dishes.filter((dish) => dishIds.includes(dish.id)).map((dish) => dish.id) }));
  if (entries.some((entry) => !entry.selectedDishIds.length && catalog.find((category) => category.id === entry.categoryId)!.dishes.length)) {
    return { error: "Choose at least one dish in each selected category, or uncheck that category." };
  }
  return { entries };
}
