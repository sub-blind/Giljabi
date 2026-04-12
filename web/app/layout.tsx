import type { Metadata } from "next";

import { Providers } from "@/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Giljabi",
  description: "여행 코스 추천",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="app-viewport">
        <Providers>
          <div className="app-frame">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
