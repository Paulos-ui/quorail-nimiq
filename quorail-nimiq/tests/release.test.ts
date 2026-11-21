import test from "node:test";
import assert from "node:assert/strict";
import {
  firstReserveRisk,
  receiptCsv,
  sharedCandidate,
  nextPendingReceipt,
} from "../lib/release-tools";
import { demoPlan, LUNA } from "../lib/finance";
import type { Board, BoardRow } from "../lib/boards";
test("risk identifies same-day group rather than arbitrary individual", () => {
  const p = demoPlan();
  p.payments = p.payments
    .slice(0, 2)
    .map((x) => ({ ...x, due: "2026-11-15", recurrence: undefined }));
  const risk = firstReserveRisk(
    p,
    800 * LUNA,
    30,
    new Date("2026-11-11T12:00:00Z"),
  );
  assert.equal(risk?.payments.length, 2);
  assert.equal(risk?.shortfall, 50 * LUNA);
});
test("already breached reserve is attributed to today", () => {
  const risk = firstReserveRisk(
    demoPlan(),
    100 * LUNA,
    90,
    new Date("2026-11-11T12:00:00Z"),
  );
  assert.equal(risk?.due, "2026-11-11");
  assert.equal(risk?.alreadyBelow, true);
});
test("CSV exports only confirmed receipts and protects spreadsheet formulas", () => {
  const p = demoPlan();
  p.payments[0] = {
    ...p.payments[0],
    status: "confirmed",
    title: '=HYPERLINK("bad")',
    hash: "a".repeat(64),
  };
  const csv = receiptCsv(p, "testnet", "address");
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes("a".repeat(64)));
  assert.ok(!csv.includes("Design collaborator"));
});
test("shared candidate preserves existing fee and blocks changed or paid plan", () => {
  const p = demoPlan(),
    first = p.payments[0];
  first.fee = 5;
  const row = {
    id: "1",
    sourceId: first.id,
    title: first.title,
    recipient: first.recipient,
    amount: first.amount,
    due: first.due,
    responsible: "Tester",
    state: "open",
  } as BoardRow;
  const board = { id: "board", rows: [row] } as Board;
  assert.equal(sharedCandidate(p, board, row).fee, 5);
  assert.throws(() => sharedCandidate(p, board, { ...row, amount: 1 }));
  first.status = "confirmed";
  assert.throws(() => sharedCandidate(p, board, row));
});
test("pending verification rotates beyond a stuck receipt", () => {
  const rows = [
    { id: "1", state: "pending", hash: "a" },
    { id: "2", state: "pending", hash: "b" },
    { id: "3", state: "open" },
  ] as BoardRow[];
  assert.equal(nextPendingReceipt(rows, 0)?.id, "1");
  assert.equal(nextPendingReceipt(rows, 1)?.id, "2");
  assert.equal(nextPendingReceipt(rows, 2)?.id, "1");
  assert.equal(nextPendingReceipt([], 0), undefined);
});
