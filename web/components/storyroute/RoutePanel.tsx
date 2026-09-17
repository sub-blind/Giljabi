import { Car, RefreshCw } from "lucide-react";
import type { CourseRoute, Place } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export function RoutePanel({ route, places, busy, loading, ready, onLoad }: {
  route: CourseRoute | null; places: Place[]; busy: boolean; loading: boolean; ready: boolean; onLoad: () => void;
}) {
  return <section className={styles.routePanel} aria-labelledby="route-heading">
    <div className={styles.row}><div><p className={styles.eyebrow}>장소 사이의 이동</p><h2 id="route-heading"><Car size={20} aria-hidden="true" />자동차로 얼마나 걸릴까요?</h2></div>
      <button className={styles.secondary} type="button" disabled={busy || !ready || places.length < 2} onClick={onLoad}><RefreshCw size={15} aria-hidden="true" />{loading ? "경로 확인 중…" : route ? "이동정보 새로 확인" : "자동차 이동 확인"}</button></div>
    {places.length < 2 ? <p className={styles.small}>한 장소 코스에는 장소 사이의 이동 구간이 없어요. 첫 장소까지는 길찾기로 확인하세요.</p> : !ready ?
      <p className={styles.small}>자동차 경로 연결을 준비 중이에요. 장소별 카카오맵 길찾기는 사용할 수 있어요.</p> : !route ?
      <p className={styles.muted}>현재 방문 순서의 예상 시간·거리와 실제 도로 경로를 확인하세요. 순서를 바꾸면 다시 확인해야 해요.</p> : <>
      {route.totalDurationSeconds !== null && route.totalDistanceMeters !== null && <div className={styles.routeTotal}><strong>장소 간 예상 이동 {Math.ceil(route.totalDurationSeconds / 60)}분</strong><span>{(route.totalDistanceMeters / 1000).toFixed(1)}km</span></div>}
      <ol className={styles.routeLegs}>{route.segments.map(segment => <li key={segment.originId + segment.destinationId}>
        <span>{places.find(place => place.id === segment.originId)?.name} → {places.find(place => place.id === segment.destinationId)?.name}</span>
        {segment.status === "ready" ? <strong>약 {Math.ceil(segment.durationSeconds! / 60)}분 · {(segment.distanceMeters! / 1000).toFixed(1)}km</strong> : <p className={styles.small}>{segment.notice}</p>}
      </li>)}</ol>
      {route.notices.map(notice => <p className={styles.small} key={notice}>{notice}</p>)}
      <p className={styles.small}>출처: 카카오모빌리티 · 구간 조회 {new Date(route.segments[0]?.retrievedAt ?? route.retrievedAt).toLocaleString("ko-KR")}{route.segments.length > 1 ? "부터" : ""} · 2분 이내 같은 구간 조회는 이전 응답을 사용해요.</p>
    </>}
  </section>;
}
