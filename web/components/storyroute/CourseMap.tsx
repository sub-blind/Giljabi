"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { CourseRoute, Place } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export default function CourseMap({ places, route }: { places: Place[]; route: CourseRoute | null }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const available = places.map((place, index) => ({ place, index })).filter(({ place }) =>
      place.latitude !== null && place.longitude !== null && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
    setMessage(available.length < places.length ? "좌표가 없는 장소는 지도에 표시하지 않아요. 목록과 외부 지도에서 확인해주세요." : "");
    if (!available.length) { setMessage("표시할 좌표가 없어요. 외부 지도에서 장소를 확인해주세요."); return; }
    import("leaflet").then(L => {
      if (cancelled || !container.current) return;
      const current = L.map(container.current, { zoomControl: false, scrollWheelZoom: false }).setView([available[0].place.latitude!, available[0].place.longitude!], 12);
      L.control.zoom({ zoomInTitle: "지도 확대", zoomOutTitle: "지도 축소" }).addTo(current);
      map.current = current;
      let failures = 0;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
      }).on("tileerror", () => { if (++failures >= 3 && !cancelled) setMessage("지도 배경을 불러오지 못했어요. 외부 지도에서 확인해주세요."); }).addTo(current);
      const markers = available.map(({ place, index }) => {
        const icon = L.divIcon({ className: styles.marker, html: String(index + 1), iconSize: [34, 34], iconAnchor: [17, 17] });
        const label = document.createElement("span"); label.textContent = `${index + 1}. ${place.name}`;
        return L.marker([place.latitude!, place.longitude!], { icon, title: `${index + 1}. ${place.name}` }).bindPopup(label).addTo(current);
      });
      const roadSegments = route?.segments.filter(segment => segment.status === "ready" && segment.path.length > 1) ?? [];
      roadSegments.forEach(segment => L.polyline(segment.path, { color: "#245ee9", weight: 4, opacity: 0.85 }).addTo(current));
      // 경로 조회 전의 점선은 방문 순서만 나타낸다.
      if (!route && available.length === places.length && available.length > 1) {
        L.polyline(available.map(({ place }) => [place.latitude!, place.longitude!] as [number, number]),
          { color: "#245ee9", weight: 3, dashArray: "6 9", opacity: 0.65 }).addTo(current);
      }
      const bounds = L.featureGroup(markers).getBounds();
      roadSegments.forEach(segment => segment.path.forEach(point => bounds.extend(point)));
      const fitCourse = () => {
        current.invalidateSize({ pan: false });
        if (markers.length > 1) current.fitBounds(bounds, { padding: [35, 35], maxZoom: 14, animate: false });
      };
      fitCourse();
      observer = new ResizeObserver(fitCourse); observer.observe(container.current);
    }).catch(() => { if (!cancelled) setMessage("지도를 불러오지 못했어요. 외부 지도에서 확인해주세요."); });
    return () => { cancelled = true; observer?.disconnect(); map.current?.remove(); map.current = null; };
  }, [places, route]);
  return <section className={styles.mapPanel} aria-label="선택한 장소의 위치">
    <div ref={container} className={styles.map} role="region" aria-label="방문 순서 번호가 표시된 지도" />
    <p className={styles.small}>지도를 확대·축소하려면 + / − 버튼을 이용하세요.</p>
    {message && <p className={styles.warning} role="status">{message}</p>}
    <p className={styles.small}>{route ? "파란 실선은 조회된 자동차 도로 경로예요. 확인하지 못한 구간은 선을 표시하지 않아요." : "숫자와 점선은 방문 순서예요. 점선은 실제 도로 경로가 아니에요. 자동차 이동 확인을 누르면 조회된 도로 경로를 표시해요."}</p>
  </section>;
}
