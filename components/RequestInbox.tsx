"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode-generator";
import type { Board } from "@/lib/boards";
import {
  dateAfter,
  nim,
  normalAddress,
  parseNim,
  type Plan,
} from "@/lib/finance";
import {
  compareRequests,
  readLinks,
  rememberRequest,
  requestToken,
  requestTotals,
} from "@/lib/payment-requests";
import ScanRecipientQR from "./ScanRecipientQR";

type Entry = { secret: string; board: Board };
async function boardApi(
  payload: Record<string, unknown>,
): Promise<{ board: Board; secret: string }> {
  const response = await fetch("/api/board/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || result.board?.kind !== "request")
    throw new Error(
      result.error || "This link does not contain a payment request.",
    );
  return result;
}
function ShareRequest({ url }: { url: string }) {
  const image = useMemo(() => {
    const qr = QRCode(0, "M");
    qr.addData(url);
    qr.make();
    return qr.createDataURL(5, 20);
  }, [url]);
  const [copied, setCopied] = useState(false);
  return (
    <div className="request-share">
      <img
        src={image}
        alt="Scan to review this NIM request"
        width="180"
        height="180"
      />
      <label>
        Request link
        <input readOnly value={url} onFocus={(e) => e.target.select()} />
      </label>
      <button
        type="button"
        className="button outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
export default function RequestInbox({
  address,
  network,
  balance,
  plan,
}: {
  address: string;
  network: string;
  balance: number | null;
  plan: Plan;
}) {
  const [direction, setDirection] = useState<"Incoming" | "Outgoing">(
    "Incoming",
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [share, setShare] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const version = useRef(0);
  const acting = useRef(false);
  const refresh = useCallback(async () => {
    const id = ++version.current;
    try {
      const links = readLinks(network, address);
      const loaded = await Promise.allSettled(
        links.map(async (secret) => ({
          secret,
          board: (await boardApi({ action: "read", secret })).board,
        })),
      );
      if (version.current !== id) return;
      const valid = loaded.flatMap((r) =>
        r.status === "fulfilled" && r.value.board.network === network
          ? [r.value]
          : [],
      );
      setEntries(valid);
      setWarning(
        loaded.some((r) => r.status === "rejected")
          ? "Some requests could not be loaded. Check your connection or the link expiry."
          : "",
      );
    } catch (e) {
      if (version.current === id)
        setWarning(e instanceof Error ? e.message : "Inbox unavailable.");
    }
  }, [address, network]);
  useEffect(() => {
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = setInterval(update, 30000);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      version.current++;
      clearInterval(interval);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, [refresh]);
  const outgoing = (b: Board) => normalAddress(address) === b.rows[0].recipient;
  const visible = entries.filter(
    (e) => outgoing(e.board) === (direction === "Outgoing"),
  );
  const chosen = visible.filter((e) => selected.includes(e.secret));
  let preview: ReturnType<typeof compareRequests> | undefined,
    reason = "";
  if (direction === "Incoming" && selected.length) {
    if (chosen.length !== selected.length)
      reason = "Refresh and select available bills again.";
    else if (balance === null)
      reason = "Refresh your wallet balance to compare bills.";
    else
      try {
        preview = compareRequests(
          balance,
          plan,
          chosen.map((e) => e.board),
        );
      } catch (e) {
        reason = (e as Error).message;
      }
  }
  async function run(task: () => Promise<void>) {
    if (acting.current) return;
    acting.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request unavailable.");
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }
  function importLink(value: string) {
    return run(async () => {
      const secret = requestToken(value.trim(), location.origin);
      if (!secret)
        throw new Error("Use a Quorail request link from this site.");
      const { board } = await boardApi({ action: "read", secret });
      if (board.network !== network)
        throw new Error("Switch to the request’s wallet network first.");
      await rememberRequest(network, address, secret);
      setDirection(outgoing(board) ? "Outgoing" : "Incoming");
      setLink("");
      setSelected([]);
    });
  }
  return (
    <section className="forecast-panel request-inbox">
      <h2>Payment inbox</h2>
      <details>
        <summary>Request a payment</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            void run(async () => {
              const title = String(data.get("purpose")).trim(),
                due = String(data.get("due")),
                amount = parseNim(String(data.get("amount")));
              if (!title || amount <= 0)
                throw new Error("Enter a purpose and a positive NIM amount.");
              const result = await boardApi({
                action: "create",
                board: {
                  kind: "request",
                  title,
                  network,
                  rows: [
                    {
                      title,
                      due,
                      amount,
                      recipient: address,
                      responsible: "Payer",
                    },
                  ],
                },
              });
              setShare(location.origin + "/shared/#" + result.secret);
              setDirection("Outgoing");
              setSelected([]);
              await rememberRequest(network, address, result.secret);
              form.reset();
            });
          }}
        >
          <label>
            Purpose
            <input
              required
              maxLength={80}
              name="purpose"
              placeholder="Website maintenance"
            />
          </label>
          <label>
            Amount in NIM
            <input required name="amount" inputMode="decimal" />
          </label>
          <label>
            Due date
            <input
              required
              name="due"
              type="date"
              defaultValue={dateAfter(7)}
              max={dateAfter(29)}
            />
          </label>
          <small>
            Receiving address: {address}. Anyone with the link can view the bill
            and its receipts for 30 days.
          </small>
          <button disabled={busy} className="button dark">
            Create request
          </button>
        </form>
      </details>
      <details>
        <summary>Add a request link</summary>
        <label>
          Quorail request link
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </label>
        <button
          disabled={busy || !link}
          className="button outline"
          onClick={() => void importLink(link)}
        >
          Add to inbox
        </button>
        <ScanRecipientQR
          network="Request"
          onRecipient={(value) => void importLink(value)}
        />
      </details>
      {share && (
        <>
          <ShareRequest key={share} url={share} />
          <button className="text-link" onClick={() => setShare("")}>
            Close share link
          </button>
        </>
      )}
      <div className="period-tabs">
        {(["Incoming", "Outgoing"] as const).map((d) => (
          <button
            key={d}
            aria-pressed={d === direction}
            onClick={() => {
              setDirection(d);
              setSelected([]);
              setShare("");
            }}
          >
            {d}
          </button>
        ))}
      </div>
      {!visible.length && (
        <p>
          No {direction.toLowerCase()} requests saved on this wallet and device.
        </p>
      )}
      {visible.map(({ secret, board }) => {
        const sums = requestTotals(board),
          url = location.origin + "/shared/#" + secret;
        return (
          <article key={secret}>
            <strong>{board.title}</strong>
            <small>
              Due {board.rows[0].due} · {nim(sums.paid)} NIM paid ·{" "}
              {nim(sums.remaining)} NIM outstanding
            </small>
            {direction === "Incoming" && sums.remaining > 0 && (
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(secret)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, secret]
                        : selected.filter((s) => s !== secret),
                    )
                  }
                />{" "}
                Compare this bill
              </label>
            )}
            <a href={url} className="text-link">
              Review bill and receipts
            </a>
            {direction === "Outgoing" && (
              <button className="text-link" onClick={() => setShare(url)}>
                Share link or QR
              </button>
            )}
          </article>
        );
      })}
      {preview && (
        <p role="status">
          Selected payments: {nim(preview.cost)} NIM.{" "}
          {nim(Math.abs(preview.available))} NIM{" "}
          {preview.available < 0 ? "below" : "above"} reserve after payment and
          other recorded commitments.
        </p>
      )}
      {reason && <p role="status">{reason}</p>}
      {warning && <p role="status">{warning}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
