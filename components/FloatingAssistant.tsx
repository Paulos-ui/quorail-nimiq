"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import AssistantPanel from "./AssistantPanel";
import { emptyPlan } from "@/lib/finance";
export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <aside className="floating-ai">
      {open && (
        <div
          className="floating-ai-window"
          id="quorail-help"
          role="dialog"
          aria-label="Quorail AI assistant"
          tabIndex={-1}
          ref={panel}
        >
          <div className="floating-ai-head">
            <span>
              <Bot size={19} /> Your planning companion
            </span>
            <button
              className="icon-button"
              aria-label="Close Quorail AI"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <X size={19} />
            </button>
          </div>
          <p className="helper">
            Ask how Quorail works. Your wallet and private plan are not loaded
            on this page.
          </p>
          <AssistantPanel
            plan={emptyPlan()}
            balance={null}
            initialOpen
            compact
            suggestedQuestions={[
              "How does Quorail help before I pay?",
              "How do I open Quorail inside Nimiq Pay?",
              "What is a reserve target?",
            ]}
          />
        </div>
      )}
      <button
        ref={trigger}
        className="ai-launcher"
        aria-controls="quorail-help"
        aria-expanded={open}
        aria-label={open ? "Close Quorail AI" : "Open Quorail AI"}
        onClick={() => setOpen(!open)}
      >
        <Bot size={25} />
        <span>Quorail AI</span>
        <i aria-hidden="true" />
      </button>
    </aside>
  );
}
