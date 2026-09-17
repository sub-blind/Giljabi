import { categoryLabels, type Category, type Intent } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export function IntentEditor({ intent, cities, mode, busy, onChange, onSearch, hasSelection = false }: {
  intent: Intent; cities: { code: string; name: string }[]; mode: "ai" | "manual"; busy: boolean; onChange: (intent: Intent) => void; onSearch: () => void; hasSelection?: boolean;
}) {
  return <section className={styles.intentEditor} aria-labelledby="intent-title">
    <div className={styles.workspaceHeading}><h2 id="intent-title" tabIndex={-1}>{mode === "ai" ? "이 조건으로 찾아볼까요?" : "어디에서, 무엇을 하고 싶나요?"}</h2><p>{mode === "ai" ? "문장에서 정리한 조건이에요. 원하는 대로 수정하고 장소를 찾아보세요." : "지역과 장소 유형만 고르면 여행 후보를 볼 수 있어요."}</p></div>
    <div className={styles.intentFields}><div>
    <label className={styles.fieldLabel} htmlFor="trip-city">여행 지역</label>
    <select id="trip-city" className={styles.textInput} disabled={busy} value={intent.city ?? ""} onChange={event => onChange({ ...intent, city: event.target.value || null })}>
      <option value="">강원도 전체</option>{!!intent.city && !cities.some(city => city.name === intent.city) && <option value={intent.city}>{intent.city}</option>}
      {cities.map(city => <option value={city.name} key={city.code}>{city.name}</option>)}
    </select></div>
    <fieldset disabled={busy}><legend>어떤 장소를 담을까요?</legend><div className={styles.categories}>
      {(Object.keys(categoryLabels) as Category[]).map(category => <label key={category} className={intent.categories.includes(category) ? styles.categoryActive : undefined}>
        <input type="checkbox" checked={intent.categories.includes(category)} onChange={event => onChange({ ...intent,
          categories: event.target.checked ? [...intent.categories, category] : intent.categories.filter(item => item !== category) })} />{categoryLabels[category]}
      </label>)}
    </div></fieldset></div>
    <details className={styles.keywordOptions}>
      <summary>선호 키워드 추가 <span>선택{intent.keywords.some(item => item.trim()) ? ` · ${intent.keywords.filter(item => item.trim()).length}개 입력됨` : ""}</span></summary>
    <label className={styles.fieldLabel} htmlFor="keywords">선호 키워드 <span>최대 세 개, 쉼표로 구분</span></label>
    <input id="keywords" className={styles.textInput} value={intent.keywords.join(",")} maxLength={92} disabled={busy}
      onChange={event => onChange({ ...intent, keywords: event.target.value.split(/[,，]/) })} placeholder="해변, 카페" />
    <p className={styles.small}>키워드는 선호로 반영해요. 날씨·혼잡 여부는 별도 확인이 필요해요.</p>
    </details>
    {!!intent.preferences.length && <p className={styles.preference}>희망한 분위기: {intent.preferences.join(" · ")}</p>}
    {!!intent.unsupportedConditions.length && <div className={styles.warning}><strong>확인할 수 없는 조건</strong><ul>{intent.unsupportedConditions.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    <div className={styles.searchSubmit}><p>{hasSelection ? "새로 검색하면 담아둔 장소가 초기화돼요. 검색이 실패하면 이전 결과를 유지해요." : "장소를 고른 뒤 방문 순서와 이동 경로를 정해요."}</p>
      <button className={styles.primary} type="button" onClick={onSearch} disabled={busy}>{busy ? "장소를 찾고 있어요…" : "장소 찾아보기 →"}</button></div>
  </section>;
}
