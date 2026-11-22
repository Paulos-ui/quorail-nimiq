import { isEvmAddress } from "./polygon-usdt";
import { normalAddress, validAddress, validDate } from "./finance";
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
  reference?: string;
  payer?: string;
  verifiedFee?: number;
  splitRemainder?: string;
};
export type Board = {
  id: string;
  title: string;
  kind: "team" | "collection" | "request";
  asset?: "NIM" | "USDT";
  network: "mainnet" | "testnet";
  created: number;
  expires: number;
  rows: BoardRow[];
};
export const boardMemo = (id: string, row: string) =>
  `QR:${id.slice(0, 16)}:${row}`;
export function matchesBoardMemo(data:unknown,id:string,row:string) {
  const encoded = Array.from(new TextEncoder().encode(boardMemo(id,row)))
    .map(n=>n.toString(16).padStart(2,"0")).join("");
  return typeof data==="string" && data.toLowerCase().replace(/^0x/,"")===encoded;
}
export function validateBoardInput(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Invalid board");
  const b = input as Board;
  if (
    !["team", "collection", "request"].includes(b.kind) ||
    !["mainnet", "testnet"].includes(b.network) ||
    typeof b.title !== "string" ||
    !b.title.trim() ||
    b.title.length > 80 ||
    !Array.isArray(b.rows) ||
    !b.rows.length ||
    b.rows.length > 20
  )
    throw new Error("Use a title and 1 to 20 commitments.");
  if (b.kind === "request" && (b.rows.length !== 1 || !validDate(b.rows[0]?.due))) throw new Error("Use one bill and a valid due date.");
  const usdt = b.asset === "USDT";
  if ((b.asset !== undefined && !["NIM","USDT"].includes(b.asset)) || (usdt && (b.kind!=="request" || b.network!=="mainnet"))) throw new Error("Unsupported request asset or network.");
  const rows = b.rows.map((r, i) => {
    if (
      !r ||
      (usdt ? !isEvmAddress(r.recipient) || /^0x0{40}$/i.test(r.recipient) : !validAddress(r.recipient)) ||
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
      recipient: usdt ? r.recipient.toLowerCase() : normalAddress(r.recipient),
      amount: r.amount,
      due: r.due,
      responsible: r.responsible,
      state: "open" as const,
    };
  });
  return { ...(usdt ? {asset:"USDT" as const} : {}), title: b.title.trim(), kind: b.kind, network: b.network, rows };
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
  if (
    t.networkId !== (board.network === "mainnet" ? 24 : 5) ||
    typeof t.to !== "string" ||
    normalAddress(t.to) !== normalAddress(row.recipient) ||
    t.value !== row.amount ||
    typeof t.from !== "string" ||
    !validAddress(t.from) ||
    !matchesBoardMemo(t.recipientData, board.id, row.id)
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
