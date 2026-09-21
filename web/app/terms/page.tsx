import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/common/SiteFooter";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "이용약관 · StoryRoute",
  description: "StoryRoute 서비스 이용 조건을 안내합니다.",
};

export default function TermsPage() {
  return <div className={styles.page}>
    <header className={styles.header}><Link className={styles.brand} href="/">StoryRoute.</Link><Link className={styles.back} href="/">여행 화면으로 돌아가기</Link></header>
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>서비스 정책</p><h1>이용약관</h1>
        <p className={styles.lead}>StoryRoute가 제공하는 여행 탐색·코스 저장 기능의 이용 조건과 정보의 한계를 안내합니다.</p>
        <span className={styles.effective}>시행일 2026년 9월 21일</span>
      </section>
      <section className={styles.section}><h2>1. 서비스의 내용</h2><p>StoryRoute는 강원특별자치도의 실제 관광 데이터를 검색하고, 이용자가 최대 세 장소를 골라 당일 코스를 구성하도록 돕습니다. 로그인은 선택 사항이며, 로그인한 이용자는 코스를 계정에 저장할 수 있습니다.</p></section>
      <section className={styles.section}><h2>2. 관광정보와 이동정보</h2><ul><li>관광 장소·사진·오디오·편의정보는 한국관광공사 등 외부 제공처의 데이터를 바탕으로 하며 실제 현장 정보와 다를 수 있습니다.</li><li>자동차 경로와 이동시간은 조회 시점의 예상값입니다. 출발 전 운영시간, 휴무, 예약, 기상, 도로와 주차 상황을 직접 확인해야 합니다.</li><li>StoryRoute의 코스 설명은 여행 선택을 돕기 위한 참고 정보이며 안전·접근 가능 여부를 보장하지 않습니다.</li></ul></section>
      <section className={styles.section}><h2>3. 계정과 저장 정보</h2><p>이용자는 본인의 카카오 계정으로 로그인해야 하며 계정 접근 수단을 안전하게 관리해야 합니다. 저장 코스는 이용자가 삭제하거나 회원 탈퇴할 때까지 제공됩니다. 로그인하지 않고 브라우저에 저장한 기록은 해당 기기의 브라우저 설정에 따라 사라질 수 있습니다.</p></section>
      <section className={styles.section}><h2>4. 금지 행위</h2><ul><li>서비스나 외부 API에 과도한 요청을 보내거나 정상 운영을 방해하는 행위</li><li>타인의 계정 또는 인증 정보를 이용하는 행위</li><li>관광 데이터와 서비스 화면을 관련 법령이나 제공처 이용조건에 위배되게 사용하는 행위</li></ul></section>
      <section className={styles.section}><h2>5. 서비스 변경과 중단</h2><p>외부 API, 무료 호스팅, 데이터 제공처의 상태에 따라 일부 기능이 늦어지거나 일시적으로 중단될 수 있습니다. 데이터 출처 변경, 보안 조치, 오류 수정 등을 위해 기능을 변경할 수 있습니다.</p></section>
      <section className={styles.section}><h2>6. 개인정보와 탈퇴</h2><p>개인정보 처리 내용은 개인정보처리방침에서 확인할 수 있습니다. 계정 삭제 시 회원 정보와 계정에 저장한 코스가 함께 삭제되며 복구할 수 없습니다.</p><div className={styles.actions}><Link className={styles.primary} href="/privacy">개인정보처리방침 보기</Link><Link className={styles.secondary} href="/account">계정·개인정보 관리</Link></div></section>
      <section className={styles.section}><h2>7. 약관 변경과 문의</h2><p>서비스 내용이나 관련 기준이 바뀌면 약관을 수정하고 시행일을 표시합니다. 서비스 관련 문의는 <a className={styles.link} href="https://github.com/sub-blind/Giljabi/issues/new" target="_blank" rel="noopener noreferrer">StoryRoute 운영자</a>에게 전달할 수 있습니다.</p></section>
    </main>
    <SiteFooter />
  </div>;
}
