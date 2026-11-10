import { emptyPlan, normalAddress, validatePlan, type Plan } from "./finance";
export const storageKey = (network: string, address: string) =>
  `quorail-nimiq:v1:${network}:${normalAddress(address)}`;
export function loadPlan(key: string): Plan {
  const raw = localStorage.getItem(key);
  if (!raw) return emptyPlan();
  const plan = validatePlan(JSON.parse(raw));
  return {
    ...plan,
    payments: plan.payments.map((p) =>
      p.status === "submitting" ? { ...p, status: "uncertain" } : p,
    ),
  };
}
export function savePlan(key: string, plan: Plan) {
  localStorage.setItem(key, JSON.stringify(validatePlan(plan)));
}
export function downloadPlan(plan: Plan, network: string, address: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ network, address, plan }, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "quorail-nimiq-plan.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
