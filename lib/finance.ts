// Adapted from Quorail's pure consequence model. All amounts are integer Luna.
export const LUNA = 100_000;
export type PaymentStatus =
  | "planned"
  | "submitting"
  | "pending"
  | "confirmed"
  | "uncertain"
  | "failed"
  | "mismatch";
export type Payment = {
  id: string;
  title: string;
  recipient: string;
  amount: number;
  fee: number;
  due: string;
  priority: "essential" | "normal";
  status: PaymentStatus;
  hash?: string;
  created: string;
  sender?: string;
  expectedSender?: string;
  confirmedAt?: string;
  note?: string;
  recurrence?: "weekly" | "monthly";
  anchorDay?: number;
  seriesId?: string;
};
export type Plan = {
  version: 1;
  reserve: number;
  horizon: number;
  payments: Payment[];
};
export function parseNim(value: string): number {
  const s = value.trim();
  if (!/^(0|[1-9]\d{0,8})(\.\d{1,5})?$/.test(s))
    throw new Error("Use a positive NIM amount with up to 5 decimal places.");
  const [whole, fraction = ""] = s.split(".");
  const n = Number(whole) * LUNA + Number(fraction.padEnd(5, "0"));
  if (!Number.isSafeInteger(n)) throw new Error("Amount is too large.");
  return n;
}
export const nim = (n: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(n / LUNA);
export const normalAddress = (s: string) => s.replace(/\s/g, "").toUpperCase();
export function validAddress(s: string): boolean {
  const a = normalAddress(s);
  if (!/^NQ\d{2}[0-9A-HJ-NP-VXY]{32}$/.test(a)) return false;
  const digits = (a.slice(4) + a.slice(0, 4))
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  let mod = 0;
  for (const d of digits) mod = (mod * 10 + Number(d)) % 97;
  return mod === 1;
}
export function dateAfter(days: number, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function validDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s
  );
}
export function nextDue(p: Payment): string {
  const d = new Date(`${p.due}T12:00:00Z`);
  if (p.recurrence === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else {
    const day = p.anchorDay || d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    const last = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
    ).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  return d.toISOString().slice(0, 10);
}
export function occurrences(
  plan: Plan,
  days: number,
  now = new Date(),
): Payment[] {
  const end = dateAfter(days, now);
  const result: Payment[] = [];
  for (const payment of plan.payments) {
    if (payment.status === "confirmed") continue;
    let p = payment;
    let i = 0;
    while (p.due <= end && i < 1000) {
      result.push(p);
      if (!payment.recurrence) break;
      const due = nextDue(p);
      i++;
      p = { ...p, id: `${payment.id}:future:${i}`, due };
    }
  }
  return result;
}
export function committed(p: Payment, horizon: number, now = new Date()) {
  return p.status !== "confirmed" && p.due <= dateAfter(horizon, now);
}
export function forecast(
  balance: number,
  plan: Plan,
  candidate?: Payment,
  now = new Date(),
) {
  const others = occurrences(plan, plan.horizon, now).filter(
    (p) => p.id !== candidate?.id,
  );
  const obligations = others.reduce((a, p) => a + p.amount + p.fee, 0);
  const cost = candidate ? candidate.amount + candidate.fee : 0;
  const after = balance - cost;
  return {
    obligations,
    cost,
    after,
    available: after - obligations - plan.reserve,
    reserve: plan.reserve,
    shortfall: Math.max(0, obligations + plan.reserve - after),
  };
}
export function reserveStatus(available: number, reserve: number) {
  return available < 0
    ? "risky"
    : available <= Math.max(LUNA, Math.ceil(reserve * 0.1))
      ? "tight"
      : "covered";
}
export function settlePayment(
  plan: Plan,
  id: string,
  patch: Partial<Payment>,
): Plan {
  const prior = plan.payments.find((p) => p.id === id);
  if (!prior) return plan;
  let payments = plan.payments.map((p) =>
    p.id === id ? { ...p, ...patch } : p,
  );
  if (
    patch.status === "confirmed" &&
    prior.status !== "confirmed" &&
    prior.recurrence
  ) {
    const due = nextDue(prior),
      seriesId = prior.seriesId || prior.id.slice(0, 64);
    const nextId = `${seriesId}:${due}`;
    if (!payments.some((p) => p.id === nextId))
      payments.push({
        ...prior,
        id: nextId,
        seriesId,
        due,
        status: "planned",
        hash: undefined,
        sender: undefined,
        expectedSender: undefined,
        confirmedAt: undefined,
        created: new Date().toISOString(),
      });
    payments = payments.map((p) =>
      p.id === id ? { ...p, recurrence: undefined } : p,
    );
  }
  return validatePlan({ ...plan, payments });
}
export function projection(
  balance: number,
  plan: Plan,
  days: number,
  now = new Date(),
) {
  const rows = occurrences(plan, days, now).sort((a, b) =>
    a.due.localeCompare(b.due),
  );
  let remaining = balance;
  let breach: string | null = balance < plan.reserve ? dateAfter(0, now) : null;
  for (const p of rows) {
    remaining -= p.amount + p.fee;
    if (!breach && remaining < plan.reserve) breach = p.due;
  }
  return {
    total: balance - remaining,
    remaining,
    buffer: remaining - plan.reserve,
    breach,
    count: rows.length,
  };
}
export function validatePlan(input: unknown): Plan {
  if (!input || typeof input !== "object")
    throw new Error("Invalid plan file.");
  const p = input as Plan;
  if (
    p.version !== 1 ||
    !Number.isSafeInteger(p.reserve) ||
    p.reserve < 0 ||
    p.reserve > 1e13 ||
    !Number.isInteger(p.horizon) ||
    p.horizon < 1 ||
    p.horizon > 365 ||
    !Array.isArray(p.payments) ||
    p.payments.length > 2000
  )
    throw new Error("Invalid plan settings.");
  const ids = new Set<string>();
  for (const x of p.payments) {
    if (
      !x ||
      typeof x.id !== "string" ||
      x.id.length > 100 ||
      ids.has(x.id) ||
      typeof x.title !== "string" ||
      !x.title.trim() ||
      x.title.length > 80 ||
      typeof x.recipient !== "string" ||
      !validAddress(x.recipient) ||
      !Number.isSafeInteger(x.amount) ||
      x.amount <= 0 ||
      x.amount > 1e13 ||
      !Number.isSafeInteger(x.fee) ||
      x.fee < 0 ||
      x.fee > 1e13 ||
      typeof x.due !== "string" ||
      !validDate(x.due) ||
      !["essential", "normal"].includes(x.priority) ||
      ![
        "planned",
        "submitting",
        "pending",
        "confirmed",
        "uncertain",
        "failed",
        "mismatch",
      ].includes(x.status) ||
      (x.expectedSender !== undefined &&
        (typeof x.expectedSender !== "string" ||
          !validAddress(x.expectedSender))) ||
      (x.hash !== undefined && !/^[a-f0-9]{64}$/i.test(x.hash)) ||
      (x.recurrence !== undefined &&
        !["weekly", "monthly"].includes(x.recurrence)) ||
      (x.anchorDay !== undefined &&
        (!Number.isInteger(x.anchorDay) ||
          x.anchorDay < 1 ||
          x.anchorDay > 31)) ||
      (x.seriesId !== undefined &&
        (typeof x.seriesId !== "string" || x.seriesId.length > 64)) ||
      (x.recurrence !== undefined && x.due < "2020-01-01")
    )
      throw new Error("Invalid payment in plan.");
    ids.add(x.id);
  }
  // Bound worst-case expansion to retain exact integer arithmetic.
  const maximum = p.payments.reduce(
    (sum, row) => sum + (row.amount + row.fee) * (row.recurrence ? 1000 : 1),
    p.reserve,
  );
  if (!Number.isSafeInteger(maximum) || maximum > Number.MAX_SAFE_INTEGER / 4)
    throw new Error("Plan totals exceed the supported calculation range.");
  return p;
}
export const emptyPlan = (): Plan => ({
  version: 1,
  reserve: 0,
  horizon: 14,
  payments: [],
});
export function demoPlan(): Plan {
  return {
    version: 1,
    reserve: 200 * LUNA,
    horizon: 14,
    payments: [
      {
        id: "demo-1",
        title: "Studio rent",
        amount: 420 * LUNA,
        fee: 0,
        recipient: "NQ07 0000 0000 0000 0000 0000 0000 0000 0000",
        due: dateAfter(2),
        recurrence: "monthly",
        anchorDay: Number(dateAfter(2).slice(-2)),
        priority: "essential",
        status: "planned",
        created: new Date().toISOString(),
      },
      {
        id: "demo-2",
        title: "Design collaborator",
        amount: 230 * LUNA,
        fee: 0,
        recipient: "NQ07 0000 0000 0000 0000 0000 0000 0000 0000",
        due: dateAfter(5),
        priority: "normal",
        status: "planned",
        created: new Date().toISOString(),
      },
      {
        id: "demo-3",
        title: "New equipment",
        amount: 250 * LUNA,
        fee: 0,
        recipient: "NQ07 0000 0000 0000 0000 0000 0000 0000 0000",
        due: dateAfter(10),
        priority: "normal",
        status: "planned",
        created: new Date().toISOString(),
      },
    ],
  };
}
