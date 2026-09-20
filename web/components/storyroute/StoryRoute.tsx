"use client";

import dynamic from "next/dynamic";
import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowRight, LogIn, LogOut, MapPin, Route, Shuffle, Trash2, UserRound } from "lucide-react";
import { createCourse, getCourseRoute, getRegions, getStatus, parseIntent, searchPlaces } from "@/lib/api";
import { loadCourse, saveCourse } from "@/lib/storyroute/storage";
import { categoryLabels, defaultIntent, type Connection, type Course, type CourseRoute, type Intent, type Phase, type Place, type TravelPhoto } from "@/lib/storyroute/types";
import { SearchWorkspace, type SearchMode } from "./SearchWorkspace";
import { PlaceCard } from "./PlaceCard";
import { PlaceDetailPanel, type DetailTab } from "./PlaceDetailPanel";
import { JourneyPanel } from "./JourneyPanel";
import { RoutePanel } from "./RoutePanel";
import styles from "./StoryRoute.module.css";
import { useAuth } from "@/components/auth/AuthProvider";
import { SavedCoursesDialog } from "@/components/auth/SavedCoursesDialog";
import { deleteAccountCourse, listAccountCourses, saveAccountCourse, type SavedAccountCourse } from "@/lib/accountCourses";

const CourseMap = dynamic(() => import("./CourseMap"), { ssr: false, loading: () => <p className={styles.loading}>지도를 준비하고 있어요…</p> });
interface TripState {
  phase: Phase; query: string; intent: Intent; appliedIntent: Intent | null; intentReady: boolean;
  mode: "ai" | "manual"; places: Place[]; selectedIds: string[]; course: Course | null;
  page: number; hasMore: boolean; busy: "idle" | "intent" | "search" | "course" | "restore" | "route";
}
const initial: TripState = { phase: "create", query: "", intent: defaultIntent, appliedIntent: null,
  intentReady: false, mode: "manual", places: [], selectedIds: [], course: null, page: 1, hasMore: false, busy: "idle" };
const phases: { id: Phase; label: string }[] = [{ id: "create", label: "여행 찾기" }, { id: "discover", label: "장소 담기" }, { id: "course", label: "내 코스·여행" }];

function normalize(intent: Intent): Intent {
  const keywords = Array.from(new Set(intent.keywords.map(item => item.trim()).filter(Boolean)));
  if (!intent.categories.length) throw new Error("장소 유형을 하나 이상 골라주세요.");
  if (keywords.length > 3 || keywords.some(item => item.length > 30)) throw new Error("키워드는 30자 이내로 최대 세 개까지 적어주세요.");
  return { ...intent, keywords };
}

