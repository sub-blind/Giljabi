import { categoryLabels, type Category, type Intent } from "@/lib/storyroute/types";
import type { ConnectionState } from "@/lib/storyroute/connection";
import styles from "./StoryRoute.module.css";

export function IntentEditor({ intent, cities, mode, busy, searchReady, connectionState, onChange, onSearch, hasSelection = false, mapDriven = false }: {
  intent: Intent; cities: { code: string; name: string }[]; mode: "ai" | "manual"; busy: boolean;
  searchReady: boolean; connectionState: ConnectionState;
  onChange: (intent: Intent) => void; onSearch: () => void; hasSelection?: boolean; mapDriven?: boolean;
}) {
  const region = intent.city ?? "강원도 전체";
  return <section className={`${styles.intentEditor} ${mapDriven ? styles.mapIntentEditor : ""}`} aria-labelledby="intent-title">
    <div className={styles.workspaceHeading}>
      {mapDriven && <span className={styles.selectedRegionBadge}>선택 지역 · {region}</span>}
      <h2 id="intent-title" tabIndex={-1}>{mode === "ai" ? "이 조건으로 찾아볼까요?" : mapDriven ? `${region}에서 무엇을 담을까요?` : "어디에서, 무엇을 하고 싶나요?"}</h2>
      <p>{mode === "ai" ? "문장에서 정리한 조건이에요. 지역과 장소 유형을 원하는 대로 바꿀 수 있어요." : "지역과 장소 유형만 고르면 실제 여행 후보를 보여드려요."}</p>
    </div>
    <div className={`${styles.intentFields} ${mapDriven ? styles.mapIntentFields : ""}`}>{!mapDriven && <div>
    <label className={styles.fieldLabel} htmlFor="trip-city">여행 지역</label>
    <select id="trip-city" className={styles.textInput} disabled={busy} value={intent.city ?? ""} onChange={event => onChange({ ...intent, city: event.target.value || null })}>
      <option value="">강원도 전체</option>{!!intent.city && !cities.some(city => city.name === intent.city) && <option value={intent.city}>{intent.city}</option>}
      {cities.map(city => <option value={city.name} key={city.code}>{city.name}</option>)}
    </select></div>}
    <fieldset disabled={busy}><legend>어떤 장소를 담을까요?</legend><div className={styles.categories}>
      {(Object.keys(categoryLabels) as Category[]).map(category => <label key={category} className={intent.categories.includes(category) ? styles.categoryActive : undefined}>
        <input type="checkbox" checked={intent.categories.includes(category)} onChange={event => onChange({ ...intent,
          categories: event.target.checked ? [...intent.categories, category] : intent.categories.filter(item => item !== category) })} />{categoryLabels[category]}
      </label>)}
    </div></fieldset></div>
    {mode === "ai" && (!!intent.keywords.length || !!intent.preferences.length) && <div className={styles.interpretedPreferences}>
      <strong>문장에서 반영한 내용</strong>
      <span>{[...intent.keywords, ...intent.preferences].join(" · ")}</span>
    </div>}
    {!!intent.unsupportedConditions.length && <div className={styles.warning}><strong>확인할 수 없는 조건</strong><ul>{intent.unsupportedConditions.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    <div className={styles.searchSubmit}><p>{!searchReady
      ? "관광 데이터 설정을 확인하고 있어요. 잠시 뒤 다시 시도해주세요."
      : connectionState === "error" ? "버튼을 누르면 서버 연결과 장소 검색을 함께 다시 시도해요."
      : connectionState === "connecting" ? "검색을 바로 시작할 수 있어요. 잠든 서버를 깨우는 첫 검색만 조금 오래 걸릴 수 있어요."
      : hasSelection ? "새로 검색하면 담아둔 장소가 초기화돼요. 검색이 실패하면 이전 결과를 유지해요." : "장소를 고른 뒤 방문 순서와 이동 경로를 정해요."}</p>
      <button className={styles.primary} type="button" onClick={onSearch} disabled={busy || !searchReady}>{busy ? "장소를 찾고 있어요…" : !searchReady ? "관광 데이터 준비 중…" : connectionState === "error" ? "다시 연결하며 장소 찾기 →" : "장소 찾아보기 →"}</button></div>
  </section>;
}
