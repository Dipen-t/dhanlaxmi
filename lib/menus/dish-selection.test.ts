import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMenuDishSelection, selectedMenuDishes } from "./dish-selection";

const catalog = [{ id: 1, dishes: [{ id: 10 }, { id: 11 }] }, { id: 2, dishes: [{ id: 20 }] }, { id: 3, dishes: [] }];
function form(categories: string[], dishes: string[], custom = true) {
  const data = new FormData();
  categories.forEach((id) => data.append("categoryIds", id));
  dishes.forEach((id) => data.append("dishIds", id));
  if (custom) data.set("dishSelection", "custom");
  return data;
}

test("specific dish choices remain grouped under the selected categories", () => {
  assert.deepEqual(parseMenuDishSelection(form(["2", "1", "1"], ["20", "11", "11"]), catalog), { entries: [{ categoryId: 2, selectedDishIds: [20] }, { categoryId: 1, selectedDishIds: [11] }] });
});

test("legacy menu categories retain their full catalog", () => {
  assert.deepEqual(parseMenuDishSelection(form(["1"], [], false), catalog), { entries: [{ categoryId: 1, selectedDishIds: null }] });
  assert.deepEqual(selectedMenuDishes(catalog[0].dishes, null), [{ id: 10 }, { id: 11 }]);
});

test("preview and PDF data exclude unselected and deleted dishes while retaining catalog order", () => {
  assert.deepEqual(selectedMenuDishes(catalog[0].dishes, [11, 999]), [{ id: 11 }]);
  assert.deepEqual(selectedMenuDishes(catalog[0].dishes, []), []);
  assert.deepEqual(selectedMenuDishes(catalog[0].dishes, [11, 10]), [{ id: 10 }, { id: 11 }]);
});

test("invalid selections fail together without silently adding all dishes", () => {
  for (const data of [form([], []), form(["999"], ["10"]), form(["1"], ["20"]), form(["1"], ["999"]), form(["1", "2"], ["10"]), form(["1"], []), form(["1.5"], ["10"]), form(["1"], ["NaN"])]) {
    assert.ok(parseMenuDishSelection(data, catalog).error);
  }
});
