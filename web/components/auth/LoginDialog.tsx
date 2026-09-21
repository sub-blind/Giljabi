"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bookmark, FileText, Laptop, X } from "lucide-react";
import { beginKakaoLogin } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import styles from "./LoginDialog.module.css";

const benefits = [
  { icon: Bookmark, text: "저장한 코스 다시 보기" },
  { icon: FileText, text: "선택한 코스 계정에 보관" },
  { icon: Laptop, text: "다른 기기에서도 이어보기" },
];

export function LoginDialog() {
  const { loginOpen, loginReturnTo, closeLogin } = useAuth();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!loginOpen) return;
    close.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") closeLogin(); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [loginOpen, closeLogin]);
  if (!loginOpen) return null;
  return <div className={styles.backdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeLogin(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="login-title">
      <button ref={close} className={styles.close} type="button" onClick={closeLogin} aria-label="로그인 안내 닫기"><X size={22} /></button>
      <div className={styles.mark} aria-hidden="true"><span>⌁</span></div>
      <p className={styles.brand}>StoryRoute.</p>
      <h2 id="login-title">내 여행을 저장하고<br />다시 이어가세요</h2>
      <p className={styles.description}>선택한 여행 코스를 계정에 저장해요.</p>
      <ul>{benefits.map(({ icon: Icon, text }) => <li key={text}><Icon size={20} aria-hidden="true" /><span>{text}</span></li>)}</ul>
      <button className={styles.kakao} type="button" onClick={() => beginKakaoLogin(loginReturnTo)}><span aria-hidden="true">●</span>카카오로 시작하기</button>
      <p className={styles.policy}>로그인하기 전에 <Link href="/terms" onClick={closeLogin}>이용약관</Link>과 <Link href="/privacy" onClick={closeLogin}>개인정보처리방침</Link>을 확인해주세요.</p>
      <button className={styles.guest} type="button" onClick={closeLogin}>로그인 없이 계속 둘러보기</button>
    </section>
  </div>;
}
