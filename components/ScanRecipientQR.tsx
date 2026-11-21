"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type BarcodeResult = { rawValue: string };
type BarcodeReader = { detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]> };
type BarcodeConstructor = new (options: { formats: string[] }) => BarcodeReader;
type JsQr = (data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts: string }) => { data: string } | null;
type ScanWindow = Window & { BarcodeDetector?: BarcodeConstructor; jsQR?: JsQr };
let fallbackPromise: Promise<JsQr> | null = null;
function loadFallback(): Promise<JsQr> {
  const w = window as ScanWindow;
  if (w.jsQR) return Promise.resolve(w.jsQR);
  if (!fallbackPromise) fallbackPromise = new Promise<JsQr>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => w.jsQR ? resolve(w.jsQR) : reject(new Error("QR decoder unavailable"));
    script.onerror = () => reject(new Error("QR decoder could not load"));
    document.head.appendChild(script);
  }).catch(error => { fallbackPromise = null; throw error; });
  return fallbackPromise;
}

/** Import only a recipient; QR data never triggers a transfer or trusts a payment amount. */
export function parseRecipientQR(raw: string, network: "NIM" | "USDT"): string | null {
  const value = raw.trim();
  const nimAddress = /^NQ(?:[\s0-9A-Z]{30,45})$/i;
  const evmAddress = /^0x[a-fA-F0-9]{40}$/;
  const address = network === "NIM" ? nimAddress : evmAddress;
  if (address.test(value)) return value;
  try {
    const uri = new URL(value);
    if (network === "NIM" && ["nimiq:", "nimiqpay:"].includes(uri.protocol)) {
      const candidates = [uri.searchParams.get("address"), uri.searchParams.get("recipient"), uri.searchParams.get("to"), uri.pathname.replace(/^\/+/, ""), uri.hostname];
      for (const candidate of candidates) {
        if (!candidate) continue;
        const decoded = decodeURIComponent(candidate.replace(/^pay\//i, ""));
        if (nimAddress.test(decoded)) return decoded;
      }
    }
    if (network === "USDT" && uri.protocol === "ethereum:") {
      const recipient = uri.pathname.split("@")[0].split("/")[0];
      const chain = uri.pathname.match(/@(\d+)/)?.[1];
      return chain === "137" && evmAddress.test(recipient) && !uri.pathname.includes("/") ? recipient : null;
    }
  } catch { /* Unrecognized URI. */ }
  return null;
}
export default function ScanRecipientQR({ network, onRecipient }: { network: "NIM" | "USDT"; onRecipient: (address: string) => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(onRecipient);
  callback.current = onRecipient;
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const element = video.current;
    setCameraReady(false);
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setMessage("Camera access is unavailable in this browser. Open Quorail in a secure browser or paste QR contents below."); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stopped || !element) { stream.getTracks().forEach(t => t.stop()); return; }
        element.srcObject = stream;
        await element.play();
        if (stopped) return;
        setCameraReady(true);
        setMessage("Point your camera at the recipient QR code.");
        const Detector = (window as ScanWindow).BarcodeDetector;
        let detect: () => Promise<string | null>;
        if (Detector) {
          const reader = new Detector({ formats: ["qr_code"] });
          detect = async () => (await reader.detect(element))[0]?.rawValue ?? null;
        } else {
          // Fallback for browsers and in-app webviews without BarcodeDetector.
          const decode = await loadFallback();
          if (stopped) return;
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("Camera frames cannot be decoded here");
          detect = async () => {
            if (!element.videoWidth || !element.videoHeight) return null;
            const scale = Math.min(1, 720 / element.videoWidth);
            canvas.width = Math.max(1, Math.round(element.videoWidth * scale));
            canvas.height = Math.max(1, Math.round(element.videoHeight * scale));
            context.drawImage(element, 0, 0, canvas.width, canvas.height);
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            return decode(frame.data, frame.width, frame.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
          };
        }
        let lastInvalid = "";
        const scan = async () => {
          if (stopped || !element) return;
          try {
            const raw = await detect();
            if (raw) {
              const recipient = parseRecipientQR(raw, network);
              if (recipient) { callback.current(recipient); setOpen(false); return; }
              if (raw !== lastInvalid) { lastInvalid = raw; setMessage(`QR detected, but it does not contain a supported ${network} recipient. No payment was started.`); }
            }
          } catch { /* A frame may be unreadable. Keep scanning. */ }
          if (!stopped) timer = setTimeout(() => void scan(), 250);
        };
        void scan();
      } catch (error) {
        if (stopped) return;
        const reason = error instanceof Error ? error.name : "";
        setMessage(reason === "NotAllowedError" ? "Camera permission denied. Allow camera access in your browser settings, or paste QR contents." : "Camera or QR decoding is unavailable here. Try a supported browser, or paste QR contents below.");
      }
    };
    void start();
    return () => { stopped = true; if (timer) clearTimeout(timer); if (element) element.srcObject = null; stream?.getTracks().forEach(t => t.stop()); };
  }, [open, network, retry]);
  const apply = () => {
    const recipient = parseRecipientQR(manual, network);
    if (!recipient) { setMessage(`Enter a valid ${network} address or supported payment QR URI.`); return; }
    onRecipient(recipient); setOpen(false); setManual("");
  };
  return <div className="qr-recipient-control">
    <button type="button" className="qr-scan-button" onClick={() => { setMessage(""); setOpen(true); }}><Camera size={17}/> Scan recipient QR</button>
    {open && <div className="qr-scan-panel"><div className="qr-scan-heading"><strong>Scan {network} recipient</strong><button type="button" aria-label="Close QR scanner" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <div className="qr-camera-frame"><video ref={video} autoPlay muted playsInline controls={false} disablePictureInPicture className="qr-camera" aria-label="Live QR camera preview" />{!cameraReady && <div className="qr-camera-overlay">Waiting for camera permission…</div>}</div>
      {!cameraReady && <button type="button" className="qr-camera-retry" onClick={() => { setMessage(""); setRetry(v => v + 1); }}>Retry camera</button>}
      <p role="status" className="helper">{message || "Only the recipient is imported. Verify the address before approving in your wallet."}</p>
      <label>Or paste QR contents<input value={manual} onChange={e => setManual(e.target.value)} placeholder={network === "NIM" ? "NQ… or nimiq:…" : "0x…"}/></label>
      <button type="button" className="button outline" onClick={apply}>Use recipient</button>
    </div>}
  </div>;
}
