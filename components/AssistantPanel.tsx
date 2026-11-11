"use client";
import { useState } from "react";
import { assistantContext, type Context } from "@/lib/assistant";
import type { Plan } from "@/lib/finance";
export default function AssistantPanel({
  plan,
  balance,
  initialOpen = false,
  compact = false,
  suggestedQuestions,
  promptLabels,
}: {
  plan: Plan;
  balance: number | null;
  initialOpen?: boolean;
  compact?: boolean;
  suggestedQuestions?: string[];
  promptLabels?: string[];
}) {
  const [open, setOpen] = useState(initialOpen),
    [question, setQuestion] = useState(""),
    [share, setShare] = useState(false),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [answer, setAnswer] = useState(""),
    [error, setError] = useState("");
  const context: Context | undefined =
    balance !== null ? assistantContext(plan, balance) : undefined;
  return (
    <section className="ai-panel">
      {!compact && (
        <div className="section-heading">
          <div>
            <span className="eyebrow">QUORAIL AI / POWERED BY ANTHROPIC</span>
            <h2>Ask about your next move.</h2>
          </div>
          <button
            className="button outline"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "Close assistant" : "Ask Quorail AI"}
          </button>
        </div>
      )}
      {open && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || !consent) return;
            setBusy(true);
            setError("");
            setAnswer("");
            try {
              const r = await fetch("/api/assistant/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  question,
                  context: share ? context : undefined,
                }),
                signal: AbortSignal.timeout(30000),
              });
              const body = await r.json();
              if (!r.ok)
                throw new Error(body.error || "Assistant unavailable.");
              setAnswer(body.answer);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Assistant unavailable.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            Ask about payment planning, reserve targets or using Quorail. AI can
            explain; it cannot approve payments or change your plan.
          </p>
          <div className="prompt-chips">
            {(
              suggestedQuestions || [
                "Explain my 30-day buffer.",
                "How do recurring commitments affect my plan?",
                "What does a pending receipt mean?",
              ]
            ).map((q, i) => (
              <button type="button" key={q} onClick={() => setQuestion(q)}>
                {promptLabels?.[i] || q}
              </button>
            ))}
          </div>
          <label>
            Your question
            <textarea
              required
              maxLength={1200}
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should I check before making this payment?"
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              disabled={!context}
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
            />
            Include my balance, reserve and 30/60/90-day totals. No addresses,
            titles or transaction hashes are included automatically.
          </label>
          {share && context && (
            <details>
              <summary>Preview the exact summary being shared</summary>
              <pre>{JSON.stringify(context, null, 2)}</pre>
            </details>
          )}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            I agree to send my question and any selected summary to Anthropic
            through Quorail. I will not include recovery words, keys or
            passwords.
          </label>
          <button className="button dark" disabled={busy || !consent}>
            {busy ? "Thinking…" : "Ask Quorail AI ↗"}
          </button>
          {error && (
            <p className="form-message" role="alert">
              {error}
            </p>
          )}
          {answer && (
            <div className="ai-answer" role="status">
              <b>Quorail AI</b>
              <p>{answer}</p>
              <small>
                AI can make mistakes. Check the plan figures and wallet details
                before approving.
              </small>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
