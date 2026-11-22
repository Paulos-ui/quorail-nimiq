"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { requestToken } from "@/lib/payment-requests";
import { parseRecipientQR } from "@/lib/recipient-qr";

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
    script.integrity = "sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx";
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error("QR decoder could not load"));
    };
    const timeout = setTimeout(fail, 10000);
    script.onload = () => {
      clearTimeout(timeout);
      if (w.jsQR) resolve(w.jsQR);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => { fallbackPromise = null; throw error; });
  return fallbackPromise;
}

function parseScan(raw:string,network:"NIM"|"USDT"|"Request") {
  if(network==="Request") return requestToken(raw,location.origin) ? raw : null;
  return parseRecipientQR(raw,network);
}
export default function ScanRecipientQR({ network, onRecipient }: { network: "NIM" | "USDT" | "Request"; onRecipient: (address: string) => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraState, setCameraState] = useState<"starting" | "ready" | "blocked" | "unavailable">("starting");
  const [retry, setRetry] = useState(0);
  const pendingCamera = useRef<Promise<MediaStream> | null>(null);
  const session = useRef(0);
  const complete = useRef(false);
  const stopCamera = useRef<() => void>(() => {});
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const callback = useRef(onRecipient);
  callback.current = onRecipient;
  const finish = useCallback((recipient?: string) => {
    if (complete.current) return;
    complete.current = true;
    session.current++;
    stopCamera.current();
    setOpen(false);
    if (recipient) callback.current(recipient);
  }, []);
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    session.current++;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const element = video.current;
    const releaseStream = () => {
      if (element) element.srcObject = null;
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
    };
    const cleanup = () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      releaseStream();
    };
    stopCamera.current = cleanup;
    setCameraReady(false);
    setCameraState("starting");
    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        setMessage("Camera access requires a secure page and a browser or wallet that supports it. Upload or paste the QR instead.");
        return;
      }
      if (pendingCamera.current) {
        setCameraState("blocked");
        setMessage("A camera request is still pending. Respond to the browser prompt, then retry or upload a QR screenshot.");
        return;
      }
      try {
        let timedOut = false;
        const request = navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        pendingCamera.current = request;
        const settled = () => { if (pendingCamera.current === request) pendingCamera.current = null; };
        void request.then(settled, settled);
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
        let reader: BarcodeReader | undefined;
        try { if (Detector) reader = new Detector({ formats: ["qr_code"] }); } catch { /* Use the software decoder. */ }
        const softwareDetector = async () => {
          // Fallback for browsers and in-app webviews without BarcodeDetector.
          const decode = await loadFallback();
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("Camera frames cannot be decoded here");
          return async () => {
            if (!element.videoWidth || !element.videoHeight) return null;
            const scale = Math.min(1, 720 / element.videoWidth);
            canvas.width = Math.max(1, Math.round(element.videoWidth * scale));
            canvas.height = Math.max(1, Math.round(element.videoHeight * scale));
            context.drawImage(element, 0, 0, canvas.width, canvas.height);
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            return decode(frame.data, frame.width, frame.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
          };
        };
        detect = reader ? async () => {
          if (element.readyState < 2) return null;
          try { return (await reader.detect(element))[0]?.rawValue ?? null; }
          catch {
            detect = await softwareDetector();
            return stopped ? null : detect();
          }
        } : await softwareDetector();
        let lastInvalid = "";
        const scan = async () => {
          if (stopped || !element) return;
          try {
            const raw = await detect();
            if (stopped) return;
            if (raw) {
              const recipient = parseScan(raw, network);
              if (recipient) { finish(recipient); return; }
              if (raw !== lastInvalid) { lastInvalid = raw; setMessage(`QR detected, but it does not contain a supported ${network} recipient. No payment was started.`); }
            }
          } catch {
            if (!stopped) { cleanup(); setCameraReady(false); setCameraState("unavailable"); setMessage("QR decoding failed. Upload a QR screenshot or paste its contents."); }
          }
          if (!stopped) timer = setTimeout(() => void scan(), 250);
        };
        void scan();
      } catch (error) {
        if (stopped) return;
        releaseStream();
        const reason = error instanceof Error ? error.name : "";
        setCameraReady(false);
        setCameraState(reason === "NotAllowedError" || reason === "PermissionDeniedError" || reason === "TimeoutError" ? "blocked" : "unavailable");
        setMessage(reason === "TimeoutError"
          ? "The browser or wallet has not answered the camera request. Respond to its prompt or use a screenshot."
          : reason === "NotAllowedError" || reason === "PermissionDeniedError"
          ? "Camera access was denied. Check site camera permissions and the browser or wallet’s Android camera permission, or upload a screenshot."
          : reason === "NotFoundError" ? "No camera was found on this device."
          : "The camera or QR decoder could not start. Upload a QR image or paste QR contents instead.");
      }
    };
    void start();
    return () => { session.current++; cleanup(); };
  }, [open, network, retry, finish]);
  const scanImage = async (file?: File) => {
    if (!file) return;
    const attempt = session.current;
    const input = fileInput.current;
    let bitmap: ImageBitmap | undefined;
    try {
      setMessage("Reading QR image…");
      bitmap = await createImageBitmap(file);
      if (attempt !== session.current) return;
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Image decoding unavailable");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const reader = await loadFallback();
      if (attempt !== session.current) return;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const raw = reader(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" })?.data;
      const recipient = raw ? parseScan(raw, network) : null;
      if (!recipient) { setMessage("No supported recipient QR found in this image. Try a clearer screenshot or paste the address."); return; }
      finish(recipient);
    } catch { if (attempt === session.current) setMessage("Could not read that QR image. Try a screenshot or paste the recipient address."); }
    finally { bitmap?.close(); if (input && attempt === session.current) input.value = ""; }
  };
  const apply = () => {
    const recipient = parseScan(manual, network);
    if (!recipient) { setMessage(`Enter a valid ${network} address or supported payment QR URI.`); return; }
    finish(recipient); setManual("");
  };
  return <div className="qr-recipient-control">
    {!open && <button type="button" className="qr-scan-button" onClick={() => { complete.current = false; setMessage(""); setOpen(true); }}><Camera size={17}/> {network==="Request"?"Scan request QR":"Scan recipient QR"}</button>}
    {open && <div className="qr-scan-panel"><div className="qr-scan-heading"><strong>Scan {network} recipient</strong><button type="button" aria-label="Close QR scanner" onClick={() => finish()}><X size={20}/></button></div>
      <div className="qr-camera-frame"><video ref={video} autoPlay muted playsInline controls={false} disablePictureInPicture className="qr-camera" aria-label="Live QR camera preview" />{!cameraReady && <div className="qr-camera-overlay">{cameraState === "starting" ? "Requesting camera permission…" : cameraState === "blocked" ? "Camera permission unavailable" : "Camera unavailable"}</div>}</div>
      {!cameraReady && cameraState !== "starting" && <button type="button" className="qr-camera-retry" onClick={() => { setMessage(""); setRetry(v => v + 1); }}>Retry camera</button>}
      <input ref={fileInput} type="file" accept="image/*" aria-label="Upload recipient QR screenshot" style={{display:"none"}} onChange={event => void scanImage(event.target.files?.[0])} />
      <button type="button" className="qr-camera-retry" onClick={() => fileInput.current?.click()}>Upload QR screenshot instead</button>
      <p role="status" className="helper">{message || "Verify the imported recipient address before approving in your wallet."}</p>
      <label>Or paste QR contents<input value={manual} onChange={e => setManual(e.target.value)} placeholder={network==="Request" ? "Quorail request link" : network === "NIM" ? "NQ… or nimiq:…" : "0x…"}/></label>
      <button type="button" className="button outline" onClick={apply}>Use recipient</button>
    </div>}
  </div>;
}
