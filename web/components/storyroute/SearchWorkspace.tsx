import Link from "next/link";
import { ArrowRight, Images, MessageSquareText, SlidersHorizontal } from "lucide-react";
import type { Intent, TravelPhoto } from "@/lib/storyroute/types";
import type { ConnectionState } from "@/lib/storyroute/connection";
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
  busy, parsing, connectionState, tourismReady, aiReady, aiConsent, onAiConsent, photosReady, slowRequest, onCancel, hasSelection, onParse, onSearch, onCity, onPhoto, onReconnect }: {
  mode: SearchMode; onMode: (mode: SearchMode) => void; query: string; onQuery: (query: string) => void;
  intent: Intent; intentMode: "ai" | "manual"; onIntent: (intent: Intent) => void;
  cities: { code: string; name: string }[]; busy: boolean; parsing: boolean;
  connectionState: ConnectionState; tourismReady: boolean; aiReady: boolean | null;
  aiConsent: boolean; onAiConsent: (value: boolean) => void;
  photosReady: boolean; slowRequest: boolean; onCancel: () => void;
  hasSelection: boolean; onParse: () => void; onSearch: () => void;
  onCity: (city: string | null) => void; onPhoto: (photo: TravelPhoto) => void; onReconnect: () => void;
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
        <IntentEditor intent={intent} cities={cities} mode={intentMode} busy={busy} slowRequest={slowRequest} onCancel={onCancel} searchReady={tourismReady} connectionState={connectionState} onChange={onIntent} onSearch={onSearch} hasSelection={hasSelection} mapDriven />
      </div>
      <div id="search-pane-sentence" role="tabpanel" aria-labelledby="search-tab-sentence" hidden={mode !== "sentence"} className={styles.workspacePane}>
        <div className={styles.workspaceHeading}><h2>하고 싶은 여행을 적어주세요</h2><p>지역과 관심사를 정리한 뒤, 검색할 조건을 함께 확인해요.</p></div>
        <form onSubmit={event => { event.preventDefault(); onParse(); }}>
          <label className={styles.fieldLabel} htmlFor="trip-query">원하는 하루 여행</label>
          <textarea id="trip-query" maxLength={500} value={query} disabled={busy} onChange={event => onQuery(event.target.value)} placeholder="춘천에서 박물관을 둘러보고 맛있는 점심을 먹고 싶어" aria-describedby="query-privacy query-count" />
          <div id="query-privacy" className={styles.privacyHint}>
            <label><input type="checkbox" disabled={busy} checked={aiConsent} onChange={event => onAiConsent(event.target.checked)} /><strong>AI 문장 해석과 코스 설명 사용 (선택 · 만 14세 이상)</strong></label>
            <p>선택하면 여행 문장·검색 키워드·선호 조건과 공식 장소 소개가 OpenAI(미국)에 요청할 때 전송됩니다. 목적은 조건 해석·소개 근거 선택이며, 서비스 DB에는 원문을 저장하지 않습니다. OpenAI의 보안 로그에는 최대 30일 보관될 수 있어요. <Link href="/privacy#ai" target="_blank">이전 항목·시점·보유기간·철회 안내</Link></p>
            <p>이름·연락처·계정정보·건강정보는 적지 마세요. 선택하지 않으면 AI 전송 없이 기본 조건을 정리하며, <button type="button" disabled={busy} onClick={() => onMode("conditions")}>지도로 찾기</button>도 사용할 수 있어요. 체크를 해제하면 이후 요청부터 전송하지 않습니다.</p>
          </div>
          <div className={styles.inputFooter}><span>강원도 · 당일 · 최대 3곳</span><span id="query-count">{query.length} / 500</span></div>
          <div className={styles.examples} aria-label="여행 문장 예시">{["강원도 바다 보고 카페 가기", "춘천에서 박물관 구경하고 식사하기"].map(example =>
            <button key={example} type="button" disabled={busy} onClick={() => { onQuery(example); document.getElementById("trip-query")?.focus(); }}>{example}<ArrowRight size={13} aria-hidden="true" /></button>)}</div>
          <div className={styles.searchSubmit}>
            <p>{connectionState === "connecting" ? "원하는 여행을 적으면 조건을 정리해요. 서버 연결도 함께 확인합니다."
              : connectionState === "error" ? "버튼을 누르면 서버 연결과 문장 해석을 함께 다시 시도해요."
              : !aiConsent || aiReady === false ? "AI 전송 없이 기본 조건을 정리해요. 검색 전에 확인해주세요." : "해석한 조건은 검색 전에 수정할 수 있어요."}</p>
            <button className={styles.primary} type="submit" disabled={busy}>{parsing ? "조건 확인 중…" : connectionState === "error" ? "다시 연결하며 조건 확인" : "여행 조건 확인"}<ArrowRight size={17} aria-hidden="true" /></button>
          </div>
        </form>
      </div>
      <div id="search-pane-photos" role="tabpanel" aria-labelledby="search-tab-photos" hidden={mode !== "photos"} className={styles.workspacePane}>
        <PhotoExplorer cities={cities} ready={photosReady} connectionState={connectionState} busy={busy} onExplore={onPhoto} onReconnect={onReconnect} />
      </div>
    </section>
  </>;
}
