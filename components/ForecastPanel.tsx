"use client";
import Localized from "@/components/Localized";

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
          <span className="eyebrow">
            <Localized text={"THE ROAD AHEAD"} />
          </span>
          <h2>
            <Localized text={"Your next"} /> {days} <Localized text={"days."} />
          </h2>
        </div>
        <div className="period-tabs">
          {[30, 60, 90].map((n) => (
            <button
              key={n}
              aria-pressed={days === n}
              onClick={() => setDays(n)}
            >
              {n} <Localized text={"days"} />{" "}
            </button>
          ))}
        </div>
      </div>
      <div className="forecast-metrics">
        <div>
          <span>
            <Localized text={"Upcoming commitments + fees"} />
          </span>
          <strong>
            {nim(f.total)} <Localized text={"NIM"} />
          </strong>
          <small>
            {f.count} <Localized text={"scheduled occurrences"} />
          </small>
        </div>
        <div>
          <span>
            <Localized text={"Projected balance"} />
          </span>
          <strong>
            <Localized
              text={
                balance === null ? "Unavailable" : nim(f.remaining) + " NIM"
              }
            />
          </strong>
          <small>
            <Localized text={"Assumes no new income or spending"} />
          </small>
        </div>
        <div>
          <span>
            <Localized text={"Above reserve target"} />
          </span>
          <strong className={f.buffer < 0 ? "danger-text" : ""}>
            <Localized
              text={balance === null ? "Unknown" : nim(f.buffer) + " NIM"}
            />
          </strong>
          <small>
            <Localized
              text={
                balance === null
                  ? "Refresh your wallet balance"
                  : f.breach
                    ? `Reserve first at risk: ${f.breach}`
                    : "Recorded commitments remain covered"
              }
            />
          </small>
        </div>
      </div>
      <p className="helper">
        {" "}
        <Localized
          text={
            "Recurring amounts and fees are estimates. Overdue unpaid commitments count now. Recurrence never authorizes automatic payments. Pending transfers remain reserved until verified."
          }
        />{" "}
      </p>
    </section>
  );
}
