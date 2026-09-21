import type { Metadata } from "next";

import { Providers } from "@/app/providers";

import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "StoryRoute · 강원도에서 만드는 나의 하루",
  description: "사진과 이야기로 강원도를 발견하고 실제 관광 장소를 골라 나만의 하루 코스를 만들어보세요.",
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
