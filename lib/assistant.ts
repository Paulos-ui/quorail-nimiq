import { projection, nim, type Plan } from "./finance";
export type Context = {
  balance: string;
  reserve: string;
  projections: {
    days: number;
    commitments: string;
    remaining: string;
    buffer: string;
  }[];
};
export function assistantContext(plan: Plan, balance: number): Context {
  return {
    balance: nim(balance),
    reserve: nim(plan.reserve),
    projections: [30, 60, 90].map((days) => {
      const p = projection(balance, plan, days);
      return {
        days,
        commitments: nim(p.total),
        remaining: nim(p.remaining),
        buffer: nim(p.buffer),
      };
    }),
  };
}
export function validateAssistant(input: unknown): {
  question: string;
  context?: Context;
} {
  if (!input || typeof input !== "object") throw new Error("Invalid request.");
  const o = input as Record<string, unknown>;
  if (
    typeof o.question !== "string" ||
    !o.question.trim() ||
    o.question.length > 1200
  )
    throw new Error("Ask a question of 1 to 1,200 characters.");
  let context: Context | undefined;
  if (o.context !== undefined) {
    const c = o.context as Context;
    const amount = (x: unknown) =>
      typeof x === "string" && /^-?[\d,]{1,20}(\.\d{1,5})?$/.test(x);
    if (
      !c ||
      !amount(c.balance) ||
      !amount(c.reserve) ||
      !Array.isArray(c.projections) ||
      c.projections.length !== 3
    )
      throw new Error("Invalid planning context.");
    context = {
      balance: c.balance,
      reserve: c.reserve,
      projections: c.projections.map((p, i) => {
        if (
          !p ||
          p.days !== [30, 60, 90][i] ||
          !amount(p.commitments) ||
          !amount(p.remaining) ||
          !amount(p.buffer)
        )
          throw new Error("Invalid projection.");
        return {
          days: p.days,
          commitments: p.commitments,
          remaining: p.remaining,
          buffer: p.buffer,
        };
      }),
    };
  }
  return { question: o.question.trim(), context };
}
