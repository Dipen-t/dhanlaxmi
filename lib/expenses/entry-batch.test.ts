import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOtherExpenseEntries, parseVendorExpenseEntries } from "./entry-batch";

function rows(values: Record<string, string[]>) {
  const data = new FormData();
  for (const [key, entries] of Object.entries(values)) {
    for (const value of entries) data.append(key, value);
  }
  return data;
}

test("vendor batches keep filled rows from any vendors and skip blank amounts", () => {
  assert.deepEqual(parseVendorExpenseEntries(rows({ vendorId: ["3", "4", "5"], amount: ["1500", "", "2500"] })), {
    entries: [{ vendorId: 3, amount: 1500 }, { vendorId: 5, amount: 2500 }],
  });
});

test("a malformed vendor row rejects the whole batch", () => {
  for (const data of [
    rows({ vendorId: ["3", "4"], amount: ["1500", "-1"] }),
    rows({ vendorId: ["3", "3"], amount: ["1500", "2500"] }),
    rows({ vendorId: ["3", "invalid"], amount: ["1500", "2500"] }),
    rows({ vendorId: ["3", "4"], amount: ["1500"] }),
    rows({ vendorId: ["3"], amount: ["0"] }),
    rows({ vendorId: ["3"], amount: ["1.5"] }),
    rows({ vendorId: ["3"], amount: ["2147483648"] }),
    rows({ vendorId: ["3"], amount: [""] }),
  ]) {
    const parsed = parseVendorExpenseEntries(data);
    assert.ok(parsed.error);
    assert.equal(parsed.entries, undefined);
  }
});

test("other expenses accept several rows and ignore unused extra rows", () => {
  assert.deepEqual(parseOtherExpenseEntries(rows({ description: [" Transport ", "Labour", ""], amount: ["300", "200", ""] })), {
    entries: [{ description: "Transport", amount: 300 }, { description: "Labour", amount: 200 }],
  });
});

test("partial or invalid other expenses reject the whole batch", () => {
  for (const data of [
    rows({ description: ["Transport", "Labour"], amount: ["300", ""] }),
    rows({ description: ["Transport", ""], amount: ["300", "200"] }),
    rows({ description: ["Transport"], amount: ["300", "200"] }),
    rows({ description: ["Transport", "x".repeat(241)], amount: ["300", "200"] }),
    rows({ description: ["Transport"], amount: ["NaN"] }),
    rows({ description: ["Transport"], amount: ["2147483648"] }),
    rows({ description: [""], amount: [""] }),
  ]) {
    const parsed = parseOtherExpenseEntries(data);
    assert.ok(parsed.error);
    assert.equal(parsed.entries, undefined);
  }
});
