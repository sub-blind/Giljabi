"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Navigation, Play } from "lucide-react";
import { loadJourney, saveJourney, type Journey } from "@/lib/storyroute/journey";
import { directionsLabel, directionsUrl } from "@/lib/storyroute/navigation";
import type { Place } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export function JourneyPanel({ places, onSaveCourse, onDetail, busy }: {
  places: Place[]; onSaveCourse: () => boolean; onDetail: (id: string) => void; busy: boolean;
}) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // 순서 변경으로 방문 기록이 사라지지 않도록 장소 집합으로 저장한다.
  const identity = places.map(place => place.id).sort().join(".");
  useEffect(() => {
    try {
      const saved = loadJourney(identity.split("."));
      setJourney(saved); setDrafts(saved?.notes ?? {}); setError("");
    } catch (err) { setError((err as Error).message); setJourney(null); setDrafts({}); }
    setReady(true);
  }, [identity]);

  function persist(next: Journey, notice: string) {
    try { saveJourney(next); setJourney(next); setError(""); setMessage(notice); }
    catch { setError("여행 기록을 저장하지 못했어요. 브라우저 저장 설정과 공간을 확인해주세요."); }
  }
  function start() {
    if (!onSaveCourse()) return;
    persist({ version: 1, placeIds: places.map(place => place.id), startedAt: new Date().toISOString(), visitedIds: [], notes: {} }, "여행을 시작했어요. 방문한 장소를 직접 체크해주세요.");
  }
  const next = places.find(place => !journey?.visitedIds.includes(place.id));
  const count = journey?.visitedIds.length ?? 0;
  return <section className={styles.journeyPanel} aria-labelledby="journey-heading">
    <div className={styles.row}><div><p className={styles.eyebrow}>{journey ? "여행 중" : "준비한 코스, 이제 출발해요"}</p>
      <h2 id="journey-heading">{journey ? next ? "다음으로 갈 곳" : "오늘의 코스를 다녀왔어요" : "여행 시작하기"}</h2></div>
      {journey && <span className={styles.tag}>{count} / {places.length} 방문</span>}</div>
    {!journey ? <><p className={styles.muted}>코스를 저장하고, 길찾기와 방문 체크를 이어서 사용하세요.</p>
      <button className={`${styles.primary} ${styles.full}`} type="button" disabled={!ready || busy} onClick={start}><Play size={16} aria-hidden="true" />이 코스로 여행 시작</button></> : <>
      <progress className={styles.progress} value={count} max={places.length} aria-label="직접 체크한 방문 진행률" />
      {next ? <div className={styles.nextStop}><Navigation size={24} aria-hidden="true" /><div><strong>{next.name}</strong><p className={styles.address}>{next.address}</p></div>
        <a className={styles.primary} href={directionsUrl(next)} target="_blank" rel="noopener noreferrer">{directionsLabel(next)}<ExternalLink size={15} aria-hidden="true" /></a></div> :
        <p className={styles.muted}>장소별 메모를 남겨두면 저장한 코스에서 다시 볼 수 있어요.</p>}
      <div className={styles.visitList}>{places.map((place, index) => {
        const visited = journey.visitedIds.includes(place.id);
        return <div className={styles.visitItem} key={place.id}>
          <div className={styles.row}><button className={`${styles.visitCheck} ${visited ? styles.visited : ""}`} type="button" aria-pressed={visited} disabled={busy}
            onClick={() => persist({ ...journey, visitedIds: visited ? journey.visitedIds.filter(id => id !== place.id) : [...journey.visitedIds, place.id] }, visited ? "방문 체크를 해제했어요." : `${place.name} 방문을 체크했어요.`)}>
            <span>{visited ? <Check size={16} aria-hidden="true" /> : index + 1}</span>{place.name}<small>{visited ? "방문 완료" : "방문 체크"}</small></button>
            <button className={styles.textButton} type="button" disabled={busy} onClick={() => onDetail(place.id)}>방문 정보</button></div>
          <details className={styles.noteEditor}><summary>메모 {journey.notes[place.id] ? "보기·수정" : "남기기"}</summary>
            <label className={styles.fieldLabel} htmlFor={`note-${place.id}`}>{place.name} 여행 메모</label>
            <textarea id={`note-${place.id}`} value={drafts[place.id] ?? ""} maxLength={500} disabled={busy} placeholder="기억할 것, 좋았던 점, 다음에 참고할 내용을 적어두세요."
              onChange={event => setDrafts({ ...drafts, [place.id]: event.target.value })} />
            <button className={styles.secondary} type="button" disabled={busy} onClick={() => persist({ ...journey, notes: { ...journey.notes, [place.id]: drafts[place.id] ?? "" } }, "여행 메모를 저장했어요.")}>메모 저장</button>
          </details></div>;
      })}</div>
    </>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <p className={styles.small} role="status">{message}</p>
    <p className={styles.small}>방문 체크는 직접 남기는 기록이에요. 길찾기는 카카오맵에서 출발지·이동수단을 확인하세요. 기록은 이 브라우저에만 저장돼요.</p>
    {journey && next && <div className={styles.mobileDock}><div><strong>다음 장소</strong><small>{next.name}</small></div>
      <a className={styles.primary} href={directionsUrl(next)} target="_blank" rel="noopener noreferrer">{directionsLabel(next)}<ExternalLink size={14} aria-hidden="true" /></a></div>}
  </section>;
}
