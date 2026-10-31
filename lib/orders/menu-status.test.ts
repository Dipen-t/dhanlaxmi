import { describe, expect, it } from "vitest";

import { isMenuPending } from "./menu-status";

describe("isMenuPending", () => {
  it("is pending when menuDishes is empty", () => {
    expect(isMenuPending({ menuDishes: [], dishIds: [] })).toBe(true);
  });

  it("is not pending when menuDishes has items", () => {
    expect(isMenuPending({ menuDishes: [{ id: 1 }], dishIds: [] })).toBe(false);
  });

  it("falls back to dishIds when menuDishes is absent", () => {
    expect(isMenuPending({ dishIds: [] })).toBe(true);
    expect(isMenuPending({ dishIds: [1] })).toBe(false);
  });

  it("prefers menuDishes over dishIds", () => {
    expect(isMenuPending({ menuDishes: [{ id: 1 }], dishIds: [] })).toBe(false);
    expect(isMenuPending({ menuDishes: [], dishIds: [1] })).toBe(true);
  });
});
