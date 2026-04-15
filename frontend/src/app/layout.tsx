import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RISKOS Quant — Institutional Risk Intelligence Terminal",
  description: "Agentic Quantitative Risk Intelligence & Stress-Testing Platform for US and Indian Markets",
  icons: {
    icon: "/icon.png"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-main text-text-main font-sans antialiased">{children}</body>
    </html>
  );
}
