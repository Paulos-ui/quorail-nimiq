import type { Board, BoardRow } from "./boards";
import { committed, forecast, normalAddress, type Plan } from "./finance";

export function requestTotals(board: Board) {
  const total = board.rows.reduce((n, row) => n + row.amount, 0);
  const paid = board.rows.reduce(
    (n, row) => n + (row.state === "confirmed" ? row.amount : 0),
    0,
  );
  return { total, paid, remaining: total - paid };
}
export function splitRequest(
  board: Board,
  row: BoardRow,
  amount: number,
  expected: number,
) {
  if (
    board.kind !== "request" ||
    row.state !== "open" ||
    expected !== row.amount ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > row.amount ||
    board.rows.some((r) => r.state === "pending")
  )
    throw new Error(
      "Request changed or amount unavailable. Refresh and review again.",
    );
  if (amount === row.amount) return;
  if (board.rows.length >= 100)
    throw new Error(
      "Installment limit reached. Pay the outstanding installment in full.",
    );
  const id = String(board.rows.length + 1);
  board.rows.push({
    ...row,
    id,
    sourceId: requestRowId(board.id, id),
    amount: row.amount - amount,
  });
  row.amount = amount;
  row.splitRemainder = id;
}
export function undoRequestSplit(board: Board, row: BoardRow) {
  if (!row.splitRemainder) return;
  const remainder = board.rows.at(-1);
  if (remainder?.id === row.splitRemainder && remainder.state === "open") {
    row.amount += remainder.amount;
    board.rows.pop();
  }
  delete row.splitRemainder;
}
export const requestRowId = (id: string, row: string) => `request:${id}:${row}`;

export function compareRequests(balance: number, plan: Plan, boards: Board[]) {
  let cost = 0,
    alreadyPlanned = 0;
  for (const board of new Map(boards.map((b) => [b.id, b])).values()) {
    if (board.kind !== "request") throw new Error("Invalid payment request.");
    for (const row of board.rows) {
      if (row.state === "confirmed") continue;
      if (row.state === "pending")
        throw new Error(
          "A selected request has a payment awaiting verification.",
        );
      const saved = plan.payments.find(
        (p) => p.id === requestRowId(board.id, row.id),
      );
      if (
        saved &&
        (saved.status !== "planned" ||
          saved.amount !== row.amount ||
          normalAddress(saved.recipient) !== row.recipient)
      )
        throw new Error("Review the changed request before comparing.");
      cost += row.amount + (saved?.fee ?? 0);
      if (saved && committed(saved, plan.horizon))
        alreadyPlanned += saved.amount + saved.fee;
    }
  }
  return {
    cost,
    available: forecast(balance, plan).available - cost + alreadyPlanned,
  };
}
export function requestIndexKey(network: string, address: string) {
  return `quorail:request-links:${network}:${normalAddress(address)}`;
}
export function readLinks(network: string, address: string): string[] {
  const value: unknown = JSON.parse(
    localStorage.getItem(requestIndexKey(network, address)) ?? "[]",
  );
  if (
    !Array.isArray(value) ||
    !value.every((v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v))
  )
    throw new Error("Unreadable request inbox.");
  return [...new Set<string>(value)];
}
export async function rememberRequest(
  network: string,
  address: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error("Invalid request link.");
  if (!navigator.locks)
    throw new Error("Update your wallet browser to save requests.");
  const key = requestIndexKey(network, address);
  await navigator.locks.request(key, () => {
    const links = readLinks(network, address);
    if (!links.includes(secret))
      localStorage.setItem(key, JSON.stringify([...links, secret]));
  });
}

export function requestToken(value: string, origin: string): string | null {
  try {
    const url = new URL(value);
    return url.origin === origin &&
      !url.username &&
      !url.password &&
      !url.search &&
      /^\/shared\/?$/.test(url.pathname) &&
      /^#[a-f0-9]{64}$/.test(url.hash)
      ? url.hash.slice(1)
      : null;
  } catch {
    return null;
  }
}

/** Apply verified request receipts to this wallet's plan, even after a reload. */
export function reconcileRequest(plan: Plan, board: Board): Plan {
  if (board.kind !== "request") return plan;
  let changed = false;
  const payments = plan.payments.flatMap((payment) => {
    const row = board.rows.find(
      (r) => requestRowId(board.id, r.id) === payment.id,
    );
    if (
      !row ||
      row.state !== "confirmed" ||
      !row.hash ||
      !row.sender ||
      payment.status === "confirmed" ||
      payment.amount !== row.amount ||
      normalAddress(payment.recipient) !== row.recipient
    )
      return [payment];
    if (payment.status === "planned") {
      // Another payer can cover a shared bill. Remove the obligation without claiming their receipt.
      changed = true;
      return [];
    }
    if (
      !payment.expectedSender ||
      normalAddress(payment.expectedSender) !== row.sender ||
      (payment.hash && payment.hash.toLowerCase() !== row.hash)
    )
      return [payment];
    changed = true;
    return [
      {
        ...payment,
        status: "confirmed" as const,
        hash: row.hash,
        sender: row.sender,
        fee: row.verifiedFee ?? payment.fee,
        feeVerified: row.verifiedFee !== undefined,
        confirmedAt: new Date().toISOString(),
      },
    ];
  });
  return changed ? { ...plan, payments } : plan;
}
