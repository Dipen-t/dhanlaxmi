import assert from "node:assert/strict";
import { test } from "node:test";
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from "undici";
import { buildPublicPdfUrl, getWhatsAppPdfUrl } from "./whatsapp-pdf-url";

test("document URLs target the public download endpoints and reject local Android origins", () => {
  assert.equal(buildPublicPdfUrl("https://app.example.com", "menus", 4), "https://app.example.com/api/menus/4/pdf?theme=standard");
  assert.equal(buildPublicPdfUrl("https://app.example.com", "menus", 4, "emerald-gold"), "https://app.example.com/api/menus/4/pdf?theme=emerald-gold");
  assert.equal(buildPublicPdfUrl("https://app.example.com", "kitchen-menus", 2), "https://app.example.com/api/kitchen-menus/2/pdf");
  assert.equal(buildPublicPdfUrl("https://app.example.com", "kitchen-menus", 2, "emerald-gold"), "https://app.example.com/api/kitchen-menus/2/pdf");
  assert.throws(() => buildPublicPdfUrl("https://app.example.com", "menus", 4, "unknown"), /valid PDF design/);
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.0.107:3000", "http://10.0.0.1", "http://172.16.0.1", "http://[::1]:3000"]) {
    assert.throws(() => buildPublicPdfUrl(origin, "menus", 4), /public PDF URL/);
  }
  assert.throws(() => buildPublicPdfUrl("https://app.example.com", "menus", -1), /Invalid menu/);
});

test("Blob mode uploads the local PDF and returns the provider URL", async (t) => {
  const pdf = "%PDF-1.7\n";
  const url = "https://teststore.public.blob.vercel-storage.com/whatsapp-pdfs/menu-random.pdf";
  const apiOrigin = "https://blob-api.example.com";
  const previousDispatcher = getGlobalDispatcher();
  const mock = new MockAgent();
  mock.disableNetConnect();
  setGlobalDispatcher(mock);
  t.after(async () => {
    setGlobalDispatcher(previousDispatcher);
    await mock.close();
  });
  mock.get(apiOrigin).intercept({
    method: "PUT",
    path: "/?pathname=whatsapp-pdfs%2Fmenu.pdf",
    headers: { "x-vercel-blob-access": "public" },
    body: (body) => String(body) === String(Uint8Array.from(Buffer.from(pdf))),
  }).reply(200, { url });
  for (const [key, value] of Object.entries({
    BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_teststore_testtoken",
    VERCEL_BLOB_API_URL: apiOrigin,
    VERCEL_BLOB_RETRIES: "0",
  })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }

  const uploadedUrl = await getWhatsAppPdfUrl("menus", 4, "standard", async () => Buffer.from(pdf)).catch((error) => {
    throw error.cause?.cause ?? error.cause ?? error;
  });
  assert.equal(uploadedUrl, url);
  mock.assertNoPendingInterceptors();
});
