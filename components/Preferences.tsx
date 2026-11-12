"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Sun, Moon, Globe2 } from "lucide-react";
import { translate, type Language } from "@/lib/translations";
const Context = createContext({
  tr: (text: string) => text,
  language: "en" as Language,
  theme: "system",
  resolved: "light",
  setLanguage: (_: Language) => {},
  setTheme: (_: string) => {},
});
export function PreferenceControls() {
  const { tr, language, theme, resolved, setLanguage, setTheme } =
    useLanguage();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  return (
    <div className="preference-controls">
      <button
        className="icon-button theme-toggle"
        aria-label={tr(resolved === "dark" ? "Light" : "Dark")}
        title={tr(resolved === "dark" ? "Light" : "Dark")}
        onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      >
        {resolved === "dark" ? <Moon size={19} /> : <Sun size={19} />}
      </button>
      <details
        className="language-menu"
        ref={menu}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.currentTarget.open = false;
            e.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary aria-label={tr("Language")} title={tr("Language")}>
          <Globe2 size={19} />
        </summary>
        <div className="language-options">
          <label>
            {tr("Language")}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>
          </label>
          <label>
            {tr("Appearance")}
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {["system", "light", "dark"].map((t) => (
                <option key={t} value={t}>
                  {tr(t[0].toUpperCase() + t.slice(1))}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
    </div>
  );
}
export const useLanguage = () => useContext(Context);
export default function Preferences({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<Language>("en"),
    [theme, setTheme] = useState("system"),
    [resolved, setResolved] = useState("light");
  useEffect(() => {
    try {
      const l = localStorage.getItem("quorail-language");
      if (l && ["en", "es", "de", "fr"].includes(l)) setLanguage(l as Language);
      const t = localStorage.getItem("quorail-theme");
      if (t && ["light", "dark", "system"].includes(t)) setTheme(t);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem("quorail-language", language);
    } catch {}
  }, [language]);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const value =
        theme === "system" ? (query.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = value;
      setResolved(value);
    };
    apply();
    query.addEventListener("change", apply);
    try {
      localStorage.setItem("quorail-theme", theme);
    } catch {}
    return () => query.removeEventListener("change", apply);
  }, [theme]);
  const tr = (text: string) => translate(language, text);
  return (
    <Context.Provider
      value={{ tr, language, theme, resolved, setLanguage, setTheme }}
    >
      {children}
    </Context.Provider>
  );
}
