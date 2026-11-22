import { forecast, type Plan, type Payment } from "./finance";
export function delayImpact(
  balance: number,
  plan: Plan,
  payment: Payment,
  days = 14,
) {
  const date = new Date(payment.due + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  const due = date.toISOString().slice(0, 10);
  const delayed = { ...payment, due, anchorDay: Number(due.slice(-2)) };
  const next = {
    ...plan,
    payments: plan.payments.map((p) => (p.id === payment.id ? delayed : p)),
  };
  return {
    due,
    current: forecast(balance, plan).available,
    delayed: forecast(balance, next).available,
  };
}
