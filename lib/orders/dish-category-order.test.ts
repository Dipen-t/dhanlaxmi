import assert from "node:assert/strict";
import { test } from "node:test";
import { menuCatalog } from "../../db/menu-catalog";
import { buildOrderDishCatalog, sortOrderDishCategories } from "./dish-category-order";

test("the existing order catalog follows the printed sequence with all non-veg categories last", () => {
  const before = [...menuCatalog];
  const sorted = sortOrderDishCategories(menuCatalog);
  assert.deepEqual(sorted.map((category) => category.name), [
    "Paneer Mush Starter",
    "Choice of Veg Starter",
    "Choice of Palak Starter",
    "Chat Counter",
    "South Indian Counter",
    "Italian Counter",
    "Chinese Counter",
    "Choice of Veg Soup",
    "Rice",
    "Veg Main Course",
    "Dal / Curry",
    "Raita",
    "Sweet Counter",
    "Rotis",
    "Salad",
    "Dessert",
    "Fruit & Juices",
    "Choice of Non Veg Starter",
    "Fish Starter",
    "Non Veg Main Course",
  ]);
  assert.deepEqual(menuCatalog, before);
  assert.ok(sorted.every((category) => menuCatalog.includes(category)));
});

test("the actual order catalog starts with welcome drinks extracted from the mixed fruit category", () => {
  let dishId = 1;
  const categories = menuCatalog.map((category, index) => ({
    ...category,
    id: index + 1,
    dishes: category.dishes.map((name) => ({ id: dishId++, name })),
  }));
  const sorted = buildOrderDishCatalog(categories);
  assert.equal(sorted[0].name, "Welcome Drinks");
  assert.deepEqual(sorted[0].dishes.map((dish) => dish.name), ["Fresh Juice", "Mocktail Counter"]);
  assert.deepEqual(sorted.find((category) => category.name === "Fresh Fruits")?.dishes.map((dish) => dish.name), ["Fresh Fruit"]);
  assert.ok(sorted.findIndex((category) => category.name === "Choice of Veg Soup") > sorted.findIndex((category) => category.name === "Chinese Counter"));
  assert.deepEqual(sorted.slice(-3).map((category) => category.name), ["Choice of Non Veg Starter", "Fish Starter", "Non Veg Main Course"]);
  const allIds = (values: typeof categories) => values.flatMap((category) => category.dishes.map((dish) => dish.id)).sort((a, b) => a - b);
  assert.deepEqual(allIds(sorted), allIds(categories));
  assert.equal(new Set(sorted.map((category) => category.id)).size, sorted.length);
  assert.equal(categories.find((category) => category.name === "Fruit & Juices")?.dishes.length, 3);
});

test("printed headings and custom categories retain their dishes while non-veg stays at the end", () => {
  const names = ["Nonveg Specials", "Extras", "New Custom Counter", "Fresh Fruits", "Paan or Mukhwas", "Ice Cream Parlour", "Green Salad", "Roti Ki Tokri", "Mithas Ki Bahar", "Raita Ka Chaska", "Daal or Kadi", "Tawa Bahar", "Indian Main Course", "Paneer Ki Sabji", "Indian Counter", "Chinese Counter", "South Indian and Gourmet", "Our Spl. Chaats", "Welcome Starters", "Welcome Drinks", "Chicken Counter"];
  const categories = names.map((name) => ({ name, dishes: [{ name: `${name} dish` }] }));
  const sorted = sortOrderDishCategories(categories);
  assert.deepEqual(sorted.map((category) => category.name), [
    "Welcome Drinks", "Welcome Starters", "Our Spl. Chaats", "South Indian and Gourmet", "Chinese Counter", "Indian Counter", "Paneer Ki Sabji", "Indian Main Course", "Tawa Bahar", "Daal or Kadi", "Raita Ka Chaska", "Mithas Ki Bahar", "Roti Ki Tokri", "Green Salad", "Ice Cream Parlour", "Paan or Mukhwas", "Fresh Fruits", "Extras", "New Custom Counter", "Nonveg Specials", "Chicken Counter",
  ]);
  assert.ok(sorted.every((category) => categories.includes(category)));
});
