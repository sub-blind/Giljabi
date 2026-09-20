import type { Metadata } from "next";
import Link from "next/link";

import { AccountPrivacyManager } from "@/components/account/AccountPrivacyManager";
import { SiteFooter } from "@/components/common/SiteFooter";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "계정·개인정보 관리 · StoryRoute",
  description: "StoryRoute 계정과 브라우저의 여행 기록을 확인하고 삭제합니다.",
};

export default function AccountPage() {
  return <div className={styles.page}>
    <header className={styles.header}><Link className={styles.brand} href="/">StoryRoute.</Link><Link className={styles.back} href="/">여행 화면으로 돌아가기</Link></header>
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>내 정보</p><h1>계정·개인정보 관리</h1>
        <p className={styles.lead}>서버 계정과 현재 기기에 저장된 여행 기록을 각각 확인하고 삭제할 수 있습니다.</p>
      </section>
      <AccountPrivacyManager />
      <section className={styles.section}><h2>어떤 정보가 저장되나요?</h2><p>수집 항목, 보유기간, 외부 인프라와 이용자의 권리는 개인정보처리방침에서 확인할 수 있습니다.</p><div className={styles.actions}><Link className={styles.secondary} href="/privacy">개인정보처리방침 보기</Link></div></section>
    </main>
    <SiteFooter />
  </div>;
}
