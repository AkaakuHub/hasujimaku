import type { Metadata } from "next";
import "./globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";

const siteName: string = "活動記録 字幕ジェネレーター";
const description: string = "活動記録の字幕風の画像を作成することができるサイトです。";
const url: string = process.env.NEXT_PUBLIC_BASE_URL || "";
const googleSearchConsole: string = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CONSOLE || "";

const googleAnalyticsId: string = process.env.NEXT_PUBLIC_GA_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: siteName,
  description,
  keywords: ["蓮ノ空 字幕", "活動記録 ジェネレーター", "活動記録 字幕ジェネレーター", "蓮ノ空女学院", "蓮ノ空女学院 ジェネレーター"],
  openGraph: {
    title: siteName,
    description,
    url,
    siteName,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: `${url}/ogp_default.png`,
        width: 1200,
        height: 630,
        alt: "活動記録 字幕ジェネレーター",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: [
      {
        url: `${url}/ogp_default.png`,
        width: 1200,
        height: 630,
        alt: "活動記録 字幕ジェネレーター",
      },
    ],
    site: "@",
    creator: "@",
  },
  verification: {
    google: googleSearchConsole,
  },
  alternates: {
    canonical: url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <GoogleAnalytics gaId={googleAnalyticsId} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
