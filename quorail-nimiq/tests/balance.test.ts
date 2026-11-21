import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readWalletBalance,
  readWalletSnapshot,
  readTimeout,
} from "../lib/balance";
import { validAddress, parseNim } from "../lib/finance";
test("reads the current HTLC balance, never the empty wallet identity", async () => {
  const queried: string[] = [];
  const result = await readWalletSnapshot(
    {
      listAccounts: async () => ["wallet", "htlc"],
      getBalance: async (a) => {
        queried.push(a);
        return 1587500000;
      },
    },
    "wallet",
  );
  assert.equal(result.balance, 1587500000);
  assert.equal(result.source, "htlc");
  assert.deepEqual(queried, ["htlc"]);
});
test("follows contract replacement during a balance read", async () => {
  let accounts = ["wallet", "old"];
  const result = await readWalletSnapshot(
    {
      listAccounts: async () => accounts,
      getBalance: async (a) => {
        if (a === "old") {
          accounts = ["wallet", "new"];
          return 0;
        }
        return 500000;
      },
    },
    "wallet",
  );
  assert.equal(result.source, "new");
  assert.equal(result.balance, 500000);
});
test("identity changes never publish another wallet balance", async () => {
  await assert.rejects(
    () =>
      readWalletBalance(
        {
          listAccounts: async () => ["other", "htlc"],
          getBalance: async () => 1,
        },
        "wallet",
      ),
    /account changed/,
  );
});
test("unfunded wallet returns zero without querying pending incoming funds", async () => {
  assert.equal(
    await readWalletBalance(
      {
        listAccounts: async () => ["wallet"],
        getBalance: async () => {
          throw Error("must not query");
        },
      },
      "wallet",
    ),
    0,
  );
});
test("native read failures and invalid values are not coerced to zero", async () => {
  for (const value of [NaN, -1, 0.5])
    await assert.rejects(
      () =>
        readWalletBalance(
          {
            listAccounts: async () => ["wallet", "htlc"],
            getBalance: async () => value,
          },
          "wallet",
        ),
      /invalid balance/,
    );
  await assert.rejects(
    () =>
      readWalletBalance(
        {
          listAccounts: async () => ["wallet", "htlc"],
          getBalance: async () => {
            throw Error("Native network unavailable");
          },
        },
        "wallet",
      ),
    /Native network/,
  );
});
test("read timeout releases UI wait", async () => {
  await assert.rejects(
    () => readTimeout(new Promise(() => {}), "Balance", 5),
    /timed out/,
  );
});
test("recipient valid and ambiguous fee rejected", () => {
  assert.equal(validAddress("NQ72FPVL2DSPNM1789NBRSC8PXD8EJB82J66"), true);
  assert.throws(() => parseNim("05"));
  assert.equal(parseNim("0.5"), 50000);
});
