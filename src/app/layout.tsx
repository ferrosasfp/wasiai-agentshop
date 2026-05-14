import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WasiAgentShop · Agentic remittances on Kite",
  description:
    "A marketplace where AI agents shop services on behalf of users. Cross-border remittances LATAM settled in PYUSD on Kite Ozone.",
};

const noFlashTheme = `
try {
  var t = localStorage.getItem('was-shop-theme');
  if (t === 'light') document.documentElement.classList.add('light');
} catch(e){}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{ __html: noFlashTheme }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
