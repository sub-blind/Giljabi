export interface Journey {
  version: 1;
  placeIds: string[];
  startedAt: string;
  visitedIds: string[];
  notes: Record<string, string>;
}

function key(ids: string[]) {
  return "storyroute.journey.v1:" + [...ids].sort().join(".");
}

export function loadJourney(placeIds: string[]): Journey | null {
  const raw = localStorage.getItem(key(placeIds));
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (value.version !== 1 || !Array.isArray(value.placeIds) || value.placeIds.length !== placeIds.length ||
    new Set(value.placeIds).size !== placeIds.length || !value.placeIds.every((id: unknown) => typeof id === "string" && placeIds.includes(id)) ||
    typeof value.startedAt !== "string" || !Number.isFinite(Date.parse(value.startedAt)) ||
    !Array.isArray(value.visitedIds) || new Set(value.visitedIds).size !== value.visitedIds.length ||
    !value.visitedIds.every((id: unknown) => typeof id === "string" && placeIds.includes(id)) ||
    !value.notes || typeof value.notes !== "object" || Array.isArray(value.notes) ||
    !Object.entries(value.notes).every(([id, note]) => placeIds.includes(id) && typeof note === "string" && note.length <= 500)) {
    throw new Error("여행 기록을 읽지 못했어요. 코스는 그대로 확인할 수 있어요.");
  }
  return value;
}

export function saveJourney(value: Journey) {
  localStorage.setItem(key(value.placeIds), JSON.stringify(value));
}
