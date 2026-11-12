import { test } from "node:test";
import assert from "node:assert/strict";
import { receiptData, receiptHtml } from "../lib/receipt-document";
import { demoPlan, type Payment } from "../lib/finance";
const p: Payment = {
  ...demoPlan().payments[0],
  status: "confirmed",
  hash: "a".repeat(64),
  sender: "NQ72 FPVL 2DSP NM17 89NB RSC8 PXD8 EJB8 2J66",
  confirmedAt: "2026-11-12T07:25:00.000Z",
  amount: 100000000,
  fee: 39300,
};
test("receipt uses exact settled amount and fee and first verification timestamp", () => {
  const d = receiptData(p, "mainnet");
  assert.equal(d.amount, "1,000 NIM");
  assert.equal(d.fee, "0.393 NIM");
  assert.equal(d.total, "1,000.393 NIM");
  assert.equal(d.verifiedAt, p.confirmedAt);
  assert.equal(d.hash, p.hash);
});
test("pending and sender-less records cannot produce confirmed receipts", () => {
  assert.throws(() => receiptData({ ...p, status: "pending" }, "mainnet"));
  assert.throws(() => receiptData({ ...p, sender: undefined }, "mainnet"));
});
test("printable receipt escapes hostile user titles and preserves transaction identifiers", () => {
  const d = receiptData(
    { ...p, title: '<script>alert("x")</script>' },
    "mainnet",
  );
  const html = receiptHtml(d, (s) => s, "en", "https://nimiq.watch/#" + p.hash);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes(p.hash!));
  assert.ok(html.includes("2026-11-12T07:25:00.000Z"));
});
