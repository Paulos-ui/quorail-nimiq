"use client";
import Localized from "@/components/Localized";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [help, setHelp] = useState(false),
    [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const ready = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setHelp(false);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", done);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  return (
    <div className="install-control">
      <button
        className="button outline"
        disabled={installed}
        aria-expanded={help}
        onClick={async () => {
          if (prompt) {
            try {
              await prompt.prompt();
              await prompt.userChoice;
            } catch {
              setHelp(true);
            }
            setPrompt(null);
          } else setHelp(!help);
        }}
      >
        <Download size={17} />
        <Localized text={installed ? "App installed" : "Add to your device"} />
      </button>
      {help && (
        <div className="install-help" role="status">
          <b>
            <Localized text={"Keep Quorail one tap away."} />
          </b>
          <p>
            {" "}
            <Localized
              text={
                "Chrome or Edge: open the browser menu and choose Install app. iPhone or iPad: open in Safari, tap Share, then Add to Home Screen. On Mac Safari, choose File, Add to Dock."
              }
            />{" "}
          </p>
          <p>
            {" "}
            <Localized
              text={
                "Inside Nimiq Pay? Open this website in your regular browser to install. Payments still require Nimiq Pay and an internet connection."
              }
            />{" "}
          </p>
        </div>
      )}
    </div>
  );
}
