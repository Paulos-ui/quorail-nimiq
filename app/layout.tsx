import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Quorail | See what a payment leaves behind",
  description:
    "Plan commitments, preview the impact, and pay in NIM inside Nimiq Pay. A considered way to move money.",
  icons: { icon: "/icon.svg", apple: "/icons/icon-192.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Quorail", statusBarStyle: "default" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff9e9",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
