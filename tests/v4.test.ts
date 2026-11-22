import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptBackup, decryptBackup } from "../lib/secure-backup";
import { newGrid, drop, fourWinner, fourBot } from "../lib/connect-four";
test("encrypted backup roundtrip and wrong password/tampering protection", async () => {
  const data = {
    network: "mainnet",
    address: "private account",
    plan: { payments: [] },
  };
  const encrypted = await encryptBackup(data, "a separate long password");
  assert.deepEqual(
    await decryptBackup(encrypted, "a separate long password"),
    data,
  );
  assert.ok(!JSON.stringify(encrypted).includes("private account"));
  await assert.rejects(() => decryptBackup(encrypted, "wrong password"));
  await assert.rejects(() =>
    decryptBackup(
      {
        ...encrypted,
        ciphertext:
          (encrypted.ciphertext[0] === "A" ? "B" : "A") +
          encrypted.ciphertext.slice(1),
      },
      "a separate long password",
    ),
  );
  await assert.rejects(() => encryptBackup(data, "short"));
});
test("backup encryption uses unique salt and IV; malformed versions rejected", async () => {
  const a = await encryptBackup({}, "a separate long password"),
    b = await encryptBackup({}, "a separate long password");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  await assert.rejects(() =>
    decryptBackup({ ...a, version: 2 }, "a separate long password"),
  );
});
test("connect four gravity, full columns and immutable moves", () => {
  const original = newGrid();
  let grid = original;
  for (let i = 0; i < 6; i++) grid = drop(grid, 0, i % 2 ? 1 : 2)!;
  assert.equal(drop(grid, 0, 1), null);
  assert.equal(drop(grid, -1, 1), null);
  assert.equal(original[5][0], 0);
  assert.equal(grid[5][0], 2);
});
test("connect four detects all line directions and bot takes win or blocks", () => {
  for (const [dr, dc] of [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]) {
    const grid = newGrid();
    for (let k = 0; k < 4; k++) grid[1 + dr * k][3 + dc * k] = 1;
    assert.equal(fourWinner(grid), 1);
  }
  let grid = newGrid();
  for (let c = 0; c < 3; c++) grid = drop(grid, c, 1)!;
  assert.equal(fourBot(grid), 3);
  grid = newGrid();
  for (let c = 0; c < 3; c++) grid = drop(grid, c, 2)!;
  assert.equal(fourBot(grid), 3);
});
