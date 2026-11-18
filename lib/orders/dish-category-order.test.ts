import assert from "node:assert/strict";
import { test } from "node:test";
import { menuCatalog } from "../../db/menu-catalog";
import { sortOrderDishCategories } from "./dish-category-order";

test("the existing order catalog follows the printed sequence with all non-veg categories last", () => {
  const before = [...menuCatalog];
  const sorted = sortOrderDishCategories(menuCatalog);
  assert.deepEqual(sorted.map((category) => category.name), [
    "Choice of Veg Soup",
    "Paneer Mush Starter",
    "Choice of Veg Starter",
    "Choice of Palak Starter",
    "Chat Counter",
    "South Indian Counter",
    "Italian Counter",
    "Chinese Counter",
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

test("printed headings and custom categories retain their dishes while non-veg stays at the end", () => {
  const names = ["Nonveg Specials", "Extras", "New Custom Counter", "Fresh Fruits", "Paan or Mukhwas", "Ice Cream Parlour", "Green Salad", "Roti Ki Tokri", "Mithas Ki Bahar", "Raita Ka Chaska", "Daal or Kadi", "Tawa Bahar", "Indian Main Course", "Paneer Ki Sabji", "Indian Counter", "Chinese Counter", "South Indian and Gourmet", "Our Spl. Chaats", "Welcome Starters", "Welcome Drinks", "Chicken Counter"];
  const categories = names.map((name) => ({ name, dishes: [{ name: `${name} dish` }] }));
  const sorted = sortOrderDishCategories(categories);
  assert.deepEqual(sorted.map((category) => category.name), [
    "Welcome Drinks", "Welcome Starters", "Our Spl. Chaats", "South Indian and Gourmet", "Chinese Counter", "Indian Counter", "Paneer Ki Sabji", "Indian Main Course", "Tawa Bahar", "Daal or Kadi", "Raita Ka Chaska", "Mithas Ki Bahar", "Roti Ki Tokri", "Green Salad", "Ice Cream Parlour", "Paan or Mukhwas", "Fresh Fruits", "Extras", "New Custom Counter", "Nonveg Specials", "Chicken Counter",
  ]);
  assert.ok(sorted.every((category) => categories.includes(category)));
});
