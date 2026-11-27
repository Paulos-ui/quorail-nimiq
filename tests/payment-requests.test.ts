import test from "node:test";
import assert from "node:assert/strict";
import {
  compareRequests,
  requestRowId,
  requestToken,
  requestTotals,
  splitRequest,
  undoRequestSplit,
  reconcileRequest,
} from "../lib/payment-requests";
import {
  boardMemo,
  validateBoardInput,
  verifyBoardReceipt,
  findBoardReceipt,
  type Board,
} from "../lib/boards";
import { emptyPlan, dateAfter } from "../lib/finance";
import { sharedCandidate } from "../lib/release-tools";
import { verifyReceipt } from "../lib/receipt";

const address = "NQ0700000000000000000000000000000000";
const now = dateAfter(0);
function request(amount: number, id = "b".repeat(32)): Board {
  const board = validateBoardInput({
    title: "Design",
    network: "mainnet",
    kind: "request",
    rows: [
      {
        title: "Design",
        due: now,
        responsible: "Payer",
        recipient: address,
        amount,
      },
    ],
  });
  board.rows[0].sourceId = requestRowId(id, "1");
  return { ...board, id, created: 1, expires: 2 };
}
test("compares new and saved requests once including fees and reserve", () => {
  const a = request(120000000),
    b = request(80000000, "c".repeat(32));
  const plan = {
    ...emptyPlan(),
    reserve: 500000,
    payments: [] as ReturnType<typeof sharedCandidate>[],
  };
  const saved = { ...sharedCandidate(plan, a, a.rows[0]), fee: 12 };
  plan.payments.push(saved);
  assert.deepEqual(compareRequests(187060700, plan, [a, a, b]), {
    cost: 200000012,
    available: -13439312,
  });
});
test("installments preserve the total and uniquely identify each settled amount", () => {
  const board = request(100000000);
  const row = board.rows[0];
  splitRequest(board, row, 40000000, 100000000);
  assert.equal(board.rows[1].amount, 60000000);
  assert.equal(requestTotals(board).remaining, 100000000);
  row.state = "pending";
  assert.throws(() => splitRequest(board, board.rows[1], 100, 60000000));
  const hash = "a".repeat(64);
  const tx = {
    hash,
    confirmations: 2,
    blockNumber: 1,
    executionResult: true,
    networkId: 24,
    to: address,
    from: address,
    value: row.amount,
    fee: 0,
    recipientData: Buffer.from(boardMemo(board.id, row.id)).toString("hex"),
  };
  assert.equal(verifyBoardReceipt(tx, board, row, hash), address);
  const unrelated = { ...tx, recipientData: "" };
  assert.equal(findBoardReceipt([unrelated, tx], board, row)?.hash, hash);
  assert.equal(findBoardReceipt([unrelated, { ...tx, executionResult: false }], board, row), undefined);
  assert.equal(findBoardReceipt([tx], board, board.rows[1]), undefined);
  assert.throws(() => findBoardReceipt(null, board, row));
  assert.throws(() => verifyBoardReceipt(tx, board, board.rows[1], hash));
  const payment = { ...sharedCandidate(emptyPlan(), board, row), hash };
  assert.equal(
    verifyReceipt(tx, payment, address, "mainnet").status,
    "confirmed",
  );
  assert.equal(
    verifyReceipt({ ...tx, recipientData: "" }, payment, address, "mainnet")
      .status,
    "mismatch",
  );
  row.state = "confirmed";
  row.hash = hash;
  assert.deepEqual(requestTotals(board), {
    total: 100000000,
    paid: 40000000,
    remaining: 60000000,
  });
});
test("rejects stale installment amounts, invalid amounts and foreign QR links", () => {
  for (const value of [0, -1, 1.5, 101]) {
    const b = request(100);
    assert.throws(() => splitRequest(b, b.rows[0], value, 100));
  }
  const b = request(100);
  assert.throws(() => splitRequest(b, b.rows[0], 50, 99));
  const origin = "https://example.test",
    token = "a".repeat(64);
  assert.equal(requestToken(origin + "/shared/#" + token, origin), token);
  for (const url of [
    "https://other.test/shared/#" + token,
    origin + "/console/#" + token,
    origin + "/shared/?next=1#" + token,
  ])
    assert.equal(requestToken(url, origin), null);
});

test("reopening a verified installment updates its matching private receipt exactly once", () => {
  const board = request(1000);
  const row = board.rows[0];
  splitRequest(board, row, 400, 1000);
  const payment = sharedCandidate(emptyPlan(), board, row);
  const outstanding = sharedCandidate(emptyPlan(), board, board.rows[1]);
  const hash = "a".repeat(64);
  const plan = {
    ...emptyPlan(),
    payments: [
      { ...payment, status: "pending" as const, expectedSender: address, hash },
      outstanding,
    ],
  };
  Object.assign(row, {
    state: "confirmed",
    sender: address,
    hash,
    verifiedFee: 2,
  });
  const recovered = reconcileRequest(JSON.parse(JSON.stringify(plan)), board);
  assert.equal(recovered.payments[0].status, "confirmed");
  assert.equal(recovered.payments[0].fee, 2);
  assert.deepEqual(recovered.payments[1], outstanding);
  assert.equal(reconcileRequest(recovered, board), recovered);
  row.hash = "f".repeat(64);
  assert.equal(reconcileRequest(plan, board), plan);
});
test("cancelled partial claim restores the original request amount", () => {
  const board = request(1000);
  splitRequest(board, board.rows[0], 400, 1000);
  undoRequestSplit(board, board.rows[0]);
  assert.equal(board.rows.length, 1);
  assert.equal(board.rows[0].amount, 1000);
  assert.equal(board.rows[0].splitRemainder, undefined);
});
