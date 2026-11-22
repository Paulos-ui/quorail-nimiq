"use client";
import Localized from "@/components/Localized";

import { useEffect, useState } from "react";
import { encryptBackup } from "@/lib/secure-backup";
import type { Plan } from "@/lib/finance";
import { downloadPlan, storageKey } from "@/lib/storage";
export default function BackupCard({
  plan,
  network,
  address,
}: {
  plan: Plan;
  network: string;
  address: string;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [last, setLast] = useState("");
  const key = storageKey(network, address) + ":last-export";
  useEffect(() => {
    try {
      setLast(localStorage.getItem(key) || "");
    } catch {
      setLast("");
    }
  }, [key]);
  return (
    <section className="backup-card">
      <b>
        <Localized text={"Keep a copy of your plan."} />
      </b>
      <p>
        {" "}
        <Localized
          text={
            "Plans stay in this browser. Export before clearing browser data or moving devices. A CSV receipt list does not restore your full plan."
          }
        />{" "}
      </p>
      <small>
        <Localized
          text={
            last
              ? `Last export requested: ${new Date(last).toLocaleString()}. Check that the file was saved.`
              : "No backup export recorded on this device."
          }
        />
      </small>
      <br />
      <button
        className="button outline"
        onClick={() => {
          downloadPlan(plan, network, address);
          const time = new Date().toISOString();
          setLast(time);
          try {
            localStorage.setItem(key, time);
          } catch {}
        }}
      >
        {" "}
        <Localized text={"Export full JSON backup"} />{" "}
      </button>
      <details className="secure-backup">
        <summary>
          <Localized text={"Password-protected backup"} />
        </summary>
        <p>
          {" "}
          <Localized
            text={
              "Encrypt your downloaded file with a separate password. This does not encrypt browser storage. Keep the password safely: Quorail cannot recover it."
            }
          />{" "}
        </p>
        <label>
          {" "}
          <Localized text={"Backup password (12 characters minimum)"} />{" "}
          <input
            type="password"
            autoComplete="new-password"
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="button dark"
          disabled={busy || password.length < 12}
          onClick={async () => {
            setBusy(true);
            setNotice("");
            try {
              const data = await encryptBackup(
                { network, address, plan },
                password,
              );
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(data)], { type: "application/json" }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "quorail-encrypted-backup.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              const time = new Date().toISOString();
              setLast(time);
              try {
                localStorage.setItem(key, time);
              } catch {}
              setPassword("");
              setNotice(
                "Encrypted download requested. Keep the file and password separately.",
              );
            } catch (e) {
              setNotice(e instanceof Error ? e.message : "Backup failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Localized
            text={busy ? "Encrypting…" : "Download encrypted backup"}
          />
        </button>
        <p role="status">{notice}</p>
      </details>
      <p className="helper">
        {" "}
        <Localized
          text={
            "Restore through Planning settings using the same account and network. Import preserves existing records and rechecks imported payment attempts."
          }
        />{" "}
      </p>
    </section>
  );
}
