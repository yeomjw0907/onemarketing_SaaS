import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ONEmarketing Client Portal",
  description: "Marketing Agency Client Portal by ONEmarketing",
  icons: { icon: "/logo-light.png" },
};

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
