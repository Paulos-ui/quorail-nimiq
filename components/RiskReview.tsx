"use client";
import { firstReserveRisk } from "@/lib/release-tools";
import { nim, type Plan } from "@/lib/finance";
import AssistantPanel from "./AssistantPanel";
export default function RiskReview({
  plan,
  balance,
}: {
  plan: Plan;
  balance: number | null;
}) {
  if (balance === null) return null;
  const risk = firstReserveRisk(plan, balance);
  const question = risk
    ? `Which commitment is most at risk in my recorded plan? The first due-date group below reserve is ${risk.due}, with ${risk.payments.length} occurrences. Projected balance after that group: ${nim(risk.remaining)} NIM. Reserve: ${nim(plan.reserve)} NIM. Shortfall: ${nim(risk.shortfall)} NIM. ${risk.alreadyBelow ? "The starting balance is already below reserve." : ""} Explain this due-date group, without inventing a priority ranking or future income.`
    : "My recorded 90-day plan stays above reserve. Explain what unrecorded spending and missing income assumptions I should check before paying.";
  return (
    <section className="risk-review">
      <span className="eyebrow">COMMITMENTS TO REVIEW</span>
      <h2>
        {risk
          ? "Where the buffer first runs short."
          : "The next 90 days remain covered."}
      </h2>
      {risk ? (
        <>
          <p>
            {risk.alreadyBelow
              ? "Your starting balance is already below reserve. "
              : ""}
            {risk.due}: <b>{nim(risk.shortfall)} NIM below target</b> after this
            due-date group.
          </p>
          <ul>
            {risk.payments.map((p) => (
              <li key={p.id}>
                <span>{p.title}</span>
                <b>{nim(p.amount + p.fee)} NIM</b>
              </li>
            ))}
          </ul>
          <p className="helper">
            Ordered by due date, not a recommendation to skip a bill.
            Commitments on the same date are grouped. Includes recurring
            occurrences and fees, with no new income assumed.
          </p>
        </>
      ) : (
        <p className="helper">
          Based only on recorded costs, your current balance and reserve target.
        </p>
      )}
      <AssistantPanel
        plan={plan}
        balance={balance}
        suggestedQuestions={[question]}
        promptLabels={["Which commitment is most at risk?"]}
      />
    </section>
  );
}
