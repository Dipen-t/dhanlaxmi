import assert from "node:assert/strict";
import { test } from "node:test";
import { searchDishCatalog } from "./dish-search";

const catalog = [
  { id: 1, name: "Welcome Starters", selectionRule: "Any two", dishes: [{ id: 1, name: "Paneer Tikka" }, { id: 2, name: "Cocktail Samosa" }] },
  { id: 2, name: "Non-Veg", selectionRule: "Any one", dishes: [{ id: 3, name: "Chi Schzwan" }] },
  { id: 3, name: "Paneer Specials", selectionRule: "", dishes: [{ id: 4, name: "Paneer Tikka" }] },
];
const ids = (query: string) => searchDishCatalog(catalog, query).flatMap(category => category.dishes.map(dish => dish.id));

test("searches category names, partial names, and multiple words in any order", () => {
  assert.deepEqual(ids("starters"), [1, 2]);
  assert.deepEqual(ids("TIK pan"), [1, 4]);
  assert.deepEqual(ids("starters paneer"), [1]);
  assert.deepEqual(ids("  tikka   paneer  "), [1, 4]);
});
test("supports punctuation, common chicken/Schezwan spelling and a one-letter typo", () => {
  assert.deepEqual(ids("non veg chicken schezwan"), [3]);
  assert.deepEqual(ids("chi szechuan"), [3]);
  assert.deepEqual(ids("paneer tika"), [1, 4]);
  assert.deepEqual(ids("samos"), [2]);
  assert.deepEqual(ids("unrelated"), []);
});
test("keeps original category identity and never merges matching categories or mutates catalog", () => {
  const before = structuredClone(catalog);
  assert.deepEqual(searchDishCatalog(catalog, "paneer").map(category => category.id), [1, 3]);
  assert.deepEqual(searchDishCatalog(catalog, "   "), catalog);
  assert.deepEqual(catalog, before);
});
