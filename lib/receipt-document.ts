import { nim, type Payment } from "./finance";
export function receiptData(p: Payment, network: "mainnet" | "testnet") {
  if (
    p.status !== "confirmed" ||
    !p.hash ||
    !/^[a-f0-9]{64}$/i.test(p.hash) ||
    !p.sender
  )
    throw new Error(
      "A confirmed payment with a verified sender and transaction hash is required.",
    );
  return {
    title: p.title,
    amount: nim(p.amount) + " NIM",
    fee: nim(p.fee) + " NIM",
    total: nim(p.amount + p.fee) + " NIM",
    sender: p.sender,
    recipient: p.recipient,
    hash: p.hash,
    network,
    verifiedAt:
      p.confirmedAt && Number.isFinite(Date.parse(p.confirmedAt))
        ? p.confirmedAt
        : null,
  };
}
export type ReceiptData = ReturnType<typeof receiptData>;
export const receiptFields = (r: ReceiptData, tr: (s: string) => string) => [
  [tr("Payment name"), r.title],
  [tr("Network"), r.network],
  [tr("Recipient"), r.recipient],
  [tr("Sender"), r.sender],
  [tr("Transaction fee"), r.fee],
  [tr("Total sent including fee"), r.total],
  [
    tr("Verified by Quorail"),
    r.verifiedAt ? new Date(r.verifiedAt).toISOString() : tr("Not recorded"),
  ],
  [tr("Transaction hash"), r.hash],
];
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function receiptHtml(
  r: ReceiptData,
  tr: (s: string) => string,
  lang: string,
  explorer: string,
) {
  return `<!doctype html><html lang="${escape(lang)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quorail · ${escape(tr("Payment receipt"))}</title><style>body{font:16px/1.6 system-ui;background:#f7f3e8;color:#211d32;margin:0;padding:24px}main{max-width:650px;margin:auto;background:white;border:1px solid #ddd3b8;border-radius:24px;padding:32px}h1{font-size:24px}h2{font-size:40px;margin:20px 0}dt{font-size:12px;color:#666;margin-top:20px}dd{margin:3px 0;overflow-wrap:anywhere}small{color:#666}a{color:#6543b3}footer{border-top:1px dashed #aaa;margin-top:24px;padding-top:16px}@media print{body{background:white;padding:0}main{border:0;padding:16px}}</style><main><b>QUORAIL</b><h1>${escape(tr("Payment receipt"))}</h1><p>✓ ${escape(tr("Confirmed payment"))}</p><h2>${escape(r.amount)}</h2><dl>${receiptFields(
    r,
    tr,
  )
    .map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`)
    .join(
      "",
    )}</dl><footer><a href="${escape(explorer)}">${escape(tr("Inspect on explorer"))}</a><p><small>${escape(tr("This receipt records a successful transaction checked through the configured network service. It is not a tax invoice or an independent finality proof."))}</small></p></footer></main></html>`;
}
