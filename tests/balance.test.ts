import { test } from "node:test";
import assert from "node:assert/strict";
import { readWalletBalance, readTimeout } from "../lib/balance";
import { validAddress, parseNim } from "../lib/finance";
test("unsynced wallet does not publish a misleading zero balance", async () => {
  let queried = false;
  await assert.rejects(
    () =>
      readWalletBalance(
        {
          isConsensusEstablished: async () => false,
          getBalance: async () => {
            queried = true;
            return 0;
          },
        },
        "account",
      ),
    /unavailable, not zero/,
  );
  assert.equal(queried, false);
});
test("balance keeps valid zero and Luna values, rejects invalid provider results", async () => {
  for (const value of [0, 1587500000])
    assert.equal(
      await readWalletBalance(
        {
          isConsensusEstablished: async () => true,
          getBalance: async () => value,
        },
        "account",
      ),
      value,
    );
  for (const value of [NaN, -1, 0.5])
    await assert.rejects(
      () =>
        readWalletBalance(
          {
            isConsensusEstablished: async () => true,
            getBalance: async () => value,
          },
          "account",
        ),
      /invalid balance/,
    );
});
test("read timeout releases UI wait and late result cannot become a returned balance", async () => {
  await assert.rejects(
    () =>
      readTimeout(
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 25)),
        "Balance",
        5,
      ),
    /timed out/,
  );
});
test("reported recipient is valid and ambiguous fee is rejected instead of guessed", () => {
  assert.equal(validAddress("NQ72FPVL2DSPNM1789NBRSC8PXD8EJB82J66"), true);
  assert.throws(() => parseNim("05"));
  assert.equal(parseNim("0.5"), 50000);
  assert.equal(parseNim("5"), 500000);
});