export default function StoryRoute() {
  const auth = useAuth();
  const [state, update] = useReducer((current: TripState, patch: Partial<TripState>) => ({ ...current, ...patch }), initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notices, setNotices] = useState<string[]>([]);
  const [detail, setDetail] = useState<{ id: string; tab: DetailTab } | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [cities, setCities] = useState<{ code: string; name: string }[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [route, setRoute] = useState<CourseRoute | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("conditions");
  const [accountCourses, setAccountCourses] = useState<SavedAccountCourse[]>([]);
  const [savedCoursesOpen, setSavedCoursesOpen] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<boolean | null>(null);
  const lock = useRef(false);
  const requestId = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const busy = state.busy !== "idle";
  const activeRoute = route?.orderedPlaceIds.join(".") === state.selectedIds.join(".") ? route : null;
  const selected = state.selectedIds.map(id => state.places.find(place => place.id === id)).filter((place): place is Place => !!place);
  const scope = state.appliedIntent?.city ?? "강원도";
  const title = state.phase === "create" ? state.intent.city ? `${state.intent.city}에서 어떤 하루를 보낼까요?` : "어디로 떠나볼까요?" : state.phase === "discover" ? `${scope}에서 갈 곳을 골라보세요` : `${scope}, 나의 하루 코스`;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getStatus(controller.signal).then(value => { if (active) setConnection(value); }).catch(() => { if (active) setError("서버 연결을 확인해주세요. 직접 조건을 편집할 수 있어요."); });
    getRegions(controller.signal).then(value => { if (active) setCities(value.cities); }).catch(() => { if (active) setMessage("시·군 목록을 불러오지 못했어요. 강원도 전체로 찾거나 여행 문장에 지역을 적어주세요."); });
    try { setHasSaved(!!loadCourse()); } catch { setMessage("저장 정보를 읽지 못했어요. 새 코스를 만들 수 있어요."); }
    return () => { active = false; controller.abort(); pending.current?.abort(); lock.current = false; requestId.current += 1; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("restore") !== "1") return;
    const saveAccount = params.get("saveAccount") === "1";
    window.history.replaceState({}, "", window.location.pathname);
    setPendingRestore(saveAccount);
    // 로그인 전 저장한 코스를 로그인 완료 후 한 번만 복원한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pendingRestore === null || !auth.ready) return;
    if (pendingRestore && !auth.authenticated) { setError("로그인 상태를 확인하지 못했어요. 코스는 이 브라우저에 보관되어 있어요."); setPendingRestore(null); return; }
    const saveAccount = pendingRestore;
    setPendingRestore(null);
    requestAnimationFrame(() => void restore(saveAccount));
    // 로그인 상태가 준비된 뒤 보관한 코스를 한 번만 복원한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRestore, auth.ready, auth.authenticated]);

  useEffect(() => {
    if (!auth.authenticated) { setAccountCourses([]); setSavedCoursesOpen(false); return; }
    void listAccountCourses().then(result => setAccountCourses(result.courses)).catch(() => setError("저장한 코스 목록을 불러오지 못했어요."));
  }, [auth.authenticated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (state.phase !== "create") document.getElementById("trip-page-title")?.focus({ preventScroll: true });
  }, [state.phase]);

  async function run(kind: TripState["busy"], task: (id: number, signal: AbortSignal) => Promise<void>) {
    if (lock.current) return;
    lock.current = true; const id = ++requestId.current;
    const controller = new AbortController(); pending.current = controller;
    update({ busy: kind }); setError(""); setMessage("");
    try { await task(id, controller.signal); } catch (err) { if (id === requestId.current) setError(err instanceof Error ? err.message : "다시 시도해주세요."); }
    finally { if (id === requestId.current) { lock.current = false; update({ busy: "idle" }); } }
  }

  function pick(id: string) {
    if (busy) return;
    const exists = state.selectedIds.includes(id);
    if (!exists && state.selectedIds.length >= 3) { setMessage("최대 세 곳이에요. 먼저 한 곳을 빼거나 바꿔주세요."); return; }
    const ids = exists ? state.selectedIds.filter(value => value !== id) : [...state.selectedIds, id];
    update({ selectedIds: ids, course: null }); setMessage(`${ids.length}곳을 골랐어요.`);
  }

  function replace(id: string) {
    const pool = state.places.filter(place => !state.selectedIds.includes(place.id));
    if (!pool.length) { setMessage("현재 후보에 대안이 없어요. 다른 후보를 더 조회하거나 조건을 바꿔주세요."); return; }
    const place = pool[Math.floor(Math.random() * pool.length)];
    update({ selectedIds: state.selectedIds.map(value => value === id ? place.id : value), course: null });
    setMessage(`새 장소로 바꿨어요. ${place.name}`);
  }

  async function replaceCoursePlace(currentId: string, nextId: string) {
    if (!state.course || !state.appliedIntent || busy) return;
    const nextIds = state.course.orderedPlaces.map(place => place.id === currentId ? nextId : place.id);
    await run("course", async (id, signal) => {
      const course = await createCourse(nextIds, state.appliedIntent!, signal);
      if (id !== requestId.current) return;
      const places = [...new Map([...state.places, ...course.orderedPlaces].map(place => [place.id, place])).values()];
      let stored = true;
      try { saveCourse(nextIds, state.appliedIntent!); setHasSaved(true); }
      catch { stored = false; }
      setRoute(null);
      update({ selectedIds: nextIds, places, course });
      setNotices(course.notices);
      const changed = course.orderedPlaces.find(place => place.id === nextId);
      setMessage(stored
        ? `${changed?.name ?? "새 장소"}(으)로 교체하고 이 브라우저의 코스도 바꿨어요.`
        : `${changed?.name ?? "새 장소"}(으)로 교체했지만 브라우저에는 저장하지 못했어요. 코스 저장을 다시 눌러주세요.`);
    });
  }

  async function loadCourseAlternatives() {
    if (!state.appliedIntent || busy) return;
    await run("search", async (id, signal) => {
      const result = await searchPlaces(state.appliedIntent!, 1, signal);
      if (id !== requestId.current) return;
      const places = [...new Map([...state.places, ...result.places].map(place => [place.id, place])).values()];
      update({ places, page: result.page, hasMore: result.hasMore });
      setNotices(result.notices);
      setMessage(`${result.places.length}개 장소에서 교체할 후보를 확인했어요.`);
    });
  }

  async function search(more = false, override?: Intent) {
    let intent: Intent;
    try {
      const source = more && state.appliedIntent ? state.appliedIntent : override ?? state.intent;
      const visibleConditions = !more && !override && state.mode === "manual"
        ? { ...source, keywords: [], preferences: [], unsupportedConditions: [] }
        : source;
      intent = normalize(visibleConditions);
    }
    catch (err) { setError((err as Error).message); return; }
    await run("search", async (id, signal) => {
      const result = await searchPlaces(intent, more ? state.page + 1 : 1, signal);
      if (id !== requestId.current) return;
      if (!more) setRoute(null);
      const places = more ? [...new Map([...state.places, ...result.places].map(place => [place.id, place])).values()] : result.places;
      update({ places, intent: result.appliedIntent, appliedIntent: result.appliedIntent,
        selectedIds: more ? state.selectedIds : [], course: more ? state.course : null,
        page: result.page, hasMore: result.hasMore, phase: "discover" });
      setNotices(result.notices); setMessage(!more && state.selectedIds.length ? "새 조건으로 검색해서 이전 선택을 초기화했어요." : `${places.length}개 후보를 확인했어요.`);
    });
  }

  async function build() {
    if (!state.selectedIds.length || !state.appliedIntent) return;
    await run("course", async (id, signal) => {
      const course = await createCourse(state.selectedIds, state.appliedIntent!, signal);
      if (id !== requestId.current) return;
      setRoute(null);
      update({ course, phase: "course" }); setNotices(course.notices);
    });
  }

  function move(index: number, direction: number) {
    if (!state.course || busy) return;
    const ids = [...state.selectedIds], next = index + direction;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    setRoute(null);
    update({ selectedIds: ids, course: { ...state.course, orderedPlaces: ids.map(id => state.course!.orderedPlaces.find(place => place.id === id)!) } });
    setMessage("방문 순서를 바꿨어요.");
  }

  async function restore(saveToAccount = false) {
    let saved;
    try { saved = loadCourse(); if (!saved) { setMessage("저장한 코스가 없어요."); return; } }
    catch (err) { setError((err as Error).message); return; }
    await run("restore", async (id, signal) => {
      const course = await createCourse(saved.placeIds, saved.intent, signal);
      if (id !== requestId.current) return;
      setRoute(null);
      update({ course, phase: "course", selectedIds: saved.placeIds, places: course.orderedPlaces,
        intent: saved.intent, appliedIntent: saved.intent, intentReady: true, page: 1, hasMore: false });
      setNotices(course.notices); setMessage("저장한 코스의 실제 장소 정보를 다시 확인했어요.");
      if (saveToAccount && auth.authenticated) {
        const stored = await saveAccountCourse(courseTitle(saved.intent), saved.placeIds, saved.intent);
        setAccountCourses(current => [stored, ...current.filter(item => item.id !== stored.id)]);
        setMessage("로그인을 완료하고 코스를 내 계정에 저장했어요.");
      }
    });
  }

  function courseTitle(intent: Intent) {
    return `${intent.city ?? "강원도"} 하루 코스`;
  }

  async function openAccountCourse(saved: SavedAccountCourse) {
    setSavedCoursesOpen(false);
    await run("restore", async (id, signal) => {
      const course = await createCourse(saved.placeIds, saved.intent, signal);
      if (id !== requestId.current) return;
      setRoute(null);
      update({ course, phase: "course", selectedIds: saved.placeIds, places: course.orderedPlaces,
        intent: saved.intent, appliedIntent: saved.intent, intentReady: true, page: 1, hasMore: false });
      setNotices(course.notices); setMessage("내 계정의 코스를 다시 열었어요.");
    });
  }

  async function removeAccountCourse(saved: SavedAccountCourse) {
    setAccountBusy(true); setError("");
    try { await deleteAccountCourse(saved.id); setAccountCourses(current => current.filter(item => item.id !== saved.id)); setMessage("저장한 코스를 삭제했어요."); }
    catch (err) { setError(err instanceof Error ? err.message : "코스를 삭제하지 못했어요."); }
    finally { setAccountBusy(false); }
  }

  function save() {
    if (!state.course || !state.appliedIntent) return false;
    if (accountBusy) { setMessage("코스를 저장하고 있어요."); return false; }
    try {
      saveCourse(state.selectedIds, state.appliedIntent); setHasSaved(true);
      if (!auth.authenticated) {
        setMessage("코스를 이 브라우저에 저장했어요. 로그인하면 다른 기기에서도 코스를 열 수 있어요.");
        return true;
      }
      const duplicate = accountCourses.some(course =>
        course.placeIds.join(".") === state.selectedIds.join(".") &&
        JSON.stringify(course.intent) === JSON.stringify(state.appliedIntent));
      if (duplicate) { setMessage("이미 내 코스에 저장되어 있어요."); return true; }
      setAccountBusy(true);
      void saveAccountCourse(courseTitle(state.appliedIntent), state.selectedIds, state.appliedIntent)
        .then(stored => { setAccountCourses(current => [stored, ...current]); setMessage("내 계정에 코스를 저장했어요."); })
        .catch(err => setError(err instanceof Error ? err.message : "내 계정에 코스를 저장하지 못했어요."))
        .finally(() => setAccountBusy(false));
      setMessage("내 계정에 코스를 저장하고 있어요."); return true;
    }
    catch { setError("이 브라우저에서 저장하지 못했어요. 저장 설정과 공간을 확인해주세요."); return false; }
  }

  async function checkRoute() {
    if (!state.course || !state.appliedIntent) return;
    await run("route", async (id, signal) => {
      const result = await getCourseRoute(state.selectedIds, state.appliedIntent!, signal);
      if (id !== requestId.current) return;
      setRoute(result); setMessage("현재 방문 순서의 자동차 이동을 확인했어요.");
    });
  }

  function explore(photo: TravelPhoto) {
    const intent: Intent = { ...defaultIntent, city: photo.city, categories: ["attraction", "culture", "food"] };
    update({ intent, intentReady: true, mode: "manual", query: `${photo.city ?? "강원도"}에서 하루 여행` });
    void search(false, intent);
  }

  function addCandidate(place: Place) {
    setDetail(null);
    if (state.appliedIntent && (!state.appliedIntent.city || state.appliedIntent.city === place.city) && state.appliedIntent.categories.includes(place.category)) {
      update({ phase: "discover", places: [...new Map([...state.places, place].map(item => [item.id, item])).values()] });
      setMessage(`‘${place.name}’ 후보를 추가했어요. 살펴본 뒤 직접 담아주세요.`);
    } else {
      setSearchMode("conditions");
      update({ phase: "create", intentReady: true, mode: "manual", intent: { ...defaultIntent, city: place.city, categories: ["attraction", "culture", "food"] } });
      setMessage(`${place.city}의 장소를 찾도록 조건을 준비했어요. 새로 검색하면 이전 선택이 초기화돼요.`);
    }
  }

  function openCreate() {
    update({ phase: "create" });
    setMessage(""); setError(""); setNotices([]);
  }

  return <div className={styles.product}>
    <a className={styles.skipLink} href="#trip-main">본문으로 이동</a>
    <header className={styles.header}>
      <button className={styles.brand} type="button" onClick={openCreate} disabled={busy}><Route size={25} aria-hidden="true" />StoryRoute<span>.</span></button>
      <span className={styles.scope}><MapPin size={14} aria-hidden="true" />강원도 · 당일</span>
      {hasSaved && <button className={styles.secondary} type="button" onClick={() => void restore()} disabled={busy}>저장한 코스</button>}
      {auth.authenticated && <button className={styles.secondary} type="button" disabled={busy || accountBusy} onClick={() => setSavedCoursesOpen(true)}>내 코스 {accountCourses.length ? accountCourses.length : ""}</button>}
      <div className={styles.account}>
        {auth.authenticated ? <><span className={styles.accountName}><UserRound size={16} aria-hidden="true" />{auth.user?.nickname || "여행자"}</span>
          <button className={styles.accountButton} type="button" onClick={() => void auth.logout().catch(() => setError("로그아웃을 완료하지 못했어요."))}><LogOut size={15} aria-hidden="true" />로그아웃</button></> :
          <button className={styles.loginButton} type="button" disabled={!auth.ready} onClick={() => auth.openLogin()}><LogIn size={16} aria-hidden="true" />카카오 로그인</button>}
      </div>
    </header>
    <main className={styles.main} id="trip-main">
      <nav className={styles.steps} aria-label="여행 만들기 단계">{phases.map((phase, index) => <button type="button" key={phase.id}
        aria-current={state.phase === phase.id ? "step" : undefined} disabled={busy || (phase.id === "discover" && !state.appliedIntent) || (phase.id === "course" && !state.selectedIds.length)}
        onClick={() => { if (phase.id === "course") { if (state.course) update({ phase: "course" }); else void build(); } else if (phase.id === "create") openCreate(); else update({ phase: phase.id }); }}><span>{index + 1}</span>{phase.label}</button>)}</nav>
      {connection?.testing && <p className={styles.warning}>기능 검증용 테스트 데이터예요. 실제 관광 장소가 아니에요.</p>}
      {connection && !connection.tourismReady && <p className={styles.warning}>관광 데이터 연결을 준비 중이에요. 지금은 여행 조건을 입력하고 수정할 수 있어요.</p>}
      {auth.error && <p className={styles.warning}>{auth.error}</p>}
      <div className={styles.status} role="status" aria-live="polite">{message || (busy ? "요청을 처리하고 있어요…" : "")}</div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {notices.map((item, index) => <p key={index} className={styles.notice}>{item}</p>)}

      {state.phase === "create" ? <>
        <section className={styles.hero}><p className={styles.eyebrow}>강원도에서 보내는 하루</p><h1>{title}</h1>
          <p className={styles.heroText}>마음에 드는 곳을 최대 세 곳 담아, 나만의 여행을 이어가세요.</p></section>
        <SearchWorkspace mode={searchMode} onMode={setSearchMode} query={state.query} onQuery={query => update({ query })}
          intent={state.intent} intentMode={state.mode} onIntent={intent => update({ intent })} cities={cities}
          busy={busy} parsing={state.busy === "intent"} aiReady={connection ? connection.aiReady : null} photosReady={!!connection?.photosReady}
          hasSelection={!!state.selectedIds.length} onSearch={() => void search()} onPhoto={explore}
          onCity={city => {
            update({ intent: { ...state.intent, city, keywords: [], preferences: [], unsupportedConditions: [] }, mode: "manual", intentReady: true });
            setMessage(`선택한 여행 지역: ${city ?? "강원도 전체"}`); setError("");
            requestAnimationFrame(() => document.getElementById("intent-title")?.focus({ preventScroll: false }));
          }}
          onParse={() => {
            if (!state.query.trim()) { setError("원하는 여행을 한 문장으로 적어주세요."); return; }
            void run("intent", async (id, signal) => {
              const result = await parseIntent(state.query.trim(), signal); if (id !== requestId.current) return;
              update({ intent: result.intent, mode: result.mode, intentReady: true }); setNotices(result.notices); setSearchMode("conditions");
              requestAnimationFrame(() => document.getElementById("intent-title")?.focus());
            });
          }} />
      </> : state.phase === "discover" ? <>
        <div className={styles.pageHeading}><div><p className={styles.eyebrow}>내가 고르는 작은 여행</p><h1 id="trip-page-title" tabIndex={-1}>{title}</h1><p className={styles.muted}>{scope} · 당일 · {state.appliedIntent?.categories.map(item => categoryLabels[item]).join(" / ")}{state.appliedIntent?.keywords.length ? " · " + state.appliedIntent.keywords.join(", ") : ""}</p></div>
          <button className={styles.secondary} type="button" disabled={busy} onClick={() => { setSearchMode("conditions"); update({ phase: "create", intentReady: true }); }}>조건 수정</button></div>
        <div className={styles.resultsLayout}><section aria-label="조회된 장소 후보">
          <div className={styles.placeGrid}>{state.places.map(place => <PlaceCard key={place.id} place={place} selected={state.selectedIds.includes(place.id)} busy={busy} onPick={() => pick(place.id)} onDetail={() => setDetail({ id: place.id, tab: "intro" })} />)}</div>
          {!state.places.length && <div className={styles.empty}><h2>담을 장소를 찾지 못했어요</h2><p>다른 지역이나 장소 유형을 골라보세요.</p><button className={styles.teal} type="button" onClick={() => update({ phase: "create" })}>조건 바꾸기</button></div>}
          {state.hasMore && <button className={`${styles.secondary} ${styles.full}`} type="button" disabled={busy} onClick={() => void search(true)}>다른 후보 더 보기</button>}
        </section><aside className={`${styles.panel} ${styles.selectionTray}`} aria-label="선택한 장소"><div className={styles.row}><h2>나의 하루</h2><span className={styles.tag}>{selected.length} / 3곳</span></div>
          {selected.map((place, index) => <div className={styles.selectedStop} key={place.id}><strong>{index + 1}. {place.name}</strong><div className={styles.stopActions}>
            <button className={styles.textButton} type="button" disabled={busy} onClick={() => replace(place.id)} aria-label={`${place.name} 다른 장소로 바꾸기`}><Shuffle size={14} aria-hidden="true" />다른 장소</button>
            <button className={styles.textButton} type="button" disabled={busy} onClick={() => pick(place.id)} aria-label={`${place.name} 빼기`}><Trash2 size={14} aria-hidden="true" />빼기</button></div></div>)}
          {!selected.length && <p className={styles.emptySelection}>마음에 드는 장소를 담아보세요.</p>}
          <p className={styles.small}>한두 곳으로도 출발할 수 있어요.<br />다른 장소는 현재 조회된 후보 안에서 뽑아요.</p>
          <button className={`${styles.primary} ${styles.full}`} type="button" disabled={busy || !selected.length} onClick={() => void build()}>{state.busy === "course" ? "실제 장소와 근거 확인 중…" : "내 하루 코스 만들기 →"}</button>
        </aside></div>
      </> : state.course ? <>
        <div className={styles.pageHeading}><div><p className={styles.eyebrow}>계획에서 출발까지</p><h1 id="trip-page-title" tabIndex={-1}>{title}</h1><p className={styles.muted}>다음 장소, 길찾기, 현장 정보와 방문 기록을 한 화면에서 이어가세요.</p></div><button className={styles.secondary} type="button" disabled={busy} onClick={() => update({ phase: "discover" })}>장소 편집</button></div>
        <JourneyPanel places={state.course.orderedPlaces} candidates={state.places} route={activeRoute}
          routeReady={!!connection?.routeReady} routeBusy={state.busy === "route"} busy={busy}
          onSaveCourse={save} onCheckRoute={() => void checkRoute()} onMove={move}
          onDetail={(id, tab = "intro") => setDetail({ id, tab })} onReplace={(currentId, nextId) => void replaceCoursePlace(currentId, nextId)}
          onLoadAlternatives={() => void loadCourseAlternatives()} />
        <div className={styles.tripSupportGrid}>
          <RoutePanel route={activeRoute} places={state.course.orderedPlaces} ready={!!connection?.routeReady} busy={busy} loading={state.busy === "route"} onLoad={() => void checkRoute()} />
          <CourseMap places={state.course.orderedPlaces} route={activeRoute} />
        </div>
      </> : null}
      {state.phase === "discover" && !!selected.length && <div className={styles.mobileDock}><div><strong>{selected.length}곳 담았어요</strong><small>방문 순서와 길찾기를 확인하세요</small></div>
        <button className={styles.primary} type="button" disabled={busy} onClick={() => void build()}>{state.busy === "course" ? "확인 중…" : "코스 준비"}<ArrowRight size={16} aria-hidden="true" /></button></div>}
    </main>
    <footer className={styles.footer}><strong>StoryRoute.</strong><span>당신의 순서로 만드는 하루</span><small>관광 콘텐츠 출처: ⓒ한국관광공사 · 지도: © OpenStreetMap contributors</small></footer>
    {detail && <PlaceDetailPanel key={`${detail.id}-${detail.tab}`} id={detail.id} initialTab={detail.tab} onClose={() => setDetail(null)} onCandidate={addCandidate} />}
    {savedCoursesOpen && <SavedCoursesDialog courses={accountCourses} busy={accountBusy || busy} onClose={() => setSavedCoursesOpen(false)} onOpen={saved => void openAccountCourse(saved)} onDelete={saved => void removeAccountCourse(saved)} />}
  </div>;
}
