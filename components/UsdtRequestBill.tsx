"use client";
import { useEffect, useRef, useState } from "react";
import type { Board, BoardRow } from "@/lib/boards";
import {
  formatUsdt,
  isEvmAddress,
  parseUsdt,
  requirePolygon,
  type EvmProvider,
} from "@/lib/polygon-usdt";
import { rememberRequest, requestTotals } from "@/lib/payment-requests";
import { previewUsdt, evmHash, usdtInboxNetwork } from "@/lib/usdt-request";
import Brand from "./Brand";

type Preview = {
  row: string;
  expected: number;
  units: bigint;
  balance: bigint;
  fee: bigint;
};
type Attempt = {
  claim: string;
  reference: string;
  hash?: string;
  unsent: boolean;
};
type Props = { board: Board; secret: string; update: (b: Board) => void };
function provider() {
  const wallet = (
    window as Window & {
      ethereum?: EvmProvider & {
        on?: (event: string, fn: () => void) => void;
        removeListener?: (event: string, fn: () => void) => void;
      };
    }
  ).ethereum;
  if (!wallet)
    throw new Error("Open this link in a compatible Polygon wallet browser.");
  return wallet;
}
function formatPol(wei: bigint) {
  const raw = wei.toString().padStart(19, "0");
  return [raw.slice(0, -18), raw.slice(-18).replace(/0+$/, "")]
    .filter(Boolean)
    .join(".");
}
export default function UsdtRequestBill({ board, secret, update }: Props) {
  const [account, setAccount] = useState(""),
    [amount, setAmount] = useState(""),
    [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [hash, setHash] = useState("");
  const locked = useRef(false);
  const totals = requestTotals(board);
  const pending = board.rows.find((r) => r.state === "pending");
  const open = board.rows.find((r) => r.state === "open");
  useEffect(() => {
    let wallet;
    try {
      wallet = provider();
    } catch {
      return;
    }
    const reset = () => {
      setAccount("");
      setPreview(null);
    };
    const events = ["accountsChanged", "chainChanged", "disconnect"];
    events.forEach((e) => wallet.on?.(e, reset));
    return () => events.forEach((e) => wallet.removeListener?.(e, reset));
  }, []);
  const key = (row: BoardRow) =>
    "quorail:usdt-request:" + board.id + ":" + row.id + ":" + row.reference;
  function attempt(row: BoardRow): Attempt | null {
    const value = JSON.parse(localStorage.getItem(key(row)) || "null");
    return value && value.reference === row.reference ? value : null;
  }
  async function action(action: string, extra: Record<string, unknown> = {}) {
    const response = await fetch("/api/board/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, secret, ...extra }),
      cache: "no-store",
      signal: AbortSignal.timeout(28000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Bill unavailable.");
    update(data.board);
    return data as { board: Board; claim: string };
  }
  async function run(work: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Wallet request interrupted. Check the bill and wallet history.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function connect() {
    const w = provider();
    await requirePolygon(w);
    const a = await w.request({ method: "eth_requestAccounts" });
    if (!Array.isArray(a) || typeof a[0] !== "string" || !isEvmAddress(a[0]))
      throw new Error("No Polygon account connected.");
    await requirePolygon(w);
    setAccount(a[0].toLowerCase());
    setPreview(null);
  }
  async function review(row: BoardRow) {
    setPreview(null);
    const units = amount.trim() ? parseUsdt(amount.trim()) : BigInt(row.amount);
    if (units > BigInt(row.amount))
      throw new Error("Installment exceeds the outstanding bill.");
    const q = await previewUsdt(
      provider(),
      account,
      row.recipient,
      units,
      "ff".repeat(32),
    );
    setPreview({
      row: row.id,
      expected: row.amount,
      units,
      balance: q.balance,
      fee: q.fee,
    });
  }
  async function pay(row: BoardRow) {
    const p = preview;
    setPreview(null);
    if (!p || p.row !== row.id || p.expected !== row.amount)
      throw new Error("Review the updated installment.");
    const w = provider();
    await rememberRequest(usdtInboxNetwork, account, secret);
    const hex = (bytes: Uint8Array) =>
      Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
    const claim = hex(crypto.getRandomValues(new Uint8Array(24)));
    const reference = hex(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode([board.id, row.id, claim].join(":")),
        ),
      ),
    );
    const claimed = { ...row, reference };
    const record: Attempt = { claim, reference, unsent: true };
    localStorage.setItem(key(claimed), JSON.stringify(record));
    await action("claim", {
      row: row.id,
      expected: row.amount,
      amount: Number(p.units),
      payer: account,
      claim,
    });
    let prompted = false;
    try {
      localStorage.setItem(key(claimed), JSON.stringify(record));
      const q = await previewUsdt(
        w,
        account,
        row.recipient,
        p.units,
        record.reference,
      );
      if (q.balance !== p.balance || q.fee > p.fee)
        throw new Error("Balance or estimated fee changed. Review again.");
      record.unsent = false;
      localStorage.setItem(key(claimed), JSON.stringify(record));
      prompted = true;
      const h = await w.request({
        method: "eth_sendTransaction",
        params: [q.tx],
      });
      if (typeof h !== "string" || !evmHash.test(h))
        throw new Error(
          "Wallet result unclear. Recover the transaction hash from wallet history.",
        );
      record.hash = h;
      setHash(h);
      localStorage.setItem(key(claimed), JSON.stringify(record));
      await action("submit", { row: row.id, claim: record.claim, hash: h });
      setMessage("Submitted. Waiting for Polygon confirmation.");
      setAmount("");
    } catch (e) {
      if (!prompted || (e as { code?: number })?.code === 4001) {
        record.unsent = true;
        try {
          localStorage.setItem(key(claimed), JSON.stringify(record));
        } catch {}
        await action("release", { row: row.id, claim: record.claim });
        localStorage.removeItem(key(claimed));
      }
      throw e;
    }
  }
  async function withPaymentLock(work: () => Promise<void>) {
    if (!navigator.locks)
      throw new Error("Use a wallet browser that supports payment locking.");
    await navigator.locks.request(
      "quorail:usdt-bill:" + board.id,
      { ifAvailable: true },
      async (lock) => {
        if (!lock)
          throw new Error(
            "This bill is already being reviewed in another tab.",
          );
        await work();
      },
    );
  }
  async function recover(row: BoardRow) {
    const saved = attempt(row);
    if (saved?.unsent && !row.hash && !hash.trim()) {
      await action("release", { row: row.id, claim: saved.claim });
      localStorage.removeItem(key(row));
      return;
    }
    const h = row.hash || hash.trim() || saved?.hash;
    if (!h || !evmHash.test(h))
      throw new Error(
        "Paste the Polygon transaction hash from wallet history.",
      );
    const result = await action("verify", { row: row.id, hash: h });
    localStorage.removeItem(key(row));
    setHash("");
    setMessage(
      result.board.rows.find((r) => r.id === row.id)?.state === "confirmed"
        ? "Installment confirmed."
        : "Transaction reverted. The unpaid amount is available again.",
    );
  }
  return (
    <>
      <header className="site-header">
        <Brand />
        <a
          href="/console/?tab=payments&asset=usdt"
          className="button small dark"
        >
          Payment inbox
        </a>
      </header>
      <main className="shared-page">
        <span className="eyebrow">USDT · Polygon PoS</span>
        <h1>{board.title}</h1>
        <div className="forecast-metrics">
          {(
            [
              ["Total requested", totals.total],
              ["Verified paid", totals.paid],
              ["Still outstanding", totals.remaining],
            ] as const
          ).map(([label, n]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{formatUsdt(BigInt(n))} USDT</strong>
            </div>
          ))}
        </div>
        <p>Due {board.rows[0].due}</p>
        <p className="recipient">
          Receiving address: {board.rows[0].recipient}
        </p>
        {!account ? (
          <button
            className="button outline"
            disabled={busy}
            onClick={() => run(connect)}
          >
            Connect Polygon wallet
          </button>
        ) : (
          <>
            <p className="recipient">Connected: {account}</p>
            <button
              className="button outline"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await rememberRequest(usdtInboxNetwork, account, secret);
                  setMessage("Saved to your USDT inbox.");
                })
              }
            >
              Save to inbox
            </button>
          </>
        )}
        {account && open && !pending && account !== open.recipient && (
          <section className="forecast-panel">
            <label>
              Installment in USDT
              <input
                inputMode="decimal"
                disabled={busy}
                placeholder={formatUsdt(BigInt(open.amount))}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setPreview(null);
                }}
              />
            </label>
            <button
              className="button outline"
              disabled={busy}
              onClick={() => run(() => review(open))}
            >
              Review installment
            </button>
            {preview?.row === open.id && preview.expected === open.amount && (
              <>
                <p>
                  Pay {formatUsdt(preview.units)} USDT ·{" "}
                  {formatUsdt(preview.balance - preview.units)} USDT left in
                  your wallet.
                </p>
                <p>
                  Estimated fee: {formatPol(preview.fee)} POL. Check the final
                  fee in your wallet.
                </p>
                <button
                  className="button dark"
                  disabled={busy}
                  onClick={() => run(() => withPaymentLock(() => pay(open)))}
                >
                  Approve in Polygon wallet
                </button>
              </>
            )}
          </section>
        )}
        {pending && (
          <section>
            <p>
              Installment awaiting verification:{" "}
              {formatUsdt(BigInt(pending.amount))} USDT
            </p>
            {!pending.hash && (
              <label>
                Recovery transaction hash
                <input
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="0x…"
                />
              </label>
            )}
            <button
              className="button outline"
              disabled={busy}
              onClick={() => run(() => withPaymentLock(() => recover(pending)))}
            >
              Check installment
            </button>
          </section>
        )}
        {board.rows
          .filter((r) => r.state === "confirmed")
          .map((r) => (
            <p key={r.id}>
              {formatUsdt(BigInt(r.amount))} USDT paid ·{" "}
              <a
                className="text-link"
                href={"https://polygonscan.com/tx/" + r.hash}
                target="_blank"
                rel="noreferrer"
              >
                View Polygon receipt
              </a>
            </p>
          ))}
        {message && <p role="status">{message}</p>}
      </main>
    </>
  );
}
