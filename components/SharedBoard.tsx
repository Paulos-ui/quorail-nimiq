"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Brand from "./Brand";
import { type Board, type BoardRow, boardMemo } from "@/lib/boards";
import {
  connectWallet,
  checkNetwork,
  cancelled,
  errorMessage,
  explorerUrl,
  type Provider,
} from "@/lib/wallet";
import { nim, normalAddress, forecast, type Payment } from "@/lib/finance";
import { loadPlan, savePlan, storageKey } from "@/lib/storage";
export default function SharedBoard() {
  const [secret, setSecret] = useState(""),
    [board, setBoard] = useState<Board | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [address, setAddress] = useState(""),
    [accounts, setAccounts] = useState<string[]>([]),
    [ack, setAck] = useState(false),
    [hashes, setHashes] = useState<Record<string, string>>({}),
    [saved, setSaved] = useState<{ url: string; title: string }[]>([]);
  const host = useRef<Provider | null>(null),
    busyRef = useRef(false);
  async function api(
    action: string,
    extra: Record<string, unknown> = {},
    token = secret,
  ) {
    const r = await fetch("/api/board/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, secret: token, ...extra }),
      signal: AbortSignal.timeout(25000),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Board unavailable");
    return d;
  }
  useEffect(() => {
    const token = location.hash.slice(1);
    setSecret(token);
    try {
      setSaved(JSON.parse(localStorage.getItem("quorail:boards") || "[]"));
    } catch {}
    if (token)
      api("read", {}, token)
        .then((d) => setBoard(d.board))
        .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!secret) return;
    const timer = setInterval(async () => {
      if (busyRef.current || document.visibilityState !== "visible") return;
      busyRef.current = true;
      try {
        const d = await api("read");
        setBoard(d.board);
        const p = (d.board as Board).rows.find(
          (r) => r.state === "pending" && r.hash,
        );
        if (p) {
          const verified = await api("verify", { row: p.id });
          setBoard(verified.board);
        }
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        busyRef.current = false;
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [secret]);
  async function connect() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const w = await connectWallet();
      if (board && w.network !== board.network)
        throw new Error(
          `This board uses ${board.network}. Switch the wallet network first.`,
        );
      host.current = w.provider;
      setAccounts(w.accounts);
      setAddress(w.accounts[0]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function pay(row: BoardRow) {
    if (!board || !host.current || !address || !ack || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (!navigator.locks)
        throw new Error("Update Nimiq Pay to use secure payment locking.");
      const key = storageKey(board.network, address),
        provider = host.current;
      await navigator.locks.request(
        key,
        { ifAvailable: true },
        async (lock) => {
          if (!lock) throw new Error("Another payment is being processed.");
          checkNetwork(board.network);
          if (!(await provider.isConsensusEstablished()))
            throw new Error("Wallet is syncing.");
          const latest = loadPlan(key),
            existing = latest.payments.find(
              (p) => p.id === (row.sourceId || `board:${board.id}:${row.id}`),
            );
          if (
            latest.payments.some((p) =>
              ["pending", "submitting", "uncertain", "mismatch"].includes(
                p.status,
              ),
            )
          )
            throw new Error(
              "Resolve pending payments in your private plan first.",
            );
          if (
            existing &&
            (existing.status !== "planned" ||
              existing.amount !== row.amount ||
              normalAddress(existing.recipient) !==
                normalAddress(row.recipient))
          )
            throw new Error(
              "This shared commitment differs from, or was already paid in, your private plan.",
            );
          const payment: Payment = existing || {
            id: `board:${board.id}:${row.id}`,
            title: row.title,
            recipient: row.recipient,
            amount: row.amount,
            fee: 0,
            due: row.due,
            status: "planned",
            priority: "normal",
            created: new Date().toISOString(),
          };
          if (normalAddress(address) === normalAddress(row.recipient))
            throw new Error("Choose an account other than the recipient.");
          const balance = await provider.getBalance(address);
          if (
            !Number.isSafeInteger(balance) ||
            balance < 0 ||
            forecast(balance, latest, payment).shortfall > 0
          )
            throw new Error(
              "This payment exceeds your recorded commitments or reserve. Review your private plan first.",
            );
          const claimed = await api("claim", { row: row.id });
          setBoard(claimed.board);
          const pendingPlan = {
            ...latest,
            payments: [
              ...latest.payments.filter((p) => p.id !== payment.id),
              { ...payment, status: "submitting" as const },
            ],
          };
          try {
            savePlan(key, pendingPlan);
          } catch {
            await api("release", { row: row.id, claim: claimed.claim });
            throw new Error("Local backup failed. No payment sent.");
          }
          let hash: string;
          try {
            hash = await provider.sendBasicTransactionWithData({
              recipient: row.recipient,
              value: row.amount,
              fee: payment.fee,
              data: boardMemo(board.id, row.id),
            });
          } catch (e) {
            const status = cancelled(e) ? "planned" : "uncertain";
            savePlan(key, {
              ...pendingPlan,
              payments: pendingPlan.payments.map((p) =>
                p.id === payment.id ? { ...p, status } : p,
              ),
            });
            if (cancelled(e)) {
              const released = await api("release", {
                row: row.id,
                claim: claimed.claim,
              });
              setBoard(released.board);
            }
            throw e;
          }
          if (!/^[a-f0-9]{64}$/i.test(hash))
            throw new Error(
              "Wallet result unclear. Recover the hash from wallet history; do not resend.",
            );
          setHashes((h) => ({ ...h, [row.id]: hash }));
          savePlan(key, {
            ...pendingPlan,
            payments: pendingPlan.payments.map((p) =>
              p.id === payment.id ? { ...p, status: "pending", hash } : p,
            ),
          });
          const submitted = await api("submit", {
            row: row.id,
            hash,
            claim: claimed.claim,
          });
          setBoard(submitted.board);
          setError(
            "Payment pending. The board checks the receipt while this page is open. Your private plan also retains the payment.",
          );
        },
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function verify(row: BoardRow) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const d = await api("verify", {
        row: row.id,
        hash: hashes[row.id] || row.hash,
      });
      setBoard(d.board);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  const total = board?.rows.reduce((s, r) => s + r.amount, 0) || 0,
    paid =
      board?.rows
        .filter((r) => r.state === "confirmed")
        .reduce((s, r) => s + r.amount, 0) || 0;
  return (
    <>
      <header className="site-header">
        <Brand />
        <Link href="/console/" className="button small dark">
          Private planner ↗
        </Link>
      </header>
      <main className="shared-page">
        <span className="eyebrow">QUORAIL / SHARED PAYMENT BOARD</span>
        <h1>{board?.title || "A plan you can share."}</h1>
        {error && (
          <p role="status" className="form-message">
            {error}
          </p>
        )}
        {!secret && (
          <>
            <p>
              Open an invite link, or create a board from your payment planner.
              Links saved on this device:
            </p>
            {saved.map((s) => (
              <p key={s.url}>
                <a className="text-link" href={s.url}>
                  {s.title} ↗
                </a>
              </p>
            ))}
          </>
        )}
        {board && (
          <>
            <p>
              {board.kind === "collection"
                ? "Collect contributions into the requester’s wallet. This does not pay the original outgoing bill."
                : "A shared snapshot with live payment receipts. Each payer approves their own transaction."}
            </p>
            <div className="forecast-metrics">
              <div>
                <span>Total requested</span>
                <strong>{nim(total)} NIM</strong>
              </div>
              <div>
                <span>Verified paid</span>
                <strong>{nim(paid)} NIM</strong>
              </div>
              <div>
                <span>Still outstanding</span>
                <strong>{nim(total - paid)} NIM</strong>
              </div>
            </div>
            <p className="helper">
              {board.network.toUpperCase()} ·{" "}
              {paid === total
                ? "Fully paid"
                : paid > 0
                  ? "Partially paid"
                  : "Awaiting payments"}{" "}
              · Link expires {new Date(board.expires).toLocaleDateString()}.
              Anyone with this link can view and initiate payments. Names are
              labels, not verified identities. Payment references are public
              on-chain.
            </p>
            {!address ? (
              <button className="button dark" disabled={busy} onClick={connect}>
                Connect Nimiq Pay
              </button>
            ) : (
              <>
                <label>
                  Planning account
                  <select
                    disabled={busy}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setAck(false);
                    }}
                  >
                    {accounts.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                  />
                  I will verify the recipient, amount and sending account in
                  Nimiq Pay. The wallet chooses the actual signer.
                </label>
              </>
            )}
            <div className="shared-rows">
              {board.rows.map((row) => (
                <article key={row.id}>
                  <div className="section-heading">
                    <h2>{row.title}</h2>
                    <span className={`badge ${row.state}`}>
                      {row.state === "confirmed"
                        ? "Paid · confirmed"
                        : row.state}
                    </span>
                  </div>
                  <p>
                    {row.responsible} · Due {row.due}
                  </p>
                  <strong>{nim(row.amount)} NIM</strong>
                  <p className="recipient">Recipient: {row.recipient}</p>
                  {row.sender && (
                    <p className="recipient">Verified sender: {row.sender}</p>
                  )}
                  <small>Reference: {boardMemo(board.id, row.id)}</small>
                  {row.state === "open" && (
                    <button
                      className="button dark"
                      disabled={busy || !address || !ack}
                      onClick={() => pay(row)}
                    >
                      Pay this share in Nimiq Pay
                    </button>
                  )}
                  {row.hash && (
                    <a
                      className="text-link"
                      target="_blank"
                      rel="noreferrer"
                      href={explorerUrl(board.network, row.hash)}
                    >
                      View receipt ↗
                    </a>
                  )}
                  {row.state !== "confirmed" && (
                    <details>
                      <summary>Check or recover receipt</summary>
                      <p>
                        A pending attempt is locked to prevent duplicates. If
                        approval was interrupted, inspect wallet history. Do not
                        resend.
                      </p>
                      <label>
                        Transaction hash
                        <input
                          value={hashes[row.id] || row.hash || ""}
                          maxLength={64}
                          onChange={(e) =>
                            setHashes({
                              ...hashes,
                              [row.id]: e.target.value.trim(),
                            })
                          }
                        />
                      </label>
                      <button
                        className="button outline"
                        disabled={busy}
                        onClick={() => verify(row)}
                      >
                        Verify receipt
                      </button>
                    </details>
                  )}
                </article>
              ))}
            </div>
            <p className="helper">
              This board is not escrow. Quorail never holds funds. Check the
              recipient with the requester before paying. Return to your private
              plan to reconcile its stored receipt.
            </p>
          </>
        )}
      </main>
    </>
  );
}
