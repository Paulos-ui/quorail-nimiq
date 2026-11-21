"use client";
import Localized from "@/components/Localized";

import { useEffect, useState } from "react";
export default function ConnectionNotice() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline ? (
    <div className="connection-notice" role="alert">
      {" "}
      <Localized
        text={
          "You are offline. Wallet balances and receipts may be stale. Reconnect before sending or using AI. Your saved local plan remains on this device."
        }
      />{" "}
    </div>
  ) : null;
}
