import test from "node:test";
import assert from "node:assert/strict";
import {
  parseNim,
  forecast,
  validAddress,
  validatePlan,
  demoPlan,
  LUNA,
  dateAfter,
} from "../lib/finance";
import { verifyReceipt } from "../lib/receipt";
import { storageKey, loadPlan, savePlan } from "../lib/storage";
test("Luna conversion is exact, including the smallest unit", () => {
  assert.equal(parseNim("0.00001"), 1);
  assert.equal(parseNim("12.34567"), 1234567);
  assert.equal(parseNim("0"), 0);
});
test("invalid or imprecise monetary input cannot enter a payment", () => {
  for (const s of [
    "-1",
    "1e5",
    "1.000001",
    "NaN",
    "Infinity",
    "01",
    "1,000",
    "",
    "999999999999999999",
  ])
    assert.throws(() => parseNim(s));
});
test("candidate excluded from competing obligations, with fee included once", () => {
  const plan = demoPlan();
  const p = { ...plan.payments[2], fee: 1000 };
  plan.payments[2] = p;
  const f = forecast(1000 * LUNA, plan, p);
  assert.equal(f.obligations, 650 * LUNA);
  assert.equal(f.shortfall, 100 * LUNA + 1000);
  assert.equal(f.after, 750 * LUNA - 1000);
});
test("overdue commitments count, future commitments outside horizon do not", () => {
  const p = demoPlan();
  p.payments[0].due = dateAfter(-7);
  p.payments[1].due = dateAfter(60);
  assert.equal(forecast(1000 * LUNA, p).obligations, 670 * LUNA);
});
test("pending remains reserved, confirmed no longer counts", () => {
  const p = demoPlan();
  p.payments[0].status = "pending";
  p.payments[1].status = "confirmed";
  assert.equal(forecast(1000 * LUNA, p).obligations, 670 * LUNA);
});
test("Nimiq address format and checksum checked", () => {
  assert.equal(
    validAddress("NQ07 0000 0000 0000 0000 0000 0000 0000 0000"),
    true,
  );
  assert.equal(
    validAddress("NQ08 0000 0000 0000 0000 0000 0000 0000 0000"),
    false,
  );
  assert.equal(validAddress("0x1234"), false);
  assert.equal(
    validAddress("NQ79 HN52 XV6A 22L6 7ALU F14P L0BG 9YQP KMQ7"),
    true,
  );
});
test("malformed backups and duplicate IDs rejected", () => {
  assert.throws(() => validatePlan({}));
  const p = demoPlan();
  p.payments.push(p.payments[0]);
  assert.throws(() => validatePlan(p));
});
const hash = "a".repeat(64),
  sender = "NQ79 HN52 XV6A 22L6 7ALU F14P L0BG 9YQP KMQ7";
const payment = { ...demoPlan().payments[0], hash };
const tx = {
  hash,
  from: sender,
  to: payment.recipient,
  value: payment.amount,
  fee: 1000,
  blockNumber: 100,
  confirmations: 1,
  networkId: 24,
  executionResult: true,
};
test("only matching successful included receipt confirms payment", () => {
  assert.equal(
    verifyReceipt(tx, payment, sender, "mainnet").status,
    "confirmed",
  );
  assert.equal(
    verifyReceipt({ ...tx, executionResult: false }, payment, sender, "mainnet")
      .status,
    "failed",
  );
});
test("receipt checks reject wrong sender, recipient, amount, hash and network", () => {
  for (const changed of [
    { from: payment.recipient },
    { to: sender },
    { value: 1 },
    { hash: "b".repeat(64) },
    { networkId: 5 },
  ])
    assert.equal(
      verifyReceipt({ ...tx, ...changed }, payment, sender, "mainnet").status,
      "mismatch",
    );
});
test("hash alone and incomplete receipt cannot establish payment", () => {
  assert.equal(
    verifyReceipt(null, payment, sender, "mainnet").status,
    "pending",
  );
  assert.equal(
    verifyReceipt({ hash }, payment, sender, "mainnet").status,
    "pending",
  );
  assert.equal(
    verifyReceipt(
      { ...tx, executionResult: undefined },
      payment,
      sender,
      "mainnet",
    ).status,
    "pending",
  );
  assert.equal(
    verifyReceipt({ ...tx, confirmations: 0 }, payment, sender, "mainnet")
      .status,
    "pending",
  );
});
test("address and network scope prevent workspace collisions", () => {
  assert.notEqual(storageKey("mainnet", sender), storageKey("testnet", sender));
  assert.equal(
    storageKey("mainnet", sender),
    storageKey("mainnet", sender.replaceAll(" ", "")),
  );
});
test("reload after interrupted submission becomes uncertain, never payable", () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
    },
    configurable: true,
  });
  const p = demoPlan();
  p.payments[0].status = "submitting";
  savePlan("test", p);
  assert.equal(loadPlan("test").payments[0].status, "uncertain");
  assert.equal(loadPlan("test").payments[1].status, "planned");
});
