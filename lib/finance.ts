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
  confirmedAt?: string;
  note?: string;
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
export function committed(p: Payment, horizon: number, now = new Date()) {
  return p.status !== "confirmed" && p.due <= dateAfter(horizon, now);
}
export function forecast(
  balance: number,
  plan: Plan,
  candidate?: Payment,
  now = new Date(),
) {
  const others = plan.payments.filter(
    (p) => p.id !== candidate?.id && committed(p, plan.horizon, now),
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
    p.payments.length > 500
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
      (x.hash !== undefined && !/^[a-f0-9]{64}$/i.test(x.hash))
    )
      throw new Error("Invalid payment in plan.");
    ids.add(x.id);
  }
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
