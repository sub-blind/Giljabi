"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAuthSession, fetchPlacesByArea, getKakaoLoginUrl, logout, type SessionUser } from "@/lib/api";
import type { TourItem } from "@/lib/tour";
import { itemImage, itemTitle } from "@/lib/tour";

type ScreenState = "home" | "explore" | "detail" | "planner";

const GANGWON_AREA_CODE = 32;
const KAKAO_LOGIN_URL = getKakaoLoginUrl();

const SAMPLE_QUERIES = [
  "부모님과 걷기 편한 강원 1박 2일 코스",
  "친구와 사진 찍기 좋은 바다 여행",
  "혼자 가볍게 다녀올 조용한 강원 여행",
];

const QUICK_TAGS = ["가족 여행", "커플 여행", "비 오는 날", "자연 풍경", "당일치기"];

const PLANNER_STEPS = [
  {
    title: "아침",
    description: "이동이 무리되지 않는 곳부터 시작해요.",
  },
  {
    title: "점심 이후",
    description: "풍경과 식사를 함께 즐길 수 있는 장소를 배치해요.",
  },
  {
    title: "저녁",
    description: "숙소 이동 전 들르기 좋은 마무리 코스를 제안해요.",
  },
];

function parseScreen(value: unknown): ScreenState | null {
  if (value === "home" || value === "explore" || value === "detail" || value === "planner") {
    return value;
  }
  return null;
}

function primaryButton(className = "") {
  return `inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sr-primary to-sr-cyan px-5 py-3 font-semibold text-white shadow-glow transition hover:opacity-95 ${className}`;
}

function secondaryButton(className = "") {
  return `inline-flex items-center justify-center rounded-2xl border border-sr-line2 bg-white px-5 py-3 font-semibold text-sr-text transition hover:bg-sr-surface ${className}`;
}

function formatPlaceSummary(place: TourItem): string {
  return (
    place.overview?.trim() ||
    place.desc?.trim() ||
    place.addr1?.trim() ||
    "편하게 둘러볼 수 있는 관광지입니다."
  );
}

