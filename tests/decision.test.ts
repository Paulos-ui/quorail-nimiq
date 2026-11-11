import test from "node:test";
import assert from "node:assert/strict";
import { exampleScenario } from "../lib/scenarios";
import { delayImpact } from "../lib/decision";
import { validatePlan, projection, LUNA } from "../lib/finance";
test("all three examples are valid private illustrative plans", () => {
  for (const name of ["freelancer", "team", "personal"] as const) {
    const s = exampleScenario(name);
    assert.ok(s.balance > 0);
    validatePlan(s.plan);
    assert.ok(s.plan.payments.every((p) => p.status === "planned" && !p.hash));
    assert.ok(
      projection(s.balance, s.plan, 90).total >=
        projection(s.balance, s.plan, 30).total,
    );
  }
});
test("delay comparison leaves the plan untouched and respects horizon", () => {
  const { plan, balance } = exampleScenario("freelancer");
  const p = plan.payments[2],
    before = JSON.stringify(plan);
  const r = delayImpact(balance, plan, p);
  assert.equal(JSON.stringify(plan), before);
  assert.equal(r.delayed - r.current, p.amount + p.fee);
  assert.ok(r.due > p.due);
});
test("moving a bill inside the same horizon does not create money", () => {
  const { plan, balance } = exampleScenario("personal");
  plan.horizon = 90;
  const p = { ...plan.payments[0], recurrence: undefined };
  plan.payments = [p];
  const r = delayImpact(balance, plan, p);
  assert.equal(r.current, r.delayed);
  assert.equal(balance, 1200 * LUNA);
});
