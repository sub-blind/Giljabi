import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { Place, PlaceImage } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

function licenseLabel(code: string | null) {
  return code && ["Type1", "Type2", "Type3", "Type4"].includes(code) ? `공공누리 제${code.slice(-1)}유형` : null;
}

function GalleryImage({ image, placeName, index, onFailed }: {
  image: PlaceImage; placeName: string; index: number; onFailed: (url: string) => void;
}) {
  const [useOriginal, setUseOriginal] = useState(false);
  const license = licenseLabel(image.copyrightCode);
  const caption = image.caption && !image.caption.includes("_") ? image.caption : `사진 ${index + 1}`;
  return <figure className={styles.placeGalleryItem}>
    <a href={image.imageUrl} target="_blank" rel="noopener noreferrer" aria-label={`${placeName} 사진 ${index + 1} 원본 보기`}>
      {/* 관광 API의 이미지 주소는 실행 시점마다 달라질 수 있어 원본 URL로 표시한다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={useOriginal ? image.imageUrl : image.thumbnailUrl} alt={`${placeName} 사진 ${index + 1}${image.caption ? `: ${image.caption}` : ""}`}
        loading={index < 2 ? "eager" : "lazy"} onError={() => {
          if (!useOriginal && image.thumbnailUrl !== image.imageUrl) setUseOriginal(true);
          else onFailed(image.imageUrl);
        }} />
    </a>
    <figcaption>{caption}{license && <span>{license}</span>}</figcaption>
  </figure>;
}

export function PlaceGallery({ place, images, loading, error, hasMore, loadingMore, onMore, onRetry }: {
  place: Place; images: PlaceImage[]; loading: boolean; error: string;
  hasMore: boolean; loadingMore: boolean; onMore: () => void; onRetry: () => void;
}) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const representative: PlaceImage[] = place.imageUrl ? [{ imageUrl: place.imageUrl, thumbnailUrl: place.imageUrl, caption: "대표 사진", copyrightCode: null }] : [];
  const unique = [...new Map([...representative, ...images].map(image => [image.imageUrl, image])).values()];
  const visible = unique.filter(image => !failedUrls.includes(image.imageUrl));

  return <section className={styles.placeGallery} aria-label={`${place.name} 사진`}>
    <div className={styles.placeGalleryHeading}><strong>사진 {visible.length}장</strong><span>ⓒ한국관광공사 · 사진을 누르면 원본이 열려요</span></div>
    {visible.length ? <div className={`${styles.placeGalleryGrid} ${visible.length < 3 ? styles.placeGalleryFew : ""}`}>{visible.map((image, index) =>
      <GalleryImage key={image.imageUrl} image={image} placeName={place.name} index={index}
        onFailed={url => setFailedUrls(current => current.includes(url) ? current : [...current, url])} />)}</div> :
      loading ? null : <div className={styles.placeGalleryEmpty}><ImageOff size={22} aria-hidden="true" />제공된 사진이 없어요.</div>}
    {loading && <p className={styles.placeGalleryMessage} role="status">이 장소의 다른 사진을 확인하고 있어요…</p>}
    {error && <div className={styles.placeGalleryMessage} role="status">추가 사진을 불러오지 못했어요. <button type="button" onClick={onRetry}>다시 시도</button></div>}
    {!!failedUrls.length && <p className={styles.placeGalleryMessage} role="status">열리지 않은 사진 {failedUrls.length}장은 제외했어요.</p>}
    {hasMore && <button className={styles.placeGalleryMore} type="button" disabled={loadingMore} onClick={onMore}>{loadingMore ? "사진 가져오는 중…" : "사진 더 보기"}</button>}
  </section>;
}