export default function GangwonTravelPlanner() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("home");
  const [places, setPlaces] = useState<TourItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<TourItem | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState(SAMPLE_QUERIES[0]);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const historyInit = useRef(false);

  const topPlaces = useMemo(() => places.slice(0, 6), [places]);
  const plannerPlaces = useMemo(() => places.slice(0, 3), [places]);

  const pushScreen = useCallback((screen: ScreenState) => {
    setCurrentScreen(screen);
    if (typeof window === "undefined") return;
    window.history.pushState({ screen }, "", `#${screen}`);
  }, []);

  const syncSession = useCallback(async () => {
    setCheckingSession(true);
    try {
      const session = await fetchAuthSession();
      setSessionUser(session.authenticated ? session.user ?? null : null);
    } catch {
      setSessionUser(null);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setSessionUser(null);
      pushScreen("home");
    } catch {
      // Keep the current UI stable for the prototype if logout fails.
    }
  }, [pushScreen]);

  const openDetail = useCallback(
    (place: TourItem) => {
      setSelectedPlace(place);
      pushScreen("detail");
    },
    [pushScreen],
  );

  const loadPlaces = useCallback(async () => {
    setLoadingPlaces(true);
    setLoadError(null);
    try {
      const { items } = await fetchPlacesByArea({
        areaCode: GANGWON_AREA_CODE,
        pageNo: 1,
        numOfRows: 12,
      });
      setPlaces(items);
      setSelectedPlace((current) => current ?? items[0] ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "관광지 목록을 불러오지 못했습니다.");
      setPlaces([]);
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!historyInit.current) {
      historyInit.current = true;
      if (window.history.state == null) {
        window.history.replaceState({ screen: "home" }, "", window.location.pathname);
      }
    }
    const onPopState = (event: PopStateEvent) => {
      const nextScreen = parseScreen(event.state?.screen);
      setCurrentScreen(nextScreen ?? "home");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    void loadPlaces();
    void syncSession();
  }, [loadPlaces, syncSession]);

  const selectedImage = selectedPlace ? itemImage(selectedPlace) : null;
  const isLoggedIn = Boolean(sessionUser);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-sr-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <button type="button" onClick={() => pushScreen("home")} className="text-left">
            <div className="text-lg font-bold text-sr-text">StoryRoute AI</div>
            <div className="text-sm text-sr-muted">누구나 쉽게 쓰는 여행 웹앱</div>
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {[
              ["home", "홈"],
              ["explore", "여행 찾기"],
              ["planner", "일정 초안"],
            ].map(([screen, label]) => (
              <button
                key={screen}
                type="button"
                onClick={() => pushScreen(screen as ScreenState)}
                className={
                  currentScreen === screen
                    ? "rounded-full bg-sr-text px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full px-4 py-2 text-sm font-semibold text-sr-muted hover:bg-sr-surface"
                }
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {checkingSession ? (
              <span className="text-sm text-sr-muted">확인 중...</span>
            ) : isLoggedIn ? (
              <>
                <div className="hidden text-right md:block">
                  <div className="text-sm font-semibold text-sr-text">{sessionUser?.nickname || "로그인 사용자"}</div>
                  <div className="text-xs text-sr-muted">{sessionUser?.email || "카카오 로그인 완료"}</div>
                </div>
                <button type="button" onClick={handleLogout} className={secondaryButton("text-sm")}>
                  로그아웃
                </button>
              </>
            ) : (
              <a href={KAKAO_LOGIN_URL} className={primaryButton("text-sm")}>
                카카오로 시작하기
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {currentScreen === "home" && (
          <section className="space-y-8">
            <div className="grid gap-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-sr-dark via-[#0b1835] to-sr-navy p-6 text-white shadow-sr-dark md:grid-cols-[1.15fr_.85fr] md:p-10">
              <div>
                <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
                  여행 검색, 장소 탐색, 일정 초안을 한 번에
                </div>
                <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                  연령대와 여행 스타일에 상관없이
                  <span className="block bg-gradient-to-r from-[#b8a8ff] to-sr-cyan bg-clip-text text-transparent">
                    쉽게 시작하는 여행 추천 서비스
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
                  복잡한 필터보다 쉬운 문장으로 시작하고, 카카오 로그인 후에는 저장과 다시 보기까지 자연스럽게 이어지는 흐름을
                  목표로 정리했습니다.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => pushScreen("explore")} className={primaryButton()}>
                    여행지 둘러보기
                  </button>
                  <button type="button" onClick={() => pushScreen("planner")} className={secondaryButton()}>
                    일정 초안 보기
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {QUICK_TAGS.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white/90">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm font-semibold text-white/70">이런 식으로 시작해요</div>
                <div className="mt-3 rounded-2xl bg-white px-4 py-4 text-base font-medium text-sr-text shadow-sm">
                  {activeQuery}
                </div>
                <div className="mt-4 grid gap-2">
                  {SAMPLE_QUERIES.map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => setActiveQuery(query)}
                      className={
                        activeQuery === query
                          ? "rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-left text-sm font-semibold text-white"
                          : "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80"
                      }
                    >
                      {query}
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-[#091528] px-4 py-4">
                  <div className="text-sm font-semibold">회원 흐름</div>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    {isLoggedIn
                      ? `${sessionUser?.nickname || "사용자"}님은 로그인된 상태입니다. 이제 일정 저장과 최근 본 장소 기능을 붙이기 좋습니다.`
                      : "로그인 후에는 저장한 일정, 최근 본 여행지, 다시 보기 기능으로 자연스럽게 이어질 수 있습니다."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["쉬운 시작", "검색창 하나로 여행을 시작하고, 어려운 설정은 뒤로 미룹니다."],
                ["전연령 사용성", "글자 크기 토글 대신 대비와 간격, 명확한 버튼 구조를 기본으로 잡았습니다."],
                ["안전한 로그인 흐름", "카카오 인증 뒤 우리 서버 쿠키 세션으로 이어져 브라우저에 민감 토큰을 직접 노출하지 않습니다."],
              ].map(([title, body]) => (
                <article key={title} className="rounded-[28px] border border-sr-line bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-sr-text">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-sr-muted md:text-base">{body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {currentScreen === "explore" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-semibold text-sr-primary">Explore</div>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-sr-text">강원 여행지를 편하게 비교해보세요</h2>
                <p className="mt-2 text-base text-sr-muted">
                  부담 없는 설명과 명확한 카드 구조로 누구나 빠르게 탐색할 수 있게 구성했습니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <span key={tag} className="rounded-full border border-sr-line bg-white px-3 py-2 text-sm text-sr-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {loadingPlaces && (
              <div className="rounded-[24px] border border-sr-line bg-white px-5 py-4 text-sm text-sr-muted">
                관광지 목록을 불러오는 중입니다.
              </div>
            )}

            {loadError && (
              <div className="rounded-[24px] border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                {loadError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topPlaces.map((place, index) => (
                <article key={`${place.contentid ?? index}`} className="overflow-hidden rounded-[28px] border border-sr-line bg-white shadow-sm">
                  <div className="h-52 bg-sr-surface">
                    {itemImage(place) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={itemImage(place) ?? ""} alt={itemTitle(place)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-sr-surface2 to-white text-sm text-sr-muted">
                        이미지 준비중
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-sr-text">{itemTitle(place)}</h3>
                        <p className="mt-1 text-sm text-sr-muted">{place.addr1 || "강원 지역 관광지"}</p>
                      </div>
                      <span className="rounded-full bg-sr-surface px-3 py-1 text-xs font-semibold text-sr-primary">
                        추천 {92 - index}%
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-sr-muted">{formatPlaceSummary(place)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-sr-surface2 px-3 py-1 text-xs text-sr-muted">이동 부담 낮음</span>
                      <span className="rounded-full bg-sr-surface2 px-3 py-1 text-xs text-sr-muted">풍경 추천</span>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button type="button" onClick={() => openDetail(place)} className={primaryButton("flex-1 text-sm")}>
                        자세히 보기
                      </button>
                      <button type="button" onClick={() => pushScreen("planner")} className={secondaryButton("text-sm")}>
                        일정 담기
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {currentScreen === "detail" && (
          <section className="space-y-6">
            <button type="button" onClick={() => pushScreen("explore")} className="text-sm font-semibold text-sr-primary">
              여행지 목록으로 돌아가기
            </button>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <article className="overflow-hidden rounded-[32px] border border-sr-line bg-white shadow-sm">
                <div className="h-72 bg-sr-surface">
                  {selectedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedImage} alt={selectedPlace ? itemTitle(selectedPlace) : "여행지"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-sr-surface2 to-white text-sr-muted">
                      대표 이미지 준비중
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <div className="text-sm font-semibold text-sr-primary">Place Detail</div>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-sr-text">
                    {selectedPlace ? itemTitle(selectedPlace) : "여행지를 선택해주세요"}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-sr-muted">
                    {selectedPlace ? formatPlaceSummary(selectedPlace) : "검색 화면에서 여행지를 고르면 상세 내용을 볼 수 있습니다."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-sr-surface px-3 py-2 text-sm text-sr-muted">
                      {selectedPlace?.addr1 || "강원 지역"}
                    </span>
                    <span className="rounded-full bg-sr-surface px-3 py-2 text-sm text-sr-muted">가족과 함께 보기 좋음</span>
                    <span className="rounded-full bg-sr-surface px-3 py-2 text-sm text-sr-muted">초보 여행자 친화적</span>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={() => pushScreen("planner")} className={primaryButton()}>
                      이 여행지로 일정 만들기
                    </button>
                    {isLoggedIn ? (
                      <button type="button" className={secondaryButton()}>
                        저장 기능 다음 단계
                      </button>
                    ) : (
                      <a href={KAKAO_LOGIN_URL} className={secondaryButton()}>
                        카카오 로그인 후 저장
                      </a>
                    )}
                  </div>
                </div>
              </article>

              <aside className="space-y-4">
                <div className="rounded-[28px] border border-sr-line bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-sr-text">왜 이 장소를 추천하나요?</h3>
                  <p className="mt-3 text-sm leading-6 text-sr-muted">
                    검색 의도를 바로 이해하기 어려운 사용자를 위해, 추천 이유를 태그와 짧은 문장으로 보여주는 쪽이 좋습니다.
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-sr-muted">
                    <div className="rounded-2xl bg-sr-surface px-4 py-3">이동이 비교적 편해 처음 쓰는 사람도 고르기 쉽습니다.</div>
                    <div className="rounded-2xl bg-sr-surface px-4 py-3">풍경 감상과 휴식 목적에 잘 맞는 장소입니다.</div>
                    <div className="rounded-2xl bg-sr-surface px-4 py-3">주변 코스와 연결하기 좋은 출발점입니다.</div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-sr-line bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-sr-text">회원 기능 아이디어</h3>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-sr-muted">
                    <li>카카오 로그인 후 일정 저장</li>
                    <li>최근 본 여행지 다시 보기</li>
                    <li>좋아요한 장소 모아보기</li>
                  </ul>
                </div>
              </aside>
            </div>
          </section>
        )}

        {currentScreen === "planner" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-semibold text-sr-primary">Planner</div>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-sr-text">간단한 일정 초안으로 바로 이어가기</h2>
                <p className="mt-2 text-base text-sr-muted">
                  복잡한 편집보다 이해하기 쉬운 일정 흐름을 우선 보여주고, 저장과 공유는 로그인 이후로 연결합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <button type="button" className={primaryButton("text-sm")}>
                    로그인된 상태로 저장 준비
                  </button>
                ) : (
                  <a href={KAKAO_LOGIN_URL} className={primaryButton("text-sm")}>
                    카카오 로그인 후 저장
                  </a>
                )}
                <button type="button" onClick={() => pushScreen("explore")} className={secondaryButton("text-sm")}>
                  여행지 더 보기
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
              <div className="rounded-[28px] border border-sr-line bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-sr-text">입력 정보 예시</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["강원", "1박 2일", "가족", "걷기 편함", "풍경 중심"].map((tag) => (
                    <span key={tag} className="rounded-full bg-sr-surface px-3 py-2 text-sm text-sr-muted">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  {PLANNER_STEPS.map((step) => (
                    <div key={step.title} className="rounded-2xl border border-sr-line bg-sr-surface px-4 py-4">
                      <div className="text-sm font-semibold text-sr-primary">{step.title}</div>
                      <p className="mt-2 text-sm leading-6 text-sr-muted">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-sr-line bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-sr-text">일정 초안</h3>
                  <span className="rounded-full bg-sr-surface px-3 py-1 text-sm text-sr-muted">DAY 1</span>
                </div>
                <div className="mt-5 space-y-4">
                  {plannerPlaces.map((place, index) => (
                    <div key={`${place.contentid ?? index}-plan`} className="rounded-2xl border border-sr-line px-4 py-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sr-surface2 text-sm font-bold text-sr-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-bold text-sr-text">{itemTitle(place)}</h4>
                            <span className="rounded-full bg-sr-surface px-3 py-1 text-xs text-sr-muted">약 60분</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-sr-muted">{formatPlaceSummary(place)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!plannerPlaces.length && !loadingPlaces && (
                    <div className="rounded-2xl border border-sr-line bg-sr-surface px-4 py-6 text-sm text-sr-muted">
                      아직 일정에 넣을 장소가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-4 left-4 right-4 z-30 rounded-[24px] border border-sr-line bg-white/95 p-2 shadow-sr backdrop-blur md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["home", "홈"],
            ["explore", "탐색"],
            ["planner", "일정"],
          ].map(([screen, label]) => (
            <button
              key={screen}
              type="button"
              onClick={() => pushScreen(screen as ScreenState)}
              className={
                currentScreen === screen
                  ? "rounded-2xl bg-sr-text px-3 py-3 text-sm font-semibold text-white"
                  : "rounded-2xl px-3 py-3 text-sm font-semibold text-sr-muted"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
