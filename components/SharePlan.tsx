"use client";
import { useState } from "react";
import { nim, type Plan, type Payment } from "@/lib/finance";
import type { Board } from "@/lib/boards";
export default function SharePlan({
  plan,
  address,
  network,
  payment,
  demo,
}: {
  plan: Plan;
  address: string;
  network: string;
  payment?: Payment;
  demo: boolean;
}) {
  const [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [link, setLink] = useState(""),
    [error, setError] = useState(""),
    [parts, setParts] = useState(2),
    [labels, setLabels] = useState(""),
    [copied, setCopied] = useState(false);
  async function create() {
    if (!consent || busy) return;
    setBusy(true);
    setError("");
    try {
      const names = labels.split(",").map((s) => s.trim().slice(0, 40));
      const rows = payment
        ? Array.from({ length: parts }, (_, i) => ({
            title: payment.title,
            recipient: address,
            amount:
              Math.floor(payment.amount / parts) +
              (i < payment.amount % parts ? 1 : 0),
            due: payment.due,
            responsible: names[i] || `Contributor ${i + 1}`,
          }))
        : plan.payments
            .filter((p) => p.status === "planned")
            .slice(0, 20)
            .map((p, i) => ({
              title: p.title,
              sourceId: p.id,
              recipient: p.recipient,
              amount: p.amount,
              due: p.due,
              responsible: names[i] || "Unassigned",
            }));
      const r = await fetch("/api/board/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          board: {
            title: payment
              ? `${payment.title} contributions`
              : "Our payment plan",
            kind: payment ? "collection" : "team",
            network,
            rows,
          },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      const url = `${location.origin}/shared/#${data.secret}`;
      setLink(url);
      // Retain invite links on this device, separate from the private financial plan.
      try {
        const old = JSON.parse(localStorage.getItem("quorail:boards") || "[]");
        localStorage.setItem(
          "quorail:boards",
          JSON.stringify(
            [...old, { url, title: (data.board as Board).title }].slice(-20),
          ),
        );
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not share.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="share-panel">
      <summary>
        {payment
          ? "Request contributions / split this cost"
          : "Create a shared team board"}
      </summary>
      <p>
        {payment
          ? `Collect ${nim(payment.amount)} NIM into your connected planning account. Incoming contributions do not mark the outgoing bill as paid.`
          : "Publish up to 20 currently planned commitments. Members view the same board and approve their own payments. Future recurring occurrences are not published."}
      </p>
      {payment && (
        <label>
          Number of shares
          <select
            value={parts}
            onChange={(e) => setParts(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Responsible people (comma-separated, optional)
        <input
          maxLength={800}
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          placeholder="Jayking, Designer, Developer"
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        Publish these titles, addresses, amounts, dates and labels to a shared
        board for 30 days. Anyone with the invite link can view it. Labels are
        not verified identities.
      </label>
      <p className="helper">
        This is a separate shared snapshot with live receipt status. Edits and
        payments do not automatically sync back into your private plan. Avoid
        paying the same commitment from both places.
      </p>
      <button
        type="button"
        className="button outline"
        disabled={!consent || busy || demo || !address}
        onClick={create}
      >
        {busy
          ? "Creating…"
          : demo
            ? "Connect a wallet to share"
            : "Create invite link"}
      </button>
      {error && (
        <p role="alert" className="form-message">
          {error}
        </p>
      )}
      {link && (
        <div className="share-result">
          <label>
            Invite link
            <input readOnly value={link} />
          </label>
          <button
            type="button"
            className="button outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                setError("Select and copy the invite link.");
              }
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a className="text-link" href={link}>
            Open board ↗
          </a>
        </div>
      )}
    </details>
  );
}
