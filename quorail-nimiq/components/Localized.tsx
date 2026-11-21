"use client";
import { useLanguage } from "./Preferences";
import type { ReactNode } from "react";
export default function Localized({ text }: { text: ReactNode }) {
  const { tr } = useLanguage();
  return <>{typeof text === "string" ? tr(text) : text}</>;
}
