import "./globals.css";

export const metadata = {
  title: "İNTİZAM — Komuta Merkezi",
  description: "Askeri disiplin çalışma takip ve not sistemi",
  manifest: "/manifest.json",
  themeColor: "#181c28",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#181c28" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
