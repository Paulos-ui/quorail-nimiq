"use client";
import Localized from "@/components/Localized";

import { useState } from "react";
import { delayImpact } from "@/lib/decision";
import { forecast, nim, type Plan, type Payment } from "@/lib/finance";
import AssistantPanel from "./AssistantPanel";
export default function DecisionAid({
  plan,
  payment,
  balance,
}: {
  plan: Plan;
  payment: Payment;
  balance: number | null;
}) {
  const [show, setShow] = useState(false);
  if (balance === null || payment.status !== "planned") return null;
  const f = forecast(balance, plan, payment),
    shift = delayImpact(balance, plan, payment);
  const prompts = [
    `Can I afford this payment within my recorded plan? Payment plus fee: ${nim(f.cost)} NIM. Balance after payment: ${nim(f.after)} NIM. Other commitments in ${plan.horizon} days: ${nim(f.obligations)} NIM. Reserve target: ${nim(plan.reserve)} NIM. Buffer: ${nim(f.available)} NIM. Explain these figures without assuming new income.`,
    `What happens if I delay this commitment by 14 days? Current ${plan.horizon}-day plan buffer: ${nim(shift.current)} NIM. Hypothetical buffer: ${nim(shift.delayed)} NIM. New due date: ${shift.due}. No payment has been made or rescheduled. Explain timing versus affordability; contractual permission is unknown.`,
  ];
  return (
    <section className="decision-aid">
      <button
        className="text-link"
        aria-expanded={show}
        onClick={() => setShow(!show)}
      >
        <Localized
          text={
            show
              ? "Close timing comparison"
              : "What if I delay this by 2 weeks?"
          }
        />
      </button>
      {show && (
        <div className="timing-comparison">
          <div>
            <small>
              <Localized text={"Current plan buffer"} />
            </small>
            <b>
              {nim(shift.current)} <Localized text={"NIM"} />
            </b>
          </div>
          <div>
            <small>
              <Localized text={"If moved to"} /> {shift.due}
            </small>
            <b>
              {nim(shift.delayed)} <Localized text={"NIM"} />
            </b>
          </div>
          <p className="helper">
            {" "}
            <Localized
              text={
                "Illustration only. No dates changed. A recurring series shifts with this occurrence. Moving a bill beyond the planning window changes timing, not what you owe. Check any late fees and agreement with the recipient."
              }
            />{" "}
          </p>
        </div>
      )}
      <AssistantPanel
        plan={plan}
        balance={balance}
        suggestedQuestions={prompts}
        promptLabels={["Can I afford this payment?", "Explain a 2-week delay"]}
      />
    </section>
  );
}
