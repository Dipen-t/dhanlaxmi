import assert from "node:assert/strict";
import { test } from "node:test";
import { generateOrderMenuPdfBuffer, type OrderForPdf } from "./order-pdf";

test("generateOrderMenuPdfBuffer produces a valid plain PDF buffer with header, categories, and hi-tea notes", async () => {
  const order: OrderForPdf = {
    id: 42,
    orderId: "DL-2026-0042",
    customerName: "Rahul Sharma",
    customer2Name: "Priya Sharma",
    date: "2026-12-18",
    venue: "Grand Ballroom, Mumbai",
    mealType: "dinner",
    numberOfPersons: 250,
    extraPlates: 25,
    menuDishes: [
      { dishId: 1, name: "Paneer Tikka", categoryId: 10, categoryName: "Starters" },
      { dishId: 2, name: "Veg Crispy", categoryId: 10, categoryName: "Starters" },
      { dishId: 3, name: "Dal Makhani", categoryId: 20, categoryName: "Main Course" },
      { dishId: 4, name: "Special Masala Tea", categoryId: 30, categoryName: "Hi-tea" },
      { dishId: 5, name: "Assorted Sandwiches", categoryId: 30, categoryName: "Hi-tea" },
    ],
    hiTeaNotes: "Serve tea at 4:30 PM with hot snacks",
  };

  const buffer = await generateOrderMenuPdfBuffer(order);
  assert.ok(Buffer.isBuffer(buffer), "Expected return value to be a Buffer");
  assert.ok(buffer.length > 1000, `Expected buffer length > 1000 bytes, got ${buffer.length}`);
  // PDF magic bytes: %PDF-
  const header = buffer.subarray(0, 5).toString("ascii");
  assert.equal(header, "%PDF-", `Expected PDF signature, got ${header}`);
});

test("generateOrderMenuPdfBuffer handles minimal order with no dishes but hi-tea notes", async () => {
  const order: OrderForPdf = {
    id: 99,
    orderId: "DL-2026-0099",
    customerName: "Anil Kapoor",
    venue: "Club House",
    date: "2026-11-25",
    mealType: "lunch",
    numberOfPersons: 100,
    extraPlates: 0,
    menuDishes: [],
    hiTeaNotes: "Only tea arrangements required",
  };

  const buffer = await generateOrderMenuPdfBuffer(order);
  assert.ok(Buffer.isBuffer(buffer));
  const header = buffer.subarray(0, 5).toString("ascii");
  assert.equal(header, "%PDF-");
});
