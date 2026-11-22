import { normalAddress, validAddress } from "./finance";
export type BoardRow = {
  id: string;
  sourceId?: string;
  title: string;
  recipient: string;
  amount: number;
  due: string;
  responsible: string;
  state: "open" | "pending" | "confirmed";
  hash?: string;
  sender?: string;
  claim?: string;
};
export type Board = {
  id: string;
  title: string;
  kind: "team" | "collection";
  network: "mainnet" | "testnet";
  created: number;
  expires: number;
  rows: BoardRow[];
};
export const boardMemo = (id: string, row: string) =>
  `QR:${id.slice(0, 16)}:${row}`;
export function validateBoardInput(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Invalid board");
  const b = input as Board;
  if (
    !["team", "collection"].includes(b.kind) ||
    !["mainnet", "testnet"].includes(b.network) ||
    typeof b.title !== "string" ||
    !b.title.trim() ||
    b.title.length > 80 ||
    !Array.isArray(b.rows) ||
    !b.rows.length ||
    b.rows.length > 20
  )
    throw new Error("Use a title and 1 to 20 commitments.");
  const rows = b.rows.map((r, i) => {
    if (
      !r ||
      !validAddress(r.recipient) ||
      !Number.isSafeInteger(r.amount) ||
      r.amount <= 0 ||
      r.amount > 1e13 ||
      typeof r.title !== "string" ||
      r.title.length > 80 ||
      typeof r.responsible !== "string" ||
      r.responsible.length > 40 ||
      typeof r.due !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(r.due)
    )
      throw new Error("Invalid commitment");
    return {
      id: String(i + 1),
      sourceId:
        typeof r.sourceId === "string" ? r.sourceId.slice(0, 100) : undefined,
      title: r.title,
      recipient: normalAddress(r.recipient),
      amount: r.amount,
      due: r.due,
      responsible: r.responsible,
      state: "open" as const,
    };
  });
  return { title: b.title.trim(), kind: b.kind, network: b.network, rows };
}
export function verifyBoardReceipt(
  raw: unknown,
  board: Board,
  row: BoardRow,
  hash: string,
) {
  const t = raw as Record<string, unknown> | null;
  if (
    !t ||
    t.hash !== hash ||
    t.executionResult !== true ||
    typeof t.confirmations !== "number" ||
    t.confirmations < 1 ||
    typeof t.blockNumber !== "number" ||
    t.blockNumber < 1
  )
    throw new Error("No successful included transaction yet.");
  const memo = boardMemo(board.id, row.id);
  const encoded = Array.from(new TextEncoder().encode(memo))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
  if (
    t.networkId !== (board.network === "mainnet" ? 24 : 5) ||
    typeof t.to !== "string" ||
    normalAddress(t.to) !== normalAddress(row.recipient) ||
    t.value !== row.amount ||
    typeof t.from !== "string" ||
    !validAddress(t.from) ||
    typeof t.recipientData !== "string" ||
    t.recipientData.toLowerCase().replace(/^0x/, "") !== encoded
  )
    throw new Error(
      "Receipt does not match recipient, amount, network and unique reference.",
    );
  if (board.rows.some((r) => r.id !== row.id && r.hash === hash))
    throw new Error("Receipt already used.");
  return normalAddress(t.from);
}
export function publicBoard(b: Board): Board {
  return {
    ...b,
    rows: b.rows.map(({ claim, ...r }) => {
      void claim;
      return r;
    }),
  };
}
