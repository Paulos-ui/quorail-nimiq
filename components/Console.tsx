"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  LayoutDashboard,
  ListChecks,
  History,
  Settings2,
  Wallet,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Download,
  X,
  Check,
  AlertTriangle,
  ArrowDownLeft,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import Brand from "./Brand";
import ForecastPanel from "./ForecastPanel";
import { decryptBackup } from "@/lib/secure-backup";
import BackupCard from "./BackupCard";
import RiskReview from "./RiskReview";
import ConnectionNotice from "./ConnectionNotice";
import { receiptCsv } from "@/lib/release-tools";
import DecisionAid from "./DecisionAid";
import {
  exampleScenario,
  scenarioLabels,
  type Scenario,
} from "@/lib/scenarios";
import ReserveIndicator from "./ReserveIndicator";
import AssistantPanel from "./AssistantPanel";
import SharePlan from "./SharePlan";
import {
  LUNA,
  nim,
  parseNim,
  validAddress,
  normalAddress,
  dateAfter,
  forecast,
  settlePayment,
  emptyPlan,
  validatePlan,
  type Plan,
  type Payment,
} from "@/lib/finance";
import {
  connectWallet,
  checkNetwork,
  errorMessage,
  cancelled,
  explorerUrl,
  openWalletUrl,
  type Provider,
  type Network,
} from "@/lib/wallet";
import { storageKey, loadPlan, savePlan, downloadPlan } from "@/lib/storage";
import { rpc } from "@/lib/rpc";
import { verifyReceipt } from "@/lib/receipt";

type Tab = "Overview" | "Payments" | "Activity";
const icons = {
  Overview: LayoutDashboard,
  Payments: ListChecks,
  Activity: History,
};
const short = (a: string) =>
  a.length > 20 ? `${a.slice(0, 9)}…${a.slice(-4)}` : a;
