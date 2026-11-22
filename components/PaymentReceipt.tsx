"use client";
import { useState } from "react";
import { CheckCircle2, Download, Copy, ExternalLink } from "lucide-react";
import { useLanguage } from "./Preferences";
import type { Payment } from "@/lib/finance";
import {
  receiptData,
  receiptFields,
  receiptHtml,
} from "@/lib/receipt-document";
import { explorerUrl } from "@/lib/wallet";
export default function PaymentReceipt({
  payment,
  network,
}: {
  payment: Payment;
  network: "mainnet" | "testnet";
}) {
  const { tr, language } = useLanguage();
  const [notice, setNotice] = useState("");
  if (payment.status !== "confirmed" || !payment.sender || !payment.hash)
    return null;
  const r = receiptData(payment, network),
    url = explorerUrl(network, r.hash);
  const save = (blob: Blob, extension: string) => {
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `quorail-receipt-${r.hash.slice(0, 12)}.${extension}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 30000);
    setNotice(tr("Receipt download requested. Check your downloads."));
  };
  async function png() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 2100;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error();
      ctx.fillStyle = "#fff9e9";
      ctx.fillRect(0, 0, 1200, 2100);
      ctx.fillStyle = "#211d32";
      let y = 100;
      const line = (text: string, font: string, max = 1040) => {
        ctx.font = font;
        const words = text.split(/\s+/);
        let row = "";
        for (const word of words) {
          let chunks = word.match(/.{1,40}/g) || [""];
          for (const chunk of chunks) {
            const next = row ? row + " " + chunk : chunk;
            if (ctx.measureText(next).width > max && row) {
              ctx.fillText(row, 80, y);
              y += 42;
              row = chunk;
            } else row = next;
          }
        }
        if (row) {
          ctx.fillText(row, 80, y);
          y += 42;
        }
      };
      line("QUORAIL", "bold 40px sans-serif");
      y += 20;
      line(tr("Payment receipt"), "32px sans-serif");
      line(tr("Confirmed payment"), "bold 26px sans-serif");
      y += 25;
      line(r.amount, "bold 64px sans-serif");
      y += 45;
      for (const [label, value] of receiptFields(r, tr)) {
        ctx.fillStyle = "#77716e";
        line(label, "24px sans-serif");
        ctx.fillStyle = "#211d32";
        line(value, "28px monospace");
        y += 22;
      }
      y += 12;
      line(
        tr(
          "Verified through the configured network service. Check the transaction hash in the explorer.",
        ),
        "22px sans-serif",
      );
      const cropped = document.createElement("canvas");
      cropped.width = 1200;
      cropped.height = Math.min(2100, y + 65);
      cropped.getContext("2d")!.drawImage(canvas, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        cropped.toBlob((b) => (b ? resolve(b) : reject(Error())), "image/png"),
      );
      save(blob, "png");
    } catch {
      setNotice(tr("Could not save the image. Try the printable receipt."));
    }
  }
  return (
    <article className="quorail-receipt" aria-label={tr("Payment receipt")}>
      <header>
        <strong className="receipt-brand">quorail</strong>
        <span>
          <CheckCircle2 size={18} />
          {tr("Confirmed payment")}
        </span>
      </header>
      <p className="eyebrow">{tr("Payment receipt")}</p>
      <h2>{r.amount}</h2>
      <p>{r.title}</p>
      <dl>
        {receiptFields(r, tr)
          .filter(([k]) => k !== tr("Payment name"))
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      <p className="helper">
        {tr(
          "This receipt records a successful transaction checked through the configured network service. It is not a tax invoice or an independent finality proof.",
        )}
      </p>
      <div className="receipt-actions">
        <button className="button dark" onClick={png}>
          <Download size={17} />
          {tr("Download receipt image")}
        </button>
        <button
          className="button outline"
          onClick={() =>
            save(
              new Blob([receiptHtml(r, tr, language, url)], {
                type: "text/html;charset=utf-8",
              }),
              "html",
            )
          }
        >
          {tr("Save printable receipt")}
        </button>
        <button
          className="text-link"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(r.hash);
              setNotice(tr("Copied"));
            } catch {
              setNotice(tr("Copy the transaction hash shown above."));
            }
          }}
        >
          <Copy size={16} />
          {tr("Copy transaction hash")}
        </button>
        <a className="text-link" href={url} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          {tr("Inspect on explorer")}
        </a>
      </div>
      <p className="helper">
        {tr(
          "Open the printable file in your browser, then use Print to save a PDF.",
        )}
      </p>
      {notice && (
        <p role="status" className="form-message">
          {notice}
        </p>
      )}
    </article>
  );
}
