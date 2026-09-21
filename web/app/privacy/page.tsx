import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/common/SiteFooter";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 · StoryRoute",
  description: "StoryRoute가 처리하는 개인정보와 이용자의 권리를 안내합니다.",
};

export default function PrivacyPage() {
  return <div className={styles.page}>
    <header className={styles.header}><Link className={styles.brand} href="/">StoryRoute.</Link><Link className={styles.back} href="/">여행 화면으로 돌아가기</Link></header>
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>서비스 정책</p>
        <h1>개인정보처리방침</h1>
        <p className={styles.lead}>StoryRoute는 로그인과 계정별 코스 저장에 필요한 최소한의 정보만 처리합니다. 로그인하지 않아도 여행 검색과 브라우저 저장 기능을 이용할 수 있습니다.</p>
        <span className={styles.effective}>시행일 2026년 9월 21일</span>
      </section>
      <nav className={styles.toc} aria-label="개인정보처리방침 목차">
        <a href="#purpose">처리 목적과 항목</a><a href="#retention">보유기간</a><a href="#storage">브라우저 저장</a><a href="#infrastructure">외부 인프라</a><a href="#rights">이용자 권리</a>
      </nav>
      <section className={styles.section} id="purpose">
        <h2>1. 처리 목적과 개인정보 항목</h2>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>구분</th><th>처리 항목</th><th>목적</th></tr></thead>
          <tbody>
            <tr><td>카카오 로그인</td><td>카카오가 앱별로 발급한 사용자 식별값, 닉네임(선택 동의)</td><td>회원 식별, 로그인 상태 유지, 화면에 닉네임 표시</td></tr>
            <tr><td>로그인 세션</td><td>세션 식별값, 갱신 토큰의 해시, 만료·폐기 시각</td><td>안전한 로그인 유지와 로그아웃 처리</td></tr>
            <tr><td>계정에 저장한 코스</td><td>코스 제목, 지역·장소 유형·키워드 등의 여행 조건, 관광 장소 식별값과 순서</td><td>다른 기기에서 저장한 코스 조회·복원</td></tr>
            <tr><td>서비스 접속</td><td>IP 주소, 브라우저·기기 정보, 접속 시각, 오류 기록이 호스팅 사업자의 운영 로그에 생성될 수 있음</td><td>서비스 제공, 장애 대응, 보안 점검</td></tr>
          </tbody>
        </table></div>
        <p className={styles.notice}>카카오 비밀번호와 카카오 액세스 토큰은 StoryRoute 데이터베이스에 저장하지 않습니다. 이메일과 프로필 사진도 서비스 회원 정보로 저장하지 않습니다.</p>
      </section>
      <section className={styles.section} id="retention">
        <h2>2. 처리 및 보유기간</h2>
        <ul>
          <li>회원 정보와 계정에 저장한 코스: 회원 탈퇴 시 즉시 삭제</li>
          <li>로그인 세션: 로그아웃·회원 탈퇴 시 폐기하거나 마지막 발급 후 최대 14일</li>
          <li>카카오 로그인 요청 확인용 임시 쿠키: 최대 10분</li>
          <li>관계 법령에 별도의 보존 의무가 생기는 경우에는 해당 기간 동안 분리 보관할 수 있음</li>
        </ul>
      </section>
      <section className={styles.section} id="storage">
        <h2>3. 쿠키와 브라우저 저장소</h2>
        <p>로그인 세션은 자바스크립트에서 읽을 수 없는 보안 쿠키에 저장합니다. 로그인하지 않고 저장한 코스, 방문 완료 표시, 장소별 메모는 현재 브라우저의 로컬 저장소에만 남으며 서버 계정과 자동으로 동기화되지 않습니다.</p>
        <p>쿠키를 차단하면 로그인을 이용할 수 없고, 브라우저 저장소를 지우면 해당 기기에 보관한 코스와 여행 기록이 삭제됩니다.</p>
      </section>
      <section className={styles.section} id="infrastructure">
        <h2>4. 제3자 제공과 외부 인프라</h2>
        <p>StoryRoute는 개인정보를 판매하거나 광고 사업자에게 제공하지 않습니다. 서비스 운영을 위해 다음 클라우드 인프라에서 정보가 처리될 수 있습니다.</p>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>사업자</th><th>이용 목적</th><th>처리될 수 있는 정보</th></tr></thead>
          <tbody>
            <tr><td>Vercel Inc.</td><td>웹 화면 제공과 API 요청 전달</td><td>접속 정보, 요청 쿠키와 운영 로그</td></tr>
            <tr><td>Render Services, Inc.</td><td>API 서버 운영과 로그인 처리</td><td>로그인 세션, 접속 정보와 운영 로그</td></tr>
            <tr><td>Neon, Inc.</td><td>PostgreSQL 데이터베이스 운영</td><td>회원 식별값·닉네임·세션 해시·계정에 저장한 코스</td></tr>
            <tr><td>Kakao Corp.</td><td>카카오 로그인과 외부 지도·길찾기 제공</td><td>카카오 로그인 요청, 사용자가 외부 서비스로 이동할 때의 요청 정보</td></tr>
          </tbody>
        </table></div>
        <p>한국관광공사 관광정보·사진·오디오 API에는 이용자의 계정 개인정보를 전달하지 않습니다.</p>
      </section>
      <section className={styles.section} id="rights">
        <h2>5. 이용자의 권리와 행사 방법</h2>
        <p>로그인한 이용자는 계정과 계정에 저장한 모든 코스를 직접 삭제할 수 있습니다. 현재 기기에 저장한 코스·방문·메모도 별도로 삭제할 수 있습니다. 삭제한 정보는 복구할 수 없습니다.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/account">계정·개인정보 관리</Link><a className={styles.secondary} href="https://github.com/sub-blind/Giljabi/issues/new" target="_blank" rel="noopener noreferrer">운영자 문의</a></div>
        <h3>개인정보 보호 담당</h3>
        <p>담당: StoryRoute 운영자 · 문의 경로: 위 운영자 문의 링크<br />공개 문의에는 카카오 계정 정보, 토큰 등 개인정보를 적지 마세요.</p>
      </section>
      <section className={styles.section}>
        <h2>6. 방침 변경</h2>
        <p>처리 항목이나 서비스 구조가 바뀌면 이 방침을 수정하고 시행일을 함께 표시합니다.</p>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
