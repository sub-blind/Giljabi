import { useEffect, useRef, useState } from "react";
import { searchPhotos } from "@/lib/api";
import type { PhotoResult, TravelPhoto } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

function PhotoGallery({ photos, busy, onExplore, onFailed }: {
  photos: TravelPhoto[]; busy: boolean; onExplore: (photo: TravelPhoto) => void; onFailed: (url: string) => void;
}) {
  const [selectedUrl, setSelectedUrl] = useState(photos[0].imageUrl);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const index = Math.max(0, photos.findIndex(photo => photo.imageUrl === selectedUrl));
  const photo = photos[index];
  function move(offset: number) {
    setSelectedUrl(photos[(index + offset + photos.length) % photos.length].imageUrl);
  }
  return <article className={styles.photoCard}>
    <div className={styles.photoFrame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={photo.imageUrl} className={styles.travelPhoto} src={photo.imageUrl} alt={photo.title}
        loading="lazy" onLoad={() => setLoadedUrl(photo.imageUrl)} onError={() => onFailed(photo.imageUrl)} />
      {loadedUrl !== photo.imageUrl && <span className={styles.photoLoading}>사진 불러오는 중…</span>}
    </div>
    <div className={styles.photoBody}>
      <div className={styles.photoNavigation}>
        {photos.length > 1 && <button type="button" className={styles.photoArrow} aria-label={`${photo.title} 이전 사진`} onClick={() => move(-1)}>←</button>}
        <span className={styles.photoPosition} aria-live="polite" aria-atomic="true">사진 {index + 1} / {photos.length}</span>
        {photos.length > 1 && <button type="button" className={styles.photoArrow} aria-label={`${photo.title} 다음 사진`} onClick={() => move(1)}>→</button>}
      </div>
      <h3>{photo.title}</h3><p className={styles.address}>{photo.location}</p>
      <p className={styles.small}>ⓒ한국관광공사 · 촬영 {photo.photographer}</p>
      <button className={`${styles.secondary} ${styles.full} ${styles.photoExplore}`} type="button" disabled={busy} onClick={() => onExplore(photo)}>이 지역 장소 찾기 →</button>
    </div>
  </article>;
}

function PhotoCollection({ photos, busy, onExplore }: {
  photos: TravelPhoto[]; busy: boolean; onExplore: (photo: TravelPhoto) => void;
}) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const groups = new Map<string, TravelPhoto[]>();
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ");
  for (const photo of photos) {
    if (failedUrls.has(photo.imageUrl)) continue;
    // 사진 묶음은 관광 장소 ID를 확인한 결과가 아니다. 서로 다른 촬영지는 합치지 않는다.
    const key = JSON.stringify([normalize(photo.title), normalize(photo.location), photo.city]);
    const group = groups.get(key) ?? [];
    if (!group.some(item => item.imageUrl === photo.imageUrl)) group.push(photo);
    groups.set(key, group);
  }
  function exclude(url: string) {
    setFailedUrls(previous => previous.has(url) ? previous : new Set([...previous, url]));
  }
  return <>
    {!!failedUrls.size && <p className={styles.photoNotice} role="status">불러오지 못한 사진 {failedUrls.size}장은 제외했어요.</p>}
    {!!groups.size && <>
      <p className={styles.small} role="status">촬영지 {groups.size}곳 · 사진 {[...groups.values()].reduce((count, group) => count + group.length, 0)}장</p>
      <p className={styles.small}>마음에 드는 풍경을 골라보세요. 카드의 화살표로 같은 촬영지의 다른 사진을 볼 수 있어요.</p>
      <div className={styles.photoGrid}>{[...groups].map(([key, group]) =>
        <PhotoGallery key={key} photos={group} busy={busy} onExplore={onExplore} onFailed={exclude} />)}</div>
    </>}
    {!groups.size && <p className={styles.empty}>{photos.length
      ? "이번 조회에서 볼 수 있는 사진이 없어요. 지역이나 키워드를 바꿔 다시 찾아보세요."
      : "이번 조회에서 강원도 촬영지를 확인한 사진이 없어요. 지역이나 키워드를 바꿔 다시 찾아보세요."}</p>}
  </>;
}

