"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { translate, type Language } from "@/lib/translations";
const Context = createContext({ tr: (text: string) => text });
export const useLanguage = () => useContext(Context);
export default function Preferences({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<Language>("en"),
    [theme, setTheme] = useState("system");
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
      document.documentElement.dataset.theme =
        theme === "system" ? (query.matches ? "dark" : "light") : theme;
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
    <Context.Provider value={{ tr }}>
      <div className="preferences-bar">
        <span>QUORAIL</span>
        <label>
          🌐{" "}
          <select
            aria-label="Language"
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
          ◐{" "}
          <select
            aria-label="Appearance"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            {["system", "light", "dark"].map((t) => (
              <option key={t} value={t}>
                {tr(t[0].toUpperCase() + t.slice(1))}
              </option>
            ))}
          </select>
        </label>
      </div>
      {language !== "en" && (
        <p className="language-scope">
          {language === "es"
            ? "Interfaz principal traducida. La guía, los mensajes técnicos y parte del contenido siguen en inglés."
            : language === "de"
              ? "Die Hauptbedienung ist übersetzt. Anleitung, technische Meldungen und einige Inhalte bleiben auf Englisch."
              : "L’interface principale est traduite. Le guide, les messages techniques et certains contenus restent en anglais."}
        </p>
      )}
      {children}
    </Context.Provider>
  );
}
