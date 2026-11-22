"use client";
import { useEffect, useRef, useState } from "react";
import {
  formatUsdt,
  isEvmAddress,
  parseUsdt,
  polygonBalance,
  requirePolygon,
  submitPolygonUsdt,
  verifyPolygonUsdt,
  type EvmProvider,
} from "@/lib/polygon-usdt";
import RequestInbox from "./RequestInbox";
import ScanRecipientQR from "./ScanRecipientQR";
type WalletWindow = Window & { ethereum?: EvmProvider };
const storageKey = "quorail-polygon-usdt-pending";
const hashPattern = /^0x[a-f0-9]{64}$/i;
type Attempt = {
  hash: string;
  from: string;
  to: string;
  units: bigint;
  terminal?: "confirmed" | "failed";
};
let volatileAttempt: Attempt | null = null;

function restoreAttempt(): Attempt | null {
  if (volatileAttempt) return volatileAttempt;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  const p = JSON.parse(raw);
  if (
    !p ||
    !(p.hash === "" || hashPattern.test(p.hash)) ||
    !isEvmAddress(p.from) ||
    !isEvmAddress(p.to) ||
    typeof p.units !== "string" ||
    !/^[1-9][0-9]{0,77}$/.test(p.units)
  )
    throw new Error(
      "Cannot read the previous Polygon payment. Check wallet history before sending.",
    );
  return {
    hash: p.hash,
    from: p.from,
    to: p.to,
    units: BigInt(p.units),
    terminal:
      p.hash && (p.terminal === "confirmed" || p.terminal === "failed")
        ? p.terminal
        : undefined,
  };
}
function persistAttempt(p: Attempt) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({ ...p, units: p.units.toString() }),
  );
}
export default function PolygonUsdt({inbox=false}:{inbox?:boolean}={}) {
  const [wallet, setWallet] = useState<EvmProvider | null>(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<{
    hash: string;
    from: string;
    to: string;
    units: bigint;
  } | null>(null);
  const [status, setStatus] = useState("");
  const [recovery, setRecovery] = useState("");
  const revision = useRef(0);
  useEffect(() => {
    const restore = () => {
      try {
        const saved = restoreAttempt();
        setPayment(saved);
        setStatus(saved?.terminal ?? (saved?.hash ? "pending" : "unverified"));
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Storage unavailable.");
      }
    };
    restore();
    const storage = (e: StorageEvent) => {
      if (e.key === storageKey) restore();
    };
    window.addEventListener("storage", storage);
    const provider = (window as WalletWindow).ethereum as
      | (EvmProvider & {
          on?: (event: string, fn: () => void) => void;
          removeListener?: (event: string, fn: () => void) => void;
        })
      | undefined;
    const reset = () => {
      revision.current++;
      setWallet(null);
      setAccount("");
      setBalance("");
      setMessage(
        "Wallet connection changed. Reconnect to check your Polygon account.",
      );
    };
    const events = ["accountsChanged", "chainChanged", "disconnect"];
    events.forEach((event) => provider?.on?.(event, reset));
    return () => {
      revision.current++;
      events.forEach((event) => provider?.removeListener?.(event, reset));
      window.removeEventListener("storage", storage);
    };
  }, []);
  async function connect() {
    setBusy(true);
    setMessage("");
    try {
      const provider = (window as WalletWindow).ethereum;
      if (!provider)
        throw new Error(
          "No compatible EVM wallet provider found in this browser or Nimiq Pay.",
        );
      try {
        await requirePolygon(provider);
      } catch {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x89" }],
          });
        } catch {
          throw new Error(
            "Polygon access was not approved or is unavailable in this wallet. Open Quorail in a compatible Polygon wallet.",
          );
        }
        await requirePolygon(provider);
      }
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      if (
        !Array.isArray(accounts) ||
        typeof accounts[0] !== "string" ||
        !isEvmAddress(accounts[0])
      )
        throw new Error("No Polygon account available.");
      const version = revision.current;
      const selected = accounts[0];
      const value = await polygonBalance(provider, selected);
      const active = await provider.request({ method: "eth_accounts" });
      await requirePolygon(provider);
      if (
        version !== revision.current ||
        !Array.isArray(active) ||
        active[0]?.toLowerCase() !== selected.toLowerCase()
      )
        throw new Error("Wallet changed. Reconnect to continue.");
      setWallet(provider);
      setAccount(selected);
      setBalance(formatUsdt(value));
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to connect Polygon wallet.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (!wallet || !account || payment) return;
    setBusy(true);
    setMessage("");
    try {
      if (!isEvmAddress(to))
        throw new Error(
          "Enter a Polygon 0x recipient address. .nim names cannot receive USDT without a verified Polygon mapping.",
        );
      const units = parseUsdt(amount);
      if (
        !window.confirm(
          `Send ${formatUsdt(units)} USDT on Polygon to ${to}? Verify the address in your wallet before approving.`,
        )
      )
        return;
      if (!navigator.locks)
        throw new Error(
          "This browser cannot securely lock a payment. Use an updated wallet browser.",
        );
      const version = revision.current;
      await navigator.locks.request(
        storageKey,
        { ifAvailable: true },
        async (lock) => {
          if (!lock)
            throw new Error("Another window is processing a USDT payment.");
          const saved = restoreAttempt();
          if (saved) {
            setPayment(saved);
            setStatus(
              saved.terminal ?? (saved.hash ? "pending" : "unverified"),
            );
            throw new Error("Review your previous USDT payment first.");
          }
          let submitted = false;
          const attempt = { hash: "", from: account, to, units };
          try {
            const result = await submitPolygonUsdt(
              wallet,
              account,
              to,
              amount,
              () => {
                if (version !== revision.current)
                  throw new Error("Wallet changed. Review this payment again.");
                persistAttempt(attempt);
                submitted = true;
                setPayment(attempt);
                setStatus("awaiting approval");
              },
            );
            const pending = { ...attempt, hash: result.hash };
            volatileAttempt = pending;
            setPayment(pending);
            setStatus("pending");
            try {
              persistAttempt(pending);
              volatileAttempt = null;
            } catch {
              setMessage(
                "Submitted. Save this transaction hash before closing: " +
                  pending.hash,
              );
              return;
            }
            setMessage(
              "Transaction submitted. Verify its receipt before sending another payment.",
            );
          } catch (error) {
            if (!submitted) throw error;
            if ((error as { code?: number })?.code === 4001) {
              localStorage.removeItem(storageKey);
              setPayment(null);
              setStatus("");
              setMessage("Wallet approval cancelled.");
            } else {
              setStatus("unverified");
              setMessage(
                "Check wallet history for the transaction hash before attempting another payment.",
              );
            }
          }
        },
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payment was not completed.");
    } finally {
      setBusy(false);
    }
  }
  async function check() {
    if (!wallet || !payment) return;
    setBusy(true);
    setMessage("");
    const version = revision.current;
    try {
      const hash = payment.hash || recovery.trim();
      if (!hashPattern.test(hash))
        throw new Error("Enter the transaction hash from your wallet history.");
      const next = await verifyPolygonUsdt(
        wallet,
        hash,
        payment.from,
        payment.to,
        payment.units,
      );
      if (version !== revision.current) return;
      setStatus(next);
      if (next === "confirmed" || next === "failed") {
        const recovered = { ...payment, hash, terminal: next };
        setPayment(recovered);
        volatileAttempt = recovered;
        try {
          persistAttempt(recovered);
          volatileAttempt = null;
        } catch {
          /* Keep the recovered hash in memory. */
        }
      }
      if (next === "confirmed") {
        const value = await polygonBalance(wallet, account).catch(() => null);
        if (version === revision.current)
          setBalance(value === null ? "" : formatUsdt(value));
        window.dispatchEvent(new Event("quorail:usdt-confirmed"));
      }
      setMessage(
        next === "confirmed"
          ? `Payment successful: ${formatUsdt(payment.units)} USDT confirmed on Polygon. Recipient: ${payment.to.slice(0, 8)}…${payment.to.slice(-6)}. Transaction: ${hash}.`
          : next === "pending"
            ? "Still pending. Check again shortly."
            : next === "failed"
              ? "Transaction failed on chain."
              : "Transaction details did not match. Inspect PolygonScan before proceeding.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Verification unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
    {inbox && wallet && account && <RequestInbox key={account} wallet={wallet} address={account}/>}
    <section className="q-usdt" aria-label="Polygon USDT payments">
      <div className="q-usdt-header">
        <div>
          <div className="q-usdt-title">Send USDT</div>
          <div className="q-usdt-subtitle">
            A second way to pay, alongside NIM
          </div>
        </div>
        <span className="q-usdt-tag">USDT · Polygon</span>
      </div>
      {!account ? (
        <>
          <p className="q-usdt-note">
            Connect a compatible Polygon wallet. Quorail will request network
            access when supported. Your wallet must approve every transfer.
          </p>
          <div className="q-usdt-actions">
            <button className="button" disabled={busy} onClick={connect}>
              {busy ? "Connecting…" : "Connect USDT wallet"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="q-usdt-grid">
            <div>
              <span className="q-usdt-subtitle">Available USDT</span>
              <h3>{balance || "…"} USDT</h3>
            </div>
            <div>
              <span className="q-usdt-subtitle">Sending from</span>
              <p style={{ overflowWrap: "anywhere", fontSize: 13 }}>
                {account.slice(0, 8)}…{account.slice(-6)}
              </p>
            </div>
          </div>
          {!payment ? (
            <>
              <label>
                Recipient Polygon address
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value.trim())}
                  placeholder="0x…"
                  autoComplete="off"
                />
              </label>
              <ScanRecipientQR network="USDT" onRecipient={setTo} />
              <label>
                Amount in USDT
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.trim())}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>
              <p className="q-usdt-note">
                USDT uses a Polygon 0x address, not a Nimiq NQ address or .nim
                name. Review the recipient in your wallet before approval.
                Network fees depend on wallet support.
              </p>
              <div className="q-usdt-actions">
                <button
                  className="button"
                  disabled={busy || !isEvmAddress(to) || !amount}
                  onClick={send}
                >
                  Review USDT payment
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="q-usdt-note">
                Transaction: {status}.{" "}
                {payment.hash && (
                  <a
                    href={`https://polygonscan.com/tx/${payment.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on PolygonScan
                  </a>
                )}
              </p>
              {!payment.hash && (
                <label>
                  Transaction hash from wallet history
                  <input
                    value={recovery}
                    onChange={(e) => setRecovery(e.target.value)}
                    placeholder="0x…"
                  />
                </label>
              )}
              <div className="q-usdt-actions">
                <button
                  className="button"
                  disabled={
                    busy || account.toLowerCase() !== payment.from.toLowerCase()
                  }
                  onClick={check}
                >
                  Verify transaction
                </button>
                {(status === "confirmed" || status === "failed") && (
                  <button
                    className="button outline"
                    onClick={() => {
                      try {
                        const current = restoreAttempt();
                        if (
                          current &&
                          (current.hash !== payment.hash ||
                            current.from !== payment.from ||
                            current.to !== payment.to ||
                            current.units !== payment.units)
                        ) {
                          setPayment(current);
                          setStatus(
                            current.terminal ??
                              (current.hash ? "pending" : "unverified"),
                          );
                          return;
                        }
                        localStorage.removeItem(storageKey);
                      } catch {
                        setMessage(
                          "Payment history could not be cleared. Retry when browser storage is available.",
                        );
                        return;
                      }
                      volatileAttempt = null;
                      setRecovery("");
                      setMessage("");
                      setPayment(null);
                      setStatus("");
                      setAmount("");
                    }}
                  >
                    New payment
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
      {message && (
        <p className="q-usdt-message" role="status">
          {message}
        </p>
      )}
    </section></>
  );
}
