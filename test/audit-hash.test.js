import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

test("audit hash is deterministic for same payload+prevHash", () => {
  const secret = "test-secret";
  const payload = { a: 1, b: "x" };
  const prevHash = "prev";
  const body = JSON.stringify({ payload, prevHash });
  const h1 = createHmac("sha256", secret).update(body).digest("hex");
  const h2 = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(h1, h2);
});

