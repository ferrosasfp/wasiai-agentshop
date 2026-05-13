import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WasiAgentShop · Agentic remittances on Kite",
  description:
    "An agentic marketplace where AI agents shop services on behalf of users. Showcase: cross-border remittances LATAM settled in PYUSD on Kite Ozone.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
