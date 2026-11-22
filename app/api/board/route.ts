import { redisConfig } from "@/lib/server-config";
import { sameOrigin } from "@/lib/request-origin";
import { randomBytes, createHash } from "node:crypto";
import { redis, boardKey, smallJson } from "@/lib/server-store";
import {
  validateBoardInput,
  verifyBoardReceipt,
  publicBoard,
  type Board,
} from "@/lib/boards";
import {
  requestRowId,
  splitRequest,
  undoRequestSplit,
} from "@/lib/payment-requests";
import { polygonRequestRpc } from "@/lib/polygon-request-rpc";
import { evmHash, verifyUsdtInstallment } from "@/lib/usdt-request";
import { isEvmAddress, requirePolygon } from "@/lib/polygon-usdt";
import { rpc } from "@/lib/rpc";
export const runtime = "nodejs";
export const maxDuration = 30;
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(req: Request) {
  if (!sameOrigin(req)) return reply({ error: "Open from Quorail." }, 403);
  try {
    const data = await smallJson(req);
    if (data.action === "create") {
      const input = validateBoardInput(data.board);
      if (input.asset === "USDT") await requirePolygon(polygonRequestRpc());
      const day = Math.floor(Date.now() / 86400000);
      const ip = process.env.VERCEL
        ? req.headers.get("x-vercel-forwarded-for") || "unknown"
        : "local";
      const client = createHash("sha256")
        .update(ip + (redisConfig()?.token || ""))
        .digest("hex");
      const quota = await redis([
        "EVAL",
        "local g=tonumber(redis.call('GET',KEYS[1]) or '0'); local u=tonumber(redis.call('GET',KEYS[2]) or '0'); if g>=100 or u>=10 then return 0 end; redis.call('INCR',KEYS[1]);redis.call('EXPIRE',KEYS[1],172800);redis.call('INCR',KEYS[2]);redis.call('EXPIRE',KEYS[2],172800);return 1",
        2,
        `quorail:boards:day:${day}`,
        `quorail:boards:ip:${client}:${day}`,
      ]);
      if (quota !== 1)
        return reply(
          { error: "Board creation limit reached. Try tomorrow." },
          429,
        );
      const secret = randomBytes(32).toString("hex"),
        id = randomBytes(16).toString("hex");
      const board: Board = {
        ...input,
        id,
        created: Date.now(),
        expires: Date.now() + 30 * 86400000,
      };
      if (board.kind === "request")
        board.rows[0].sourceId = requestRowId(id, "1");
      await redis([
        "SET",
        boardKey(secret),
        JSON.stringify(board),
        "EX",
        30 * 86400,
      ]);
      return reply({ secret, board: publicBoard(board) });
    }
    const key = boardKey(data.secret),
      raw = await redis(["GET", key]);
    if (!raw)
      return reply(
        { error: "This board is unavailable or its 30-day link has expired." },
        404,
      );
    const board: Board = JSON.parse(raw);
    if (data.action === "read") return reply({ board: publicBoard(board) });
    const row = board.rows.find((r) => r.id === data.row);
    if (!row) throw new Error("Commitment not found.");
    const usdt = board.asset === "USDT";
    const hashPattern = usdt ? evmHash : /^[a-f0-9]{64}$/i;
    let claim: string | undefined;
    if (data.action === "claim") {
      if (row.state !== "open")
        throw new Error("This commitment is already pending or confirmed.");
      if (board.kind === "request")
        splitRequest(board, row, data.amount, data.expected);
      if (usdt) {
        if (
          typeof data.payer !== "string" ||
          !isEvmAddress(data.payer) ||
          data.payer.toLowerCase() === row.recipient
        )
          throw new Error("Invalid payer.");
        await requirePolygon(polygonRequestRpc());
        row.payer = data.payer.toLowerCase();
        if (
          typeof data.claim !== "string" ||
          !/^[a-f0-9]{48}$/.test(data.claim)
        )
          throw new Error("Invalid installment claim.");
        row.reference = createHash("sha256")
          .update([board.id, row.id, data.claim].join(":"))
          .digest("hex");
      }
      claim = usdt ? (data.claim as string) : randomBytes(24).toString("hex");
      row.claim = claim;
      row.state = "pending";
    } else if (data.action === "release") {
      if (
        typeof row.claim !== "string" ||
        row.state !== "pending" ||
        row.claim !== data.claim ||
        row.hash
      )
        throw new Error("Cannot release this payment.");
      undoRequestSplit(board, row);
      row.state = "open";
      delete row.payer;
      delete row.reference;
      delete row.claim;
    } else if (data.action === "submit") {
      if (
        typeof row.claim !== "string" ||
        row.state !== "pending" ||
        row.claim !== data.claim ||
        !hashPattern.test(data.hash)
      )
        throw new Error("Invalid payment attempt.");
      if (row.hash && row.hash !== data.hash.toLowerCase())
        throw new Error("Transaction already submitted.");
      row.hash = data.hash.toLowerCase();
    } else if (data.action === "verify") {
      const hash = String(data.hash || row.hash || "").toLowerCase();
      if (!hashPattern.test(hash))
        throw new Error("Enter a 64-character transaction hash.");
      if (row.state === "confirmed")
        return reply({ board: publicBoard(board) });
      if (usdt) {
        if (
          row.state !== "pending" ||
          !row.reference ||
          !row.payer ||
          (row.hash && hash !== row.hash)
        )
          throw new Error("Hash does not match this installment.");
        const status = await verifyUsdtInstallment(
          polygonRequestRpc(),
          hash,
          row.payer,
          row.recipient,
          BigInt(row.amount),
          row.reference,
        );
        if (status === "failed") {
          undoRequestSplit(board, row);
          row.state = "open";
          delete row.hash;
          delete row.payer;
          delete row.reference;
          delete row.claim;
        } else if (status === "confirmed") {
          row.sender = row.payer;
          row.hash = hash;
          row.state = "confirmed";
          delete row.claim;
          delete row.splitRemainder;
        } else
          throw new Error(
            status === "pending"
              ? "Waiting for Polygon finality."
              : "Transfer does not match this installment.",
          );
      } else {
        const tx = await rpc(board.network, "getTransactionByHash", [hash]);
        row.sender = verifyBoardReceipt(tx, board, row, hash);
        const fee = (tx as { fee?: unknown }).fee;
        if (typeof fee === "number" && Number.isSafeInteger(fee) && fee >= 0)
          row.verifiedFee = fee;
        row.state = "confirmed";
        row.hash = hash;
        delete row.splitRemainder;
        delete row.claim;
      }
    } else throw new Error("Unknown action.");
    const result = await redis([
      "EVAL",
      "if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2],'KEEPTTL');return 1",
      1,
      key,
      raw,
      JSON.stringify(board),
    ]);
    if (result !== 1)
      return reply(
        { error: "The board changed. Refresh before continuing." },
        409,
      );
    return reply({ board: publicBoard(board), claim });
  } catch (e) {
    return reply(
      { error: e instanceof Error ? e.message : "Board unavailable." },
      400,
    );
  }
}
