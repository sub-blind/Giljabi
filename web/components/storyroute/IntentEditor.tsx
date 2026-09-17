import { categoryLabels, type Category, type Intent } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export function IntentEditor({ intent, cities, mode, busy, onChange, onSearch }: {
  intent: Intent; cities: { code: string; name: string }[]; mode: "ai" | "manual"; busy: boolean; onChange: (intent: Intent) => void; onSearch: () => void;
}) {
  return <section className={styles.intentEditor} aria-labelledby="intent-title">
    <div className={styles.row}><h3 id="intent-title">이런 하루로 찾아볼게요</h3><span className={styles.tag}>{mode === "ai" ? "AI 해석 · 수정 가능" : "직접 조건 선택"}</span></div>
    <p className={styles.muted}>강원도 당일 여행이에요. 시·군과 장소 유형을 직접 고칠 수 있어요.</p>
    <label className={styles.fieldLabel} htmlFor="trip-city">여행 지역</label>
    <select id="trip-city" className={styles.textInput} disabled={busy} value={intent.city ?? ""} onChange={event => onChange({ ...intent, city: event.target.value || null })}>
      <option value="">강원도 전체</option>{!!intent.city && !cities.some(city => city.name === intent.city) && <option value={intent.city}>{intent.city}</option>}
      {cities.map(city => <option value={city.name} key={city.code}>{city.name}</option>)}
    </select>
    <fieldset disabled={busy}><legend>어떤 장소를 담을까요?</legend><div className={styles.categories}>
      {(Object.keys(categoryLabels) as Category[]).map(category => <label key={category}>
        <input type="checkbox" checked={intent.categories.includes(category)} onChange={event => onChange({ ...intent,
          categories: event.target.checked ? [...intent.categories, category] : intent.categories.filter(item => item !== category) })} />{categoryLabels[category]}
      </label>)}
    </div></fieldset>
    <label className={styles.fieldLabel} htmlFor="keywords">선호 키워드 <span>최대 세 개, 쉼표로 구분</span></label>
    <input id="keywords" className={styles.textInput} value={intent.keywords.join(",")} maxLength={92} disabled={busy}
      onChange={event => onChange({ ...intent, keywords: event.target.value.split(/[,，]/) })} placeholder="해변, 카페" />
    <p className={styles.small}>키워드는 선호로 반영해요. 조용함·날씨·혼잡 등은 충족을 보장하지 않아요.</p>
    {!!intent.preferences.length && <p className={styles.preference}>희망한 분위기: {intent.preferences.join(" · ")}</p>}
    {!!intent.unsupportedConditions.length && <div className={styles.warning}><strong>확인할 수 없는 조건</strong><ul>{intent.unsupportedConditions.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
    <button className={`${styles.teal} ${styles.full}`} type="button" onClick={onSearch} disabled={busy}>{busy ? "처리 중…" : "이 조건으로 장소 찾기 →"}</button>
  </section>;
}
