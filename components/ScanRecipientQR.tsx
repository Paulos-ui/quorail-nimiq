"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type BarcodeResult = { rawValue: string };
type BarcodeReader = { detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]> };
type BarcodeConstructor = new (options: { formats: string[] }) => BarcodeReader;

/** QR input never initiates a payment. Recipient is displayed in the ordinary confirmation flow. */
export function parseRecipientQR(raw: string, network: "NIM" | "USDT"): string | null {
  const value = raw.trim();
  const address = network === "NIM" ? /^NQ(?:[\s0-9A-Z]{30,45})$/i : /^0x[a-fA-F0-9]{40}$/;
  if (address.test(value)) return value;
  try {
    const uri = new URL(value);
    if (network === "NIM" && ["nimiq:", "nimiqpay:"].includes(uri.protocol)) {
      const recipient = decodeURIComponent(uri.pathname.replace(/^\/+/, ""));
      return address.test(recipient) ? recipient : null;
    }
    if (network === "USDT" && uri.protocol === "ethereum:") {
      const recipient = uri.pathname.split("@")[0].split("/")[0];
      // Only accept a direct Polygon address, never an arbitrary contract call.
      const chain = uri.pathname.match(/@(\d+)/)?.[1];
      return chain === "137" && address.test(recipient) && !uri.pathname.includes("/") ? recipient : null;
    }
  } catch { /* Not a URI. */ }
  return null;
}
export default function ScanRecipientQR({ network, onRecipient }: { network: "NIM" | "USDT"; onRecipient: (address: string) => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const recipientCallback = useRef(onRecipient);
  recipientCallback.current = onRecipient;
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    setCameraReady(false);
    let stream: MediaStream | null = null;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = async () => {
      const BarcodeDetector = (window as Window & { BarcodeDetector?: BarcodeConstructor }).BarcodeDetector;
      if (!BarcodeDetector) { setMessage("This in-app browser does not support camera QR decoding. Open Quorail in Chrome or paste the QR contents below."); return; }
      if (!navigator.mediaDevices?.getUserMedia) { setMessage("Camera access is unavailable in this browser. Open Quorail in a supported HTTPS browser or paste the QR contents."); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped || !video.current) { stream.getTracks().forEach(track => track.stop()); return; }
        video.current.srcObject = stream;
        try { await video.current.play(); } catch { setMessage("Tap Start camera to enable the live preview, or paste the QR contents below."); return; }
        if (!stopped) setCameraReady(true);
        const reader = new BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (stopped || !video.current) return;
          try {
            const results = await reader.detect(video.current);
            if (results.length) {
              const recipient = parseRecipientQR(results[0].rawValue, network);
              if (recipient) { recipientCallback.current(recipient); setOpen(false); return; }
              setMessage(`QR detected, but it is not a supported ${network} recipient. No payment was started.`);
            }
          } catch { /* Retry frame. */ }
          if (!stopped && frame++ < 1800) timer = setTimeout(scan, 300);
        };
        void scan();
      } catch { setMessage("Camera permission unavailable. Paste the QR contents below."); }
    };
    void start();
    return () => { stopped = true; if (timer) clearTimeout(timer); if (video.current) video.current.srcObject = null; stream?.getTracks().forEach(track => track.stop()); };
  }, [open, network]);
  const apply = () => {
    const recipient = parseRecipientQR(manual, network);
    if (!recipient) { setMessage(`Enter a valid ${network} recipient address or supported QR URI.`); return; }
    onRecipient(recipient); setOpen(false); setManual("");
  };
  return <div className="qr-recipient-control">
    <button type="button" className="qr-scan-button" onClick={() => { setMessage(""); setOpen(true); }}><Camera size={17}/> Scan recipient QR</button>
    {open && <div className="qr-scan-panel"><div className="qr-scan-heading"><strong>Scan {network} recipient</strong><button type="button" aria-label="Close QR scanner" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <div className="qr-camera-frame"><video ref={video} autoPlay muted playsInline controls={false} disablePictureInPicture className="qr-camera" aria-label="Live QR camera preview" />{!cameraReady && <div className="qr-camera-overlay">Camera preview will appear here when access is granted.</div>}</div>
      {!cameraReady && <button type="button" className="qr-camera-retry" onClick={() => { if (video.current?.srcObject) { void video.current.play().then(() => setCameraReady(true)).catch(() => setMessage("Camera playback blocked. Open in Chrome or paste QR contents.")); } else { setOpen(false); requestAnimationFrame(() => setOpen(true)); } }}>Start camera</button>}
      <p className="helper">Only the recipient address is imported. Always verify it before wallet approval.</p>
      <label>Or paste QR contents<input value={manual} onChange={e => setManual(e.target.value)} placeholder={network === "NIM" ? "NQ… or nimiq:…" : "0x…"}/></label>
      <button type="button" className="button outline" onClick={apply}>Use scanned recipient</button>
      {message && <p role="status" className="helper">{message}</p>}
    </div>}
  </div>;
}
