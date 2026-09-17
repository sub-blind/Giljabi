import type { Place } from "./types";

function located(place: Place) {
  return place.latitude !== null && place.longitude !== null &&
    Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
}

function point(place: Place) {
  return `${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
}

// 출발지는 직전 코스 장소다. 현재 위치나 실제 이동 경로로 추정하지 않는다.
export function directionsUrl(destination: Place, origin?: Place) {
  if (!located(destination)) return `https://map.kakao.com/link/search/${encodeURIComponent(destination.name + " " + destination.address)}`;
  if (origin && located(origin)) return `https://map.kakao.com/link/from/${point(origin)}/to/${point(destination)}`;
  return `https://map.kakao.com/link/to/${point(destination)}`;
}

export function directionsLabel(destination: Place, origin?: Place) {
  if (!located(destination)) return "지도에서 장소 검색";
  return origin && located(origin) ? "이전 장소에서 길찾기" : "이 장소로 길찾기";
}
