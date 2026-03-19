import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "원마케팅 클라이언트 포털",
    template: "%s | 원마케팅",
  },
  description: "원마케팅 클라이언트 전용 포털 — 광고 성과 리포트, 일정, 자료실을 한곳에서 확인하세요.",
  metadataBase: new URL("https://www.onemarketing.kr"),
  icons: { icon: "/logo-light.png" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.onemarketing.kr",
    siteName: "원마케팅",
    title: "원마케팅 클라이언트 포털",
    description: "광고 성과 리포트, 일정, 자료실을 한곳에서 확인하세요.",
    images: [
      {
        url: "/logo-light.png",
        width: 1200,
        height: 630,
        alt: "원마케팅 클라이언트 포털",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "원마케팅 클라이언트 포털",
    description: "광고 성과 리포트, 일정, 자료실을 한곳에서 확인하세요.",
    images: ["/logo-light.png"],
  },
  verification: {
    google: "j_QacCWx_Ql7M0qP-FyFILCofahutHtVZj-5eSvp-V4",
  },
  robots: {
    index: false,
    follow: false,
  },
};

/** 모바일에서 100% 스케일로 맞추기 (줌 인된 것처럼 보이는 현상 방지) */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
