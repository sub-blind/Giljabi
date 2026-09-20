"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowUpRight, MapPinned } from "lucide-react";
import { gangwonMapRegions, gangwonMapViewBox } from "@/data/gangwonMap";
import styles from "./StoryRoute.module.css";

const regionColors = ["#dce9df", "#d4e5dc", "#e3ebd8", "#cfe1dc", "#dce7d2"];
const labelOverrides: Record<string, { x: number; y: number }> = {
  "속초시": { x: 389, y: 136 },
  "양양군": { x: 405, y: 181 },
  "태백시": { x: 429, y: 393 },
  "삼척시": { x: 510, y: 346 },
};

export function GangwonRegionMap({ selectedCity, busy, hasSelection, onSelect }: {
  selectedCity: string | null;
  busy: boolean;
  hasSelection: boolean;
  onSelect: (city: string | null) => void;
}) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const previewCity = hoveredCity ?? selectedCity;
  const previewing = hoveredCity !== null && hoveredCity !== selectedCity;
  const activate = (city: string | null) => {
    if (!busy) onSelect(city);
  };
  const onKeyDown = (event: KeyboardEvent<SVGGElement>, city: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activate(city);
  };

  return <section className={styles.regionExplorer} aria-labelledby="gangwon-map-title">
    <div className={styles.regionCopy}>
      <span className={styles.regionKicker}><MapPinned size={16} aria-hidden="true" />{previewing ? "지도에서 살펴보는 중" : selectedCity ? "선택한 여행 지역" : "강원 18개 시·군"}</span>
      <h2 id="gangwon-map-title">{previewCity ? previewing ? previewCity : `${previewCity}에서 시작할까요?` : "지도에서 오늘의 지역을 골라보세요"}</h2>
      <p>{previewing ? "클릭하면 이 지역을 여행 조건에 반영해요." : selectedCity ? "아래에서 장소 유형을 고르면 실제 여행 후보를 찾아요." : "도시 이름을 누른 뒤 원하는 장소 유형을 골라보세요."}</p>
      <button className={styles.regionAllButton} type="button" disabled={busy} aria-pressed={!selectedCity} onClick={() => activate(null)}>강원도 전체로 찾기</button>
      <div className={styles.regionLegend} aria-hidden="true">
        <span><i />지역 위에 마우스를 올려보세요</span>
        <span><i />선택하면 여행 조건에 반영돼요</span>
      </div>
      {selectedCity && <p className={styles.currentRegion}>선택한 여행 지역 <strong>{selectedCity}</strong></p>}
    </div>

    <div className={styles.mapStage}>
      <div className={styles.mapGlow} aria-hidden="true" />
      <svg className={styles.gangwonMap} viewBox={gangwonMapViewBox} role="group" aria-label="강원특별자치도 18개 시군 선택 지도">
        <defs>
          <filter id="map-soft-shadow" x="-25%" y="-25%" width="150%" height="170%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#173c42" floodOpacity=".18" />
          </filter>
        </defs>
        <g className={styles.mapObject} filter="url(#map-soft-shadow)">
          {gangwonMapRegions.map((region, index) => {
            const active = selectedCity === region.name;
            const customStyle = { "--region-fill": regionColors[index % regionColors.length] } as CSSProperties;
            return <g key={region.code} className={`${styles.mapRegion} ${active ? styles.mapRegionActive : ""}`}
              style={customStyle} role="button" tabIndex={busy ? -1 : 0} aria-disabled={busy}
              aria-label={`${region.name} 관광지 찾기`} onClick={() => activate(region.name)}
              onMouseEnter={() => setHoveredCity(region.name)} onMouseLeave={() => setHoveredCity(null)}
              onFocus={() => setHoveredCity(region.name)} onBlur={() => setHoveredCity(null)}
              onKeyDown={event => onKeyDown(event, region.name)}>
              <path className={styles.regionDepth} d={region.path} aria-hidden="true" />
              <path className={styles.regionSurface} d={region.path} />
            </g>;
          })}
          <g className={styles.mapLabels} aria-hidden="true">
            {gangwonMapRegions.map(region => {
              const label = labelOverrides[region.name] ?? { x: region.labelX, y: region.labelY };
              return <g key={`${region.code}-label`}>
                {labelOverrides[region.name] && <line className={styles.regionLeader} x1={region.labelX} y1={region.labelY} x2={label.x} y2={label.y} />}
                <text className={`${styles.regionLabel} ${previewCity === region.name ? styles.regionLabelActive : ""}`}
                  x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">{region.name}</text>
              </g>;
            })}
          </g>
        </g>
      </svg>
      <span className={styles.eastSeaLabel} aria-hidden="true">동해</span>
      <p className={styles.mapHint}><ArrowUpRight size={14} aria-hidden="true" />지역을 누르고 조건을 골라요</p>
    </div>

    <div className={styles.mobileRegionGrid} aria-label="강원도 시군 목록">
      {gangwonMapRegions.map(region => <button key={region.code} type="button" disabled={busy}
        className={selectedCity === region.name ? styles.mobileRegionActive : undefined}
        onClick={() => activate(region.name)}>{region.name}</button>)}
    </div>
    {hasSelection && <p className={styles.selectionNotice}>다른 지역을 검색하면 담아둔 장소가 초기화돼요. 검색이 실패하면 이전 결과를 유지해요.</p>}
    <p className={styles.mapAttribution}>행정경계: 통계청 SGIS·행정안전부, 가공 vuski/admdongkor · CC BY 4.0</p>
  </section>;
}
