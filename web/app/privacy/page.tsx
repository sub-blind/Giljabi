import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/common/SiteFooter";
import { PRIVACY_CONTACT_EMAIL } from "@/lib/privacy-contact";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "개인정보처리방침 · StoryRoute",
  description: "StoryRoute가 처리하는 개인정보와 이용자의 권리를 안내합니다.",
};

export default function PrivacyPage() {
  const email = PRIVACY_CONTACT_EMAIL;
  return <div className={styles.page}>
    <header className={styles.header}><Link className={styles.brand} href="/">StoryRoute.</Link><Link className={styles.back} href="/">여행 화면으로 돌아가기</Link></header>
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>서비스 정책</p>
        <h1>개인정보처리방침</h1>
        <p className={styles.lead}>StoryRoute는 로그인과 계정별 코스 저장에 필요한 최소한의 정보만 처리합니다. 로그인하지 않아도 여행 검색과 브라우저 저장 기능을 이용할 수 있습니다.</p>
        <span className={styles.effective}>시행일 2026년 9월 30일 · 문의처 갱신 2026년 10월 8일</span>
      </section>
      <nav className={styles.toc} aria-label="개인정보처리방침 목차">
        <a href="#purpose">처리 목적과 항목</a><a href="#ai">선택 AI 기능</a><a href="#retention">보유·삭제</a><a href="#storage">브라우저 저장</a><a href="#infrastructure">국외 처리</a><a href="#rights">이용자 권리</a>
      </nav>
      <section className={styles.section} id="purpose">
        <h2>1. 처리 목적과 개인정보 항목</h2>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>구분</th><th>처리 항목</th><th>목적</th></tr></thead>
          <tbody>
            <tr><td>카카오 로그인</td><td>카카오가 앱별로 발급한 사용자 식별값, 닉네임(선택 동의)</td><td>회원 식별, 로그인 상태 유지, 화면에 닉네임 표시</td></tr>
            <tr><td>확인 기록</td><td>약관·방침 버전, 확인 시각, 만 14세 이상 확인 시각</td><td>가입 안내 확인 기록. 생년월일·신분증은 수집하지 않음</td></tr>
            <tr><td>로그인 세션</td><td>세션 식별값, 갱신 토큰의 해시, 만료·폐기 시각</td><td>안전한 로그인 유지와 로그아웃 처리</td></tr>
            <tr><td>계정에 저장한 코스</td><td>코스 제목, 지역·장소 유형·키워드 등의 여행 조건, 관광 장소 식별값과 순서</td><td>다른 기기에서 저장한 코스 조회·복원</td></tr>
            <tr><td>서비스 접속</td><td>IP 주소, 브라우저·기기 정보, 접속 시각, 오류 기록이 호스팅 사업자의 운영 로그에 생성될 수 있음</td><td>서비스 제공, 장애 대응, 보안 점검</td></tr>
          </tbody>
        </table></div>
        <p className={styles.notice}>계정 서비스 제공에 필요한 식별·세션·코스 정보를 처리합니다. 계정 가입과 선택 AI 기능은 만 14세 이상에게 제공합니다. 법정대리인 동의 절차는 지원하지 않습니다. 카카오 비밀번호와 카카오 액세스 토큰은 StoryRoute 데이터베이스에 저장하지 않습니다. 이메일과 프로필 사진도 서비스 회원 정보로 저장하지 않습니다. 선택한 닉네임 조회 시 카카오의 프로필 묶음 응답에 사진 주소가 포함될 수 있으나 추출하거나 보관하지 않습니다. 코스 제목·검색 조건에 이름·연락처·건강정보를 적지 마세요.</p>
      </section>
      <section className={styles.section} id="ai">
        <h2>2. 선택 AI 기능과 국외 전송</h2>
        <p>문장 입력 화면의 AI 체크는 처음에 꺼져 있습니다. 선택한 경우에만 아래 정보를 OpenAI로 전송합니다. 카카오 식별값·토큰·방문 기록·메모는 AI 요청에 넣지 않습니다.</p>
        <ul>
          <li><strong>이전받는 자·국가:</strong> OpenAI OpCo, LLC · 미국. 연락·권리 요청은 <a className={styles.link} href="https://privacy.openai.com/" target="_blank" rel="noopener noreferrer">OpenAI 개인정보 요청 창구</a>에서 확인할 수 있습니다.</li>
          <li><strong>항목·목적:</strong> 여행 문장 원문은 검색 조건 해석에, 검색 키워드·선호 조건과 공식 장소 소개는 코스 설명의 원문 근거 선택에 사용합니다. 원문에 적은 개인정보도 전송될 수 있으므로 이름·연락처·계정정보·건강정보를 입력하지 마세요.</li>
          <li><strong>시기·방법:</strong> AI를 선택한 화면에서 여행 조건 확인 또는 코스 생성·장소 교체를 요청할 때 서버가 HTTPS로 전달합니다.</li>
          <li><strong>보유기간:</strong> StoryRoute 회원 DB에는 여행 문장 원문을 저장하지 않습니다. API 응답 저장은 끄지만 OpenAI 악용 방지 로그에는 원문과 응답이 기본 최대 30일 보관될 수 있고 법령상 의무 등 예외가 적용될 수 있습니다. 모델에 따라 임시 프롬프트 캐시가 최대 24시간 유지될 수 있습니다. <a className={styles.link} href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer">OpenAI 보관 정책</a>을 확인해주세요.</li>
          <li><strong>거부·철회:</strong> 체크하지 않거나 체크를 해제하면 이후 요청에서 AI로 전송하지 않습니다. 지도·사진 검색, 기본 문장 조건 정리와 코스 생성은 계속 이용할 수 있습니다. 이미 전송한 정보의 삭제는 아래 비공개 개인정보 문의 경로로 요청하며 외부 제공처의 보관 조건이 적용됩니다.</li>
        </ul>
        <p>AI 선택은 저장 코스에 보관하지 않습니다. 새로고침하거나 저장 코스를 다시 열면 AI 전송 없이 장소를 확인합니다. API 데이터는 OpenAI의 기본 정책상 모델 학습에 사용되지 않지만 외부 보관이 전혀 없다는 뜻은 아닙니다.</p>
      </section>
      <section className={styles.section} id="retention">
        <h2>3. 처리 및 보유기간</h2>
        <ul>
          <li>회원 정보·확인 기록·계정 코스: 탈퇴 시 운영 DB 행을 연쇄 삭제합니다. 개별 코스도 계정 화면에서 삭제할 수 있습니다.</li>
          <li>로그인 세션: 기본 갱신 유효기간은 발급 후 14일이며 갱신 시 새 세션을 발급합니다. 로그아웃·갱신 시 기존 세션은 즉시 사용 불가로 만들고 폐기·만료 행은 서버 시작 및 실행 중 매시간 정리합니다. 서버 중단·DB 장애 동안 지연되면 다음 실행에서 재시도합니다. 탈퇴 시 모든 세션을 함께 삭제합니다.</li>
          <li>카카오 로그인 요청 확인용 임시 쿠키: 최대 10분</li>
          <li>호스팅 런타임 로그: 현재 무료 요금제 기준 Vercel은 1시간, Render는 7일입니다. 제공처의 별도 보안·지원 기록과 빌드 로그는 이 기간과 다를 수 있습니다. 앱은 요청 본문·비밀 값을 로그로 출력하지 않습니다.</li>
          <li>DB 복구본: 운영 DB에서 삭제한 정보가 Neon의 시점 복구 기록에 일시적으로 남을 수 있습니다. 실제 프로젝트의 복구 보관기간은 운영자가 확인 중입니다. 모든 복구본까지 즉시 삭제된다고 안내하지 않으며 일반 서비스 조회에 사용하지 않습니다.</li>
        </ul>
      </section>
      <section className={styles.section} id="storage">
        <h2>4. 쿠키와 브라우저 저장소</h2>
        <p>인증 쿠키는 HttpOnly·SameSite=Lax를 적용하고 운영 HTTPS에서 Secure를 사용합니다. 접근 쿠키 기본 유효기간은 15분입니다. 로그인하지 않고 저장한 코스, 방문 완료 표시, 장소별 메모는 현재 브라우저의 로컬 저장소에만 남으며 서버 계정과 자동으로 동기화되지 않습니다.</p>
        <p>방문 완료는 직접 누른 표시이며 GPS 위치 인증이 아닙니다. 로컬 기록은 기기 기록 삭제·회원 탈퇴·브라우저 저장소 삭제 시 지워집니다. 쿠키를 차단하면 로그인을 이용할 수 없고, 브라우저 저장소를 지우면 해당 기기에 보관한 코스와 여행 기록이 삭제됩니다.</p>
      </section>
      <section className={styles.section} id="infrastructure">
        <h2>5. 외부 인프라와 국외 처리</h2>
        <p>StoryRoute는 개인정보를 판매하거나 광고 사업자에게 제공하지 않습니다. 계정 서비스 제공에 필요한 웹·API·DB 처리를 다음 사업자에 위탁하며 국외 처리 사실을 방침과 로그인 안내에서 공개합니다. 각 웹 요청·로그인·저장 시 HTTPS 또는 암호화된 DB 연결로 전송합니다.</p>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>사업자</th><th>이용 목적</th><th>처리될 수 있는 정보</th></tr></thead>
          <tbody>
            <tr><td>Vercel Inc. · 미국</td><td>웹 화면 제공과 API 요청 전달</td><td>접속 정보, 요청 쿠키와 운영 로그</td></tr>
            <tr><td>Render Services, Inc. · 미국</td><td>API 서버 운영과 로그인 처리</td><td>로그인 세션, 접속 정보와 운영 로그</td></tr>
            <tr><td>Neon, Inc. · 싱가포르</td><td>PostgreSQL 데이터베이스 운영</td><td>회원 식별값·선택 닉네임·확인 기록·세션 해시·계정 코스</td></tr>
            <tr><td>Kakao Corp.</td><td>카카오 로그인과 외부 지도·길찾기 제공</td><td>카카오 로그인 요청, 사용자가 외부 서비스로 이동할 때의 요청 정보</td></tr>
          </tbody>
        </table></div>
        <p>Vercel의 현재 서버 함수는 미국 워싱턴 DC, Render API는 미국 서부, Neon DB는 싱가포르입니다. Vercel의 정적 콘텐츠·네트워크 요청은 글로벌 CDN을 거칠 수 있습니다. 보유기간은 위 보유·삭제 안내를 따르며 제공처 연락처는 <a className={styles.link} href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel</a>, <a className={styles.link} href="https://render.com/privacy" target="_blank" rel="noopener noreferrer">Render</a>, <a className={styles.link} href="https://neon.com/privacy-policy" target="_blank" rel="noopener noreferrer">Neon 개인정보 안내</a>에서 확인할 수 있습니다.</p>
        <p className={styles.notice}>계정의 국외 처리를 원하지 않으면 로그인·계정 저장을 이용하지 않거나 계정을 삭제할 수 있습니다. 웹 접속 자체도 국외 호스팅을 거치므로 국외 접속 처리를 원하지 않으면 사이트 이용을 중단해주세요. 선택 AI 전송은 별도로 거부할 수 있습니다.</p>
        <p>한국관광공사 API에는 지역·검색어·장소 정보를 요청하므로 검색 조건에 개인정보를 넣지 마세요. 카카오모빌리티에는 관광 장소의 제공 좌표를 전달하며 이용자의 GPS·계정 식별값을 보내지 않습니다. 외부 카카오맵을 열면 해당 서비스 정책이 적용됩니다. 지도 배경은 OpenStreetMap 타일 서버에 직접 요청하므로 IP·브라우저 요청 정보가 제공처에 전달됩니다. <a className={styles.link} href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">OpenStreetMap 개인정보 안내</a></p>
      </section>
      <section className={styles.section} id="rights">
        <h2>6. 이용자의 권리와 행사 방법</h2>
        <p>로그인한 이용자는 계정과 계정에 저장한 모든 코스를 직접 삭제할 수 있습니다. 현재 기기에 저장한 코스·방문·메모는 별도로 삭제할 수 있고, 회원 탈퇴 시에도 함께 지워집니다. 서비스 화면에서 삭제한 정보는 복구할 수 없습니다. 외부 운영 로그·복구본은 위 보관 조건이 적용됩니다.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/account">계정·개인정보 관리</Link><a className={styles.secondary} href={`mailto:${email}`}>비공개 개인정보 문의</a></div>
        <h3>개인정보 보호 담당</h3>
        <p>담당: StoryRoute 운영자. 열람·정정·삭제·처리정지 요청을 접수합니다.</p>
        <p>문의 이메일: <a className={styles.link} href={`mailto:${email}`}>{email}</a><br />비밀번호·인증 토큰·신분증을 첨부하지 마세요.</p>
        <p>개인정보 침해 상담은 개인정보침해 신고센터(국번 없이 118), 분쟁 조정은 개인정보분쟁조정위원회(1833-6972)를 이용할 수 있습니다.</p>
      </section>
      <section className={styles.section}>
        <h2>7. 방침 변경</h2>
        <p>처리 항목이나 서비스 구조가 바뀌면 이 방침을 수정하고 시행일을 함께 표시합니다. 선택 AI 전송은 최신 안내 버전에만 적용하며 이전 선택을 자동 승계하지 않습니다.</p>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
