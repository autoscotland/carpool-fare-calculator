import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: "共乘帳本｜車資分攤計算器",
    description: "把里程、ETC、停車與車輛成本算清楚，讓每趟共乘都公平又不倒貼。",
    manifest: "/manifest.json",
    themeColor: "#0c6048",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "共乘帳本",
      description: "每趟都算得剛剛好",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "共乘帳本社群預覽" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "共乘帳本",
      description: "每趟都算得剛剛好",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" data-theme="system">
      <body>{children}</body>
    </html>
  );
}
