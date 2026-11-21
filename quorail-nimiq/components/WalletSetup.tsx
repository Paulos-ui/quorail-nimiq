"use client";
import { useLanguage as useUILanguage } from "./Preferences";
import Localized from "@/components/Localized";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./Preferences";
export default function WalletSetup() {
  const { tr: ui } = useUILanguage();

  const { tr } = useLanguage();
  const [open, setOpen] = useState(false),
    [store, setStore] = useState<"android" | "ios">("android"),
    [url, setUrl] = useState(""),
    [notice, setNotice] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const show = () => {
      setUrl(
        location.pathname.startsWith("/shared")
          ? location.href
          : location.origin + "/console/",
      );
      setNotice("");
      setOpen(true);
    };
    window.addEventListener("quorail-wallet-setup", show);
    return () => window.removeEventListener("quorail-wallet-setup", show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const nodes = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            "button,a[href],input",
          ) || [],
        ).filter((n) => !n.hasAttribute("disabled"));
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [open]);
  if (!open) return null;
  const link =
    store === "android"
      ? "https://play.google.com/store/apps/details?id=com.nimiq.pay"
      : "https://apps.apple.com/app/nimiq-pay/id6471844738";
  return (
    <div
      className="modal-backdrop wallet-setup-backdrop"
      onClick={() => setOpen(false)}
    >
      <div
        ref={panel}
        className="modal wallet-setup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="wallet-setup-title">{tr("Get Nimiq Pay")}</h2>
          <button aria-label={tr("Close")} onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>
        <p>
          {tr(
            "Payments work inside Nimiq Pay. Installing Quorail alone does not connect a wallet.",
          )}
        </p>
        <div className="store-tabs">
          <button
            aria-pressed={store === "android"}
            onClick={() => setStore("android")}
          >
            {" "}
            <Localized text={"Google Play"} />{" "}
          </button>
          <button
            aria-pressed={store === "ios"}
            onClick={() => setStore("ios")}
          >
            {" "}
            <Localized text={"App Store"} />{" "}
          </button>
        </div>
        <img
          className="wallet-download-qr"
          src={`/nimiq-pay-${store}-qr.png`}
          alt={`${store === "android" ? "Google Play" : "App Store"} QR code`}
          width={220}
          height={220}
        />
        <p>{tr("Scan with your phone camera to download Nimiq Pay.")}</p>
        <a
          className="button dark full"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {tr(
            store === "android"
              ? "Download for Android"
              : "Download for iPhone",
          )}
        </a>
        <h3>{tr("Already installed?")}</h3>
        <p>
          {tr(
            "Open Nimiq Pay, go to Mini Apps and add this website using Custom URL.",
          )}
        </p>
        <input aria-label={ui("Quorail URL")} readOnly value={url} />
        <button
          className="button outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setNotice(tr("Copied"));
            } catch {
              setNotice(url);
            }
          }}
        >
          {tr("Copy app URL")}
        </button>
        <p role="status">{notice}</p>
      </div>
    </div>
  );
}
