"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Place } from "@/lib/storyroute/types";
import styles from "./StoryRoute.module.css";

export default function CourseMap({ places }: { places: Place[] }) {
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
      const current = L.map(container.current, { zoomControl: false }).setView([available[0].place.latitude!, available[0].place.longitude!], 12);
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
      if (markers.length > 1) current.fitBounds(L.featureGroup(markers).getBounds(), { padding: [35, 35], maxZoom: 14 });
      observer = new ResizeObserver(() => current.invalidateSize()); observer.observe(container.current);
    }).catch(() => { if (!cancelled) setMessage("지도를 불러오지 못했어요. 외부 지도에서 확인해주세요."); });
    return () => { cancelled = true; observer?.disconnect(); map.current?.remove(); map.current = null; };
  }, [places]);
  return <section className={styles.mapPanel} aria-label="선택한 장소의 위치">
    <div ref={container} className={styles.map} role="region" aria-label="방문 순서 번호가 표시된 지도" />
    {message && <p className={styles.warning} role="status">{message}</p>}
    <p className={styles.small}>숫자는 방문 순서예요. 실제 이동 경로와 시간은 외부 길찾기로 확인해주세요.</p>
  </section>;
}
