import assert from "node:assert/strict";
import { test } from "node:test";
import type { CategoryWithDishes } from "../../app/menus/actions";
import { menuCatalog } from "../../db/menu-catalog";
import { buildOrderDishCatalog } from "./dish-category-order";

const printedHeadings = [
  "Welcome Drinks",
  "Welcome Starters",
  "Our Spl. Chaats",
  "South Indian and Gourmet",
  "Chinese Counter",
  "Indian Counter",
  "Paneer Ki Sabji",
  "Indian Main Course",
  "Tawa Bahar",
  "Daal or Kadi",
  "Raita Ka Chaska",
  "Mithas Ki Bahar",
  "Roti Ki Tokri",
  "Green Salad, Papad, Pickle, Fryums",
  "Ice Cream Parlour",
  "Paan or Mukhwas",
  "Fresh Fruits, Hot Kadai Milk, Cold Masala Milk, Malai Ice Gola",
  "Mineral Water Glasses",
  "New Attraction (Seasonal)",
  "Extras",
];

function existingCatalog(): CategoryWithDishes[] {
  let dishId = 1;
  return menuCatalog.map((category, index) => ({
    ...category,
    id: index + 1,
    dishes: category.dishes.map((name) => ({ id: dishId++, name })),
  }));
}

test("all three printed pages are followed exactly, then non-veg categories appear last", () => {
  const catalog = existingCatalog();
  const before = structuredClone(catalog);
  const grouped = buildOrderDishCatalog(catalog);
  assert.deepEqual(grouped.map((category) => category.name), [
    ...printedHeadings,
    "Choice of Non Veg Starter",
    "Fish Starter",
    "Non Veg Main Course",
  ]);
  const ids = (categories: CategoryWithDishes[]) => categories.flatMap((category) => category.dishes.map((dish) => dish.id)).sort((a, b) => a - b);
  assert.deepEqual(ids(grouped), ids(catalog), "every existing selectable dish survives exactly once");
  assert.equal(new Set(grouped.map((category) => category.id)).size, grouped.length);
  assert.deepEqual(catalog, before);
  assert.deepEqual(buildOrderDishCatalog(catalog), grouped, "opening the form again gives the same sequence");
});

test("existing mixed categories are grouped under the headings shown in the photos", () => {
  const grouped = buildOrderDishCatalog(existingCatalog());
  const names = (heading: string) => grouped.find((category) => category.name === heading)!.dishes.map((dish) => dish.name);
  assert.deepEqual(names("Welcome Drinks"), ["Fresh Juice"]);
  assert.ok(names("Extras").includes("Mocktail Counter"), "the photo lists Mocktail Counter under Extras");
  assert.ok(names("Extras").includes("Pasta"));
  assert.ok(names("South Indian and Gourmet").includes("Pizza"));
  assert.deepEqual(names("South Indian and Gourmet"), ["Masala Dossa", "Mysuri Dossa", "Butter Masala Dossa", "Uttappa", "Pizza"]);
  assert.ok(!names("Indian Counter").includes("Masala Dossa"));
  const starters = names("Welcome Starters");
  assert.deepEqual(starters.slice(0, 4), ["Cocktel Samosa", "Veg Manchurian", "Harabhara Kabab", "Veg Drigan Roll"]);
  assert.ok(starters.includes("Palak Cheese Roll"));
  assert.ok(starters.includes("Paneer Amritsari Tikki"));
  assert.ok(names("Chinese Counter").includes("Veg Manchow Soup"));
  assert.ok(names("Chinese Counter").includes("Schzwan Rice"));
  assert.ok(!names("Indian Counter").includes("Schzwan Rice"));
  assert.ok(names("Tawa Bahar").includes("Veg Hydrabadi Biryani"));
  assert.ok(names("Paneer Ki Sabji").includes("Paneer Butter Masala"));
  assert.ok(!names("Indian Main Course").includes("Paneer Butter Masala"));
  assert.ok(names("Indian Main Course").includes("Veg Makhanwala"));
  assert.equal(names("Raita Ka Chaska")[0], "Dahi Wada");
  assert.ok(!names("Our Spl. Chaats").includes("Dahi Wada"));
  assert.deepEqual(names("Mithas Ki Bahar").slice(0, 3), ["Gajar Halwa", "Mung Dal Halwa", "Jalebi Rabdi"]);
  assert.deepEqual(names("Roti Ki Tokri").slice(0, 2), ["Methi Roti", "Roomali Roti"]);
  assert.deepEqual(names("Daal or Kadi").slice(0, 3), ["Dal Tadka", "Dal Mahrani", "Dal Palak"]);
  assert.equal(names("Ice Cream Parlour")[0], "Vanilla with Hot Chocklet");
  assert.deepEqual(names(printedHeadings[16]), ["Fresh Fruit"]);
});

test("missing sections remain in their reference positions and custom dishes stay selectable", () => {
  const grouped = buildOrderDishCatalog([
    { id: 1, name: "Custom Counter", selectionRule: "Any two", dishes: [{ id: 1, name: "Custom dish" }] },
    { id: 2, name: "Non-Veg Specials", selectionRule: "Any one", dishes: [{ id: 2, name: "Chicken" }] },
  ]);
  assert.deepEqual(grouped.slice(0, 20).map((category) => category.name), printedHeadings);
  assert.equal(grouped[0].dishes.length, 0);
  assert.deepEqual(grouped[19].dishes, [], "custom categories must not be merged into Extras");
  assert.deepEqual(grouped[20], { id: 1, name: "Custom Counter", selectionRule: "Any two", dishes: [{ id: 1, name: "Custom dish" }] });
  assert.equal(grouped.at(-1)?.name, "Non-Veg Specials");
  assert.deepEqual(buildOrderDishCatalog([]), []);
});

test("Hi-tea keeps its own category and original dishes, including dishes shared with reference sections", () => {
  for (const name of ["Hi Tea", "Hi-Tea Starters", "High Tea", "Hightea"]) {
    const hiTea = { id: 50, name, selectionRule: "Any two", dishes: [{ id: 501, name: "Espresso Coffee" }, { id: 502, name: "Cheese Pizza" }] };
    const grouped = buildOrderDishCatalog([hiTea, { id: 51, name: "Extras", selectionRule: "", dishes: [{ id: 503, name: "Live Pasta Counter" }] }]);
    assert.deepEqual(grouped.find(category => category.id === hiTea.id), hiTea);
    assert.ok(!grouped.find(category => category.name === "Extras")!.dishes.some(dish => dish.id === 501));
    assert.equal(grouped.flatMap(category => category.dishes).filter(dish => dish.id === 502).length, 1);
  }
});
