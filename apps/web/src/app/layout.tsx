import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHISAN Platform",
  description: "지산페이퍼 통합 비즈니스 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
