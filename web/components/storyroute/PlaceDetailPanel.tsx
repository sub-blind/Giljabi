import { useCallback, useEffect, useRef, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { getPlace, getPlaceImages } from "@/lib/api";
import { categoryLabels, type Place, type PlaceImage } from "@/lib/storyroute/types";
import { PlaceGallery } from "./PlaceGallery";
import { RelatedPanel, StoryPanel } from "./PlaceContent";
import { AccessibilityPanel } from "./AccessibilityPanel";
import styles from "./StoryRoute.module.css";

export type DetailTab = "intro" | "story" | "related" | "access";

export function PlaceDetailPanel({ id, initialTab = "intro", onClose, onCandidate }: { id: string; initialTab?: DetailTab; onClose: () => void; onCandidate: (place: Place) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<DetailTab>(initialTab);
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [imagePage, setImagePage] = useState(0);
  const [hasMoreImages, setHasMoreImages] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState("");
  const imageController = useRef<AbortController | null>(null);
  const loadImages = useCallback((page: number, controller = imageController.current) => {
    if (!controller || controller.signal.aborted) return;
    setImageLoading(true);
    setImageError("");
    void getPlaceImages(id, page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setImages(current => page === 1 ? result.images : [...current, ...result.images]);
      setImagePage(result.page);
      setHasMoreImages(result.hasMore);
    }).catch(() => { if (!controller.signal.aborted) setImageError("추가 사진 조회 실패"); })
      .finally(() => { if (!controller.signal.aborted) setImageLoading(false); });
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    imageController.current = controller;
    const current = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    current?.showModal();
    getPlace(id, controller.signal).then(result => { if (!controller.signal.aborted) setPlace(result); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    loadImages(1, controller);
    return () => { controller.abort(); current?.close(); previous?.focus(); };
  }, [id, loadImages]);
  return <dialog className={styles.dialog} ref={dialog} aria-labelledby="detail-heading" onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.row}><h2 id="detail-heading">장소 자세히 보기</h2><button className={styles.iconButton} type="button" aria-label="상세 닫기" onClick={onClose}><X size={20} /></button></div>
    {error ? <p className={styles.warning} role="alert">{error}</p> : !place ? <p className={styles.loading} role="status">실제 장소 정보를 확인하고 있어요…</p> : <>
      <span className={styles.tag}>{categoryLabels[place.category]}</span>
      <h3>{place.name}</h3><p className={styles.address}>{place.address}</p>
      <PlaceGallery place={place} images={images} loading={imageLoading && imagePage === 0} error={imageError}
        hasMore={hasMoreImages} loadingMore={imageLoading && imagePage > 0}
        onMore={() => loadImages(imagePage + 1)} onRetry={() => loadImages(imagePage + 1)} />
      <div className={styles.contentTabs} aria-label="장소 정보 선택">{([{ id: "intro", label: "장소 소개" }, { id: "story", label: "이야기 듣기" }, { id: "related", label: "함께 볼 곳" }, { id: "access", label: "방문 편의정보" }] as const).map(item =>
        <button key={item.id} type="button" className={styles.secondary} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
      {tab === "intro" ? <><p className={styles.overview}>{place.overview || "제공된 소개가 없어요."}</p>
        <section className={styles.visitInfo} aria-labelledby="visit-info-heading"><h4 id="visit-info-heading">방문 전 확인</h4>
          {place.visitInfo.length ? <dl>{place.visitInfo.map(item => <div key={item.key}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl> :
            <p>제공된 운영시간·주차·문의 정보가 없어요. 출발 전에 카카오맵의 최신 정보를 확인해주세요.</p>}
        </section></> : tab === "story" ? <StoryPanel place={place} onIntro={() => setTab("intro")} /> : tab === "related" ? <RelatedPanel place={place} onCandidate={onCandidate} onIntro={() => setTab("intro")} /> : <AccessibilityPanel place={place} onIntro={() => setTab("intro")} />}
      <p className={styles.small}>출처: ⓒ한국관광공사 · 조회 {new Date(place.retrievedAt).toLocaleString("ko-KR")}</p>
      <a className={styles.secondary} href={`https://map.kakao.com/link/search/${encodeURIComponent(place.name + " " + place.address)}`} target="_blank" rel="noopener noreferrer">외부 지도에서 확인 <ExternalLink size={16} aria-hidden="true" /></a>
    </>}
  </dialog>;
}
