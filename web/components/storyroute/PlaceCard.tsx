import { ImageOff, Plus, Check, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getPlaceImages } from "@/lib/api";
import { categoryLabels, type Place, type PlaceImage } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export function PlacePhoto({ place }: { place: Place }) {
  const [photos, setPhotos] = useState<PlaceImage[]>(place.imageUrl ? [{ imageUrl: place.imageUrl, thumbnailUrl: place.imageUrl, caption: "대표 사진", copyrightCode: null }] : []);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const requestInFlight = useRef(false);
  const pointerStartX = useRef<number | null>(null);
  const visible = photos.filter(photo => !failedUrls.includes(photo.imageUrl));
  const currentIndex = Math.min(index, Math.max(visible.length - 1, 0));

  useEffect(() => () => controller.current?.abort(), []);

  const showNext = async () => {
    if (requestInFlight.current) return;
    const target = visible.length ? currentIndex + 1 : 0;
    if (target < visible.length) { setIndex(target); return; }
    if (!hasMore) return;

    const requestController = new AbortController();
    controller.current = requestController;
    requestInFlight.current = true;
    setLoading(true);
    setError(false);
    let gathered = photos;
    let page = nextPage;
    let more: boolean = hasMore;
    try {
      // 대표 사진만 목록에 실어 검색을 빠르게 유지하고, 넘길 때 추가 사진을 가져온다.
      while (more && gathered.filter(photo => !failedUrls.includes(photo.imageUrl)).length <= target) {
        const result = await getPlaceImages(place.id, page, requestController.signal);
        gathered = [...new Map([...gathered, ...result.images].map(photo => [photo.imageUrl, photo])).values()];
        page = result.page + 1;
        more = result.hasMore;
      }
      if (requestController.signal.aborted) return;
      setPhotos(gathered);
      setNextPage(page);
      setHasMore(more);
      setIndex(Math.min(target, Math.max(gathered.filter(photo => !failedUrls.includes(photo.imageUrl)).length - 1, 0)));
    } catch {
      if (!requestController.signal.aborted) setError(true);
    } finally {
      requestInFlight.current = false;
      if (!requestController.signal.aborted) setLoading(false);
    }
  };

  return <div className={`${styles.photo} ${styles.placeCarousel}`} role="group" tabIndex={0}
    aria-label={`${place.name} 사진: 좌우로 밀거나 화살표를 눌러 넘기세요`}
    onKeyDown={event => { if (event.key === "ArrowRight") { event.preventDefault(); void showNext(); } else if (event.key === "ArrowLeft") { event.preventDefault(); setIndex(current => Math.max(0, current - 1)); } }}
    onPointerDown={event => { pointerStartX.current = event.clientX; }}
    onPointerUp={event => {
      if (pointerStartX.current === null) return;
      const distance = event.clientX - pointerStartX.current;
      pointerStartX.current = null;
      if (distance < -45) void showNext();
      else if (distance > 45) setIndex(current => Math.max(0, current - 1));
    }} onPointerCancel={() => { pointerStartX.current = null; }}>
    {visible[currentIndex] ?
      // 관광 API 이미지 URL은 실행 시점마다 달라질 수 있어 원본 URL로 표시한다.
      // eslint-disable-next-line @next/next/no-img-element
      <img key={visible[currentIndex].imageUrl} src={visible[currentIndex].imageUrl} alt={`${place.name} 사진 ${currentIndex + 1}`} draggable={false}
        loading="lazy" onError={() => setFailedUrls(current => current.includes(visible[currentIndex].imageUrl) ? current : [...current, visible[currentIndex].imageUrl])} /> :
      <div className={styles.photoFallback}><ImageOff size={22} aria-hidden="true" /><span>{loading ? "사진 불러오는 중…" : nextPage === 1 ? "대표 사진이 없어요" : "제공된 사진이 없어요"}</span></div>}
    {visible.length > 0 && <span className={styles.placeCarouselCredit}>ⓒ한국관광공사</span>}
    {currentIndex > 0 && <button className={`${styles.placeCarouselArrow} ${styles.placeCarouselPrevious}`} type="button"
      aria-label={`${place.name} 이전 사진`} disabled={loading} onClick={() => setIndex(current => Math.max(0, current - 1))}><ChevronLeft size={20} aria-hidden="true" /></button>}
    {hasMore || currentIndex < visible.length - 1 ? <button className={`${styles.placeCarouselArrow} ${styles.placeCarouselNext}`} type="button"
      aria-label={`${place.name} 다음 사진`} disabled={loading} onClick={() => { void showNext(); }}><ChevronRight size={20} aria-hidden="true" /></button> : null}
    {(visible.length > 0 || hasMore || loading || error) && <span className={styles.placeCarouselPosition} role="status">
      {loading ? "사진 불러오는 중…" : error ? "사진 조회 실패 · 다시 눌러주세요" : nextPage === 1 ? visible.length ? "사진 더 보기" : "사진 확인" : `${currentIndex + 1} / ${visible.length}${hasMore ? "+" : ""}`}
    </span>}
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