export default function Console() {
  const [importPassword, setImportPassword] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const planRef = useRef(plan);
  const [demo, setDemo] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("freelancer");
  const [address, setAddress] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [network, setNetwork] = useState<Network>("mainnet");
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const provider = useRef<Provider | null>(null);
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"add" | "settings" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [reserveInvalid, setReserveInvalid] = useState(false);
  const [recovery, setRecovery] = useState("");
  const [walletLink, setWalletLink] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const edited = plan.payments.find((p) => p.id === editing);
  const key = address ? storageKey(network, address) : "";
  const ready = demo || !!address;
  const payment = plan.payments.find((p) => p.id === selected);
  const total = forecast(balance ?? 0, plan);
  const impact = payment ? forecast(balance ?? 0, plan, payment) : null;
  const unresolved = plan.payments.some((p) =>
    ["submitting", "pending", "uncertain", "mismatch"].includes(p.status),
  );
  useEffect(() => {
    setWalletLink(openWalletUrl());
    const params = new URLSearchParams(location.search);
    if (params.get("demo") === "1") {
      const s = params.get("scenario");
      startDemo(s === "team" || s === "personal" ? s : "freelancer");
    }
  }, []);
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);
  useEffect(() => {
    setAck(false);
    setReserveInvalid(false);
    setRecovery("");
  }, [selected]);
  useEffect(() => {
    if (!key || demo) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const next = loadPlan(key);
          planRef.current = next;
          setPlan(next);
        } catch {
          setStorageError(true);
          setMessage(
            "Saved data changed or is unreadable. Export your records before reconnecting.",
          );
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, demo]);
  useEffect(() => {
    if (!modal && !selected) return;
    const prior = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busyRef.current) {
        setModal(null);
        setSelected(null);
      }
      if (e.key === "Tab") {
        const els = focusable();
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", onKey);
      prior?.focus();
    };
  }, [modal, selected]);
  function update(next: Plan, attemptUpdate = false) {
    if (!demo) {
      if (!key) throw new Error("Connect your wallet first.");
      const current = loadPlan(key);
      if (!attemptUpdate) {
        const protectedRecords = current.payments.filter(
          (p) => p.status !== "planned",
        );
        const ids = new Set(protectedRecords.map((p) => p.id));
        next = {
          ...next,
          payments: [
            ...next.payments.filter((p) => !ids.has(p.id)),
            ...protectedRecords,
          ],
        };
      }
      savePlan(key, next);
    }
    planRef.current = next;
    setPlan(next);
  }
  function startDemo(name: Scenario = "freelancer") {
    const sample = exampleScenario(name);
    setScenario(name);
    setSelected(null);
    provider.current = null;
    setAddress("");
    setAccounts([]);
    setDemo(true);
    setBalance(sample.balance);
    const p = sample.plan;
    setPlan(p);
    planRef.current = p;
    setMessage(
      "Example workspace. These are illustrative amounts. No payments can be sent.",
    );
    setStorageError(false);
  }
  async function connect() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      const w = await connectWallet();
      provider.current = w.provider;
      setAccounts(w.accounts);
      setNetwork(w.network);
      await chooseAccount(w.accounts[0], w.network, w.provider);
      setDemo(false);
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function chooseAccount(a: string, n = network, p = provider.current) {
    if (!p) return;
    const b = await p.getBalance(a);
    if (!Number.isSafeInteger(b) || b < 0)
      throw new Error("Wallet returned an invalid balance.");
    const k = storageKey(n, a);
    let saved: Plan;
    try {
      saved = loadPlan(k);
      savePlan(k, saved);
    } catch {
      setStorageError(true);
      throw new Error(
        "Local storage is unavailable or the saved plan is damaged. Do not send payments from this browser until this is resolved.",
      );
    }
    setStorageError(false);
    setAddress(a);
    setBalance(b);
    setPlan(saved);
    planRef.current = saved;
    setSelected(null);
    setMessage(
      "Wallet connected. Confirm the same sending account in the native payment dialog.",
    );
  }
  function disconnect() {
    if (busyRef.current) return;
    provider.current?.disconnect();
    provider.current = null;
    setAddress("");
    setAccounts([]);
    setBalance(null);
    setDemo(false);
    setPlan(emptyPlan());
    setSelected(null);
    setMessage("Disconnected. Your saved plan stays on this device.");
  }
  async function refresh() {
    if (demo) {
      setMessage(
        "This is an example balance. Connect your wallet for live data.",
      );
      return;
    }
    if (!provider.current || busyRef.current) return;
    setBusy(true);
    busyRef.current = true;
    try {
      checkNetwork(network);
      const b = await provider.current.getBalance(address);
      if (!Number.isSafeInteger(b) || b < 0)
        throw new Error("Invalid balance response.");
      setBalance(b);
      setMessage("Balance refreshed from Nimiq Pay.");
    } catch (e) {
      setBalance(null);
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function send() {
    if (!navigator.onLine) {
      setMessage("Reconnect before sending a payment.");
      return;
    }
    if (
      !payment ||
      demo ||
      !provider.current ||
      busyRef.current ||
      !ack ||
      storageError
    )
      return;
    const p = payment,
      host = provider.current;
    setBusy(true);
    busyRef.current = true;
    setMessage("");
    try {
      if (!navigator.locks)
        throw new Error(
          "Update your wallet WebView. Secure payment locking is unavailable on this device.",
        );
      await navigator.locks.request(
        key,
        { ifAvailable: true },
        async (lock) => {
          if (!lock)
            throw new Error(
              "Another Quorail window is processing this wallet.",
            );
          checkNetwork(network);
          const latest = loadPlan(key);
          const target = latest.payments.find((x) => x.id === p.id);
          if (!target || target.status !== "planned")
            throw new Error(
              "This payment has already been attempted. Check Activity.",
            );
          if (
            latest.payments.some((x) =>
              ["submitting", "pending", "uncertain", "mismatch"].includes(
                x.status,
              ),
            )
          )
            throw new Error(
              "Resolve the existing payment in Activity before sending another.",
            );
          if (!(await host.isConsensusEstablished()))
            throw new Error("Wallet is syncing. Wait for network consensus.");
          const b = await host.getBalance(address);
          if (!Number.isSafeInteger(b) || b < 0)
            throw new Error("Invalid balance response.");
          setBalance(b);
          if (b < target.amount + target.fee)
            throw new Error("Insufficient NIM for the payment and fee.");
          const fresh = forecast(b, latest, target);
          if (fresh.shortfall > 0)
            throw new Error(
              "This payment would cross your reserve target. Adjust the payment or your plan first.",
            );
          const claimed = {
            ...latest,
            payments: latest.payments.map((x) =>
              x.id === p.id ? { ...x, status: "submitting" as const } : x,
            ),
          };
          update(claimed, true);
          let hash: string;
          try {
            hash = await host.sendBasicTransaction({
              recipient: target.recipient,
              value: target.amount,
              fee: target.fee,
            });
          } catch (e) {
            const next = {
              ...claimed,
              payments: claimed.payments.map((x) =>
                x.id === p.id
                  ? {
                      ...x,
                      status: cancelled(e)
                        ? ("planned" as const)
                        : ("uncertain" as const),
                      note: errorMessage(e),
                    }
                  : x,
              ),
            };
            update(next, true);
            throw e;
          }
          if (!/^[a-f0-9]{64}$/i.test(hash)) {
            update(
              {
                ...claimed,
                payments: claimed.payments.map((x) =>
                  x.id === p.id ? { ...x, status: "uncertain" as const } : x,
                ),
              },
              true,
            );
            throw new Error(
              "The wallet returned an unexpected result. Check wallet history before doing anything else.",
            );
          }
          let latestAfter = claimed;
          try {
            latestAfter = loadPlan(key);
          } catch {}
          const submitted = {
            ...latestAfter,
            payments: latestAfter.payments.map((x) =>
              x.id === p.id ? { ...x, status: "pending" as const, hash } : x,
            ),
          };
          // Keep the hash in UI memory even if storage fails after broadcast. Never resend.
          planRef.current = submitted;
          setPlan(submitted);
          try {
            savePlan(key, submitted);
          } catch {
            setStorageError(true);
            setMessage(
              `Payment submitted but storage failed. Export your plan now. Transaction: ${hash}`,
            );
            return;
          }
          setMessage(
            "Payment pending. Quorail checks its receipt every 12 seconds while this page is visible. Approval alone does not confirm payment.",
          );
          setTab("Activity");
          setSelected(null);
        },
      );
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function checkReceipt(p: Payment, hash = p.hash) {
    if (!hash || busyRef.current) return;
    setBusy(true);
    busyRef.current = true;
    try {
      if (!/^[a-f0-9]{64}$/i.test(hash))
        throw new Error(
          "Enter the 64-character transaction hash from your wallet history.",
        );
      checkNetwork(network);
      const raw = await rpc(network, "getTransactionByHash", [hash]);
      const result = verifyReceipt(raw, { ...p, hash }, address, network);
      const latest = demo ? planRef.current : loadPlan(key);
      const next = settlePayment(latest, p.id, {
        hash,
        status: result.status,
        sender: result.sender,
        fee: result.fee ?? p.fee,
        confirmedAt:
          result.status === "confirmed" ? new Date().toISOString() : undefined,
      });
      update(next, true);
      if (result.status === "confirmed" && provider.current) {
        try {
          setBalance(await provider.current.getBalance(address));
        } catch {
          setBalance(null);
        }
      }
      setMessage(
        result.status === "confirmed"
          ? "Payment confirmed on chain. Recipient, amount, network and sender match."
          : result.status === "mismatch"
            ? "Receipt does not match this plan. Inspect the transaction in the explorer. Sending stays paused."
            : result.status === "failed"
              ? "The transaction was included but execution failed. Inspect the receipt before planning another payment."
              : "No successful inclusion verified yet. Wait and check again.",
      );
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  useEffect(() => {
    if (demo || !address || storageError) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible" || busyRef.current) return;
      const pending = planRef.current.payments.find(
        (p) => p.status === "pending" && p.hash,
      );
      if (pending) void checkReceipt(pending);
    }, 12000);
    return () => clearInterval(timer);
  }, [demo, address, network, storageError]);
  function addPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const d = new FormData(e.currentTarget);
      const amount = parseNim(String(d.get("amount"))),
        fee = parseNim(String(d.get("fee")));
      const recipient = String(d.get("recipient")).trim();
      if (!validAddress(recipient))
        throw new Error("Enter a valid Nimiq address, including its checksum.");
      if (amount <= 0)
        throw new Error("Payment amount must be greater than zero.");
      if (normalAddress(recipient) === normalAddress(address))
        throw new Error("Use a recipient other than your planning account.");
      const p: Payment = {
        id: editing || crypto.randomUUID(),
        title: String(d.get("title")).trim(),
        recipient,
        amount,
        fee,
        due: String(d.get("due")),
        priority: d.get("priority") as Payment["priority"],
        recurrence:
          d.get("recurrence") === "once"
            ? undefined
            : (d.get("recurrence") as Payment["recurrence"]),
        anchorDay: Number(String(d.get("due")).slice(-2)),
        seriesId: edited?.seriesId,
        status: "planned",
        created: new Date().toISOString(),
      };
      const next = validatePlan({
        ...planRef.current,
        payments: editing
          ? planRef.current.payments.map((x) => (x.id === editing ? p : x))
          : [...planRef.current.payments, p],
      });
      update(next);
      setModal(null);
      setSelected(p.id);
      setEditing(null);
      setMessage(editing ? "Payment updated." : "Payment added to your plan.");
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  function settings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const d = new FormData(e.currentTarget);
      update(
        validatePlan({
          ...planRef.current,
          reserve: parseNim(String(d.get("reserve"))),
          horizon: Number(d.get("horizon")),
        }),
      );
      setModal(null);
      setMessage("Planning preferences saved.");
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  function remove(p: Payment) {
    try {
      if (p.status !== "planned")
        throw new Error("Attempted payments are retained for reconciliation.");
      update({
        ...planRef.current,
        payments: planRef.current.payments.filter((x) => x.id !== p.id),
      });
      setSelected(null);
      setMessage("Planned payment removed.");
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 750000) throw new Error("Plan file is too large.");
      let data = JSON.parse(await file.text());
      if (data?.format === "quorail-encrypted") {
        if (!importPassword)
          throw new Error(
            "Enter your backup password in Planning settings, then select the file again.",
          );
        data = await decryptBackup(data, importPassword);
        setImportPassword("");
      }
      if (
        data.network !== network ||
        normalAddress(data.address) !== normalAddress(address)
      )
        throw new Error(
          "This backup belongs to a different wallet or network.",
        );
      const incoming = validatePlan(data.plan);
      const current = planRef.current;
      const ids = new Set(current.payments.map((p) => p.id));
      const extra = incoming.payments
        .filter((p) => !ids.has(p.id))
        .map((p) => ({
          ...p,
          status:
            p.status === "planned"
              ? ("planned" as const)
              : ("uncertain" as const),
        }));
      update(
        validatePlan({ ...current, payments: [...current.payments, ...extra] }),
      );
      setMessage(
        "New records imported. Existing records were preserved. Imported payment attempts require receipt verification.",
      );
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-label">YOUR PAYMENT PERSPECTIVE</div>
        <nav>
          {(["Overview", "Payments", "Activity"] as Tab[]).map((t) => {
            const Icon = icons[t];
            return (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => {
                  setTab(t);
                  setSelected(null);
                }}
              >
                <Icon size={19} />
                {t}
                {t === "Payments" && (
                  <span>
                    {plan.payments.filter((p) => p.status === "planned").length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <Link href="/play/" className="button outline">
          Play room ↗
        </Link>
        <Link className="button outline" href="/shared/">
          Shared boards ↗
        </Link>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-star">✳</span>
            <p>
              A little clarity.
              <br />A better next move.
            </p>
          </div>
          <Link href="/docs/">
            Field guide <ArrowUpRight size={15} />
          </Link>
          <span className="powered">
            <i /> BUILT FOR NIMIQ PAY
          </span>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div>
            <span className="breadcrumb">Workspace /</span> {tab}
          </div>
          <div className="header-actions">
            {demo ? (
              <span className="pill demo-pill">Example mode</span>
            ) : address ? (
              <span className="pill">
                <i />
                {network}
              </span>
            ) : (
              <span className="pill">Wallet not connected</span>
            )}
            {ready && (
              <button
                className="icon-button"
                aria-label="Planning settings"
                onClick={() => setModal("settings")}
              >
                <Settings2 size={19} />
              </button>
            )}
            {address ? (
              <button
                className="button small outline"
                disabled={busy}
                onClick={disconnect}
              >
                <LogOut size={15} />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                className="button small dark"
                disabled={busy}
                onClick={connect}
              >
                <Wallet size={16} />
                {busy ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </header>
        <main className="workspace">
          <div className="workspace-title">
            <div>
              <span className="eyebrow">
                {tab === "Overview"
                  ? "YOUR MONEY, WITH CONTEXT"
                  : tab === "Payments"
                    ? "EVERY COMMITMENT IN VIEW"
                    : "FOLLOW THE EVIDENCE"}
              </span>
              <h1>
                {tab === "Overview"
                  ? "A clearer next move."
                  : tab === "Payments"
                    ? "The plan ahead."
                    : "Every move, recorded."}
              </h1>
              <p>
                {tab === "Overview"
                  ? "See what is yours to use, and what already has a purpose."
                  : tab === "Payments"
                    ? "Give each payment a place. Preview its impact before sending."
                    : "Submitted is not the same as confirmed. Check the chain."}
              </p>
            </div>
            {ready && (
              <button
                className="button dark"
                onClick={() => {
                  setEditing(null);
                  setModal("add");
                }}
                disabled={busy || storageError}
              >
                <Plus size={18} />
                Add payment
              </button>
            )}
          </div>
          {message && (
            <div className="notice" role="status">
              <span>{message}</span>
              <button
                aria-label="Dismiss notice"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!ready ? (
            <section className="connect-panel">
              <div className="connect-art">
                <span className="large-glyph">Q</span>
                <span className="orbit-ring" />
              </div>
              <div>
                <span className="eyebrow">START WITH YOUR WALLET</span>
                <h2>
                  Know what comes
                  <br />
                  <em>after the payment.</em>
                </h2>
                <p>
                  Connect inside Nimiq Pay to read your balance and start a
                  private plan on this device. You approve every payment in your
                  wallet.
                </p>
                <div className="row wrap">
                  <button
                    className="button dark"
                    onClick={connect}
                    disabled={busy}
                  >
                    <Wallet size={18} />
                    Connect Nimiq Pay
                  </button>
                  <button
                    className="button outline"
                    onClick={() => startDemo()}
                    disabled={busy}
                  >
                    Explore example <ArrowRight size={16} />
                  </button>
                </div>
                <a className="text-link" href={walletLink || "#"}>
                  Open this app in Nimiq Pay <ArrowUpRight size={15} />
                </a>
                <small>
                  Plans are stored locally, unencrypted. Export a backup before
                  clearing browser data. Read the{" "}
                  <Link href="/docs/#privacy">privacy guide</Link>.
                </small>
              </div>
            </section>
          ) : (
            <>
              <ConnectionNotice />
              <div className="plan-signal">
                <ReserveIndicator
                  available={total.available}
                  reserve={plan.reserve}
                  known={balance !== null}
                />
              </div>
              {demo && (
                <section className="scenario-picker">
                  <label>
                    Explore an example
                    <select
                      value={scenario}
                      onChange={(e) => startDemo(e.target.value as Scenario)}
                    >
                      {Object.entries(scenarioLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="helper">
                    {exampleScenario(scenario).note} Switching examples resets
                    example edits only. No funds move.
                  </p>
                </section>
              )}
              <details className="quick-path">
                <summary>Your first real payment: four steps</summary>
                <ol>
                  <li>Add a commitment with a recipient you have checked.</li>
                  <li>Preview the buffer and set your reserve.</li>
                  <li>Approve personally in Nimiq Pay, checking the sender.</li>
                  <li>
                    Keep the workspace open for receipt verification. Open
                    Activity to export records.
                  </li>
                </ol>
                <p className="helper">
                  A returned hash is pending until verified. Network timing
                  varies.
                </p>
              </details>
              {address && (
                <div className="account-strip">
                  <span>
                    <Wallet size={14} /> Planning account
                  </span>
                  <select
                    aria-label="Planning account"
                    value={address}
                    disabled={busy}
                    onChange={async (e) => {
                      setBusy(true);
                      busyRef.current = true;
                      try {
                        await chooseAccount(e.target.value);
                      } catch (err) {
                        setMessage(errorMessage(err));
                      } finally {
                        setBusy(false);
                        busyRef.current = false;
                      }
                    }}
                  >
                    {accounts.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <button
                    className="text-link"
                    onClick={refresh}
                    disabled={busy}
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              )}
              {unresolved && (
                <div className="notice warning">
                  <AlertTriangle size={18} />
                  <span>
                    A payment needs reconciliation. New sends are paused until
                    its outcome is verified.
                  </span>
                  <button
                    className="text-link"
                    onClick={() => setTab("Activity")}
                  >
                    View activity
                  </button>
                </div>
              )}
              {tab === "Overview" && (
                <>
                  <div className="overview-grid">
                    <section className="balance-card">
                      <div className="card-label">
                        <span>
                          {demo
                            ? "EXAMPLE WALLET BALANCE"
                            : "ON-CHAIN ACCOUNT BALANCE"}
                        </span>
                        <span className="nim-symbol">⬡ NIM</span>
                      </div>
                      <div className="big-number">
                        {balance === null ? "Unavailable" : nim(balance)}
                        <span>{balance === null ? "" : "NIM"}</span>
                      </div>
                      <div className="allocation-bar">
                        <i
                          style={{
                            width: `${Math.min(100, Math.max(0, (total.obligations / (balance || 1)) * 100))}%`,
                          }}
                        />
                        <i
                          style={{
                            width: `${Math.min(100, Math.max(0, (plan.reserve / (balance || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="balance-breakdown">
                        <div>
                          <span>
                            <i className="dot gold-dot" />
                            Committed
                          </span>
                          <b>
                            {nim(total.obligations)} <small>NIM</small>
                          </b>
                        </div>
                        <div>
                          <span>
                            <i className="dot pale-dot" />
                            Reserve target
                          </span>
                          <b>
                            {nim(plan.reserve)} <small>NIM</small>
                          </b>
                        </div>
                      </div>
                      <div className="balance-foot">
                        {plan.horizon}-day planning window{" "}
                        <button
                          aria-label="Change planning window"
                          onClick={() => setModal("settings")}
                        >
                          <SlidersHorizontal size={16} />
                        </button>
                      </div>
                    </section>
                    <section className="available-card">
                      <div className="card-label">
                        <span>AFTER RECORDED COMMITMENTS</span>
                        <ArrowUpRight size={20} />
                      </div>
                      <span className="available-title">Room to move</span>
                      <div
                        className={
                          "available-number " +
                          (total.available < 0 ? "danger-text" : "")
                        }
                      >
                        {balance === null ? "Unknown" : nim(total.available)}
                        <small>{balance === null ? "" : "NIM"}</small>
                      </div>
                      <p>
                        {total.available < 0
                          ? "Your current plan exceeds the balance and reserve target. Adjust a commitment before paying."
                          : "The balance left after recorded payments and your reserve target."}
                      </p>
                      <div className="available-footer">
                        <ShieldCheck size={16} />A planning guide. Funds are not
                        locked.
                      </div>
                    </section>
                  </div>
                  <ForecastPanel plan={plan} balance={balance} />
                  <RiskReview plan={plan} balance={balance} />
                  <SharePlan
                    plan={plan}
                    address={address}
                    network={network}
                    demo={demo}
                  />
                  <section className="section-heading">
                    <div>
                      <span className="eyebrow">UP NEXT</span>
                      <h2>Your money has a plan.</h2>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setTab("Payments")}
                    >
                      All payments <ArrowRight size={16} />
                    </button>
                  </section>
                </>
              )}
              {tab !== "Activity" ? (
                <section className="payment-list">
                  {tab === "Payments" && (
                    <div className="list-toolbar">
                      <input
                        aria-label="Search payments"
                        placeholder="Find a payment…"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      />
                      <span>{plan.payments.length} recorded</span>
                    </div>
                  )}
                  {plan.payments
                    .filter(
                      (p) =>
                        p.status !== "confirmed" &&
                        p.title.toLowerCase().includes(filter.toLowerCase()),
                    )
                    .sort((a, b) => a.due.localeCompare(b.due))
                    .slice(0, tab === "Overview" ? 4 : 500)
                    .map((p) => (
                      <button
                        className="payment-row"
                        key={p.id}
                        onClick={() => setSelected(p.id)}
                      >
                        <span
                          className={
                            "payment-icon " +
                            (p.priority === "essential" ? "essential" : "")
                          }
                        >
                          <ArrowUpRight size={20} />
                        </span>
                        <span className="payment-name">
                          <b>{p.title}</b>
                          <small>
                            {p.priority === "essential"
                              ? "Essential commitment"
                              : "Planned payment"}{" "}
                            · {p.due}
                          </small>
                        </span>
                        <span className={"payment-status " + p.status}>
                          {p.status}
                        </span>
                        <span className="payment-amount">
                          {nim(p.amount)} <small>NIM</small>
                        </span>
                        <ArrowRight size={17} />
                      </button>
                    ))}
                  {!plan.payments.some(
                    (p) =>
                      p.status !== "confirmed" &&
                      p.title.toLowerCase().includes(filter.toLowerCase()),
                  ) && (
                    <div className="empty-state">
                      <ListChecks size={28} />
                      <h3>
                        {filter
                          ? "No matching payments"
                          : "Make space for your first commitment."}
                      </h3>
                      <p>
                        Add a recipient, an amount and a due date to see the
                        bigger picture.
                      </p>
                      <button
                        className="text-link"
                        onClick={() => {
                          setEditing(null);
                          setModal("add");
                        }}
                      >
                        Add a payment <Plus size={16} />
                      </button>
                    </div>
                  )}
                </section>
              ) : (
                <section className="activity-list">
                  <BackupCard
                    plan={plan}
                    network={network}
                    address={address || "example"}
                  />
                  <div className="list-toolbar">
                    <span>PAYMENT RECORDS</span>
                    <button
                      className="text-link"
                      disabled={
                        !plan.payments.some(
                          (p) => p.status === "confirmed" && p.hash,
                        )
                      }
                      onClick={() => {
                        const url = URL.createObjectURL(
                          new Blob([receiptCsv(plan, network, address)], {
                            type: "text/csv;charset=utf-8",
                          }),
                        );
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "quorail-verified-receipts.csv";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                    >
                      Export verified CSV
                    </button>
                    <button
                      className="text-link"
                      onClick={() =>
                        downloadPlan(plan, network, address || "example")
                      }
                    >
                      <Download size={16} />
                      Export records
                    </button>
                  </div>
                  {plan.payments
                    .filter((p) => p.status !== "planned")
                    .map((p) => (
                      <article className="activity-card" key={p.id}>
                        <div className="row">
                          <span className="payment-icon">
                            {p.status === "confirmed" ? (
                              <Check size={20} />
                            ) : (
                              <History size={20} />
                            )}
                          </span>
                          <div className="grow">
                            <h3>{p.title}</h3>
                            <span className={"payment-status " + p.status}>
                              {p.status}
                            </span>
                          </div>
                          <b>{nim(p.amount)} NIM</b>
                        </div>
                        <p>
                          {p.hash
                            ? short(p.hash)
                            : "No transaction hash recorded. Check Nimiq Pay payment history."}
                        </p>
                        <div className="row wrap">
                          {p.hash && (
                            <>
                              <a
                                className="text-link"
                                href={explorerUrl(network, p.hash)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View transaction <ArrowUpRight size={15} />
                              </a>
                              <button
                                className="button small outline"
                                disabled={busy}
                                onClick={() => checkReceipt(p)}
                              >
                                Check receipt
                              </button>
                            </>
                          )}
                          <button
                            className="text-link"
                            onClick={() => setSelected(p.id)}
                          >
                            Details <ArrowRight size={15} />
                          </button>
                        </div>
                      </article>
                    ))}
                  {!plan.payments.some((p) => p.status !== "planned") && (
                    <div className="empty-state">
                      <History size={30} />
                      <h3>No payment attempts yet.</h3>
                      <p>
                        {demo
                          ? "Example mode never sends transactions or creates fake receipts."
                          : "Your first wallet-approved payment will appear here."}
                      </p>
                    </div>
                  )}
                </section>
              )}
              {tab === "Overview" && (
                <div className="insight-strip">
                  <span className="small-star">✳</span>
                  <div>
                    <b>A balance is a number. A plan is perspective.</b>
                    <p>
                      Your forecast includes recorded commitments within{" "}
                      {plan.horizon} days. Unrecorded spending changes the
                      picture.
                    </p>
                  </div>
                  <Link href="/docs/" className="text-link">
                    How it works <ArrowUpRight size={16} />
                  </Link>
                </div>
              )}
            </>
          )}
          <div className="workspace-footer">
            <span>QUORAIL / A CONSIDERED WAY TO PAY</span>
            <Link href="/shared/">Shared boards</Link>
            <Link href="/docs/#privacy">Local plans. Clear boundaries.</Link>
          </div>
        </main>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!busy) setModal(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal === "add" ? "Add payment" : "Planning settings"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <span className="eyebrow">
                {modal === "add"
                  ? "MAKE IT PART OF THE PLAN"
                  : "SET YOUR PERSPECTIVE"}
              </span>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X />
              </button>
            </div>
            <h2>
              {modal === "add"
                ? editing
                  ? "Refine your commitment."
                  : "A new commitment."
                : "Your planning preferences."}
            </h2>
            {message && (
              <p role="status" className="form-message">
                {message}
              </p>
            )}
            {modal === "add" ? (
              <form onSubmit={addPayment}>
                <label>
                  Payment name
                  <input
                    name="title"
                    defaultValue={edited?.title}
                    required
                    maxLength={80}
                    placeholder="e.g. Studio rent"
                    autoFocus
                  />
                </label>
                <label>
                  Recipient Nimiq address
                  <input
                    name="recipient"
                    defaultValue={edited?.recipient}
                    required
                    placeholder="NQ…"
                    autoComplete="off"
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Amount in NIM
                    <input
                      name="amount"
                      defaultValue={
                        edited ? String(edited.amount / LUNA) : undefined
                      }
                      inputMode="decimal"
                      required
                      placeholder="0.00"
                    />
                  </label>
                  <label>
                    Fee in NIM
                    <input
                      name="fee"
                      inputMode="decimal"
                      required
                      defaultValue={edited ? String(edited.fee / LUNA) : "0"}
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Due date
                    <input
                      name="due"
                      type="date"
                      required
                      defaultValue={edited?.due || dateAfter(1)}
                    />
                  </label>
                  <label>
                    Priority
                    <select
                      name="priority"
                      defaultValue={edited?.priority || "normal"}
                    >
                      <option value="normal">Normal</option>
                      <option value="essential">Essential</option>
                    </select>
                  </label>
                </div>
                <label>
                  Repeat commitment
                  <select
                    name="recurrence"
                    defaultValue={edited?.recurrence || "once"}
                  >
                    <option value="once">One-time / custom date</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <p className="helper">
                  Each occurrence requires your approval. After confirmation,
                  the next occurrence is added automatically. Edit or remove
                  that next occurrence to change or stop the series.
                </p>
                <p className="helper">
                  The explicit fee is included in your forecast and sent to the
                  wallet. Nimiq supports zero-fee payments when the network
                  permits. Adding a payment does not send funds.
                </p>
                <button className="button dark full" type="submit">
                  {editing ? "Save payment" : "Add to my plan"}{" "}
                  <Plus size={17} />
                </button>
              </form>
            ) : (
              <form onSubmit={settings}>
                <label>
                  Reserve target in NIM
                  <input
                    name="reserve"
                    required
                    defaultValue={String(plan.reserve / LUNA)}
                    inputMode="decimal"
                    autoFocus
                  />
                </label>
                <label>
                  Planning window
                  <select name="horizon" defaultValue={plan.horizon}>
                    {[7, 14, 30, 60, 90, 365].map((n) => (
                      <option key={n} value={n}>
                        {n} days
                      </option>
                    ))}
                  </select>
                </label>
                <p className="helper">
                  A reserve is your planning preference. Quorail blocks payments
                  through this app that cross it. You can still spend directly
                  in your wallet.
                </p>
                <button className="button dark full">
                  Save preferences <Check size={17} />
                </button>
                {!demo && (
                  <label>
                    Backup password (encrypted imports only)
                    <input
                      type="password"
                      autoComplete="off"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                    />
                    <small>
                      Used on this device only. Leave blank for a plain JSON
                      backup.
                    </small>
                  </label>
                )}
                <div className="backup-controls">
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      downloadPlan(plan, network, address || "example")
                    }
                  >
                    <Download size={16} />
                    Export backup
                  </button>
                  {!demo && (
                    <label className="text-link">
                      Import JSON or encrypted backup
                      <input
                        type="file"
                        accept="application/json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          void importFile(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      )}
      {payment && impact && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!busy) setSelected(null);
          }}
        >
          <section
            className="modal payment-detail"
            role="dialog"
            aria-modal="true"
            aria-label="Payment impact"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <span className="eyebrow">BEFORE YOUR NEXT MOVE</span>
              <button
                className="icon-button"
                disabled={busy}
                aria-label="Close payment"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>
            <h2>{payment.title}</h2>
            {payment.recurrence && (
              <p className="helper">
                Repeats {payment.recurrence}. Due {payment.due}. No automatic
                wallet debit.
              </p>
            )}
            <p className="recipient">To {payment.recipient}</p>
            <div className="impact-total">
              {nim(payment.amount)} <small>NIM</small>
            </div>
            {payment.status === "planned" && (
              <>
                <ReserveIndicator
                  available={impact.available}
                  reserve={plan.reserve}
                  known={balance !== null}
                />
                <label className="reserve-adjust">
                  Adjust reserve target (NIM)
                  <input
                    key={selected}
                    inputMode="decimal"
                    defaultValue={String(plan.reserve / LUNA)}
                    onChange={(e) => {
                      try {
                        const reserve = parseNim(e.target.value);
                        update({ ...planRef.current, reserve });
                        setReserveInvalid(false);
                        setMessage("");
                      } catch {
                        setReserveInvalid(true);
                        setMessage(
                          "Enter a non-negative reserve with at most 5 decimals.",
                        );
                      }
                    }}
                  />
                </label>
                <p className="helper">
                  Reserve changes save immediately. Your forecast includes{" "}
                  {plan.horizon} days and future recurring occurrences.
                </p>
              </>
            )}
            <div className="impact-lines">
              <div>
                <span>Current account balance</span>
                <b>
                  {balance === null ? "Unavailable" : nim(balance) + " NIM"}
                </b>
              </div>
              <div>
                <span>This payment + fee</span>
                <b>{nim(impact.cost)} NIM</b>
              </div>
              <div>
                <span>Other commitments in {plan.horizon} days</span>
                <b>{nim(impact.obligations)} NIM</b>
              </div>
              <div>
                <span>Balance after this payment</span>
                <b>{nim(impact.after)} NIM</b>
              </div>
              <div>
                <span>Reserve target</span>
                <b>{nim(plan.reserve)} NIM</b>
              </div>
              <div
                className={
                  impact.available < 0
                    ? "impact-result negative"
                    : "impact-result"
                }
              >
                <span>Room left after this move</span>
                <b>{nim(impact.available)} NIM</b>
              </div>
            </div>
            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
            {payment.status === "planned" ? (
              <>
                {impact.shortfall > 0 ? (
                  <div className="notice warning">
                    <AlertTriangle size={18} />
                    <span>
                      This payment crosses your target by{" "}
                      {nim(impact.shortfall)} NIM. Adjust your plan before
                      sending.
                    </span>
                  </div>
                ) : (
                  <p className="helper">
                    Your recorded commitments and reserve target remain covered
                    at this balance.
                  </p>
                )}
                {!demo && (
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                    />
                    I will verify that Nimiq Pay sends from {short(address)}.
                    Selecting a planning account here does not select the wallet
                    signer.
                  </label>
                )}
                <button
                  className="button dark full"
                  onClick={send}
                  disabled={
                    demo ||
                    busy ||
                    !ack ||
                    impact.shortfall > 0 ||
                    reserveInvalid ||
                    balance === null ||
                    unresolved ||
                    storageError
                  }
                >
                  {demo
                    ? "Example only. No funds move."
                    : busy
                      ? "Waiting for wallet…"
                      : "Pay with Nimiq Pay"}
                  <ArrowUpRight size={17} />
                </button>
                <button
                  className="text-link delete-link"
                  disabled={busy}
                  onClick={() => {
                    setEditing(payment.id);
                    setSelected(null);
                    setModal("add");
                  }}
                >
                  Edit payment details
                </button>
                <button
                  className="text-link delete-link"
                  disabled={busy}
                  onClick={() => remove(payment)}
                >
                  <Trash2 size={14} />
                  Remove planned payment
                </button>
              </>
            ) : (
              <>
                <p className="helper">
                  Receipt status: {payment.status}. Attempted payments remain in
                  your records. Do not resend an uncertain transaction.
                </p>
                {payment.hash ? (
                  <div className="row wrap">
                    <a
                      className="text-link"
                      target="_blank"
                      rel="noreferrer"
                      href={explorerUrl(network, payment.hash)}
                    >
                      Inspect on explorer <ArrowUpRight size={16} />
                    </a>
                    <button
                      className="button outline"
                      disabled={busy}
                      onClick={() => checkReceipt(payment)}
                    >
                      Check receipt
                    </button>
                  </div>
                ) : (
                  <>
                    <label>
                      Recover transaction from wallet history
                      <input
                        placeholder="64-character transaction hash"
                        value={recovery}
                        onChange={(e) => setRecovery(e.target.value.trim())}
                      />
                    </label>
                    <button
                      className="button dark full"
                      disabled={busy || recovery.length !== 64}
                      onClick={() => checkReceipt(payment, recovery)}
                    >
                      Verify recovered transaction
                    </button>
                  </>
                )}
              </>
            )}
            <DecisionAid
              key={payment.id}
              plan={plan}
              payment={payment}
              balance={balance}
            />
            <SharePlan
              plan={plan}
              address={address}
              network={network}
              payment={payment}
              demo={demo}
            />
          </section>
        </div>
      )}
    </div>
  );
}
