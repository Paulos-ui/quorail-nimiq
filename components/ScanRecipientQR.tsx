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
  const [cameraState, setCameraState] = useState<"starting" | "ready" | "blocked" | "unavailable">("starting");
  const [retry, setRetry] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const callback = useRef(onRecipient);
  callback.current = onRecipient;
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const element = video.current;
    setCameraReady(false);
    setCameraState("starting");
    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setCameraState("unavailable"); setMessage("This Nimiq Pay view does not expose secure camera access. Use the QR image option or ask Nimiq Pay to enable camera support for Mini Apps."); return; }
      try {
        // WebView permission requests can remain pending if the host does not
        // implement Android WebChromeClient.onPermissionRequest. A timeout
        // updates the UI, while late camera streams are still stopped safely.
        let timedOut = false;
        const request = navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        const pending = new Promise<never>((_, reject) => {
          timer = setTimeout(() => { timedOut = true; reject(new DOMException("Camera permission did not receive a response", "TimeoutError")); }, 12000);
        });
        request.then(lateStream => { if (timedOut || stopped) lateStream.getTracks().forEach(track => track.stop()); }).catch(() => {});
        stream = await Promise.race([request, pending]);
        if (timer) { clearTimeout(timer); timer = undefined; }
        if (stopped || !element) { stream.getTracks().forEach(t => t.stop()); return; }
        element.srcObject = stream;
        await element.play();
        if (stopped) return;
        setCameraReady(true);
        setCameraState("ready");
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
        setCameraReady(false);
        setCameraState(reason === "NotAllowedError" || reason === "PermissionDeniedError" || reason === "TimeoutError" ? "blocked" : "unavailable");
        setMessage(reason === "TimeoutError"
          ? "Nimiq Pay did not respond to the camera permission request. Its Android WebView may need camera permission support. You can upload a QR image instead."
          : reason === "NotAllowedError" || reason === "PermissionDeniedError"
          ? "Camera permission was denied by Nimiq Pay or Android. Enable camera access for Nimiq Pay in Android Settings, then retry. If it remains blocked, the host app must support WebView camera permission requests."
          : reason === "NotFoundError" ? "No camera was found on this device."
          : "Camera could not start in this Nimiq Pay view. Upload a QR image or paste QR contents instead.");
      }
    };
    void start();
    return () => { stopped = true; if (timer) clearTimeout(timer); if (element) element.srcObject = null; stream?.getTracks().forEach(t => t.stop()); };
  }, [open, network, retry]);
  const scanImage = async (file?: File) => {
    if (!file) return;
    try {
      setMessage("Reading QR image…");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Image decoding unavailable");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const reader = await loadFallback();
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const raw = reader(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" })?.data;
      const recipient = raw ? parseRecipientQR(raw, network) : null;
      if (!recipient) { setMessage("No supported recipient QR found in this image. Try a clearer screenshot or paste the address."); return; }
      callback.current(recipient);
      setOpen(false);
    } catch { setMessage("Could not read that QR image. Try a screenshot or paste the recipient address."); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  };
  const apply = () => {
    const recipient = parseRecipientQR(manual, network);
    if (!recipient) { setMessage(`Enter a valid ${network} address or supported payment QR URI.`); return; }
    onRecipient(recipient); setOpen(false); setManual("");
  };
  return <div className="qr-recipient-control">
    <button type="button" className="qr-scan-button" onClick={() => { setMessage(""); setOpen(true); }}><Camera size={17}/> Scan recipient QR</button>
    {open && <div className="qr-scan-panel"><div className="qr-scan-heading"><strong>Scan {network} recipient</strong><button type="button" aria-label="Close QR scanner" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <div className="qr-camera-frame"><video ref={video} autoPlay muted playsInline controls={false} disablePictureInPicture className="qr-camera" aria-label="Live QR camera preview" />{!cameraReady && <div className="qr-camera-overlay">{cameraState === "starting" ? "Requesting camera permission…" : cameraState === "blocked" ? "Camera permission unavailable" : "Camera unavailable"}</div>}</div>
      {!cameraReady && <button type="button" className="qr-camera-retry" onClick={() => { setMessage(""); setRetry(v => v + 1); }}>Retry camera</button>}
      <input ref={fileInput} type="file" accept="image/*" aria-label="Upload recipient QR screenshot" style={{display:"none"}} onChange={event => void scanImage(event.target.files?.[0])} />
      <button type="button" className="qr-camera-retry" onClick={() => fileInput.current?.click()}>Upload QR screenshot instead</button>
      <p role="status" className="helper">{message || "Only the recipient is imported. Verify the address before approving in your wallet."}</p>
      <label>Or paste QR contents<input value={manual} onChange={e => setManual(e.target.value)} placeholder={network === "NIM" ? "NQ… or nimiq:…" : "0x…"}/></label>
      <button type="button" className="button outline" onClick={apply}>Use recipient</button>
    </div>}
  </div>;
}
