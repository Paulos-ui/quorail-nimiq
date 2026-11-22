import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parsePigeonRecord } from "../lib/nim-resolver";

test("name lookup fails closed on missing and unregistered records", () => {
  assert.throws(() => parsePigeonRecord("paul.nim", { free: true }));
  assert.throws(() => parsePigeonRecord("paul.nim", { owner: "NQ00FAKE" }));
  assert.throws(() => parsePigeonRecord("paul.nim", { address: "https://example.com" }));
});
