"use client";

import { useEffect, useRef, useState } from "react";
import {
  Accessibility, ArrowDown, ArrowUp, Check, ExternalLink, Headphones,
  Info, MapPin, Navigation, Play, RefreshCw, Route, Save,
} from "lucide-react";
import { loadJourney, saveJourney, type Journey } from "@/lib/storyroute/journey";
import { directionsLabel, directionsUrl } from "@/lib/storyroute/navigation";
import { categoryLabels, type CourseRoute, type Place } from "@/lib/storyroute/types";
import type { DetailTab } from "./PlaceDetailPanel";
import styles from "./StoryRoute.module.css";

interface JourneyPanelProps {
  places: Place[];
  candidates: Place[];
  route: CourseRoute | null;
  routeReady: boolean;
  routeBusy: boolean;
  busy: boolean;
  onSaveCourse: () => boolean;
  onCheckRoute: () => void;
  onDetail: (id: string, tab?: DetailTab) => void;
  onReplace: (currentId: string, nextId: string) => void;
  onLoadAlternatives: () => void;
  onMove: (index: number, direction: number) => void;
}

export function JourneyPanel({ places, candidates, route, routeReady, routeBusy, busy, onSaveCourse,
  onCheckRoute, onDetail, onReplace, onLoadAlternatives, onMove }: JourneyPanelProps) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replacementFor, setReplacementFor] = useState<string | null>(null);
  const previousIds = useRef<string[]>(places.map(place => place.id));
  // 순서 변경은 같은 기록을 쓰고, 장소 교체는 남아 있는 장소의 방문·메모만 옮긴다.
  const identity = places.map(place => place.id).sort().join(".");

  useEffect(() => {
    const currentIds = places.map(place => place.id);
    try {
      let saved = loadJourney(currentIds);
      const priorIds = previousIds.current;
      if (!saved && [...priorIds].sort().join(".") !== identity) {
        const prior = loadJourney(priorIds);
        if (prior) {
          saved = {
            ...prior,
            placeIds: currentIds,
            visitedIds: prior.visitedIds.filter(id => currentIds.includes(id)),
            notes: Object.fromEntries(Object.entries(prior.notes).filter(([id]) => currentIds.includes(id))),
          };
          saveJourney(saved);
        }
      }
      setJourney(saved);
      setDrafts(saved?.notes ?? {});
      setError("");
    } catch (err) {
      setError((err as Error).message);
      setJourney(null);
      setDrafts({});
    }
    previousIds.current = currentIds;
    setReplacementFor(null);
    setReady(true);
    // 장소 집합이 달라졌을 때만 기존 여행 기록을 이전한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  function persist(next: Journey, notice: string) {
    try {
      saveJourney(next);
      setJourney(next);
      setError("");
      setMessage(notice);
    } catch {
      setError("여행 기록을 저장하지 못했어요. 브라우저 저장 설정과 공간을 확인해주세요.");
    }
  }

  function start() {
    if (!onSaveCourse()) return;
    persist({ version: 1, placeIds: places.map(place => place.id), startedAt: new Date().toISOString(), visitedIds: [], notes: {} },
      "여행을 시작했어요. 다음 장소와 필요한 현장 정보를 여기에서 확인하세요.");
  }

  const visited = new Set(journey?.visitedIds ?? []);
  const nextIndex = places.findIndex(place => !visited.has(place.id));
  const next = nextIndex >= 0 ? places[nextIndex] : null;
  const previous = nextIndex > 0 ? places[nextIndex - 1] : undefined;
  const count = journey?.visitedIds.length ?? 0;
  const completed = !!journey && count === places.length;
  const city = places[0]?.city ?? "강원도";
  const noteCount = journey ? Object.values(journey.notes).filter(note => note.trim()).length : 0;
  const routeMinutes = route?.totalDurationSeconds === null || route?.totalDurationSeconds === undefined
    ? null : Math.ceil(route.totalDurationSeconds / 60);
  const routeDistance = route?.totalDistanceMeters === null || route?.totalDistanceMeters === undefined
    ? null : (route.totalDistanceMeters / 1000).toFixed(1);

  function alternatives(place: Place) {
    const used = new Set(places.map(item => item.id));
    return candidates.filter(item => !used.has(item.id) && item.city === place.city && item.category === place.category).slice(0, 3);
  }

  return <section className={styles.journeyPanel} aria-labelledby="journey-heading">
    <div className={styles.companionHeader}>
      <div><p className={styles.eyebrow}>오늘의 {city} 여행</p>
        <h2 id="journey-heading">{completed ? "오늘의 여행을 완주했어요" : journey && next ? `다음은 ${next.name}` : "이 코스로 바로 출발할까요?"}</h2>
        <p className={styles.muted}>{journey ? "길찾기와 현장 정보를 확인하고, 다녀온 장소만 체크해보세요." : "저장만 하는 계획이 아니라 여행 중 계속 꺼내 보는 하루 안내판이에요."}</p></div>
      <button className={styles.secondary} type="button" disabled={busy} onClick={() => onSaveCourse()}><Save size={16} aria-hidden="true" />코스 저장</button>
    </div>

    <div className={styles.tripStats} aria-label="여행 요약">
      <div className={styles.tripStat}><span>방문 진행</span><strong>{count} / {places.length}곳</strong></div>
      <div className={styles.tripStat}><span>장소 간 이동</span><strong>{routeMinutes === null ? "확인 전" : `약 ${routeMinutes}분`}</strong>{routeDistance && <small>{routeDistance}km</small>}</div>
      <div className={styles.tripStat}><span>남긴 기록</span><strong>{noteCount}개</strong></div>
    </div>

    {!journey ? <div className={styles.nextAction}>
      <div className={styles.nextActionIcon}><MapPin size={25} aria-hidden="true" /></div>
      <div className={styles.nextActionMain}><span>첫 번째 장소</span><strong>{places[0]?.name}</strong><p>{places[0]?.address}</p></div>
      <div className={styles.nextActions}>
        <button className={styles.primary} type="button" disabled={!ready || busy} onClick={start}><Play size={16} aria-hidden="true" />이 코스로 여행 시작</button>
        {places[0] && <a className={styles.secondary} href={directionsUrl(places[0])} target="_blank" rel="noopener noreferrer">카카오맵에서 첫 장소 찾기<ExternalLink size={15} aria-hidden="true" /></a>}
        {places.length > 1 && <button className={styles.textButton} type="button" disabled={busy || !routeReady} onClick={onCheckRoute}><Route size={15} aria-hidden="true" />{routeBusy ? "이동 확인 중…" : route ? "이동정보 새로 확인" : "이동정보 확인"}</button>}
      </div>
    </div> : completed ? <div className={styles.completionCard}>
      <Check size={28} aria-hidden="true" /><div><strong>{places.length}곳을 모두 방문했어요</strong><p>장소별 메모는 이 브라우저에 남아 있어요. 오늘의 기억을 다시 살펴보세요.</p></div>
    </div> : next && <div className={styles.nextAction}>
      <div className={styles.nextActionIcon}><Navigation size={25} aria-hidden="true" /></div>
      <div className={styles.nextActionMain}><span>{nextIndex + 1}번째 · 지금 갈 곳</span><strong>{next.name}</strong><p>{next.address}</p></div>
      <div className={styles.nextActions}>
        <a className={styles.primary} href={directionsUrl(next, previous)} target="_blank" rel="noopener noreferrer">{directionsLabel(next, previous)}<ExternalLink size={15} aria-hidden="true" /></a>
        <button className={styles.secondary} type="button" disabled={busy} onClick={() => onDetail(next.id, "intro")}><Info size={15} aria-hidden="true" />방문 정보</button>
        <button className={styles.secondary} type="button" disabled={busy} onClick={() => onDetail(next.id, "story")}><Headphones size={15} aria-hidden="true" />이야기</button>
        <button className={styles.secondary} type="button" disabled={busy} onClick={() => onDetail(next.id, "access")}><Accessibility size={15} aria-hidden="true" />편의정보</button>
        <button className={styles.visitDoneButton} type="button" disabled={busy} onClick={() => persist({ ...journey, visitedIds: [...journey.visitedIds, next.id] }, `${next.name} 방문을 완료했어요.`)}><Check size={17} aria-hidden="true" />방문 완료</button>
      </div>
    </div>}

    {journey && <progress className={styles.progress} value={count} max={places.length} aria-label="직접 체크한 방문 진행률" />}

    <div className={styles.timelineHeading}><div><p className={styles.eyebrow}>오늘의 순서</p><h3>{journey ? "남은 일정과 기록" : "방문 순서"}</h3></div>
      {!route && places.length > 1 && <button className={styles.textButton} type="button" disabled={busy || !routeReady} onClick={onCheckRoute}><Route size={15} aria-hidden="true" />이동 확인</button>}</div>

    <ol className={styles.tripTimeline}>{places.map((place, index) => {
      const isVisited = visited.has(place.id);
      const isCurrent = !!journey && place.id === next?.id;
      const options = alternatives(place);
      const explanationStatus = isVisited ? "방문 완료" : isCurrent ? "지금 갈 곳" : journey ? "예정" : `${index + 1}번째`;
      return <li key={place.id} className={`${styles.timelineStop} ${isVisited ? styles.timelineStopVisited : ""} ${isCurrent ? styles.timelineStopCurrent : ""}`}>
        <div className={styles.timelineRail}><span>{isVisited ? <Check size={16} aria-hidden="true" /> : index + 1}</span></div>
        <div className={styles.timelineBody}>
          <div className={styles.stopTitleRow}><div><div className={styles.stopMeta}><span className={styles.stopStatus}>{explanationStatus}</span><span className={styles.stopCategory}>{categoryLabels[place.category]}</span></div><h4>{place.name}</h4><p>{place.address}</p></div>
            {!journey && <div className={styles.orderButtons}><button className={styles.iconButton} type="button" disabled={busy || index === 0} onClick={() => onMove(index, -1)} aria-label={`${place.name} 위로`}><ArrowUp size={17} /></button><button className={styles.iconButton} type="button" disabled={busy || index === places.length - 1} onClick={() => onMove(index, 1)} aria-label={`${place.name} 아래로`}><ArrowDown size={17} /></button></div>}
          </div>
          <div className={styles.stopQuickActions}>
            <div className={styles.stopInfoActions}>
              <button className={styles.textButton} type="button" disabled={busy} onClick={() => onDetail(place.id, "intro")}><Info size={14} aria-hidden="true" />소개</button>
              <button className={styles.textButton} type="button" disabled={busy} onClick={() => onDetail(place.id, "story")}><Headphones size={14} aria-hidden="true" />이야기</button>
              <button className={styles.textButton} type="button" disabled={busy} onClick={() => onDetail(place.id, "access")}><Accessibility size={14} aria-hidden="true" />편의</button>
            </div>
            <div className={styles.stopManagementActions}>
              {!isVisited && <button className={styles.textButton} type="button" disabled={busy} aria-expanded={replacementFor === place.id} onClick={() => setReplacementFor(replacementFor === place.id ? null : place.id)}><RefreshCw size={14} aria-hidden="true" />장소 변경</button>}
              {journey && !isVisited && !isCurrent && <button className={styles.textButton} type="button" disabled={busy} onClick={() => persist({ ...journey, visitedIds: [...journey.visitedIds, place.id] }, `${place.name} 방문을 완료했어요.`)}><Check size={14} aria-hidden="true" />방문 완료</button>}
              {journey && isVisited && <button className={styles.textButton} type="button" disabled={busy} onClick={() => persist({ ...journey, visitedIds: journey.visitedIds.filter(id => id !== place.id) }, "방문 체크를 되돌렸어요.")}>완료 취소</button>}
            </div>
          </div>
          {replacementFor === place.id && <div className={styles.replacementPicker}>
            <strong>{place.city}의 다른 {categoryLabels[place.category]}</strong>
            {options.length ? <div className={styles.replacementGrid}>{options.map(option => <button key={option.id} type="button" disabled={busy} onClick={() => { setReplacementFor(null); onReplace(place.id, option.id); }}><span>{option.name}</span><small>{option.address}</small></button>)}</div> : <div className={styles.noReplacement}><p>아직 불러온 같은 지역·유형의 대체 장소가 없어요.</p><button className={styles.secondary} type="button" disabled={busy} onClick={onLoadAlternatives}><RefreshCw size={14} aria-hidden="true" />대체 후보 불러오기</button></div>}
          </div>}
          {journey && <details className={styles.noteEditor}><summary>내 여행 메모 {journey.notes[place.id] ? "보기·수정" : "남기기"}</summary>
            <label className={styles.fieldLabel} htmlFor={`note-${place.id}`}>{place.name} 여행 메모</label>
            <textarea id={`note-${place.id}`} value={drafts[place.id] ?? ""} maxLength={500} disabled={busy} placeholder="기억할 장면이나 다음에 참고할 내용을 적어두세요."
              onChange={event => setDrafts({ ...drafts, [place.id]: event.target.value })} />
            <button className={styles.secondary} type="button" disabled={busy} onClick={() => persist({ ...journey, notes: { ...journey.notes, [place.id]: drafts[place.id] ?? "" } }, "여행 메모를 저장했어요.")}>메모 저장</button>
          </details>}
        </div>
      </li>;
    })}</ol>

    {error && <p className={styles.error} role="alert">{error}</p>}
    {message && <p className={styles.small} role="status">{message}</p>}
    <p className={styles.small}>방문 완료와 메모는 이 브라우저에 저장돼요. 실제 도로 상황과 출발지는 카카오맵에서 확인하세요.</p>
    {journey && next && <div className={styles.mobileDock}><div><strong>다음 · {next.name}</strong><small>{count} / {places.length}곳 방문</small></div>
      <a className={styles.primary} href={directionsUrl(next, previous)} target="_blank" rel="noopener noreferrer">카카오맵<ExternalLink size={14} aria-hidden="true" /></a></div>}
  </section>;
}
