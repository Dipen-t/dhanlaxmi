import assert from "node:assert/strict";
import test from "node:test";
import { calendarDate, listReturnTo, orderListState, parentDestination } from "./navigation";

test("record pages return to their own section, top-level pages return home", () => {
  for (const path of ["/orders/new", "/orders/12/edit", "/orders/12/finance"]) assert.equal(parentDestination(path).href, "/orders");
  assert.equal(parentDestination("/vendors/4/finance").href, "/vendors");
  assert.equal(parentDestination("/menus/3").href, "/menus");
  assert.equal(parentDestination("/kitchen-menus/catalog").href, "/kitchen-menus");
  assert.equal(parentDestination("/reports").href, "/");
});

test("return links preserve list filters and reject external or unrelated destinations", () => {
  const original = "/orders?q=Sky+garden&view=grid&date=2026-11-28&month=2026-11";
  assert.equal(listReturnTo(original, "/orders"), original);
  for (const value of ["https://example.com/orders", "//example.com/orders", "javascript:alert(1)", "/settings", "/orders/12/edit", "/orders/../settings", null]) assert.equal(listReturnTo(value, "/orders"), "/orders");
});

test("order list state restores searches, calendar positions, and the selected view", () => {
  assert.deepEqual(orderListState(new URLSearchParams("q=Sky+garden&view=list&date=2026-12-18&month=2026-12"), "2026-11-20"), { query: "Sky garden", view: "list", date: "2026-12-18", month: "2026-12" });
  assert.deepEqual(orderListState(new URLSearchParams(), "2026-11-20"), { query: "", view: "calendar", date: "2026-11-20", month: "2026-11" });
});

test("malformed dates and view parameters recover without breaking the calendar", () => {
  assert.equal(calendarDate("2028-02-29", "fallback"), "2028-02-29");
  for (const date of ["2026-02-29", "2026-13-01", "2026-02-31", "0001-01-01", "bad"]) assert.equal(calendarDate(date, "fallback"), "fallback");
  assert.deepEqual(orderListState(new URLSearchParams("date=bad&month=2026-99&view=other"), "2026-11-20"), { query: "", view: "calendar", date: "2026-11-20", month: "2026-11" });
});
