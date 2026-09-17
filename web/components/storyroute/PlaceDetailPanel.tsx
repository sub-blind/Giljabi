import { useEffect, useRef, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { getPlace } from "@/lib/api";
import { categoryLabels, type Place } from "@/lib/storyroute/types";
import { PlacePhoto } from "./PlaceCard";
import { RelatedPanel, StoryPanel } from "./PlaceContent";
import { AccessibilityPanel } from "./AccessibilityPanel";
import styles from "./StoryRoute.module.css";

export function PlaceDetailPanel({ id, onClose, onCandidate }: { id: string; onClose: () => void; onCandidate: (place: Place) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"intro" | "story" | "related" | "access">("intro");
  useEffect(() => {
    const controller = new AbortController();
    const current = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    current?.showModal();
    getPlace(id, controller.signal).then(result => { if (!controller.signal.aborted) setPlace(result); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => { controller.abort(); current?.close(); previous?.focus(); };
  }, [id]);
  return <dialog className={styles.dialog} ref={dialog} aria-labelledby="detail-heading" onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.row}><h2 id="detail-heading">장소 자세히 보기</h2><button className={styles.iconButton} type="button" aria-label="상세 닫기" onClick={onClose}><X size={20} /></button></div>
    {error ? <p className={styles.warning} role="alert">{error}</p> : !place ? <p className={styles.loading} role="status">실제 장소 정보를 확인하고 있어요…</p> : <>
      <PlacePhoto key={place.id} place={place} /><span className={styles.tag}>{categoryLabels[place.category]}</span>
      <h3>{place.name}</h3><p className={styles.address}>{place.address}</p>
      <div className={styles.contentTabs} aria-label="장소 정보 선택">{([{ id: "intro", label: "장소 소개" }, { id: "story", label: "이야기 듣기" }, { id: "related", label: "함께 볼 곳" }, { id: "access", label: "방문 편의정보" }] as const).map(item =>
        <button key={item.id} type="button" className={styles.secondary} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
      {tab === "intro" ? <p className={styles.overview}>{place.overview || "제공된 소개가 없어요."}</p> : tab === "story" ? <StoryPanel place={place} onIntro={() => setTab("intro")} /> : tab === "related" ? <RelatedPanel place={place} onCandidate={onCandidate} onIntro={() => setTab("intro")} /> : <AccessibilityPanel place={place} onIntro={() => setTab("intro")} />}
      <p className={styles.small}>확인된 정보: {place.evidence.join(" · ")}</p>
      <p className={styles.small}>출처: ⓒ한국관광공사 · 조회 {new Date(place.retrievedAt).toLocaleString("ko-KR")}</p>
      <a className={styles.secondary} href={`https://map.kakao.com/link/search/${encodeURIComponent(place.name + " " + place.address)}`} target="_blank" rel="noopener noreferrer">외부 지도에서 확인 <ExternalLink size={16} aria-hidden="true" /></a>
    </>}
  </dialog>;
}
