import { ImageOff, Plus, Check, Info } from "lucide-react";
import { useState } from "react";
import { categoryLabels, type Place } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export function PlacePhoto({ place }: { place: Place }) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.photo}>
    {place.imageUrl && !failed ?
      // 관광 API가 제공한 이미지는 가변적인 주소이므로 원본 URL로 표시한다.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={place.imageUrl} alt={place.name} loading="lazy" onError={() => setFailed(true)} /> :
      <div className={styles.photoFallback}><ImageOff size={22} aria-hidden="true" /><span>제공된 사진이 없어요</span></div>}
  </div>;
}

export function PlaceCard({ place, selected, busy, onPick, onDetail }: {
  place: Place; selected: boolean; busy: boolean; onPick: () => void; onDetail: () => void;
}) {
  return <article className={`${styles.placeCard} ${selected ? styles.selected : ""}`}>
    <PlacePhoto place={place} />
    <div className={styles.placeBody}>
      <span className={styles.tag}>{categoryLabels[place.category]}</span>
      <h3>{place.name}</h3><p className={styles.address}>{place.address}</p>
      <div className={styles.cardActions}>
        <button className={styles.secondary} type="button" onClick={onDetail} disabled={busy} aria-label={`${place.name} 상세 보기`}><Info size={16} aria-hidden="true" />상세</button>
        <button className={selected ? styles.primary : styles.teal} type="button" onClick={onPick} disabled={busy} aria-pressed={selected} aria-label={`${place.name} ${selected ? "선택 해제" : "코스에 담기"}`}>
          {selected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{selected ? "선택됨 · 빼기" : "담기"}
        </button>
      </div>
    </div>
  </article>;
}
