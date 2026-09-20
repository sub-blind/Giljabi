"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import styles from "@/app/legal.module.css";

function clearDeviceRecords() {
  const prefixes = ["storyroute.day-trip.", "storyroute.journey."];
  const targets: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const name = localStorage.key(index);
    if (name && prefixes.some(prefix => name.startsWith(prefix))) targets.push(name);
  }
  targets.forEach(name => localStorage.removeItem(name));
  sessionStorage.removeItem("storyroute.auth.return-to");
  return targets.length;
}

export function AccountPrivacyManager() {
  const auth = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function clearBrowser() {
    setError("");
    try {
      const count = clearDeviceRecords();
      setMessage(count ? `이 기기의 여행 기록 ${count}개를 삭제했어요.` : "이 기기에 저장된 여행 기록이 없어요.");
    } catch {
      setError("브라우저 저장소를 지우지 못했어요. 브라우저 설정에서 사이트 데이터를 삭제해주세요.");
    }
  }

  async function removeAccount() {
    if (!confirmed || busy) return;
    setBusy(true); setMessage(""); setError("");
    try {
      await auth.deleteAccount();
      let browserMessage = "";
      try { browserMessage = ` 이 기기의 여행 기록 ${clearDeviceRecords()}개도 삭제했어요.`; } catch { browserMessage = " 브라우저 기록은 브라우저 설정에서 별도로 삭제해주세요."; }
      setConfirmed(false);
      setMessage(`계정과 계정에 저장한 코스를 삭제했어요.${browserMessage}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "계정을 삭제하지 못했어요. 다시 로그인한 뒤 시도해주세요.");
    } finally { setBusy(false); }
  }

  return <>
    <section className={styles.section}>
      <h2>현재 로그인 상태</h2>
      {!auth.ready ? <p>로그인 상태를 확인하고 있어요…</p> : auth.authenticated ? <>
        <p><strong>{auth.user?.nickname || "여행자"}</strong> 님의 카카오 로그인 계정이 연결되어 있어요.</p>
        <p>서버에는 카카오 앱별 사용자 식별값, 닉네임, 로그인 세션, 계정에 저장한 코스가 보관될 수 있습니다.</p>
      </> : <><p>현재 로그인한 계정이 없습니다. 로그인하지 않고 만든 기록은 이 브라우저에만 저장됩니다.</p><div className={styles.actions}><Link className={styles.secondary} href="/">여행 화면으로 이동</Link></div></>}
    </section>
    <section className={styles.section}>
      <h2>이 기기의 여행 기록 삭제</h2>
      <p>현재 브라우저에 저장한 코스, 방문 완료 표시와 장소별 메모를 삭제합니다. 계정에 저장한 코스에는 영향을 주지 않습니다.</p>
      <div className={styles.actions}><button className={styles.secondary} type="button" onClick={clearBrowser}>기기 기록 삭제</button></div>
    </section>
    {auth.authenticated && <section className={styles.section}>
      <h2>회원 탈퇴와 서버 정보 삭제</h2>
      <p>회원 정보, 모든 로그인 세션과 계정에 저장한 코스를 즉시 삭제합니다. 삭제 후에는 복구할 수 없습니다.</p>
      <label className={styles.check}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>계정에 저장한 모든 코스가 함께 삭제되며 복구할 수 없음을 확인했습니다.</span></label>
      <div className={styles.actions}><button className={styles.danger} type="button" disabled={!confirmed || busy} onClick={() => void removeAccount()}>{busy ? "삭제 중…" : "계정과 개인정보 삭제"}</button></div>
    </section>}
    {message && <p className={styles.message} role="status">{message}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
  </>;
}
