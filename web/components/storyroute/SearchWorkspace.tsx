import { ArrowRight, Images, MessageSquareText, SlidersHorizontal } from "lucide-react";
import type { Intent, TravelPhoto } from "@/lib/storyroute/types";
import { IntentEditor } from "./IntentEditor";
import { PhotoExplorer } from "./PhotoExplorer";
import { GangwonRegionMap } from "./GangwonRegionMap";
import styles from "./StoryRoute.module.css";

export type SearchMode = "conditions" | "sentence" | "photos";
const searchModes = [
  { id: "conditions", label: "지도로 찾기", icon: SlidersHorizontal },
  { id: "sentence", label: "문장으로 찾기", icon: MessageSquareText },
  { id: "photos", label: "사진으로 찾기", icon: Images },
] as const;

export function SearchWorkspace({ mode, onMode, query, onQuery, intent, intentMode, onIntent, cities,
  busy, parsing, connectionState, tourismReady, aiReady, photosReady, hasSelection, onParse, onSearch, onCity, onPhoto }: {
  mode: SearchMode; onMode: (mode: SearchMode) => void; query: string; onQuery: (query: string) => void;
  intent: Intent; intentMode: "ai" | "manual"; onIntent: (intent: Intent) => void;
  cities: { code: string; name: string }[]; busy: boolean; parsing: boolean;
  connectionState: "connecting" | "ready" | "error"; tourismReady: boolean; aiReady: boolean | null;
  photosReady: boolean; hasSelection: boolean; onParse: () => void; onSearch: () => void;
  onCity: (city: string | null) => void; onPhoto: (photo: TravelPhoto) => void;
}) {
  return <>
    <section className={styles.searchWorkspace} aria-label="여행 장소 찾기">
      <div className={styles.searchModes} role="tablist" aria-label="여행을 찾는 방법">
        {searchModes.map((item, index) => <button key={item.id} id={`search-tab-${item.id}`} type="button" role="tab"
          aria-selected={mode === item.id} aria-controls={`search-pane-${item.id}`} tabIndex={mode === item.id ? 0 : -1}
          disabled={busy} onClick={() => onMode(item.id)} onKeyDown={event => {
            let next: number;
            if (event.key === "ArrowRight") next = (index + 1) % searchModes.length;
            else if (event.key === "ArrowLeft") next = (index + searchModes.length - 1) % searchModes.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = searchModes.length - 1;
            else return;
            event.preventDefault(); onMode(searchModes[next].id);
            document.getElementById(`search-tab-${searchModes[next].id}`)?.focus();
          }}><item.icon size={18} aria-hidden="true" /><span>{item.label}</span></button>)}
      </div>
      <div id="search-pane-conditions" role="tabpanel" aria-labelledby="search-tab-conditions" hidden={mode !== "conditions"} className={`${styles.workspacePane} ${styles.mapSearchPane}`}>
        <GangwonRegionMap selectedCity={intent.city} busy={busy} hasSelection={hasSelection} onSelect={onCity} />
        <IntentEditor intent={intent} cities={cities} mode={intentMode} busy={busy} searchReady={tourismReady} connectionState={connectionState} onChange={onIntent} onSearch={onSearch} hasSelection={hasSelection} mapDriven />
      </div>
      <div id="search-pane-sentence" role="tabpanel" aria-labelledby="search-tab-sentence" hidden={mode !== "sentence"} className={styles.workspacePane}>
        <div className={styles.workspaceHeading}><h2>하고 싶은 여행을 적어주세요</h2><p>지역과 관심사를 정리한 뒤, 검색할 조건을 함께 확인해요.</p></div>
        <form onSubmit={event => { event.preventDefault(); onParse(); }}>
          <label className={styles.fieldLabel} htmlFor="trip-query">원하는 하루 여행</label>
          <textarea id="trip-query" maxLength={500} value={query} disabled={busy} onChange={event => onQuery(event.target.value)} placeholder="춘천에서 박물관을 둘러보고 맛있는 점심을 먹고 싶어" aria-describedby="query-count" />
          <div className={styles.inputFooter}><span>강원도 · 당일 · 최대 3곳</span><span id="query-count">{query.length} / 500</span></div>
          <div className={styles.examples} aria-label="여행 문장 예시">{["강원도 바다 보고 카페 가기", "춘천에서 박물관 구경하고 식사하기"].map(example =>
            <button key={example} type="button" disabled={busy} onClick={() => { onQuery(example); document.getElementById("trip-query")?.focus(); }}>{example}<ArrowRight size={13} aria-hidden="true" /></button>)}</div>
          <div className={styles.searchSubmit}>
            <p>{connectionState === "connecting" ? "여행 정보를 준비하고 있어요. 연결되면 문장 해석 버튼이 자동으로 열려요."
              : connectionState === "error" ? "서버에 다시 연결한 뒤 문장으로 찾을 수 있어요."
              : aiReady === false ? "문장 해석을 준비 중이에요. 지금은 조건을 직접 골라주세요." : "해석한 조건은 검색 전에 수정할 수 있어요."}</p>
            {aiReady === false ? <button className={styles.primary} type="button" disabled={busy} onClick={() => { onMode("conditions"); requestAnimationFrame(() => document.getElementById("intent-title")?.focus()); }}>직접 조건 고르기<ArrowRight size={17} aria-hidden="true" /></button> :
              <button className={styles.primary} type="submit" disabled={busy || aiReady === null}>{parsing ? "조건 확인 중…" : connectionState === "connecting" ? "서버 연결 대기 중…" : "여행 조건 확인"}<ArrowRight size={17} aria-hidden="true" /></button>}
          </div>
        </form>
      </div>
      <div id="search-pane-photos" role="tabpanel" aria-labelledby="search-tab-photos" hidden={mode !== "photos"} className={styles.workspacePane}>
        <PhotoExplorer cities={cities} ready={photosReady} connectionState={connectionState} busy={busy} onExplore={onPhoto} />
      </div>
    </section>
  </>;
}
