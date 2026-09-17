import { useEffect, useState } from "react";
import { getRelated, getStories } from "@/lib/api";
import type { Place, RelatedResult, StoryResult } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

function Audio({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return <><audio className={styles.audio} controls preload="none" src={url} onError={() => setFailed(true)}>이 브라우저에서 오디오를 재생할 수 없어요.</audio>
    <a className={styles.secondary} href={url} target="_blank" rel="noopener noreferrer">원본 음성 파일 열기 ↗</a>
    {failed && <p className={styles.warning}>오디오를 재생하지 못했어요. 아래 원문으로 이야기를 읽을 수 있어요.</p>}</>;
}

export function StoryPanel({ place, onIntro }: { place: Place; onIntro: () => void }) {
  const [result, setResult] = useState<StoryResult | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setResult(null); setError("");
    getStories(place.id, controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [place.id, retry]);
  return <section className={styles.extraContent} aria-label="관광지 오디오 이야기">
    <h4>이 장소에 담긴 이야기</h4>
    {error ? <><p className={styles.error} role="alert">{error}</p><button className={styles.secondary} onClick={() => setRetry(value => value + 1)} type="button">다시 불러오기</button></> : !result ?
      <p role="status">오디에서 이 장소의 이야기를 확인하고 있어요…</p> : <>
        {result.notices.map(item => <p className={styles.small} key={item}>{item}</p>)}
        {!result.stories.length && <div className={styles.empty}><h4>연결된 이야기가 없어요</h4>
          <p>조회는 완료됐어요. 제공 자료를 확인한 이야기만 표시해요.</p>
          <button className={styles.secondary} type="button" onClick={onIntro}>장소 소개 보기</button></div>}
        {result.stories.map(story => <article className={styles.story} key={story.id}><h4>{story.title}</h4>
          <p className={styles.small}>{story.matchMethod === "place_name_and_location" ? "관광지명·위치 대조" : "관광지명 대조 · 좌표 대조 불가"} · ⓒ한국관광공사 오디</p>
          {story.audioUrl ? <Audio url={story.audioUrl} /> : <p className={styles.small}>확인된 오디오 주소가 없어 원문을 제공해요.</p>}
          {story.script && <details><summary>이야기 원문 읽기</summary><p className={styles.overview}>{story.script}</p></details>}
        </article>)}
      </>}
  </section>;
}

export function RelatedPanel({ place, onCandidate, onIntro }: { place: Place; onCandidate: (place: Place) => void; onIntro: () => void }) {
  const [result, setResult] = useState<RelatedResult | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setResult(null); setError("");
    getRelated(place.id, controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [place.id, retry]);
  return <section className={styles.extraContent} aria-label="연관 관광지">
    <h4>함께 살펴볼 곳</h4>
    {error ? <><p className={styles.error} role="alert">{error}</p><button className={styles.secondary} onClick={() => setRetry(value => value + 1)} type="button">다시 불러오기</button></> : !result ?
      <p role="status">연관 정보와 실제 관광 장소를 대조하고 있어요…</p> : <>
        <p className={styles.tag}>자료 기준: {result.baseMonth.slice(0, 4)}년 {result.baseMonth.slice(4)}월</p>
        {result.notices.map(item => <p className={styles.small} key={item}>{item}</p>)}
        {!result.candidates.length && <div className={styles.empty}><h4>연결된 연관 장소가 없어요</h4>
          <p>조회는 완료됐어요. 자료에 없다는 것이 주변에 가볼 곳이 없다는 뜻은 아니에요.</p>
          <button className={styles.secondary} type="button" onClick={onIntro}>장소 소개 보기</button></div>}
        {result.candidates.map(candidate => <article className={styles.story} key={candidate.id}>
          <h4>{candidate.name}</h4><p className={styles.address}>{candidate.city} · {candidate.category}</p>
          {candidate.place ? <><p className={styles.small}>국문 관광정보에서 이름·지역 확인</p><button type="button" className={styles.teal} onClick={() => onCandidate(candidate.place!)}>여행 후보로 살펴보기 →</button></> :
            <p className={styles.small}>연관 자료에는 있지만, 여행 후보로 연결할 관광 장소를 확인하지 못했어요.</p>}
        </article>)}
      </>}
  </section>;
}
