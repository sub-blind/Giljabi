"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Route } from "lucide-react";
import { consumeLoginReturnTo } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./page.module.css";

export default function AuthCallbackPage() {
  const { reload } = useAuth();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status !== "success") { setFailed(true); return; }
    void reload().then(session => {
      if (!session.authenticated) { setFailed(true); return; }
      window.location.replace(consumeLoginReturnTo());
    }).catch(() => setFailed(true));
  }, [reload]);
  return <main className={styles.page}><section className={styles.card}>
    <Route size={34} aria-hidden="true" />
    <p className={styles.brand}>StoryRoute.</p>
    <h1>{failed ? "로그인을 완료하지 못했어요" : "여행을 이어갈 준비 중이에요"}</h1>
    <p>{failed ? "잠시 후 다시 로그인해주세요. 로그인하지 않아도 여행 찾기는 이용할 수 있어요." : "저장한 코스와 로그인 상태를 확인하고 있어요."}</p>
    {failed && <Link href="/">여행 화면으로 돌아가기</Link>}
  </section></main>;
}
