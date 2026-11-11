import { demoPlan, LUNA, dateAfter, validatePlan, type Plan } from "./finance";
export type Scenario = "freelancer" | "team" | "personal";
export const scenarioLabels: Record<Scenario, string> = {
  freelancer: "Freelancer studio",
  team: "Small team",
  personal: "Rent + buffer",
};
export function exampleScenario(name: Scenario): {
  plan: Plan;
  balance: number;
  note: string;
} {
  const plan = demoPlan();
  if (name === "team") {
    plan.reserve = 300 * LUNA;
    plan.payments = plan.payments.map((p, i) => ({
      ...p,
      title: ["Shared workspace", "Weekly collaborator", "Software tools"][i],
      amount: [600, 180, 90][i] * LUNA,
      recurrence: i === 1 ? "weekly" : "monthly",
    }));
    return {
      plan: validatePlan(plan),
      balance: 2000 * LUNA,
      note: "A team budget with weekly collaborator costs. Shared boards use a separate explicit publishing step.",
    };
  }
  if (name === "personal") {
    plan.reserve = 150 * LUNA;
    plan.payments = plan.payments.slice(0, 2).map((p, i) => ({
      ...p,
      title: i === 0 ? "Monthly rent" : "Groceries",
      amount: (i === 0 ? 400 : 70) * LUNA,
      due: dateAfter(i === 0 ? 5 : 2),
      recurrence: i === 0 ? "monthly" : "weekly",
      anchorDay: Number(dateAfter(i === 0 ? 5 : 2).slice(-2)),
    }));
    return {
      plan: validatePlan(plan),
      balance: 1200 * LUNA,
      note: "Rent and weekly groceries with a personal reserve. No future income is assumed.",
    };
  }
  return {
    plan,
    balance: 1000 * LUNA,
    note: "Studio costs and collaborator payments. Unreceived client invoices are not counted as spendable balance.",
  };
}
