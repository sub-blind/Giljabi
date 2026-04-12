import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryRoute AI",
  description: "누구나 쉽게 쓰는 여행 추천 웹앱",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased text-slate-900">{children}</body>
    </html>
  );
}
