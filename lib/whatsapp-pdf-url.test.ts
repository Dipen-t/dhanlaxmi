import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPublicPdfUrl } from "./whatsapp-pdf-url";

test("document URLs target the public download endpoints and reject local Android origins", () => {
  assert.equal(buildPublicPdfUrl("https://app.example.com", "menus", 4), "https://app.example.com/api/menus/4/pdf?theme=standard");
  assert.equal(buildPublicPdfUrl("https://app.example.com", "kitchen-menus", 2), "https://app.example.com/api/kitchen-menus/2/pdf?theme=standard");
  assert.equal(buildPublicPdfUrl("https://app.example.com", "kitchen-menus", 2, "emerald-gold"), "https://app.example.com/api/kitchen-menus/2/pdf?theme=emerald-gold");
  assert.throws(() => buildPublicPdfUrl("https://app.example.com", "menus", 4, "unknown"), /valid PDF design/);
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.0.107:3000", "http://10.0.0.1", "http://172.16.0.1", "http://[::1]:3000"]) {
    assert.throws(() => buildPublicPdfUrl(origin, "menus", 4), /public PDF URL/);
  }
  assert.throws(() => buildPublicPdfUrl("https://app.example.com", "menus", -1), /Invalid menu/);
});
