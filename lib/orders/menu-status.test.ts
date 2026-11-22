import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isMenuPending } from "./menu-status";

describe("isMenuPending", () => {
  it("is pending when menuDishes is empty", () => {
    assert.equal(isMenuPending({ menuDishes: [], dishIds: [] }), true);
  });

  it("is not pending when menuDishes has items", () => {
    assert.equal(isMenuPending({ menuDishes: [{ id: 1 }], dishIds: [] }), false);
  });

  it("falls back to dishIds when menuDishes is absent", () => {
    assert.equal(isMenuPending({ dishIds: [] }), true);
    assert.equal(isMenuPending({ dishIds: [1] }), false);
  });

  it("prefers menuDishes over dishIds", () => {
    assert.equal(isMenuPending({ menuDishes: [{ id: 1 }], dishIds: [] }), false);
    assert.equal(isMenuPending({ menuDishes: [], dishIds: [1] }), true);
  });
});
