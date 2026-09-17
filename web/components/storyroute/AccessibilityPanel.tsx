import { useEffect, useState } from "react";
import { getAccessibility } from "@/lib/api";
import type { AccessResult, Place } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export function AccessibilityPanel({ place, onIntro }: { place: Place; onIntro: () => void }) {
  const [result, setResult] = useState<AccessResult | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError("");
    getAccessibility(place.id, controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [place.id, retry]);
  return <section className={styles.extraContent} aria-label="방문 편의정보">
    <h4>방문 전에 살펴볼 편의정보</h4>
    {error ? <><p className={styles.error} role="alert">{error}</p><button className={styles.secondary} type="button" onClick={() => setRetry(value => value + 1)}>다시 불러오기</button></> : !result ?
      <p role="status">무장애 여행정보에서 같은 장소와 제공 항목을 확인하고 있어요…</p> : <>
        {result.notices.map(item => <p className={styles.small} key={item}>{item}</p>)}
        {result.sourceModifiedDate && <p className={styles.small}>장소 자료 수정일: {result.sourceModifiedDate}</p>}
        {!result.fields.length ? <div className={styles.empty}><h4>제공된 편의정보가 없어요</h4>
          <p>편의시설이 없다는 뜻은 아니에요. 장소 소개와 운영기관 안내를 함께 확인해주세요.</p>
          <button className={styles.secondary} type="button" onClick={onIntro}>장소 소개 보기</button></div> : <>
          <p className={styles.tag}>관광지명·주소 대조 · ⓒ한국관광공사 무장애 여행정보</p>
          {Array.from(new Set(result.fields.map(field => field.group))).map(group => <section className={styles.accessGroup} key={group} aria-label={group}>
            <h4>{group}</h4><dl className={styles.accessFields}>{result.fields.filter(field => field.group === group).map(field => <div key={field.key}>
              <dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
          </section>)}
        </>}
      </>}
  </section>;
}
