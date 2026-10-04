import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ImageOff } from "lucide-react";
import type { PlaceImage } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

function ViewerImage({ image, placeName, index }: { image: PlaceImage; placeName: string; index: number }) {
  const sameSource = image.thumbnailUrl === image.imageUrl;
  const [originalReady, setOriginalReady] = useState(sameSource);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [originalFailed, setOriginalFailed] = useState(false);
  const alt = `${placeName} 사진 ${index + 1}`;

  return <>
    {!sameSource && !thumbnailFailed && <>
      {/* 관광 API에서 제공한 작은 이미지를 원본이 열릴 때까지 먼저 보여준다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.photoViewerImage} src={image.thumbnailUrl} alt={alt} onError={() => setThumbnailFailed(true)} />
    </>}
    {!originalFailed && <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${styles.photoViewerImage} ${!originalReady ? styles.photoViewerImagePending : ""}`}
        src={image.imageUrl} alt={sameSource ? alt : ""} onLoad={() => setOriginalReady(true)} onError={() => setOriginalFailed(true)} />
    </>}
    {originalFailed && (sameSource || thumbnailFailed) && <div className={styles.photoViewerUnavailable}><ImageOff size={28} aria-hidden="true" />사진을 열 수 없어요.</div>}
    {!originalReady && !originalFailed && <span className={styles.photoViewerLoading} role="status">큰 사진 불러오는 중…</span>}
  </>;
}

export function PlacePhotoViewer({ placeName, image, index, count, hasMore, loading, error, onPrevious, onNext, onClose }: {
  placeName: string; image: PlaceImage; index: number; count: number; hasMore: boolean;
  loading: boolean; error: boolean; onPrevious: () => void; onNext: () => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const pointerStartX = useRef<number | null>(null);
  useEffect(() => {
    const current = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    current?.showModal();
    closeButton.current?.focus();
    return () => { current?.close(); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);

  const caption = image.caption && !image.caption.includes("_") ? image.caption : `사진 ${index + 1}`;
  const license = image.copyrightCode && ["Type1", "Type2", "Type3", "Type4"].includes(image.copyrightCode)
    ? `공공누리 제${image.copyrightCode.slice(-1)}유형` : null;

  return createPortal(<dialog className={styles.photoViewer} ref={dialog} aria-label={`${placeName} 사진 크게 보기`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onPointerDown={event => event.stopPropagation()}
    onPointerUp={event => event.stopPropagation()}
    onKeyDown={event => {
      event.stopPropagation();
      if (event.key === "ArrowRight") { event.preventDefault(); onNext(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); onPrevious(); }
    }}>
    <header className={styles.photoViewerHeader}><div><strong>{placeName}</strong><span>사진 {index + 1} / {count}{hasMore ? "+" : ""}</span></div>
      <button ref={closeButton} type="button" aria-label="사진 크게 보기 닫기" onClick={onClose}><X size={22} aria-hidden="true" /></button></header>
    <div className={styles.photoViewerStage} onPointerDown={event => { pointerStartX.current = event.clientX; }}
      onPointerUp={event => {
        if (pointerStartX.current === null) return;
        const distance = event.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (distance < -45) onNext();
        else if (distance > 45) onPrevious();
      }} onPointerCancel={() => { pointerStartX.current = null; }}>
      <ViewerImage key={image.imageUrl} image={image} placeName={placeName} index={index} />
      {index > 0 && <button className={`${styles.photoViewerArrow} ${styles.photoViewerPrevious}`} type="button" aria-label="이전 사진" onClick={onPrevious}><ChevronLeft size={24} aria-hidden="true" /></button>}
      {(index < count - 1 || hasMore) && <button className={`${styles.photoViewerArrow} ${styles.photoViewerNext}`} type="button" aria-label="다음 사진" disabled={loading} onClick={onNext}><ChevronRight size={24} aria-hidden="true" /></button>}
    </div>
    <footer className={styles.photoViewerFooter}><span>{error ? "추가 사진을 불러오지 못했어요. 다음 화살표로 다시 시도하세요." : loading ? "다음 사진 불러오는 중…" : caption}</span>
      <small>ⓒ한국관광공사{license ? ` · ${license}` : ""}</small></footer>
  </dialog>, document.body);
}
