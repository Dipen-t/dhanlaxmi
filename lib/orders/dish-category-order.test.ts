import assert from "node:assert/strict";
import { test } from "node:test";
import type { CategoryWithDishes } from "../../app/menus/actions";
import { menuCatalog } from "../../db/menu-catalog";
import { buildOrderDishCatalog } from "./dish-category-order";

function existingCatalog(): CategoryWithDishes[] {
  let dishId = 1;
  return menuCatalog.map((category, index) => ({
    ...category,
    id: index + 1,
    dishes: category.dishes.map(name => ({ id: dishId++, name })),
  }));
}

test("every category retains its own identity, rule and dishes without merging or synthetic sections", () => {
  const catalog = existingCatalog();
  const before = structuredClone(catalog);
  const result = buildOrderDishCatalog(catalog);
  assert.equal(result.length, catalog.length);
  for (const category of catalog) {
    assert.deepEqual(result.find(item => item.id === category.id), category);
  }
  assert.deepEqual(catalog, before, "sorting must not mutate server catalog data");
  assert.deepEqual(buildOrderDishCatalog(catalog), result);
});

test("related categories and duplicate names stay separate, including Hi-tea and Extras", () => {
  const catalog: CategoryWithDishes[] = [
    { id: 1, name: "Welcome Starters", selectionRule: "Any two", dishes: [{ id: 1, name: "Cocktail Samosa" }] },
    { id: 2, name: "Choice of Veg Starter", selectionRule: "Any one", dishes: [{ id: 2, name: "Cocktail Samosa" }] },
    { id: 3, name: "Hi Tea", selectionRule: "", dishes: [{ id: 3, name: "Cheese Pizza" }, { id: 4, name: "Espresso Coffee" }] },
    { id: 4, name: "Extras", selectionRule: "", dishes: [{ id: 5, name: "Live Pasta Counter" }] },
    { id: 5, name: "Choice of Veg Soup", selectionRule: "Any one", dishes: [{ id: 6, name: "Veg Manchow Soup" }] },
    { id: 6, name: "Chinese Counter", selectionRule: "Any two", dishes: [] },
    { id: 7, name: "Welcome Starters", selectionRule: "Any three", dishes: [] },
  ];
  const result = buildOrderDishCatalog(catalog);
  assert.equal(result.length, catalog.length);
  for (const category of catalog) assert.deepEqual(result.find(item => item.id === category.id), category);
});

test("printed category sequence is retained with non-veg last, without moving dishes", () => {
  const category = (id: number, name: string): CategoryWithDishes => ({ id, name, selectionRule: "", dishes: [] });
  const result = buildOrderDishCatalog([
    category(1, "Fish Starter"), category(2, "Rotis"), category(3, "Welcome Drinks"),
    category(4, "Choice of Non Veg Starter"), category(5, "Welcome Starters"),
    category(6, "Custom Counter"), category(7, "Dal / Curry"),
  ]);
  assert.deepEqual(result.map(item => item.id), [3, 5, 7, 2, 6, 1, 4]);
  assert.deepEqual(buildOrderDishCatalog([]), []);
});
