import Link from "next/link";

import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return <footer className={styles.footer}>
    <div className={styles.identity}>
      <strong>StoryRoute.</strong>
      <span>당신의 순서로 만드는 하루</span>
    </div>
    <nav className={styles.links} aria-label="서비스 정책과 개인정보 관리">
      <Link href="/privacy">개인정보처리방침</Link>
      <Link href="/terms">이용약관</Link>
      <Link href="/account">계정·개인정보 관리</Link>
    </nav>
    <small>관광 콘텐츠 출처: ⓒ한국관광공사 · 지도: © OpenStreetMap contributors</small>
  </footer>;
}
