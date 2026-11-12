"use client";
import Localized from "@/components/Localized";

import { useLanguage } from "./Preferences";
import { reserveStatus, nim } from "@/lib/finance";
export default function ReserveIndicator({
  available,
  reserve,
  known,
}: {
  available: number;
  reserve: number;
  known: boolean;
}) {
  const { tr } = useLanguage();
  const state = known ? reserveStatus(available, reserve) : "unknown";
  return (
    <div className={`reserve-indicator ${state}`} role="status">
      <span className="signal-dot" />
      <div>
        <b>
          <Localized
            text={
              state === "covered"
                ? tr("Covered by your plan")
                : state === "tight"
                  ? tr("Tight buffer")
                  : state === "risky"
                    ? tr("Reserve target at risk")
                    : tr("Balance unavailable")
            }
          />
        </b>
        <p>
          <Localized
            text={
              !known
                ? "Refresh your balance before making a decision."
                : available < 0
                  ? `${nim(-available)} NIM short after recorded commitments and reserve.`
                  : `${nim(available)} NIM above your reserve after recorded commitments.`
            }
          />
        </p>
        <small>
          {" "}
          <Localized
            text={
              "Planning guidance, not a guarantee. Tight means within 10% of your reserve or 1 NIM, whichever is greater."
            }
          />{" "}
        </small>
      </div>
    </div>
  );
}