export function PhotoExplorer({ cities, ready, connectionState, busy: tripBusy, onExplore }: {
  cities: { code: string; name: string }[]; ready: boolean; connectionState: "connecting" | "ready" | "error";
  busy: boolean; onExplore: (photo: TravelPhoto) => void;
}) {
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<PhotoResult | null>(null);
  const [resultVersion, setResultVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    controller.current?.abort();
    if (slowTimer.current) clearTimeout(slowTimer.current);
    requestId.current += 1;
  }, []);

  async function load(more = false, withoutKeyword = false) {
    controller.current?.abort();
    const current = new AbortController(), id = ++requestId.current;
    controller.current = current; setBusy(true); setSlow(false); setError("");
    if (slowTimer.current) clearTimeout(slowTimer.current);
    slowTimer.current = setTimeout(() => {
      if (id === requestId.current) setSlow(true);
    }, 8000);
    try {
      const requestedCity = more ? result!.appliedCity : withoutKeyword && result ? result.appliedCity : city || null;
      const value = await searchPhotos(requestedCity,
        more ? result!.appliedKeyword : withoutKeyword ? "" : keyword.trim(), more ? result!.page + 1 : 1, current.signal);
      if (id !== requestId.current) return;
      setResult(more ? { ...value, photos: [...new Map([...result!.photos, ...value.photos].map(photo => [photo.id, photo])).values()] } : value);
      if (!more) setResultVersion(id);
    } catch (err) { if (id === requestId.current && !current.signal.aborted) setError((err as Error).message); }
    finally {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      if (id === requestId.current) { setBusy(false); setSlow(false); controller.current = null; }
    }
  }

  function cancelLoad() {
    if (!controller.current) return;
    controller.current.abort();
    controller.current = null;
    requestId.current += 1;
    if (slowTimer.current) clearTimeout(slowTimer.current);
    setBusy(false); setSlow(false);
    setError("사진 조회를 취소했어요. 지역과 키워드는 그대로 남아 있어요.");
  }

  function retryWithoutKeyword() {
    if (!result) return;
    setCity(result.appliedCity ?? "");
    setKeyword("");
    void load(false, true);
  }
  return <section className={styles.photoSection} aria-labelledby="photos-heading">
    <div className={styles.workspaceHeading}><h2 id="photos-heading">마음에 드는 풍경부터 찾아볼까요?</h2>
    <p>관광사진을 보고, 사진이 찍힌 지역의 여행 장소로 이어가세요.</p></div>
    <form className={styles.photoFilters} onSubmit={event => { event.preventDefault(); void load(); }}>
      <div><label htmlFor="photo-city">촬영 지역</label><select id="photo-city" className={styles.textInput} value={city} disabled={busy} onChange={event => setCity(event.target.value)}>
        <option value="">강원도 전체</option>{cities.map(item => <option key={item.code} value={item.name}>{item.name}</option>)}
      </select></div>
      <div><label htmlFor="photo-keyword">사진 키워드</label><input id="photo-keyword" className={styles.textInput} value={keyword} maxLength={40} placeholder="예: 박물관, 바다" disabled={busy} onChange={event => setKeyword(event.target.value)} /></div>
      <button type="submit" className={styles.primary} disabled={busy || !ready}>{busy ? "사진 조회 중…" : "사진 둘러보기"}</button>
    </form>
    {!ready && <p className={styles.small}>{connectionState === "connecting"
      ? "사진 조회를 바로 시작할 수 있어요. 첫 요청만 조금 오래 걸릴 수 있어요."
      : connectionState === "error" ? "서버에 다시 연결한 뒤 관광사진을 볼 수 있어요."
      : "관광사진 기능을 준비 중이에요. 지도로 장소를 찾아주세요."}</p>}
    {busy && <div className={styles.photoProgress} role="status" aria-live="polite"><span>{slow ? "관광사진과 촬영지를 계속 확인하고 있어요. 이전 사진은 그대로 유지됩니다." : "관광사진을 찾고 있어요…"}</span>{slow && <button className={styles.secondary} type="button" onClick={cancelLoad}>사진 조회 취소</button>}</div>}
    {error && <p className={styles.error} role="alert">{error}{result ? " 이전에 조회한 사진은 유지했어요." : ""}</p>}
    {result && <>
      <p className={styles.small}>조회 조건: {result.appliedCity ?? "강원도 전체"} · {result.appliedKeyword} · {new Date(result.retrievedAt).toLocaleString("ko-KR")}</p>
      {result.notices.map(item => <p key={item} className={styles.small}>{item}</p>)}
      <PhotoCollection key={resultVersion} photos={result.photos} busy={tripBusy} onExplore={onExplore} />
      {!result.photos.length && !!result.appliedKeyword.trim() && <button className={`${styles.secondary} ${styles.full}`} type="button" disabled={busy} onClick={retryWithoutKeyword}>키워드 없이 {result.appliedCity || "강원도"} 사진 보기</button>}
      {result.hasMore && <button className={`${styles.secondary} ${styles.full}`} type="button" disabled={busy} onClick={() => void load(true)}>{busy ? "풍경 더 찾는 중…" : "다른 풍경 더 보기"}</button>}
    </>}
  </section>;
}
