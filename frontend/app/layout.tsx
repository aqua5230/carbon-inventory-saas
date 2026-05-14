import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "碳盤查 SaaS — 溫室氣體盤查系統",
  description: "符合 ISO 14064-1 的台灣中小企業溫室氣體盤查系統",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
