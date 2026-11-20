import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import path from "node:path";
import catalog from "./category-image-catalog.json";
import { categoryImageKeyById, getCategoryImageKey } from "./category-images";

test("new and renamed menu sections resolve without relying on database IDs", () => {
  const expected: Record<string, string> = {
    "Welcome Drink (seasonal)": "fruit-juices",
    "Pan & Mukhwas": "paan-mukhwas",
    "Raita Ka Chaska": "raita",
    "Mineral water": "mineral-water",
    "Extra": "assorted-extras",
    "Fresh Fruits,Hot kadai, Cold Masala Milk,Malai Ice gola": "fruit-milk-ice-gola",
    "Chinese rice": "chinese-rice",
    "Chinese Noodles": "chinese-counter",
    "Chinese main Course": "chinese-counter",
    "Indian Counter": "rice",
    "Tawa Bahar": "tawa-bahar",
    "Indian Main Course": "veg-main-course",
    "South Indian & Gourmet": "south-indian-counter",
    "Welcome Starters": "veg-starter",
    "Our Spl. Chaats": "chat-counter",
    "Paneer ki Sabji": "veg-main-course",
    "Roti ki Tokri": "rotis",
    "Ice Cream Parlour": "dessert",
    "Mitas Ki Bahar": "sweet-counter",
  };
  for (const [name, key] of Object.entries(expected)) {
    assert.equal(getCategoryImageKey({ name }), key, name);
    assert.equal(categoryImageKeyById(99999, name), key, name);
  }
});

test("repurposing an old category chooses the new subject rather than its old ID image", () => {
  assert.equal(categoryImageKeyById(18, "Chinese rice"), "chinese-rice");
  assert.equal(getCategoryImageKey({ name: "Chinese rice", imageKey: "chinese-counter" }), "chinese-rice");
  assert.equal(categoryImageKeyById(2, "Chef's selection"), "paneer-mushroom-starter");
  assert.equal(categoryImageKeyById(2), "paneer-mushroom-starter");
});

test("category matching handles punctuation and rejects unknown image keys", () => {
  assert.equal(getCategoryImageKey({ name: "  OUR SPL. CHAATS! " }), "chat-counter");
  assert.equal(getCategoryImageKey({ name: "Chef selection", imageKey: "rice" }), "rice");
  assert.equal(getCategoryImageKey({ name: "Unmapped section", imageKey: "../../secret" }), undefined);
});

test("every photo has both a master and a compact print asset", () => {
  assert.equal(new Set(catalog.map(photo => photo.key)).size, catalog.length);
  for (const photo of catalog) {
    for (const folder of ["public/menu-category-images", "public/menu-category-images/pdf"]) {
      assert.ok(existsSync(path.join(process.cwd(), folder, `${photo.key}.png`)), `${folder}/${photo.key}.png`);
    }
  }
});
