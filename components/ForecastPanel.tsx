"use client";
import { useState } from "react";
import { projection, nim, type Plan } from "@/lib/finance";
export default function ForecastPanel({
  plan,
  balance,
}: {
  plan: Plan;
  balance: number | null;
}) {
  const [days, setDays] = useState(30);
  const f = projection(balance ?? 0, plan, days);
  return (
    <section className="forecast-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE ROAD AHEAD</span>
          <h2>Your next {days} days.</h2>
        </div>
        <div className="period-tabs">
          {[30, 60, 90].map((n) => (
            <button
              key={n}
              aria-pressed={days === n}
              onClick={() => setDays(n)}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>
      <div className="forecast-metrics">
        <div>
          <span>Upcoming commitments + fees</span>
          <strong>{nim(f.total)} NIM</strong>
          <small>{f.count} scheduled occurrences</small>
        </div>
        <div>
          <span>Projected balance</span>
          <strong>
            {balance === null ? "Unavailable" : nim(f.remaining) + " NIM"}
          </strong>
          <small>Assumes no new income or spending</small>
        </div>
        <div>
          <span>Above reserve target</span>
          <strong className={f.buffer < 0 ? "danger-text" : ""}>
            {balance === null ? "Unknown" : nim(f.buffer) + " NIM"}
          </strong>
          <small>
            {balance === null
              ? "Refresh your wallet balance"
              : f.breach
                ? `Reserve first at risk: ${f.breach}`
                : "Recorded commitments remain covered"}
          </small>
        </div>
      </div>
      <p className="helper">
        Recurring amounts and fees are estimates. Overdue unpaid commitments
        count now. Recurrence never authorizes automatic payments. Pending
        transfers remain reserved until verified.
      </p>
    </section>
  );
}
