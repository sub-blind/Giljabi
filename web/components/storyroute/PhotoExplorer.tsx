import { useEffect, useRef, useState } from "react";
import { searchPhotos } from "@/lib/api";
import type { PhotoResult, TravelPhoto } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

function Photo({ photo }: { photo: TravelPhoto }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className={styles.photoUnavailable}>사진을 불러오지 못했어요</div> :
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.travelPhoto} src={photo.imageUrl} alt={photo.title} loading="lazy" onError={() => setFailed(true)} />;
}

export function PhotoExplorer({ cities, ready, busy: tripBusy, onExplore }: {
  cities: { code: string; name: string }[]; ready: boolean; busy: boolean; onExplore: (photo: TravelPhoto) => void;
}) {
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<PhotoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  useEffect(() => () => { controller.current?.abort(); requestId.current += 1; }, []);

  async function load(more = false) {
    controller.current?.abort();
    const current = new AbortController(), id = ++requestId.current;
    controller.current = current; setBusy(true); setError("");
    try {
      const value = await searchPhotos(more ? result!.appliedCity : city || null,
        more ? result!.appliedKeyword : keyword.trim(), more ? result!.page + 1 : 1, current.signal);
      if (id !== requestId.current) return;
      setResult(more ? { ...value, photos: [...new Map([...result!.photos, ...value.photos].map(photo => [photo.id, photo])).values()] } : value);
    } catch (err) { if (id === requestId.current && !current.signal.aborted) setError((err as Error).message); }
    finally { if (id === requestId.current) setBusy(false); }
  }
  return <section className={`${styles.panel} ${styles.photoSection}`} aria-labelledby="photos-heading">
    <p className={styles.eyebrow}>사진에서 시작하는 여행</p><h2 id="photos-heading">어떤 풍경이 마음에 드나요?</h2>
    <p className={styles.muted}>한국관광공사의 강원도 사진을 둘러보고, 촬영 지역의 실제 관광 장소를 찾아보세요.</p>
    <form className={styles.photoFilters} onSubmit={event => { event.preventDefault(); void load(); }}>
      <div><label htmlFor="photo-city">촬영 지역</label><select id="photo-city" className={styles.textInput} value={city} disabled={busy} onChange={event => setCity(event.target.value)}>
        <option value="">강원도 전체</option>{cities.map(item => <option key={item.code} value={item.name}>{item.name}</option>)}
      </select></div>
      <div><label htmlFor="photo-keyword">사진 키워드</label><input id="photo-keyword" className={styles.textInput} value={keyword} maxLength={40} placeholder="예: 박물관, 바다" disabled={busy} onChange={event => setKeyword(event.target.value)} /></div>
      <button type="submit" className={styles.teal} disabled={busy || !ready}>{busy ? "사진 조회 중…" : "사진 둘러보기"}</button>
    </form>
    {!ready && <p className={styles.small}>관광사진 연결을 준비 중이에요. 위에서 여행 조건으로 장소를 찾을 수 있어요.</p>}
    {error && <p className={styles.error} role="alert">{error} 이전에 조회한 사진은 유지했어요.</p>}
    {result && <>
      <p className={styles.small}>조회 조건: {result.appliedCity ?? "강원도 전체"} · {result.appliedKeyword} · {new Date(result.retrievedAt).toLocaleString("ko-KR")}</p>
      {result.notices.map(item => <p key={item} className={styles.small}>{item}</p>)}
      <div className={styles.photoGrid}>{result.photos.map(photo => <article className={styles.photoCard} key={photo.id}>
        <Photo photo={photo} /><div><h3>{photo.title}</h3><p className={styles.address}>{photo.location}</p>
          <p className={styles.small}>ⓒ한국관광공사 · 촬영 {photo.photographer}</p>
          <button className={`${styles.secondary} ${styles.full}`} type="button" disabled={tripBusy} onClick={() => onExplore(photo)}>이 지역 장소 찾기 →</button>
        </div>
      </article>)}</div>
      {!result.photos.length && <p className={styles.empty}>촬영지에서 강원도를 확인한 사진이 없어요. 키워드를 바꾸거나 다음 사진을 조회해보세요.</p>}
      {result.hasMore && <button className={`${styles.secondary} ${styles.full}`} type="button" disabled={busy} onClick={() => void load(true)}>사진 더 보기</button>}
    </>}
  </section>;
}
