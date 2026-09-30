"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { beginKakaoLogin } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import styles from "./LoginDialog.module.css";

export function LoginDialog() {
  const { loginOpen, loginReturnTo, closeLogin } = useAuth();
  if (!loginOpen) return null;
  return <LoginDialogContent loginReturnTo={loginReturnTo} closeLogin={closeLogin} />;
}

function LoginDialogContent({ loginReturnTo, closeLogin }: { loginReturnTo: string; closeLogin: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [nickname, setNickname] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLogin();
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = previousOverflow; };
  }, [closeLogin]);
  return <div className={styles.backdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeLogin(); }}>
    <section ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="login-title">
      <button ref={close} className={styles.close} type="button" onClick={closeLogin} aria-label="로그인 안내 닫기"><X size={22} /></button>
      <div className={styles.mark} aria-hidden="true"><span>⌁</span></div>
      <p className={styles.brand}>StoryRoute.</p>
      <h2 id="login-title">내 여행을 저장하고<br />다시 이어가세요</h2>
      <p className={styles.description}>저장한 코스를 다른 기기에서도 다시 열 수 있어요.</p>
      <p className={styles.policy}>계정 제공을 위해 카카오 앱별 식별값·세션·저장 코스를 처리합니다. 웹/API는 미국, 계정 DB는 싱가포르에서 처리됩니다. 항목·이전 시점·보유기간은 <Link href="/privacy#infrastructure" target="_blank">국외 처리 안내</Link>에서 확인해주세요.</p>
      <label className={styles.consent}><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} /><span><Link href="/terms" target="_blank">이용약관</Link>에 동의하고, <Link href="/privacy" target="_blank">개인정보처리방침</Link>을 확인했습니다. <strong>(필수)</strong></span></label>
      <label className={styles.consent}><input type="checkbox" checked={ageConfirmed} onChange={event => setAgeConfirmed(event.target.checked)} /><span>만 14세 이상입니다. <strong>(필수)</strong></span></label>
      <label className={styles.consent}><input type="checkbox" checked={nickname} onChange={event => setNickname(event.target.checked)} /><span>카카오 닉네임을 화면에 표시합니다. (선택)<br />선택하지 않아도 계정 저장을 이용할 수 있어요.</span></label>
      <button className={styles.kakao} type="button" disabled={!agreed || !ageConfirmed} onClick={() => beginKakaoLogin(loginReturnTo, nickname)}><span aria-hidden="true">●</span>카카오로 시작하기</button>
      <p className={styles.policy}>동의하지 않아도 로그인 없이 여행 검색과 이 기기의 브라우저 저장 기능을 이용할 수 있어요. 방문 완료와 메모는 로그인 후에도 다른 기기로 동기화되지 않아요.</p>
      <button className={styles.guest} type="button" onClick={closeLogin}>로그인 없이 계속 둘러보기</button>
    </section>
  </div>;
}
