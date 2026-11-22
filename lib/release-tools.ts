import {
  occurrences,
  nim,
  normalAddress,
  type Plan,
  type Payment,
} from "./finance";
import type { Board, BoardRow } from "./boards";
export function firstReserveRisk(
  plan: Plan,
  balance: number,
  days = 90,
  now = new Date(),
) {
  const groups = new Map<string, Payment[]>();
  for (const p of occurrences(plan, days, now)) {
    const due =
      p.due < now.toISOString().slice(0, 10)
        ? now.toISOString().slice(0, 10)
        : p.due;
    groups.set(due, [...(groups.get(due) || []), p]);
  }
  if (balance < plan.reserve)
    return {
      due: now.toISOString().slice(0, 10),
      payments: [] as Payment[],
      remaining: balance,
      shortfall: plan.reserve - balance,
      alreadyBelow: true,
    };
  let remaining = balance;
  for (const [due, payments] of [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    remaining -= payments.reduce((s, p) => s + p.amount + p.fee, 0);
    if (remaining < plan.reserve)
      return {
        due,
        payments,
        remaining,
        shortfall: plan.reserve - remaining,
        alreadyBelow: balance < plan.reserve,
      };
  }
  return balance < plan.reserve
    ? {
        due: now.toISOString().slice(0, 10),
        payments: [] as Payment[],
        remaining: balance,
        shortfall: plan.reserve - balance,
        alreadyBelow: true,
      }
    : null;
}
function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function receiptCsv(plan: Plan, network: string, address: string) {
  const header = [
    "commitment_id",
    "title",
    "network",
    "planning_account",
    "sender",
    "recipient",
    "amount_NIM",
    "planned_fee_NIM",
    "due",
    "confirmed_at",
    "transaction_hash",
  ];
  const rows = plan.payments
    .filter((p) => p.status === "confirmed" && p.hash)
    .map((p) => [
      p.id,
      p.title,
      network,
      address,
      p.sender || "",
      p.recipient,
      nim(p.amount),
      nim(p.fee),
      p.due,
      p.confirmedAt || "",
      p.hash,
    ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export function sharedCandidate(
  plan: Plan,
  board: Board,
  row: BoardRow,
): Payment {
  const existing = plan.payments.find(
    (p) => p.id === (row.sourceId || `board:${board.id}:${row.id}`),
  );
  if (
    existing &&
    (existing.status !== "planned" ||
      existing.amount !== row.amount ||
      normalAddress(existing.recipient) !== normalAddress(row.recipient))
  )
    throw new Error(
      "This shared commitment differs from, or was already paid in, your private plan.",
    );
  return (
    existing || {
      id: `board:${board.id}:${row.id}`,
      title: row.title,
      recipient: row.recipient,
      amount: row.amount,
      fee: 0,
      due: row.due,
      status: "planned",
      priority: "normal",
      created: new Date().toISOString(),
    }
  );
}
export function nextPendingReceipt(rows: BoardRow[], cursor: number) {
  const pending = rows.filter((r) => r.state === "pending" && r.hash);
  return pending.length ? pending[cursor % pending.length] : undefined;
}
